pub mod commands;
pub mod db;
pub mod security;
pub mod selection;
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

    let _ = clear_acrylic(window);
    let _ = clear_blur(window);
    apply_windows_native_frame(window);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

    let lookup_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyD);
    let handler_shortcut = lookup_shortcut.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if shortcut != &handler_shortcut {
                        return;
                    }
                    if !matches!(event.state(), ShortcutState::Released) {
                        return;
                    }

                    let app_handle = app.clone();
                    std::thread::spawn(move || {
                        let selected = crate::selection::capture_selected_text_sync(&app_handle)
                            .unwrap_or_default();

                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                                width: 440.0,
                                height: 620.0,
                            }));
                            let _ = window.show();
                            let _ = window.set_focus();

                            #[cfg(target_os = "windows")]
                            crate::maintain_windows_transparent_frame(&window);

                            if !selected.trim().is_empty() {
                                if let Ok(payload) = serde_json::to_string(&selected) {
                                    let script = format!(
                                        "window.dispatchEvent(new CustomEvent('lexiglass-global-lookup', {{ detail: {} }}));",
                                        payload
                                    );
                                    let _ = window.eval(&script);
                                }
                            }
                        }
                    });
                })
                .build(),
        )
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(move |app| {
            app.global_shortcut().register(lookup_shortcut.clone())?;

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
            selection::capture_selected_text,
            translation::get_gemini_key_status,
            translation::save_gemini_api_key,
            translation::query_gemini
        ])
        .run(tauri::generate_context!())
        .expect("error while running LexiGlass desktop application");
}
