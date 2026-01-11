use reqwest;
use scraper::{Html, Selector};

#[derive(Debug, Clone)]
pub struct UrlMetadata {
    pub title: Option<String>,
    pub favicon: Option<String>,
}

/// Fetch metadata (title and favicon) from a URL
pub async fn fetch_url_metadata(url: &str) -> Result<UrlMetadata, Box<dyn std::error::Error>> {
    // Validate URL
    let parsed_url = url::Url::parse(url)?;

    // Security: only allow http and https
    if parsed_url.scheme() != "http" && parsed_url.scheme() != "https" {
        return Err("Only HTTP and HTTPS URLs are allowed".into());
    }

    // Security: block localhost and private IP ranges
    if let Some(host) = parsed_url.host_str() {
        let host_lower = host.to_lowercase();
        if host_lower == "localhost"
            || host_lower == "127.0.0.1"
            || host_lower == "::1"
            || host_lower == "0.0.0.0"
            || is_private_ip(&host_lower)
        {
            return Err("Private IP addresses and localhost are not allowed".into());
        }
    }

    // Fetch the HTML with timeout
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .user_agent("Mozilla/5.0 (compatible; usedraft/1.0)")
        .build()?;

    let response = client.get(url).send().await?;

    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()).into());
    }

    let html = response.text().await?;
    let document = Html::parse_document(&html);

    // Extract title
    let title = extract_title(&document);

    // Extract favicon
    let favicon = extract_favicon(&document, &parsed_url);

    Ok(UrlMetadata { title, favicon })
}

fn extract_title(document: &Html) -> Option<String> {
    // Try og:title first
    if let Ok(selector) = Selector::parse("meta[property='og:title']") {
        if let Some(element) = document.select(&selector).next() {
            if let Some(content) = element.value().attr("content") {
                return Some(decode_html_entities(content));
            }
        }
    }

    // Fallback to <title> tag
    if let Ok(selector) = Selector::parse("title") {
        if let Some(element) = document.select(&selector).next() {
            let title = element.text().collect::<String>().trim().to_string();
            if !title.is_empty() {
                return Some(decode_html_entities(&title));
            }
        }
    }

    None
}

fn extract_favicon(document: &Html, base_url: &url::Url) -> Option<String> {
    // Try different favicon link patterns
    let patterns = vec![
        "link[rel='apple-touch-icon']",
        "link[rel='icon']",
        "link[rel='shortcut icon']",
    ];

    for pattern in patterns {
        if let Ok(selector) = Selector::parse(pattern) {
            if let Some(element) = document.select(&selector).next() {
                if let Some(href) = element.value().attr("href") {
                    // Resolve relative URLs
                    if let Ok(favicon_url) = base_url.join(href) {
                        return Some(favicon_url.to_string());
                    }
                }
            }
        }
    }

    // Fallback to /favicon.ico
    if let Ok(favicon_url) = base_url.join("/favicon.ico") {
        return Some(favicon_url.to_string());
    }

    None
}

fn decode_html_entities(text: &str) -> String {
    text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&#x27;", "'")
        .replace("&#x2F;", "/")
        .replace("&nbsp;", " ")
}

fn is_private_ip(host: &str) -> bool {
    // Check for private IP ranges
    if let Ok(addr) = host.parse::<std::net::IpAddr>() {
        match addr {
            std::net::IpAddr::V4(ipv4) => {
                let octets = ipv4.octets();
                // 10.0.0.0/8
                if octets[0] == 10 {
                    return true;
                }
                // 172.16.0.0/12
                if octets[0] == 172 && (octets[1] >= 16 && octets[1] <= 31) {
                    return true;
                }
                // 192.168.0.0/16
                if octets[0] == 192 && octets[1] == 168 {
                    return true;
                }
                // 169.254.0.0/16 (link-local)
                if octets[0] == 169 && octets[1] == 254 {
                    return true;
                }
                // 127.0.0.0/8 (loopback)
                if octets[0] == 127 {
                    return true;
                }
            }
            std::net::IpAddr::V6(ipv6) => {
                // Check for IPv6 loopback and link-local
                if ipv6.is_loopback() {
                    return true;
                }
                // fe80::/10 link-local
                let segments = ipv6.segments();
                if (segments[0] & 0xffc0) == 0xfe80 {
                    return true;
                }
            }
        }
    }
    false
}
