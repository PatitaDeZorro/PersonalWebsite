(function() {
  "use strict";

  /**
   * Header toggle
   */
  const headerToggleBtn = document.querySelector('.header-toggle');
  const header = document.querySelector('#header');

  function message(key, fallback) {
    return window.getPortfolioMessage?.(key, fallback) || fallback;
  }

  const loadCallbacks = [];
  let loadHandled = document.readyState === 'complete';

  function onLoad(callback) {
    if (loadHandled) {
      callback();
      return;
    }

    loadCallbacks.push(callback);
  }

  window.addEventListener('load', () => {
    loadHandled = true;
    loadCallbacks.splice(0).forEach((callback) => callback());
  }, { once: true });

  function headerToggle() {
    if (!header || !headerToggleBtn) return;

    header.classList.toggle('header-show');
    headerToggleBtn.classList.toggle('bi-list');
    headerToggleBtn.classList.toggle('bi-x');
  }
  if (headerToggleBtn) {
    headerToggleBtn.addEventListener('click', headerToggle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.header-show')) {
        headerToggle();
      }
    });

  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    onLoad(() => {
      preloader.remove();
    });
  }

  const copyrightYear = document.getElementById('copyright-year');
  if (copyrightYear) {
    copyrightYear.textContent = String(new Date().getFullYear());
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  if (scrollTop) {
    scrollTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  onLoad(toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop, { passive: true });

  /**
   * Sidebar quick actions
   */
  const sidebarStatus = document.querySelector('.sidebar-action-status');
  let sidebarStatusTimer;

  function showSidebarStatus(text) {
    if (!sidebarStatus) return;

    sidebarStatus.textContent = text;
    window.clearTimeout(sidebarStatusTimer);
    sidebarStatusTimer = window.setTimeout(() => {
      sidebarStatus.textContent = '';
    }, 2600);
  }

  async function copyText(value) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }

  document.querySelector('.share-site')?.addEventListener('click', async () => {
    const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
    const shareData = {
      title: message('meta.title', document.title),
      text: message('controls.shareText', 'Take a look at this portfolio.'),
      url: canonical
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showSidebarStatus(message('controls.shareDone', 'Portfolio shared.'));
        return;
      }

      await copyText(canonical);
      showSidebarStatus(message('controls.shareCopied', 'Portfolio link copied.'));
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showSidebarStatus(message('controls.shareFailed', 'Could not share. Please try again.'));
      }
    }
  });

  /**
   * Static contact form submit
   */
  document.querySelectorAll('.php-email-form').forEach(function(contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      let thisForm = this;
      let action = thisForm.getAttribute('action');
      let loading = thisForm.querySelector('.loading');
      let errorMessage = thisForm.querySelector('.error-message');
      let sentMessage = thisForm.querySelector('.sent-message');

      function resetCaptcha() {
        if (window.hcaptcha && typeof window.hcaptcha.reset === 'function') {
          window.hcaptcha.reset();
        }
      }

      if (!action) {
        errorMessage.textContent = message('contact.form.errorActionMissing', 'The form action property is not set!');
        errorMessage.classList.add('d-block');
        return;
      }

      errorMessage.classList.remove('d-block');
      sentMessage.classList.remove('d-block');

      let captchaResponse = thisForm.querySelector('textarea[name="h-captcha-response"]');
      if (!captchaResponse || !captchaResponse.value.trim()) {
        errorMessage.textContent = message('contact.form.errorCaptchaMissing', 'Please complete the captcha before sending your message.');
        errorMessage.classList.add('d-block');
        return;
      }

      loading.classList.add('d-block');

      fetch(action, {
        method: 'POST',
        body: new FormData(thisForm),
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        loading.classList.remove('d-block');

        if (data.success) {
          sentMessage.classList.add('d-block');
          thisForm.reset();
          resetCaptcha();
        } else {
          resetCaptcha();
          throw new Error(data.message || message('contact.form.errorSubmissionFailed', 'Form submission failed.'));
        }
      })
      .catch(error => {
        loading.classList.remove('d-block');
        resetCaptcha();
        errorMessage.textContent = error.message || error;
        errorMessage.classList.add('d-block');
      });
    });
  });

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      disable: false,
      mirror: false
    });
  }
  onLoad(aosInit);
  ['resume:rendered', 'professional:rendered', 'services:rendered', 'portfolio:rendered'].forEach((eventName) => {
    window.addEventListener(eventName, () => {
      AOS.refreshHard?.();
    });
  });

  /**
   * Init typed.js
   */
  let typedInstance;

  function initTyped() {
    const selectTyped = document.querySelector('.typed');
    if (selectTyped) {
      if (typedInstance) {
        typedInstance.destroy();
      }

      let typed_strings = selectTyped.getAttribute('data-typed-items');
      typed_strings = typed_strings.split(',');

      typedInstance = new Typed('.typed', {
        strings: typed_strings,
        loop: true,
        typeSpeed: 100,
        backSpeed: 50,
        backDelay: 2000
      });
    }
  }

  (window.i18nReady || Promise.resolve()).then(initTyped);
  window.addEventListener('i18n:changed', initTyped);

  /**
   * Animate the skills items on reveal
   */
  function animateSkills() {
    document.querySelectorAll('.skills-animation .progress .progress-bar').forEach(el => {
      el.style.width = el.getAttribute('aria-valuenow') + '%';
    });
  }

  (window.skillsReady || Promise.resolve()).then(() => {
    document.querySelectorAll('.skills-animation').forEach((item) => {
      new Waypoint({
        element: item,
        offset: '80%',
        handler: animateSkills
      });
    });
    animateSkills();
  });

  window.addEventListener('skills:rendered', animateSkills);

  /**
   * Init isotope layout and filters
   */
  (window.portfolioReady || Promise.resolve()).then(() => {
    document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
      let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
      let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
      let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

      let initIsotope;
      const isotopeContainer = isotopeItem.querySelector('.isotope-container');

      function currentFilter() {
        return isotopeItem.querySelector('.isotope-filters .filter-active')?.getAttribute('data-filter') || filter;
      }

      function arrangeIsotope(reloadItems = false) {
        imagesLoaded(isotopeContainer, function() {
          if (!initIsotope) {
            initIsotope = new Isotope(isotopeContainer, {
              itemSelector: '.isotope-item',
              layoutMode: layout,
              filter: currentFilter(),
              sortBy: sort
            });
            return;
          }

          if (reloadItems) {
            initIsotope.reloadItems();
          }

          initIsotope.arrange({
            filter: currentFilter()
          });
        });
      }

      arrangeIsotope(true);

      isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
        filters.addEventListener('keydown', function(event) {
          if (event.key !== 'Enter' && event.key !== ' ') return;

          event.preventDefault();
          this.click();
        });

        filters.addEventListener('click', function() {
          isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
          this.classList.add('filter-active');
          arrangeIsotope();
        }, false);
      });

      window.addEventListener('portfolio:rendered', () => arrangeIsotope(true));
    });
  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  onLoad(initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  onLoad(function() {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');
  let currentActive = document.querySelector('.navmenu a.active');

  function setActiveNavLink(activeLink) {
    if (currentActive === activeLink) return;

    currentActive?.classList.remove('active');
    activeLink?.classList.add('active');
    currentActive = activeLink || null;
  }

  function navmenuScrollspy() {
    let activeLink = null;

    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        activeLink = navmenulink;
      }
    })

    setActiveNavLink(activeLink);
  }
  onLoad(navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy, { passive: true });

})();
