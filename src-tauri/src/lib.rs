pub mod commands;
pub mod db;
pub mod security;
pub mod translation;

use tauri::{Manager, WebviewWindow};

#[cfg(target_os = "windows")]
fn apply_windows_native_frame(window: &WebviewWindow) {
    use std::ffi::c_void;

    #[link(name = "dwmapi")]
    extern "system" {
        fn DwmSetWindowAttribute(
            hwnd: isize,
            dw_attribute: u32,
            pv_attribute: *const c_void,
            cb_attribute: u32,
        ) -> i32;
    }

    const DWMWA_WINDOW_CORNER_PREFERENCE: u32 = 33;
    const DWMWCP_ROUND: u32 = 2;
    const DWMWA_BORDER_COLOR: u32 = 34;
    const DWMWA_COLOR_NONE: u32 = 0xFFFF_FFFE;

    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let corner = DWMWCP_ROUND;
            let _ = DwmSetWindowAttribute(
                hwnd.0 as isize,
                DWMWA_WINDOW_CORNER_PREFERENCE,
                &corner as *const u32 as *const c_void,
                std::mem::size_of::<u32>() as u32,
            );

            let border = DWMWA_COLOR_NONE;
            let _ = DwmSetWindowAttribute(
                hwnd.0 as isize,
                DWMWA_BORDER_COLOR,
                &border as *const u32 as *const c_void,
                std::mem::size_of::<u32>() as u32,
            );
        }
    }
}

#[cfg(target_os = "windows")]
pub(crate) fn maintain_windows_transparent_frame(window: &WebviewWindow) {
    use window_vibrancy::{clear_acrylic, clear_blur};

    // Keep the native backdrop clear and let the WebView own tint/contrast so
    // focused and unfocused states stay visually consistent.
    let _ = clear_acrylic(window);
    let _ = clear_blur(window);
    apply_windows_native_frame(window);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(|app| {
            let window: WebviewWindow = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "windows")]
            {
                use tauri::WindowEvent;

                maintain_windows_transparent_frame(&window);

                let event_window = window.clone();
                window.on_window_event(move |event| match event {
                    WindowEvent::Focused(_) | WindowEvent::Resized(_) => {
                        maintain_windows_transparent_frame(&event_window);
                    }
                    _ => {}
                });
            }

            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                let _ = apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::HudWindow,
                    None,
                    None,
                );
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_selected_text,
            commands::set_always_on_top,
            commands::set_window_size,
            commands::start_dragging,
            commands::sample_background_tone,
            commands::get_api_key_status,
            commands::save_api_key,
            commands::query_nvidia_nim,
            commands::synthesize_nvidia_tts,
            translation::get_gemini_key_status,
            translation::save_gemini_api_key,
            translation::query_gemini
        ])
        .run(tauri::generate_context!())
        .expect("error while running LexiGlass desktop application");
}
