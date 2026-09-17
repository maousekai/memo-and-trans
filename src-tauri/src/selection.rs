use std::time::Duration;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[cfg(target_os = "windows")]
fn send_copy_shortcut() {
    #[link(name = "user32")]
    extern "system" {
        fn keybd_event(b_vk: u8, b_scan: u8, dw_flags: u32, dw_extra_info: usize);
    }

    const VK_CONTROL: u8 = 0x11;
    const VK_C: u8 = 0x43;
    const KEYEVENTF_KEYUP: u32 = 0x0002;

    unsafe {
        keybd_event(VK_CONTROL, 0, 0, 0);
        keybd_event(VK_C, 0, 0, 0);
        keybd_event(VK_C, 0, KEYEVENTF_KEYUP, 0);
        keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
    }
}

#[cfg(target_os = "windows")]
fn clipboard_sequence() -> u32 {
    #[link(name = "user32")]
    extern "system" {
        fn GetClipboardSequenceNumber() -> u32;
    }
    unsafe { GetClipboardSequenceNumber() }
}

pub fn capture_selected_text_sync(app: &AppHandle) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let previous_text = app.clipboard().read_text().ok();
        let before = clipboard_sequence();

        // The global shortcut handler runs on key release. Give the source app a
        // moment to settle, then send Ctrl+C while it still owns focus.
        std::thread::sleep(Duration::from_millis(35));
        send_copy_shortcut();
        std::thread::sleep(Duration::from_millis(95));

        let after = clipboard_sequence();
        if after == before {
            return Ok(String::new());
        }

        let selected = app.clipboard().read_text().unwrap_or_default().trim().to_string();

        // Preserve an existing text clipboard where possible. If the previous
        // clipboard held non-text data, we intentionally leave the copied text in
        // place rather than destroying an unknown clipboard format.
        if let Some(previous) = previous_text {
            if previous != selected {
                let _ = app.clipboard().write_text(previous);
            }
        }

        if selected.chars().count() > 12_000 {
            return Ok(selected.chars().take(12_000).collect());
        }
        return Ok(selected);
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = app;
        Ok(String::new())
    }
}

#[tauri::command]
pub async fn capture_selected_text(app: AppHandle) -> Result<String, String> {
    capture_selected_text_sync(&app)
}
