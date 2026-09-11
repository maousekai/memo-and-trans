use keyring::Entry;

const SERVICE_NAME: &str = "com.lexiglass.app";
const USERNAME: &str = "nvidia_nim_api_key";

/// Retrieves the NVIDIA API key from the OS Keyring (Windows Credential Manager)
pub fn get_api_key() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, USERNAME)
        .map_err(|e| format!("Failed to access OS Keyring: {}", e))?;
    
    entry.get_password()
        .map_err(|e| format!("API key not found in OS Keyring: {}", e))
}

/// Securely saves the NVIDIA API key into Windows Credential Manager
pub fn set_api_key(key: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, USERNAME)
        .map_err(|e| format!("Failed to access OS Keyring: {}", e))?;
    
    entry.set_password(key)
        .map_err(|e| format!("Failed to save key in OS Keyring: {}", e))
}

/// Deletes the stored API key from Windows Credential Manager
pub fn delete_api_key() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, USERNAME)
        .map_err(|e| format!("Failed to access OS Keyring: {}", e))?;
    
    entry.delete_password()
        .map_err(|e| format!("Failed to delete key from OS Keyring: {}", e))
}
