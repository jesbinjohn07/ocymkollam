/* ==========================================================================
   OCYM Kollam Diocese — Gallery Page Script
   Fetches albums from the Google Apps Script API and renders them.
   Handles: loading, error, album cards, photo grid, lightbox.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     MODULE STATE
  ------------------------------------------------------------------ */
  /** @type {Array<{title: string, date: string, photos: Array<{name: string, url: string}>}>} */
  let galleryData = [];

  // Lightbox state
  let lbAlbumPhotos = [];   // photos of the currently open album
  let lbCurrentIndex = 0;   // index of the currently shown photo
  let lbIsTransitioning = false;

  // Touch / swipe state
  let touchStartX = 0;
  let touchEndX = 0;

  /* ------------------------------------------------------------------
     DOM REFERENCES (resolved after DOMContentLoaded)
  ------------------------------------------------------------------ */
  let container, loadingEl, lightbox, lbImage, lbCounter,
      lbPrevBtn, lbNextBtn, lbCloseBtn, lbBackdrop, lbImageWrap;

  /* ------------------------------------------------------------------
     ENTRY POINT
  ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    container    = document.getElementById('galleryContainer');
    loadingEl    = document.getElementById('galleryLoading');
    lightbox     = document.getElementById('galleryLightbox');
    lbImage      = document.getElementById('lbImage');
    lbCounter    = document.getElementById('lbCounter');
    lbPrevBtn    = document.getElementById('lbPrevBtn');
    lbNextBtn    = document.getElementById('lbNextBtn');
    lbCloseBtn   = document.getElementById('lbCloseBtn');
    lbBackdrop   = document.getElementById('lbBackdrop');
    lbImageWrap  = document.getElementById('lbImageWrap');

    initLightboxEvents();
    fetchGallery();
  });

  /* ------------------------------------------------------------------
     1. FETCH
  ------------------------------------------------------------------ */
  function fetchGallery() {
    showLoading();

    const apiUrl = (window.GALLERY_API_URL || '').trim();
    if (!apiUrl) {
      showError('Gallery configuration is missing. Please contact the administrator.');
      return;
    }

    fetch(apiUrl)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Network response was not OK (' + response.status + ')');
        }
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error('Unexpected data format from API.');
        }
        galleryData = data;
        renderGallery(galleryData);
      })
      .catch(function (err) {
        console.error('[Gallery] Fetch error:', err);
        showError('Unable to load the gallery right now.');
      });
  }

  /* ------------------------------------------------------------------
     2. RENDER
  ------------------------------------------------------------------ */
  function renderGallery(albums) {
    hideLoading();

    if (!albums || albums.length === 0) {
      showEmpty();
      return;
    }

    // Sort: newest first by date
    const sorted = sortAlbumsByDate(albums);

    // Build DOM
    const fragment = document.createDocumentFragment();

    sorted.forEach(function (album, index) {
      const albumEl = renderAlbum(album, index);
      fragment.appendChild(albumEl);

      // Separator between albums (not after the last one)
      if (index < sorted.length - 1) {
        const hr = document.createElement('hr');
        hr.className = 'album-separator';
        hr.setAttribute('aria-hidden', 'true');
        fragment.appendChild(hr);
      }
    });

    // Replace loading placeholder with album content
    container.innerHTML = '';
    container.appendChild(fragment);
  }

  /* ------------------------------------------------------------------
     3. RENDER SINGLE ALBUM
  ------------------------------------------------------------------ */
  function renderAlbum(album, albumIndex) {
    const title  = safeText(album.title  || 'Untitled Album');
    const date   = safeText(album.date   || '');
    const photos = Array.isArray(album.photos) ? album.photos : [];

    // Album card wrapper
    const card = document.createElement('article');
    card.className = 'album-card';
    card.setAttribute('aria-label', 'Album: ' + title);

    // Card body
    const body = document.createElement('div');
    body.className = 'album-card-body';

    // Header: title + date
    const header = document.createElement('div');
    header.className = 'album-header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'album-title';
    titleEl.textContent = title;

    header.appendChild(titleEl);

    if (date) {
      const dateEl = document.createElement('div');
      dateEl.className = 'album-date';
      dateEl.innerHTML = '<span class="album-date-icon" aria-hidden="true">📅</span><span>' + date + '</span>';
      header.appendChild(dateEl);
    }

    body.appendChild(header);

    // Photo grid
    const grid = document.createElement('div');
    grid.className = 'album-photo-grid';
    grid.setAttribute('role', 'list');

    if (photos.length === 0) {
      const noPhotos = document.createElement('p');
      noPhotos.className = 'album-no-photos';
      noPhotos.textContent = 'No photos available for this album.';
      grid.appendChild(noPhotos);
    } else {
      photos.forEach(function (photo, photoIndex) {
        const item = buildPhotoItem(photo, photoIndex, photos, title);
        grid.appendChild(item);
      });
    }

    body.appendChild(grid);
    card.appendChild(body);

    return card;
  }

  /* ------------------------------------------------------------------
     4. BUILD PHOTO THUMBNAIL
  ------------------------------------------------------------------ */
  function buildPhotoItem(photo, photoIndex, allPhotos, albumTitle) {
    const photoName = safeText(photo.name || ('Photo ' + (photoIndex + 1)));
    const photoUrl  = (photo.url || '').trim();
    const altText   = albumTitle + ' — ' + photoName;

    // Wrapper (acts as button for keyboard/mouse interaction)
    const item = document.createElement('div');
    item.className = 'album-photo-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', 'View ' + altText);

    if (!photoUrl) {
      // No URL — hide the item entirely
      item.style.display = 'none';
      return item;
    }

    const img = document.createElement('img');
    img.alt     = altText;
    img.loading = 'lazy';
    img.decoding = 'async';

    // Handle broken images: hide the parent item gracefully
    img.addEventListener('error', function () {
      item.style.display = 'none';
    });

    img.src = photoUrl;
    item.appendChild(img);

    // Click: open lightbox
    item.addEventListener('click', function () {
      openLightbox(allPhotos, photoIndex, albumTitle);
    });

    // Keyboard: Enter or Space opens lightbox
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(allPhotos, photoIndex, albumTitle);
      }
    });

    return item;
  }

  /* ------------------------------------------------------------------
     5. SORT ALBUMS — newest first
  ------------------------------------------------------------------ */
  function sortAlbumsByDate(albums) {
    // We attempt to parse the date strings. Fall back to original order.
    return albums.slice().sort(function (a, b) {
      const dateA = parseDateString(a.date || '');
      const dateB = parseDateString(b.date || '');

      // If both parse, sort descending
      if (dateA && dateB) return dateB - dateA;
      // If only one parses, put the one that parsed first
      if (dateA) return -1;
      if (dateB) return 1;
      return 0; // keep original order if neither parses
    });
  }

  /**
   * Tries to parse common date string formats like:
   * "16 May 2026", "May 16, 2026", "2026-05-16"
   * Returns a Date object or null.
   */
  function parseDateString(str) {
    if (!str) return null;
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    } catch (_) {}
    return null;
  }

  /* ------------------------------------------------------------------
     6. LIGHTBOX — OPEN
  ------------------------------------------------------------------ */
  /**
   * @param {Array<{name: string, url: string}>} photos  — album's photo array
   * @param {number} startIndex — index to open first
   * @param {string} albumTitle — used for alt text
   */
  function openLightbox(photos, startIndex, albumTitle) {
    // Filter to only photos with valid URLs (mirrors what we rendered)
    lbAlbumPhotos = photos.filter(function (p) { return (p.url || '').trim(); });
    lbCurrentIndex = Math.max(0, Math.min(startIndex, lbAlbumPhotos.length - 1));

    // Correct the index if filtered list is smaller (hidden broken images)
    // We try to match url-by-url
    const clickedUrl = (photos[startIndex] || {}).url;
    if (clickedUrl) {
      const filtered = lbAlbumPhotos.findIndex(function (p) { return p.url === clickedUrl; });
      if (filtered !== -1) lbCurrentIndex = filtered;
    }

    lightbox._albumTitle = albumTitle || '';

    document.body.classList.add('gallery-lb-open');
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('lb-open');

    loadLightboxPhoto(lbCurrentIndex, false);

    // Focus close button for accessibility
    setTimeout(function () { if (lbCloseBtn) lbCloseBtn.focus(); }, 50);
  }

  /* ------------------------------------------------------------------
     7. LIGHTBOX — CLOSE
  ------------------------------------------------------------------ */
  function closeLightbox() {
    lightbox.classList.remove('lb-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gallery-lb-open');

    // Clear image after transition
    setTimeout(function () {
      lbImage.src = '';
      lbImage.alt = '';
    }, 300);
  }

  /* ------------------------------------------------------------------
     8. LIGHTBOX — LOAD PHOTO
  ------------------------------------------------------------------ */
  function loadLightboxPhoto(index, animate) {
    if (!lbAlbumPhotos.length) return;

    const photo = lbAlbumPhotos[index];
    if (!photo) return;

    const albumTitle = lightbox._albumTitle || '';
    const photoNum   = index + 1;
    const total      = lbAlbumPhotos.length;
    const altText    = albumTitle
      ? albumTitle + ' — Photo ' + photoNum
      : 'Photo ' + photoNum;

    // Update counter
    lbCounter.textContent = photoNum + ' / ' + total;

    // Update nav button states
    lbPrevBtn.disabled = (index === 0);
    lbNextBtn.disabled = (index === total - 1);
    lbPrevBtn.setAttribute('aria-disabled', index === 0 ? 'true' : 'false');
    lbNextBtn.setAttribute('aria-disabled', index === total - 1 ? 'true' : 'false');

    if (animate && !lbIsTransitioning) {
      lbIsTransitioning = true;
      lbImageWrap.classList.add('lb-transitioning');

      setTimeout(function () {
        lbImage.src = '';
        lbImage.alt = altText;
        lbImage.src = photo.url;

        lbImageWrap.classList.remove('lb-transitioning');
        lbIsTransitioning = false;
      }, 200);
    } else {
      lbImage.src = '';
      lbImage.alt = altText;
      lbImage.src = photo.url;
    }
  }

  /* ------------------------------------------------------------------
     9. LIGHTBOX — NAVIGATION
  ------------------------------------------------------------------ */
  function showNextPhoto() {
    if (lbCurrentIndex < lbAlbumPhotos.length - 1) {
      lbCurrentIndex++;
      loadLightboxPhoto(lbCurrentIndex, true);
    }
  }

  function showPreviousPhoto() {
    if (lbCurrentIndex > 0) {
      lbCurrentIndex--;
      loadLightboxPhoto(lbCurrentIndex, true);
    }
  }

  /* ------------------------------------------------------------------
     10. LIGHTBOX — EVENTS
  ------------------------------------------------------------------ */
  function initLightboxEvents() {
    // Close button
    lbCloseBtn.addEventListener('click', closeLightbox);

    // Backdrop click
    lbBackdrop.addEventListener('click', closeLightbox);

    // Prev / Next buttons
    lbPrevBtn.addEventListener('click', showPreviousPhoto);
    lbNextBtn.addEventListener('click', showNextPhoto);

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('lb-open')) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeLightbox();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          showPreviousPhoto();
          break;
        case 'ArrowRight':
          e.preventDefault();
          showNextPhoto();
          break;
      }
    });

    // Touch swipe (mobile)
    lightbox.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const diff = touchStartX - touchEndX;
    const threshold = 50; // minimum px to count as a swipe

    if (Math.abs(diff) < threshold) return;

    if (diff > 0) {
      // Swiped left → next photo
      showNextPhoto();
    } else {
      // Swiped right → previous photo
      showPreviousPhoto();
    }
  }

  /* ------------------------------------------------------------------
     11. UI STATE HELPERS
  ------------------------------------------------------------------ */
  function showLoading() {
    if (!container) return;
    container.innerHTML = '';

    const loading = document.createElement('div');
    loading.className = 'gallery-loading';
    loading.id = 'galleryLoading';
    loading.setAttribute('aria-live', 'polite');
    loading.setAttribute('aria-label', 'Loading gallery');
    loading.innerHTML = [
      '<div class="gallery-loading-dots" aria-hidden="true">',
      '  <span></span><span></span><span></span>',
      '</div>',
      '<p class="gallery-loading-text">Loading gallery\u2026</p>'
    ].join('');

    container.appendChild(loading);
  }

  function hideLoading() {
    if (!container) return;
    const existing = container.querySelector('.gallery-loading');
    if (existing) existing.remove();
  }

  function showError(message) {
    hideLoading();
    if (!container) return;

    const safe = safeText(message);

    const errDiv = document.createElement('div');
    errDiv.className = 'gallery-error';
    errDiv.setAttribute('role', 'alert');
    errDiv.innerHTML = [
      '<div class="gallery-error-icon" aria-hidden="true">📷</div>',
      '<p class="gallery-error-text">' + safe + '</p>',
      '<button class="gallery-retry-btn" id="galleryRetryBtn">Try Again</button>'
    ].join('');

    container.appendChild(errDiv);

    const retryBtn = container.querySelector('#galleryRetryBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', fetchGallery);
    }
  }

  function showEmpty() {
    if (!container) return;

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'gallery-error';
    emptyDiv.innerHTML = [
      '<div class="gallery-error-icon" aria-hidden="true">🖼️</div>',
      '<p class="gallery-error-text">No albums have been added yet. Check back soon!</p>'
    ].join('');

    container.appendChild(emptyDiv);
  }

  /* ------------------------------------------------------------------
     12. UTILITY
  ------------------------------------------------------------------ */
  /**
   * Safely encode a string for insertion as text content.
   * Prevents XSS when using innerHTML.
   */
  function safeText(str) {
    const el = document.createElement('span');
    el.textContent = String(str);
    return el.innerHTML;
  }

})();
