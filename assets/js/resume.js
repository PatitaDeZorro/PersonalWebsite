(function() {
  "use strict";

  const {
    domReady,
    currentLanguage,
    text,
    contentFor,
    localized,
    assetUrl,
    loadJson,
    renderLoadError
  } = window.ContentUtils;

  const dataUrl = assetUrl("assets/data/resume.json");
  const state = { data: null };

  function renderAcademicItem(item, language) {
    const content = contentFor(item, language);
    const logoClass = `education-logo-${text(item.fallback).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const license = content.licenseNumber
      ? `<p>${text(content.licenseLabel)} ${text(content.licenseNumber)}</p>`
      : "";

    return `
      <div class="resume-item education-item">
        <div class="education-logo ${logoClass}" aria-hidden="true">
          <img src="${text(item.logo)}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true">
          <span>${text(item.fallback)}</span>
        </div>
        <div class="education-content">
          <h4>${text(content.title)}</h4>
          <p><em>${text(content.organization)}</em></p>
          ${license}
        </div>
      </div>
    `;
  }

  function renderContinuingItem(item, language) {
    const content = contentFor(item, language);
    const externalLabel = language === "en" ? "Open certificate" : "Abrir constancia";

    return `
      <div class="resume-item">
        <h4>${text(content.title)}</h4>
        <ul>
          ${(item.links || []).map((link) => {
            const label = localized(link.content, language);
            return `
              <li>
                <a href="${text(link.href)}" target="_blank" rel="noopener noreferrer" aria-label="${text(`${externalLabel}: ${label}`)}">
                  <span>${text(label)}</span>
                  <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
                </a>
              </li>
            `;
          }).join("")}
        </ul>
      </div>
    `;
  }

  function renderColumn(column, language) {
    const content = contentFor(column, language);
    const renderer = column.id === "academic" ? renderAcademicItem : renderContinuingItem;

    return `
      <div class="col-lg-6" data-aos="fade-up" data-aos-delay="${text(column.delay || 100)}">
        <h3 class="resume-title">${text(content.title)}</h3>
        ${(column.items || []).map((item) => renderer(item, language)).join("")}
      </div>
    `;
  }

  function renderResume() {
    const container = document.getElementById("resume-items");
    if (!container || !state.data) return;

    const language = currentLanguage();
    container.innerHTML = (state.data.columns || []).map((column) => renderColumn(column, language)).join("");
    window.dispatchEvent(new CustomEvent("resume:rendered", { detail: { language } }));
  }

  async function initResume() {
    try {
      await domReady();
      await (window.i18nReady || Promise.resolve());
      state.data = await loadJson(dataUrl);
      renderResume();
      return true;
    } catch (error) {
      renderLoadError("resume-items");
      return false;
    }
  }

  window.resumeReady = initResume();

  window.addEventListener("i18n:changed", () => {
    if (state.data) {
      renderResume();
    }
  });
})();
