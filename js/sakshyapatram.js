/* ==========================================================================
   OCYM Kollam – Vicar's Sakshyapatram upload
   --------------------------------------------------------------------------
   The file is uploaded in the background as soon as it is chosen. The normal
   submission then carries only the small {fileId, uploadId, fileName, size}.
   Exposes window.Sakshya = { check, reset, onParishChange } for registration.js.
   Switch: window.SAKSHYA_REQUIRED in js/config.js (must equal SAKSHYA_REQUIRED in Code.gs).
   ========================================================================== */
(function () {
  'use strict';

  const MAX_BYTES = 4 * 1024 * 1024;          // keep equal to SAKSHYA_MAX_BYTES in Code.gs
  const IMG_STEPS = [[2000, 0.8], [1600, 0.65], [1200, 0.5]];   // [longest side px, JPEG quality]
  const MAX_TRIES = 3;                         // automatic tries on network problems
  const TIMEOUT_MS = 120000;
  const OK_EXT = ['jpg', 'jpeg', 'png', 'pdf', 'heic', 'heif'];

  const $ = id => document.getElementById(id);
  const st = {
    state: 'idle',      // idle | preparing | uploading | done | error
    token: 0,           // bumps on every new file / reset, so stale callbacks are ignored
    parish: '', uploadId: '', fileId: '', fileName: '', size: 0,
    pending: null,      // prepared upload kept for Retry: {name, mime, data, size}
    ctrl: null, text: '', retryNote: '', canRetry: false, msg: ''
  };

  const required = () => window.SAKSHYA_REQUIRED !== false;
  const uuid = () => (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : (Date.now().toString(16) + '-' + Math.random().toString(16).slice(2) + '-' + Math.random().toString(16).slice(2));
  const mb = n => (n / 1048576).toFixed(n < 1048576 ? 2 : 1) + ' MB';
  const extOf = name => (String(name).split('.').pop() || '').toLowerCase();
  const parishNow = () => ($('parish') ? $('parish').value.trim() : '');

  /* ---------- rendering ---------- */
  function render() {
    const box = $('sakshya');
    if (!box) return;
    box.setAttribute('data-state', st.state);
    const status = $('sakshyaStatus'), bar = $('sakshyaBar');
    const busy = st.state === 'preparing' || st.state === 'uploading';

    let text = '';
    if (st.state === 'preparing') text = '⏳ ' + (st.text || 'Preparing the file…');
    else if (st.state === 'uploading') text = '⏳ ' + (st.retryNote || ('Uploading… ' + mb(st.size)));
    else if (st.state === 'done') text = '✅ Uploaded: ' + st.fileName + ' (' + mb(st.size) + ')';
    else if (st.state === 'error') text = '⚠️ ' + st.text;
    else text = 'No file chosen';
    status.textContent = text;
    bar.hidden = !busy;

    $('sakshyaPick').hidden = st.state !== 'idle' && st.state !== 'error';
    $('sakshyaRetry').hidden = !(st.state === 'error' && st.canRetry);
    $('sakshyaReplace').hidden = st.state !== 'done';
    $('sakshyaRemove').hidden = !(st.state === 'done' || st.state === 'error' || busy);
    $('sakshyaRemove').textContent = busy ? 'Cancel' : 'Remove';
    $('sakshyaPick').textContent = st.state === 'error' ? '📎 Choose another file' : '📎 Choose file (JPG, PNG or PDF)';

    const m = $('sakshyaMsg');
    m.textContent = st.msg;
    m.hidden = !st.msg;
    if (st.state === 'done') box.classList.remove('has-error');
  }

  function setState(s, o) {
    st.state = s;
    st.text = (o && o.text) || '';
    st.retryNote = (o && o.retryNote) || '';
    st.canRetry = !!(o && o.canRetry);
    render();
  }

  function hardReset(msg) {
    st.token++;
    if (st.ctrl) { try { st.ctrl.abort(); } catch (e) {} st.ctrl = null; }
    st.parish = st.uploadId = st.fileId = st.fileName = '';
    st.size = 0; st.pending = null;
    st.msg = msg || '';
    const f = $('sakshyaFile'); if (f) f.value = '';
    const err = $('sakshyaError'); if (err) { err.classList.remove('visible'); err.textContent = ''; }
    const box = $('sakshya'); if (box) box.classList.remove('has-error');
    setState('idle');
  }

  /* ---------- picking a file ---------- */
  function onPickClick() {
    if (!parishNow()) {
      const box = $('sakshya'), err = $('sakshyaError');
      if (box) box.classList.add('has-error');
      if (err) { err.textContent = 'Please select your parish first.'; err.classList.add('visible'); }
      const trig = $('parishTriggerBtn') || $('parish');
      if (trig && trig.scrollIntoView) trig.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    $('sakshyaFile').click();
  }

  function onFileChosen(ev) {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';                       // lets the same file be chosen again
    if (!file) return;
    handleFile(file);
  }

  function handleFile(file) {
    const ext = extOf(file.name), type = (file.type || '').toLowerCase();
    const isPdf = type === 'application/pdf' || ext === 'pdf';
    const isImg = type.indexOf('image/') === 0 || ['jpg', 'jpeg', 'png', 'heic', 'heif'].indexOf(ext) !== -1;
    st.msg = '';
    const reject = text => { st.msg = text; render(); };   // keeps any earlier good upload

    if (!(isPdf || isImg) || (!type && OK_EXT.indexOf(ext) === -1)) return reject('Only JPG, PNG or PDF files are accepted.');
    if (isImg && type && ['image/jpeg', 'image/png', 'image/heic', 'image/heif'].indexOf(type) === -1) {
      return reject('Only JPG, PNG or PDF files are accepted.');
    }
    if (isPdf && file.size > MAX_BYTES) return reject('This PDF is ' + mb(file.size) + '. Maximum is ' + mb(MAX_BYTES) + '. Please send a smaller PDF or a photo.');
    if (file.size === 0) return reject('This file is empty. Please choose another.');

    // accepted: replaces any earlier upload
    const token = ++st.token;
    if (st.ctrl) { try { st.ctrl.abort(); } catch (e) {} st.ctrl = null; }
    st.parish = parishNow();
    st.uploadId = uuid();
    st.fileId = ''; st.pending = null;
    st.fileName = file.name;
    const err = $('sakshyaError'); if (err) { err.classList.remove('visible'); err.textContent = ''; }
    const box = $('sakshya'); if (box) box.classList.remove('has-error');

    setState('preparing', { text: isImg ? 'Preparing photo…' : 'Reading PDF…' });

    const prepare = isPdf ? blobToPending(file, file.name, 'application/pdf') : compressImage(file).then(b =>
      blobToPending(b, file.name.replace(/\.[^.]+$/, '') + '.jpg', 'image/jpeg'));

    prepare.then(p => {
      if (token !== st.token) return;
      st.pending = p; st.size = p.size;
      startUpload(token, 1);
    }).catch(e => {
      if (token !== st.token) return;
      st.pending = null;
      setState('error', { text: isImg
        ? 'Could not read this photo. Choose another one or take a fresh photo.'
        : 'Could not read this file. Please choose it again.' });
    });
  }

  function blobToPending(blob, name, mime) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error('read'));
      r.onload = () => {
        const s = String(r.result || '');
        const data = s.slice(s.indexOf(',') + 1);
        data ? resolve({ name, mime, data, size: blob.size }) : reject(new Error('empty'));
      };
      r.readAsDataURL(blob);
    });
  }

  // Shrinks a photo (about 2000 px, JPEG 80%). Tries smaller settings if still over the limit.
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.onload = () => {
        const W = img.naturalWidth, H = img.naturalHeight;
        if (!W || !H) { URL.revokeObjectURL(url); return reject(new Error('size')); }
        let i = 0;
        const attempt = () => {
          const side = IMG_STEPS[i][0], q = IMG_STEPS[i][1];
          const sc = Math.min(1, side / Math.max(W, H));
          const w = Math.max(1, Math.round(W * sc)), h = Math.max(1, Math.round(H * sc));
          try {
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const g = c.getContext('2d');
            g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);   // transparent PNG -> white, not black
            g.drawImage(img, 0, 0, w, h);
            c.toBlob(b => {
              if (!b) { URL.revokeObjectURL(url); return reject(new Error('blob')); }
              if (b.size > MAX_BYTES && i < IMG_STEPS.length - 1) { i++; return attempt(); }
              URL.revokeObjectURL(url);
              b.size > MAX_BYTES ? reject(new Error('big')) : resolve(b);
            }, 'image/jpeg', q);
          } catch (e) { URL.revokeObjectURL(url); reject(e); }
        };
        attempt();
      };
      img.src = url;
    });
  }

  /* ---------- uploading ---------- */
  function startUpload(token, attempt) {
    if (token !== st.token || !st.pending) return;
    if (window.navigator && navigator.onLine === false) {
      return setState('error', { text: 'No internet. Check your network and tap Retry.', canRetry: true });
    }
    const url = window.REGISTRATION_POST_URL;
    if (!url) return setState('error', { text: 'Upload is not configured. Please refresh the page.' });

    setState('uploading', { retryNote: attempt > 1 ? 'Connection problem. Trying again (' + attempt + ' of ' + MAX_TRIES + ')…' : '' });

    const ctrl = new AbortController();
    st.ctrl = ctrl;
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const body = JSON.stringify({
      action: 'upload', uploadId: st.uploadId, parish: st.parish,
      fileName: st.pending.name, mime: st.pending.mime, data: st.pending.data
    });

    fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, signal: ctrl.signal })
      .then(res => res.text().then(text => ({ res, text })))
      .then(({ res, text }) => {
        clearTimeout(timer);
        if (token !== st.token) return;
        if (!res.ok) throw Object.assign(new Error('http'), { retryable: res.status >= 500 || res.status === 429 });
        let j;
        try { j = JSON.parse(text); } catch (e) { throw Object.assign(new Error('format'), { retryable: true }); }
        if (!j || j.status !== 'success' || !j.fileId) {
          const m = (j && j.message) ? String(j.message) : 'The server did not accept the file.';
          return setState('error', { text: m, canRetry: !/closed|only jpg|too large|select your parish|invalid upload/i.test(m) });
        }
        st.fileId = String(j.fileId);
        st.ctrl = null;
        setState('done');
      })
      .catch(err => {
        clearTimeout(timer);
        if (token !== st.token) return;                    // cancelled or replaced: stay quiet
        st.ctrl = null;
        const timedOut = err && err.name === 'AbortError';
        const retryable = timedOut || !err || err.retryable !== false;
        if (retryable && attempt < MAX_TRIES && navigator.onLine !== false) {
          setState('uploading', { retryNote: 'Connection problem. Trying again (' + (attempt + 1) + ' of ' + MAX_TRIES + ')…' });
          return setTimeout(() => startUpload(token, attempt + 1), 1500 * attempt);
        }
        const text = (navigator.onLine === false) ? 'No internet. Check your network and tap Retry.'
          : timedOut ? 'Upload is taking too long. Tap Retry.'
          : 'Upload failed. Check your network and tap Retry.';
        setState('error', { text, canRetry: true });
      });
  }

  /* ---------- public API ---------- */
  function check() {
    const box = $('sakshya');
    if (box) box.classList.remove('has-error');
    if (st.state === 'preparing' || st.state === 'uploading') {
      return { ok: false, message: 'Please wait for the tick. The Sakshyapatram is still uploading.', banner: 'Sakshyapatram is still uploading.' };
    }
    if (st.state === 'error') {
      return { ok: false, message: 'The Sakshyapatram upload failed. Tap Retry or choose the file again.', banner: 'Sakshyapatram upload failed.' };
    }
    if (st.state === 'done') {
      if (parishNow() !== st.parish) {
        hardReset('Parish changed. Please upload the Sakshyapatram again.');
        return { ok: false, message: 'Parish changed. Please upload the Sakshyapatram again.', banner: "Vicar's Sakshyapatram is required." };
      }
      return { ok: true, payload: { fileId: st.fileId, uploadId: st.uploadId, fileName: st.fileName, size: st.size } };
    }
    if (required()) {
      return { ok: false, message: "Please upload the vicar's Sakshyapatram.", banner: "Vicar's Sakshyapatram is required." };
    }
    return { ok: true, payload: null };
  }

  function onParishChange(name) {
    const err = $('sakshyaError');
    if (st.state !== 'idle' && st.parish && name !== st.parish) {
      hardReset('Parish changed. Please upload the Sakshyapatram again.');
    } else if (err && /select your parish first/i.test(err.textContent)) {
      err.classList.remove('visible'); err.textContent = '';
      const box = $('sakshya'); if (box) box.classList.remove('has-error');
    }
  }

  function init() {
    if (!$('sakshya')) return;
    const star = $('sakshyaStar'), opt = $('sakshyaOptional');
    if (star) star.hidden = !required();
    if (opt) opt.hidden = required();

    $('sakshyaPick').addEventListener('click', onPickClick);
    $('sakshyaReplace').addEventListener('click', onPickClick);
    $('sakshyaFile').addEventListener('change', onFileChosen);
    $('sakshyaRetry').addEventListener('click', () => { st.msg = ''; startUpload(st.token, 1); });
    $('sakshyaRemove').addEventListener('click', () => hardReset(''));
    render();
  }

  window.Sakshya = { check: check, reset: () => hardReset(''), onParishChange: onParishChange };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
