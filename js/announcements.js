/* ==========================================================================
   OCYM Kollam Diocese - Announcements Integration
   ========================================================================== */

(function() {
  const ANNOUNCE_URL = "https://script.google.com/macros/s/AKfycbwQ7auUVM2anVJHVQBHnyBAcuMs-OTp2Y_U1_q-v-5eyFufp5mxtXeXKcdT66Nokwjc/exec";
  const section = document.getElementById("announcements");
  const grid = document.getElementById("announcementsGrid");

  if (!section || !grid) return;

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

        const dayVal = dayFormatter.format(dateObj);
        const monthVal = monthFormatter.format(dateObj);
        const yearVal = yearFormatter.format(dateObj);

        return `${dayVal} ${monthVal} ${yearVal}`;
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

  fetch(ANNOUNCE_URL)
    .then(res => {
      if (!res.ok) throw new Error("Network status " + res.status);
      return res.json();
    })
    .then(data => {
      if (!data || data.length === 0) {
        section.style.display = "none";
        return;
      }

      section.style.display = "block";
      grid.innerHTML = "";

      // Display active announcements (up to 3)
      data.slice(0, 3).forEach((item, index) => {
        const formattedDate = formatDate(item.date);
        const cleanTitle = item.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const cleanMessage = item.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const card = document.createElement("div");
        card.className = `announcement-card ${index === 0 ? "featured-announcement" : ""} reveal reveal-slide-up`;
        card.innerHTML = `
          <div class="announcement-header">
            <span class="announcement-date">📅 ${formattedDate}</span>
          </div>
          <h3 class="announcement-title">${cleanTitle}</h3>
          <p class="announcement-body">${cleanMessage}</p>
        `;
        
        grid.appendChild(card);
      });

      if (window.initScrollAnimations) {
        window.initScrollAnimations();
      }
    })
    .catch(err => {
      console.warn("Announcements fetch failed:", err);
      section.style.display = "none";
    });
})();
