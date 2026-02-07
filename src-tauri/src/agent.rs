use crate::config::AgentConfig;

/// Agent adapter — normalizes different CLI behaviors
pub struct AgentAdapter {
    pub name: String,
    pub config: AgentConfig,
}

impl AgentAdapter {
    pub fn new(name: String, config: AgentConfig) -> Self {
        Self { name, config }
    }

    /// Build the full command + args for spawning
    pub fn build_command(&self, model: Option<&str>) -> (String, Vec<String>) {
        let mut args = self.config.args.clone();

        // Inject model flag if specified
        if let (Some(model), Some(flag)) = (model, &self.config.model_flag) {
            args.push(flag.clone());
            args.push(model.to_string());
        }

        // Per-agent adaptations
        match self.name.as_str() {
            "claude" => {
                // Claude Code: uses --dangerously-skip-permissions for non-interactive
                if !args.iter().any(|a| a.contains("dangerously")) {
                    args.push("--dangerously-skip-permissions".into());
                }
            }
            "codex" => {
                // Codex: exec mode for non-interactive, full-auto for auto-approval
                if args.is_empty() {
                    args.extend(["exec".into(), "--full-auto".into()]);
                }
            }
            "gemini" => {
                // Gemini: yolo mode for auto-approval
                if !args.iter().any(|a| a == "--yolo" || a == "-y") {
                    args.push("--yolo".into());
                }
            }
            _ => {}
        }

        (self.config.command.clone(), args)
    }

    /// Get environment variables to set for the agent
    pub fn env_vars(&self) -> &std::collections::HashMap<String, String> {
        &self.config.env
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn make_agent(name: &str, args: Vec<String>) -> AgentAdapter {
        AgentAdapter::new(
            name.to_string(),
            AgentConfig {
                command: name.to_string(),
                args,
                env: HashMap::new(),
                models: vec![],
                default_model: None,
                model_flag: None,
            },
        )
    }

    // ── Claude agent tests ──

    #[test]
    fn test_claude_adds_skip_permissions_flag() {
        let adapter = make_agent("claude", vec![]);
        let (cmd, args) = adapter.build_command(None);
        assert_eq!(cmd, "claude");
        assert!(args.contains(&"--dangerously-skip-permissions".to_string()));
    }

    #[test]
    fn test_claude_no_duplicate_skip_permissions() {
        let adapter = make_agent(
            "claude",
            vec!["--dangerously-skip-permissions".to_string()],
        );
        let (_, args) = adapter.build_command(None);
        let count = args
            .iter()
            .filter(|a| a.contains("dangerously"))
            .count();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_claude_preserves_existing_args() {
        let adapter = make_agent("claude", vec!["--verbose".to_string()]);
        let (_, args) = adapter.build_command(None);
        assert!(args.contains(&"--verbose".to_string()));
        assert!(args.contains(&"--dangerously-skip-permissions".to_string()));
    }

    // ── Codex agent tests ──

    #[test]
    fn test_codex_adds_exec_full_auto_when_empty() {
        let adapter = make_agent("codex", vec![]);
        let (cmd, args) = adapter.build_command(None);
        assert_eq!(cmd, "codex");
        assert_eq!(args, vec!["exec", "--full-auto"]);
    }

    #[test]
    fn test_codex_does_not_add_exec_when_args_present() {
        let adapter = make_agent("codex", vec!["--custom".to_string()]);
        let (_, args) = adapter.build_command(None);
        assert_eq!(args, vec!["--custom"]);
        assert!(!args.contains(&"exec".to_string()));
    }

    // ── Gemini agent tests ──

    #[test]
    fn test_gemini_adds_yolo_flag() {
        let adapter = make_agent("gemini", vec![]);
        let (cmd, args) = adapter.build_command(None);
        assert_eq!(cmd, "gemini");
        assert!(args.contains(&"--yolo".to_string()));
    }

    #[test]
    fn test_gemini_no_duplicate_yolo() {
        let adapter = make_agent("gemini", vec!["--yolo".to_string()]);
        let (_, args) = adapter.build_command(None);
        let count = args.iter().filter(|a| *a == "--yolo").count();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_gemini_no_duplicate_yolo_short_flag() {
        let adapter = make_agent("gemini", vec!["-y".to_string()]);
        let (_, args) = adapter.build_command(None);
        // Should not add --yolo since -y is present
        assert!(!args.contains(&"--yolo".to_string()));
        assert!(args.contains(&"-y".to_string()));
    }

    #[test]
    fn test_gemini_preserves_existing_args() {
        let adapter = make_agent("gemini", vec!["--sandbox".to_string()]);
        let (_, args) = adapter.build_command(None);
        assert!(args.contains(&"--sandbox".to_string()));
        assert!(args.contains(&"--yolo".to_string()));
    }

    // ── Unknown agent tests ──

    #[test]
    fn test_unknown_agent_passes_args_through() {
        let adapter = make_agent("custom-agent", vec!["--flag".to_string()]);
        let (cmd, args) = adapter.build_command(None);
        assert_eq!(cmd, "custom-agent");
        assert_eq!(args, vec!["--flag"]);
    }

    #[test]
    fn test_unknown_agent_empty_args() {
        let adapter = make_agent("custom-agent", vec![]);
        let (_, args) = adapter.build_command(None);
        assert!(args.is_empty());
    }

    // ── env_vars tests ──

    #[test]
    fn test_env_vars_returns_config_env() {
        let mut env = HashMap::new();
        env.insert("API_KEY".to_string(), "secret".to_string());

        let adapter = AgentAdapter::new(
            "claude".to_string(),
            AgentConfig {
                command: "claude".to_string(),
                args: vec![],
                env,
                models: vec![],
                default_model: None,
                model_flag: None,
            },
        );

        assert_eq!(adapter.env_vars().get("API_KEY").unwrap(), "secret");
    }

    #[test]
    fn test_env_vars_empty() {
        let adapter = make_agent("claude", vec![]);
        assert!(adapter.env_vars().is_empty());
    }
}
