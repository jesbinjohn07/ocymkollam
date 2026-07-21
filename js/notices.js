/* ==========================================================================
   OCYM Kollam Diocese - Notice Board Integration
   ========================================================================== */

(function() {
  const NOTICE_API = "https://script.google.com/macros/s/AKfycbwov2uYpuDq-ljlf1Fv6MnV4s5Xl1bb4pVHrbS1T3JktmAEqWhvPLNDrVn6V-KVjt4cFQ/exec";
  const listContainer = document.getElementById("noticeList");
  const section = document.getElementById("noticeSection");

  if (!listContainer) return;

  const isHomepage = !!document.getElementById("homepageNoticeFlag");

  function formatDate(d) {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  fetch(NOTICE_API)
    .then(res => {
      if (!res.ok) throw new Error("HTTP error " + res.status);
      return res.json();
    })
    .then(data => {
      listContainer.innerHTML = "";

      if (!data || data.length === 0) {
        if (isHomepage && section) {
          section.style.display = "none";
        } else {
          listContainer.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px;">
              <p style="font-size: 1.1rem; color: var(--text-secondary);">📭 No notices currently posted on the board.</p>
            </div>
          `;
        }
        return;
      }

      if (isHomepage && section) {
        section.style.display = "block";
      }

      // Reverse array to show newest notices first
      let noticesToDisplay = data.slice().reverse();
      if (isHomepage) {
        noticesToDisplay = noticesToDisplay.slice(0, 3);
      }

      noticesToDisplay.forEach(item => {
        const formattedDate = formatDate(item.date);
        const cleanTitle = item.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const cleanMessage = item.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const buttonHtml = item.link 
          ? `<a href="${item.link}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="margin-top: 12px; flex-shrink: 0;">${item.button || "View Document"}</a>` 
          : "";

        const card = document.createElement("div");
        card.className = "notice-card reveal reveal-slide-up";
        card.innerHTML = `
          <div class="notice-info">
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
    })
    .catch(err => {
      console.error("Notice Board fetch error:", err);
      if (isHomepage && section) {
        section.style.display = "none";
      } else {
        listContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 40px; border-color: #ef4444;">
            <p style="color: #ef4444; font-weight: 600;">❌ Unable to load notices. Please check your internet connection.</p>
          </div>
        `;
      }
    });
})();
