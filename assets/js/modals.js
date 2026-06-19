(function() {
  "use strict";

  const modalCarousels = [];
  const modalTimers = new Map();
  const carouselTimers = [];

  function domReady() {
    if (window.ContentUtils?.domReady) {
      return window.ContentUtils.domReady();
    }

    if (document.readyState === "loading") {
      return new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
    }

    return Promise.resolve();
  }

  function getSwiper() {
    return typeof Swiper !== "undefined" ? Swiper : window.Swiper;
  }

  function getCurrentLanguage() {
    return window.ContentUtils?.currentLanguage?.() || (document.documentElement.lang === "en" ? "en" : "es");
  }

  function activateFallbackCarousel(gallery) {
    const slides = Array.from(gallery.querySelectorAll(".swiper-slide"));
    const prev = gallery.querySelector(".swiper-button-prev");
    const next = gallery.querySelector(".swiper-button-next");
    const pagination = gallery.querySelector(".swiper-pagination");
    let activeIndex = 0;

    function render() {
      slides.forEach((slide, index) => {
        slide.classList.toggle("slide-activo", index === activeIndex);
      });

      if (pagination) {
        pagination.textContent = `${activeIndex + 1} / ${slides.length}`;
      }
    }

    if (slides.length <= 1) {
      prev?.setAttribute("hidden", "hidden");
      next?.setAttribute("hidden", "hidden");
    }

    prev?.addEventListener("click", () => {
      activeIndex = (activeIndex - 1 + slides.length) % slides.length;
      render();
    });

    next?.addEventListener("click", () => {
      activeIndex = (activeIndex + 1) % slides.length;
      render();
    });

    gallery.dataset.fallbackCarousel = "true";
    render();
  }

  function getGalleryImages(image) {
    const declaredImages = (image.getAttribute("data-gallery") || "")
      .split(",")
      .map((path) => path.trim())
      .filter(Boolean);

    return declaredImages.length ? declaredImages : [image.getAttribute("src")];
  }

  function createImageCarousels() {
    const language = getCurrentLanguage();
    const prevLabel = language === "en" ? "Previous image" : "Imagen anterior";
    const nextLabel = language === "en" ? "Next image" : "Imagen siguiente";

    document.querySelectorAll(".modal-imagenes .modal-imagen-portada").forEach((image) => {
      const images = getGalleryImages(image);
      const gallery = document.createElement("div");
      gallery.className = "galeria-modal swiper";

      const wrapper = document.createElement("div");
      wrapper.className = "swiper-wrapper";

      images.forEach((path) => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";

        const newImage = document.createElement("img");
        newImage.src = path;
        newImage.alt = image.alt || "";
        newImage.loading = "lazy";
        newImage.decoding = "async";

        slide.appendChild(newImage);
        wrapper.appendChild(slide);
      });

      const pagination = document.createElement("div");
      pagination.className = "swiper-pagination";

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = "swiper-button-prev";
      prev.setAttribute("aria-label", prevLabel);

      const next = document.createElement("button");
      next.type = "button";
      next.className = "swiper-button-next";
      next.setAttribute("aria-label", nextLabel);

      gallery.append(wrapper, pagination, prev, next);
      image.replaceWith(gallery);

      const SwiperConstructor = getSwiper();
      if (SwiperConstructor) {
        const swiper = new SwiperConstructor(gallery, {
          loop: false,
          speed: 500,
          slidesPerView: 1,
          spaceBetween: 12,
          autoplay: false,
          pagination: {
            el: pagination,
            clickable: true
          },
          navigation: {
            nextEl: next,
            prevEl: prev
          }
        });

        modalCarousels.push(swiper);

        if (images.length > 1) {
          const timer = window.setInterval(() => {
            const modal = gallery.closest(".modal");
            if (!modal?.classList.contains("show") || swiper.destroyed) return;

            advanceCarousel(swiper);
          }, 4200);

          carouselTimers.push(timer);
        }
      } else {
        activateFallbackCarousel(gallery);
      }
    });
  }

  function advanceCarousel(swiper) {
    const total = swiper.slides?.length || 0;
    if (total <= 1) return;

    if (swiper.activeIndex >= total - 1) {
      swiper.slideTo(0);
      return;
    }

    swiper.slideNext();
  }

  function stopAutoAdvance(modal) {
    const timer = modalTimers.get(modal);
    if (!timer) return;

    window.clearInterval(timer);
    modalTimers.delete(modal);
  }

  function startAutoAdvance(modal) {
    stopAutoAdvance(modal);

    const carousels = modalCarousels.filter((swiper) => !swiper.destroyed && modal.contains(swiper.el));
    if (!carousels.some((swiper) => (swiper.slides?.length || 0) > 1)) return;

    const timer = window.setInterval(() => {
      carousels.forEach(advanceCarousel);
    }, 4200);

    modalTimers.set(modal, timer);
  }

  function activateModalCarousel(modal) {
    modalCarousels.forEach((swiper) => {
      if (!swiper.destroyed && modal.contains(swiper.el)) {
        swiper.update();
        swiper.slideTo(0, 0);
      }
    });

    startAutoAdvance(modal);
  }

  function updateCarouselOnOpen() {
    document.querySelectorAll(".modal-imagenes").forEach((modal) => {
      if (modal.dataset.carouselEvents === "true") return;

      modal.addEventListener("shown.bs.modal", () => {
        activateModalCarousel(modal);
      });

      modal.addEventListener("hidden.bs.modal", () => {
        stopAutoAdvance(modal);
      });

      modal.dataset.carouselEvents = "true";
    });
  }

  function destroyImageCarousels() {
    modalCarousels.forEach((swiper) => {
      if (!swiper.destroyed) {
        swiper.destroy?.(true, true);
      }
    });

    modalCarousels.length = 0;
    modalTimers.forEach((timer) => window.clearInterval(timer));
    modalTimers.clear();
    carouselTimers.forEach((timer) => window.clearInterval(timer));
    carouselTimers.length = 0;
  }

  function prepareImageModals() {
    if (!document.querySelector(".modal-imagenes .modal-imagen-portada")) return;

    destroyImageCarousels();
    createImageCarousels();
    updateCarouselOnOpen();
  }

  async function initModals() {
    await Promise.all([
      window.portfolioReady || Promise.resolve(),
      window.servicesReady || Promise.resolve()
    ]);

    prepareImageModals();
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".boton-modal-imagenes[data-bs-target]");
    if (!trigger) return;

    const modal = document.querySelector(trigger.getAttribute("data-bs-target"));
    if (!modal) return;

    window.setTimeout(() => activateModalCarousel(modal), 400);
  });

  window.addEventListener("portfolio:rendered", prepareImageModals);

  domReady().then(() => {
    initModals().catch((error) => {
      console.error(error);
    });
  });
})();
