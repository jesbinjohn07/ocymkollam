/* ==========================================================================
   OCYM Kollam Diocese - Announcements Integration
   ========================================================================== */

(function() {
  const ANNOUNCE_URL = "https://script.google.com/macros/s/AKfycbwQ7auUVM2anVJHVQBHnyBAcuMs-OTp2Y_U1_q-v-5eyFufp5mxtXeXKcdT66Nokwjc/exec";
  const section = document.getElementById("announcements");
  const grid = document.getElementById("announcementsGrid");

  if (!section || !grid) return;

  function formatDate(d) {
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
