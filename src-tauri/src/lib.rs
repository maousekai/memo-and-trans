pub mod commands;
pub mod db;
pub mod security;

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

    // Windows 11 native corner + border attributes. Acrylic is applied to the
    // whole HWND, so CSS border-radius alone cannot hide the square backdrop
    // corners. Asking DWM to round the HWND clips the native material too.
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
pub(crate) fn apply_windows_glass(window: &WebviewWindow) {
    use window_vibrancy::{apply_acrylic, apply_blur};

    // Keep the native frame rounded every time DWM recreates the composition
    // surface during focus, resize or drag transitions.
    apply_windows_native_frame(window);

    // Acrylic is the supported Windows 10/11 path. Keep the tint very light so
    // the web layer controls readability without turning the app into fog.
    if apply_acrylic(window, Some((17, 23, 31, 14))).is_err() {
        let _ = apply_blur(window, Some((17, 23, 31, 10)));
    }
}

#[cfg(target_os = "windows")]
pub(crate) fn clear_windows_glass(window: &WebviewWindow) {
    use window_vibrancy::{clear_acrylic, clear_blur};

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

                apply_windows_glass(&window);

                let event_window = window.clone();
                window.on_window_event(move |event| match event {
                    WindowEvent::Focused(true) | WindowEvent::Resized(_) => {
                        apply_windows_glass(&event_window);
                    }
                    WindowEvent::Focused(false) => {
                        clear_windows_glass(&event_window);
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
            commands::get_api_key_status,
            commands::save_api_key,
            commands::query_nvidia_nim,
            commands::synthesize_nvidia_tts
        ])
        .run(tauri::generate_context!())
        .expect("error while running LexiGlass desktop application");
}
