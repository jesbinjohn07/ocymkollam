/* ==========================================================================
   OCYM Kollam – Jwala Kalamela Registration (Google Apps Script)
   --------------------------------------------------------------------------
   Sheets (tabs) used:
   - Registrations      : one row per form submission
   - Items              : one row per program per submission
   - All Participants   : TOTAL sheet, one row per participant/substitute
   - <Program name>     : auto-created tab for each event, one row per person
   - Checklist          : all 64 parishes, status, counts, duplicate flags,
                          Central-Diocese registration answer
   - Queue              : every submission lands here FIRST (fast); processQueue() then
                          copies it into the tabs above (runs every minute via trigger)

   RED FILL = possible duplicate (you decide which row to keep and delete the rest)

   The web app replies immediately with JSON:
     {"status":"success","regId":"JWL-..."}   or   {"status":"error","message":"..."}

   Safe re-runs: every tab skips Reg IDs it already holds, so a killed processQueue run
   can never create duplicate rows. Failed (ERROR) Queue rows never block a resubmission.

   Idle runs are nearly free: processQueue only works when doPost has set WORK_FLAG
   (plus a safety check every 10 minutes).

   doGet:  <web app url>?check=<submissionId>  tells the page whether a submission
           was saved (the page uses this after a network failure on the phone).

   COLUMN ORDER: Timestamp, Reg ID, Group, Parish come first on every tab.
        Registrations : Timestamp, Reg ID, Group, Parish, Vicar Name, Vicar Phone,
                        Central-Diocese Registration Done, Full Name, Position, Phone,
                        Programs, Submission ID
        Items         : Timestamp, Reg ID, Group, Parish, Program, Participants, Phone, Program Phone
        ("Phone" = the official who filled the form; "Program Phone" = the number given for that
         program entry: the participant's own number, or ONE number for the whole team.
         It is the LAST column on Items, All Participants and every event tab.)
        All Participants / event tabs: see TOTAL_HEADERS / EVENT_HEADERS below

   ADMIN MENU: reload the sheet, then use  Kalamela Admin > Delete the submission of the selected row
        (select any cell in a data row of Registrations / Items / All Participants / an event tab / Queue)
        to remove a whole submission from every tab. The Queue row is kept, marked REMOVED.

   RESULTS: the result & leaderboard code is at the end of this file (section RESULTS & LEADERBOARD).

   NEW IN THIS VERSION
        - Every program entry now carries a required Program Phone (10 digits starting 6-9).
          doPost rejects a missing or invalid one. If your tabs have the old columns, run
          reorderExistingTabs once (it adds the new header and keeps the data).
        - The Gender column is gone from All Participants and the event tabs, and from the code
          (the form no longer sends it).
        - preflightCheck(): run it before opening registration. It lists what is OK and what to fix.
        - The program list is one constant (PROGRAM_LIST), shared by createAllEventTabs and preflightCheck.
        - clearAllTestData now ships with CONFIRM_DELETE = false (it cannot delete anything by accident).

   IF YOUR TABS ARE NOT YET IN THE NEW COLUMN ORDER, run once, in this order:
        1. reorderExistingTabs      (moves the rows already in your sheet)
        2. applyAllDuplicateFlags   (red fill on the new columns)
        3. rebuildChecklist         (formulas point at the new columns)
   Then Deploy > Manage deployments > edit > New version.
   ========================================================================== */

// ---------- Settings ----------
const REGISTRATION_OPEN = true;   // set false to stop accepting registrations

const MAIN_SHEET      = "Registrations";
const ITEMS_SHEET     = "Items";
const TOTAL_SHEET     = "All Participants";
const CHECKLIST_SHEET = "Checklist";
const QUEUE_SHEET     = "Queue";

// doPost sets this flag when it queues a submission; processQueue clears it.
// When the flag is not set, processQueue exits in a fraction of a second (saves trigger time).
const WORK_FLAG = "QUEUE_HAS_WORK";

// Tabs created by Results.gs. The maintenance functions below skip them, so they can never
// be treated as event tabs (wiped, re-titled, re-headed) by mistake.
const RESULT_TABS = ["Dashboard", "Results", "Leaderboard"];

// Queue status given to a submission an administrator deleted from the menu.
// Like ERROR rows, REMOVED rows never block a parish from submitting again.
const REMOVED_STATUS = "REMOVED";
const ADMIN_MENU = "Kalamela Admin";
const QUEUE_MONITOR_FORMULA =
  '=COUNTA(Queue!$E$2:$E)-COUNTIF(Queue!$E$2:$E,"DONE")-COUNTIF(Queue!$E$2:$E,"REMOVED")';

const QUEUE_HEADERS = ["Timestamp", "Reg ID", "Submission ID", "Content Key", "Status", "Processed At", "Payload (do not edit)"];
const QUEUE_PAYLOAD_COL = 7;          // payload chunks start in column G
const PAYLOAD_CHUNK = 40000;          // Sheets cell limit is 50,000 characters
const MAX_BATCH = 15;                 // submissions written together per pass
const WORKER_BUDGET_MS = 4 * 60 * 1000; // stop well before the 6 minute limit

const DUP_COLOR = "#f4c7c3";   // red fill for duplicates
const FLAG_ROWS = 5000;        // rows covered by the red-flag rules

// Column order (A, B, C ...) of every tab. The red-flag formulas and the Checklist
// formulas below use these column letters, so change them together.
const MAIN_HEADERS = [
  "Timestamp", "Reg ID", "Group", "Parish", "Vicar Name", "Vicar Phone",
  "Central-Diocese Registration Done", "Full Name", "Position", "Phone", "Programs", "Submission ID"
];
const ITEMS_HEADERS = [
  "Timestamp", "Reg ID", "Group", "Parish", "Program", "Participants", "Phone", "Program Phone"
];
const TOTAL_HEADERS = [
  "Timestamp", "Reg ID", "Group", "Parish", "Program", "Role", "No.",
  "Participant Name", "Date of Birth",
  "Contact Person", "Position", "Phone", "Program Phone"
];
const EVENT_HEADERS = [
  "Timestamp", "Reg ID", "Group", "Parish", "Role", "No.",
  "Participant Name", "Date of Birth",
  "Contact Person", "Phone", "Program Phone"
];
const CHECKLIST_HEADERS = [
  "No.", "Parish", "Status", "Submissions", "Last Registered",
  "Programs", "Participants", "Substitutes", "Duplicate Entries",
  "Central-Diocese Registration"
];

// Red-flag formulas (row 2 is the reference row)
// Items: same parish (D) + same program (E) more than once
const ITEMS_FLAG =
  '=AND($D2<>"",COUNTIFS($D:$D,$D2,$E:$E,$E2)>1)';

// Event tab: same parish (D) from two different submissions (B), or same person (name G + DOB H) twice.
// Event tabs have a title row (event name) in row 1 and headers in row 2, so data starts in row 3.
// eventFlag_(r) builds the rule for first data row r.
function eventFlag_(r) {
  return '=AND($D' + r + '<>"",OR(' +
    'COUNTIFS($D:$D,$D' + r + ',$B:$B,"<>"&$B' + r + ')>0,' +
    'AND($H' + r + '<>"",COUNTIFS($G:$G,$G' + r + ',$H:$H,$H' + r + ')>1)))';
}

// All Participants: same parish+program from two submissions, same person twice in one program,
// or same person (name H + DOB I) under two different parishes
const TOTAL_FLAG =
  '=AND($D2<>"",OR(' +
    'COUNTIFS($D:$D,$D2,$E:$E,$E2,$B:$B,"<>"&$B2)>0,' +
    'AND($I2<>"",COUNTIFS($E:$E,$E2,$H:$H,$H2,$I:$I,$I2)>1),' +
    'AND($I2<>"",COUNTIFS($H:$H,$H2,$I:$I,$I2,$D:$D,"<>"&$D2)>0)))';

// Must match js/parishes.js exactly (the form sends these names)
const PARISH_LIST = [
  "അന്തമൺ സെഹിയോൻ",
  "അമ്പലനിരപ്പ് സെൻ്റ് .ജോർജ്ജ്",
  "ഇടവട്ടം സെൻ്റ് .ജോർജ്ജ്",
  "ഇടക്കുളങ്ങര സെൻ്റ്.ഗ്രീഗോറിയോസ്",
  "ഏറത്തുകുളക്കട സെൻ്റ് .ഗ്രിഗോറിയോസ്",
  "കടമാന്തടം സെൻ്റ് .ഗ്രീഗോറിയോസ്",
  "കരീപ്ര സെൻ്റ് .ജോർജ്ജ്",
  "കരിംന്തോട്ടുവ സെൻ്റ് .മേരീസ്",
  "കാരിക്കൽ സെൻ്റ് .ജോർജ്ജ്",
  "കല്ലട പ്ലാന്തുണ്ടിൽ സെൻ്റ് .തോമസ്",
  "കല്ലട വെസ്റ്റ് സെൻ്റ് മേരീസ് വലിയപള്ളി",
  "കിഴക്കേ കല്ലട സെൻ്റ് .ജോർജ്ജ്",
  "കുണ്ടറ സെൻ്റ്.തോമസ് വലിയപ്പള്ളി",
  "കുണ്ടറ കാദീശ്ത",
  "കുണ്ടറ സെൻ്റ്.തോമസ് സെഹിയോൻ",
  "കുണ്ടറ സെൻ്റ് .തോമസ് പുത്തൻപള്ളി",
  "കുണ്ടറ കുഴിമതിക്കാട് സെൻ്റ് .ജോർജ്ജ്",
  "കുന്നത്തൂർ സെൻ്റ് .ജോർജ്ജ്",
  "കുളക്കട സെൻ്റ് .ജോർജ്ജ്",
  "കൈതക്കോട് സെൻ്റ് .ജോർജ്ജ്",
  "കൈതക്കോട് ഇടവട്ടം സെൻ്റ് ജോർജ്ജ്",
  "കൊടുവിള മാർ ഏലിയ",
  "കൊല്ലം കാദീശ്ശാ",
  "കൊല്ലം സെൻ്റ് .തോമസ് കത്തീഡ്രൽ",
  "ചിറ്റുമല സെൻ്റ് .മേരീസ്",
  "ചൊവ്വള്ളൂർ സെൻ്റ് .ജോർജ്ജ്",
  "തഴവ സെൻ്റ് .തോമസ്",
  "തലവൂർ സെൻ്റ് .മേരീസ്",
  "താമരക്കുടി മർത്തമറിയം",
  "തേവലക്കര മർത്തമറിയം",
  "തേവലപ്പുറം സെൻ്റ് .ജോർജ്ജ്",
  "നല്ലില ബഥേൽ സെൻ്റ് .ജോർജ്ജ്",
  "നല്ലില സെൻ്റ് .ഗബ്രിയേൽ വലിയപള്ളി",
  "നടുത്തേരി സെൻ്റ് .ജോർജ്ജ്",
  "നെടുമ്പായിക്കുളം സെൻ്റ് .ജോർജ്ജ്",
  "നെടുമ്പായിക്കുളം സെൻ്റ് .മേരീസ്",
  "പട്ടാഴി സെൻ്റ് തോമസ്",
  "പട്ടാഴി തെക്കേത്തേരി സെൻ്റ് .ജോർജ്ജ്",
  "പട്ടാഴി പന്തപ്ലാവ് സെൻ്റ് .മേരീസ്",
  "പട്ടാഴി പന്ത്രണ്ടുമുറി സെൻ്റ് .ഗ്രീഗോറിയോസ്",
  "പട്ടാഴി കന്നിമേൽ സെൻ്റ് .മേരീസ്",
  "പാണ്ടിത്തിട്ട സെൻ്റ് .സ്റ്റീഫൻസ്",
  "പുത്തൂർ സെൻ്റ് .ജോർജ്ജ് വലിയപള്ളി",
  "പുത്തൂർ മൈലംക്കുളം സെൻ്റ് .ജോർജ്ജ്",
  "പെരിനാട് സെൻ്റ് .തോമസ്",
  "ചിറ്റയം സെൻ്റ് മേരീസ്",
  "പെരുമ്പുഴ സെൻ്റ് .ജോൺസ് ദി ബാപ്റ്റിസ്റ്റ്",
  "പേരയം സെൻ്റ് .കുറിയാക്കോസ്",
  "പോരുവഴി മാർ .ബസേലിയോസ് ഗ്രീഗോറിയോസ്",
  "മഞ്ഞക്കാല മാർ ശെമവൂൻ ദെസ്തുനി",
  "മണപ്പള്ളി ശാലേം സെൻ്റ് .മേരീസ്",
  "മരുതൂർഭാഗം സെൻ്റ് .ജോർജ്ജ്",
  "മാധവശ്ശേരി മാർ തേവോദോറോസ്",
  "മാറനാട് മാർ പത്രോസ് പൗലോസ്",
  "മാറനാട് മാർ ബർസൗമ",
  "മുഖത്തല സെൻ്റ് .ജോർജ്ജ്",
  "മുഖത്തല സെൻ്റ് .സ്റ്റീഫൻസ്",
  "മുതുപിലാക്കാട് സെൻ്റ് .മേരീസ്",
  "മുതുപിലാക്കാട് സെൻ്റ് .ജോർജ്ജ്",
  "മൈനാഗപ്പള്ളി സെൻ്റ് മേരീസ്",
  "ശൂരനാട് സെൻ്റ് .തോമസ്",
  "ശൂരനാട് സെൻ്റ് .മേരീസ് വലിയപള്ളി",
  "ശൂരനാട് ശാലേം സെൻ്റ് മേരീസ്",
  "പെരുങ്ങാലം സെൻ്റ് .ജോർജ്ജ് ചാപ്പൽ"
];

// Must match the program names on the website exactly (js/registration.js)
const PROGRAM_LIST = [
  "ലളിതഗാനം (Male)",
  "ലളിതഗാനം (Female)",
  "പ്രസംഗം",
  "കഥാപ്രസംഗം",
  "സ്ട്രിംഗ് ഇൻസ്ട്രുമെൻ്റ് (വയലിൻ – ഈസ്റ്റേൺ)",
  "സ്ട്രിംഗ് ഇൻസ്ട്രുമെൻ്റ് (ഗിറ്റാർ – വെസ്റ്റേൺ)",
  "കീബോർഡ്",
  "തബല",
  "ഉപന്യാസം",
  "ചിത്രരചന (പെൻസിൽ)",
  "കഥാരചന",
  "കവിതാരചന",
  "സമൂഹഗാനം",
  "സോപോകരണ സമൂഹഗാനം",
  "മാർഗംകളി",
  "പരിചമുട്ട് കളി",
  "തെരുവ് നാടകം",
  "ക്വിസ്",
  "മൈം"
];

/* ---------- Web app entry: FAST. It only queues the submission ---------- */
// The slow work (Registrations, Items, All Participants, event tabs, Checklist)
// is done by processQueue(), which runs every minute from a trigger.

function doPost(e) {
  if (!REGISTRATION_OPEN) {
    return jsonReply_({ status: "error", message: "Registration is closed." });
  }

  const lock = LockService.getScriptLock();

  try {
    // Longer than the page's 30 second timeout on purpose: if many parishes submit at the same
    // moment, the PAGE gives up first and its automatic check-and-retry takes over (safe, because
    // every retry carries the same submission ID). A shorter wait here would instead show the
    // parish a failure screen and make them press Retry by hand.
    lock.waitLock(40000);

    const data = JSON.parse(e.postData.contents);
    const items = Array.isArray(data.items) ? data.items : [];
    const submissionId = String(data.submissionId || "").trim();

    if (PARISH_LIST.indexOf(data.parish) === -1) {
      return jsonReply_({ status: "error", message: "Unknown parish name. Please reselect your parish." });
    }
    if (!items.length) {
      return jsonReply_({ status: "error", message: "No programs were submitted." });
    }

    const seen = {};
    for (let i = 0; i < items.length; i++) {
      const tab = sheetNameFor_(items[i].program);
      if (seen[tab]) {
        return jsonReply_({ status: "error", message: "Program '" + items[i].program + "' appears twice in this submission." });
      }
      seen[tab] = true;
      if (!/^[6-9][0-9]{9}$/.test(cleanPhone_(items[i].phone))) {
        return jsonReply_({ status: "error", message: "A valid 10-digit contact number is required for '" + items[i].program + "'." });
      }
    }

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const queue = getQueueSheet_(ss);
    const last  = queue.getLastRow();
    const key   = contentKey_(data);

    // Same submission ID (retry) or identical content (resubmitted): return the ORIGINAL Reg ID
    if (last >= 2) {
      const prev = queue.getRange(2, 2, last - 1, 4).getValues();   // B Reg ID, C Submission ID, D Content key, E Status
      for (let i = prev.length - 1; i >= 0; i--) {
        if (isIgnoredStatus_(prev[i][3])) continue;                    // a failed or removed row never blocks a resubmission
        const sameSub     = submissionId && String(prev[i][1]).trim() === submissionId;
        const sameContent = String(prev[i][2]).trim() === key;
        if (sameSub || sameContent) {
          return jsonReply_({ status: "success", regId: String(prev[i][0]) });
        }
      }
    }

    const time  = new Date();
    const regId = makeRegId_(time, last + 1);

    // Payload goes in one row (split in chunks, each starting with "~", to stay under the cell size limit)
    const json  = JSON.stringify(data);
    const parts = [];
    for (let i = 0; i < json.length; i += PAYLOAD_CHUNK) parts.push("~" + json.substr(i, PAYLOAD_CHUNK));

    const row = [time, regId, submissionId, key, "PENDING", ""].concat(parts);
    queue.getRange(last + 1, 1, 1, row.length).setValues([row]);
    PropertiesService.getScriptProperties().setProperty(WORK_FLAG, "1");

    return jsonReply_({ status: "success", regId: regId });

  } catch (err) {
    return jsonReply_({ status: "error", message: String(err) });

  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// The page calls  <web app url>?check=<submissionId>  after a network failure
// to find out whether the submission was actually saved.
function doGet(e) {
  const id = String((e && e.parameter && e.parameter.check) || "").trim();
  if (!id) return jsonReply_({ status: "ok", message: "OCYM Kollam registration service" });

  const queue = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUEUE_SHEET);
  const last = queue ? queue.getLastRow() : 0;
  if (last >= 2) {
    const prev = queue.getRange(2, 2, last - 1, 4).getValues();   // B Reg ID, C Submission ID, D Content key, E Status
    for (let i = prev.length - 1; i >= 0; i--) {
      if (isIgnoredStatus_(prev[i][3])) continue;
      if (String(prev[i][1]).trim() === id) {
        return jsonReply_({ status: "success", regId: String(prev[i][0]) });
      }
    }
  }
  return jsonReply_({ status: "notfound" });
}

function jsonReply_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Queue ---------- */

function getQueueSheet_(ss) {
  let sheet = ss.getSheetByName(QUEUE_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(QUEUE_SHEET);
    sheet.getRange(1, 1, 1, QUEUE_HEADERS.length)
      .setValues([QUEUE_HEADERS])
      .setFontWeight("bold")
      .setBackground("#1e3a5f")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.getRange(1, 3, sheet.getMaxRows(), 2).setNumberFormat("@");   // IDs / keys stay text
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 170);
    sheet.setColumnWidth(5, 200);
  }
  return sheet;
}

// Install ONCE (Run ▶): makes processQueue run every minute
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "processQueue") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("processQueue").timeBased().everyMinutes(1).create();
}

// Moves PENDING submissions from Queue into all the other tabs.
// Runs every minute, but does nothing (and costs almost no trigger time) unless
// doPost has flagged new work. Every 10th minute it also does a full check, as a safety net.
function processQueue() {
  const props = PropertiesService.getScriptProperties();
  const safetyScan = new Date().getMinutes() % 10 === 0;
  if (!props.getProperty(WORK_FLAG) && !safetyScan) return;

  const lock = LockService.getDocumentLock();   // separate from doPost's lock, so the web app never waits for this
  if (!lock.tryLock(10000)) return;             // flag stays set, next run tries again

  let finished = false;
  try {
    // Clear the flag BEFORE reading the queue: a submission that arrives from now on sets it again
    props.deleteProperty(WORK_FLAG);

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const queue = ss.getSheetByName(QUEUE_SHEET);
    if (!queue) { finished = true; return; }

    const started = Date.now();
    let ready = false;

    while (Date.now() - started < WORKER_BUDGET_MS) {
      const batch = nextBatch_(queue);
      if (!batch.length) { finished = true; break; }
      if (!ready) { ensureSetup_(ss); ready = true; }
      processBatch_(ss, queue, batch);
    }
  } finally {
    // Ran out of time or hit an error: make sure the next run continues
    if (!finished) props.setProperty(WORK_FLAG, "1");
    try { lock.releaseLock(); } catch (x) {}
  }
}

function nextBatch_(queue) {
  const last = queue.getLastRow();
  if (last < 2) return [];

  const status = queue.getRange(2, 5, last - 1, 1).getValues();
  const width  = queue.getLastColumn();
  const batch  = [];

  for (let i = 0; i < status.length && batch.length < MAX_BATCH; i++) {
    if (String(status[i][0]).trim() !== "PENDING") continue;
    const row = i + 2;
    const v = queue.getRange(row, 1, 1, width).getValues()[0];
    try {
      const json = v.slice(QUEUE_PAYLOAD_COL - 1)
        .map(x => String(x)).filter(x => x !== "")
        .map(x => x.substring(1)).join("");           // drop the "~" marker
      batch.push({
        row: row,
        time: v[0],
        regId: String(v[1]),
        submissionId: String(v[2]),
        data: JSON.parse(json)
      });
    } catch (err) {
      queue.getRange(row, 5, 1, 2).setValues([["ERROR: unreadable payload (" + err + ")", new Date()]]);
    }
  }
  return batch;
}

function processBatch_(ss, queue, batch) {
  try {
    const mainRows = [], itemRows = [], totalRows = [], eventRows = {};

    batch.forEach(sub => {
      const data  = sub.data;
      const items = Array.isArray(data.items) ? data.items : [];
      const group = data.group || "";

      const itemsText = items.map(i => {
        const subs = (i.substitutes || []).map(s => s.name).filter(Boolean);
        return i.program + " : " + i.participants +
               (subs.length ? "  (Substitutes: " + subs.join(" | ") + ")" : "");
      }).join("\n");

      // Registrations: follows MAIN_HEADERS
      mainRows.push([sub.time, sub.regId, group, data.parish,
                     data.vicarName || "", data.vicarPhone || "", data.centralRegistered || "",
                     data.fullName, data.position, data.phone, itemsText, sub.submissionId]);

      items.forEach(item => {
        // Items: follows ITEMS_HEADERS
        const progPhone = cleanPhone_(item.phone);
        itemRows.push([sub.time, sub.regId, group, data.parish, item.program, item.participants, data.phone, progPhone]);

        const people = getPeople_(item);
        if (!people.length) return;

        const tab = sheetNameFor_(item.program);
        const rows = eventRows[tab] = eventRows[tab] || [];
        let participantNo = 0, substituteNo = 0;

        people.forEach(p => {
          const isSub = p.role === "Substitute";
          const no = isSub ? ++substituteNo : ++participantNo;
          // Event tab: follows EVENT_HEADERS
          rows.push([sub.time, sub.regId, group, data.parish, p.role, no,
                     p.name, p.dob, data.fullName, data.phone, progPhone]);
          // All Participants: follows TOTAL_HEADERS
          totalRows.push([sub.time, sub.regId, group, data.parish, item.program, p.role, no,
                          p.name, p.dob, data.fullName, data.position, data.phone, progPhone]);
        });
      });
    });

    // One write per tab for the whole batch. Phone / DOB / IDs stored as plain text.
    // The last argument is the 0-based position of the Reg ID in each row: rows whose Reg ID is
    // already in that tab are skipped, so re-running a batch (after a killed run) never duplicates.
    writeRows_(ss.getSheetByName(MAIN_SHEET),  mainRows,  [2, 6, 10, 12], 1);
    writeRows_(ss.getSheetByName(ITEMS_SHEET), itemRows,  [2, 7, 8],      1);
    writeRows_(ss.getSheetByName(TOTAL_SHEET), totalRows, [2, 9, 12, 13], 1);
    Object.keys(eventRows).forEach(tab => {
      const sh = getOrCreateEventSheet_(ss, tab);
      writeRows_(sh, eventRows[tab], [2, 8, 10, 11], 1);
    });

    SpreadsheetApp.flush();   // make sure every write above is really saved before saying DONE

    const done = new Date();
    batch.forEach(sub => queue.getRange(sub.row, 5, 1, 2).setValues([["DONE", done]]));

  } catch (err) {
    const when = new Date();
    batch.forEach(sub => queue.getRange(sub.row, 5, 1, 2).setValues([["ERROR: " + err, when]]));
  }
}

function ensureSetup_(ss) {
  const mainSheet  = getOrCreateSheet_(ss, MAIN_SHEET, MAIN_HEADERS);
  const itemSheet  = getOrCreateSheet_(ss, ITEMS_SHEET, ITEMS_HEADERS, ITEMS_FLAG);
  const totalSheet = getOrCreateSheet_(ss, TOTAL_SHEET, TOTAL_HEADERS, TOTAL_FLAG);
  ensureHeaderRow_(mainSheet, MAIN_HEADERS);
  ensureHeaderRow_(itemSheet, ITEMS_HEADERS);
  ensureHeaderRow_(totalSheet, TOTAL_HEADERS);
  ensureChecklist_(ss);
}

// Run manually (Run ▶) when the Checklist "Queue rows not DONE" cell is above 0.
// Puts failed (ERROR) Queue rows back to PENDING so processQueue tries them again.
// Safe: tabs skip Reg IDs they already hold, so nothing is written twice.
function retryFailedQueueRows() {
  const q = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUEUE_SHEET);
  if (!q) throw new Error("Queue tab not found.");
  const last = q.getLastRow();
  if (last < 2) return;

  const range = q.getRange(2, 5, last - 1, 1);
  const vals = range.getValues();
  let n = 0;
  vals.forEach((r, i) => {
    if (String(r[0]).indexOf("ERROR") === 0) { vals[i][0] = "PENDING"; n++; }
  });
  range.setValues(vals);
  if (n) PropertiesService.getScriptProperties().setProperty(WORK_FLAG, "1");
  Logger.log("Re-queued " + n + " row(s).");
}

/* ---------- Check before opening registration ---------- */

// Run manually (Run ▶), then open View > Logs (or Execution log).
// Lists what is OK and what still needs fixing before parishes start registering.
function preflightCheck() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const out = [];
  const check = (good, okMsg, fixMsg) => out.push((good ? "OK    " : "FIX   ") + (good ? okMsg : fixMsg));
  const sameHeaders = (sheet, row, headers) => {
    if (!sheet) return false;
    const have = sheet.getRange(row, 1, 1, headers.length).getValues()[0].map(String);
    return headers.every((h, i) => have[i] === h);
  };

  check(REGISTRATION_OPEN, "Registration is OPEN",
        "REGISTRATION_OPEN is false, so the form refuses every submission");

  const tz = Session.getScriptTimeZone();
  check(tz === "Asia/Kolkata", "Time zone is " + tz,
        "Time zone is " + tz + " (change it in Project Settings so Reg IDs and times are in IST)");

  const trig = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "processQueue").length;
  check(trig === 1, "processQueue trigger is installed",
        trig + " processQueue trigger(s) found, expected 1 (run installTrigger)");

  check(sameHeaders(ss.getSheetByName(MAIN_SHEET), 1, MAIN_HEADERS),
        "Registrations headers are correct",
        "Registrations is missing or in the old column order (run reorderExistingTabs)");
  check(sameHeaders(ss.getSheetByName(ITEMS_SHEET), 1, ITEMS_HEADERS),
        "Items headers are correct",
        "Items is missing or in the old column order (run reorderExistingTabs)");
  check(sameHeaders(ss.getSheetByName(TOTAL_SHEET), 1, TOTAL_HEADERS),
        "All Participants headers are correct",
        "All Participants is missing or in the old column order (run reorderExistingTabs)");
  check(sameHeaders(ss.getSheetByName(CHECKLIST_SHEET), 1, CHECKLIST_HEADERS),
        "Checklist headers are correct",
        "Checklist is missing or out of date (run rebuildChecklist)");

  const missing = [], oldHeaders = [];
  PROGRAM_LIST.forEach(p => {
    const sh = ss.getSheetByName(sheetNameFor_(p));
    if (!sh) missing.push(p);
    else if (!sameHeaders(sh, 2, EVENT_HEADERS)) oldHeaders.push(p);
  });
  check(!missing.length, "All " + PROGRAM_LIST.length + " event tabs exist",
        missing.length + " event tab(s) missing: " + missing.join(", ") + " (run createAllEventTabs)");
  check(!oldHeaders.length, "Event tab headers are correct",
        oldHeaders.length + " event tab(s) with old headers: " + oldHeaders.join(", ") + " (run reorderExistingTabs)");

  let queueRows = 0, notDone = 0;
  const queue = ss.getSheetByName(QUEUE_SHEET);
  if (queue && queue.getLastRow() >= 2) {
    queue.getRange(2, 5, queue.getLastRow() - 1, 1).getValues().forEach(r => {
      const s = String(r[0]).trim();
      if (!s) return;
      queueRows++;
      if (s !== "DONE" && s !== REMOVED_STATUS) notDone++;
    });
  }
  check(notDone === 0, "No Queue rows are waiting or failed",
        notDone + " Queue row(s) are PENDING or ERROR (wait a minute, or run retryFailedQueueRows)");

  const main = ss.getSheetByName(MAIN_SHEET);
  const regRows = main ? Math.max(0, main.getLastRow() - 1) : 0;
  out.push("INFO  " + regRows + " registration(s) and " + queueRows + " Queue row(s) are in the sheet now" +
           (regRows || queueRows ? "  (if these are tests, run clearAllTestData before opening)" : ""));

  Logger.log("\n" + out.join("\n"));
}

/* ---------- Admin: delete a whole submission from every tab ---------- */

// "REMOVED" and "ERROR..." Queue rows are ignored when looking for an earlier copy of a submission.
function isIgnoredStatus_(status) {
  const s = String(status == null ? "" : status).trim();
  return s.indexOf("ERROR") === 0 || s === REMOVED_STATUS;
}

// Adds the "Kalamela Admin" menu each time the sheet is opened (simple trigger, no set-up needed).
// Reload the spreadsheet after pasting this version, or run onOpen once from the editor.
function onOpen() {
  SpreadsheetApp.getUi().createMenu(ADMIN_MENU)
    .addItem("Delete the submission of the selected row...", "deleteSelectedSubmission")
    .addItem("Delete a submission by Reg ID...", "deleteSubmissionByRegId")
    .addItem("Update Queue monitor cell (one time)", "updateQueueMonitorFormula")
    .addSeparator()
    .addItem("Results: set up / refresh (one time)", "setupResults")
    .addItem("Results: clear all entered winners", "clearResultEntries")
    .addToUi();
}

// Select any cell in a data row of Registrations, Items, All Participants, an event tab or Queue
// (column B of every one of those tabs holds the Reg ID), then choose the menu item.
function deleteSelectedSubmission() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() === CHECKLIST_SHEET) {
    ui.alert("Select a row in Registrations, Items, All Participants, an event tab or Queue (not Checklist), then try again.");
    return;
  }
  const row = sheet.getActiveCell().getRow();
  if (row <= headerRowsOf_(sheet)) {
    ui.alert("Select a data row (not a title or header row), then try again.");
    return;
  }
  deleteSubmission_(String(sheet.getRange(row, 2).getValue()).trim());
}

function deleteSubmissionByRegId() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt("Delete a submission", "Type the Reg ID, e.g. JWL-20261113-233953-002", ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  deleteSubmission_(String(res.getResponseText()).trim().toUpperCase());
}

// Consecutive row numbers -> [[startRow, count], ...] with the LAST run first,
// so rows can be deleted from the bottom up without the numbers shifting.
function runsFromRows_(rows) {
  const runs = [];
  rows.slice().sort((a, b) => a - b).forEach(r => {
    const last = runs[runs.length - 1];
    if (last && r === last[0] + last[1]) last[1]++;
    else runs.push([r, 1]);
  });
  return runs.reverse();
}

function deleteSubmission_(regId) {
  const ui = SpreadsheetApp.getUi();

  if (!/^JWL-\d{8}-\d{6}-\d+$/.test(regId)) {
    ui.alert("This is not a Reg ID:\n\n" + regId +
             "\n\nColumn B of the selected row must hold a Reg ID like JWL-20261113-233953-002.");
    return;
  }

  // Same lock processQueue uses, so a delete never collides with rows being written
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) {
    ui.alert("The system is busy writing registrations. Wait a minute and try again.");
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Find the submission in the Queue
    const queue = ss.getSheetByName(QUEUE_SHEET);
    let qRow = 0, qStatus = "";
    if (queue && queue.getLastRow() >= 2) {
      const v = queue.getRange(2, 2, queue.getLastRow() - 1, 4).getValues();   // B Reg ID .. E Status
      for (let i = 0; i < v.length; i++) {
        if (String(v[i][0]).trim() === regId) { qRow = i + 2; qStatus = String(v[i][3]).trim(); break; }
      }
    }

    // 2. Find every row of this submission in every data tab (Reg ID is column B)
    const plan = [];
    let total = 0, parish = "";
    ss.getSheets().forEach(sh => {
      const name = sh.getName();
      if (name === CHECKLIST_SHEET || name === QUEUE_SHEET || RESULT_TABS.indexOf(name) !== -1) return;
      const first = headerRowsOf_(sh) + 1;
      const lastRow = sh.getLastRow();
      if (lastRow < first) return;
      const ids = sh.getRange(first, 2, lastRow - first + 1, 1).getValues();
      const hits = [];
      ids.forEach((r, i) => { if (String(r[0]).trim() === regId) hits.push(first + i); });
      if (hits.length) {
        plan.push({ sheet: sh, name: name, runs: runsFromRows_(hits), count: hits.length });
        total += hits.length;
        if (name === MAIN_SHEET) parish = String(sh.getRange(hits[0], 4).getValue());
      }
    });

    if (!qRow && !total) { ui.alert("Reg ID " + regId + " was not found in any tab."); return; }
    if (qStatus === REMOVED_STATUS && !total) { ui.alert(regId + " has already been removed."); return; }

    // 3. Ask for confirmation, showing exactly what will happen
    let msg = "Delete submission " + regId + (parish ? "\nParish: " + parish : "") + "\n\n";
    if (total) {
      msg += "These rows will be deleted:\n" + plan.map(p => "  - " + p.name + ": " + p.count + " row(s)").join("\n") + "\n\n";
    } else {
      msg += "It has not been copied into the other tabs yet.\n\n";
    }
    msg += "The Queue row is kept and marked " + REMOVED_STATUS + ", and the parish can submit again.\n" +
           "(Undo is only possible through File > Version history.)\n\nDelete it?";
    if (ui.alert("Confirm delete", msg, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

    // 4. Delete (bottom-up inside each tab), then mark the Queue row
    plan.forEach(p => p.runs.forEach(run => p.sheet.deleteRows(run[0], run[1])));
    if (qRow) queue.getRange(qRow, 5, 1, 2).setValues([[REMOVED_STATUS, new Date()]]);
    SpreadsheetApp.flush();

    ui.alert("Done. " + total + " row(s) deleted from " + plan.length + " tab(s).\n" +
             "The Checklist has updated by itself.");
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Run ONCE (menu: Kalamela Admin > Update Queue monitor cell) so the existing Checklist's
// "Queue rows not DONE" cell does not count REMOVED rows. New Checklists already have it.
function updateQueueMonitorFormula() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CHECKLIST_SHEET);
  if (!sheet) throw new Error("Checklist tab not found.");
  sheet.getRange("L8").setFormula(QUEUE_MONITOR_FORMULA);
}

/* ---------- Duplicate detection (same content = same registration) ---------- */


// Keeps digits only; drops leading 91 (when 12 digits) or 0 (when 11 digits).
function cleanPhone_(value) {
  let d = String(value == null ? "" : value).replace(/\D/g, "");
  if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
  else if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
  return d;
}

function norm_(s) {
  return String(s == null ? "" : s)
    .normalize("NFC").replace(/[\u200B-\u200D]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

// Fingerprint of a registration. Includes the contact details, group, vicar details and each
// person's name and date of birth, so a correction (e.g. a fixed phone number) counts as a NEW submission.
function contentKey_(data) {
  const parts = (data.items || []).map(it => {
    const people = getPeople_(it)
      .map(p => p.role + ":" + norm_(p.name) + ":" + p.dob).sort().join(";");
    return norm_(it.program) + "=" + people + "@" + cleanPhone_(it.phone);
  }).sort().join("||");
  const contact = [
    norm_(data.fullName),
    norm_(data.position),
    String(data.phone == null ? "" : data.phone).replace(/\D/g, ""),
    norm_(data.group),
    norm_(data.vicarName),
    String(data.vicarPhone == null ? "" : data.vicarPhone).replace(/\D/g, ""),
    norm_(data.centralRegistered)
  ].join("~");
  const raw = norm_(data.parish) + "#" + contact + "#" + parts;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw, Utilities.Charset.UTF_8);
  return digest.map(b => ("0" + (b & 0xff).toString(16)).slice(-2)).join("");
}

/* ---------- Run MANUALLY, only before real registration opens ---------- */

// Deletes every data row (keeps headers and the Checklist tab), including the Queue
function clearAllTestData() {
  const CONFIRM_DELETE = false;   // safety switch: set to true, Run, then set back to false

  if (!CONFIRM_DELETE) {
    throw new Error("Set CONFIRM_DELETE to true to delete all data rows.");
  }

  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(sh => {
    if (sh.getName() === CHECKLIST_SHEET || RESULT_TABS.indexOf(sh.getName()) !== -1) return;
    const keep = headerRowsOf_(sh);   // 1 for normal tabs, 2 for event tabs (title row + header row)
    const last = sh.getLastRow();
    if (last > keep) sh.deleteRows(keep + 1, last - keep);
  });
  PropertiesService.getScriptProperties().deleteProperty(WORK_FLAG);
}

// Run manually (Run ▶) ONCE after changing the column order:
// moves the data already in your tabs into the NEW column order (matching columns by header name),
// then rewrites the header rows. Safe to run again: tabs already in the new order are skipped.
// Run it BEFORE any new submission is processed.
function reorderExistingTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const TEXT_HEADERS = ["Reg ID", "Submission ID", "Phone", "Vicar Phone", "Program Phone", "Date of Birth"];
  let done = 0;

  ss.getSheets().forEach(sheet => {
    const name = sheet.getName();
    if (name === CHECKLIST_SHEET || name === QUEUE_SHEET || RESULT_TABS.indexOf(name) !== -1) return;

    const newH = name === MAIN_SHEET  ? MAIN_HEADERS
               : name === ITEMS_SHEET ? ITEMS_HEADERS
               : name === TOTAL_SHEET ? TOTAL_HEADERS
               : EVENT_HEADERS;
    const hr = headerRowsOf_(sheet);
    const oldCols = sheet.getLastColumn();
    if (oldCols < 1) return;

    const oldH = sheet.getRange(hr, 1, 1, oldCols).getValues()[0].map(String);
    if (newH.every((h, i) => oldH[i] === h)) return;   // already in the new order

    const lastRow = sheet.getLastRow();
    if (lastRow > hr) {
      const data = sheet.getRange(hr + 1, 1, lastRow - hr, oldCols).getValues();
      const map  = newH.map(h => oldH.indexOf(h));
      const out  = data.map(r => map.map(i => i < 0 ? "" : r[i]));

      sheet.getRange(hr + 1, 1, lastRow - hr, oldCols).clearContent();
      newH.forEach((h, i) => {
        if (TEXT_HEADERS.indexOf(h) !== -1) {
          sheet.getRange(hr + 1, i + 1, out.length, 1).setNumberFormat("@");
        }
      });
      sheet.getRange(hr + 1, 1, out.length, newH.length).setValues(out);
    }
    done++;
  });

  updateHeaders();   // writes the new header rows on every tab
  Logger.log("Reordered " + done + " tab(s). Now run applyAllDuplicateFlags and rebuildChecklist.");
}

// Run manually (Run ▶): rewrites the header row of every EXISTING tab
// (Registrations, Items, All Participants and all event tabs). Safe to run again.
// NOTE: this only changes the header text. To move the data too, use reorderExistingTabs.
function updateHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let eventTabs = 0;

  const main = ss.getSheetByName(MAIN_SHEET);
  if (main) styleHeader_(main, MAIN_HEADERS);
  const items = ss.getSheetByName(ITEMS_SHEET);
  if (items) styleHeader_(items, ITEMS_HEADERS);
  const total = ss.getSheetByName(TOTAL_SHEET);
  if (total) styleHeader_(total, TOTAL_HEADERS);

  ss.getSheets().forEach(sheet => {
    if (headerRowsOf_(sheet) === 2) {       // event tabs (title row + header row)
      formatTitleRow_(sheet);
      sheet.getRange(2, 1, 1, EVENT_HEADERS.length)
        .setValues([EVENT_HEADERS])
        .setFontWeight("bold").setFontSize(10)
        .setBackground("#1e3a5f").setFontColor("#ffffff");
      eventTabs++;
    }
  });
  Logger.log("Headers updated. Event tabs updated: " + eventTabs);
}

// Applies the red-flag rule to a tab (replaces that tab's existing rules).
// startRow = first data row (2 for normal tabs, 3 for event tabs).
function applyDuplicateFlags_(sheet, formula, numCols, startRow) {
  const first = startRow || 2;
  const needRows = FLAG_ROWS + first - 1;
  if (sheet.getMaxRows() < needRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), needRows - sheet.getMaxRows());
  }
  const range = sheet.getRange(first, 1, sheet.getMaxRows() - first + 1, numCols);
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formula)
    .setBackground(DUP_COLOR)
    .setRanges([range])
    .build();
  sheet.setConditionalFormatRules([rule]);
}

// Run manually (Run ▶) once: adds the red-flag rules to tabs that already exist
function applyAllDuplicateFlags() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reserved = [MAIN_SHEET, ITEMS_SHEET, TOTAL_SHEET, CHECKLIST_SHEET, QUEUE_SHEET].concat(RESULT_TABS);

  ss.getSheets().forEach(sheet => {
    const name = sheet.getName();
    if (name === ITEMS_SHEET) {
      applyDuplicateFlags_(sheet, ITEMS_FLAG, ITEMS_HEADERS.length);
    } else if (name === TOTAL_SHEET) {
      applyDuplicateFlags_(sheet, TOTAL_FLAG, TOTAL_HEADERS.length);
    } else if (reserved.indexOf(name) === -1) {
      const first = headerRowsOf_(sheet) + 1;   // 3 with a title row, 2 on old-layout tabs
      applyDuplicateFlags_(sheet, eventFlag_(first), EVENT_HEADERS.length, first);
    }
  });
}

/* ---------- Checklist ---------- */

// Creates the Checklist tab once. Run rebuildChecklist() manually to recreate it.
function ensureChecklist_(ss) {
  if (ss.getSheetByName(CHECKLIST_SHEET)) return;

  // Formulas below read these tabs, so make sure they exist first
  getOrCreateSheet_(ss, MAIN_SHEET, MAIN_HEADERS);
  getOrCreateSheet_(ss, ITEMS_SHEET, ITEMS_HEADERS, ITEMS_FLAG);
  getOrCreateSheet_(ss, TOTAL_SHEET, TOTAL_HEADERS, TOTAL_FLAG);

  const sheet = ss.insertSheet(CHECKLIST_SHEET);
  const n = PARISH_LIST.length;
  const last = n + 1;

  sheet.getRange(1, 1, 1, CHECKLIST_HEADERS.length)
    .setValues([CHECKLIST_HEADERS])
    .setFontWeight("bold")
    .setBackground("#1e3a5f")
    .setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  const names = PARISH_LIST.map((p, i) => [i + 1, p]);
  sheet.getRange(2, 1, n, 2).setValues(names);

  // Columns C..J: Status, Submissions, Last Registered, Programs,
  //               Participants, Substitutes, Duplicate Entries, Central-Diocese
  // Source columns: Registrations A=Timestamp D=Parish G=Central-Diocese,
  //                 Items D=Parish E=Program, All Participants D=Parish F=Role
  const formulas = [];
  for (let r = 2; r <= last; r++) {
    formulas.push([
      '=IF(D' + r + '>0,"✅ Registered","⏳ Pending")',
      '=COUNTIF(Registrations!$D:$D,$B' + r + ')',
      '=IF(D' + r + '>0,MAXIFS(Registrations!$A:$A,Registrations!$D:$D,$B' + r + '),"")',
      '=COUNTIF(Items!$D:$D,$B' + r + ')',
      '=COUNTIFS(\'All Participants\'!$D:$D,$B' + r + ',\'All Participants\'!$F:$F,"Participant")',
      '=COUNTIFS(\'All Participants\'!$D:$D,$B' + r + ',\'All Participants\'!$F:$F,"Substitute")',
      '=IF(F' + r + '=0,0,F' + r + '-COUNTA(UNIQUE(FILTER(Items!$E$2:$E,Items!$D$2:$D=$B' + r + '))))',
      '=IF(D' + r + '=0,"",IFERROR(INDEX(SORT(FILTER(Registrations!$G$2:$G,Registrations!$D$2:$D=$B' + r + '),FILTER(Registrations!$A$2:$A,Registrations!$D$2:$D=$B' + r + '),FALSE),1),""))'
    ]);
  }
  sheet.getRange(2, 3, n, 8).setFormulas(formulas);
  sheet.getRange(2, 5, n, 1).setNumberFormat("dd/MM/yyyy HH:mm");

  // Summary box (columns K:L)
  sheet.getRange("K1:L7").setValues([
    ["Summary", ""],
    ["Registered", ""],
    ["Pending", ""],
    ["Total parishes", ""],
    ["Parishes with duplicates", ""],
    ["Total participants", ""],
    ["Total substitutes", ""]
  ]);
  sheet.getRange("L2").setFormula('=COUNTIF(D2:D' + last + ',">0")');
  sheet.getRange("L3").setFormula('=COUNTIF(D2:D' + last + ',0)');
  sheet.getRange("L4").setFormula('=COUNTA(B2:B' + last + ')');
  sheet.getRange("L5").setFormula('=COUNTIF(I2:I' + last + ',">0")');
  sheet.getRange("L6").setFormula('=SUM(G2:G' + last + ')');
  sheet.getRange("L7").setFormula('=SUM(H2:H' + last + ')');
  sheet.getRange("K1:L1").setFontWeight("bold").setBackground("#1e3a5f").setFontColor("#ffffff");
  sheet.getRange("K2:K7").setFontWeight("bold");

  // Central-Diocese summary lines (K9:L11); row 8 is the Queue monitor
  sheet.getRange("K9:K11").setValues([
    ["Central-Diocese: Yes"],
    ["Central-Diocese: No (not registered)"],
    ["Form not submitted yet"]
  ]).setFontWeight("bold");
  sheet.getRange("L9").setFormula('=COUNTIF(J2:J' + last + ',"Yes")');
  sheet.getRange("L10").setFormula('=COUNTIF(J2:J' + last + ',"No")');
  sheet.getRange("L11").setFormula('=COUNTIF(D2:D' + last + ',0)');

  // Row colours (first rule wins): red = has duplicates, green = registered, amber = pending
  const area = sheet.getRange(2, 1, n, CHECKLIST_HEADERS.length);
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied("=$I2>0").setBackground(DUP_COLOR).setRanges([area]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied("=$D2>0").setBackground("#d9f2e1").setRanges([area]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied("=$D2=0").setBackground("#fff3d6").setRanges([area]).build()
  ]);

  // Added AFTER the colour rules above, so the rules list is not overwritten
  addQueueMonitor_(sheet);

  sheet.autoResizeColumns(1, 12);
  sheet.setColumnWidth(2, 380);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(10, 190);
  sheet.setColumnWidth(11, 260);
}

// Checklist cell K8:L8 = number of Queue rows that are NOT "DONE" or "REMOVED" (so: PENDING or ERROR).
// 0 = everything submitted has reached the other tabs. Turns red when above 0.
function addQueueMonitor_(sheet) {
  sheet.getRange("K8").setValue("Queue rows not DONE").setFontWeight("bold");
  sheet.getRange("L8").setFormula(QUEUE_MONITOR_FORMULA);
  const rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=$L$8>0").setBackground(DUP_COLOR).setRanges([sheet.getRange("K8:L8")]).build());
  sheet.setConditionalFormatRules(rules);
}

// Run manually (Run ▶) ONCE to add the "Queue rows not DONE" cell to your EXISTING Checklist
// (no need to rebuild it). New Checklists get it automatically.
function addQueueMonitorToChecklist() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CHECKLIST_SHEET);
  if (!sheet) throw new Error("Checklist tab not found.");
  addQueueMonitor_(sheet);
}

// Run manually (Run ▶) to rebuild the Checklist, e.g. after changing PARISH_LIST or the column order
function rebuildChecklist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const old = ss.getSheetByName(CHECKLIST_SHEET);
  if (old) ss.deleteSheet(old);
  ensureChecklist_(ss);
}

/* ---------- Helpers ---------- */

// Build the list of people (participants + substitutes) for one item.
// Works with the new payload and falls back to the old "A | B | C" string.
function getPeople_(item) {
  const people = [];

  if (Array.isArray(item.participantsDetail) && item.participantsDetail.length) {
    item.participantsDetail.forEach(p => {
      people.push({
        name:   p.name || "",
        dob:    formatDob_(p.dob),
        role:   "Participant"
      });
    });
  } else {
    String(item.participants || "").split("|").forEach(n => {
      n = n.trim();
      if (n) people.push({ name: n, dob: "", role: "Participant" });
    });
  }

  (item.substitutes || []).forEach(s => {
    people.push({
      name:   s.name || "",
      dob:    formatDob_(s.dob),
      role:   "Substitute"
    });
  });

  return people;
}

// "2001-05-14" -> "14/05/2001"
function formatDob_(dob) {
  if (!dob) return "";
  const m = String(dob).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? m[3] + "/" + m[2] + "/" + m[1] : String(dob);
}

// Append many rows at once. textCols = 1-based columns kept as plain text
// (phone numbers keep a leading 0, dates of birth stay as typed).
// regIdx (optional) = 0-based position of the Reg ID in each row; rows whose Reg ID is
// already present in that column of the sheet are not written again.
function writeRows_(sheet, rows, textCols, regIdx) {
  if (!rows.length) return;

  if (regIdx != null) {
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const have = {};
      sheet.getRange(2, regIdx + 1, lastRow - 1, 1).getValues()
        .forEach(r => { have[String(r[0]).trim()] = true; });
      rows = rows.filter(r => !have[String(r[regIdx]).trim()]);
      if (!rows.length) return;
    }
  }

  const start = sheet.getLastRow() + 1;
  (textCols || []).forEach(c =>
    sheet.getRange(start, c, rows.length, 1).setNumberFormat("@"));
  sheet.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
}

// Run manually (Run ▶) to auto-fit column widths on all data tabs
function tidyColumns() {
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(s => {
    if (s.getName() === CHECKLIST_SHEET) return;
    // On event tabs skip column A, so the long event title doesn't make it huge
    const from = headerRowsOf_(s) === 2 ? 2 : 1;
    s.autoResizeColumns(from, s.getLastColumn() - from + 1);
  });
}

// Event tabs: row 1 = event name, row 2 = column headers, data from row 3.
function getOrCreateEventSheet_(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    styleEventSheet_(sheet, name);
    applyDuplicateFlags_(sheet, eventFlag_(3), EVENT_HEADERS.length, 3);
  }
  return sheet;
}

function styleEventSheet_(sheet, title) {
  sheet.getRange(1, 1).setValue(title);
  formatTitleRow_(sheet);
  sheet.getRange(2, 1, 1, EVENT_HEADERS.length)
    .setValues([EVENT_HEADERS])
    .setFontWeight("bold").setFontSize(10)
    .setBackground("#1e3a5f").setFontColor("#ffffff");
  sheet.setFrozenRows(2);
  sheet.setColumnWidth(1, 150);
  sheet.autoResizeColumns(2, EVENT_HEADERS.length - 1);
}

// Row 1 of an event tab: white background across the whole row, dark blue bold title that
// overflows to the right (the row above the headers must not inherit the header colours).
function formatTitleRow_(sheet) {
  sheet.getRange(1, 1, 1, EVENT_HEADERS.length)
    .setBackground("#ffffff")
    .setFontColor("#1e3a5f")
    .setFontWeight("bold")
    .setFontSize(14)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.OVERFLOW);
}

// Run manually (Run ▶) ONCE: repairs the look of row 1 on event tabs that already have a title
// (white background, readable title that is not cut off). Safe to run again.
function fixEventTitleRows() {
  let fixed = 0;
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(sheet => {
    if (headerRowsOf_(sheet) === 2) {
      formatTitleRow_(sheet);
      fixed++;
    }
  });
  Logger.log("Fixed row 1 on " + fixed + " event tab(s).");
}

// Number of header rows on a tab: 2 for event tabs with a title row, otherwise 1.
function headerRowsOf_(sheet) {
  const name = sheet.getName();
  const reserved = [MAIN_SHEET, ITEMS_SHEET, TOTAL_SHEET, CHECKLIST_SHEET, QUEUE_SHEET];
  if (reserved.indexOf(name) !== -1) return 1;
  return String(sheet.getRange(1, 1).getValue()) === "Timestamp" ? 1 : 2;
}

// Run manually (Run ▶) ONCE: adds the event name on top of every EXISTING event tab
// (inserts a row above the headers and re-applies the red-flag rule). Safe to run again:
// tabs that already have a title are skipped. New event tabs get the title automatically.
function addEventTitles() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reserved = [MAIN_SHEET, ITEMS_SHEET, TOTAL_SHEET, CHECKLIST_SHEET, QUEUE_SHEET];
  let changed = 0;

  ss.getSheets().forEach(sheet => {
    const name = sheet.getName();
    if (reserved.indexOf(name) !== -1) return;
    if (String(sheet.getRange(1, 1).getValue()) === "Timestamp") {   // old layout: headers in row 1
      sheet.insertRowBefore(1);
      styleEventSheet_(sheet, name);
      applyDuplicateFlags_(sheet, eventFlag_(3), EVENT_HEADERS.length, 3);
      changed++;
    }
  });
  Logger.log("Added a title to " + changed + " event tab(s).");
}

// Get a tab or create it with a styled, frozen header row (and red-flag rule if given)
function getOrCreateSheet_(ss, name, headers, flagFormula) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    styleHeader_(sheet, headers);
    if (flagFormula) applyDuplicateFlags_(sheet, flagFormula, headers.length);
  }
  return sheet;
}

function styleHeader_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight("bold")
    .setBackground("#1e3a5f")
    .setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

// Rewrites the header row if it differs (fixes tabs created by older scripts)
function ensureHeaderRow_(sheet, headers) {
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const same = headers.every((h, i) => String(current[i]) === h);
  if (!same) styleHeader_(sheet, headers);
}

// Tab names can't contain  [ ] * ? : / \  and max length is 100
function sheetNameFor_(program) {
  let name = String(program || "Unknown")
    .replace(/[\[\]\*\?\:\/\\]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 90);

  if ([MAIN_SHEET, ITEMS_SHEET, TOTAL_SHEET, CHECKLIST_SHEET, QUEUE_SHEET].indexOf(name) !== -1) {
    name = name + " (Event)";
  }
  return name;
}

// seq = Queue row number, so two submissions in the same second can never share an ID
function makeRegId_(time, seq) {
  const stamp = Utilities.formatDate(time, Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
  return "JWL-" + stamp + "-" + String(seq).padStart(3, "0");
}

// Run MANUALLY (Run ▶) once before registration opens.
// Creates the tab for every program now, so the first real submissions don't have to
// build tabs (that made one processQueue run take ~3.5 minutes in your test).
// Safe to run again: tabs that already exist are skipped. If it stops at the time
// limit, just run it again. The names come from PROGRAM_LIST near the top.
function createAllEventTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const started = Date.now();
  let created = 0;

  for (let i = 0; i < PROGRAM_LIST.length; i++) {
    if (Date.now() - started > 4.5 * 60 * 1000) {
      Logger.log("Stopped early. Run createAllEventTabs again to finish.");
      break;
    }
    const tab = sheetNameFor_(PROGRAM_LIST[i]);
    if (!ss.getSheetByName(tab)) {
      getOrCreateEventSheet_(ss, tab);
      created++;
    }
  }
  Logger.log("Created " + created + " new tab(s). Total programs: " + PROGRAM_LIST.length);
}