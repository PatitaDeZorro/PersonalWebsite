(function() {
  "use strict";

  const storageKey = "portfolio-theme";
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const themeToggle = document.querySelector(".theme-toggle");
  const themeIcon = themeToggle?.querySelector("i");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  function getPreferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") {
      return saved;
    }

    return darkQuery.matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKey, theme);
    themeToggle?.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    themeColor?.setAttribute("content", theme === "dark" ? "#101820" : "#149ddd");

    if (themeIcon) {
      themeIcon.classList.toggle("bi-moon-stars", theme !== "dark");
      themeIcon.classList.toggle("bi-sun", theme === "dark");
    }
  }

  applyTheme(getPreferredTheme());

  themeToggle?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
})();
