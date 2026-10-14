/* ============================================================
   Kaycee CEP Panel — bgRemover.js
   Handles AI Image Background Removal (u2netp & BiRefNet)
   and Auto-Importing Cutout PNG directly into AE timeline.
   ============================================================ */

'use strict';

(function (window) {
  // Detect Node.js environment in CEP
  var nodeRequire = (typeof window.require === 'function') ? window.require : null;
  var child_process = nodeRequire ? nodeRequire('child_process') : null;
  var fs = nodeRequire ? nodeRequire('fs') : null;
  var path = nodeRequire ? nodeRequire('path') : null;
  var os = nodeRequire ? nodeRequire('os') : null;

  var currentSelectedLayer = null;
  var selectedModel = 'isnet'; // 'isnet' (Detail Quality) or 'birefnet' (Ultra Quality)
  var isProcessing = false;

  // DOM elements
  var elStatusBox, elStatusText, elStatusPercent, elProgressBar, elBtnRemove, elBtnText;
  var elChkHideOriginal;

  function initBgRemover() {
    elStatusBox        = document.getElementById('bg-status-box');
    elStatusText       = document.getElementById('bg-status-text');
    elStatusPercent    = document.getElementById('bg-status-percent');
    elProgressBar      = document.getElementById('bg-progress-bar');
    elBtnRemove        = document.getElementById('btn-bg-remove');
    elBtnText          = document.getElementById('btn-bg-remove-text');
    elChkHideOriginal  = document.getElementById('chk-bg-hide-original');

    // Dynamic model selection across all model cards in tab-bg
    var modelCards = document.querySelectorAll('#tab-bg .model-card');
    modelCards.forEach(function (card) {
      card.addEventListener('click', function () {
        if (isProcessing) return;
        var modelType = this.getAttribute('data-model') || 'birefnet';
        selectedModel = modelType;
        modelCards.forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    // Action button
    if (elBtnRemove) {
      elBtnRemove.addEventListener('click', function () {
        startBackgroundRemoval();
      });
    }
  }

  function getCustomEnv() {
    var env = Object.assign({}, process.env);
    var userHome = process.env.USERPROFILE || process.env.HOME || '';
    var localApp = process.env.LOCALAPPDATA || (userHome + '\\AppData\\Local');

    var currentDir = window.location.pathname;
    if (process.platform === 'win32' && currentDir.startsWith('/')) {
      currentDir = currentDir.substring(1);
    }
    var panelRoot = path.dirname(decodeURIComponent(currentDir));
    var binDir = path.join(panelRoot, 'bin');

    var extraPaths = [
      binDir,
      path.join(localApp, 'Programs', 'Python', 'Python311', 'Scripts'),
      path.join(localApp, 'Programs', 'Python', 'Python311'),
      path.join(localApp, 'Programs', 'Python', 'Python312', 'Scripts'),
      path.join(localApp, 'Programs', 'Python', 'Python312'),
      path.join(localApp, 'Programs', 'Python', 'Python310', 'Scripts'),
      path.join(localApp, 'Programs', 'Python', 'Python310'),
      path.join(localApp, 'Programs', 'Python', 'Python313', 'Scripts'),
      path.join(localApp, 'Programs', 'Python', 'Python313'),
      'C:\\Program Files\\Python311\\Scripts',
      'C:\\Program Files\\Python311',
      'C:\\Program Files\\Python312\\Scripts',
      'C:\\Program Files\\Python312',
      'C:\\Windows\\System32'
    ];

    var validExtras = extraPaths.filter(function (p) {
      try { return fs && fs.existsSync(p); } catch (e) { return false; }
    });

    var existingPath = env.PATH || env.Path || '';
    env.PATH = validExtras.join(';') + ';' + existingPath;
    env.Path = env.PATH;
    return env;
  }

  function getPythonExecutable() {
    if (process.platform === 'win32') {
      var userHome = process.env.USERPROFILE || process.env.HOME || '';
      var localApp = process.env.LOCALAPPDATA || (userHome + '\\AppData\\Local');
      var candidates = [
        path.join(localApp, 'Programs', 'Python', 'Python311', 'python.exe'),
        path.join(localApp, 'Programs', 'Python', 'Python312', 'python.exe'),
        path.join(localApp, 'Programs', 'Python', 'Python310', 'python.exe'),
        path.join(localApp, 'Programs', 'Python', 'Python313', 'python.exe'),
        'C:\\Program Files\\Python311\\python.exe',
        'C:\\Program Files\\Python312\\python.exe',
        'C:\\Python311\\python.exe'
      ];
      for (var i = 0; i < candidates.length; i++) {
        if (fs && fs.existsSync(candidates[i])) {
          return candidates[i];
        }
      }
    }
    return 'python';
  }

  function getScriptPath() {
    var currentDir = window.location.pathname;
    if (process.platform === 'win32' && currentDir.startsWith('/')) {
      currentDir = currentDir.substring(1);
    }
    var panelRoot = path.dirname(decodeURIComponent(currentDir));
    return path.join(panelRoot, 'bin', 'remove_bg.py');
  }

  /**
   * Ask ExtendScript for selected image layer
   */
  function detectActiveLayer(callback) {
    if (typeof window.runJSX !== 'function') return;

    window.runJSX('kaycee_getSelectedImageLayer()', function (rawResult) {
      try {
        var res = JSON.parse(rawResult);
        if (res.ok) {
          currentSelectedLayer = res;
          if (elBtnRemove) elBtnRemove.disabled = false;
        } else {
          currentSelectedLayer = null;
        }
        if (typeof callback === 'function') callback(res);
      } catch (err) {
        console.error('[Kaycee BgRemover] Parse error:', err);
      }
    });
  }

  var currentProgressVal = 0;

  function updateProgress(percent, statusText) {
    if (typeof percent === 'number') {
      if (percent > currentProgressVal) {
        currentProgressVal = Math.min(100, percent);
      }
    }
    if (elStatusBox) elStatusBox.classList.remove('collapsed');
    if (elProgressBar) elProgressBar.style.width = currentProgressVal + '%';
    if (elStatusPercent) elStatusPercent.textContent = Math.round(currentProgressVal) + '%';
    if (elStatusText && statusText) elStatusText.textContent = statusText;
  }

  function startBackgroundRemoval() {
    if (isProcessing) return;

    detectActiveLayer(function (layerRes) {
      if (!layerRes || !layerRes.ok) {
        alert(layerRes && layerRes.error ? layerRes.error : 'Please select a valid image layer (PNG, JPG, PSD, etc.) in After Effects first.');
        return;
      }

      var sourceFile = layerRes.filePath;
      if (!sourceFile) {
        alert('Image file not found on disk for selected layer.');
        return;
      }

      if (!child_process || !fs || !path || !os) {
        alert('Node.js is not active in this CEP panel. Ensure --enable-nodejs is set in manifest.xml.');
        return;
      }

      if (!fs.existsSync(sourceFile)) {
        alert('File not found on disk: ' + sourceFile);
        return;
      }

      isProcessing = true;
      if (elBtnRemove) {
        elBtnRemove.disabled = true;
        elBtnRemove.classList.add('processing');
        if (elBtnText) elBtnText.textContent = 'Removing Background...';
      }

      var qualityLabel = (selectedModel === 'isnet') ? 'Detail Quality' : 'Ultra Quality';

      currentProgressVal = 0;
      updateProgress(10, 'Initializing...');

      var outDir = path.join(os.tmpdir(), 'kaycee_cutouts');
      try {
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
      } catch (e) {}

      var baseName = path.basename(sourceFile, path.extname(sourceFile));
      var outputFile = path.join(outDir, baseName + '_cutout_' + Date.now() + '.png');

      var pyExe = getPythonExecutable();
      var pyScript = getScriptPath();

      var cmdArgs = [
        pyScript,
        '-i', sourceFile,
        '-o', outputFile,
        '-m', selectedModel
      ];

      updateProgress(20, 'Starting AI Cutout (' + qualityLabel + ')...');

      var proc = child_process.spawn(pyExe, cmdArgs, {
        windowsHide: true,
        env: getCustomEnv()
      });

      var logAccumulator = '';

      proc.stdout.on('data', function (data) {
        var str = data.toString();
        logAccumulator += str;

        // Parse progress markers: [PROGRESS:xx] Message
        var lines = str.split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          var match = line.match(/\[PROGRESS:(\d+)\]\s*(.*)/i);
          if (match) {
            var p = parseInt(match[1], 10);
            var msg = match[2] || 'Processing...';
            updateProgress(p, msg);
          }
        }
      });

      proc.stderr.on('data', function (data) {
        var str = data.toString();
        logAccumulator += str;
        console.warn('[bg-remover stderr]', str);
      });

      proc.on('error', function (err) {
        console.error('[bg-remover spawn error]', err);
        handleFailure('Process launch error: ' + err.message);
      });

      proc.on('close', function (code) {
        if (code === 0 && fs.existsSync(outputFile)) {
          handleSuccess(outputFile, layerRes, qualityLabel);
        } else {
          handleFailure('Background removal failed (Exit code ' + code + '):\n' + logAccumulator);
        }
      });
    });
  }

  function handleSuccess(outputPng, layerRes, qualityLabel) {
    updateProgress(95, 'Importing to After Effects...');

    var hideOriginal = elChkHideOriginal ? elChkHideOriginal.checked : true;
    var layerIndex = layerRes.index || 1;
    var sanitizedPng = outputPng.replace(/\\/g, '/');

    var jsxCall = 'kaycee_importAndAddCutout(' +
      JSON.stringify(sanitizedPng) + ', ' +
      layerIndex + ', ' +
      (hideOriginal ? 'true' : 'false') + ', ' +
      JSON.stringify(qualityLabel) + ')';

    window.runJSX(jsxCall, function (rawRes) {
      try {
        var res = JSON.parse(rawRes);
        if (res && res.ok) {
          updateProgress(100, 'Cutout Imported Successfully! 🎉');
        } else {
          handleFailure('Failed to import into timeline: ' + (res ? res.error : rawRes));
        }
      } catch (e) {
        handleFailure('Response error from AE: ' + rawRes);
      }
      resetProcessingState();
    });
  }

  function handleFailure(errorMsg) {
    currentProgressVal = 0;
    if (elProgressBar) elProgressBar.style.width = '0%';
    if (elStatusPercent) elStatusPercent.textContent = '0%';
    if (elStatusText) elStatusText.textContent = 'Failed';

    var tip = '';
    var lower = (errorMsg || '').toLowerCase();
    if (lower.indexOf('modulenotfounderror') !== -1 || lower.indexOf('no module named') !== -1) {
      tip = '\n\n💡 Solusi:\nLibrary AI belum terpasang.\nJalankan setup engine melalui tombol di tab Audio AI atau buka bin/setup-engine.bat.';
    }

    alert('Image background removal failed:\n' + errorMsg + tip);
    resetProcessingState();
  }

  function resetProcessingState() {
    isProcessing = false;
    if (elBtnRemove) {
      elBtnRemove.disabled = false;
      elBtnRemove.classList.remove('processing');
      if (elBtnText) elBtnText.textContent = 'Remove Background & Import';
    }
  }

  // Export to window
  window.KayceeBgRemover = {
    init: initBgRemover,
    detect: detectActiveLayer
  };

})(window);
