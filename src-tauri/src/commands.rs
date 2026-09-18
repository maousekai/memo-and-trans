use crate::security;
use base64::{engine::general_purpose, Engine as _};
use serde::Serialize;
use std::{sync::OnceLock, time::Duration};
use tauri::{AppHandle, WebviewWindow};

static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

fn shared_http_client() -> &'static reqwest::Client {
    HTTP_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(3))
            .pool_idle_timeout(Duration::from_secs(90))
            .pool_max_idle_per_host(8)
            .tcp_keepalive(Duration::from_secs(30))
            .build()
            .expect("failed to initialize shared HTTP client")
    })
}

#[derive(Serialize)]
pub struct KeyStatus {
    pub configured: bool,
    pub storage_type: String,
}

#[derive(Serialize)]
pub struct BackgroundSample {
    pub tone: String,
    pub luminance: f64,
    pub samples: usize,
}

#[tauri::command]
pub async fn get_selected_text(_app: AppHandle) -> Result<String, String> {
    log::info!("Capturing selected text on user trigger");
    Ok(String::new())
}

#[tauri::command]
pub async fn set_always_on_top(window: WebviewWindow, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| format!("Failed to set always on top: {}", e))
}

#[tauri::command]
pub async fn set_window_size(window: WebviewWindow, width: f64, height: f64) -> Result<(), String> {
    window
        .set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))
        .map_err(|e| format!("Failed to set window size: {}", e))?;

    #[cfg(target_os = "windows")]
    crate::maintain_windows_transparent_frame(&window);

    Ok(())
}

#[tauri::command]
pub async fn start_dragging(window: WebviewWindow) -> Result<(), String> {
    window
        .start_dragging()
        .map_err(|e| format!("Failed to start window drag: {}", e))?;

    #[cfg(target_os = "windows")]
    crate::maintain_windows_transparent_frame(&window);

    Ok(())
}

#[cfg(target_os = "windows")]
fn sample_windows_background(window: &WebviewWindow) -> Result<BackgroundSample, String> {
    #[link(name = "user32")]
    extern "system" {
        fn GetDC(hwnd: isize) -> isize;
        fn ReleaseDC(hwnd: isize, hdc: isize) -> i32;
    }

    #[link(name = "gdi32")]
    extern "system" {
        fn GetPixel(hdc: isize, x: i32, y: i32) -> u32;
    }

    const CLR_INVALID: u32 = 0xFFFF_FFFF;

    let position = window
        .outer_position()
        .map_err(|e| format!("Failed to read window position: {}", e))?;
    let size = window
        .outer_size()
        .map_err(|e| format!("Failed to read window size: {}", e))?;

    let left = position.x;
    let top = position.y;
    let width = size.width as i32;
    let height = size.height as i32;
    let right = left.saturating_add(width);
    let bottom = top.saturating_add(height);
    let gap = 10;

    let points = [
        (left - gap, top + height / 4),
        (left - gap, top + height / 2),
        (left - gap, top + height * 3 / 4),
        (right + gap, top + height / 4),
        (right + gap, top + height / 2),
        (right + gap, top + height * 3 / 4),
        (left + width / 4, top - gap),
        (left + width / 2, top - gap),
        (left + width * 3 / 4, top - gap),
        (left + width / 4, bottom + gap),
        (left + width / 2, bottom + gap),
        (left + width * 3 / 4, bottom + gap),
    ];

    let hdc = unsafe { GetDC(0) };
    if hdc == 0 {
        return Ok(BackgroundSample {
            tone: "light".to_string(),
            luminance: 0.75,
            samples: 0,
        });
    }

    let mut luminance_sum = 0.0_f64;
    let mut valid_samples = 0_usize;

    for (x, y) in points {
        let color = unsafe { GetPixel(hdc, x, y) };
        if color == CLR_INVALID {
            continue;
        }

        let r = (color & 0xFF) as f64 / 255.0;
        let g = ((color >> 8) & 0xFF) as f64 / 255.0;
        let b = ((color >> 16) & 0xFF) as f64 / 255.0;
        let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        luminance_sum += luminance;
        valid_samples += 1;
    }

    unsafe {
        ReleaseDC(0, hdc);
    }

    if valid_samples == 0 {
        return Ok(BackgroundSample {
            tone: "light".to_string(),
            luminance: 0.75,
            samples: 0,
        });
    }

    let luminance = luminance_sum / valid_samples as f64;
    let tone = if luminance >= 0.62 {
        "light"
    } else if luminance >= 0.30 {
        "medium"
    } else {
        "dark"
    };

    Ok(BackgroundSample {
        tone: tone.to_string(),
        luminance,
        samples: valid_samples,
    })
}

#[tauri::command]
pub async fn sample_background_tone(window: WebviewWindow) -> Result<BackgroundSample, String> {
    #[cfg(target_os = "windows")]
    {
        return sample_windows_background(&window);
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = window;
        Ok(BackgroundSample {
            tone: "medium".to_string(),
            luminance: 0.42,
            samples: 0,
        })
    }
}

#[tauri::command]
pub async fn get_api_key_status() -> Result<KeyStatus, String> {
    match security::get_api_key() {
        Ok(key) if !key.trim().is_empty() => Ok(KeyStatus {
            configured: true,
            storage_type: "Windows Credential Manager (Keyring)".to_string(),
        }),
        _ => Ok(KeyStatus {
            configured: false,
            storage_type: "None".to_string(),
        }),
    }
}

#[tauri::command]
pub async fn save_api_key(key: String) -> Result<(), String> {
    if key.trim().is_empty() {
        security::delete_api_key()
    } else {
        security::set_api_key(&key)
    }
}

fn build_nim_request_body(model: &str, prompt: &str, temperature: f32) -> serde_json::Value {
    let mut body = serde_json::json!({
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are LexiGlass AI. Return only compact valid JSON. Do not explain your reasoning."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": temperature,
        "max_tokens": 900,
        "stream": false
    });

    if model.to_ascii_lowercase().contains("deepseek") {
        body["reasoning_effort"] = serde_json::json!("low");
        body["chat_template_kwargs"] = serde_json::json!({
            "thinking": false,
            "reasoning_effort": "low"
        });
    } else if model.to_ascii_lowercase().contains("nemotron-3.5-lightning") {
        body["chat_template_kwargs"] = serde_json::json!({
            "enable_thinking": false
        });
    }

    body
}

#[tauri::command]
pub async fn query_nvidia_nim(
    model: String,
    prompt: String,
    temperature: Option<f32>,
    timeout_ms: Option<u64>,
) -> Result<String, String> {
    let api_key = security::get_api_key()
        .map_err(|_| "NVIDIA API key not configured in Windows Credential Manager".to_string())?;

    let body = build_nim_request_body(&model, &prompt, temperature.unwrap_or(0.1));
    let timeout = timeout_ms.unwrap_or(4500).clamp(500, 4500);

    let resp = shared_http_client()
        .post("https://integrate.api.nvidia.com/v1/chat/completions")
        .timeout(Duration::from_millis(timeout))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                format!("NVIDIA model exceeded the {}ms request budget", timeout)
            } else {
                format!("Network request failed: {}", e)
            }
        })?;

    if !resp.status().is_success() {
        let status = resp.status();
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("NVIDIA API error {}: {}", status, err_text));
    }

    let json_resp: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let content = json_resp["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("")
        .trim();

    if content.is_empty() {
        let finish_reason = json_resp["choices"][0]["finish_reason"]
            .as_str()
            .unwrap_or("unknown");
        let reasoning_present = json_resp["choices"][0]["message"]["reasoning_content"]
            .as_str()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false)
            || json_resp["choices"][0]["message"]["reasoning"]
                .as_str()
                .map(|s| !s.trim().is_empty())
                .unwrap_or(false);

        return Err(format!(
            "NVIDIA returned no final answer (finish_reason={}, reasoning_only={}).",
            finish_reason, reasoning_present
        ));
    }

    let cleaned = if let Some(start) = content.find('{') {
        if let Some(end) = content.rfind('}') {
            if end > start { &content[start..=end] } else { content }
        } else {
            content
        }
    } else {
        content
    };

    Ok(cleaned.to_string())
}

#[tauri::command]
pub async fn synthesize_nvidia_tts(
    text: String,
    language: Option<String>,
    voice: Option<String>,
    sample_rate_hz: Option<u32>,
) -> Result<String, String> {
    let api_key = security::get_api_key()
        .map_err(|_| "NVIDIA API key not configured in Windows Credential Manager".to_string())?;

    let clean_text = text.trim();
    if clean_text.is_empty() {
        return Err("Speech text cannot be empty".to_string());
    }
    if clean_text.chars().count() > 2000 {
        return Err("NVIDIA speech request is limited to 2000 characters".to_string());
    }

    let language = language.unwrap_or_else(|| "en-US".to_string());
    let voice = voice.unwrap_or_else(|| "Magpie-Multilingual.EN-US.Aria".to_string());
    let sample_rate = sample_rate_hz.unwrap_or(44100).clamp(16000, 48000);

    let form = reqwest::multipart::Form::new()
        .text("text", clean_text.to_string())
        .text("language", language)
        .text("voice", voice)
        .text("encoding", "LINEAR_PCM")
        .text("sample_rate_hz", sample_rate.to_string());

    let resp = shared_http_client()
        .post("https://877104f7-e885-42b9-8de8-f6e4c6303969.invocation.api.nvcf.nvidia.com/v1/audio/synthesize")
        .timeout(Duration::from_secs(10))
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("NVIDIA speech network request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("NVIDIA speech API error {}: {}", status, err_text));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read NVIDIA speech audio: {}", e))?;

    if bytes.is_empty() {
        return Err("NVIDIA speech API returned empty audio".to_string());
    }

    Ok(general_purpose::STANDARD.encode(bytes))
}
