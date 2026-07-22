/* ==========================================================================
   OCYM Kollam Diocese - Programs Integration
   ========================================================================== */

(function() {
  const PROGRAMS_API = "https://script.google.com/macros/s/AKfycbzb9l6Ce2ShxIpJccCBZoPxZ-ZCEqyH2twcA5E_fIH2ohvaZGIxycEcF1jqQQ5GWaehaA/exec";
  let allPrograms = [];

  const homepageContainer = document.getElementById("homepageProgramsGrid");
  const homepageSection = document.getElementById("homepageProgramsSection");
  const pageContainer = document.getElementById("programsContainer");
  const searchInput = document.getElementById("searchInput");

  /* =========================
     FETCH PROGRAMS
     ========================= */
  fetch(PROGRAMS_API)
    .then(res => {
      if (!res.ok) throw new Error("HTTP status " + res.status);
      return res.json();
    })
    .then(data => {
      allPrograms = data || [];

      // Render Homepage Preview Grid if present
      if (homepageContainer && homepageSection) {
        if (allPrograms.length === 0) {
          homepageSection.style.display = "none";
        } else {
          homepageSection.style.display = "block";
          renderHomepagePrograms(allPrograms.slice(0, 3));
        }
      }

      // Render Dedicated Programs Page Grid if present
      if (pageContainer) {
        renderPagePrograms(allPrograms);
      }
    })
    .catch(err => {
      console.error("Programs load failed:", err);
      if (homepageSection) homepageSection.style.display = "none";
      if (pageContainer) {
        pageContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 40px; border-color: #ef4444;">
            <p style="color: #ef4444; font-weight: 600;">❌ Unable to load programs. Please check your connection.</p>
          </div>
        `;
      }
    });

  function formatProgramDate(dateStr) {
    if (!dateStr) return "Program";
    
    // Check if it's an ISO-8601 Date String
    if (typeof dateStr === "string" && dateStr.includes("T")) {
      const parts = dateStr.split("T");
      const datePart = parts[0]; // e.g. "2026-02-28"
      const ymd = datePart.split("-");
      if (ymd.length === 3) {
        const year = parseInt(ymd[0], 10);
        const month = parseInt(ymd[1], 10) - 1;
        const day = parseInt(ymd[2], 10);
        const localDate = new Date(year, month, day);
        if (!isNaN(localDate.getTime())) {
          return localDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          });
        }
      }
    }
    
    // Fallback normal parse
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }

    return dateStr;
  }

  /* =========================
     HOMEPAGE PREVIEW RENDER
     ========================= */
  function renderHomepagePrograms(items) {
    homepageContainer.innerHTML = "";
    items.forEach(p => {
      const imagePath = p.image || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80";
      const cleanTitle = p.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const formattedDate = formatProgramDate(p.date);
      const cleanDate = formattedDate.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const cleanDesc = p.description ? p.description.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";

      const card = document.createElement("div");
      card.className = "program-card reveal reveal-slide-up";
      card.onclick = () => openProgramModal(imagePath, cleanTitle, cleanDesc, p.year || "", cleanDate);
      card.innerHTML = `
        <div class="program-img-wrapper">
          <img class="program-img" loading="lazy" src="${imagePath}" alt="${cleanTitle}" onerror="this.src='https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80';">
          <div class="program-date-badge">📅 ${cleanDate}</div>
        </div>
        <div class="program-body">
          <h3 class="program-title">${cleanTitle}</h3>
          <p class="program-desc">${cleanDesc.substring(0, 110)}${cleanDesc.length > 110 ? '...' : ''}</p>
        </div>
      `;
      homepageContainer.appendChild(card);
    });

    if (window.initScrollAnimations) {
      window.initScrollAnimations();
    }
  }

  /* =========================
     DEDICATED PAGE ACCORDION RENDER
     ========================= */
  function renderPagePrograms(data) {
    pageContainer.innerHTML = "";

    if (!data || data.length === 0) {
      pageContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <p style="font-size: 1.1rem; color: var(--text-secondary);">📭 No programs found matching your search.</p>
        </div>
      `;
      return;
    }

    let years = {};
    data.forEach(item => {
      const yearKey = item.year || "General";
      if (!years[yearKey]) years[yearKey] = [];
      years[yearKey].push(item);
    });

    Object.keys(years)
      .sort()
      .reverse()
      .forEach((year, index) => {
        let cardsHtml = "";

        years[year].forEach(p => {
          const imagePath = p.image || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80";
          const cleanTitle = p.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
          const cleanDesc = p.description ? p.description.replace(/'/g, "\\'").replace(/"/g, '&quot;') : "";
          const formattedDate = formatProgramDate(p.date);
          const cleanDate = formattedDate.replace(/'/g, "\\'").replace(/"/g, '&quot;');

          cardsHtml += `
            <div class="program-card" onclick="openProgramModal('${imagePath}', '${cleanTitle}', '${cleanDesc}', '${year}', '${cleanDate}')">
              <div class="program-img-wrapper">
                <img class="program-img" loading="lazy" src="${imagePath}" alt="${p.title}" onerror="this.src='https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80';">
                <div class="program-date-badge">📅 ${cleanDate}</div>
              </div>
              <div class="program-body">
                <h3 class="program-title">${p.title}</h3>
                <p class="program-desc">${(p.description || '').substring(0, 100)}...</p>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--secondary); margin-top: 10px;">Tap for full details →</div>
              </div>
            </div>
          `;
        });

        const yearDiv = document.createElement("div");
        yearDiv.className = `year-block ${index === 0 ? "open" : ""}`;
        yearDiv.style.marginBottom = "30px";
        yearDiv.innerHTML = `
          <div class="card" style="margin-bottom: 16px; background: var(--primary); color: white; padding: 20px 28px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="color: white; font-size: 1.25rem; margin: 0;">📅 Academic Year ${year}</h3>
            <span style="font-size: 1.2rem; color: var(--accent);">▼</span>
          </div>
          <div class="year-content" style="display: ${index === 0 ? 'block' : 'none'};">
            <div class="programs-grid">
              ${cardsHtml}
            </div>
          </div>
        `;

        const headerCard = yearDiv.querySelector(".card");
        const yearContent = yearDiv.querySelector(".year-content");
        const arrow = yearDiv.querySelector("span");

        headerCard.addEventListener("click", () => {
          const isOpen = yearContent.style.display === "block";
          yearContent.style.display = isOpen ? "none" : "block";
          arrow.innerText = isOpen ? "▼" : "▲";
        });

        pageContainer.appendChild(yearDiv);
      });
  }

  /* =========================
     LIVE SEARCH FILTER
     ========================= */
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      const query = this.value.toLowerCase();
      const filtered = allPrograms.filter(p => 
        p.title.toLowerCase().includes(query) || 
        (p.year && p.year.toString().includes(query)) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
      renderPagePrograms(filtered);
    });
  }

  /* =========================
     PROGRAM MODAL DIALOG
     ========================= */
  window.openProgramModal = function(image, title, description, year, date) {
    const modalImg = document.getElementById("modalImage");
    const titleEl = document.getElementById("modalTitle");
    const descEl = document.getElementById("modalDescription");
    const yearEl = document.getElementById("modalYear");
    const dateEl = document.getElementById("modalDate");

    if (modalImg) modalImg.src = image;
    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = description || "No detailed description provided.";
    if (yearEl) yearEl.innerText = "📅 Year: " + year;
    if (dateEl) dateEl.innerText = "✨ Date: " + date;

    const modal = document.getElementById("programModal");
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  };
})();
