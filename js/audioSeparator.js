/* ============================================================
   Kaycee CEP Panel — audioSeparator.js
   Handles Audio Source Separation (MDX-Net & BS-RoFormer)
   and Auto-Importing Stems back to After Effects timeline.
   Includes 1-Click Auto Setup Engine for non-technical users.
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
  var selectedModel = 'mdx'; // 'mdx' (Fast) or 'roformer' (Quality)
  var isProcessing = false;
  var isInstallingEngine = false;
  var engineInstalled = false;

  // DOM elements cache
  var elStatusBox, elStatusText, elStatusPercent, elProgressBar, elBtnSeparate;
  var elEngineStatusBox, elEngineDot, elEngineTitle, elEngineSub,
      elBtnEngineSetup, elBtnEngineCheck, elLayerName, elLayerPath, elBtnRefresh;

  function initAudioSeparator() {
    elStatusBox        = document.getElementById('audio-status-box');
    elStatusText       = document.getElementById('audio-status-text');
    elStatusPercent    = document.getElementById('audio-status-percent');
    elProgressBar      = document.getElementById('audio-progress-bar');
    elBtnSeparate      = document.getElementById('btn-audio-separate');

    // Model selection cards
    var cardFast = document.getElementById('model-card-fast');
    var cardQuality = document.getElementById('model-card-quality');

    if (cardFast) {
      cardFast.addEventListener('click', function () {
        if (isProcessing) return;
        selectedModel = 'fast';
        cardFast.classList.add('active');
        if (cardQuality) cardQuality.classList.remove('active');
      });
    }

    if (cardQuality) {
      cardQuality.addEventListener('click', function () {
        if (isProcessing) return;
        selectedModel = 'quality';
        cardQuality.classList.add('active');
        if (cardFast) cardFast.classList.remove('active');
      });
    }

    // Main action button
    if (elBtnSeparate) {
      elBtnSeparate.addEventListener('click', function () {
        startAudioSeparation();
      });
    }

    // Silently check AI engine status in background
    checkEngineStatus();
  }

  function getPythonExecutable() {
    if (process.platform === 'win32') {
      var userHome = process.env.USERPROFILE || process.env.HOME || '';
      var localApp = process.env.LOCALAPPDATA || (userHome + '\\AppData\\Local');
      var candidates = [
        path.join(localApp, 'Programs', 'Python', 'Python311', 'python.exe'),
        path.join(localApp, 'Programs', 'Python', 'Python312', 'python.exe'),
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

  function getAudioSeparatorExecutable() {
    if (process.platform === 'win32') {
      var userHome = process.env.USERPROFILE || process.env.HOME || '';
      var localApp = process.env.LOCALAPPDATA || (userHome + '\\AppData\\Local');
      var candidates = [
        path.join(localApp, 'Programs', 'Python', 'Python311', 'Scripts', 'audio-separator.exe'),
        path.join(localApp, 'Programs', 'Python', 'Python312', 'Scripts', 'audio-separator.exe'),
        'C:\\Program Files\\Python311\\Scripts\\audio-separator.exe'
      ];
      for (var i = 0; i < candidates.length; i++) {
        if (fs && fs.existsSync(candidates[i])) {
          return candidates[i];
        }
      }
    }
    return 'audio-separator';
  }

  /**
   * Check whether Python audio-separator engine is installed on this machine
   */
  function checkEngineStatus(callback) {
    if (!child_process) {
      setEngineStatus(false, 'Node.js is not active in panel');
      if (typeof callback === 'function') callback(false);
      return;
    }

    if (elEngineTitle) elEngineTitle.textContent = 'Checking engine status...';

    // 1. Check direct audio-separator executable path
    var sepExe = getAudioSeparatorExecutable();
    var testProc = child_process.spawn(sepExe, ['--version'], {
      windowsHide: true,
      shell: true
    });

    var hasResponded = false;

    testProc.stdout.on('data', function (d) {
      var str = d.toString().toLowerCase();
      if (str.indexOf('audio-separator') !== -1 || str.indexOf('version') !== -1 || str.match(/\d+\.\d+/)) {
        hasResponded = true;
      }
    });

    testProc.stderr.on('data', function (d) {
      var str = d.toString().toLowerCase();
      if (str.indexOf('audio-separator') !== -1) {
        hasResponded = true;
      }
    });

    testProc.on('close', function (code) {
      if (code === 0 || hasResponded) {
        setEngineStatus(true, 'audio-separator (MDX & RoFormer active)');
        if (typeof callback === 'function') callback(true);
      } else {
        // 2. Check via python -m
        checkViaPython(callback);
      }
    });

    testProc.on('error', function () {
      checkViaPython(callback);
    });
  }

  function checkViaPython(callback) {
    var pyExe = getPythonExecutable();
    var pyProc = child_process.spawn(pyExe, ['-m', 'audio_separator.utils.cli', '--version'], {
      windowsHide: true,
      shell: true
    });

    var ok = false;
    pyProc.stdout.on('data', function () { ok = true; });
    pyProc.stderr.on('data', function () { ok = true; });

    pyProc.on('close', function (code) {
      if (code === 0 || ok) {
        setEngineStatus(true, 'audio-separator (MDX & RoFormer active)');
        if (typeof callback === 'function') callback(true);
      } else {
        setEngineStatus(false, 'AI Engine not installed. Click button to install.');
        if (typeof callback === 'function') callback(false);
      }
    });

    pyProc.on('error', function () {
      setEngineStatus(false, 'AI Engine not installed. Click button to install.');
      if (typeof callback === 'function') callback(false);
    });
  }

  function setEngineStatus(installed, subText) {
    engineInstalled = !!installed;
    if (elEngineStatusBox) {
      if (installed) {
        elEngineStatusBox.classList.remove('not-installed');
        elEngineStatusBox.classList.add('installed');
      } else {
        elEngineStatusBox.classList.remove('installed');
        elEngineStatusBox.classList.add('not-installed');
      }
    }

    if (elEngineTitle) {
      elEngineTitle.textContent = installed ? 'AI Engine: Ready' : 'Engine Not Installed';
    }

    if (elEngineSub && subText) {
      elEngineSub.textContent = subText;
    }
  }

  /**
   * 1-Click Auto Setup Engine for non-technical users
   */
  function run1ClickSetup() {
    if (isInstallingEngine) return;
    if (!child_process) {
      alert('Node.js is not active in panel. Ensure --enable-nodejs is set in manifest.xml.');
      return;
    }

    isInstallingEngine = true;
    if (elBtnEngineSetup) {
      elBtnEngineSetup.disabled = true;
      var btnText = document.getElementById('btn-engine-setup-text');
      if (btnText) btnText.textContent = 'Installing Engine...';
    }

    updateProgress(5, 'Starting Engine Auto-Setup...', 'Preparing 1-click automatic installer...');

    // Resolve path to bin/setup-engine.ps1
    var scriptPath = '';
    try {
      var currentDir = window.location.pathname;
      if (process.platform === 'win32' && currentDir.startsWith('/')) {
        currentDir = currentDir.substring(1);
      }
      var panelRoot = path.dirname(decodeURIComponent(currentDir));
      scriptPath = path.join(panelRoot, 'bin', 'setup-engine.ps1');
    } catch (e) {
      scriptPath = 'bin/setup-engine.ps1';
    }

    console.log('[Kaycee Setup] Running script:', scriptPath);

    var setupProc = child_process.spawn('powershell.exe', [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-File', scriptPath
    ], {
      windowsHide: true
    });

    var outputLogs = '';

    setupProc.stdout.on('data', function (data) {
      var str = data.toString();
      outputLogs += str;
      console.log('[setup-engine]', str);

      if (str.indexOf('[1/3]') !== -1) {
        updateProgress(20, 'Checking / Installing Python...', str.trim());
      } else if (str.indexOf('[2/3]') !== -1) {
        updateProgress(50, 'Installing audio-separator...', str.trim());
      } else if (str.indexOf('[3/3]') !== -1) {
        updateProgress(85, 'Verifying engine...', str.trim());
      } else {
        updateProgress(65, 'Downloading packages...', str.trim());
      }
    });

    setupProc.stderr.on('data', function (data) {
      var str = data.toString();
      outputLogs += str;
      console.warn('[setup-engine stderr]', str);
    });

    setupProc.on('error', function (err) {
      console.error('[setup-engine error]', err);
      updateProgress(0, 'Auto-Setup Failed', err.message);
      resetSetupButton();
    });

    setupProc.on('close', function (code) {
      resetSetupButton();
      if (code === 0 || outputLogs.indexOf('SUCCESS') !== -1 || outputLogs.indexOf('SUKSES') !== -1) {
        updateProgress(100, 'Installation Successful! 🎉', 'AI Audio Engine is ready to use in After Effects.');
        setEngineStatus(true, 'audio-separator (MDX & RoFormer active)');
        alert('🎉 AI Audio Engine Installed Successfully!\n\nYou can now select an audio/video layer and click "Separate Audio & Import".');
      } else {
        updateProgress(0, 'Installation Requires Attention', outputLogs);
        alert('Installation did not complete automatically.\n\nDetails: ' + outputLogs.substring(0, 300));
      }
    });
  }

  function resetSetupButton() {
    isInstallingEngine = false;
    if (elBtnEngineSetup) {
      elBtnEngineSetup.disabled = false;
      var btnText = document.getElementById('btn-engine-setup-text');
      if (btnText) btnText.textContent = '🚀 1-Click Engine Auto-Setup';
    }
  }

  /**
   * Ask ExtendScript for current active layer in AE.
   */
  function detectActiveLayer(callback) {
    if (typeof window.runJSX !== 'function') return;

    window.runJSX('kaycee_getSelectedAudioLayer()', function (rawResult) {
      try {
        var res = JSON.parse(rawResult);
        if (res.ok) {
          currentSelectedLayer = res;
          if (elLayerName) elLayerName.textContent = res.name;
          if (elLayerPath) {
            elLayerPath.textContent = res.filePath;
            elLayerPath.title = res.filePath;
          }
          if (elBtnSeparate) elBtnSeparate.disabled = false;
        } else {
          currentSelectedLayer = null;
          if (elLayerName) elLayerName.textContent = 'No media layer selected';
          if (elLayerPath) {
            elLayerPath.textContent = res.error || 'Select audio/video layer in AE';
            elLayerPath.title = '';
          }
        }
        if (typeof callback === 'function') callback(res);
      } catch (err) {
        console.error('[Kaycee Audio] Parse error:', err);
      }
    });
  }

  var currentProgressVal = 0;

  /**
   * Update Progress bar & UI Status (strictly monotonic - never goes backwards!)
   */
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

  /**
   * Run the separation process via local Python / audio-separator
   */
  function startAudioSeparation() {
    if (isProcessing) return;

    function proceed() {
      // Auto-detect currently selected layer in After Effects
      detectActiveLayer(function (layerRes) {
        if (!layerRes || !layerRes.ok) {
          alert(layerRes && layerRes.error ? layerRes.error : 'Please select an audio or video layer in After Effects first.');
          return;
        }

        var sourceFile = layerRes.filePath;
        if (!sourceFile) {
          alert('Audio/video file not found for the selected layer.');
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
        if (elBtnSeparate) {
          elBtnSeparate.disabled = true;
          elBtnSeparate.classList.add('processing');
          var btnText = document.getElementById('btn-audio-separate-text');
          if (btnText) btnText.textContent = 'Separating Audio...';
        }

        var isQuality = (selectedModel === 'quality' || selectedModel === 'roformer');
        var qualityLabel = isQuality ? 'Studio Quality' : 'Fast Quality';

        var modelArg = isQuality
          ? 'model_bs_roformer_ep_317_sdr_12.9755.ckpt'
          : 'UVR-MDX-NET-Voc_FT.onnx';

        currentProgressVal = 0;
        updateProgress(10, 'Initializing...');

        var outDir = path.join(os.tmpdir(), 'kaycee_stems_' + Date.now());
        try {
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }
        } catch (e) {
          console.error('[Kaycee Audio] Error creating outDir:', e);
        }

        updateProgress(20, 'Separating (' + qualityLabel + ')...');

        var cmdArgs = [
          '-m', modelArg,
          '--output_dir', outDir,
          '--output_format', 'WAV',
          sourceFile
        ];

        var sepExe = getAudioSeparatorExecutable();
        var proc = child_process.spawn(sepExe, cmdArgs, {
          windowsHide: true,
          shell: true
        });

        var logAccumulator = '';
        var phase1Done = false;

        proc.stdout.on('data', function (data) {
          var str = data.toString();
          logAccumulator += str;
          console.log('[audio-separator]', str);

          if (str.indexOf('%') !== -1) {
            var match = str.match(/(\d+)%/);
            if (match) {
              var p = parseInt(match[1], 10);
              if (!phase1Done) {
                // Phase 1 (inference): 20% -> 70%
                updateProgress(20 + (p * 0.5), 'Separating (' + qualityLabel + ') ' + p + '%');
                if (p >= 98) phase1Done = true;
              } else {
                // Phase 2 (post-processing/writing): 70% -> 90%
                updateProgress(70 + (p * 0.2), 'Generating stems ' + p + '%');
              }
            }
          } else if (str.indexOf('Saving') !== -1 || str.indexOf('Writing') !== -1) {
            updateProgress(90, 'Writing audio stems...');
          }
        });

        proc.stderr.on('data', function (data) {
          var str = data.toString();
          console.warn('[audio-separator stderr]', str);
          if (str.indexOf('%') !== -1) {
            var match = str.match(/(\d+)%/);
            if (match) {
              var p = parseInt(match[1], 10);
              if (!phase1Done) {
                updateProgress(20 + (p * 0.5), 'Separating (' + qualityLabel + ') ' + p + '%');
                if (p >= 98) phase1Done = true;
              } else {
                updateProgress(70 + (p * 0.2), 'Generating stems ' + p + '%');
              }
            }
          } else if (str.indexOf('Saving') !== -1 || str.indexOf('Writing') !== -1) {
            updateProgress(90, 'Writing audio stems...');
          }
        });

        proc.on('error', function (err) {
          console.error('[audio-separator spawn error]', err);
          tryPythonFallback(sourceFile, modelArg, outDir, layerRes);
        });

        proc.on('close', function (code) {
          if (code === 0) {
            handleSeparationSuccess(outDir, sourceFile, layerRes);
          } else {
            tryPythonFallback(sourceFile, modelArg, outDir, layerRes);
          }
        });
      });
    }

    if (!engineInstalled) {
      checkEngineStatus(function (ready) {
        if (!ready) {
          var confirmSetup = confirm(
            'AI Audio Engine is not installed on your system.\n\n' +
            'Would you like to install it automatically now (1-Click setup without opening CMD)?'
          );
          if (confirmSetup) {
            run1ClickSetup();
          }
          return;
        }
        proceed();
      });
      return;
    }

    proceed();
  }

  function tryPythonFallback(sourceFile, modelArg, outDir, layerRes) {
    updateProgress(25, 'Running via Python engine...');

    var pyArgs = [
      '-m', 'audio_separator.utils.cli',
      '-m', modelArg,
      '--output_dir', outDir,
      '--output_format', 'WAV',
      sourceFile
    ];

    var pyExe = getPythonExecutable();
    var pyProc = child_process.spawn(pyExe, pyArgs, {
      windowsHide: true,
      shell: true
    });

    var pyLog = '';
    var pyPhase1Done = false;

    pyProc.stdout.on('data', function (data) {
      pyLog += data.toString();
      var str = data.toString();
      if (str.indexOf('%') !== -1) {
        var match = str.match(/(\d+)%/);
        if (match) {
          var p = parseInt(match[1], 10);
          if (!pyPhase1Done) {
            updateProgress(25 + (p * 0.45), 'Separating audio ' + p + '%');
            if (p >= 98) pyPhase1Done = true;
          } else {
            updateProgress(70 + (p * 0.2), 'Writing stems ' + p + '%');
          }
        }
      } else if (str.indexOf('Saving') !== -1) {
        updateProgress(90, 'Writing audio stems...');
      }
    });

    pyProc.stderr.on('data', function (data) {
      var str = data.toString();
      if (str.indexOf('%') !== -1) {
        var match = str.match(/(\d+)%/);
        if (match) {
          var p = parseInt(match[1], 10);
          if (!pyPhase1Done) {
            updateProgress(25 + (p * 0.45), 'Separating audio ' + p + '%');
            if (p >= 98) pyPhase1Done = true;
          } else {
            updateProgress(70 + (p * 0.2), 'Writing stems ' + p + '%');
          }
        }
      }
    });

    pyProc.on('error', function (err) {
      handleSeparationFailure('Engine not ready: ' + err.message);
    });

    pyProc.on('close', function (code) {
      if (code === 0) {
        handleSeparationSuccess(outDir, sourceFile, layerRes);
      } else {
        handleSeparationFailure('Separation failed (Exit code ' + code + '):\n' + pyLog);
      }
    });
  }

  function reloadMainJSX(callback) {
    try {
      var currentDir = window.location.pathname;
      if (process.platform === 'win32' && currentDir.startsWith('/')) {
        currentDir = currentDir.substring(1);
      }
      var panelRoot = path.dirname(decodeURIComponent(currentDir));
      var jsxPath = path.join(panelRoot, 'jsx', 'main.jsx').replace(/\\/g, '/');
      var evalCode = 'try { $.evalFile(new File(' + JSON.stringify(jsxPath) + ')); "ok"; } catch(e) { e.toString(); }';
      window.runJSX(evalCode, function (res) {
        if (typeof callback === 'function') callback();
      });
    } catch (e) {
      if (typeof callback === 'function') callback();
    }
  }

  function handleSeparationSuccess(outDir, sourceFile, layerRes) {
    updateProgress(95, 'Importing to After Effects...');

    if (!fs || !fs.existsSync(outDir)) {
      handleSeparationFailure('Output folder not found: ' + outDir);
      return;
    }

    var files = fs.readdirSync(outDir);
    var vocalsFile = null;
    var instFile = null;

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var fLower = f.toLowerCase();
      var fullPath = path.join(outDir, f);

      if (fLower.indexOf('vocal') !== -1 && fLower.endsWith('.wav')) {
        vocalsFile = fullPath;
      } else if ((fLower.indexOf('instrumental') !== -1 || fLower.indexOf('music') !== -1 || fLower.indexOf('no_vocals') !== -1) && fLower.endsWith('.wav')) {
        instFile = fullPath;
      }
    }

    var chkMute = document.getElementById('chk-audio-mute-original');
    var chkVoc = document.getElementById('chk-audio-import-vocals');
    var chkInst = document.getElementById('chk-audio-import-inst');

    var muteOriginal = chkMute ? chkMute.checked : true;
    var wantVocals = chkVoc ? chkVoc.checked : true;
    var wantInst = chkInst ? chkInst.checked : true;

    var importVocals = wantVocals && vocalsFile;
    var importInst = wantInst && instFile;

    if (!importVocals && !importInst) {
      handleSeparationFailure('No separated stems found in folder: ' + outDir + '\nFiles: ' + files.join(', '));
      return;
    }

    var vPath = importVocals ? vocalsFile.replace(/\\/g, '/') : '';
    var iPath = importInst ? instFile.replace(/\\/g, '/') : '';
    var layerIndex = layerRes.index || 1;

    var isQuality = (selectedModel === 'quality' || selectedModel === 'roformer');
    var qualityLabel = isQuality ? 'Studio Quality' : 'Fast Quality';

    var jsxCall = 'kaycee_importAndAddStems(' +
      JSON.stringify(vPath) + ', ' +
      JSON.stringify(iPath) + ', ' +
      layerIndex + ', ' +
      (muteOriginal ? 'true' : 'false') + ', ' +
      JSON.stringify(qualityLabel) + ')';

    reloadMainJSX(function () {
      window.runJSX(jsxCall, function (rawRes) {
        try {
          var res = JSON.parse(rawRes);
          if (res && res.ok) {
            updateProgress(100, 'Successfully Imported! 🎉');
          } else {
            handleSeparationFailure('Failed to import to timeline: ' + (res ? res.error : rawRes));
          }
        } catch (e) {
          handleSeparationFailure('Response error from AE: ' + rawRes);
        }
        resetProcessingState();
      });
    });
  }

  function handleSeparationFailure(errorMsg) {
    currentProgressVal = 0;
    if (elProgressBar) elProgressBar.style.width = '0%';
    if (elStatusPercent) elStatusPercent.textContent = '0%';
    if (elStatusText) elStatusText.textContent = 'Failed';
    alert('Audio separation failed:\n' + errorMsg);
    resetProcessingState();
  }

  function resetProcessingState() {
    isProcessing = false;
    if (elBtnSeparate) {
      elBtnSeparate.disabled = false;
      elBtnSeparate.classList.remove('processing');
      var btnText = document.getElementById('btn-audio-separate-text');
      if (btnText) btnText.textContent = 'Separate Audio & Import';
    }
  }

  // Export to window
  window.KayceeAudioSeparator = {
    init: initAudioSeparator,
    detect: detectActiveLayer,
    checkEngine: checkEngineStatus,
    autoSetup: run1ClickSetup
  };

})(window);
