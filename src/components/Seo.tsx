import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  noIndex?: boolean;
}

/**
 * Lightweight SEO component — manipulates document head directly.
 * Avoids extra dependency (react-helmet-async) while covering essentials:
 * title, description, canonical, OG, Twitter, JSON-LD structured data.
 */
export function Seo({ title, description, canonical, ogImage, jsonLd, noIndex }: SeoProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title.length > 60 ? title.slice(0, 57) + "…" : title;

    const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };

    const desc = description.length > 160 ? description.slice(0, 157) + "…" : description;
    const created: HTMLElement[] = [];

    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", desc);
    if (ogImage) {
      setMeta('meta[property="og:image"]', "property", "og:image", ogImage);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
    }
    if (noIndex) {
      setMeta('meta[name="robots"]', "name", "robots", "noindex, nofollow");
    } else {
      setMeta('meta[name="robots"]', "name", "robots", "index, follow");
    }

    // Canonical
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
      created.push(link);
    }
    link.href = canonical || window.location.href.split("?")[0];

    // JSON-LD
    const scripts: HTMLScriptElement[] = [];
    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((data) => {
        const s = document.createElement("script");
        s.type = "application/ld+json";
        s.dataset.seo = "true";
        s.textContent = JSON.stringify(data);
        document.head.appendChild(s);
        scripts.push(s);
      });
    }

    return () => {
      document.title = prevTitle;
      scripts.forEach((s) => s.remove());
      created.forEach((el) => el.remove());
    };
  }, [title, description, canonical, ogImage, JSON.stringify(jsonLd), noIndex]);

  return null;
}
