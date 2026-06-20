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

  const dataUrl = assetUrl("assets/data/portfolio.json");
  const state = { items: [] };

  function linkFor(item, language) {
    const link = item.link || {};
    return {
      href: link.href || "#contact",
      label: localized(link.label, language, language === "en" ? "Open link" : "Abrir enlace"),
      external: Boolean(link.external)
    };
  }

  function renderCards(items, language) {
    const container = document.getElementById("portfolio-items");
    if (!container) return;

    const detailsLabel = language === "en" ? "More details" : "Más detalles";

    container.innerHTML = items.map((item, index) => {
      const content = contentFor(item, language);
      const title = text(content.title);
      const delay = 80 + (index % 6) * 60;

      return `
        <div class="col-lg-4 col-md-6 portfolio-item isotope-item filter-${text(item.category)}">
          <div class="portfolio-content portfolio-card-enter h-100" style="--portfolio-enter-delay: ${delay}ms;">
            <img src="${text(item.image)}" class="img-fluid" alt="${title}" loading="lazy" decoding="async">
            <div class="portfolio-info">
              <h4>${title}</h4>
              <p>${text(content.description)}</p>
              <button type="button" title="${text(detailsLabel)}" aria-label="${text(`${detailsLabel}: ${content.title}`)}" class="details-link boton-modal-imagenes" data-bs-toggle="modal" data-bs-target="#${text(item.id)}"><i class="bi bi-link-45deg" aria-hidden="true"></i></button>
            </div>
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
    const root = document.getElementById("imagenes-modal-root");
    if (!root) return;

    root.innerHTML = items.map((item) => {
      const content = contentFor(item, language);
      const link = linkFor(item, language);
      const gallery = Array.isArray(item.gallery) && item.gallery.length ? item.gallery : [item.image];
      const target = link.external ? ' target="_blank" rel="noopener noreferrer"' : ' data-bs-dismiss="modal"';
      const closeLabel = language === "en" ? "Close" : "Cerrar";
      const titleId = `${item.id}-title`;

      return `
        <div class="modal fade modal-detalle modal-imagenes" id="${text(item.id)}" tabindex="-1" aria-hidden="true" aria-labelledby="${text(titleId)}">
          <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <span class="etiqueta-modal">${text(content.category)}</span>
                  <h5 class="modal-title" id="${text(titleId)}">${text(content.title)}</h5>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${text(closeLabel)}"></button>
              </div>
              <div class="modal-body">
                <img src="${text(item.image)}" class="modal-imagen-portada" data-gallery="${text(gallery.join(", "))}" alt="${text(content.title)}" loading="lazy" decoding="async">
                <p>${text(content.description)}</p>
                <p>${text(content.body)}</p>
                ${renderBadges(item)}
                <ul class="lista-modal">
                  ${(content.points || []).map((point) => `<li>${text(point)}</li>`).join("")}
                </ul>
              </div>
              <div class="modal-footer">
                <a class="btn btn-primary" href="${text(link.href)}"${target} aria-label="${text(link.label)}">${text(link.label)}</a>
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${text(closeLabel)}</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderPortfolio() {
    const language = currentLanguage();
    renderCards(state.items, language);
    renderModals(state.items, language);
    window.dispatchEvent(new CustomEvent("portfolio:rendered", { detail: { language } }));
  }

  async function initPortfolio() {
    try {
      await domReady();
      await (window.i18nReady || Promise.resolve());
      state.items = await loadJson(dataUrl);
      renderPortfolio();
      return true;
    } catch (error) {
      renderLoadError("portfolio-items");
      return false;
    }
  }

  window.portfolioReady = initPortfolio();

  window.addEventListener("i18n:changed", () => {
    if (state.items.length) {
      renderPortfolio();
    }
  });
})();
