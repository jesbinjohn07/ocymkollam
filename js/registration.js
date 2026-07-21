/* ==========================================================================
   OCYM Kollam Diocese - Kalamela Registration Script
   ========================================================================== */

/* ===== PROGRAM LIST ===== */
const programs = [
  { name: "ലളിതഗാനം", count: 1 },
  { name: "സമൂഹഗാനം", count: 3 },
  { name: "സോപോകരണ സമൂഹഗാനം", count: 7 },
  { name: "പ്രസംഗം", count: 1 },
  { name: "കഥാപ്രസംഗം", count: 1 },
  { name: "സ്ടിറിംഗ് ഇൻസ്ട്രമെൻ്റ്", count: 1 },
  { name: "കീബോർഡ്", count: 1 },
  { name: "തബല", count: 1 },
  { name: "ഉപന്യാസം", count: 1 },
  { name: "ചിത്രരചന", count: 1 },
  { name: "കഥാരചന", count: 1 },
  { name: "കവിതാരചന", count: 1 },
  { name: "മാർഗംകളി", count: 8 },
  { name: "പരിചമുട്ട് കളി", count: 8 },
  { name: "തെരുവ് നാടകം", count: 10 },
  { name: "ക്വിസ്", count: 3 },
  { name: "മൈം", count: 7 }
];

document.addEventListener("DOMContentLoaded", () => {
  const regForm = document.getElementById("regForm");
  const closedNotice = document.getElementById("registrationClosedNotice");

  if (regForm && closedNotice) {
    if (window.SHOW_REGISTRATION) {
      regForm.style.display = "block";
      closedNotice.style.display = "none";
    } else {
      regForm.style.display = "none";
      closedNotice.style.display = "block";
    }
  }
});

/* ADD ITEM */
function addItem() {
  const container = document.getElementById('itemsContainer');
  if (!container) return;

  let options = '<option value="">Select Program</option>';
  programs.forEach((p, idx) => {
    options += `<option value="${idx}">${p.name} (${p.count} Participant${p.count > 1 ? 's' : ''})</option>`;
  });

  const div = document.createElement('div');
  div.className = 'item-block';
  div.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <label class="form-label" style="margin: 0;">Program Selection</label>
      <button type="button" class="btn btn-outline btn-sm" onclick="removeItem(this)" style="color: #ef4444; border-color: #ef4444; padding: 4px 12px;">❌ Remove</button>
    </div>
    <select class="form-control" onchange="onProgramChange(this)" required>
      ${options}
    </select>
    <div class="participants" style="margin-top: 16px; display: flex; flex-direction: column; gap: 10px;"></div>
  `;

  container.appendChild(div);
}

/* PROGRAM CHANGE */
function onProgramChange(selectEl) {
  const idx = selectEl.value;
  const partsDiv = selectEl.parentElement.querySelector('.participants');
  if (!partsDiv) return;
  partsDiv.innerHTML = "";

  if (!idx) return;

  // Prevent duplicate selections
  const selected = Array.from(document.querySelectorAll('#itemsContainer select'))
    .map(s => s.value);
  if (selected.filter(v => v === idx).length > 1) {
    alert("This program has already been selected!");
    selectEl.value = "";
    return;
  }

  const n = programs[idx].count;
  for (let i = 1; i <= n; i++) {
    const inp = document.createElement('input');
    inp.type = "text";
    inp.className = "form-control";
    inp.placeholder = `Participant ${i} Full Name`;
    inp.required = true;
    partsDiv.appendChild(inp);
  }
}

/* REMOVE ITEM */
function removeItem(btn) {
  if (!confirm("Are you sure you want to remove this item?")) return;
  btn.closest('.item-block').remove();
}

/* CLEAR */
function clearItems() {
  const container = document.getElementById('itemsContainer');
  if (!container || container.children.length === 0) return;
  if (!confirm("Clear all selected items?")) return;
  container.innerHTML = "";
}

/* SUBMIT FORM */
function onSubmit(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value.trim();
  const parish = document.getElementById('parish').value.trim();
  const position = document.getElementById('position').value;
  const phone = document.getElementById('phone').value.trim();

  const blocks = Array.from(document.querySelectorAll('.item-block'));
  if (blocks.length === 0) {
    alert("Please add at least one item to register.");
    return;
  }

  const items = [];
  for (const b of blocks) {
    const sel = b.querySelector('select');
    const idx = sel.value;
    if (!idx) { 
      alert("Please select a program for all items."); 
      return; 
    }

    const names = Array.from(b.querySelectorAll('.participants input'))
      .map(i => i.value.trim());
    if (names.some(n => n === "")) {
      alert("Please fill out all participant names.");
      return;
    }

    items.push({
      program: programs[idx].name,
      participants: names.join(" | ")
    });
  }

  if (!confirm("Are you ready to submit your registration?")) return;

  const submitBtn = document.getElementById("submitBtn");
  const originalText = submitBtn.innerText;
  submitBtn.innerText = "Submitting registration...";
  submitBtn.disabled = true;

  const postUrl = "https://script.google.com/macros/s/AKfycbyf_DQeEJaUM2AeAzjmFPY3alip-nYTTwGq4gGI4BfUpmDW_IcYTt5Qxkcna-pFrSI7/exec";

  fetch(postUrl, {
    method: "POST",
    body: JSON.stringify({
      fullName,
      parish,
      position,
      phone,
      items
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("HTTP error " + res.status);
    return res.text();
  })
  .then(() => {
    alert("🎉 Registration submitted successfully!");
    document.getElementById('regForm').reset();
    document.getElementById('itemsContainer').innerHTML = "";
  })
  .catch(err => {
    alert("❌ Submission failed. Please check your internet connection or try again later.");
    console.error("Submission error:", err);
  })
  .finally(() => {
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
  });
}
