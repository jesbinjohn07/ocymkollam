/* ==========================================================================
   OCYM Kollam Diocese - Core Web Application Script
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initDynamicNavigation();
  initStickyHeader();
  initMobileMenu();
  initScrollAnimations();
  initBackToTop();
});

/* ==========================================================================
   1. Dynamic Header Navigation Injection
   ========================================================================== */
function initDynamicNavigation() {
  const navMenus = document.querySelectorAll(".nav-menu");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  navMenus.forEach(menu => {
    menu.innerHTML = ""; // Clear existing static list items

    // 1. Home
    const homeLi = document.createElement("li");
    const isHomeActive = (currentPage === "index.html" || currentPage === "") ? "active" : "";
    homeLi.innerHTML = `<a href="index.html" class="nav-link ${isHomeActive}">Home</a>`;
    menu.appendChild(homeLi);

    // 2. About
    const aboutLi = document.createElement("li");
    const isAboutActive = (currentPage === "about.html") ? "active" : "";
    aboutLi.innerHTML = `<a href="about.html" class="nav-link ${isAboutActive}">About</a>`;
    menu.appendChild(aboutLi);

    // 3. Programs
    const programsLi = document.createElement("li");
    const isProgramsActive = (currentPage === "programs.html") ? "active" : "";
    programsLi.innerHTML = `<a href="programs.html" class="nav-link ${isProgramsActive}">Programs</a>`;
    menu.appendChild(programsLi);

    // 4. Circulars
    const noticeLi = document.createElement("li");
    const isNoticeActive = (currentPage === "notice.html") ? "active" : "";
    noticeLi.innerHTML = `<a href="notice.html" class="nav-link ${isNoticeActive}">Circulars</a>`;
    menu.appendChild(noticeLi);

    // 5. Yuvadarshanam
    const yuvadarshanamLi = document.createElement("li");
    const isYuvadarshanamActive = (currentPage === "yuvadarshanam.html") ? "active" : "";
    yuvadarshanamLi.innerHTML = `<a href="yuvadarshanam.html" class="nav-link ${isYuvadarshanamActive}">Yuvadarshanam</a>`;
    menu.appendChild(yuvadarshanamLi);

    // 6. Contact
    const contactLi = document.createElement("li");
    const isContactActive = (currentPage === "contact.html") ? "active" : "";
    contactLi.innerHTML = `<a href="contact.html" class="nav-link ${isContactActive}">Contact</a>`;
    menu.appendChild(contactLi);

    // 7. Blood Bank (External Link in New Tab)
    const bloodBankLi = document.createElement("li");
    bloodBankLi.innerHTML = `<a href="https://www.ocymraktadhan.online/" target="_blank" rel="noopener" class="nav-link">Blood Bank <svg style="display: inline-block; vertical-align: middle; margin-left: 4px; fill: none; stroke: currentColor; stroke-width: 2.5;" width="11" height="11" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>`;
    menu.appendChild(bloodBankLi);

    // 8. Registration (Only if active)
    if (window.SHOW_REGISTRATION) {
      const regLi = document.createElement("li");
      const isRegActive = (currentPage === "registration.html") ? "active" : "";
      regLi.innerHTML = `<a href="registration.html" class="nav-link nav-reg-btn ${isRegActive}">Registration</a>`;
      menu.appendChild(regLi);
    }
  });

  // Handle CTA buttons across Hero and Quick Links
  const regButtons = document.querySelectorAll(".registration-cta");
  regButtons.forEach(btn => {
    if (window.SHOW_REGISTRATION) {
      btn.style.display = "inline-flex";
    } else {
      btn.style.display = "none";
    }
  });
}

/* ==========================================================================
   2. Sticky Header & Glassmorphism Transition
   ========================================================================== */
function initStickyHeader() {
  const header = document.querySelector(".header-wrapper");
  if (!header) return;

  const toggleSticky = () => {
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  toggleSticky();
  window.addEventListener("scroll", toggleSticky);
}

/* ==========================================================================
   3. Mobile Drawer Navigation
   ========================================================================== */
function initMobileMenu() {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  if (!hamburger || !navMenu) return;

  const toggleMenu = () => {
    const isExpanded = hamburger.getAttribute("aria-expanded") === "true";
    hamburger.setAttribute("aria-expanded", !isExpanded);
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
    
    // Prevent background scroll when mobile menu is open
    document.body.style.overflow = !isExpanded ? "hidden" : "";
  };

  hamburger.addEventListener("click", toggleMenu);

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (navMenu.classList.contains("active")) {
        toggleMenu();
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (
      navMenu.classList.contains("active") &&
      !navMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      toggleMenu();
    }
  });
}

/* ==========================================================================
   4. Scroll Reveal Animations & Animated Statistics
   ========================================================================== */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll(".reveal");
  
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add("visible"));
  }

  // Statistics counter triggers
  const statsSection = document.querySelector(".stats-section");
  const counters = document.querySelectorAll(".stat-number");

  if (statsSection && counters.length > 0 && "IntersectionObserver" in window) {
    let counted = false;

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !counted) {
          counted = true;
          startCounters();
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    statsObserver.observe(statsSection);
  } else if (counters.length > 0) {
    startCounters();
  }

  function startCounters() {
    counters.forEach(counter => {
      const targetStr = counter.getAttribute("data-target");
      const suffix = counter.getAttribute("data-suffix") || "";
      const target = parseInt(targetStr, 10);
      if (isNaN(target)) return;

      const duration = 2000;
      const frameDuration = 1000 / 60;
      const totalFrames = Math.round(duration / frameDuration);
      let frame = 0;

      const easeOutQuad = t => t * (2 - t);

      const animate = () => {
        frame++;
        const progress = easeOutQuad(frame / totalFrames);
        const currentValue = Math.round(target * progress);

        counter.innerText = currentValue + suffix;

        if (frame < totalFrames) {
          requestAnimationFrame(animate);
        } else {
          counter.innerText = target + suffix;
        }
      };

      animate();
    });
  }
}

// Make initScrollAnimations available globally for dynamically rendered items
window.initScrollAnimations = initScrollAnimations;

/* ==========================================================================
   5. Back to Top Button
   ========================================================================== */
function initBackToTop() {
  const backToTopBtn = document.querySelector(".back-to-top");
  if (!backToTopBtn) return;

  const toggleBackToTop = () => {
    if (window.scrollY > 350) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  };

  window.addEventListener("scroll", toggleBackToTop);

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}
