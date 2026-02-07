use security_framework::passwords::{
    delete_generic_password, get_generic_password, set_generic_password,
};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

const SERVICE: &str = "com.ocestrater.secrets";

/// In-memory cache for Keychain secrets
pub struct KeychainStore {
    cache: HashMap<String, String>,
}

impl KeychainStore {
    /// Load all secrets from Keychain into memory on startup
    pub fn load() -> Self {
        let keys = load_index().unwrap_or_default();
        let mut cache = HashMap::new();
        for key in &keys {
            if let Ok(val) = get_secret_from_keychain(key) {
                cache.insert(key.clone(), val);
            }
        }
        KeychainStore { cache }
    }

    /// Get a secret from the in-memory cache
    pub fn get(&self, key: &str) -> Option<&String> {
        self.cache.get(key)
    }

    /// Set a secret in both Keychain and cache
    pub fn set(&mut self, key: &str, value: &str) -> Result<(), String> {
        set_generic_password(SERVICE, key, value.as_bytes())
            .map_err(|e| format!("keychain write error: {e}"))?;
        self.cache.insert(key.to_string(), value.to_string());
        add_to_index(key)?;
        Ok(())
    }

    /// Delete a secret from both Keychain and cache
    pub fn delete(&mut self, key: &str) -> Result<(), String> {
        let _ = delete_generic_password(SERVICE, key);
        self.cache.remove(key);
        remove_from_index(key)?;
        Ok(())
    }

    /// List all stored key names
    pub fn list_keys(&self) -> Vec<String> {
        load_index().unwrap_or_default()
    }

    /// Get all cached secrets as env vars for PTY injection
    pub fn env_vars(&self) -> &HashMap<String, String> {
        &self.cache
    }
}

fn get_secret_from_keychain(key: &str) -> Result<String, String> {
    get_generic_password(SERVICE, key)
        .map(|bytes| String::from_utf8_lossy(&bytes).to_string())
        .map_err(|e| format!("keychain read error: {e}"))
}

fn index_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".ocestrater")
        .join("secret-keys.json")
}

pub fn load_index() -> Result<Vec<String>, String> {
    let path = index_path();
    if !path.exists() {
        return Ok(vec![]);
    }
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("read index error: {e}"))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("parse index error: {e}"))
}

fn save_index(keys: &[String]) -> Result<(), String> {
    let path = index_path();
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let json = serde_json::to_string_pretty(keys)
        .map_err(|e| format!("serialize index error: {e}"))?;
    std::fs::write(&path, json)
        .map_err(|e| format!("write index error: {e}"))
}

pub fn add_to_index(key: &str) -> Result<(), String> {
    let mut keys = load_index().unwrap_or_default();
    if !keys.contains(&key.to_string()) {
        keys.push(key.to_string());
        save_index(&keys)?;
    }
    Ok(())
}

pub fn remove_from_index(key: &str) -> Result<(), String> {
    let mut keys = load_index().unwrap_or_default();
    keys.retain(|k| k != key);
    save_index(&keys)
}

pub type KeychainState = Mutex<KeychainStore>;
