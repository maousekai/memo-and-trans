use crate::security;
use serde::Serialize;
use tauri::{AppHandle, WebviewWindow};

#[derive(Serialize)]
pub struct KeyStatus {
    pub configured: bool,
    pub storage_type: String,
}

#[tauri::command]
pub async fn get_selected_text(_app: AppHandle) -> Result<String, String> {
    // Selection capture is only triggered explicitly by the user's shortcut.
    // The platform-specific clipboard flow can populate this command later;
    // keeping the command side-effect free prevents continuous clipboard reads.
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
        .map_err(|e| format!("Failed to set window size: {}", e))
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
                "content": "You are LexiGlass AI. Output strictly valid JSON."
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
        let err_text = resp.text().await.unwrap_or_default();
        return Err(format!("NVIDIA API error: {}", err_text));
    }

    let json_resp: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let content = json_resp["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "Empty AI response content".to_string())?;

    // Strip markdown code fences or conversational preamble around JSON.
    let trimmed = content.trim();
    let cleaned = if let Some(start) = trimmed.find('{') {
        if let Some(end) = trimmed.rfind('}') {
            if end > start {
                &trimmed[start..=end]
            } else {
                trimmed
            }
        } else {
            trimmed
        }
    } else {
        trimmed
    };

    Ok(cleaned.to_string())
}
