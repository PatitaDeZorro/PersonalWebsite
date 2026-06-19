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

  const dataUrl = assetUrl("assets/data/services.json");
  const state = { items: [] };

  function renderCards(items, language) {
    const container = document.getElementById("services-items");
    if (!container) return;

    container.innerHTML = items.map((item, index) => {
      const content = contentFor(item, language);
      const delay = (index + 1) * 100;
      const openLabel = language === "en" ? "Open service details" : "Abrir detalles del servicio";

      return `
        <div class="col-lg-4 col-md-6 service-item d-flex" data-aos="fade-up" data-aos-delay="${delay}">
          <div class="icon flex-shrink-0" aria-hidden="true"><i class="bi ${text(item.icon)}"></i></div>
          <div>
            <h4 class="title"><button type="button" class="stretched-link enlace-modal-texto" data-bs-toggle="modal" data-bs-target="#${text(item.id)}" aria-label="${text(`${openLabel}: ${content.title}`)}">${text(content.title)}</button></h4>
            <p class="description">${text(content.description)}</p>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderBadges(item) {
    if (!Array.isArray(item.badges) || !item.badges.length) return "";

    return `
      <div class="badges-modal" aria-label="Tecnologías">
        ${item.badges.map((badge) => `<span class="badge-modal">${text(badge)}</span>`).join("")}
      </div>
    `;
  }

  function renderModals(items, language) {
    const root = document.getElementById("texto-modal-root");
    if (!root) return;

    root.innerHTML = items.map((item) => {
      const content = contentFor(item, language);
      const closeLabel = content.close || (language === "en" ? "Close" : "Cerrar");
      const ctaLabel = content.cta || (language === "en" ? "Request information" : "Solicitar información");
      const titleId = `${item.id}-title`;

      return `
        <div class="modal fade modal-detalle modal-texto" id="${text(item.id)}" tabindex="-1" aria-hidden="true" aria-labelledby="${text(titleId)}">
          <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <span class="etiqueta-modal">${text(content.section)}</span>
                  <h5 class="modal-title" id="${text(titleId)}">${text(content.title)}</h5>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${text(closeLabel)}"></button>
              </div>
              <div class="modal-body">
                <p>${text(content.description)}</p>
                <p>${text(content.body)}</p>
                ${renderBadges(item)}
                <ul class="lista-modal">
                  ${(content.points || []).map((point) => `<li>${text(point)}</li>`).join("")}
                </ul>
              </div>
              <div class="modal-footer">
                <a class="btn btn-primary" href="#contact" data-bs-dismiss="modal" aria-label="${text(ctaLabel)}">${text(ctaLabel)}</a>
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${text(closeLabel)}</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderServices() {
    const language = currentLanguage();
    renderCards(state.items, language);
    renderModals(state.items, language);
    window.dispatchEvent(new CustomEvent("services:rendered", { detail: { language } }));
  }

  async function initServices() {
    try {
      await domReady();
      await (window.i18nReady || Promise.resolve());
      state.items = await loadJson(dataUrl);
      renderServices();
      return true;
    } catch (error) {
      renderLoadError("services-items");
      return false;
    }
  }

  window.servicesReady = initServices();

  window.addEventListener("i18n:changed", () => {
    if (state.items.length) {
      renderServices();
    }
  });
})();
