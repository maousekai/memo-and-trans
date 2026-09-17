use keyring::Entry;
use serde::Serialize;
use std::{sync::OnceLock, time::Duration};

const SERVICE_NAME: &str = "com.lexiglass.app";
const GEMINI_USERNAME: &str = "gemini_api_key";

static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

fn client() -> &'static reqwest::Client {
    HTTP_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(2))
            .pool_idle_timeout(Duration::from_secs(90))
            .pool_max_idle_per_host(8)
            .tcp_keepalive(Duration::from_secs(30))
            .build()
            .expect("failed to initialize Gemini HTTP client")
    })
}

fn gemini_entry() -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, GEMINI_USERNAME)
        .map_err(|e| format!("Failed to access Windows Credential Manager: {}", e))
}

fn get_gemini_key() -> Result<String, String> {
    gemini_entry()?
        .get_password()
        .map_err(|_| "Gemini API key not configured in Windows Credential Manager".to_string())
}

#[derive(Serialize)]
pub struct GeminiKeyStatus {
    pub configured: bool,
    pub storage_type: String,
}

#[tauri::command]
pub async fn get_gemini_key_status() -> Result<GeminiKeyStatus, String> {
    let configured = get_gemini_key()
        .map(|key| !key.trim().is_empty())
        .unwrap_or(false);
    Ok(GeminiKeyStatus {
        configured,
        storage_type: if configured {
            "Windows Credential Manager (Keyring)".to_string()
        } else {
            "None".to_string()
        },
    })
}

#[tauri::command]
pub async fn save_gemini_api_key(key: String) -> Result<(), String> {
    let entry = gemini_entry()?;
    if key.trim().is_empty() {
        // Deleting a missing key is harmless from the user's point of view.
        let _ = entry.delete_password();
        return Ok(());
    }
    entry
        .set_password(key.trim())
        .map_err(|e| format!("Failed to save Gemini API key: {}", e))
}

#[tauri::command]
pub async fn query_gemini(
    model: String,
    prompt: String,
    timeout_ms: Option<u64>,
) -> Result<String, String> {
    let model = model.trim();
    if !model.starts_with("gemini-") || model.len() > 80 {
        return Err("Invalid Gemini model identifier".to_string());
    }
    if prompt.trim().is_empty() {
        return Err("Gemini prompt cannot be empty".to_string());
    }
    if prompt.chars().count() > 12_000 {
        return Err("Gemini request is too large".to_string());
    }

    let api_key = get_gemini_key()?;
    let timeout = timeout_ms.unwrap_or(4500).clamp(500, 4500);
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
        model
    );

    let body = serde_json::json!({
        "contents": [{
            "role": "user",
            "parts": [{ "text": prompt }]
        }],
        "generationConfig": {
            "temperature": 0.05,
            "maxOutputTokens": 900,
            "responseMimeType": "application/json"
        }
    });

    let response = client()
        .post(url)
        .timeout(Duration::from_millis(timeout))
        .header("x-goog-api-key", api_key)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                format!("Gemini exceeded the {}ms translation budget", timeout)
            } else {
                format!("Gemini network request failed: {}", e)
            }
        })?;

    if !response.status().is_success() {
        let status = response.status();
        let detail = response.text().await.unwrap_or_default();
        return Err(format!("Gemini API error {}: {}", status, detail));
    }

    let payload: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    let text = payload["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("")
        .trim();

    if text.is_empty() {
        let finish_reason = payload["candidates"][0]["finishReason"]
            .as_str()
            .unwrap_or("unknown");
        return Err(format!("Gemini returned no final text (finish_reason={})", finish_reason));
    }

    Ok(text.to_string())
}
