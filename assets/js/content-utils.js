(function() {
  "use strict";

  const defaultLanguage = "es";
  const supportedLanguages = ["es", "en"];
  const assetVersion = document.querySelector('meta[name="asset-version"]')?.getAttribute("content") || "20260618-site-polish";

  function domReady() {
    if (document.readyState === "loading") {
      return new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    }

    return Promise.resolve();
  }

  function currentLanguage() {
    const language = document.documentElement.lang || localStorage.getItem("portfolio-language") || defaultLanguage;
    return supportedLanguages.includes(language) ? language : defaultLanguage;
  }

  function text(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function contentFor(item, language) {
    return item.content?.[language] || item.content?.[defaultLanguage] || {};
  }

  function localized(value, language, fallback = "") {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value[language] || value[defaultLanguage] || fallback;
    }

    return value ?? fallback;
  }

  function assetUrl(url) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${encodeURIComponent(assetVersion)}`;
  }

  async function loadJson(url, timeout = 10000) {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller
      ? window.setTimeout(() => controller.abort(), timeout)
      : null;

    try {
      const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
      if (!response.ok) {
        throw new Error(`Unable to load ${url}: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        console.error(`Timeout loading ${url}`);
      }

      console.error(error);
      throw error;
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  function renderLoadError(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const message = currentLanguage() === "en"
      ? "This section could not be loaded. Please refresh the page."
      : "No se pudo cargar esta sección. Actualiza la página.";

    container.innerHTML = `<div class="col-12"><p class="section-load-error">${text(message)}</p></div>`;
  }

  window.ContentUtils = {
    defaultLanguage,
    supportedLanguages,
    domReady,
    currentLanguage,
    text,
    contentFor,
    localized,
    assetUrl,
    loadJson,
    renderLoadError
  };
})();
