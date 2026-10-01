/* ============================================================
   Kaycee CEP Panel — main.js
   ============================================================ */

'use strict';

// ── CSInterface ──────────────────────────────────────────────
var csInterface = new CSInterface();

/**
 * Evaluate a JSX expression in the host (After Effects).
 * @param {string}   code     - ExtendScript code to evaluate
 * @param {Function} callback - called with the result string
 */
function runJSX(code, callback) {
  csInterface.evalScript(code, function (result) {
    if (typeof callback === 'function') {
      callback(result);
    }
  });
}

/**
 * Parse the JSON result returned by every JSX function.
 * Logs errors to the console; returns the parsed object or null.
 */
function parseResult(result) {
  try {
    var obj = JSON.parse(result);
    if (!obj.ok) {
      console.error('[Kaycee] JSX error:', obj.error);
    }
    return obj;
  } catch (e) {
    console.error('[Kaycee] Could not parse result:', result);
    return null;
  }
}

// ── Button helpers ───────────────────────────────────────────
function btn(id) {
  return document.getElementById(id);
}

function onBtn(id, handler) {
  var el = btn(id);
  if (el) el.addEventListener('click', handler);
}

// ── COMPOSITION buttons ──────────────────────────────────────

onBtn('btn-precomp', function (e) {
  var shift = e.shiftKey ? 'true' : 'false';
  runJSX('kaycee_preComp(' + shift + ')', parseResult);
});

onBtn('btn-mt', function (e) {
  var shift = e.shiftKey ? 'true' : 'false';
  runJSX('kaycee_motionTile(' + shift + ')', parseResult);
});

// ── LAYER buttons ────────────────────────────────────────────

onBtn('btn-null', function (e) {
  var shift = e.shiftKey ? 'true' : 'false';
  runJSX('kaycee_addNull(' + shift + ')', parseResult);
});

onBtn('btn-sld', function (e) {
  var shift = e.shiftKey ? 'true' : 'false';
  runJSX('kaycee_addSolid(' + shift + ')', parseResult);
});

onBtn('btn-opacity', function () {
  var val = parseFloat(document.getElementById('opacity-input').value);
  if (isNaN(val)) val = 100;
  val = Math.max(0, Math.min(100, val));
  runJSX('kaycee_setOpacity(' + val + ')', parseResult);
});

// Scroll wheel on opacity input
document.getElementById('opacity-input').addEventListener('wheel', function (e) {
  e.preventDefault();
  var cur = parseFloat(this.value);
  if (isNaN(cur)) cur = 100;
  var delta = e.deltaY < 0 ? 1 : -1;
  this.value = Math.max(0, Math.min(100, Math.round(cur + delta)));
}, { passive: false });

onBtn('btn-fit', function (e) {
  var shift = e.shiftKey ? 'true' : 'false';
  runJSX('kaycee_fitToComp(' + shift + ')', parseResult);
});

onBtn('btn-trim-remap', function () {
  runJSX('kaycee_trimToLastRemap()', parseResult);
});
var dpadMap = {
  'dpad-tl': [0.0, 0.0],
  'dpad-tm': [0.5, 0.0],
  'dpad-tr': [1.0, 0.0],
  'dpad-ml': [0.0, 0.5],
  'dpad-mc': [0.5, 0.5],
  'dpad-mr': [1.0, 0.5],
  'dpad-bl': [0.0, 1.0],
  'dpad-bm': [0.5, 1.0],
  'dpad-br': [1.0, 1.0]
};

Object.keys(dpadMap).forEach(function (id) {
  var coords = dpadMap[id];
  onBtn(id, function () {
    runJSX('kaycee_dpad(' + coords[0] + ',' + coords[1] + ')', parseResult);
  });
});

// ── FOOTER buttons ───────────────────────────────────────────

onBtn('btn-trash', function () {
  runJSX('kaycee_deleteLayers()', parseResult);
});

onBtn('btn-shield', function () {
  runJSX('kaycee_lockLayers()', parseResult);
});

onBtn('btn-gear', function () {
  openSettings();
});

// ── Settings panel ───────────────────────────────────────────

var settingsPanel = document.getElementById('settings-panel');
var bgLayer       = document.getElementById('bg-layer');
var bgOverlay     = document.getElementById('bg-overlay');

function openSettings() {
  settingsPanel.classList.add('open');
}

function closeSettings() {
  settingsPanel.classList.remove('open');
}

onBtn('btn-settings-close', closeSettings);

// Close settings with Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && settingsPanel && settingsPanel.classList.contains('open')) {
    closeSettings();
  }
});

// File picker button triggers hidden file input
onBtn('btn-pick-file', function () {
  document.getElementById('bg-file-input').click();
});

var pendingFileDataURL = null;
var pendingFileType    = null; // 'image' | 'video'

function updateBgFileInfo(name, type) {
  var nameEl = document.getElementById('bg-file-name');
  var iconEl = document.getElementById('bg-file-icon');
  if (nameEl) nameEl.textContent = name || 'Default Dark';
  if (iconEl) {
    if (type === 'video') {
      iconEl.textContent = '🎬';
    } else if (type === 'image') {
      iconEl.textContent = '🖼️';
    } else {
      iconEl.textContent = '✨';
    }
  }
}

document.getElementById('bg-file-input').addEventListener('change', function (e) {
  var file = e.target.files[0];
  if (!file) return;

  var isVideo = file.type.indexOf('video') === 0;
  pendingFileType = isVideo ? 'video' : 'image';
  updateBgFileInfo(file.name, pendingFileType);

  // Read as base64 for both image and video — ensures persistence after AE restart
  var reader = new FileReader();
  reader.onload = function (ev) {
    pendingFileDataURL = ev.target.result;
    applyBackground();
    saveSettings();
  };
  reader.readAsDataURL(file);
});

// Clear background button
onBtn('btn-clear-bg', function () {
  pendingFileDataURL = null;
  pendingFileType    = null;
  var fileInput = document.getElementById('bg-file-input');
  if (fileInput) fileInput.value = '';
  updateBgFileInfo('Default Dark', null);
  applyBackground();
  saveSettings();
});

// Slider fill percentage helper for custom modern progress track
function updateSliderFill(slider) {
  if (!slider) return;
  var min = parseFloat(slider.min) || 0;
  var max = parseFloat(slider.max) || 100;
  var val = parseFloat(slider.value) || 0;
  var pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--fill-pct', pct + '%');
}

// Blur slider
var sliderBlur  = document.getElementById('slider-blur');
var valBlur     = document.getElementById('val-blur');

sliderBlur.addEventListener('input', function () {
  var v = sliderBlur.value;
  valBlur.textContent = v + 'px';
  document.documentElement.style.setProperty('--blur-amount', v + 'px');
  updateSliderFill(sliderBlur);
});

// Overlay opacity slider
var sliderOverlay = document.getElementById('slider-overlay');
var valOverlay    = document.getElementById('val-overlay');

sliderOverlay.addEventListener('input', function () {
  var v = sliderOverlay.value;
  valOverlay.textContent = v + '%';
  document.documentElement.style.setProperty('--overlay-opacity', (v / 100).toFixed(2));
  updateSliderFill(sliderOverlay);
});

// Button blur slider
var sliderBtnBlur = document.getElementById('slider-btn-blur');
var valBtnBlur    = document.getElementById('val-btn-blur');

sliderBtnBlur.addEventListener('input', function () {
  var v = sliderBtnBlur.value;
  valBtnBlur.textContent = v + 'px';
  document.documentElement.style.setProperty('--btn-blur', v + 'px');
  updateSliderFill(sliderBtnBlur);
});

// Font color picker — controls accent color (Kaycee title, section labels)
var fontColorInput = document.getElementById('font-color-input');
var fontColorHex   = document.getElementById('font-color-hex');
var DEFAULT_FONT_COLOR = '#7b8fff';

/**
 * Parse a hex color string and return { r, g, b } (0–255).
 */
function hexToRgb(hex) {
  var c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  return {
    r: parseInt(c.substring(0,2), 16),
    g: parseInt(c.substring(2,4), 16),
    b: parseInt(c.substring(4,6), 16)
  };
}

function updateColorPreview(hex) {
  var disc = document.getElementById('color-preview-disc');
  if (disc) disc.style.backgroundColor = hex;

  // Sync active state on preset chips
  var chips = document.querySelectorAll('.preset-chip');
  chips.forEach(function (c) {
    var chipColor = c.getAttribute('data-color') || '';
    if (chipColor.toLowerCase() === hex.toLowerCase()) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
}

function applyFontColor(hex) {
  var rgb = hexToRgb(hex);
  var rgbStr  = rgb.r + ',' + rgb.g + ',' + rgb.b;
  var glow55  = 'rgba(' + rgbStr + ',0.55)';
  var light   = 'rgb('  + Math.min(255, rgb.r+45) + ',' + Math.min(255, rgb.g+45) + ',' + Math.min(255, rgb.b+45) + ')';

  document.documentElement.style.setProperty('--accent',       hex);
  document.documentElement.style.setProperty('--accent-rgb',   rgbStr);
  document.documentElement.style.setProperty('--accent-glow',  glow55);
  document.documentElement.style.setProperty('--accent-light', light);
  if (fontColorHex) fontColorHex.textContent = hex.toUpperCase();
  updateColorPreview(hex);
}

fontColorInput.addEventListener('input', function () {
  applyFontColor(fontColorInput.value);
});

onBtn('btn-font-color-reset', function () {
  fontColorInput.value = DEFAULT_FONT_COLOR;
  applyFontColor(DEFAULT_FONT_COLOR);
});

// Preset Color Chips
document.querySelectorAll('.preset-chip').forEach(function (chip) {
  chip.addEventListener('click', function () {
    var color = this.getAttribute('data-color');
    if (color) {
      fontColorInput.value = color;
      applyFontColor(color);
    }
  });
});

// Reset All Settings button
onBtn('btn-settings-reset-all', function () {
  sliderBlur.value = 12;
  valBlur.textContent = '12px';
  document.documentElement.style.setProperty('--blur-amount', '12px');
  updateSliderFill(sliderBlur);

  sliderOverlay.value = 55;
  valOverlay.textContent = '55%';
  document.documentElement.style.setProperty('--overlay-opacity', '0.55');
  updateSliderFill(sliderOverlay);

  sliderBtnBlur.value = 8;
  valBtnBlur.textContent = '8px';
  document.documentElement.style.setProperty('--btn-blur', '8px');
  updateSliderFill(sliderBtnBlur);

  fontColorInput.value = DEFAULT_FONT_COLOR;
  applyFontColor(DEFAULT_FONT_COLOR);

  pendingFileDataURL = null;
  pendingFileType    = null;
  var fileInput = document.getElementById('bg-file-input');
  if (fileInput) fileInput.value = '';
  updateBgFileInfo('Default Dark', null);
  applyBackground();

  // Reset comp presets to default
  compPresets = JSON.parse(JSON.stringify(DEFAULT_COMP_PRESETS));
  saveCompPresets();
  renderCompPresetButtons();

  // Reset FPS presets to default
  fpsPresets = JSON.parse(JSON.stringify(DEFAULT_FPS_PRESETS));
  saveFpsPresets();
  renderCompFpsButtons();

  saveSettings();
});

// Apply button
onBtn('btn-settings-apply', function () {
  applyBackground();
  saveSettings();
  closeSettings();
});

function applyBackground() {
  // Remove any existing video element
  var existingVideo = bgLayer.querySelector('video');
  if (existingVideo) {
    existingVideo.pause();
    bgLayer.removeChild(existingVideo);
  }
  bgLayer.classList.remove('has-image');

  if (!pendingFileDataURL) return;

  if (pendingFileType === 'image') {
    bgLayer.classList.add('has-image');
    bgLayer.style.backgroundImage = 'url("' + pendingFileDataURL + '")';
    bgLayer.style.backgroundSize  = 'cover';
    bgLayer.style.backgroundPosition = 'center';
    bgLayer.style.backgroundRepeat = 'no-repeat';
  } else if (pendingFileType === 'video') {
    bgLayer.style.backgroundImage = '';
    bgLayer.style.background = '#000';

    var video = document.createElement('video');
    video.src         = pendingFileDataURL;
    video.autoplay    = true;
    video.loop        = true;
    video.muted       = true;
    video.playsInline = true;
    video.setAttribute('style',
      'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;');
    bgLayer.appendChild(video);
    video.load();
    var playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(function (err) {
        console.warn('[Kaycee] video autoplay blocked, retrying on interaction:', err);
        document.addEventListener('click', function retry() {
          video.play().catch(function(){});
          document.removeEventListener('click', retry);
        }, { once: true });
      });
    }
  }
}

// ── Persist settings — IndexedDB for bg file, localStorage for the rest ──

var DB_NAME    = 'kaycee_db';
var DB_VERSION = 1;
var STORE_NAME = 'bg_store';
var db         = null;

/**
 * Open (or create) the IndexedDB database.
 * Calls onReady() when ready, onError(err) on failure.
 */
function openDB(onReady, onError) {
  if (db) { onReady(db); return; }

  var req = indexedDB.open(DB_NAME, DB_VERSION);

  req.onupgradeneeded = function (e) {
    var database = e.target.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME);
    }
  };

  req.onsuccess = function (e) {
    db = e.target.result;
    onReady(db);
  };

  req.onerror = function (e) {
    console.warn('[Kaycee] IndexedDB open error:', e.target.error);
    if (typeof onError === 'function') onError(e.target.error);
  };
}

/** Save a value to IndexedDB under the given key. */
function dbPut(key, value, onDone) {
  openDB(function (database) {
    var tx    = database.transaction(STORE_NAME, 'readwrite');
    var store = tx.objectStore(STORE_NAME);
    var req   = store.put(value, key);
    req.onsuccess = function () { if (typeof onDone === 'function') onDone(true); };
    req.onerror   = function (e) {
      console.warn('[Kaycee] dbPut error:', e.target.error);
      if (typeof onDone === 'function') onDone(false);
    };
  });
}

/** Read a value from IndexedDB by key. Calls cb(value) — value is undefined if missing. */
function dbGet(key, cb) {
  openDB(function (database) {
    var tx    = database.transaction(STORE_NAME, 'readonly');
    var store = tx.objectStore(STORE_NAME);
    var req   = store.get(key);
    req.onsuccess = function (e) { cb(e.target.result); };
    req.onerror   = function (e) {
      console.warn('[Kaycee] dbGet error:', e.target.error);
      cb(undefined);
    };
  }, function () { cb(undefined); });
}

/** Delete a key from IndexedDB. */
function dbDelete(key, onDone) {
  openDB(function (database) {
    var tx    = database.transaction(STORE_NAME, 'readwrite');
    var store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = function () { if (typeof onDone === 'function') onDone(); };
  });
}

// ── Comp Size Feature (Main Panel) ──────────────────────────

var DEFAULT_COMP_PRESETS = [
  { id: 'p_16_9', name: '16:9', width: 1920, height: 1080 },
  { id: 'p_9_16', name: '9:16', width: 1080, height: 1920 },
  { id: 'p_1_1',  name: '1:1',  width: 1080, height: 1080 },
  { id: 'p_4_5',  name: '4:5',  width: 1080, height: 1350 }
];

var compPresets = [];

function loadCompPresets() {
  compPresets = [];
  try {
    var raw = localStorage.getItem('kaycee_comp_presets');
    if (raw) {
      compPresets = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Kaycee] Error loading comp presets:', e);
  }

  if (!Array.isArray(compPresets) || compPresets.length === 0) {
    compPresets = JSON.parse(JSON.stringify(DEFAULT_COMP_PRESETS));
  }
}

function saveCompPresets() {
  try {
    localStorage.setItem('kaycee_comp_presets', JSON.stringify(compPresets));
  } catch (e) {
    console.warn('[Kaycee] Error saving comp presets:', e);
  }
}

function renderCompPresetButtons() {
  var container = document.getElementById('comp-preset-buttons');
  if (!container) return;
  container.innerHTML = '';

  if (compPresets.length === 0) {
    var emptyMsg = document.createElement('span');
    emptyMsg.style.cssText = 'font-size:9px;color:var(--text-muted);grid-column:span 2;text-align:center;padding:6px 0;opacity:0.8;';
    emptyMsg.textContent = 'No presets. Click + Preset to add one.';
    container.appendChild(emptyMsg);
    return;
  }

  compPresets.forEach(function (p, index) {
    var b = document.createElement('button');
    b.className = 'comp-preset-btn';
    b.setAttribute('title', p.name + ' (' + p.width + ' × ' + p.height + ') | Right-click to delete');

    var nameSpan = document.createElement('span');
    nameSpan.className = 'preset-btn-name';
    nameSpan.textContent = p.name;

    var dimsSpan = document.createElement('span');
    dimsSpan.className = 'preset-btn-dims';
    dimsSpan.textContent = p.width + '×' + p.height;

    // Corner delete badge
    var delBadge = document.createElement('span');
    delBadge.className = 'preset-badge-del';
    delBadge.textContent = '✕';
    delBadge.setAttribute('title', 'Delete ' + p.name);
    delBadge.addEventListener('click', function (e) {
      e.stopPropagation();
      deletePresetByIndex(index);
    });

    b.appendChild(nameSpan);
    b.appendChild(dimsSpan);
    b.appendChild(delBadge);

    // Click: Resize active comp in AE!
    b.addEventListener('click', function () {
      b.classList.add('resizing');
      setTimeout(function () {
        b.classList.remove('resizing');
      }, 350);

      runJSX('kaycee_setCompSize(' + p.width + ',' + p.height + ')', function (res) {
        var obj = parseResult(res);
        if (obj && !obj.ok && obj.error) {
          console.warn('[Kaycee]', obj.error);
        }
      });
    });

    // Right-click: quick delete confirmation
    b.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      if (confirm('Delete preset "' + p.name + '" (' + p.width + '×' + p.height + ')?')) {
        deletePresetByIndex(index);
      }
    });

    container.appendChild(b);
  });
}

function deletePresetByIndex(index) {
  if (index >= 0 && index < compPresets.length) {
    compPresets.splice(index, 1);
    saveCompPresets();
    renderCompPresetButtons();
  }
}

// Toggle inline Add Preset drawer on main panel
onBtn('btn-toggle-add-preset', function () {
  var drawer = document.getElementById('inline-add-preset-box');
  var btn = document.getElementById('btn-toggle-add-preset');
  var icon = document.getElementById('toggle-preset-icon');
  var text = document.getElementById('toggle-preset-text');
  var sec = document.getElementById('section-comp-size');

  if (!drawer) return;

  var isCollapsed = drawer.classList.contains('collapsed');
  if (isCollapsed) {
    drawer.classList.remove('collapsed');
    if (btn) btn.classList.add('active');
    if (icon) icon.textContent = '✕';
    if (text) text.textContent = 'Close';
    if (sec) sec.classList.add('edit-mode');
    var nameInput = document.getElementById('inline-preset-name');
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 80);
  } else {
    drawer.classList.add('collapsed');
    if (btn) btn.classList.remove('active');
    if (icon) icon.textContent = '+';
    if (text) text.textContent = 'Preset';
    if (sec) sec.classList.remove('edit-mode');
  }
});

// "Get Active" button: reads active comp dimensions from AE directly
onBtn('btn-get-current-comp', function () {
  runJSX('kaycee_getCompSize()', function (res) {
    var obj = parseResult(res);
    if (obj && obj.ok) {
      var wInput = document.getElementById('inline-preset-width');
      var hInput = document.getElementById('inline-preset-height');
      var nameInput = document.getElementById('inline-preset-name');

      if (wInput) wInput.value = obj.width;
      if (hInput) hInput.value = obj.height;
      if (nameInput && !nameInput.value) {
        var w = obj.width;
        var h = obj.height;
        if (w === 1920 && h === 1080) nameInput.value = '16:9';
        else if (w === 1080 && h === 1920) nameInput.value = '9:16';
        else if (w === 1080 && h === 1080) nameInput.value = '1:1';
        else if (w === 1080 && h === 1350) nameInput.value = '4:5';
        else if (w === 3840 && h === 2160) nameInput.value = '4K';
        else nameInput.value = obj.name || (w + '×' + h);
      }
    } else {
      console.warn('[Kaycee] No active comp open in AE');
    }
  });
});

// Inline Add Preset submit button
onBtn('btn-inline-add-preset', function () {
  var nameInput = document.getElementById('inline-preset-name');
  var wInput    = document.getElementById('inline-preset-width');
  var hInput    = document.getElementById('inline-preset-height');

  var name = (nameInput.value || '').trim();
  var w    = parseInt(wInput.value, 10);
  var h    = parseInt(hInput.value, 10);

  if (isNaN(w) || w <= 0) {
    if (wInput) wInput.focus();
    return;
  }
  if (isNaN(h) || h <= 0) {
    if (hInput) hInput.focus();
    return;
  }
  if (!name) {
    name = w + ':' + h;
  }

  var newPreset = {
    id: 'p_' + Date.now(),
    name: name,
    width: w,
    height: h
  };

  compPresets.push(newPreset);
  saveCompPresets();

  if (nameInput) nameInput.value = '';
  if (wInput) wInput.value = '';
  if (hInput) hInput.value = '';

  renderCompPresetButtons();
});

// Restore default comp presets
onBtn('btn-restore-comp-defaults', function () {
  compPresets = JSON.parse(JSON.stringify(DEFAULT_COMP_PRESETS));
  saveCompPresets();
  renderCompPresetButtons();
});

// Enter key support in inline add form
['inline-preset-name', 'inline-preset-width', 'inline-preset-height'].forEach(function (id) {
  var el = document.getElementById(id);
  if (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var addBtn = document.getElementById('btn-inline-add-preset');
        if (addBtn) addBtn.click();
      }
    });
  }
});

// ── Comp FPS Feature (Main Panel) ───────────────────────────

var DEFAULT_FPS_PRESETS = [
  { id: 'f_24', fps: 24, name: '24' },
  { id: 'f_25', fps: 25, name: '25' },
  { id: 'f_30', fps: 30, name: '30' },
  { id: 'f_60', fps: 60, name: '60' }
];

var fpsPresets = [];

function loadFpsPresets() {
  fpsPresets = [];
  try {
    var raw = localStorage.getItem('kaycee_fps_presets');
    if (raw) {
      fpsPresets = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Kaycee] Error loading FPS presets:', e);
  }

  if (!Array.isArray(fpsPresets) || fpsPresets.length === 0) {
    fpsPresets = JSON.parse(JSON.stringify(DEFAULT_FPS_PRESETS));
  }
}

function saveFpsPresets() {
  try {
    localStorage.setItem('kaycee_fps_presets', JSON.stringify(fpsPresets));
  } catch (e) {
    console.warn('[Kaycee] Error saving FPS presets:', e);
  }
}

function renderCompFpsButtons() {
  var container = document.getElementById('comp-fps-buttons');
  if (!container) return;
  container.innerHTML = '';

  if (fpsPresets.length === 0) {
    var emptyMsg = document.createElement('span');
    emptyMsg.style.cssText = 'font-size:9px;color:var(--text-muted);grid-column:span 4;text-align:center;padding:6px 0;opacity:0.8;';
    emptyMsg.textContent = 'No presets. Click + FPS to add one.';
    container.appendChild(emptyMsg);
    return;
  }

  fpsPresets.forEach(function (p, index) {
    var b = document.createElement('button');
    b.className = 'comp-fps-btn';
    var labelText = (p.name && p.name !== String(p.fps)) ? p.name : 'fps';
    b.setAttribute('title', (p.name ? (p.name + ' (' + p.fps + ' fps)') : (p.fps + ' fps')) + ' | Right-click to delete');

    var valSpan = document.createElement('span');
    valSpan.className = 'fps-btn-val';
    valSpan.textContent = p.fps;

    var unitSpan = document.createElement('span');
    unitSpan.className = 'fps-btn-unit';
    unitSpan.textContent = labelText;

    // Corner delete badge
    var delBadge = document.createElement('span');
    delBadge.className = 'preset-badge-del';
    delBadge.textContent = '✕';
    delBadge.setAttribute('title', 'Delete ' + p.fps + ' fps');
    delBadge.addEventListener('click', function (e) {
      e.stopPropagation();
      deleteFpsPresetByIndex(index);
    });

    b.appendChild(valSpan);
    b.appendChild(unitSpan);
    b.appendChild(delBadge);

    // Click: Set active comp FPS in AE!
    b.addEventListener('click', function () {
      b.classList.add('resizing');
      setTimeout(function () {
        b.classList.remove('resizing');
      }, 350);

      runJSX('kaycee_setCompFps(' + p.fps + ')', function (res) {
        var obj = parseResult(res);
        if (obj && !obj.ok && obj.error) {
          console.warn('[Kaycee]', obj.error);
        }
      });
    });

    // Right-click: quick delete confirmation
    b.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var desc = p.name ? (p.name + ' (' + p.fps + ' fps)') : (p.fps + ' fps');
      if (confirm('Delete FPS preset "' + desc + '"?')) {
        deleteFpsPresetByIndex(index);
      }
    });

    container.appendChild(b);
  });
}

function deleteFpsPresetByIndex(index) {
  if (index >= 0 && index < fpsPresets.length) {
    fpsPresets.splice(index, 1);
    saveFpsPresets();
    renderCompFpsButtons();
  }
}

// Toggle inline Add FPS drawer on main panel
onBtn('btn-toggle-add-fps', function () {
  var drawer = document.getElementById('inline-add-fps-box');
  var btn    = document.getElementById('btn-toggle-add-fps');
  var icon   = document.getElementById('toggle-fps-icon');
  var text   = document.getElementById('toggle-fps-text');
  var sec    = document.getElementById('section-comp-fps');

  if (!drawer) return;

  var isCollapsed = drawer.classList.contains('collapsed');
  if (isCollapsed) {
    drawer.classList.remove('collapsed');
    if (btn) btn.classList.add('active');
    if (icon) icon.textContent = '✕';
    if (text) text.textContent = 'Close';
    if (sec) sec.classList.add('edit-mode');
    var fpsInput = document.getElementById('inline-fps-value');
    if (fpsInput) setTimeout(function () { fpsInput.focus(); }, 80);
  } else {
    drawer.classList.add('collapsed');
    if (btn) btn.classList.remove('active');
    if (icon) icon.textContent = '+';
    if (text) text.textContent = 'FPS';
    if (sec) sec.classList.remove('edit-mode');
  }
});

// "Get Active" button: reads active comp FPS from AE directly
onBtn('btn-get-current-fps', function () {
  runJSX('kaycee_getCompFps()', function (res) {
    var obj = parseResult(res);
    if (obj && obj.ok) {
      var fpsInput  = document.getElementById('inline-fps-value');
      var nameInput = document.getElementById('inline-fps-name');

      // Round to 3 decimal places if float (e.g. 23.976, 29.97, 59.94)
      var fpsVal = Math.round(obj.frameRate * 1000) / 1000;
      if (fpsInput) fpsInput.value = fpsVal;

      if (nameInput && !nameInput.value) {
        if (Math.abs(fpsVal - 23.976) < 0.01) nameInput.value = '23.98';
        else if (Math.abs(fpsVal - 24) < 0.001) nameInput.value = 'Film';
        else if (Math.abs(fpsVal - 25) < 0.001) nameInput.value = 'PAL';
        else if (Math.abs(fpsVal - 29.97) < 0.01) nameInput.value = 'NTSC';
        else if (Math.abs(fpsVal - 30) < 0.001) nameInput.value = '30';
        else if (Math.abs(fpsVal - 59.94) < 0.01) nameInput.value = '59.94';
        else if (Math.abs(fpsVal - 60) < 0.001) nameInput.value = '60';
        else nameInput.value = fpsVal + ' fps';
      }
    } else {
      console.warn('[Kaycee] No active comp open in AE');
    }
  });
});

// Inline Add FPS submit button
onBtn('btn-inline-add-fps', function () {
  var nameInput = document.getElementById('inline-fps-name');
  var valInput  = document.getElementById('inline-fps-value');

  var name = (nameInput.value || '').trim();
  var val  = parseFloat(valInput.value);

  if (isNaN(val) || val <= 0) {
    if (valInput) valInput.focus();
    return;
  }

  // Round to 3 decimal places
  val = Math.round(val * 1000) / 1000;

  if (!name) {
    name = String(val);
  }

  var newPreset = {
    id: 'f_' + Date.now(),
    name: name,
    fps: val
  };

  fpsPresets.push(newPreset);
  saveFpsPresets();

  if (nameInput) nameInput.value = '';
  if (valInput) valInput.value = '';

  renderCompFpsButtons();
});

// Restore default FPS presets
onBtn('btn-restore-fps-defaults', function () {
  fpsPresets = JSON.parse(JSON.stringify(DEFAULT_FPS_PRESETS));
  saveFpsPresets();
  renderCompFpsButtons();
});

// Enter key support in inline add FPS form
['inline-fps-name', 'inline-fps-value'].forEach(function (id) {
  var el = document.getElementById(id);
  if (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var addBtn = document.getElementById('btn-inline-add-fps');
        if (addBtn) addBtn.click();
      }
    });
  }
});

// ── Save / Load ──────────────────────────────────────────────

/**
 * Save all settings.
 * Non-file settings go to localStorage; background file data goes to IndexedDB.
 */
function saveSettings() {
  // 1. Non-file settings → localStorage (fast, small)
  var settings = {
    bgFileType:     pendingFileType || null,
    blurAmount:     sliderBlur.value,
    overlayOpacity: sliderOverlay.value,
    btnBlur:        sliderBtnBlur.value,
    fontColor:      fontColorInput.value,
    hasBg:          !!pendingFileDataURL
  };
  try {
    localStorage.setItem('kaycee_settings', JSON.stringify(settings));
  } catch (e) {
    console.warn('[Kaycee] localStorage save error:', e);
  }

  // 2. Background file data → IndexedDB (handles large base64)
  if (pendingFileDataURL) {
    dbPut('bgFileDataURL', pendingFileDataURL);
  } else {
    dbDelete('bgFileDataURL');
  }
}

/**
 * Load all settings on startup.
 * Restores sliders/colors from localStorage, then loads bg file from IndexedDB.
 */
function loadSettings() {
  // 1. Non-file settings from localStorage
  var settings = {};
  try {
    var raw = localStorage.getItem('kaycee_settings');
    if (raw) settings = JSON.parse(raw);
  } catch (e) {
    console.warn('[Kaycee] localStorage load error:', e);
  }

  if (settings.blurAmount !== undefined) {
    sliderBlur.value = settings.blurAmount;
    valBlur.textContent = settings.blurAmount + 'px';
    document.documentElement.style.setProperty('--blur-amount', settings.blurAmount + 'px');
  }
  updateSliderFill(sliderBlur);

  if (settings.overlayOpacity !== undefined) {
    sliderOverlay.value = settings.overlayOpacity;
    valOverlay.textContent = settings.overlayOpacity + '%';
    document.documentElement.style.setProperty('--overlay-opacity', (settings.overlayOpacity / 100).toFixed(2));
  }
  updateSliderFill(sliderOverlay);

  if (settings.btnBlur !== undefined) {
    sliderBtnBlur.value = settings.btnBlur;
    valBtnBlur.textContent = settings.btnBlur + 'px';
    document.documentElement.style.setProperty('--btn-blur', settings.btnBlur + 'px');
  }
  updateSliderFill(sliderBtnBlur);

  var activeColor = settings.fontColor || DEFAULT_FONT_COLOR;
  fontColorInput.value = activeColor;
  applyFontColor(activeColor);

  // 2. Background file from IndexedDB (async — may be large)
  if (settings.hasBg) {
    dbGet('bgFileDataURL', function (dataURL) {
      if (dataURL) {
        pendingFileDataURL = dataURL;
        pendingFileType    = settings.bgFileType || 'image';
        updateBgFileInfo(pendingFileType === 'video' ? 'Saved Video' : 'Saved Image', pendingFileType);
        applyBackground();
      } else {
        updateBgFileInfo('Default Dark', null);
      }
    });
  } else {
    updateBgFileInfo('Default Dark', null);
  }

  // 3. Comp size & FPS presets
  loadCompPresets();
  renderCompPresetButtons();
  loadFpsPresets();
  renderCompFpsButtons();
}

// ── Init ─────────────────────────────────────────────────────
loadSettings();
