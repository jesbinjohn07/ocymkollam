/* ==========================================================================
   OCYM Kollam Diocese - Yuvadarshanam Magazine Integration
   ========================================================================== */

(function() {
  const MAGAZINE_API = "https://script.google.com/macros/s/AKfycbyR0P-41RBx8SCPc8SvhqpxEoNLKO_0ru3RXeWzQs7Nx0UJWpI0Wa9TqTXbYXyeZim74g/exec";
  const container = document.getElementById("magazineContainer");
  const lightbox = document.getElementById("coverLightbox");
  const lightboxImg = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");

  if (!container) return;

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

  fetch(MAGAZINE_API)
    .then(res => {
      if (!res.ok) throw new Error("HTTP Status " + res.status);
      return res.json();
    })
    .then(data => {
      container.innerHTML = "";

      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 50px;">
            <p style="font-size: 1.1rem; color: var(--text-secondary);">📭 No issues of Yuvadarshanam currently published online.</p>
          </div>
        `;
        return;
      }

      // Reverse list to show newest issues first
      const sortedMagazines = data.slice().reverse();

      sortedMagazines.forEach(item => {
        // Map keys flexibly to support slight differences in Apps Script response
        const title = item.title || item.Title || "Yuvadarshanam Magazine";
        const issueDate = item.issueDate || item.date || item.IssueDate || item["Issue Date"] || "";
        const coverImage = item.cover || item.coverImage || item.image || item.CoverImage || item["Cover Image"] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80";
        const pdfLink = item.pdf || item.pdfLink || item.link || item.PdfLink || item["PDF Link"] || "#";

        const formattedDate = formatDate(issueDate);

        // Escape title attributes for HTML safety
        const cleanTitle = title.replace(/'/g, "\\'").replace(/"/g, '&quot;');

        const card = document.createElement("div");
        card.className = "magazine-card reveal reveal-slide-up";
        card.innerHTML = `
          <div class="magazine-cover-wrapper" onclick="openCoverPreview('${coverImage}', '${cleanTitle}')">
            <img class="magazine-cover" loading="lazy" src="${coverImage}" alt="${title} Cover" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';">
          </div>
          <div class="magazine-info">
            <h3 class="magazine-title">${title}</h3>
            <div class="magazine-date">📅 ${formattedDate}</div>
            <div class="magazine-actions">
              <a href="${pdfLink}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Read Online</a>
              <a href="${pdfLink}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Download PDF</a>
            </div>
          </div>
        `;

        container.appendChild(card);
      });

      if (window.initScrollAnimations) {
        window.initScrollAnimations();
      }
    })
    .catch(err => {
      console.error("Yuvadarshanam magazines load error:", err);
      container.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 50px; border-color: #ef4444;">
          <p style="color: #ef4444; font-weight: 600;">❌ Unable to load Yuvadarshanam issues. Please check your network connection.</p>
        </div>
      `;
    });

  // Lightbox Preview Mode Handler
  window.openCoverPreview = function(imgSrc, titleText) {
    if (!lightbox || !lightboxImg || !lightboxCaption) return;
    lightboxImg.src = imgSrc;
    lightboxCaption.innerText = titleText;
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden"; // lock page scroll
  };

  window.closeCoverPreview = function() {
    if (!lightbox) return;
    lightbox.classList.remove("active");
    document.body.style.overflow = ""; // release page scroll
  };

  if (lightbox) {
    lightbox.onclick = function(e) {
      if (e.target === lightbox) {
        window.closeCoverPreview();
      }
    };
  }
})();
