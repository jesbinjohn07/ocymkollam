/* ==========================================================================
   OCYM Kollam – Registration Engine (2026-27 Kalamela Edition)
   --------------------------------------------------------------------------
   - State-driven "Select event, then edit" bottom sheet/modal workflow
   - Rule 4: Completed 15 years, under 40 on 9 January 2027
   - Rule 7: Optional substitutes (max 2 for group items)
   - Rule 9: Max 2 individual & 2 group events per participant (name + DOB)
   - English-only sticky summary bar with "Review & Submit"
   - 3-button unsaved changes confirmation dialog
   ========================================================================== */

(function () {
  'use strict';

  /* ===== COMPETITION DATE & AGE CONFIG ===== */
  const COMPETITION_DATE = new Date(2027, 0, 9); // 9 January 2027 (Month 0 = Jan)
  const MIN_AGE = 15; // Completed 15 years
  const MAX_AGE = 40; // Under 40 on that date (age < 40)

  /* ===== 18 VERBATIM KALAMELA PROGRAMS ===== */
  const programs = [
    // --- 12 Individual Items (1 participant each) ---
    {
      name: "ലളിതഗാനം (Male)",
      type: "individual",
      min: 1,
      max: 1,
      gender: "male_only",
      substitutes: false,
      note: "പുരുഷന്മാർക്ക് മാത്രം"
    },
    {
      name: "ലളിതഗാനം (Female)",
      type: "individual",
      min: 1,
      max: 1,
      gender: "female_only",
      substitutes: false,
      note: "വനിതകൾക്ക് മാത്രം"
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
      note: "വയലിൻ – ഈസ്റ്റേൺ ശൈലി"
    },
    {
      name: "സ്ട്രിംഗ് ഇൻസ്ട്രുമെൻ്റ് (ഗിറ്റാർ – വെസ്റ്റേൺ)",
      type: "individual",
      min: 1,
      max: 1,
      gender: "any",
      substitutes: false,
      note: "ഗിറ്റാർ – വെസ്റ്റേൺ ശൈലി"
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
      note: "പെൻസിൽ ചിത്രരചന"
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

    // --- 7 Group Items ---
    {
      name: "സമൂഹഗാനം",
      type: "group",
      min: 3,
      max: 3,
      fixed: true,
      gender: "any",
      substitutes: true, // Rule 7: max 2 substitutes
      note: "കൃത്യം 3 അംഗങ്ങൾ"
    },
    {
      name: "സോപോകരണ സമൂഹഗാനം",
      type: "group",
      min: 1,
      max: 7,
      fixed: false,
      gender: "any",
      substitutes: true, // Rule 7: max 2 substitutes
      note: "പരമാവധി 7 അംഗങ്ങൾ (പാട്ടുകാരും വാദ്യക്കാരും ഉൾപ്പെടെ)"
    },
    {
      name: "മാർഗംകളി",
      type: "group",
      min: 1,
      max: 8,
      fixed: false,
      gender: "female_only",
      substitutes: true, // Rule 7: max 2 substitutes
      note: "വനിതകൾ മാത്രം, പരമാവധി 8 പേർ (2 പാട്ടുകാർ ഉൾപ്പെടെ)"
    },
    {
      name: "പരിചമുട്ട് കളി",
      type: "group",
      min: 1,
      max: 8,
      fixed: false,
      gender: "male_only",
      substitutes: true, // Rule 7: max 2 substitutes
      note: "പുരുഷന്മാർ മാത്രം, പരമാവധി 8 പേർ (പാട്ടുകാർ ഉൾപ്പെടെ)"
    },
    {
      name: "തെരുവ് നാടകം",
      type: "group",
      min: 1,
      max: 10,
      fixed: false,
      gender: "any",
      substitutes: true, // Rule 7: max 2 substitutes
      note: "പരമാവധി 10 അംഗങ്ങൾ"
    },
    {
      name: "ക്വിസ്",
      type: "group",
      min: 3,
      max: 3,
      fixed: true,
      gender: "any",
      substitutes: false,
      note: "കൃത്യം 3 അംഗങ്ങൾ"
    },
    {
      name: "മൈം",
      type: "group",
      min: 1,
      max: 7,
      fixed: false,
      gender: "any",
      substitutes: true, // Rule 7: max 2 substitutes
      note: "പരമാവധി 7 അംഗങ്ങൾ"
    }
  ];

  /* ===== APPLICATION STATE ===== */
  // Map of progIdx (number) => { progIdx, program, type, participantsDetail: [], substitutes: [] }
  const selectedEventsState = new Map();

  let isSubmitting = false;
  let submissionSucceeded = false;
  let lastSubmissionPayload = null;
  let pendingSubmissionPayload = null;

  // Edit sheet active state tracking
  let currentEditingProgIdx = null;
  let initialSheetStateSnapshot = null;
  let isSheetOpen = false;

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

  function normalizePersonName(name) {
    if (!name) return '';
    return String(name).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function getPersonNormalizedKey(name, dob) {
    const cleanName = normalizePersonName(name);
    const cleanDob = String(dob || '').trim();
    if (!cleanName || !cleanDob) return null;
    return `${cleanName}|${cleanDob}`;
  }

  function formatIsoToDdmmyyyy(isoDate) {
    if (!isoDate) return '';
    const parts = String(isoDate).trim().split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    return isoDate;
  }

  function parseDdmmyyyyToIso(dateStr) {
    if (!dateStr) return null;
    const clean = String(dateStr).trim();
    // Match DD/MM/YYYY or DD-MM-YYYY
    const match = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
    // Validate actual days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return null;
    const pad = n => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  /**
   * Calculates completed age on competition date (9 January 2027)
   */
  function calculateAgeOnEventDate(dobString) {
    if (!dobString) return null;
    let iso = dobString;
    if (dobString.includes('/')) {
      iso = parseDdmmyyyyToIso(dobString);
      if (!iso) return null;
    }
    const parts = iso.split('-');
    if (parts.length !== 3) return null;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10);
    const birthDay = parseInt(parts[2], 10);

    if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;

    const refYear = COMPETITION_DATE.getFullYear();
    const refMonth = COMPETITION_DATE.getMonth() + 1;
    const refDay = COMPETITION_DATE.getDate();

    let age = refYear - birthYear;
    if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
      age--;
    }
    return age;
  }

  /* ===== REGISTRATION AVAILABILITY CHECK ===== */
  function checkRegistrationOpenStatus() {
    const isOpen = (window.SHOW_REGISTRATION !== false);
    const regForm = document.getElementById("regForm");
    const pickerCard = document.getElementById("programPickerCard");
    const stickyBar = document.getElementById("stickySummaryBar");
    const rulesCard = document.querySelector(".kalamela-rules-card");
    const closedNotice = document.getElementById("registrationClosedNotice");
    const heroActions = document.querySelector(".kalamela-hero-actions");
    const heroScrollHint = document.querySelector(".kalamela-scroll-hint");

    if (!isOpen) {
      if (regForm) regForm.style.display = "none";
      if (pickerCard) pickerCard.style.display = "none";
      if (stickyBar) stickyBar.style.display = "none";
      if (rulesCard) rulesCard.style.display = "none";
      if (heroActions) heroActions.style.display = "none";
      if (heroScrollHint) heroScrollHint.style.display = "none";
      if (closedNotice) closedNotice.style.display = "block";
      document.body.classList.remove("sticky-bar-active");
    } else {
      if (regForm) regForm.style.display = "block";
      if (pickerCard) pickerCard.style.display = "block";
      if (rulesCard) rulesCard.style.display = "block";
      if (closedNotice) closedNotice.style.display = "none";
      if (heroActions) heroActions.style.display = "flex";
      if (heroScrollHint) heroScrollHint.style.display = "flex";
      if (stickyBar) {
        stickyBar.style.display = "block";
        document.body.classList.add("sticky-bar-active");
      }
    }
    return isOpen;
  }

  /* ===== DOM INITIALIZATION ===== */
  document.addEventListener("DOMContentLoaded", () => {
    // 0. Check whether registrations are open
    checkRegistrationOpenStatus();

    // 1. Initial render of event cards
    renderEventCards();

    // 2. Form submission binding
    const regForm = document.getElementById("regForm");
    if (regForm) {
      regForm.addEventListener("submit", onSubmit);
    }

    // 3. Declaration checkboxes live clearing
    const centralKalamelaCheck = document.getElementById("centralKalamelaCheck");
    if (centralKalamelaCheck) {
      centralKalamelaCheck.addEventListener("change", () => {
        if (centralKalamelaCheck.checked) {
          const err = document.getElementById("centralKalamelaCheckError");
          if (err) {
            err.classList.remove("visible");
            err.textContent = "";
          }
        }
      });
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

    // 4. Initialize components & modals
    initParishSelect();
    initSubmissionModals();
    initEditSheetHandlers();
    initStickySummaryBar();
    initCategoryToggle();
    initContactFields();

    // 5. Unsaved changes beforeunload protection
    window.addEventListener('beforeunload', (e) => {
      if (selectedEventsState.size > 0 && !isSubmitting && !submissionSucceeded) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // 6. Mobile browser history popstate handling (Phone back button)
    window.addEventListener('popstate', (e) => {
      if (isSheetOpen) {
        if (hasUnsavedSheetChanges()) {
          // Push state back so page doesn't exit, and show unsaved modal
          history.pushState({ editSheetOpen: true, progIdx: currentEditingProgIdx }, '');
          showUnsavedModal();
        } else {
          // The browser already popped the history entry when popstate fired
          closeEditSheet(false);
        }
      }
    });
  });

  /* ==========================================================================
     EVENT PICKER CARDS (GRID RENDERING)
     ========================================================================== */
  function renderEventCards() {
    const indivContainer = document.getElementById('individualEventsGrid') || document.getElementById('individualEventsList');
    const groupContainer = document.getElementById('groupEventsGrid') || document.getElementById('groupEventsList');
    if (!indivContainer || !groupContainer) return;

    indivContainer.innerHTML = '';
    groupContainer.innerHTML = '';

    programs.forEach((prog, idx) => {
      const isIndiv = prog.type === 'individual';
      const container = isIndiv ? indivContainer : groupContainer;
      const isSaved = selectedEventsState.has(idx);
      const savedData = selectedEventsState.get(idx);

      const card = document.createElement('div');
      card.className = `event-card ${isSaved ? 'is-saved' : ''}`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('data-prog-idx', String(idx));
      card.setAttribute('aria-label', `${prog.name} (${isSaved ? 'Saved' : 'Not configured'})`);

      // Rule badge label (compact for mobile readability)
      let ruleLabel = '';
      if (isIndiv) {
        ruleLabel = '1 പേർ (Single)';
      } else if (prog.fixed) {
        ruleLabel = `കൃത്യം ${prog.max} അംഗങ്ങൾ`;
      } else {
        ruleLabel = `പരമാവധി ${prog.max} അംഗങ്ങൾ`;
      }

      // Card Top
      let topHtml = `
        <div class="event-card-top">
          <h4 class="event-card-title">${escapeHTML(prog.name)}</h4>
          <span class="event-card-rule-pill">${escapeHTML(ruleLabel)}</span>
        </div>
      `;

      // Card Note (if present)
      let noteHtml = prog.note ? `<div class="event-card-note">ℹ️ ${escapeHTML(prog.note)}</div>` : '';

      // Card Bottom / Saved info
      let bottomHtml = '';
      if (isSaved && savedData) {
        const pCount = (savedData.participantsDetail || []).length;
        const sCount = (savedData.substitutes || []).length;
        const namesSummary = savedData.participantsDetail.map(p => escapeHTML(p.name)).join(', ');

        bottomHtml = `
          <div class="event-card-participants-preview">
            <span class="event-card-saved-badge">✓ സേവ് ചെയ്തു (Saved)</span>
            <span class="event-card-p-chip" title="${namesSummary}">👤 ${pCount} പേർ${sCount > 0 ? ` (+${sCount} sub)` : ''}: ${namesSummary}</span>
          </div>
          <div class="event-card-bottom">
            <span style="font-size:0.75rem; color:var(--text-muted);">ടാപ്പ് ചെയ്ത് മാറ്റങ്ങൾ വരുത്താം</span>
            <div class="event-card-btn-group">
              <button type="button" class="event-card-btn btn-card-edit" data-edit-idx="${idx}" aria-label="Edit ${escapeHTML(prog.name)}">
                ✏️ Edit
              </button>
              <button type="button" class="event-card-btn btn-card-remove" data-remove-idx="${idx}" aria-label="Remove ${escapeHTML(prog.name)}">
                🗑️ Remove
              </button>
            </div>
          </div>
        `;
      } else {
        bottomHtml = `
          <div class="event-card-bottom">
            <span class="event-card-action-hint">
              <span>+ ചേർക്കുക (Add Entry)</span>
            </span>
            <span style="font-size: 0.85rem; color: var(--secondary-dark);">➔</span>
          </div>
        `;
      }

      card.innerHTML = topHtml + noteHtml + bottomHtml;

      // Event Listeners for the card
      card.addEventListener('click', (e) => {
        // Prevent trigger if clicking remove button
        if (e.target.closest('.btn-card-remove')) {
          e.stopPropagation();
          const remIdx = parseInt(e.target.closest('.btn-card-remove').dataset.removeIdx, 10);
          removeSavedEvent(remIdx);
          return;
        }
        openEditSheet(idx);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEditSheet(idx);
        }
      });

      container.appendChild(card);
    });

    updateSummaryBar();
  }

  /* ==========================================================================
     PARISH OFFICIAL EXTENDED FIELDS (GROUP, VICAR, CENTRAL REG, DESIGNATION)
     ========================================================================== */
  function initContactFields() {
    // 1. Populate window.GROUP_LIST into #group dropdown if options not yet populated
    const groupSelect = document.getElementById('group');
    if (groupSelect) {
      if (Array.isArray(window.GROUP_LIST) && window.GROUP_LIST.length > 0 && groupSelect.options.length <= 1) {
        window.GROUP_LIST.forEach(grp => {
          const opt = document.createElement('option');
          opt.value = grp;
          opt.textContent = grp;
          groupSelect.appendChild(opt);
        });
      }

      // Keep placeholder color in sync with selection
      const syncGroupColor = () => {
        if (!groupSelect.value) {
          groupSelect.classList.add('is-placeholder');
        } else {
          groupSelect.classList.remove('is-placeholder');
        }
      };
      groupSelect.addEventListener('change', syncGroupColor);
      syncGroupColor();
    }

    // 2. Central-Diocese Unit Registration Radio Listeners
    const centralRegRadios = document.querySelectorAll('input[name="centralRegistered"]');
    const centralRegNote = document.getElementById('centralRegNote');
    const centralRegErr = document.getElementById('centralRegisteredError');

    centralRegRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (centralRegErr) {
          centralRegErr.classList.remove('visible');
          centralRegErr.textContent = '';
        }
        document.querySelectorAll('input[name="centralRegistered"]').forEach(r => {
          const parent = r.closest('.radio-card-option');
          if (parent) parent.classList.toggle('is-checked', r.checked);
        });
        if (centralRegNote) {
          centralRegNote.style.display = (radio.value === 'No' && radio.checked) ? 'block' : 'none';
        }
      });
    });

    // 3. Designation Radio Listeners
    const desigRadios = document.querySelectorAll('input[name="designationRadio"]');
    const otherWrap = document.getElementById('otherDesignationWrap');
    const otherInput = document.getElementById('otherDesignation');
    const desigErr = document.getElementById('designationError');
    const otherErr = document.getElementById('otherDesignationError');

    desigRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (desigErr) {
          desigErr.classList.remove('visible');
          desigErr.textContent = '';
        }
        document.querySelectorAll('input[name="designationRadio"]').forEach(r => {
          const parent = r.closest('.radio-card-option');
          if (parent) parent.classList.toggle('is-checked', r.checked);
        });
        if (radio.value === 'Others' && radio.checked) {
          if (otherWrap) otherWrap.style.display = 'block';
          if (otherInput) otherInput.focus();
        } else if (radio.checked) {
          if (otherWrap) otherWrap.style.display = 'none';
          if (otherInput) {
            otherInput.value = '';
            otherInput.classList.remove('has-error');
          }
          if (otherErr) {
            otherErr.classList.remove('visible');
            otherErr.textContent = '';
          }
        }
      });
    });

    // 4. Live error clearing on text and select inputs
    ['group', 'vicarName', 'vicarPhone', 'fullName', 'phone', 'otherDesignation'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => {
          el.classList.remove('has-error');
          const err = document.getElementById(id + 'Error');
          if (err) {
            err.classList.remove('visible');
            err.textContent = '';
          }
        });
        el.addEventListener('change', () => {
          el.classList.remove('has-error');
          const err = document.getElementById(id + 'Error');
          if (err) {
            err.classList.remove('visible');
            err.textContent = '';
          }
        });
      }
    });
  }

  /* ===== CATEGORY SEGMENTED TOGGLE (INDIVIDUAL / GROUP) ===== */
  function initCategoryToggle() {
    const btnIndiv = document.getElementById('btnToggleIndiv');
    const btnGroup = document.getElementById('btnToggleGroup');
    const sectionIndiv = document.getElementById('sectionIndivEvents');
    const sectionGroup = document.getElementById('sectionGroupEvents');

    if (!btnIndiv || !btnGroup || !sectionIndiv || !sectionGroup) return;

    function switchCategory(type) {
      if (type === 'individual') {
        btnIndiv.classList.add('active');
        btnIndiv.setAttribute('aria-selected', 'true');
        btnGroup.classList.remove('active');
        btnGroup.setAttribute('aria-selected', 'false');

        sectionIndiv.style.display = 'block';
        sectionGroup.style.display = 'none';
      } else {
        btnGroup.classList.add('active');
        btnGroup.setAttribute('aria-selected', 'true');
        btnIndiv.classList.remove('active');
        btnIndiv.setAttribute('aria-selected', 'false');

        sectionGroup.style.display = 'block';
        sectionIndiv.style.display = 'none';
      }
    }

    btnIndiv.addEventListener('click', () => switchCategory('individual'));
    btnGroup.addEventListener('click', () => switchCategory('group'));
  }

  function updateSummaryBar() {
    if (window.SHOW_REGISTRATION === false) {
      const stickyBar = document.getElementById('stickySummaryBar');
      if (stickyBar) stickyBar.style.display = 'none';
      document.body.classList.remove('sticky-bar-active');
      return;
    }

    const count = selectedEventsState.size;

    // Update live counts on category toggle buttons
    let indivSelected = 0;
    let groupSelected = 0;
    selectedEventsState.forEach((val, idx) => {
      const p = programs[idx];
      if (p) {
        if (p.type === 'individual') indivSelected++;
        else groupSelected++;
      }
    });

    const badgeIndiv = document.getElementById('badgeIndivCount');
    if (badgeIndiv) {
      badgeIndiv.textContent = indivSelected + '/12';
      badgeIndiv.classList.toggle('has-saved', indivSelected > 0);
    }

    const badgeGroup = document.getElementById('badgeGroupCount');
    if (badgeGroup) {
      badgeGroup.textContent = groupSelected + '/7';
      badgeGroup.classList.toggle('has-saved', groupSelected > 0);
    }

    const stickyBar = document.getElementById('stickySummaryBar');
    if (stickyBar) {
      stickyBar.style.display = 'block';
      document.body.classList.add('sticky-bar-active');
    }

    const badge = document.getElementById('pickerCountBadge');
    if (badge) {
      badge.textContent = `${count} Selected`;
      badge.classList.toggle('has-selected', count > 0);
    }

    const summaryBadge = document.getElementById('summaryCountBadge');
    if (summaryBadge) {
      summaryBadge.textContent = `🎯 ${count} Program${count === 1 ? '' : 's'} Selected`;
    }

    const reviewBtn = document.getElementById('summaryReviewBtn');
    if (reviewBtn) {
      reviewBtn.disabled = (count === 0);
    }

    const clearBtn = document.getElementById('summaryClearBtn');
    if (clearBtn) {
      clearBtn.style.display = count > 0 ? 'inline-block' : 'none';
    }

    // Hide container error if any items selected
    if (count > 0) {
      hideContainerError();
    }
  }

  /* ==========================================================================
     EVENT EDIT BOTTOM SHEET / MODAL LOGIC
     ========================================================================== */
  function openEditSheet(progIdx) {
    submissionSucceeded = false;
    currentEditingProgIdx = progIdx;
    const prog = programs[progIdx];
    if (!prog) return;

    const overlay = document.getElementById('editEventOverlay');
    const titleEl = document.getElementById('sheetEventTitle');
    const typeBadge = document.getElementById('sheetTypeBadge');
    const ruleBadge = document.getElementById('sheetRuleBadge');
    const noteBox = document.getElementById('sheetNoteBox');
    const errBanner = document.getElementById('sheetErrorBanner');
    const removeBtn = document.getElementById('sheetRemoveBtn');
    const partsContainer = document.getElementById('sheetParticipantsContainer');
    const subsContainer = document.getElementById('sheetSubstitutesContainer');

    if (!overlay || !partsContainer || !subsContainer) return;

    // Set Header info
    titleEl.textContent = prog.name;
    const isIndiv = prog.type === 'individual';
    typeBadge.textContent = isIndiv ? 'വ്യക്തിഗത ഇനം (Individual)' : 'ഗ്രൂപ്പ് ഇനം (Group)';
    
    if (isIndiv) {
      ruleBadge.textContent = '1 മത്സരാർത്ഥി (1 Person)';
    } else if (prog.fixed) {
      ruleBadge.textContent = `കൃത്യം ${prog.max} അംഗങ്ങൾ (Exact ${prog.max})`;
    } else {
      ruleBadge.textContent = `കുറഞ്ഞത് ${prog.min}, പരമാവധി ${prog.max} അംഗങ്ങൾ`;
    }

    if (prog.note) {
      noteBox.style.display = 'block';
      noteBox.innerHTML = `ℹ️ <em>${escapeHTML(prog.note)}</em>`;
    } else {
      noteBox.style.display = 'none';
      noteBox.textContent = '';
    }

    // Reset errors
    errBanner.classList.remove('visible');
    errBanner.textContent = '';

    // Populate participant form fields
    partsContainer.innerHTML = '';
    subsContainer.innerHTML = '';

    const isSaved = selectedEventsState.has(progIdx);
    const existingData = selectedEventsState.get(progIdx);

    // Show/hide sheet remove button
    if (removeBtn) {
      removeBtn.style.display = isSaved ? 'inline-flex' : 'none';
    }

    // Render Participants section header
    const pHeader = document.createElement('div');
    pHeader.style.display = 'flex';
    pHeader.style.justifyContent = 'space-between';
    pHeader.style.alignItems = 'center';
    pHeader.style.marginBottom = '10px';
    pHeader.style.flexWrap = 'wrap';
    pHeader.style.gap = '8px';

    const pTitle = document.createElement('span');
    pTitle.style.fontWeight = '700';
    pTitle.style.fontSize = '0.92rem';
    pTitle.style.color = 'var(--primary)';
    pTitle.textContent = isIndiv ? 'Participant Details (മത്സരാർത്ഥിയുടെ വിവരങ്ങൾ):' : 'Team Members (ടീം അംഗങ്ങൾ):';
    pHeader.appendChild(pTitle);

    // If group non-fixed, add Member button
    if (!isIndiv && !prog.fixed) {
      const addMemberBtn = document.createElement('button');
      addMemberBtn.type = 'button';
      addMemberBtn.className = 'btn btn-outline btn-sm add-member-btn';
      addMemberBtn.style.padding = '4px 10px';
      addMemberBtn.style.fontSize = '0.8rem';
      addMemberBtn.textContent = `+ Add Member (Max ${prog.max})`;
      addMemberBtn.addEventListener('click', () => {
        const count = partsContainer.querySelectorAll('.participant-entry-card').length;
        if (count < prog.max) {
          renderParticipantCard(partsContainer, prog, count + 1, false, null);
          updateAddMemberButtonState(partsContainer, addMemberBtn, prog.max);
        }
      });
      pHeader.appendChild(addMemberBtn);
    }

    partsContainer.appendChild(pHeader);

    const cardsWrapper = document.createElement('div');
    cardsWrapper.className = 'sheet-cards-list';
    partsContainer.appendChild(cardsWrapper);

    // Populate participants cards
    if (isSaved && existingData && existingData.participantsDetail && existingData.participantsDetail.length > 0) {
      existingData.participantsDetail.forEach((p, pIdx) => {
        renderParticipantCard(cardsWrapper, prog, pIdx + 1, false, p);
      });
    } else {
      const initialCount = prog.fixed ? prog.max : prog.min;
      for (let i = 1; i <= initialCount; i++) {
        renderParticipantCard(cardsWrapper, prog, i, false, null);
      }
    }

    const addMemberBtn = pHeader.querySelector('.add-member-btn');
    if (addMemberBtn) {
      updateAddMemberButtonState(cardsWrapper, addMemberBtn, prog.max);
    }

    // Rule 7: Substitutes Section (Group items with substitutes: true)
    if (prog.substitutes) {
      subsContainer.style.display = 'block';
      buildSheetSubstitutesSection(subsContainer, prog, isSaved && existingData ? existingData.substitutes : []);
    } else {
      subsContainer.style.display = 'none';
    }

    // Snapshot form state for unsaved changes detection
    initialSheetStateSnapshot = serializeSheetForm();
    isSheetOpen = true;

    // Push browser history state for mobile back button
    history.pushState({ editSheetOpen: true, progIdx }, '');

    showOverlay('editEventOverlay');

    // Focus first input
    const firstInput = partsContainer.querySelector('input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 150);
    }
  }

  function renderParticipantCard(parentContainer, prog, index, isSubstitute, initialVal) {
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

    // Remove button if group non-fixed & count > min, or if substitute
    if (!isSubstitute && prog.type === 'group' && !prog.fixed && index > prog.min) {
      const remBtn = document.createElement('button');
      remBtn.type = 'button';
      remBtn.className = 'p-card-remove-btn';
      remBtn.style.cssText = 'background:none; border:none; color:#dc2626; cursor:pointer; font-size:0.8rem;';
      remBtn.textContent = '✕ Remove';
      remBtn.addEventListener('click', () => {
        card.remove();
        renumberParticipants(parentContainer);
        const addBtn = parentContainer.parentElement.querySelector('.add-member-btn');
        if (addBtn) updateAddMemberButtonState(parentContainer, addBtn, prog.max);
      });
      header.appendChild(remBtn);
    } else if (isSubstitute) {
      const remBtn = document.createElement('button');
      remBtn.type = 'button';
      remBtn.style.cssText = 'background:none; border:none; color:#dc2626; cursor:pointer; font-size:0.8rem;';
      remBtn.textContent = '✕ Remove';
      remBtn.addEventListener('click', () => {
        const subBox = parentContainer.closest('.substitutes-box');
        card.remove();
        if (subBox) {
          renumberSubstitutes(subBox);
          const addSubBtn = subBox.querySelector('.add-sub-btn');
          if (addSubBtn) updateAddSubButtonState(subBox, addSubBtn);
        }
      });
      header.appendChild(remBtn);
    }

    card.appendChild(header);

    // Inputs Grid
    const grid = document.createElement('div');
    grid.className = 'participant-fields-grid';

    // 1. Full Name
    const nameCol = document.createElement('div');
    const existingName = initialVal && initialVal.name ? escapeHTML(initialVal.name) : '';
    nameCol.innerHTML = `
      <label class="form-label" style="font-size: 0.8rem; margin-bottom: 3px;">Full Name <span style="color:#dc2626;">*</span></label>
      <input type="text" class="form-control p-name" placeholder="Name as in ID proof" value="${existingName}" ${!isSubstitute ? 'required' : ''}>
    `;
    grid.appendChild(nameCol);

    // 2. Date of Birth
    const minBirthDate = new Date(COMPETITION_DATE.getFullYear() - MAX_AGE, COMPETITION_DATE.getMonth(), COMPETITION_DATE.getDate() + 1);
    const maxBirthDate = new Date(COMPETITION_DATE.getFullYear() - MIN_AGE, COMPETITION_DATE.getMonth(), COMPETITION_DATE.getDate());
    const padDatePart = n => String(n).padStart(2, '0');
    const minIso = `${minBirthDate.getFullYear()}-${padDatePart(minBirthDate.getMonth() + 1)}-${padDatePart(minBirthDate.getDate())}`;
    const maxIso = `${maxBirthDate.getFullYear()}-${padDatePart(maxBirthDate.getMonth() + 1)}-${padDatePart(maxBirthDate.getDate())}`;

    const dobCol = document.createElement('div');
    const existingDob = initialVal && initialVal.dob ? initialVal.dob : '';
    const dobValue = existingDob ? (existingDob.includes('/') ? parseDdmmyyyyToIso(existingDob) : existingDob) : '';
    dobCol.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3px;">
        <label class="form-label" style="font-size: 0.8rem; margin: 0;">Date of Birth <span style="color:#dc2626;">*</span></label>
        <span class="age-badge" style="font-size: 0.76rem; font-weight: 700; color: var(--primary); display: none;"></span>
      </div>
      <div class="dob-field-wrap${dobValue ? ' has-value' : ''}">
        <input type="date" class="form-control p-dob" min="${minIso}" max="${maxIso}" value="${dobValue}" placeholder="dd/mm/yyyy" ${!isSubstitute ? 'required' : ''}>
        <span class="dob-placeholder-text">dd/mm/yyyy</span>
        <span class="dob-calendar-icon" aria-hidden="true">📅</span>
      </div>
    `;
    grid.appendChild(dobCol);

    // 3. Gender
    const genderCol = document.createElement('div');
    const isFemaleOnly = prog.gender === 'female_only';
    const isMaleOnly = prog.gender === 'male_only';
    const reqStar = (isFemaleOnly || isMaleOnly) ? '<span style="color:#dc2626;">*</span>' : '';

    let genderHtml = `
      <label class="form-label" style="font-size: 0.8rem; margin-bottom: 3px;">Gender ${reqStar}</label>
      <select class="form-control p-gender">
    `;

    const savedGender = initialVal && initialVal.gender ? initialVal.gender : '';

    if (isFemaleOnly) {
      genderHtml += `<option value="Female" selected>Female</option>`;
    } else if (isMaleOnly) {
      genderHtml += `<option value="Male" selected>Male</option>`;
    } else {
      genderHtml += `
        <option value="">Select (Optional)</option>
        <option value="Female" ${savedGender === 'Female' ? 'selected' : ''}>Female</option>
        <option value="Male" ${savedGender === 'Male' ? 'selected' : ''}>Male</option>
        <option value="Other" ${savedGender === 'Other' ? 'selected' : ''}>Other</option>
      `;
    }
    genderHtml += `</select>`;
    genderCol.innerHTML = genderHtml;

    if (isFemaleOnly || isMaleOnly) {
      const sel = genderCol.querySelector('.p-gender');
      if (sel) sel.disabled = true;
    }

    grid.appendChild(genderCol);
    card.appendChild(grid);

    // Inline Card Error Container
    const pErr = document.createElement('div');
    pErr.className = 'form-error-msg p-card-error';
    card.appendChild(pErr);

    // Live age badge & validation
    const dobWrap = dobCol.querySelector('.dob-field-wrap');
    const dobInput = dobCol.querySelector('.p-dob');
    const ageBadge = dobCol.querySelector('.age-badge');

    const syncDobState = () => {
      const val = dobInput.value ? dobInput.value.trim() : '';
      if (val) {
        if (dobWrap) dobWrap.classList.add('has-value');
      } else {
        if (dobWrap) dobWrap.classList.remove('has-value');
      }
      updateAgeLive();
    };

    const updateAgeLive = () => {
      const val = dobInput.value.trim();
      if (!val) {
        ageBadge.style.display = 'none';
        ageBadge.textContent = '';
        dobInput.classList.remove('has-error');
        pErr.classList.remove('visible');
        pErr.textContent = '';
        return;
      }
      if (val.length < 10) {
        ageBadge.style.display = 'none';
        return;
      }
      const age = calculateAgeOnEventDate(val);
      if (age === null || isNaN(age)) {
        ageBadge.style.display = 'none';
        dobInput.classList.add('has-error');
        pErr.textContent = 'Invalid date of birth.';
        pErr.classList.add('visible');
        return;
      }
      ageBadge.style.display = 'inline-block';
      ageBadge.textContent = `Age: ${age} yrs`;

      if (age < MIN_AGE) {
        ageBadge.style.color = '#dc2626';
        dobInput.classList.add('has-error');
        pErr.textContent = `Age must be completed 15 years as of 9 January 2027 (Calculated: ${age} yrs).`;
        pErr.classList.add('visible');
      } else if (age >= MAX_AGE) {
        ageBadge.style.color = '#dc2626';
        dobInput.classList.add('has-error');
        pErr.textContent = `Age must be under 40 on 9 January 2027 (Calculated: ${age} yrs).`;
        pErr.classList.add('visible');
      } else {
        ageBadge.style.color = '#15803d';
        dobInput.classList.remove('has-error');
        pErr.classList.remove('visible');
        pErr.textContent = '';
      }
    };

    dobInput.addEventListener('change', syncDobState);
    dobInput.addEventListener('input', syncDobState);

    if (existingDob) {
      syncDobState();
    }

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

  function updateAddMemberButtonState(partsContainer, btn, max) {
    const currentCount = partsContainer.querySelectorAll('.participant-entry-card').length;
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

  /* ===== SUBSTITUTES SECTION (Rule 7 - Max 2) ===== */
  function buildSheetSubstitutesSection(container, prog, initialSubs) {
    container.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'substitutes-box';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';
    header.style.flexWrap = 'wrap';
    header.style.gap = '8px';

    const title = document.createElement('span');
    title.style.fontWeight = '700';
    title.style.fontSize = '0.88rem';
    title.style.color = 'var(--primary)';
    title.innerHTML = `🔁 Substitutes (Max 2)`;
    header.appendChild(title);

    const addSubBtn = document.createElement('button');
    addSubBtn.type = 'button';
    addSubBtn.className = 'btn btn-outline btn-sm add-sub-btn';
    addSubBtn.style.padding = '3px 10px';
    addSubBtn.style.fontSize = '0.78rem';
    addSubBtn.textContent = '+ Add Substitute (0/2)';

    header.appendChild(addSubBtn);
    box.appendChild(header);

    const subList = document.createElement('div');
    subList.className = 'substitutes-list';
    box.appendChild(subList);

    addSubBtn.addEventListener('click', () => {
      const count = subList.querySelectorAll('.participant-entry-card').length;
      if (count < 2) {
        renderParticipantCard(subList, prog, count + 1, true, null);
        updateAddSubButtonState(box, addSubBtn);
      }
    });

    if (Array.isArray(initialSubs) && initialSubs.length > 0) {
      initialSubs.forEach((sub, sIdx) => {
        renderParticipantCard(subList, prog, sIdx + 1, true, sub);
      });
      updateAddSubButtonState(box, addSubBtn);
    }

    container.appendChild(box);
  }

  /* ===== SHEET SERIALIZATION FOR UNSAVED CHANGES ===== */
  function serializeSheetForm() {
    const sheet = document.getElementById('editEventSheet');
    if (!sheet) return '';
    const inputs = sheet.querySelectorAll('.p-name, .p-dob, .p-gender');
    const values = [];
    inputs.forEach(input => {
      values.push(input.value.trim());
    });
    return JSON.stringify(values);
  }

  function hasUnsavedSheetChanges() {
    if (!isSheetOpen) return false;
    const current = serializeSheetForm();
    return current !== initialSheetStateSnapshot;
  }

  function attemptCloseSheet() {
    if (hasUnsavedSheetChanges()) {
      showUnsavedModal();
    } else {
      // Pop the history entry that was pushed when opening the sheet
      closeEditSheet(true);
    }
  }

  function closeEditSheet(popHistory = false) {
    isSheetOpen = false;
    currentEditingProgIdx = null;
    initialSheetStateSnapshot = null;
    hideOverlay('editEventOverlay');
    hideOverlay('unsavedChangesOverlay');

    if (popHistory && window.history.state && window.history.state.editSheetOpen) {
      history.back();
    }
  }

  /* ===== UNSAVED CHANGES MODAL (3 BUTTONS) ===== */
  function showUnsavedModal() {
    showOverlay('unsavedChangesOverlay');
  }

  function hideUnsavedModal() {
    hideOverlay('unsavedChangesOverlay');
  }

  /* ===== SAVE SHEET EVENT & RULE 9 VALIDATION ===== */
  function saveSheetEvent() {
    const progIdx = currentEditingProgIdx;
    if (progIdx === null || progIdx === undefined) return false;

    const prog = programs[progIdx];
    const sheet = document.getElementById('editEventSheet');
    const errBanner = document.getElementById('sheetErrorBanner');
    if (!sheet || !prog || !errBanner) return false;

    errBanner.classList.remove('visible');
    errBanner.textContent = '';
    sheet.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    sheet.querySelectorAll('.p-card-error').forEach(el => {
      el.classList.remove('visible');
      el.textContent = '';
    });

    const isIndiv = prog.type === 'individual';
    const regCards = Array.from(sheet.querySelectorAll('#sheetParticipantsContainer .participant-entry-card'));
    const subCards = Array.from(sheet.querySelectorAll('#sheetSubstitutesContainer .participant-entry-card'));

    const errors = [];

    // Check count for regular members
    if (prog.fixed && regCards.length !== prog.max) {
      errors.push(`${prog.name} requires exactly ${prog.max} participants. (Currently has ${regCards.length}).`);
    } else if (!prog.fixed && (regCards.length < prog.min || regCards.length > prog.max)) {
      errors.push(`${prog.name} requires between ${prog.min} and ${prog.max} participants.`);
    }

    const participantsDetail = [];
    const substitutesDetail = [];

    // Track duplicate names within this event
    const eventPersonSet = new Set();

    // 1. Validate regular participants
    regCards.forEach((card, cIdx) => {
      const nameInput = card.querySelector('.p-name');
      const dobInput = card.querySelector('.p-dob');
      const genderSelect = card.querySelector('.p-gender');
      const cardErr = card.querySelector('.p-card-error');

      const pName = nameInput ? nameInput.value.trim() : '';
      const pDobRaw = dobInput ? dobInput.value.trim() : '';
      const pDob = parseDdmmyyyyToIso(pDobRaw) || pDobRaw;
      let pGender = genderSelect ? genderSelect.value : '';

      if (prog.gender === 'female_only') pGender = 'Female';
      if (prog.gender === 'male_only') pGender = 'Male';

      let cardHasErr = false;

      if (!pName) {
        nameInput.classList.add('has-error');
        cardErr.textContent = 'Participant name is required.';
        cardErr.classList.add('visible');
        errors.push(`Participant ${cIdx + 1}: Name is required.`);
        cardHasErr = true;
      }

      if (!pDob) {
        dobInput.classList.add('has-error');
        cardErr.textContent = 'Date of birth is required.';
        cardErr.classList.add('visible');
        errors.push(`Participant ${cIdx + 1}: Date of birth is required.`);
        cardHasErr = true;
      } else {
        const age = calculateAgeOnEventDate(pDob);
        if (age === null || isNaN(age)) {
          dobInput.classList.add('has-error');
          cardErr.textContent = 'Invalid date of birth.';
          cardErr.classList.add('visible');
          errors.push(`Participant ${cIdx + 1}: Invalid date of birth.`);
          cardHasErr = true;
        } else if (age < MIN_AGE) {
          dobInput.classList.add('has-error');
          cardErr.textContent = `Age must be completed 15 years on 9 Jan 2027 (Age: ${age} yrs).`;
          cardErr.classList.add('visible');
          errors.push(`Participant ${pName || (cIdx + 1)}: Age is ${age} (Must be at least 15 on 9 Jan 2027).`);
          cardHasErr = true;
        } else if (age >= MAX_AGE) {
          dobInput.classList.add('has-error');
          cardErr.textContent = `Age must be under 40 on 9 Jan 2027 (Age: ${age} yrs).`;
          cardErr.classList.add('visible');
          errors.push(`Participant ${pName || (cIdx + 1)}: Age is ${age} (Must be under 40 on 9 Jan 2027).`);
          cardHasErr = true;
        }
      }

      // All gender-restricted events (Margamkali, Parichamuttukali, Lalithaganam Male/Female) are locked

      if (pName && pDob) {
        const personKey = getPersonNormalizedKey(pName, pDob);
        if (eventPersonSet.has(personKey)) {
          nameInput.classList.add('has-error');
          dobInput.classList.add('has-error');
          cardErr.textContent = `Duplicate: "${pName}" is already added in this program.`;
          cardErr.classList.add('visible');
          errors.push(`Duplicate: "${pName}" appears more than once in this program.`);
          cardHasErr = true;
        } else {
          eventPersonSet.add(personKey);
        }
      }

      if (!cardHasErr) {
        participantsDetail.push({
          name: pName,
          dob: pDob,
          gender: pGender || 'Not Specified',
          role: 'Participant'
        });
      }
    });

    // 2. Validate substitutes (Rule 7)
    subCards.forEach((card, sIdx) => {
      const nameInput = card.querySelector('.p-name');
      const dobInput = card.querySelector('.p-dob');
      const genderSelect = card.querySelector('.p-gender');
      const cardErr = card.querySelector('.p-card-error');

      const sName = nameInput ? nameInput.value.trim() : '';
      const sDobRaw = dobInput ? dobInput.value.trim() : '';
      const sDob = parseDdmmyyyyToIso(sDobRaw) || sDobRaw;
      let sGender = genderSelect ? genderSelect.value : '';

      if (prog.gender === 'female_only') sGender = 'Female';
      if (prog.gender === 'male_only') sGender = 'Male';

      // Substitutes are optional: only validate if any field entered
      if (sName || sDob || sGender) {
        let subHasErr = false;

        if (!sName) {
          nameInput.classList.add('has-error');
          cardErr.textContent = 'Substitute name is required.';
          cardErr.classList.add('visible');
          errors.push(`Substitute ${sIdx + 1}: Name is required.`);
          subHasErr = true;
        }

        if (!sDob) {
          dobInput.classList.add('has-error');
          cardErr.textContent = 'Substitute date of birth is required.';
          cardErr.classList.add('visible');
          errors.push(`Substitute ${sIdx + 1}: Date of birth is required.`);
          subHasErr = true;
        } else {
          const age = calculateAgeOnEventDate(sDob);
          if (age === null || isNaN(age)) {
            dobInput.classList.add('has-error');
            cardErr.textContent = 'Invalid date of birth.';
            cardErr.classList.add('visible');
            errors.push(`Substitute ${sIdx + 1}: Invalid date of birth.`);
            subHasErr = true;
          } else if (age < MIN_AGE) {
            dobInput.classList.add('has-error');
            cardErr.textContent = `Age must be completed 15 years on 9 Jan 2027 (Age: ${age} yrs).`;
            cardErr.classList.add('visible');
            errors.push(`Substitute ${sName || (sIdx + 1)}: Age is ${age} (Must be at least 15 on 9 Jan 2027).`);
            subHasErr = true;
          } else if (age >= MAX_AGE) {
            dobInput.classList.add('has-error');
            cardErr.textContent = `Age must be under 40 on 9 Jan 2027 (Age: ${age} yrs).`;
            cardErr.classList.add('visible');
            errors.push(`Substitute ${sName || (sIdx + 1)}: Age is ${age} (Must be under 40 on 9 Jan 2027).`);
            subHasErr = true;
          }
        }

        if (sName && sDob) {
          const personKey = getPersonNormalizedKey(sName, sDob);
          if (eventPersonSet.has(personKey)) {
            nameInput.classList.add('has-error');
            cardErr.textContent = `Duplicate: "${sName}" is already added as a member/substitute in this program.`;
            cardErr.classList.add('visible');
            errors.push(`Duplicate: "${sName}" is already added in this program.`);
            subHasErr = true;
          } else {
            eventPersonSet.add(personKey);
          }
        }

        if (!subHasErr) {
          substitutesDetail.push({
            name: sName,
            dob: sDob,
            gender: sGender || 'Not Specified',
            role: 'Substitute'
          });
        }
      }
    });

    // 3. RULE 9 VALIDATION (Cross-Event Limits: max 2 individual, max 2 group)
    // Normalized Name + DOB. Substitutes count toward limits!
    const personRegistry = new Map();

    // Populate registry with all OTHER saved events
    selectedEventsState.forEach((evData, evIdx) => {
      if (evIdx === progIdx) return; // Skip currently edited event
      const evType = evData.type;

      // Regular members
      (evData.participantsDetail || []).forEach(p => {
        const key = getPersonNormalizedKey(p.name, p.dob);
        if (!key) return;
        if (!personRegistry.has(key)) {
          personRegistry.set(key, { name: p.name, indiv: 0, group: 0, indivEvents: [], groupEvents: [] });
        }
        const record = personRegistry.get(key);
        if (evType === 'individual') {
          record.indiv++;
          record.indivEvents.push(evData.program);
        } else {
          record.group++;
          record.groupEvents.push(evData.program);
        }
      });

      // Substitutes (counted toward group limits)
      (evData.substitutes || []).forEach(s => {
        const key = getPersonNormalizedKey(s.name, s.dob);
        if (!key) return;
        if (!personRegistry.has(key)) {
          personRegistry.set(key, { name: s.name, indiv: 0, group: 0, indivEvents: [], groupEvents: [] });
        }
        const record = personRegistry.get(key);
        record.group++;
        record.groupEvents.push(evData.program + " (Sub)");
      });
    });

    // Check currently entered participants against limits
    participantsDetail.forEach(p => {
      const key = getPersonNormalizedKey(p.name, p.dob);
      if (!key) return;
      const existing = personRegistry.get(key) || { indiv: 0, group: 0, indivEvents: [], groupEvents: [] };

      if (isIndiv) {
        if (existing.indiv + 1 > 2) {
          errors.push(`നിബന്ധന 9 ലംഘനം: "${p.name}" ഇതിനകം 2 വ്യക്തിഗത ഇനങ്ങളിൽ രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട് (${existing.indivEvents.join(', ')}). പരമാവധി 2 എണ്ണത്തിൽ മാത്രമേ പങ്കെടുക്കാവൂ.`);
        }
      } else {
        if (existing.group + 1 > 2) {
          errors.push(`നിബന്ധന 9 ലംഘനം: "${p.name}" ഇതിനകം 2 ഗ്രൂപ്പ് ഇനങ്ങളിൽ രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട് (${existing.groupEvents.join(', ')}). പരമാവധി 2 എണ്ണത്തിൽ മാത്രമേ പങ്കെടുക്കാവൂ.`);
        }
      }
    });

    // Check currently entered substitutes against group limits
    substitutesDetail.forEach(s => {
      const key = getPersonNormalizedKey(s.name, s.dob);
      if (!key) return;
      const existing = personRegistry.get(key) || { indiv: 0, group: 0, indivEvents: [], groupEvents: [] };
      if (existing.group + 1 > 2) {
        errors.push(`നിബന്ധന 9 ലംഘനം: പകരക്കാരനായ "${s.name}" ഇതിനകം 2 ഗ്രൂപ്പ് ഇനങ്ങളിൽ ഉൾപ്പെട്ടിട്ടുണ്ട് (${existing.groupEvents.join(', ')}).`);
      }
    });

    // If validation failed, display error banner and stay in sheet
    if (errors.length > 0) {
      errBanner.innerHTML = `
        <strong>⚠️ Please fix the following before saving:</strong>
        <ul style="margin: 6px 0 0 16px; padding: 0;">
          ${errors.map(e => `<li>${escapeHTML(e)}</li>`).join('')}
        </ul>
      `;
      errBanner.classList.add('visible');
      errBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return false;
    }

    // Validation Succeeded: Save into State
    selectedEventsState.set(progIdx, {
      progIdx,
      program: prog.name,
      type: prog.type,
      participantsDetail,
      substitutes: substitutesDetail
    });

    // Close sheet, hide unsaved dialog, update UI
    hideOverlay('unsavedChangesOverlay');
    closeEditSheet(true);
    renderEventCards();
    return true;
  }

  /* ===== REMOVE & CLEAR ACTIONS ===== */
  function removeSavedEvent(progIdx) {
    const prog = programs[progIdx];
    const name = prog ? prog.name : 'this event';
    if (!confirm(`Remove "${name}" from registration? / ഈ ഇനം ഒഴിവാക്കണോ?`)) return;

    selectedEventsState.delete(progIdx);
    renderEventCards();
    closeEditSheet(true);
  }

  function clearAllSavedEvents() {
    if (selectedEventsState.size === 0) return;
    if (!confirm("Are you sure you want to clear all selected programs and participant entries?")) return;

    submissionSucceeded = false;
    selectedEventsState.clear();
    renderEventCards();
    closeEditSheet(true);
  }

  /* ===== EVENT EDIT SHEET EVENT LISTENERS ===== */
  function initEditSheetHandlers() {
    // Sheet close button
    const closeBtn = document.getElementById('sheetCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', attemptCloseSheet);
    }

    // Sheet cancel button
    const cancelBtn = document.getElementById('sheetCancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', attemptCloseSheet);
    }

    // Sheet save button
    const saveBtn = document.getElementById('sheetSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        saveSheetEvent();
      });
    }

    // Sheet remove button
    const removeBtn = document.getElementById('sheetRemoveBtn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        if (currentEditingProgIdx !== null) {
          removeSavedEvent(currentEditingProgIdx);
        }
      });
    }

    // Backdrop click on edit sheet overlay
    const overlay = document.getElementById('editEventOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          attemptCloseSheet();
        }
      });
    }

    // Unsaved Modal 3 buttons:
    const unsavedSaveBtn = document.getElementById('unsavedSaveBtn');
    if (unsavedSaveBtn) {
      unsavedSaveBtn.addEventListener('click', () => {
        const saved = saveSheetEvent();
        if (saved) {
          hideUnsavedModal();
        } else {
          hideUnsavedModal(); // Close dialog so user can see errors on sheet
        }
      });
    }

    const unsavedDiscardBtn = document.getElementById('unsavedDiscardBtn');
    if (unsavedDiscardBtn) {
      unsavedDiscardBtn.addEventListener('click', () => {
        hideUnsavedModal();
        closeEditSheet(true);
      });
    }

    const unsavedKeepBtn = document.getElementById('unsavedKeepBtn');
    if (unsavedKeepBtn) {
      unsavedKeepBtn.addEventListener('click', () => {
        hideUnsavedModal();
      });
    }

    // ESC key closes active modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const unsaved = document.getElementById('unsavedChangesOverlay');
        if (unsaved && unsaved.classList.contains('active')) {
          hideUnsavedModal();
          return;
        }

        const sheetOverlay = document.getElementById('editEventOverlay');
        if (sheetOverlay && sheetOverlay.classList.contains('active')) {
          attemptCloseSheet();
          return;
        }

        const previewModal = document.getElementById('previewOverlay');
        if (previewModal && previewModal.classList.contains('active')) {
          hideOverlay('previewOverlay');
          return;
        }
      }
    });
  }

  /* ==========================================================================
     STICKY SUMMARY BAR (ENGLISH-ONLY)
     ========================================================================== */
  function initStickySummaryBar() {
    const reviewBtn = document.getElementById('summaryReviewBtn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Trigger standard form submit check
        const form = document.getElementById('regForm');
        if (form) {
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            onSubmit(e);
          }
        }
      });
    }

    const clearBtn = document.getElementById('summaryClearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearAllSavedEvents);
    }
  }

  /* ==========================================================================
     ERROR UI HELPERS
     ========================================================================== */
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
    if (fieldId === 'centralRegistered') {
      const firstRadio = document.getElementById('centralRegYes');
      if (firstRadio) firstRadio.classList.add('has-error');
    }
    if (fieldId === 'designation') {
      const firstRadio = document.getElementById('desigVP');
      if (firstRadio) firstRadio.classList.add('has-error');
    }
    if (errDiv) {
      errDiv.textContent = errorMsg;
      errDiv.classList.add('visible');
    }
    return field || errDiv;
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
      errDiv.classList.remove('visible');
      errDiv.textContent = '';
    }
  }

  /* ==========================================================================
     MODALS OVERLAY HELPERS
     ========================================================================== */
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
      const activeOverlays = document.querySelectorAll('.reg-modal-overlay.active, .edit-event-sheet-overlay.active');
      if (activeOverlays.length === 0) {
        document.body.style.overflow = '';
      }
    }
  }

  /* ==========================================================================
     COMPACT SUBMISSION PREVIEW MODAL
     ========================================================================== */
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
      <div class="preview-section-card">
        <div class="preview-official-grid">
          <div class="preview-field-item">
            <span class="preview-field-label">Group</span>
            <span class="preview-field-val">🚩 ${escapeHTML(payload.group)}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">Parish</span>
            <span class="preview-field-val">⛪ ${escapeHTML(payload.parish)}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">Name of Vicar</span>
            <span class="preview-field-val">✝️ ${escapeHTML(payload.vicarName)}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">Vicar's Mobile</span>
            <span class="preview-field-val">📞 ${escapeHTML(payload.vicarPhone)}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">Central-Diocese Reg.</span>
            <span class="preview-field-val">${payload.centralRegistered === 'Yes' ? '✅ Yes' : '⏳ No (Will complete on competition day)'}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">Official Name</span>
            <span class="preview-field-val">👤 ${escapeHTML(payload.fullName)}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">Designation</span>
            <span class="preview-field-val">📋 ${escapeHTML(payload.position)}</span>
          </div>
          <div class="preview-field-item">
            <span class="preview-field-label">Contact Number</span>
            <span class="preview-field-val">📱 ${escapeHTML(payload.phone)}</span>
          </div>
        </div>
      </div>

      <div class="preview-programs-summary-pill">
        <span>🎯 ഇനങ്ങൾ: <strong>${payload.items.length}</strong></span>
        <span>👥 മത്സരാർത്ഥികൾ: <strong>${totalParticipants}</strong></span>
      </div>

      <div class="preview-programs-container">
        ${programsHtml}
      </div>
    `;

    showOverlay('previewOverlay');
  }

  function showSuccessModal(regId, parishName, programCount, groupName) {
    const idEl = document.getElementById('successRegId');
    if (idEl) idEl.textContent = regId;

    const summaryEl = document.getElementById('successSummaryPill');
    if (summaryEl) {
      summaryEl.innerHTML = `<strong>Group:</strong> ${escapeHTML(groupName || '')} &bull; <strong>Parish:</strong> ${escapeHTML(parishName)} &bull; <strong>Programs:</strong> ${programCount}`;
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

  /* ===== BACKEND SUBMISSION VIA GOOGLE APPS SCRIPT ===== */
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
        const res = await fetchWithTimeout(postUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }, 30000);
        const text = await res.text();
        if (!res.ok) throw new Error("HTTP " + res.status + ": " + (text.slice(0, 100) || "Server returned an error"));
        return parseReply(text);
      } catch (err) {
        if (err.serverReported || (err.message && err.message.includes("Invalid response"))) throw err;
        lastErr = err;
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
        submissionSucceeded = true;
        hideOverlay('waitOverlay');
        showSuccessModal(parsed.regId.trim(), payload.parish, payload.items.length, payload.group);

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

        // Reset new fields
        const groupSelect = document.getElementById('group');
        if (groupSelect) {
          groupSelect.value = '';
          groupSelect.classList.add('is-placeholder');
        }
        const vicarNameInput = document.getElementById('vicarName');
        if (vicarNameInput) vicarNameInput.value = '';
        const vicarPhoneInput = document.getElementById('vicarPhone');
        if (vicarPhoneInput) vicarPhoneInput.value = '';
        const centralNote = document.getElementById('centralRegNote');
        if (centralNote) centralNote.style.display = 'none';
        const otherWrap = document.getElementById('otherDesignationWrap');
        if (otherWrap) otherWrap.style.display = 'none';
        const otherInput = document.getElementById('otherDesignation');
        if (otherInput) otherInput.value = '';
        document.querySelectorAll('.radio-card-option').forEach(el => el.classList.remove('is-checked'));

        selectedEventsState.clear();
        renderEventCards();
        clearAllErrors();
      })
      .catch((err) => {
        hideOverlay('waitOverlay');
        const msg = err && err.message ? err.message : "A connection problem occurred. Please check your internet connection.";
        showFailureModal(msg);
      })
      .finally(() => {
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      });
  }

  /* ==========================================================================
     FORM SUBMISSION HANDLER
     ========================================================================== */
  function onSubmit(e) {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (window.SHOW_REGISTRATION === false) {
      return;
    }
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

    // 1. Group * (required dropdown)
    const groupSelect = document.getElementById('group');
    const group = groupSelect ? groupSelect.value.trim() : '';
    if (!group) {
      recordError(setFieldError('group', 'Please select your group.'), 'Group is required.');
    }

    // 2. Parish * (existing selector, unchanged)
    const parishInput = document.getElementById('parish');
    const parish = parishInput ? parishInput.value.trim() : '';
    if (!parish) {
      recordError(setFieldError('parish', 'Please select your parish.'), 'Parish Name is required.');
    }

    // 3. Name of Vicar * (text, required, min 2 chars)
    const vicarNameInput = document.getElementById('vicarName');
    const vicarName = vicarNameInput ? vicarNameInput.value.trim() : '';
    if (!vicarName || vicarName.length < 2) {
      recordError(setFieldError('vicarName', "Please enter the Vicar's name (at least 2 characters)."), "Vicar's Name is required.");
    }

    // 4. Vicar's Mobile Number * (required, exactly 10 digits starting with 6, 7, 8 or 9; spaces stripped)
    const vicarPhoneInput = document.getElementById('vicarPhone');
    const rawVicarPhone = vicarPhoneInput ? vicarPhoneInput.value.trim() : '';
    const cleanVicarPhone = rawVicarPhone.replace(/\s+/g, '');
    const phonePattern = /^[6-9][0-9]{9}$/;
    if (!phonePattern.test(cleanVicarPhone)) {
      recordError(setFieldError('vicarPhone', "Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9."), "Valid Vicar's Mobile Number is required.");
    }

    // 5. Central-Diocese unit registration? * (required radio buttons: Yes / No)
    const centralRegRadio = document.querySelector('input[name="centralRegistered"]:checked');
    const centralRegistered = centralRegRadio ? centralRegRadio.value : '';
    if (!centralRegistered) {
      recordError(setFieldError('centralRegistered', 'Please indicate whether Central-Diocese unit registration is completed.'), 'Central-Diocese registration status is required.');
    }

    // 6. Name of official filling the form * (existing fullName field, at least 2 chars)
    const fullNameInput = document.getElementById('fullName');
    const fullName = fullNameInput ? fullNameInput.value.trim() : '';
    if (!fullName || fullName.length < 2) {
      recordError(setFieldError('fullName', 'Please enter your full name (at least 2 characters).'), 'Official Full Name is required.');
    }

    // 7. Designation * (required radio buttons: Vice President, Secretary, Joint Secretary, Others)
    const desigRadio = document.querySelector('input[name="designationRadio"]:checked');
    const desigChoice = desigRadio ? desigRadio.value : '';
    let position = '';
    if (!desigChoice) {
      recordError(setFieldError('designation', 'Please select your designation.'), 'Designation is required.');
    } else if (desigChoice === 'Others') {
      const otherInput = document.getElementById('otherDesignation');
      const otherText = otherInput ? otherInput.value.trim() : '';
      if (!otherText || otherText.length < 2) {
        recordError(setFieldError('otherDesignation', 'Please specify your designation (at least 2 characters).'), 'Designation details are required.');
      } else {
        position = 'Others: ' + otherText;
      }
    } else {
      position = desigChoice;
    }

    // 8. Contact Number * (existing phone field, exactly 10 digits starting with 6, 7, 8 or 9; spaces stripped)
    const phoneInput = document.getElementById('phone');
    const rawPhone = phoneInput ? phoneInput.value.trim() : '';
    const cleanPhone = rawPhone.replace(/\s+/g, '');
    if (!phonePattern.test(cleanPhone)) {
      recordError(setFieldError('phone', 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'), 'Valid Contact Number is required.');
    }

    // 2. Program Selection Verification
    if (selectedEventsState.size === 0) {
      showContainerError('Please select and add participants for at least one program (കുറഞ്ഞത് ഒരു മത്സര ഇനമെങ്കിലും തിരഞ്ഞെടുക്കുക).');
      recordError(document.getElementById('programPickerCard'), 'Please select at least one program.');
    }

    // 3. Declaration Checkboxes
    const centralKalamelaCheck = document.getElementById('centralKalamelaCheck');
    const centralKalamelaError = document.getElementById('centralKalamelaCheckError');
    if (centralKalamelaCheck && !centralKalamelaCheck.checked) {
      if (centralKalamelaError) {
        centralKalamelaError.textContent = 'കേന്ദ്ര കലാമേളയിൽ പങ്കെടുക്കുമെന്ന ഉറപ്പ് നൽകേണ്ടതാണ് (Confirmation is required).';
        centralKalamelaError.classList.add('visible');
      }
      recordError(centralKalamelaCheck, 'മെത്രാസന തലത്തിൽ വിജയികളായാൽ കേന്ദ്ര കലാമേളയിൽ പങ്കെടുക്കാമെന്ന ഉറപ്പ് നൽകേണ്ടതാണ് (Central Kalamela participation confirmation is mandatory).');
    }

    const declarationCheck = document.getElementById('declarationCheck');
    const declarationError = document.getElementById('declarationCheckError');
    if (declarationCheck && !declarationCheck.checked) {
      if (declarationError) {
        declarationError.textContent = 'You must confirm this declaration to proceed with registration.';
        declarationError.classList.add('visible');
      }
      recordError(declarationCheck, 'Please accept the mandatory declaration confirming Central Assembly status and ID proof.');
    }

    // If any validation errors exist, display banner and abort
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

    // 4. Build backend-compatible items payload from selectedEventsState
    const items = Array.from(selectedEventsState.values()).map(ev => ({
      program: ev.program,
      participants: (ev.participantsDetail || []).map(p => p.name).join(" | "),
      participantsDetail: ev.participantsDetail || [],
      substitutes: ev.substitutes || []
    }));

    const submissionId = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now() + "-" + Math.random().toString(36).slice(2, 10);

    const payload = {
      submissionId,
      group,
      parish,
      vicarName,
      vicarPhone: cleanVicarPhone,
      centralRegistered,
      fullName,
      position,
      phone: cleanPhone,
      items
    };

    // Open Compact Submission Preview Modal
    showPreviewModal(payload);
  }

  /* ==========================================================================
     SUBMISSION MODALS EVENT BINDINGS
     ========================================================================== */
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
  }

  /* ==========================================================================
     SEARCHABLE PARISH DROPDOWN COMPONENT
     ========================================================================== */
  function initParishSelect() {
    const wrapper = document.getElementById('parishSelectWrapper');
    const triggerBtn = document.getElementById('parishTriggerBtn');
    const triggerText = document.getElementById('parishTriggerText');
    const hiddenInput = document.getElementById('parish');
    const panel = document.getElementById('parishDropdownPanel');
    const searchInput = document.getElementById('parishSearchInput');
    const optionsList = document.getElementById('parishOptionsList');
    const closeBtn = document.getElementById('parishSheetCloseBtn');

    if (!wrapper || !triggerBtn || !hiddenInput || !panel || !searchInput || !optionsList) return;

    let isOpen = false;
    let activeIndex = -1;
    let filteredParishes = [];

    const parishData = Array.isArray(window.PARISHES_LIST) ? window.PARISHES_LIST : [];

    function renderList(query) {
      optionsList.innerHTML = '';
      const cleanQuery = (query || '').trim().toLowerCase();

      filteredParishes = parishData.filter(p => {
        return p.name.toLowerCase().includes(cleanQuery) ||
               (p.malayalam && p.malayalam.includes(cleanQuery));
      });

      if (filteredParishes.length === 0) {
        const noRes = document.createElement('li');
        noRes.className = 'parish-no-results';
        noRes.textContent = 'No matching parishes found';
        optionsList.appendChild(noRes);
        return;
      }

      filteredParishes.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'parish-option-item';
        li.setAttribute('role', 'option');
        li.setAttribute('data-index', String(idx));

        if (hiddenInput.value === item.name) {
          li.classList.add('selected');
          li.setAttribute('aria-selected', 'true');
        } else {
          li.setAttribute('aria-selected', 'false');
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'parish-opt-name';
        nameSpan.textContent = item.name;

        const malSpan = document.createElement('span');
        malSpan.className = 'parish-opt-mal';
        malSpan.textContent = item.malayalam || '';

        li.appendChild(nameSpan);
        li.appendChild(malSpan);

        li.addEventListener('click', () => {
          selectParish(item);
        });

        optionsList.appendChild(li);
      });
    }

    function openPicker() {
      isOpen = true;
      panel.classList.add('open');
      triggerBtn.classList.add('is-active');
      triggerBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('parish-sheet-open');

      searchInput.value = '';
      renderList('');
      activeIndex = -1;

      setTimeout(() => {
        searchInput.focus();
      }, 100);
    }

    function closePicker() {
      if (!isOpen) return;
      isOpen = false;
      panel.classList.remove('open');
      triggerBtn.classList.remove('is-active');
      triggerBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('parish-sheet-open');
      triggerBtn.focus();
    }

    function selectParish(item) {
      hiddenInput.value = item.name;
      triggerText.textContent = item.name;
      triggerText.classList.remove('placeholder');

      triggerBtn.classList.remove('has-error');
      const err = document.getElementById('parishError');
      if (err) {
        err.classList.remove('visible');
        err.textContent = '';
      }

      closePicker();
    }

    triggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isOpen) closePicker();
      else openPicker();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closePicker);
    }

    searchInput.addEventListener('input', () => {
      renderList(searchInput.value);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (isOpen && !wrapper.contains(e.target)) {
        closePicker();
      }
    });

    // Initial render
    renderList('');
  }

})();
