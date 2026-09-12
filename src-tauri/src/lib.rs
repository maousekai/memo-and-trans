pub mod commands;
pub mod db;
pub mod security;

use tauri::{Manager, WebviewWindow};

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
                use window_vibrancy::{apply_acrylic, apply_blur};

                // Keep the native material genuinely translucent. The previous
                // alpha was dense enough to turn Acrylic into a grey fog once
                // the WebView painted its own glass layer on top.
                if apply_acrylic(&window, Some((16, 19, 22, 44))).is_err() {
                    let _ = apply_blur(&window, Some((16, 19, 22, 32)));
                }
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
            commands::query_nvidia_nim
        ])
        .run(tauri::generate_context!())
        .expect("error while running LexiGlass desktop application");
}
