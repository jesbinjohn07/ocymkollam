/* ==========================================================================
   OCYM Kollam Diocese - Notice Board Integration
   ========================================================================== */

(function() {
  const NOTICE_API = "https://script.google.com/macros/s/AKfycbwov2uYpuDq-ljlf1Fv6MnV4s5Xl1bb4pVHrbS1T3JktmAEqWhvPLNDrVn6V-KVjt4cFQ/exec";
  const listContainer = document.getElementById("noticeList");
  const section = document.getElementById("noticeSection");
  const searchInput = document.getElementById("noticeSearchInput");
  const categoryFilters = document.getElementById("categoryFilters");

  if (!listContainer) return;

  const isHomepage = !!document.getElementById("homepageNoticeFlag");
  let allNotices = [];
  let currentCategory = "all";
  let searchQuery = "";

  function formatDate(d) {
    if (!d) return "";
    const str = String(d).trim();

    // 1. Slash format (DD/MM/YY)
    if (str.includes("/")) {
      const parts = str.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let parsedYear = parseInt(parts[2], 10);
        const year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (month >= 0 && month < 12 && day > 0 && day <= 31 && !isNaN(year)) {
          return `${day} ${months[month]} ${year}`;
        }
      }
    }
    // 2. ISO/UTC format
    else if (str.includes("-") || str.includes("T")) {
      const dateObj = new Date(str);
      if (!isNaN(dateObj.getTime())) {
        const dayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'Asia/Kolkata' });
        const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'Asia/Kolkata' });
        const yearFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'Asia/Kolkata' });

        const dVal = dayFormatter.format(dateObj);
        const mVal = monthFormatter.format(dateObj);
        const yVal = yearFormatter.format(dateObj);

        return `${dVal} ${mVal} ${yVal}`;
      }
    }

    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function isNewNotice(dateStr) {
    if (!dateStr) return false;
    let targetDate;
    if (String(dateStr).includes("/")) {
      const parts = String(dateStr).split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        let parsedYear = parseInt(parts[2], 10);
        const year = parsedYear < 100 ? 2000 + parsedYear : parsedYear;
        targetDate = new Date(year, month, day);
      }
    } else {
      targetDate = new Date(dateStr);
    }
    
    if (!targetDate || isNaN(targetDate.getTime())) return false;
    const diffTime = Math.abs(new Date() - targetDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Mark as new if published in last 30 days
  }

  fetch(NOTICE_API)
    .then(res => {
      if (!res.ok) throw new Error("HTTP error " + res.status);
      return res.json();
    })
    .then(data => {
      allNotices = data || [];
      renderNotices();
    })
    .catch(err => {
      console.error("Circulars fetch error:", err);
      if (isHomepage && section) {
        section.style.display = "none";
      } else {
        listContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 40px; border-color: #ef4444;">
            <p style="color: #ef4444; font-weight: 600;">❌ Unable to load circulars. Please check your internet connection.</p>
          </div>
        `;
      }
    });

  function renderNotices() {
    listContainer.innerHTML = "";

    // Filter notices
    let filtered = allNotices.slice().reverse(); // Newest first

    if (!isHomepage) {
      if (currentCategory !== "all") {
        filtered = filtered.filter(item => {
          const category = (item.category || item.Category || "general").toLowerCase().trim();
          return category === currentCategory;
        });
      }

      if (searchQuery) {
        filtered = filtered.filter(item => {
          const title = (item.title || "").toLowerCase();
          const message = (item.message || "").toLowerCase();
          return title.includes(searchQuery) || message.includes(searchQuery);
        });
      }
    } else {
      // If homepage, display top 3 only
      filtered = filtered.slice(0, 3);
    }

    if (filtered.length === 0) {
      if (isHomepage && section) {
        section.style.display = "none";
      } else {
        listContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 40px;">
            <p style="font-size: 1.1rem; color: var(--text-secondary);">📭 No notices match your criteria.</p>
          </div>
        `;
      }
      return;
    }

    if (isHomepage && section) {
      section.style.display = "block";
    }

    filtered.forEach(item => {
      const formattedDate = formatDate(item.date);
      const cleanTitle = item.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const cleanMessage = item.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      const link = item.link || item.Link || item.pdfLink || item.PdfLink || "";
      const buttonText = item.button || item.Button || "View Document";
      
      const isNew = isNewNotice(item.date);
      const badgeHtml = isNew ? `<span class="notice-badge-new">NEW</span>` : "";

      const buttonHtml = link 
        ? `<a href="${link}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="margin-top: 12px; flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px;">
             📄 ${buttonText}
           </a>` 
        : "";

      const card = document.createElement("div");
      card.className = "notice-card reveal reveal-slide-up";
      card.innerHTML = `
        <div class="notice-info">
          ${badgeHtml}
          <div class="notice-date">📌 ${formattedDate}</div>
          <h3 class="notice-title">${cleanTitle}</h3>
          <p class="notice-preview">${cleanMessage}</p>
        </div>
        ${buttonHtml}
      `;
      
      listContainer.appendChild(card);
    });

    if (window.initScrollAnimations) {
      window.initScrollAnimations();
    }
  }

  // Setup event listeners for filtering & searching
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      searchQuery = this.value.toLowerCase().trim();
      renderNotices();
    });
  }

  if (categoryFilters) {
    const buttons = categoryFilters.querySelectorAll(".category-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", function() {
        buttons.forEach(b => b.classList.remove("active"));
        this.classList.add("active");
        currentCategory = this.getAttribute("data-category");
        renderNotices();
      });
    });
  }
})();
