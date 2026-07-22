#[cfg(target_os = "linux")]
const DISABLE_GBM_ENV: &str = "WEBKIT_DMABUF_RENDERER_DISABLE_GBM";

pub fn configure() {
    #[cfg(target_os = "linux")]
    {
        if should_disable_gbm(
            std::env::var_os(DISABLE_GBM_ENV).is_some(),
            nvidia_is_present(),
        ) {
            // This runs before Tauri, GTK, or WebKit starts any threads.
            std::env::set_var(DISABLE_GBM_ENV, "1");
        }
    }
}

#[cfg(any(test, target_os = "linux"))]
fn should_disable_gbm(has_explicit_setting: bool, nvidia_is_present: bool) -> bool {
    !has_explicit_setting && nvidia_is_present
}

#[cfg(target_os = "linux")]
fn nvidia_is_present() -> bool {
    std::path::Path::new("/proc/driver/nvidia/version").exists()
        || std::path::Path::new("/sys/module/nvidia").exists()
        || env_mentions_nvidia("GBM_BACKEND")
        || env_mentions_nvidia("__GLX_VENDOR_LIBRARY_NAME")
}

#[cfg(target_os = "linux")]
fn env_mentions_nvidia(name: &str) -> bool {
    std::env::var(name)
        .map(|value| value.to_ascii_lowercase().contains("nvidia"))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::should_disable_gbm;

    #[test]
    fn disables_gbm_for_nvidia() {
        assert!(should_disable_gbm(false, true));
    }

    #[test]
    fn leaves_other_graphics_drivers_unchanged() {
        assert!(!should_disable_gbm(false, false));
    }

    #[test]
    fn respects_an_explicit_user_setting() {
        assert!(!should_disable_gbm(true, true));
    }
}
