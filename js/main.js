/* ==========================================================================
   OCYM Kollam Diocese - Core Web Application Script
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initRegistrationToggle();
  initStickyHeader();
  initMobileMenu();
  initScrollAnimations();
  initBackToTop();
});

/* ==========================================================================
   1. Dynamic Registration Configuration Toggle
   ========================================================================== */
function initRegistrationToggle() {
  const isRegistrationActive = !!(window.SHOW_REGISTRATION);
  const navMenus = document.querySelectorAll(".nav-menu");
  const regButtons = document.querySelectorAll(".registration-cta");

  // Handle header navigation link
  navMenus.forEach(menu => {
    let existingRegLink = menu.querySelector('a[href="registration.html"]');

    if (isRegistrationActive) {
      if (!existingRegLink) {
        const li = document.createElement("li");
        const currentPage = window.location.pathname.split("/").pop();
        const isActive = currentPage === "registration.html" ? "active" : "";
        li.innerHTML = `<a href="registration.html" class="nav-link nav-reg-btn ${isActive}">Registration</a>`;
        
        // Insert before Contact link if present, else append
        const contactLi = Array.from(menu.children).find(child => child.querySelector('a[href="contact.html"]'));
        if (contactLi) {
          menu.insertBefore(li, contactLi);
        } else {
          menu.appendChild(li);
        }
      } else {
        existingRegLink.parentElement.style.display = "block";
      }
    } else {
      if (existingRegLink) {
        existingRegLink.parentElement.style.display = "none";
      }
    }
  });

  // Handle CTA buttons across Hero and Quick Links
  regButtons.forEach(btn => {
    if (isRegistrationActive) {
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
