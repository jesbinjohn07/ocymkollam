/* ==========================================================================
   OCYM Kollam Diocese - Official Website Inauguration Module
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'ocymWebsiteLaunched';

  // DOM Element references
  let launchBtnWrap, launchBtn, launchedBanner;
  let confirmOverlay, confirmDialog, cancelBtn, proceedBtn;
  let ceremonyOverlay, srAnnounce;

  document.addEventListener('DOMContentLoaded', function () {
    initElements();
    if (!launchBtn) return; // Exit if inauguration elements are not on page

    checkLaunchState();
    bindEvents();
  });

  function initElements() {
    launchBtnWrap   = document.getElementById('inaugurationBtnWrap');
    launchBtn       = document.getElementById('inaugurateLaunchBtn');
    launchedBanner  = document.getElementById('inauguratedBanner');

    confirmOverlay  = document.getElementById('inaugConfirmOverlay');
    confirmDialog   = document.getElementById('inaugConfirmDialog');
    cancelBtn       = document.getElementById('inaugCancelBtn');
    proceedBtn      = document.getElementById('inaugProceedBtn');

    ceremonyOverlay = document.getElementById('inaugCeremony');
    srAnnounce      = document.getElementById('inaugSRAnnounce');
  }

  function isLaunched() {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  function checkLaunchState() {
    if (isLaunched()) {
      if (launchBtnWrap) launchBtnWrap.style.display = 'none';
      if (launchedBanner) launchedBanner.style.display = 'inline-flex';
    } else {
      if (launchBtnWrap) launchBtnWrap.style.display = 'flex';
      if (launchedBanner) launchedBanner.style.display = 'none';
    }
  }

  function bindEvents() {
    // Open confirmation dialog
    launchBtn.addEventListener('click', openConfirmDialog);

    // Cancel dialog
    cancelBtn.addEventListener('click', closeConfirmDialog);

    confirmOverlay.addEventListener('click', function (e) {
      if (e.target === confirmOverlay) {
        closeConfirmDialog();
      }
    });

    // Keyboard support for confirmation dialog
    document.addEventListener('keydown', function (e) {
      if (confirmOverlay.classList.contains('inaug-open') && e.key === 'Escape') {
        closeConfirmDialog();
      }
    });

    // Proceed with inauguration
    proceedBtn.addEventListener('click', function () {
      closeConfirmDialog();
      startCeremony();
    });
  }

  function openConfirmDialog() {
    confirmOverlay.classList.add('inaug-open');
    confirmOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    setTimeout(function () {
      if (proceedBtn) proceedBtn.focus();
    }, 50);
  }

  function closeConfirmDialog() {
    confirmOverlay.classList.remove('inaug-open');
    confirmOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function startCeremony() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    ceremonyOverlay.classList.add('inaug-ceremony-active');
    ceremonyOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Get elements inside ceremony
    const logoWrap    = ceremonyOverlay.querySelector('.inaug-logo-wrap');
    const lineOrg     = ceremonyOverlay.querySelector('.inaug-line-org');
    const lineWebsite = ceremonyOverlay.querySelector('.inaug-line-website');
    const lineMotto   = ceremonyOverlay.querySelector('.inaug-line-motto');
    const divider     = ceremonyOverlay.querySelector('.inaug-divider');
    const declaration = ceremonyOverlay.querySelector('.inaug-declaration');

    // Reset visibility classes
    const elementsToReset = [logoWrap, lineOrg, lineWebsite, lineMotto, divider, declaration];
    elementsToReset.forEach(function (el) {
      if (el) el.classList.remove('inaug-visible');
    });

    if (prefersReducedMotion) {
      // Immediate reveal for users preferring reduced motion
      elementsToReset.forEach(function (el) {
        if (el) el.classList.add('inaug-visible');
      });

      if (srAnnounce) {
        srAnnounce.textContent = 'Website Officially Launched — OCYM Kollam Diocese';
      }

      setTimeout(function () {
        finishCeremony();
      }, 3000);
      return;
    }

    // Step-by-step ceremonial reveal timeline
    const timeline = [
      { delay: 300,  el: logoWrap },
      { delay: 1100, el: lineOrg },
      { delay: 1800, el: lineWebsite },
      { delay: 2500, el: lineMotto },
      { delay: 3300, el: divider },
      { delay: 4100, el: declaration, action: function () {
          if (srAnnounce) {
            srAnnounce.textContent = 'Website Officially Launched — OCYM Kollam Diocese';
          }
        }
      }
    ];

    timeline.forEach(function (step) {
      setTimeout(function () {
        if (step.el) step.el.classList.add('inaug-visible');
        if (step.action) step.action();
      }, step.delay);
    });

    // Auto finish after 7.2 seconds
    setTimeout(function () {
      finishCeremony();
    }, 7200);
  }

  function finishCeremony() {
    ceremonyOverlay.classList.remove('inaug-ceremony-active');
    ceremonyOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Mark as launched in localStorage
    localStorage.setItem(STORAGE_KEY, 'true');
    checkLaunchState();
  }

  // Developer / Admin helper exposed globally
  window.resetInaugurationState = function () {
    localStorage.removeItem(STORAGE_KEY);
    checkLaunchState();
    console.log('[Inauguration] Launch state has been reset. Reload or click launch button to test again.');
  };
})();
