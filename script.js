(() => {
  "use strict";

  const body = document.body;
  const loader = document.querySelector(".page-loader");
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const backTop = document.querySelector(".back-top-floating");
  const themeButton = document.querySelector(".theme-toggle");
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".primary-nav");
  const lightbox = document.querySelector(".lightbox");
  const lightboxImage = lightbox.querySelector("figure img");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const closeMenu = () => {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  };

  const updateScrollUI = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0}%`;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
    backTop.classList.toggle("is-visible", window.scrollY > 550);
  };
  window.addEventListener("scroll", updateScrollUI, { passive: true });
  updateScrollUI();

  const finishLoading = () => {
    window.setTimeout(() => {
      loader.classList.add("is-done");
      body.classList.remove("is-loading");
    }, reducedMotion ? 0 : 350);
  };
  if (document.readyState === "complete") finishLoading();
  else window.addEventListener("load", finishLoading, { once: true });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-revealed"));
  }

  try {
    if (localStorage.getItem("kavya-theme") === "dark") {
      body.classList.add("dark-mode");
      themeButton.setAttribute("aria-label", "Switch to light mode");
    }
  } catch (error) {
    console.warn("Theme preference could not be restored.", error);
  }
  themeButton.addEventListener("click", () => {
    const isDark = body.classList.toggle("dark-mode");
    themeButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    try {
      localStorage.setItem("kavya-theme", isDark ? "dark" : "light");
    } catch (error) {
      console.warn("Theme preference could not be saved.", error);
    }
  });

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    nav.classList.toggle("is-open", isOpen);
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const stats = document.querySelectorAll("[data-count]");
  const animateCounter = (element) => {
    const target = Number(element.dataset.count);
    if (reducedMotion) {
      element.textContent = `${target}+`;
      return;
    }
    const start = performance.now();
    const duration = 1300;
    const tick = (now) => {
      const progressValue = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progressValue, 4);
      element.textContent = `${Math.round(target * eased)}+`;
      if (progressValue < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    stats.forEach((stat) => statsObserver.observe(stat));
  } else stats.forEach(animateCounter);

  const filterButtons = document.querySelectorAll(".filter-button");
  const galleryCards = [...document.querySelectorAll(".gallery-card")];
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      galleryCards.forEach((card) => {
        const shouldShow = button.dataset.filter === "all" || card.dataset.category === button.dataset.filter;
        card.classList.toggle("is-hidden", !shouldShow);
      });
    });
  });

  let currentImage = 0;
  let isZoomed = false;
  let touchStartX = null;
  const galleryOpenButtons = galleryCards.map((card) => card.querySelector(".gallery-open"));
  const closeLightboxButton = lightbox.querySelector(".lightbox-close");

  const setLightboxImage = (index) => {
    currentImage = (index + galleryCards.length) % galleryCards.length;
    const card = galleryCards[currentImage];
    const source = card.dataset.image;
    lightboxImage.src = `https://images.unsplash.com/${source}?auto=format&fit=max&w=2000&q=90`;
    lightboxImage.alt = card.querySelector("img").alt;
    lightbox.querySelector(".lightbox-category").textContent = card.dataset.categoryLabel;
    lightbox.querySelector(".lightbox-title").textContent = card.dataset.title;
    lightbox.querySelector(".lightbox-caption").textContent = card.dataset.description;
    lightbox.querySelector(".lightbox-counter").textContent = `${String(currentImage + 1).padStart(2, "0")} / ${String(galleryCards.length).padStart(2, "0")}`;
    lightboxImage.style.transform = "scale(1)";
    isZoomed = false;
  };
  const openLightbox = (index) => {
    setLightboxImage(index);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
    closeLightboxButton.focus();
  };
  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
    galleryOpenButtons[currentImage].focus();
  };
  galleryOpenButtons.forEach((button, index) => button.addEventListener("click", () => openLightbox(index)));
  closeLightboxButton.addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox-prev").addEventListener("click", () => setLightboxImage(currentImage - 1));
  lightbox.querySelector(".lightbox-next").addEventListener("click", () => setLightboxImage(currentImage + 1));
  lightbox.querySelector(".zoom-button").addEventListener("click", (event) => {
    isZoomed = !isZoomed;
    lightboxImage.style.transform = isZoomed ? "scale(1.65)" : "scale(1)";
    lightboxImage.style.cursor = isZoomed ? "zoom-out" : "zoom-in";
    event.currentTarget.textContent = isZoomed ? "ZOOM −" : "ZOOM +";
  });
  lightbox.querySelector(".fullscreen-button").addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await lightbox.requestFullscreen();
      else await document.exitFullscreen();
    } catch (error) {
      console.error("Fullscreen mode is unavailable.", error);
    }
  });
  lightbox.querySelector(".download-button").addEventListener("click", () => {
    document.querySelector(".dialog-message").textContent = "Image downloads are not available in this portfolio demonstration.";
    showDialog();
  });
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const difference = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(difference) > 55) setLightboxImage(currentImage + (difference < 0 ? 1 : -1));
    touchStartX = null;
  }, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") setLightboxImage(currentImage - 1);
    if (event.key === "ArrowRight") setLightboxImage(currentImage + 1);
  });

  const slides = [...document.querySelectorAll(".testimonial-slide")];
  let currentSlide = 0;
  let sliderTimer;
  const showSlide = (index) => {
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("is-current", i === currentSlide));
    document.querySelector(".current-slide").textContent = String(currentSlide + 1).padStart(2, "0");
  };
  const resetSliderTimer = () => {
    window.clearInterval(sliderTimer);
    if (!reducedMotion) sliderTimer = window.setInterval(() => showSlide(currentSlide + 1), 6500);
  };
  document.querySelector(".testimonial-prev").addEventListener("click", () => {
    showSlide(currentSlide - 1);
    resetSliderTimer();
  });
  document.querySelector(".testimonial-next").addEventListener("click", () => {
    showSlide(currentSlide + 1);
    resetSliderTimer();
  });
  resetSliderTimer();

  const dialog = document.querySelector(".site-dialog");
  const showDialog = () => {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else window.alert(document.querySelector(".dialog-message").textContent);
  };
  const closeDialog = () => dialog.close();
  dialog.querySelector(".dialog-close").addEventListener("click", closeDialog);
  dialog.querySelector(".dialog-confirm").addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  document.querySelector("#booking-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    document.querySelector(".dialog-message").textContent = "Your note is safely here in this demo. No message has been sent, but in a real studio, this is where the magic would begin.";
    showDialog();
    event.currentTarget.reset();
  });
  document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    document.querySelector(".dialog-message").textContent = "You're on the list—in this demo, at least. No email address is stored and no newsletter will be sent.";
    showDialog();
    event.currentTarget.reset();
  });
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" }));
})();
