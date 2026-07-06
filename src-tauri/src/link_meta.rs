use std::time::Duration;

use reqwest::Url;
use scraper::{Html, Selector};
use serde::Serialize;

use crate::error::{AppError, AppResult};

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LinkMeta {
    pub title: Option<String>,
    pub image: Option<String>,
    pub favicon: Option<String>,
}

/// Fetch a page and extract title, og:image and favicon.
pub async fn fetch(url: &str) -> AppResult<LinkMeta> {
    let parsed = Url::parse(url).map_err(|e| AppError::InvalidInput(format!("bad url: {e}")))?;

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent("Mozilla/5.0 (Macintosh) Draft/0.2")
        .build()
        .map_err(|e| AppError::Network(e.to_string()))?;

    let response = client
        .get(parsed.clone())
        .send()
        .await
        .map_err(|e| AppError::Network(e.to_string()))?;
    let final_url = response.url().clone();
    let body = response
        .text()
        .await
        .map_err(|e| AppError::Network(e.to_string()))?;

    Ok(parse_meta(&body, &final_url))
}

fn parse_meta(html: &str, base: &Url) -> LinkMeta {
    let doc = Html::parse_document(html);
    let select = |css: &str| Selector::parse(css).ok();

    let attr_content = |css: &str| -> Option<String> {
        let sel = select(css)?;
        doc.select(&sel)
            .next()
            .and_then(|el| el.value().attr("content"))
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
    };

    let title = attr_content(r#"meta[property="og:title"]"#)
        .or_else(|| {
            let sel = select("title")?;
            doc.select(&sel)
                .next()
                .map(|el| el.text().collect::<String>().trim().to_string())
                .filter(|s| !s.is_empty())
        });

    let image = attr_content(r#"meta[property="og:image"]"#)
        .or_else(|| attr_content(r#"meta[name="twitter:image"]"#))
        .and_then(|href| absolutize(base, &href));

    let favicon = ["link[rel~='icon']", "link[rel='shortcut icon']"]
        .iter()
        .find_map(|css| {
            let sel = select(css)?;
            doc.select(&sel)
                .next()
                .and_then(|el| el.value().attr("href"))
                .map(str::to_string)
        })
        .and_then(|href| absolutize(base, &href))
        .or_else(|| absolutize(base, "/favicon.ico"));

    LinkMeta {
        title,
        image,
        favicon,
    }
}

fn absolutize(base: &Url, href: &str) -> Option<String> {
    base.join(href.trim()).ok().map(|u| u.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    const PAGE: &str = r#"<html><head>
        <title>Fallback Title</title>
        <meta property="og:title" content="OG Title" />
        <meta property="og:image" content="/img/preview.png" />
        <link rel="icon" href="assets/fav.svg" />
    </head><body></body></html>"#;

    #[test]
    fn parses_and_absolutizes() {
        let base = Url::parse("https://example.com/blog/post").unwrap();
        let meta = parse_meta(PAGE, &base);
        assert_eq!(meta.title.as_deref(), Some("OG Title"));
        assert_eq!(meta.image.as_deref(), Some("https://example.com/img/preview.png"));
        assert_eq!(
            meta.favicon.as_deref(),
            Some("https://example.com/blog/assets/fav.svg")
        );
    }

    #[test]
    fn falls_back_to_title_tag_and_default_favicon() {
        let base = Url::parse("https://example.com").unwrap();
        let meta = parse_meta("<html><head><title>Plain</title></head></html>", &base);
        assert_eq!(meta.title.as_deref(), Some("Plain"));
        assert_eq!(meta.image, None);
        assert_eq!(meta.favicon.as_deref(), Some("https://example.com/favicon.ico"));
    }
}
