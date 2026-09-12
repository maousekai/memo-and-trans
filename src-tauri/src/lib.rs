pub mod commands;
pub mod db;
pub mod security;

use tauri::{Manager, WebviewWindow};

#[cfg(target_os = "windows")]
pub(crate) fn apply_windows_glass(window: &WebviewWindow) {
    use window_vibrancy::{apply_acrylic, apply_blur};

    // `apply_blur` is unreliable on newer Windows 11 builds and can look
    // transparent only while the window is moving. Acrylic is the supported
    // Windows 10/11 path, so use a very light tint here and let the web layer
    // provide card contrast. Blur is only a last-resort fallback.
    if apply_acrylic(window, Some((17, 23, 31, 14))).is_err() {
        let _ = apply_blur(window, Some((17, 23, 31, 10)));
    }
}

#[cfg(target_os = "windows")]
pub(crate) fn clear_windows_glass(window: &WebviewWindow) {
    use window_vibrancy::{clear_acrylic, clear_blur};

    // Windows can replace background Acrylic with a solid fallback while the
    // app is inactive. Clearing the native material keeps the transparent
    // WebView visible instead of turning LexiGlass into an opaque dark sheet.
    let _ = clear_acrylic(window);
    let _ = clear_blur(window);
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

                // Re-apply after focus/resize transitions. On recent Windows
                // 11 builds DWM may rebuild the backdrop surface during these
                // transitions. When the app loses focus, drop the native
                // material so the transparent WebView remains visibly clear
                // instead of accepting Windows' opaque inactive fallback.
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
