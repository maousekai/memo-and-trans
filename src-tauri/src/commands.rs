use crate::security;
use base64::{engine::general_purpose, Engine as _};
use serde::Serialize;
use tauri::{AppHandle, WebviewWindow};

#[derive(Serialize)]
pub struct KeyStatus {
    pub configured: bool,
    pub storage_type: String,
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
    crate::apply_windows_glass(&window);

    Ok(())
}

#[tauri::command]
pub async fn start_dragging(window: WebviewWindow) -> Result<(), String> {
    window
        .start_dragging()
        .map_err(|e| format!("Failed to start window drag: {}", e))?;

    // DWM can recreate the composition surface during a native drag. Refresh
    // the Acrylic policy immediately after the move operation returns so the
    // effect remains visible while the window is stationary too.
    #[cfg(target_os = "windows")]
    crate::apply_windows_glass(&window);

    Ok(())
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

#[tauri::command]
pub async fn query_nvidia_nim(
    model: String,
    prompt: String,
    temperature: Option<f32>,
) -> Result<String, String> {
    let api_key = security::get_api_key()
        .map_err(|_| "NVIDIA API key not configured in Windows Credential Manager".to_string())?;

    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are LexiGlass AI. Output strictly valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": temperature.unwrap_or(0.1),
        "max_tokens": 1500
    });

    let resp = client
        .post("https://integrate.api.nvidia.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

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
        .ok_or_else(|| "Empty AI response content".to_string())?;

    let trimmed = content.trim();
    let cleaned = if let Some(start) = trimmed.find('{') {
        if let Some(end) = trimmed.rfind('}') {
            if end > start { &trimmed[start..=end] } else { trimmed }
        } else {
            trimmed
        }
    } else {
        trimmed
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

    let client = reqwest::Client::new();
    let resp = client
        .post("https://877104f7-e885-42b9-8de8-f6e4c6303969.invocation.api.nvcf.nvidia.com/v1/audio/synthesize")
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
