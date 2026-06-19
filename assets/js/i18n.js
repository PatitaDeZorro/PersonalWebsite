(function() {
  "use strict";

  const supportedLanguages = ["es", "en"];
  const defaultLanguage = "es";
  let currentMessages = {};

  function assetUrl(url) {
    const version = document.querySelector('meta[name="asset-version"]')?.getAttribute("content");
    if (!version || /^(?:https?:)?\/\//.test(url) || url.includes("?")) {
      return url;
    }

    return `${url}?v=${encodeURIComponent(version)}`;
  }

  function getSavedLanguage() {
    const saved = localStorage.getItem("portfolio-language");
    if (supportedLanguages.includes(saved)) {
      return saved;
    }

    const browserLanguage = (navigator.language || "").slice(0, 2).toLowerCase();
    return supportedLanguages.includes(browserLanguage) ? browserLanguage : defaultLanguage;
  }

  function getValue(messages, key) {
    if (!messages || !key) return undefined;
    return key.split(".").reduce((value, part) => value && value[part], messages) ?? messages[key];
  }

  function setActiveLanguage(language) {
    document.querySelectorAll(".lang-option").forEach((button) => {
      const active = button.getAttribute("data-lang") === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyTranslations(messages, language) {
    currentMessages = messages || {};
    document.documentElement.lang = language;

    const titleKey = document.body?.dataset.i18nTitle || "meta.title";
    document.title = getValue(messages, titleKey) || document.title;

    const description = document.querySelector('meta[name="description"]');
    const translatedDescription = getValue(messages, "meta.description");
    if (description && translatedDescription) {
      description.setAttribute("content", translatedDescription);
    }

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = getValue(messages, element.getAttribute("data-i18n"));
      if (value !== undefined) {
        element.textContent = value;
      }
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
      element.getAttribute("data-i18n-attr").split(";").forEach((entry) => {
        const [attribute, key] = entry.split(":").map((part) => part && part.trim());
        const value = getValue(messages, key);
        if (attribute && value !== undefined) {
          element.setAttribute(attribute, value);
        }
      });
    });

    setActiveLanguage(language);
    window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { language } }));
  }

  async function loadLanguage(language) {
    const normalizedLanguage = supportedLanguages.includes(language) ? language : defaultLanguage;

    try {
      const response = await fetch(assetUrl(`assets/i18n/${normalizedLanguage}.json`));
      if (!response.ok) {
        throw new Error(`Unable to load language ${normalizedLanguage}: ${response.status}`);
      }

      const messages = await response.json();
      localStorage.setItem("portfolio-language", normalizedLanguage);
      applyTranslations(messages, normalizedLanguage);
    } catch (error) {
      console.error(error);

      if (normalizedLanguage !== defaultLanguage) {
        await loadLanguage(defaultLanguage);
        return;
      }

      document.documentElement.lang = defaultLanguage;
      setActiveLanguage(defaultLanguage);
      window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { language: defaultLanguage, failed: true } }));
    }
  }

  window.setPortfolioLanguage = loadLanguage;
  window.getPortfolioMessage = (key, fallback = "") => getValue(currentMessages, key) ?? fallback;
  window.i18nReady = loadLanguage(getSavedLanguage());

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".lang-option");
    if (button) {
      loadLanguage(button.getAttribute("data-lang"));
    }
  });
})();
