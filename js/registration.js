/* ==========================================================================
   OCYM Kollam Diocese - Kalamela Registration Script
   Circular 2026–27: "ജ്വാല – യുവജന കലാമേള" (Jwala – Yuvajana Kalamela)
   ========================================================================== */

(function () {
  'use strict';

  /* ===== AGE CALCULATION REFERENCE DATE =====
     Reference date for checking participant age limit (15–40 years).
     Date: 9 January 2027 (Month is 0-indexed: Jan = 0)
  ============================================ */
  const AGE_REFERENCE_DATE = new Date(2027, 0, 9);
  const MIN_AGE = 15;
  const MAX_AGE = 40;

  /* ===== PROGRAM DATA MODEL (Requirement 2) =====
     type: "individual" | "group"
     gender: "ask" | "female_only" | "male_only" | "any"
     substitutes: boolean (allow max 2 substitutes under Rule 15)
     fixed: boolean (true if count must be exact, e.g. 3 members)
  ================================================ */
  const programs = [
    // --- Individual Items (1 participant each) ---
    {
      name: "ലളിതഗാനം",
      type: "individual",
      min: 1,
      max: 1,
      gender: "ask",
      substitutes: false,
      note: "സ്ത്രീകൾക്കും പുരുഷന്മാർക്കും പ്രത്യേക മത്സരങ്ങൾ ഉണ്ടായിരിക്കും"
    },
    {
      name: "പ്രസംഗം",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: ""
    },
    {
      name: "കഥാപ്രസംഗം",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: "ഒരു മത്സരാർത്ഥി മാത്രം, വാദ്യോപകരണങ്ങൾ ഉപയോഗിക്കാൻ പാടില്ല"
    },
    {
      name: "സ്ട്രിംഗ് ഇൻസ്ട്രുമെൻ്റ് (വയലിൻ – ഈസ്റ്റേൺ)",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: "Violin - Eastern style"
    },
    {
      name: "സ്ട്രിംഗ് ഇൻസ്ട്രുമെൻ്റ് (ഗിറ്റാർ – വെസ്റ്റേൺ)",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: "Guitar - Western style"
    },
    {
      name: "കീബോർഡ്",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: ""
    },
    {
      name: "തബല",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: ""
    },
    {
      name: "ഉപന്യാസം",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: ""
    },
    {
      name: "ചിത്രരചന (പെൻസിൽ)",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: "Pencil Drawing"
    },
    {
      name: "കഥാരചന",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: ""
    },
    {
      name: "കവിതാരചന",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: ""
    },

    // --- Group Items ---
    {
      name: "സമൂഹഗാനം",
      type: "group",
      min: 3,
      max: 3,
      fixed: true,
      gender: "any",
      substitutes: true,
      note: "കൃത്യം 3 അംഗങ്ങൾ (Exactly 3 members)"
    },
    {
      name: "സോപോകരണ സമൂഹഗാനം",
      type: "group",
      min: 1,
      max: 7,
      fixed: false,
      gender: "any",
      substitutes: true,
      note: "പരമാവധി 7 അംഗങ്ങൾ (പാട്ടുകാരും വാദ്യക്കാരും ഉൾപ്പെടെ)"
    },
    {
      name: "മാർഗംകളി",
      type: "group",
      min: 1,
      max: 8,
      fixed: false,
      gender: "female_only",
      substitutes: true,
      note: "വനിതകൾ മാത്രം, പരമാവധി 8 പേർ (2 പാട്ടുകാർ ഉൾപ്പെടെ)"
    },
    {
      name: "പരിചമുട്ട് കളി",
      type: "group",
      min: 1,
      max: 8,
      fixed: false,
      gender: "male_only",
      substitutes: true,
      note: "പുരുഷന്മാർ മാത്രം, പരമാവധി 8 പേർ (പാട്ടുകാർ ഉൾപ്പെടെ)"
    },
    {
      name: "തെരുവ് നാടകം",
      type: "group",
      min: 1,
      max: 10,
      fixed: false,
      gender: "any",
      substitutes: true,
      note: "പരമാവധി 10 അംഗങ്ങൾ (Street Play)"
    },
    {
      name: "ക്വിസ്",
      type: "group",
      min: 3,
      max: 3,
      fixed: true,
      gender: "any",
      substitutes: false,
      note: "കൃത്യം 3 അംഗങ്ങൾ (Exactly 3 members)"
    },
    {
      name: "മൈം",
      type: "group",
      min: 1,
      max: 7,
      fixed: false,
      gender: "any",
      substitutes: true,
      note: "പരമാവധി 7 അംഗങ്ങൾ (Mime)"
    }
  ];

  /* ===== HELPER UTILITIES ===== */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeKey(name, dob) {
    const cleanName = (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const cleanDob = (dob || '').trim();
    return `${cleanName}|${cleanDob}`;
  }

  /**
   * Calculates age as on reference date (AGE_REFERENCE_DATE = 9 Jan 2027)
   * Handles "YYYY-MM-DD" reliably across timezones
   */
  function calculateAgeOnEventDate(dobString) {
    if (!dobString) return null;
    
    // Parse "YYYY-MM-DD" parts directly to avoid UTC vs local timezone shifts
    const parts = dobString.split('-');
    if (parts.length !== 3) return null;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10); // 1-12
    const birthDay = parseInt(parts[2], 10);   // 1-31

    if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;

    const refYear = AGE_REFERENCE_DATE.getFullYear();
    const refMonth = AGE_REFERENCE_DATE.getMonth() + 1; // 1-12
    const refDay = AGE_REFERENCE_DATE.getDate();

    let age = refYear - birthYear;
    if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
      age--;
    }
    return age;
  }

  /* ===== DOM INITIALIZATION ===== */
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

    const addBtn = document.getElementById("addProgramBtn");
    if (addBtn) addBtn.addEventListener("click", () => addItem());

    const clearBtn = document.getElementById("clearProgramsBtn");
    if (clearBtn) clearBtn.addEventListener("click", clearItems);

    if (regForm) {
      regForm.addEventListener("submit", onSubmit);
    }

    const declarationCheck = document.getElementById("declarationCheck");
    if (declarationCheck) {
      declarationCheck.addEventListener("change", () => {
        if (declarationCheck.checked) {
          const err = document.getElementById("declarationCheckError");
          if (err) {
            err.classList.remove("visible");
            err.textContent = "";
          }
        }
      });
    }

    initParishSelect();
    initSubmissionModals();
    initStickyFormBar();
  });

  /* ===== ADD PROGRAM BLOCK ===== */
  function addItem() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    hideContainerError();

    const blockId = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    const div = document.createElement('div');
    div.className = 'item-block';
    div.id = blockId;

    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 10px;">
        <label class="form-label" style="margin: 0; font-size: 1rem; color: var(--primary);">
          <strong>🎯 Program Selection</strong>
        </label>
        <button type="button" class="btn btn-outline btn-sm remove-item-btn" style="color: #dc2626; border-color: #fca5a5; padding: 4px 12px;">
          ❌ Remove
        </button>
      </div>
      <select class="form-control program-select" required aria-label="Select Kalamela Program">
        <option value="">-- Select Program --</option>
      </select>
      <div class="program-note-box" style="margin-top: 8px; font-size: 0.85rem; color: var(--text-secondary); display: none;"></div>
      <div class="participants-container" style="margin-top: 16px;"></div>
      <div class="substitutes-container" style="margin-top: 14px;"></div>
      <div class="form-error-msg item-error-msg" style="margin-top: 10px;"></div>
    `;

    // Bind remove button
    div.querySelector('.remove-item-btn').addEventListener('click', () => {
      div.remove();
      refreshProgramDropdowns();
    });

    // Bind select change
    const selectEl = div.querySelector('.program-select');
    selectEl.addEventListener('change', () => onProgramChange(div, selectEl));

    container.appendChild(div);
    refreshProgramDropdowns();

    // Auto-focus the new select
    selectEl.focus();
  }

  /* ===== REFRESH PROGRAM DROPDOWNS =====
     Disables already selected programs in other dropdowns (Requirement 4)
  ======================================================================== */
  function refreshProgramDropdowns() {
    const allSelects = Array.from(document.querySelectorAll('.program-select'));
    const selectedIndices = allSelects
      .map(s => s.value)
      .filter(v => v !== "");

    allSelects.forEach(select => {
      const currentVal = select.value;
      const currentOpts = Array.from(select.options);

      // Rebuild options if empty or first load
      if (currentOpts.length <= 1) {
        select.innerHTML = '<option value="">-- Select Program --</option>';
        programs.forEach((p, idx) => {
          let label = p.name;
          if (p.type === 'individual') {
            label += ' (Individual - 1 Participant)';
          } else if (p.fixed) {
            label += ` (Group - Exactly ${p.max} Members)`;
          } else {
            label += ` (Group - Max ${p.max} Members)`;
          }
          const opt = document.createElement('option');
          opt.value = String(idx);
          opt.textContent = label;
          select.appendChild(opt);
        });
        select.value = currentVal;
      }

      // Update disabled state for options
      Array.from(select.options).forEach(opt => {
        if (!opt.value) return;
        if (opt.value !== currentVal && selectedIndices.includes(opt.value)) {
          opt.disabled = true;
          opt.textContent = opt.textContent.replace(' [Already Selected]', '') + ' [Already Selected]';
        } else {
          opt.disabled = false;
          opt.textContent = opt.textContent.replace(' [Already Selected]', '');
        }
      });
    });
  }

  /* ===== PROGRAM CHANGE HANDLER ===== */
  function onProgramChange(blockDiv, selectEl) {
    const idx = selectEl.value;
    const partsDiv = blockDiv.querySelector('.participants-container');
    const subsDiv = blockDiv.querySelector('.substitutes-container');
    const noteBox = blockDiv.querySelector('.program-note-box');
    const errBox = blockDiv.querySelector('.item-error-msg');

    partsDiv.innerHTML = "";
    subsDiv.innerHTML = "";
    errBox.classList.remove('visible');
    errBox.textContent = "";

    if (!idx) {
      noteBox.style.display = "none";
      noteBox.textContent = "";
      refreshProgramDropdowns();
      return;
    }

    refreshProgramDropdowns();

    const prog = programs[idx];

    // Show Program Note if available
    if (prog.note) {
      noteBox.style.display = "block";
      noteBox.innerHTML = `ℹ️ <em>${escapeHTML(prog.note)}</em>`;
    } else {
      noteBox.style.display = "none";
      noteBox.textContent = "";
    }

    // Header label for participants
    const title = document.createElement('div');
    title.style.display = 'flex';
    title.style.justifyContent = 'space-between';
    title.style.alignItems = 'center';
    title.style.marginBottom = '12px';
    title.style.flexWrap = 'wrap';
    title.style.gap = '8px';

    const titleText = document.createElement('span');
    titleText.style.fontWeight = '600';
    titleText.style.fontSize = '0.92rem';
    titleText.style.color = 'var(--primary)';
    titleText.textContent = prog.type === 'individual'
      ? 'Participant Details:'
      : `Team Members (${prog.fixed ? `Exactly ${prog.max} required` : `Min ${prog.min}, Max ${prog.max}`}):`;
    title.appendChild(titleText);

    // If group and not fixed, add "+ Add Member" button
    if (prog.type === 'group' && !prog.fixed) {
      const addMemberBtn = document.createElement('button');
      addMemberBtn.type = 'button';
      addMemberBtn.className = 'btn btn-outline btn-sm add-member-btn';
      addMemberBtn.style.padding = '4px 12px';
      addMemberBtn.style.fontSize = '0.82rem';
      addMemberBtn.textContent = `+ Add Member (Max ${prog.max})`;
      addMemberBtn.addEventListener('click', () => {
        const currentCount = partsDiv.querySelectorAll('.participant-entry-card').length;
        if (currentCount < prog.max) {
          addParticipantCard(partsDiv, prog, currentCount + 1, false);
          updateAddMemberButtonState(partsDiv, addMemberBtn, prog.max);
        }
      });
      title.appendChild(addMemberBtn);
    }

    partsDiv.appendChild(title);

    // Initial participant fields
    // For fixed or individual: exact count
    // For group non-fixed: start with min (1)
    const initialCount = prog.fixed ? prog.max : prog.min;
    for (let i = 1; i <= initialCount; i++) {
      addParticipantCard(partsDiv, prog, i, false);
    }

    // Check button state if non-fixed
    const addMemberBtn = title.querySelector('.add-member-btn');
    if (addMemberBtn) {
      updateAddMemberButtonState(partsDiv, addMemberBtn, prog.max);
    }

    // Optional Substitutes Section (Requirement 2 & Rule 15)
    if (prog.substitutes) {
      buildSubstitutesSection(subsDiv, prog);
    }
  }

  function updateAddMemberButtonState(partsDiv, btn, max) {
    const currentCount = partsDiv.querySelectorAll('.participant-entry-card').length;
    if (currentCount >= max) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.textContent = `Limit reached (${max}/${max})`;
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.textContent = `+ Add Member (${currentCount}/${max})`;
    }
  }

  /* ===== CREATE PARTICIPANT CARD ===== */
  function addParticipantCard(parentContainer, prog, index, isSubstitute = false) {
    const card = document.createElement('div');
    card.className = 'participant-entry-card';
    card.setAttribute('data-is-substitute', isSubstitute ? 'true' : 'false');

    const header = document.createElement('div');
    header.className = 'participant-entry-header';

    const labelSpan = document.createElement('span');
    labelSpan.innerHTML = isSubstitute 
      ? `🔄 <strong>Substitute ${index}</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(Optional)</span>`
      : `👤 <strong>Participant ${index}</strong>`;
    header.appendChild(labelSpan);

    // If group non-fixed and member > min, allow removing member
    if (!isSubstitute && prog.type === 'group' && !prog.fixed && index > prog.min) {
      const remBtn = document.createElement('button');
      remBtn.type = 'button';
      remBtn.style.background = 'none';
      remBtn.style.border = 'none';
      remBtn.style.color = '#dc2626';
      remBtn.style.cursor = 'pointer';
      remBtn.style.fontSize = '0.82rem';
      remBtn.textContent = '✕ Remove';
      remBtn.addEventListener('click', () => {
        card.remove();
        renumberParticipants(parentContainer);
        const addBtn = parentContainer.querySelector('.add-member-btn');
        if (addBtn) updateAddMemberButtonState(parentContainer, addBtn, prog.max);
      });
      header.appendChild(remBtn);
    } else if (isSubstitute) {
      const remBtn = document.createElement('button');
      remBtn.type = 'button';
      remBtn.style.background = 'none';
      remBtn.style.border = 'none';
      remBtn.style.color = '#dc2626';
      remBtn.style.cursor = 'pointer';
      remBtn.style.fontSize = '0.82rem';
      remBtn.textContent = '✕ Remove';
      remBtn.addEventListener('click', () => {
        card.remove();
        const subBox = parentContainer.closest('.substitutes-box');
        if (subBox) {
          renumberSubstitutes(subBox);
          const addSubBtn = subBox.querySelector('.add-sub-btn');
          if (addSubBtn) updateAddSubButtonState(subBox, addSubBtn);
        }
      });
      header.appendChild(remBtn);
    }

    card.appendChild(header);

    // Grid for input fields: Name, DOB, Gender
    const grid = document.createElement('div');
    grid.className = 'participant-fields-grid';

    // 1. Full Name
    const nameCol = document.createElement('div');
    nameCol.innerHTML = `
      <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px;">Full Name <span style="color:#dc2626;">*</span></label>
      <input type="text" class="form-control p-name" placeholder="Name as in ID proof" ${!isSubstitute ? 'required' : ''}>
    `;
    grid.appendChild(nameCol);

    // 2. Date of Birth
    const dobCol = document.createElement('div');
    dobCol.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
        <label class="form-label" style="font-size: 0.8rem; margin: 0;">Date of Birth <span style="color:#dc2626;">*</span></label>
        <span class="age-badge" style="font-size: 0.78rem; font-weight: 600; color: var(--primary); display: none;"></span>
      </div>
      <input type="date" class="form-control p-dob" ${!isSubstitute ? 'required' : ''}>
    `;
    grid.appendChild(dobCol);

    // 3. Gender
    const genderCol = document.createElement('div');
    let genderHtml = `
      <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px;">Gender ${prog.gender === 'ask' || prog.gender === 'female_only' || prog.gender === 'male_only' ? '<span style="color:#dc2626;">*</span>' : ''}</label>
      <select class="form-control p-gender" ${prog.gender === 'ask' ? 'required' : ''}>
    `;

    if (prog.gender === 'female_only') {
      genderHtml += `<option value="Female" selected>Female</option>`;
    } else if (prog.gender === 'male_only') {
      genderHtml += `<option value="Male" selected>Male</option>`;
    } else if (prog.gender === 'ask') {
      genderHtml += `
        <option value="">Select</option>
        <option value="Female">Female</option>
        <option value="Male">Male</option>
      `;
    } else {
      // optional
      genderHtml += `
        <option value="">Select (Optional)</option>
        <option value="Female">Female</option>
        <option value="Male">Male</option>
        <option value="Other">Other</option>
      `;
    }
    genderHtml += `</select>`;
    genderCol.innerHTML = genderHtml;

    // Disable select if forced
    if (prog.gender === 'female_only' || prog.gender === 'male_only') {
      const sel = genderCol.querySelector('.p-gender');
      if (sel) sel.disabled = true;
    }

    grid.appendChild(genderCol);
    card.appendChild(grid);

    // Inline error container for this participant
    const pErr = document.createElement('div');
    pErr.className = 'form-error-msg p-card-error';
    card.appendChild(pErr);

    // Dynamic Live Age Calculation & Validation
    const dobInput = dobCol.querySelector('.p-dob');
    const ageBadge = dobCol.querySelector('.age-badge');
    const validateDobLive = () => {
      const val = dobInput.value;
      if (!val) {
        ageBadge.style.display = 'none';
        ageBadge.textContent = '';
        dobInput.classList.remove('has-error');
        pErr.classList.remove('visible');
        pErr.textContent = '';
        return;
      }
      const age = calculateAgeOnEventDate(val);
      if (age === null || isNaN(age)) {
        ageBadge.style.display = 'none';
        return;
      }

      ageBadge.style.display = 'inline-block';
      ageBadge.textContent = `Age: ${age} yrs`;

      if (age < MIN_AGE || age > MAX_AGE) {
        ageBadge.style.color = '#dc2626';
        dobInput.classList.add('has-error');
        pErr.textContent = `Age must be between ${MIN_AGE} and ${MAX_AGE} years. (Current calculated age: ${age} yrs).`;
        pErr.classList.add('visible');
      } else {
        ageBadge.style.color = '#15803d'; // green
        dobInput.classList.remove('has-error');
        pErr.classList.remove('visible');
        pErr.textContent = '';
      }
    };

    dobInput.addEventListener('input', validateDobLive);
    dobInput.addEventListener('change', validateDobLive);

    parentContainer.appendChild(card);
  }

  function renumberParticipants(container) {
    const cards = container.querySelectorAll('.participant-entry-card[data-is-substitute="false"]');
    cards.forEach((c, idx) => {
      const strong = c.querySelector('.participant-entry-header strong');
      if (strong) strong.textContent = `Participant ${idx + 1}`;
    });
  }

  function renumberSubstitutes(box) {
    const cards = box.querySelectorAll('.participant-entry-card[data-is-substitute="true"]');
    cards.forEach((c, idx) => {
      const strong = c.querySelector('.participant-entry-header strong');
      if (strong) strong.textContent = `Substitute ${idx + 1}`;
    });
  }

  /* ===== SUBSTITUTES SECTION (Rule 15 - Max 2) ===== */
  function buildSubstitutesSection(container, prog) {
    const box = document.createElement('div');
    box.className = 'substitutes-box';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '10px';
    header.style.flexWrap = 'wrap';
    header.style.gap = '8px';

    const title = document.createElement('span');
    title.style.fontWeight = '600';
    title.style.fontSize = '0.88rem';
    title.style.color = 'var(--primary)';
    title.innerHTML = `🔁 Substitutes (Max 2 per Rule 15)`;
    header.appendChild(title);

    const addSubBtn = document.createElement('button');
    addSubBtn.type = 'button';
    addSubBtn.className = 'btn btn-outline btn-sm add-sub-btn';
    addSubBtn.style.padding = '3px 10px';
    addSubBtn.style.fontSize = '0.8rem';
    addSubBtn.textContent = '+ Add Substitute (0/2)';

    header.appendChild(addSubBtn);
    box.appendChild(header);

    const subList = document.createElement('div');
    subList.className = 'substitutes-list';
    box.appendChild(subList);

    addSubBtn.addEventListener('click', () => {
      const count = subList.querySelectorAll('.participant-entry-card').length;
      if (count < 2) {
        addParticipantCard(subList, prog, count + 1, true);
        updateAddSubButtonState(box, addSubBtn);
      }
    });

    container.appendChild(box);
  }

  function updateAddSubButtonState(box, btn) {
    const count = box.querySelectorAll('.participant-entry-card[data-is-substitute="true"]').length;
    if (count >= 2) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.textContent = 'Max substitutes reached (2/2)';
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.textContent = `+ Add Substitute (${count}/2)`;
    }
  }

  /* ===== CLEAR ALL ITEMS ===== */
  function clearItems() {
    const container = document.getElementById('itemsContainer');
    if (!container || container.children.length === 0) return;
    if (!confirm("Clear all selected programs and participant entries?")) return;
    container.innerHTML = "";
    hideContainerError();
    refreshProgramDropdowns();
  }

  /* ===== ERROR UI HELPERS ===== */
  function clearAllErrors() {
    document.querySelectorAll('.form-control.has-error, .parish-trigger-btn.has-error').forEach(el => el.classList.remove('has-error'));
    document.querySelectorAll('.form-error-msg').forEach(el => {
      el.classList.remove('visible');
      el.textContent = '';
    });
    const banner = document.getElementById('formErrorBanner');
    if (banner) {
      banner.classList.remove('visible');
      banner.innerHTML = '';
    }
  }

  function setFieldError(fieldId, errorMsg) {
    const field = document.getElementById(fieldId);
    const errDiv = document.getElementById(fieldId + 'Error');
    if (field) field.classList.add('has-error');
    if (fieldId === 'parish') {
      const trigger = document.getElementById('parishTriggerBtn');
      if (trigger) trigger.classList.add('has-error');
    }
    if (errDiv) {
      errDiv.textContent = errorMsg;
      errDiv.classList.add('visible');
    }
    return (fieldId === 'parish' ? (document.getElementById('parishTriggerBtn') || field) : field);
  }

  function setCustomError(element, errorDiv, errorMsg) {
    if (element) element.classList.add('has-error');
    if (errorDiv) {
      errorDiv.textContent = errorMsg;
      errorDiv.classList.add('visible');
    }
    return element;
  }

  function showContainerError(msg) {
    const errDiv = document.getElementById('itemsContainerError');
    if (errDiv) {
      errDiv.textContent = msg;
      errDiv.classList.add('visible');
    }
  }

  function hideContainerError() {
    const errDiv = document.getElementById('itemsContainerError');
    if (errDiv) {
      errDiv.textContent = '';
      errDiv.classList.remove('visible');
    }
  }

  /* ===== SUBMISSION STATE & MODAL MANAGEMENT ===== */
  let isSubmitting = false;
  let lastSubmissionPayload = null;
  let pendingSubmissionPayload = null;

  function showOverlay(overlayId) {
    const el = document.getElementById(overlayId);
    if (el) {
      el.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function hideOverlay(overlayId) {
    const el = document.getElementById(overlayId);
    if (el) {
      el.classList.remove('active');
      // If no other overlay is open, restore scroll
      const activeOverlays = document.querySelectorAll('.reg-modal-overlay.active');
      if (activeOverlays.length === 0) {
        document.body.style.overflow = '';
      }
    }
  }

  function showPreviewModal(payload) {
    pendingSubmissionPayload = payload;
    const bodyEl = document.getElementById('previewModalBody');
    if (!bodyEl) return;

    const totalParticipants = payload.items.reduce((acc, item) => {
      return acc + (item.participantsDetail ? item.participantsDetail.length : 0);
    }, 0);

    const programsHtml = payload.items.map((item, idx) => {
      const isGroup = (item.substitutes && item.substitutes.length > 0) || (item.participantsDetail && item.participantsDetail.length > 1);
      const progTypeBadge = isGroup ? 'ഗ്രൂപ്പ് (Group)' : 'വ്യക്തിഗതം (Single)';

      const participantChips = (item.participantsDetail || []).map(p => {
        const gLabel = p.gender && p.gender !== 'Not Specified' ? ` (${escapeHTML(p.gender)})` : '';
        return `<span class="preview-participant-chip">👤 ${escapeHTML(p.name)}${gLabel}</span>`;
      }).join('');

      let subHtml = '';
      if (item.substitutes && item.substitutes.length > 0) {
        const subChips = item.substitutes.map(s => {
          return `<span class="preview-participant-chip" style="border-style: dashed; background: rgba(212, 160, 23, 0.08);">🔄 ${escapeHTML(s.name)} (Sub)</span>`;
        }).join('');
        subHtml = `<div class="preview-substitutes-wrap"><strong>പകരക്കാർ:</strong> ${subChips}</div>`;
      }

      return `
        <div class="preview-program-row">
          <div class="preview-prog-header">
            <span class="preview-prog-name">#${idx + 1}. ${escapeHTML(item.program)}</span>
            <span class="preview-prog-type">${progTypeBadge}</span>
          </div>
          <div class="preview-participants-list">
            ${participantChips}
          </div>
          ${subHtml}
        </div>
      `;
    }).join('');

    bodyEl.innerHTML = `
      <!-- Official Parish Details Card -->
      <div class="preview-section-card">
        <div class="preview-official-grid">
          <div class="preview-field-item">
            <span class="preview-field-label">ഇടവക (Parish)</span>
            <span class="preview-field-val">⛪ ${escapeHTML(payload.parish)}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">ഫോൺ (Phone)</span>
            <span class="preview-field-val">📞 ${escapeHTML(payload.phone)}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">ഭാരവാഹി (Official)</span>
            <span class="preview-field-val">👤 ${escapeHTML(payload.fullName)}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">സ്ഥാനം (Position)</span>
            <span class="preview-field-val">📋 ${escapeHTML(payload.position)}</span>
          </div>
        </div>
      </div>

      <!-- Summary Counts Pill -->
      <div class="preview-programs-summary-pill">
        <span>🎯 ഇനങ്ങൾ: <strong>${payload.items.length}</strong></span>
        <span>👥 മത്സരാർത്ഥികൾ: <strong>${totalParticipants}</strong></span>
      </div>

      <!-- Programs List -->
      <div class="preview-programs-container">
        ${programsHtml}
      </div>
    `;

    showOverlay('previewOverlay');
  }

  function showSuccessModal(regId, parishName, programCount) {
    const idEl = document.getElementById('successRegId');
    if (idEl) idEl.textContent = regId;

    const summaryEl = document.getElementById('successSummaryPill');
    if (summaryEl) {
      summaryEl.innerHTML = `<strong>Parish:</strong> ${escapeHTML(parishName)} &bull; <strong>Programs:</strong> ${programCount}`;
    }

    showOverlay('successOverlay');
  }

  function showFailureModal(shortReason) {
    const reasonEl = document.getElementById('failureReasonText');
    if (reasonEl) {
      reasonEl.textContent = shortReason;
    }
    showOverlay('failureOverlay');
  }

  /* ===== Reliable submit: retry + "did it save?" check =====
     Safe because the server returns the ORIGINAL Reg ID for the same submissionId. */
  function parseReply(text) {
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { throw new Error("Invalid response format received from server."); }
    if (!parsed || parsed.status !== "success" || !parsed.regId || typeof parsed.regId !== "string" || !parsed.regId.trim()) {
      const err = new Error((parsed && parsed.message) ? parsed.message : "The server did not return a valid registration confirmation.");
      err.serverReported = true;
      throw err;
    }
    return parsed;
  }

  function fetchWithTimeout(url, options, ms) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    return fetch(url, Object.assign({}, options, { signal: controller.signal }))
      .finally(() => clearTimeout(t));
  }

  async function checkSaved(postUrl, submissionId) {
    try {
      const res = await fetchWithTimeout(postUrl + "?check=" + encodeURIComponent(submissionId), {}, 15000);
      const data = JSON.parse(await res.text());
      return (data && data.status === "success" && data.regId) ? data : null;
    } catch (e) {
      return null;
    }
  }

  async function submitWithRecovery(postUrl, payload) {
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetchWithTimeout(postUrl, { method: "POST", body: JSON.stringify(payload) }, 30000);
        const text = await res.text();
        if (!res.ok) throw new Error("HTTP " + res.status + ": " + (text.slice(0, 100) || "Server returned an error"));
        return parseReply(text);
      } catch (err) {
        if (err.serverReported || (err.message && err.message.includes("Invalid response"))) throw err;
        lastErr = err;
        // The reply may have been lost even though the data was saved: ask the server
        const saved = await checkSaved(postUrl, payload.submissionId);
        if (saved) return saved;
        await new Promise(r => setTimeout(r, 1500 * attempt));
      }
    }
    throw lastErr;
  }

  function performPostSubmission(payload) {
    if (isSubmitting) return;
    isSubmitting = true;
    lastSubmissionPayload = payload;

    const submitBtn = document.getElementById("submitBtn");
    const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Registration Form';
    if (submitBtn) {
      submitBtn.innerHTML = `<span>⏳</span> Submitting registration...`;
      submitBtn.disabled = true;
    }

    showOverlay('waitOverlay');

    const postUrl = "https://script.google.com/macros/s/AKfycbyf_DQeEJaUM2AeAzjmFPY3alip-nYTTwGq4gGI4BfUpmDW_IcYTt5Qxkcna-pFrSI7/exec";

    submitWithRecovery(postUrl, payload)
      .then((parsed) => {
        hideOverlay('waitOverlay');
        showSuccessModal(parsed.regId.trim(), payload.parish, payload.items.length);

        // Reset form ONLY on confirmed success
        const form = document.getElementById('regForm');
        if (form) form.reset();

        const parishHidden = document.getElementById('parish');
        if (parishHidden) parishHidden.value = '';
        const parishTriggerText = document.getElementById('parishTriggerText');
        if (parishTriggerText) {
          parishTriggerText.textContent = 'Select Parish Name';
          parishTriggerText.classList.add('placeholder');
        }

        const container = document.getElementById('itemsContainer');
        if (container) container.innerHTML = "";

        clearAllErrors();
        refreshProgramDropdowns();
      })
      .catch((err) => {
        hideOverlay('waitOverlay');
        console.error("Kalamela Registration Submission Error:", err);

        let shortReason = "Network problem. Check your internet connection.";
        if (err.name === 'AbortError') {
          shortReason = "No response from the server (timed out).";
        } else if (err.serverReported) {
          shortReason = `Server error: ${err.message}`;
        } else if (err.message && err.message.startsWith('HTTP')) {
          shortReason = `Server error: ${err.message}`;
        } else if (err.message && err.message.includes('Invalid response')) {
          shortReason = "Server error: Invalid response received.";
        }

        showFailureModal(shortReason);
      })
      .finally(() => {
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      });
  }

  /* ===== SUBMIT FORM HANDLER ===== */
  function onSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    clearAllErrors();

    const errorsList = [];
    let firstErrorElement = null;

    function recordError(element, msg) {
      errorsList.push(msg);
      if (!firstErrorElement && element) {
        firstErrorElement = element;
      }
    }

    // 1. Official Contact Details
    const fullNameInput = document.getElementById('fullName');
    const parishInput = document.getElementById('parish');
    const positionSelect = document.getElementById('position');
    const phoneInput = document.getElementById('phone');

    const fullName = fullNameInput ? fullNameInput.value.trim() : '';
    const parish = parishInput ? parishInput.value.trim() : '';
    const position = positionSelect ? positionSelect.value : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if (!fullName) {
      recordError(setFieldError('fullName', 'Please enter your full name.'), 'Full Name is required.');
    }
    if (!parish) {
      recordError(setFieldError('parish', 'Please select your parish.'), 'Parish Name is required.');
    }
    if (!position) {
      recordError(setFieldError('position', 'Please select official position.'), 'Official Position is required.');
    }

    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test(phone)) {
      recordError(setFieldError('phone', 'Please enter a valid 10-digit mobile phone number.'), 'Valid 10-digit phone number is required.');
    }

    // 2. Program Blocks
    const blocks = Array.from(document.querySelectorAll('.item-block'));
    if (blocks.length === 0) {
      showContainerError('Please add at least one program to register.');
      recordError(document.getElementById('addProgramBtn'), 'Please add at least one program.');
    }

    // Maps to track participant limits across the whole form:
    // Person key -> { name, individualCount: 0, groupCount: 0, individualItems: [], groupItems: [] }
    const personParticipation = new Map();

    const items = [];

    blocks.forEach((block, bIdx) => {
      const select = block.querySelector('.program-select');
      const progIdx = select.value;
      const blockErr = block.querySelector('.item-error-msg');

      if (!progIdx) {
        recordError(setCustomError(select, blockErr, 'Please select a program for this item.'), `Item ${bIdx + 1}: Select a program.`);
        return;
      }

      const prog = programs[progIdx];

      // Regular participants
      const regularCards = Array.from(block.querySelectorAll('.participants-container .participant-entry-card'));
      const participantsDetail = [];
      const participantNames = [];

      // Track duplicate persons INSIDE this group item
      const itemPersonSet = new Set();

      // Check required counts
      if (prog.fixed && regularCards.length !== prog.max) {
        recordError(setCustomError(select, blockErr, `${prog.name} requires exactly ${prog.max} participants. Currently has ${regularCards.length}.`), `${prog.name}: Must have exactly ${prog.max} participants.`);
      } else if (!prog.fixed && (regularCards.length < prog.min || regularCards.length > prog.max)) {
        recordError(setCustomError(select, blockErr, `${prog.name} requires between ${prog.min} and ${prog.max} participants.`), `${prog.name}: Count out of range.`);
      }

      regularCards.forEach((card, cIdx) => {
        const nameInput = card.querySelector('.p-name');
        const dobInput = card.querySelector('.p-dob');
        const genderSelect = card.querySelector('.p-gender');
        const cardErr = card.querySelector('.p-card-error');

        const pName = nameInput ? nameInput.value.trim() : '';
        const pDob = dobInput ? dobInput.value.trim() : '';
        let pGender = genderSelect ? genderSelect.value : '';

        // For forced gender, enforce value
        if (prog.gender === 'female_only') pGender = 'Female';
        if (prog.gender === 'male_only') pGender = 'Male';

        let cardHasError = false;

        if (!pName) {
          nameInput.classList.add('has-error');
          cardErr.textContent = 'Participant name is required.';
          cardErr.classList.add('visible');
          recordError(nameInput, `${prog.name} - Participant ${cIdx + 1}: Name is required.`);
          cardHasError = true;
        }

        if (!pDob) {
          dobInput.classList.add('has-error');
          cardErr.textContent = 'Date of birth is required.';
          cardErr.classList.add('visible');
          recordError(dobInput, `${prog.name} - Participant ${cIdx + 1}: Date of birth is required.`);
          cardHasError = true;
        } else {
          // Age validation: 15–40 years
          const age = calculateAgeOnEventDate(pDob);
          if (age === null || isNaN(age)) {
            dobInput.classList.add('has-error');
            cardErr.textContent = 'Invalid date of birth.';
            cardErr.classList.add('visible');
            recordError(dobInput, `${prog.name} - Participant ${cIdx + 1}: Invalid date of birth.`);
            cardHasError = true;
          } else if (age < MIN_AGE || age > MAX_AGE) {
            dobInput.classList.add('has-error');
            cardErr.textContent = `Age must be between ${MIN_AGE} and ${MAX_AGE} years. (Current calculated age: ${age} yrs).`;
            cardErr.classList.add('visible');
            recordError(dobInput, `${prog.name} - ${pName || `Participant ${cIdx + 1}`}: Age is ${age} (Must be between ${MIN_AGE} and ${MAX_AGE}).`);
            cardHasError = true;
          }
        }

        if (prog.gender === 'ask' && !pGender) {
          genderSelect.classList.add('has-error');
          cardErr.textContent = 'Gender selection is required for this competition.';
          cardErr.classList.add('visible');
          recordError(genderSelect, `${prog.name} - Participant ${cIdx + 1}: Gender is required.`);
          cardHasError = true;
        }

        if (pName && pDob) {
          const personKey = normalizeKey(pName, pDob);

          // Check duplicate within the same group item
          if (prog.type === 'group') {
            if (itemPersonSet.has(personKey)) {
              nameInput.classList.add('has-error');
              cardErr.textContent = `Duplicate entry: "${pName}" is already listed in this group item.`;
              cardErr.classList.add('visible');
              recordError(nameInput, `${prog.name}: "${pName}" cannot appear twice in the same group.`);
              cardHasError = true;
            } else {
              itemPersonSet.add(personKey);
            }
          }

          // Track form-wide limits: max 2 individual & max 2 group
          if (!personParticipation.has(personKey)) {
            personParticipation.set(personKey, {
              name: pName,
              dob: pDob,
              individualCount: 0,
              groupCount: 0,
              individualItems: [],
              groupItems: [],
              elements: []
            });
          }

          const record = personParticipation.get(personKey);
          record.elements.push(nameInput);

          if (prog.type === 'individual') {
            record.individualCount++;
            record.individualItems.push(prog.name);
            if (record.individualCount > 2) {
              nameInput.classList.add('has-error');
              cardErr.textContent = `Rule violation: "${pName}" is registered in more than 2 individual items (${record.individualItems.join(', ')}).`;
              cardErr.classList.add('visible');
              recordError(nameInput, `"${pName}" exceeds individual item limit (max 2).`);
              cardHasError = true;
            }
          } else {
            record.groupCount++;
            record.groupItems.push(prog.name);
            if (record.groupCount > 2) {
              nameInput.classList.add('has-error');
              cardErr.textContent = `Rule violation: "${pName}" is registered in more than 2 group items (${record.groupItems.join(', ')}).`;
              cardErr.classList.add('visible');
              recordError(nameInput, `"${pName}" exceeds group item limit (max 2).`);
              cardHasError = true;
            }
          }
        }

        if (!cardHasError) {
          participantNames.push(pName);
          participantsDetail.push({
            name: pName,
            dob: pDob,
            gender: pGender || 'Not Specified',
            role: 'Participant'
          });
        }
      });

      // Substitutes (optional)
      const subCards = Array.from(block.querySelectorAll('.substitutes-container .participant-entry-card'));
      const substitutesDetail = [];

      subCards.forEach((card, sIdx) => {
        const nameInput = card.querySelector('.p-name');
        const dobInput = card.querySelector('.p-dob');
        const genderSelect = card.querySelector('.p-gender');
        const cardErr = card.querySelector('.p-card-error');

        const sName = nameInput ? nameInput.value.trim() : '';
        const sDob = dobInput ? dobInput.value.trim() : '';
        let sGender = genderSelect ? genderSelect.value : '';

        // If card was touched / partially filled, validate it
        if (sName || sDob || sGender) {
          let subHasError = false;

          if (!sName) {
            nameInput.classList.add('has-error');
            cardErr.textContent = 'Substitute name is required.';
            cardErr.classList.add('visible');
            recordError(nameInput, `${prog.name} - Substitute ${sIdx + 1}: Name is required.`);
            subHasError = true;
          }

          if (!sDob) {
            dobInput.classList.add('has-error');
            cardErr.textContent = 'Date of birth is required.';
            cardErr.classList.add('visible');
            recordError(dobInput, `${prog.name} - Substitute ${sIdx + 1}: Date of birth is required.`);
            subHasError = true;
          } else {
            const age = calculateAgeOnEventDate(sDob);
            if (age === null || isNaN(age)) {
              dobInput.classList.add('has-error');
              cardErr.textContent = 'Invalid date of birth.';
              cardErr.classList.add('visible');
              recordError(dobInput, `${prog.name} - Substitute ${sIdx + 1}: Invalid date of birth.`);
              subHasError = true;
            } else if (age < MIN_AGE || age > MAX_AGE) {
              dobInput.classList.add('has-error');
              cardErr.textContent = `Age must be between ${MIN_AGE} and ${MAX_AGE} years. (Age: ${age} yrs).`;
              cardErr.classList.add('visible');
              recordError(dobInput, `${prog.name} - Substitute ${sName || (sIdx + 1)}: Age is ${age} (Must be between ${MIN_AGE} and ${MAX_AGE}).`);
              subHasError = true;
            }
          }

          if (prog.gender === 'female_only') sGender = 'Female';
          if (prog.gender === 'male_only') sGender = 'Male';

          if (!subHasError) {
            substitutesDetail.push({
              name: sName,
              dob: sDob,
              gender: sGender || 'Not Specified',
              role: 'Substitute'
            });
          }
        }
      });

      items.push({
        program: prog.name,
        // Backward-compatible pipe-joined string of participant names
        participants: participantNames.join(" | "),
        // Extra rich fields for 2026-27 Jwala Kalamela
        participantsDetail: participantsDetail,
        substitutes: substitutesDetail
      });
    });

    // 3. Declaration Checkbox (Requirement 4)
    const declarationCheck = document.getElementById('declarationCheck');
    const declarationError = document.getElementById('declarationCheckError');
    if (declarationCheck && !declarationCheck.checked) {
      if (declarationError) {
        declarationError.textContent = 'You must confirm this declaration to proceed with registration.';
        declarationError.classList.add('visible');
      }
      recordError(declarationCheck, 'Please accept the mandatory declaration confirming Central Assembly status and ID proof.');
    }

    // If any validation errors exist, display banner, scroll, and abort
    if (errorsList.length > 0) {
      const banner = document.getElementById('formErrorBanner');
      if (banner) {
        banner.innerHTML = `
          <strong>⚠️ Please fix the following errors before submitting:</strong>
          <ul style="margin: 8px 0 0 18px; padding: 0;">
            ${errorsList.map(e => `<li>${escapeHTML(e)}</li>`).join('')}
          </ul>
        `;
        banner.classList.add('visible');
      }

      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof firstErrorElement.focus === 'function') {
          firstErrorElement.focus();
        }
      }
      return;
    }

    // 4. Open Compact Submission Preview Modal instead of raw confirm()
    const submissionId = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now() + "-" + Math.random().toString(36).slice(2, 10);

    const payload = {
      submissionId,
      fullName,
      parish,
      position,
      phone,
      items
    };

    showPreviewModal(payload);
  }

  /* ===== MODAL & OVERLAY EVENT BINDINGS ===== */
  function initSubmissionModals() {
    // Preview overlay buttons
    const editFormBtn = document.getElementById('editFormBtn');
    if (editFormBtn) {
      editFormBtn.addEventListener('click', () => {
        hideOverlay('previewOverlay');
      });
    }

    const closePreviewBtn = document.getElementById('closePreviewBtn');
    if (closePreviewBtn) {
      closePreviewBtn.addEventListener('click', () => {
        hideOverlay('previewOverlay');
      });
    }

    const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
    if (confirmSubmitBtn) {
      confirmSubmitBtn.addEventListener('click', () => {
        hideOverlay('previewOverlay');
        if (pendingSubmissionPayload) {
          performPostSubmission(pendingSubmissionPayload);
        }
      });
    }

    const previewOverlay = document.getElementById('previewOverlay');
    if (previewOverlay) {
      previewOverlay.addEventListener('click', (e) => {
        if (e.target === previewOverlay) {
          hideOverlay('previewOverlay');
        }
      });
    }

    // Copy ID button
    const copyBtn = document.getElementById('copyRegIdBtn');
    const copyBtnText = document.getElementById('copyRegIdBtnText');
    const regIdEl = document.getElementById('successRegId');

    if (copyBtn && regIdEl) {
      copyBtn.addEventListener('click', async () => {
        const textToCopy = regIdEl.textContent.trim();
        let copiedSuccessfully = false;

        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(textToCopy);
            copiedSuccessfully = true;
          } catch (e) {
            copiedSuccessfully = false;
          }
        }

        if (!copiedSuccessfully) {
          // Fallback: select text for manual copy
          const range = document.createRange();
          range.selectNodeContents(regIdEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          try {
            copiedSuccessfully = document.execCommand('copy');
          } catch (e) {
            copiedSuccessfully = false;
          }
        }

        if (copiedSuccessfully) {
          copyBtn.classList.add('copied');
          if (copyBtnText) copyBtnText.textContent = 'Copied ✓';
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            if (copyBtnText) copyBtnText.textContent = 'Copy ID';
          }, 2000);
        }
      });
    }

    // Success overlay buttons
    const regAnotherBtn = document.getElementById('registerAnotherBtn');
    if (regAnotherBtn) {
      regAnotherBtn.addEventListener('click', () => {
        hideOverlay('successOverlay');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    if (closeSuccessBtn) {
      closeSuccessBtn.addEventListener('click', () => {
        hideOverlay('successOverlay');
      });
    }

    // Failure overlay buttons
    const retryBtn = document.getElementById('retrySubmitBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        hideOverlay('failureOverlay');
        if (lastSubmissionPayload) {
          performPostSubmission(lastSubmissionPayload);
        }
      });
    }

    const backToFormBtn = document.getElementById('backToFormBtn');
    if (backToFormBtn) {
      backToFormBtn.addEventListener('click', () => {
        hideOverlay('failureOverlay');
      });
    }

    // Escape key closes open overlays (except waitOverlay)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const previewModal = document.getElementById('previewOverlay');
        const successModal = document.getElementById('successOverlay');
        const failureModal = document.getElementById('failureOverlay');
        if (previewModal && previewModal.classList.contains('active')) {
          hideOverlay('previewOverlay');
        } else if (successModal && successModal.classList.contains('active')) {
          hideOverlay('successOverlay');
        } else if (failureModal && failureModal.classList.contains('active')) {
          hideOverlay('failureOverlay');
        }
      }
    });
  }

  // Backward compatibility for any remaining inline reference
  window.closeSuccessModal = function () {
    hideOverlay('successOverlay');
  };

  /* ===== SEARCHABLE PARISH DROPDOWN COMPONENT ===== */
  function initParishSelect() {
    const wrapper = document.getElementById('parishSelectWrapper');
    const triggerBtn = document.getElementById('parishTriggerBtn');
    const triggerText = document.getElementById('parishTriggerText');
    const panel = document.getElementById('parishDropdownPanel');
    const searchInput = document.getElementById('parishSearchInput');
    const optionsList = document.getElementById('parishOptionsList');
    const closeBtn = document.getElementById('parishSheetCloseBtn');
    const parishInput = document.getElementById('parish');
    const parishError = document.getElementById('parishError');

    if (!wrapper || !triggerBtn || !panel || !optionsList || !parishInput) return;

    const parishes = (window.PARISH_LIST && Array.isArray(window.PARISH_LIST)) ? window.PARISH_LIST : [];
    let isOpen = false;

    function renderList(query = '') {
      const q = query.trim().toLowerCase();
      optionsList.innerHTML = '';

      const filtered = parishes.filter(p => {
        if (!q) return true;
        return p.name.toLowerCase().includes(q);
      });

      if (filtered.length === 0) {
        const noRes = document.createElement('li');
        noRes.className = 'parish-no-results';
        noRes.textContent = 'No matching parish found (ഇടവക കണ്ടെത്താനായില്ല)';
        optionsList.appendChild(noRes);
        return;
      }

      filtered.forEach(p => {
        const li = document.createElement('li');
        li.className = 'parish-option-item';
        li.setAttribute('role', 'option');
        li.textContent = p.name;
        if (parishInput.value === p.name) {
          li.classList.add('selected');
          li.setAttribute('aria-selected', 'true');
        }

        li.addEventListener('click', (e) => {
          e.stopPropagation();
          selectParish(p.name);
        });

        optionsList.appendChild(li);
      });
    }

    function selectParish(name) {
      parishInput.value = name;
      triggerText.textContent = name;
      triggerText.classList.remove('placeholder');

      triggerBtn.classList.remove('has-error');
      if (parishError) {
        parishError.classList.remove('visible');
        parishError.textContent = '';
      }

      closeDropdown();
      triggerBtn.focus();
    }

    function openDropdown() {
      if (isOpen) return;
      isOpen = true;
      panel.classList.add('open');
      triggerBtn.classList.add('is-active');
      triggerBtn.setAttribute('aria-expanded', 'true');

      if (searchInput) {
        searchInput.value = '';
      }
      renderList('');

      // Lock body scroll on mobile only
      if (window.innerWidth <= 640) {
        document.body.style.overflow = 'hidden';
      }
    }

    function closeDropdown() {
      if (!isOpen) return;
      isOpen = false;
      panel.classList.remove('open');
      triggerBtn.classList.remove('is-active');
      triggerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    // Toggle on trigger click
    triggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    // Close button (Mobile Sheet header)
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeDropdown();
      });
    }

    // Backdrop click on mobile
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        closeDropdown();
      }
    });

    // Search filter
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderList(searchInput.value);
      });
    }

    // Close when clicking outside on desktop
    document.addEventListener('click', (e) => {
      if (!isOpen) return;
      if (!wrapper.contains(e.target)) {
        closeDropdown();
      }
    });

    // Keyboard support: Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeDropdown();
        triggerBtn.focus();
      }
    });

    // Initial render
    renderList('');
  }

  /* ===== STICKY FLOATING "GO TO FORM" BAR ===== */
  function initStickyFormBar() {
    const bar = document.getElementById('stickyFormBar');
    const form = document.getElementById('regForm');
    const jumpBtn = document.getElementById('stickyFormJumpBtn');
    if (!bar || !form) return;

    const onScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const formRect = form.getBoundingClientRect();
      const heroThreshold = 180;

      // Show bar when scrolled past hero, but hide once form top is within upper half of viewport
      const formReached = formRect.top <= (window.innerHeight * 0.45);

      if (scrollY > heroThreshold && !formReached) {
        bar.classList.add('visible');
        document.body.classList.add('sticky-bar-active');
      } else {
        bar.classList.remove('visible');
        document.body.classList.remove('sticky-bar-active');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    if (jumpBtn) {
      jumpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

})();
