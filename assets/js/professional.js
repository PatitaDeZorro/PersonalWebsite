(function() {
  "use strict";

  const {
    domReady,
    currentLanguage,
    text,
    contentFor,
    assetUrl,
    loadJson,
    renderLoadError
  } = window.ContentUtils;

  const dataUrl = assetUrl("assets/data/professional.json");
  const state = { data: null };

  function renderItem(item, language, index) {
    const content = contentFor(item, language);
    const delay = (index + 1) * 100;

    return `
      <article class="professional-item" data-aos="fade-up" data-aos-delay="${delay}">
        <span class="professional-period">${text(content.period)}</span>
        <h3>${text(content.company)}</h3>
        <p class="professional-role"><strong>${text(content.roleLabel)}:</strong> ${text(content.role)}</p>
        <div class="professional-activities">
          <h4>${text(content.activitiesLabel)}</h4>
          <ul>
            ${(content.activities || []).map((activity) => `<li>${text(activity)}</li>`).join("")}
          </ul>
        </div>
      </article>
    `;
  }

  function renderProfessional() {
    const container = document.getElementById("professional-items");
    if (!container || !state.data) return;

    const language = currentLanguage();
    container.innerHTML = (state.data.items || []).map((item, index) => renderItem(item, language, index)).join("");
    window.dispatchEvent(new CustomEvent("professional:rendered", { detail: { language } }));
  }

  async function initProfessional() {
    try {
      await domReady();
      await (window.i18nReady || Promise.resolve());
      state.data = await loadJson(dataUrl);
      renderProfessional();
      return true;
    } catch (error) {
      renderLoadError("professional-items");
      return false;
    }
  }

  window.professionalReady = initProfessional();

  window.addEventListener("i18n:changed", () => {
    if (state.data) {
      renderProfessional();
    }
  });
})();
