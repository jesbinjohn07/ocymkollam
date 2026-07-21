/* ==========================================================================
   OCYM Kollam Diocese - Dynamic Homepage Image Slider
   ========================================================================== */

(function() {
  document.addEventListener("DOMContentLoaded", () => {
    initHomepageSlider();
  });

  function initHomepageSlider() {
    const sliderSection = document.getElementById("homepageSliderSection");
    const sliderWrapper = document.getElementById("sliderWrapper");
    const sliderDots = document.getElementById("sliderDots");
    const prevBtn = document.getElementById("sliderPrevBtn");
    const nextBtn = document.getElementById("sliderNextBtn");

    if (!sliderSection || !sliderWrapper) return;

    const apiUrl = window.SLIDER_API_URL || "https://script.google.com/macros/s/AKfycbzCwEngUV4q6tQMkYq4fNg1ugV20c1evz7Z-m9JHODkMh3k-0ejwHkIApHnpGlZ4CSq/exec";

    if (!apiUrl || apiUrl.trim() === "enter url") {
      sliderSection.style.display = "none";
      return;
    }

    // Fetch dynamic slides from Apps Script JSON endpoint
    fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error("Slider API HTTP status " + res.status);
        return res.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          // Hide slider section automatically if no data returned
          sliderSection.style.display = "none";
          return;
        }

        // Normalize JSON item field names (supports multiple variations from Apps Script)
        const formattedSlides = data.map(item => {
          const imgUrl = item.url || item.imageUrl || item.image || item.Image || item["Image URL"] || item.img || "";
          const title = item.title || item.eventTitle || item.Title || item["Event Title"] || "";
          const caption = item.caption || item.description || item.Description || item.Caption || item["Caption"] || "";

          return {
            url: imgUrl,
            title: title,
            caption: caption
          };
        }).filter(slide => slide.url && slide.url.trim() !== "");

        if (formattedSlides.length === 0) {
          sliderSection.style.display = "none";
          return;
        }

        renderSlider(formattedSlides);
      })
      .catch(err => {
        console.warn("Homepage slider dynamic fetch error:", err);
        // Gracefully hide slider on failure without leaving empty space
        sliderSection.style.display = "none";
      });

    function renderSlider(slides) {
      sliderSection.style.display = "block";
      sliderWrapper.innerHTML = "";
      if (sliderDots) sliderDots.innerHTML = "";

      let currentIndex = 0;
      let slideInterval = null;

      slides.forEach((slide, idx) => {
        // Create Slide Element
        const slideEl = document.createElement("div");
        slideEl.className = `slide-item ${idx === 0 ? "active" : ""}`;
        
        slideEl.innerHTML = `
          <div class="slide-img-wrapper">
            <img class="slide-img" src="${slide.url}" alt="${slide.title || 'OCYM Event'}" loading="${idx === 0 ? 'eager' : 'lazy'}">
            <div class="slide-overlay"></div>
          </div>
          ${(slide.title || slide.caption) ? `
          <div class="slide-caption-box">
            <div class="container">
              <div class="slide-caption-inner">
                ${slide.title ? `<h3 class="slide-title">${slide.title}</h3>` : ''}
                ${slide.caption ? `<p class="slide-desc">${slide.caption}</p>` : ''}
              </div>
            </div>
          </div>
          ` : ''}
        `;

        sliderWrapper.appendChild(slideEl);

        // Create Pagination Dot Element
        if (sliderDots && slides.length > 1) {
          const dotEl = document.createElement("div");
          dotEl.className = `slider-dot ${idx === 0 ? "active" : ""}`;
          dotEl.setAttribute("aria-label", `Go to slide ${idx + 1}`);
          dotEl.addEventListener("click", () => {
            goToSlide(idx);
            resetAutoPlay();
          });
          sliderDots.appendChild(dotEl);
        }
      });

      const slideItems = sliderWrapper.querySelectorAll(".slide-item");
      const dotItems = sliderDots ? sliderDots.querySelectorAll(".slider-dot") : [];

      if (slides.length <= 1) {
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
        if (sliderDots) sliderDots.style.display = "none";
        return;
      } else {
        if (prevBtn) prevBtn.style.display = "flex";
        if (nextBtn) nextBtn.style.display = "flex";
        if (sliderDots) sliderDots.style.display = "flex";
      }

      function goToSlide(index) {
        slideItems[currentIndex].classList.remove("active");
        if (dotItems[currentIndex]) dotItems[currentIndex].classList.remove("active");

        currentIndex = (index + slides.length) % slides.length; // Infinite looping

        slideItems[currentIndex].classList.add("active");
        if (dotItems[currentIndex]) dotItems[currentIndex].classList.add("active");
      }

      function nextSlide() {
        goToSlide(currentIndex + 1);
      }

      function prevSlide() {
        goToSlide(currentIndex - 1);
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          nextSlide();
          resetAutoPlay();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          prevSlide();
          resetAutoPlay();
        });
      }

      // Autoplay every 5.5 seconds
      function startAutoPlay() {
        if (slides.length > 1) {
          slideInterval = setInterval(nextSlide, 5500);
        }
      }

      function stopAutoPlay() {
        if (slideInterval) clearInterval(slideInterval);
      }

      function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
      }

      startAutoPlay();

      sliderSection.addEventListener("mouseenter", stopAutoPlay);
      sliderSection.addEventListener("mouseleave", startAutoPlay);

      // Mobile Touch & Swipe Gestures
      let touchStartX = 0;
      let touchEndX = 0;

      sliderSection.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      sliderSection.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });

      function handleSwipe() {
        const threshold = 35;
        if (touchEndX < touchStartX - threshold) {
          nextSlide();
          resetAutoPlay();
        } else if (touchEndX > touchStartX + threshold) {
          prevSlide();
          resetAutoPlay();
        }
      }
    }
  }
})();
