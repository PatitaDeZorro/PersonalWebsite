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

  const dataUrl = assetUrl("assets/data/skills.json");
  const state = { data: null };

  function renderSkill(item, language) {
    const content = contentFor(item, language);
    const value = Number(item.value) || 0;
    const label = text(content.label);

    return `
      <div class="progress">
        <span class="skill"><span>${label}</span> <i class="val">${value}%</i></span>
        <div class="progress-bar-wrap">
          <div class="progress-bar" role="progressbar" aria-label="${label}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `;
  }

  function renderSkills() {
    const container = document.getElementById("skills-items");
    if (!container || !state.data) return;

    const language = currentLanguage();
    container.innerHTML = (state.data.columns || []).map((column) => `
      <div class="col-lg-6">
        ${(column.items || []).map((item) => renderSkill(item, language)).join("")}
      </div>
    `).join("");

    window.dispatchEvent(new CustomEvent("skills:rendered", { detail: { language } }));
  }

  async function initSkills() {
    try {
      await domReady();
      await (window.i18nReady || Promise.resolve());
      state.data = await loadJson(dataUrl);
      renderSkills();
      return true;
    } catch (error) {
      renderLoadError("skills-items");
      return false;
    }
  }

  window.skillsReady = initSkills();

  window.addEventListener("i18n:changed", () => {
    if (state.data) {
      renderSkills();
    }
  });
})();
