// ============================================================
// Kaycee CEP — main.jsx  (ExtendScript host-side)
// All functions are exposed as globals callable via evalScript.
// Every function returns a JSON string: {ok:true} or {ok:false,error:"..."}
// ============================================================

// ── Internal helpers ─────────────────────────────────────────

function kaycee_getComp() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        return null;
    }
    return comp;
}

function _ok() {
    return JSON.stringify({ ok: true });
}

function _err(msg) {
    return JSON.stringify({ ok: false, error: String(msg) });
}

// ── Pre-Comp ─────────────────────────────────────────────────
// shift = false → pre-comp each selected layer individually (one by one)
// shift = true  → pre-comp ALL selected layers together into one precomp
// customPrefix  → optional custom name prefix (e.g. "clip" → "clip 1", "clip 2"...)
function kaycee_preComp(shift, customPrefix) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) return _err("No layers selected.");

        app.beginUndoGroup("Pre-Comp");

        if (shift) {
            // ── Shift: semua layer jadi satu precomp ──────────────
            var spanIn   = layers[0].inPoint;
            var spanOut  = layers[0].outPoint;
            var topIndex = layers[0].index;
            var ids = [];
            for (var i = 0; i < layers.length; i++) {
                ids.push(layers[i].index);
                if (layers[i].inPoint  < spanIn)   spanIn   = layers[i].inPoint;
                if (layers[i].outPoint > spanOut)   spanOut  = layers[i].outPoint;
                if (layers[i].index    < topIndex)  topIndex = layers[i].index;
            }

            var pcNames = _getUniquePcNames(1, customPrefix, false);
            var pcName = pcNames[0];
            comp.layers.precompose(ids, pcName, true);
            _fixPcLayer(comp, pcName, spanIn, spanOut, topIndex);

        } else {
            // ── No shift: tiap layer diprecomp sendiri-sendiri ────
            // Urutkan layer berdasarkan urutan index aslinya dari atas ke bawah (index terkecil ke terbesar)
            // agar penamaan (1, 2, 3... atau clip 1, clip 2...) konsisten dari layer atas ke bawah.
            var sortedAsc = [];
            for (var s = 0; s < layers.length; s++) sortedAsc.push(layers[s]);
            sortedAsc.sort(function(a, b) { return a.index - b.index; });

            // Alokasikan deretan nama unik untuk setiap layer
            var names = _getUniquePcNames(sortedAsc.length, customPrefix, true);

            var pairs = [];
            for (var k = 0; k < sortedAsc.length; k++) {
                pairs.push({
                    layer: sortedAsc[k],
                    name: names[k]
                });
            }

            // Eksekusi precompose dari index terbesar ke terkecil agar index layer
            // di atasnya tidak tergeser saat proses berjalan.
            pairs.sort(function(a, b) { return b.layer.index - a.layer.index; });

            for (var p = 0; p < pairs.length; p++) {
                var lyr      = pairs[p].layer;
                var spanIn   = lyr.inPoint;
                var spanOut  = lyr.outPoint;
                var topIndex = lyr.index;
                var pcName   = pairs[p].name;
                comp.layers.precompose([lyr.index], pcName, true);
                _fixPcLayer(comp, pcName, spanIn, spanOut, topIndex);
            }
        }

        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Pre-Comp failed: " + e.toString());
    }
}

// Alokasikan deretan nama precomp unik yang belum dipakai di project
function _getUniquePcNames(count, customPrefix, isSingle) {
    var prefix = "";
    if (customPrefix !== undefined && customPrefix !== null) {
        prefix = String(customPrefix).replace(/^\s+/, "").replace(/\s+$/, "");
    }

    var baseName;
    if (prefix.length > 0) {
        var lastChar = prefix.charAt(prefix.length - 1);
        if (lastChar !== ' ' && lastChar !== '_' && lastChar !== '-') {
            baseName = prefix + " ";
        } else {
            baseName = prefix;
        }
    } else {
        baseName = isSingle ? "" : "Pre-Comp ";
    }

    // Kumpulkan seluruh nama item yang ada di project agar lookup O(1)
    var existingNames = {};
    for (var p = 1; p <= app.project.numItems; p++) {
        existingNames[app.project.item(p).name] = true;
    }

    var names = [];
    var num = 1;
    while (names.length < count) {
        var candidate = baseName + num;
        if (!existingNames[candidate]) {
            existingNames[candidate] = true;
            names.push(candidate);
        }
        num++;
    }
    return names;
}

// Cari nama precomp yang belum dipakai di project (backward compatibility)
function _uniquePcName(layerCount, customPrefix) {
    var names = _getUniquePcNames(1, customPrefix, layerCount === 1);
    return names[0];
}

// Fix timing dan posisi stack setelah precompose
function _fixPcLayer(comp, pcName, spanIn, spanOut, topIndex) {
    var pcLayer = null;
    for (var n = 1; n <= comp.numLayers; n++) {
        if (comp.layer(n).name === pcName) { pcLayer = comp.layer(n); break; }
    }
    if (!pcLayer) return;

    // Sesuaikan durasi inner comp agar tidak lebih panjang dari span layer asli
    try { pcLayer.source.duration = spanOut - spanIn; } catch(ex) {}

    // Geser semua layer di dalam inner comp agar mulai dari t=0
    // (offset = spanIn, yaitu posisi start layer precomp di timeline luar)
    try {
        var innerComp = pcLayer.source;
        for (var j = 1; j <= innerComp.numLayers; j++) {
            innerComp.layer(j).startTime -= spanIn;
        }
    } catch(ex) {}

    // Sesuaikan startTime precomp di timeline luar
    pcLayer.startTime = spanIn;

    // Kembalikan posisi precomp ke posisi stack aslinya di timeline luar
    if (pcLayer.index !== topIndex) {
        try {
            var targetLayer = comp.layer(topIndex);
            if (targetLayer) pcLayer.moveBefore(targetLayer);
        } catch(ex) {}
    }
}

// ── Motion Tile / Twixtor Pro ─────────────────────────────────
// shift = false → add Twixtor Pro
// shift = true  → add Motion Tile
function kaycee_motionTile(shift) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) return _err("No layers selected.");

        app.beginUndoGroup(shift ? "Motion Tile" : "Twixtor Pro");

        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];

            if (shift) {
                // Motion Tile
                // Hitung Tile Center dari tengah layer source (bukan comp)
                // agar layer tidak bergeser saat Output Width/Height diperbesar
                var srcW = (layer.source && layer.source.width)  ? layer.source.width  : comp.width;
                var srcH = (layer.source && layer.source.height) ? layer.source.height : comp.height;
                var tileX = srcW / 2;
                var tileY = srcH / 2;

                var mt = layer.Effects.addProperty("Motion Tile");
                mt.property("Tile Center").setValue([tileX, tileY]);
                mt.property("Tile Width").setValue(100);
                mt.property("Tile Height").setValue(100);
                mt.property("Output Width").setValue(200);
                mt.property("Output Height").setValue(200);
                mt.property("Mirror Edges").setValue(true);
                mt.property("Phase").setValue(0);
                mt.property("Horizontal Phase Shift").setValue(false);
            } else {
                // Twixtor Pro
                var tw = layer.Effects.addProperty("Twixtor Pro");
                if (tw) {
                    function twSet(groupName, propName, val) {
                        try {
                            var g = tw.property(groupName);
                            if (g) { g.property(propName).setValue(val); return; }
                        } catch(ex) {}
                        try { tw.property(propName).setValue(val); } catch(ex2) {}
                    }

                    try { tw.property("Display").setValue(0); } catch(ex) {}
                    try { tw.property("Use GPU").setValue(0); } catch(ex) {}

                    twSet("Source Control", "Input: Fields",     0);
                    twSet("Source Control", "In FPS is Out FPS", false);
                    twSet("Source Control", "Input: Frame Rate", 60);

                    twSet("Track Control", "Motion Vectors", 3); // Best
                    twSet("Track Control", "Image Prep",     1);
                    twSet("Track Control", "Track RGB+A",    false);
                    try {
                        var pm = tw.property("Track Control").property("Plenty Memory?");
                        if (pm) pm.property("Cache Last Motion?").setValue(true);
                    } catch(ex) {
                        twSet("Track Control", "Cache Last Motion?", true);
                    }

                    twSet("Output Control", "Time Remap Mode",        0);
                    twSet("Output Control", "Speed %",                100);
                    twSet("Output Control", "Frame Interp",           2);
                    twSet("Output Control", "Warping",                3);
                    twSet("Output Control", "Motion Blur Compensati", 0);
                } else {
                    app.endUndoGroup();
                    return _err("Twixtor Pro not found. Make sure the plugin is installed.");
                }
            }
        }

        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("M/T failed: " + e.toString());
    }
}

// ── Add Null / Adjustment Layer ───────────────────────────────
// shift = false → add Null, parent selected layers to it
// shift = true  → add Adjustment Layer (lavender, duration matches selection)
function kaycee_addNull(shift) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        app.beginUndoGroup(shift ? "Add Adjustment" : "Add Null");

        var sel    = comp.selectedLayers;
        var hasSel = sel && sel.length > 0;

        // Hitung span dari semua layer yang dipilih
        var spanIn  = hasSel ? Math.min(sel[0].inPoint, sel[0].outPoint) : 0;
        var spanOut = hasSel ? Math.max(sel[0].inPoint, sel[0].outPoint) : comp.duration;
        var topSel  = hasSel ? sel[0] : null;
        for (var i = 1; i < sel.length; i++) {
            var sIn  = Math.min(sel[i].inPoint, sel[i].outPoint);
            var sOut = Math.max(sel[i].inPoint, sel[i].outPoint);
            if (sIn  < spanIn)  spanIn  = sIn;
            if (sOut > spanOut) spanOut = sOut;
            if (sel[i].index < topSel.index) topSel = sel[i];
        }
        var layerDur = spanOut - spanIn;
        var layerIn  = spanIn;
        if (layerDur <= 0) layerDur = comp.duration;

        if (shift) {
            // Adjustment layer
            // Cari nomor unik dulu sebelum solid dibuat
            var adjNum = 1;
            while (true) {
                var adjCandidate = "Adjustment Layer " + adjNum;
                var adjTaken = false;
                for (var p = 1; p <= app.project.numItems; p++) {
                    if (app.project.item(p).name === adjCandidate) { adjTaken = true; break; }
                }
                if (!adjTaken) break;
                adjNum++;
            }
            var adjName = "Adjustment Layer " + adjNum;

            // Gunakan comp.layers.addSolid() dengan warna lavender AE native.
            var adj = comp.layers.addSolid(
                [0.5254901960784314, 0.5254901960784314, 0.7372549019607844],
                adjName,
                comp.width,
                comp.height,
                comp.pixelAspect,
                layerDur
            );
            adj.name = adjName;
            adj.adjustmentLayer = true;
            adj.startTime = layerIn;
            // Set label color ke Lavender (label 8) — sama seperti AE native adjustment layer
            try { adj.label = 5; } catch(ex) {}

            // Move directly above the topmost selected layer
            if (hasSel) {
                adj.moveBefore(topSel);
            }
        } else {
            // Null layer — satu null per layer yang dipilih
            // Proses dari index terbesar ke terkecil agar index tidak bergeser
            var sortedSel = [];
            for (var s = 0; s < sel.length; s++) sortedSel.push(sel[s]);
            sortedSel.sort(function(a, b) { return b.index - a.index; });

            for (var s = 0; s < sortedSel.length; s++) {
                var lyr     = sortedSel[s];
                var lyrDur  = Math.abs(lyr.outPoint - lyr.inPoint);
                var lyrIn   = Math.min(lyr.inPoint, lyr.outPoint);
                if (lyrDur <= 0) lyrDur = comp.duration;

                var nullLayer = comp.layers.addNull(lyrDur);
                nullLayer.startTime = lyrIn;
                nullLayer.transform.position.setValue([comp.width / 2, comp.height / 2]);
                nullLayer.moveBefore(lyr);
                lyr.parent = nullLayer;
            }
        }

        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("NULL/ADJ failed: " + e.toString());
    }
}

// ── Add Adjustment Layer (standalone alias) ───────────────────
function kaycee_addAdjustment() {
    return kaycee_addNull(true);
}

// ── Add Solid / Camera ────────────────────────────────────────
// shift = false → add red Solid, duration matches selection
// shift = true  → add Camera, in/out matches selection
function kaycee_addSolid(shift) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        app.beginUndoGroup(shift ? "Add Camera" : "Add Solid");

        var sel    = comp.selectedLayers;
        var hasSel = sel && sel.length > 0;

        // Hitung span dari semua layer yang dipilih
        var spanIn  = hasSel ? Math.min(sel[0].inPoint, sel[0].outPoint) : 0;
        var spanOut = hasSel ? Math.max(sel[0].inPoint, sel[0].outPoint) : comp.duration;
        var topSel  = hasSel ? sel[0] : null;
        for (var i = 1; i < sel.length; i++) {
            var sIn  = Math.min(sel[i].inPoint, sel[i].outPoint);
            var sOut = Math.max(sel[i].inPoint, sel[i].outPoint);
            if (sIn  < spanIn)  spanIn  = sIn;
            if (sOut > spanOut) spanOut = sOut;
            if (sel[i].index < topSel.index) topSel = sel[i];
        }
        var layerDur = spanOut - spanIn;
        var layerIn  = spanIn;
        if (layerDur <= 0) layerDur = comp.duration;

        if (shift) {
            // Camera
            var cam = comp.layers.addCamera("Camera 1", [comp.width / 2, comp.height / 2]);
            if (hasSel) {
                cam.inPoint  = spanIn;
                cam.outPoint = spanOut;
                cam.moveBefore(topSel);
            }
        } else {
            // White solid + Tint effect (default white)
            // Cari nama unik "Solid 1", "Solid 2", dst.
            var solidNum = 1;
            while (true) {
                var solidCandidate = "Solid " + solidNum;
                var solidTaken = false;
                for (var p = 1; p <= app.project.numItems; p++) {
                    if (app.project.item(p).name === solidCandidate) { solidTaken = true; break; }
                }
                if (!solidTaken) break;
                solidNum++;
            }
            var solidName = "Solid " + solidNum;

            var solid = comp.layers.addSolid(
                [1, 1, 1],
                solidName,
                comp.width,
                comp.height,
                comp.pixelAspect,
                layerDur
            );
            solid.name = solidName;
            solid.startTime = layerIn;
            // Add Tint effect — map black to black, white to white (default)
            try {
                var tint = solid.Effects.addProperty("Tint");
                tint.property("Map Black To").setValue([0, 0, 0]);
                tint.property("Map White To").setValue([1, 1, 1]);
                tint.property("Amount to Tint").setValue(100);
            } catch(ex) {}
            // Move directly above the topmost selected layer
            if (hasSel) {
                solid.moveBefore(topSel);
            } else {
                solid.moveToEnd();
            }
        }

        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("SLD/CMRA failed: " + e.toString());
    }
}

// ── Add Camera (standalone alias) ────────────────────────────
function kaycee_addCamera() {
    return kaycee_addSolid(true);
}

// ── Set Opacity ───────────────────────────────────────────────
function kaycee_setOpacity(val) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) return _err("No layers selected.");

        var opVal = parseFloat(val);
        if (isNaN(opVal)) opVal = 100;
        opVal = Math.max(0, Math.min(100, opVal));

        var currentTime = comp.time;

        app.beginUndoGroup("Keyframe Opacity");
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (layer.locked) layer.locked = false;
            try {
                var opProp = layer.transform.opacity;
                // setValueAtTime activates the stopwatch and creates a keyframe
                opProp.setValueAtTime(currentTime, opVal);
                // Select the opacity property so it's visible in timeline
                layer.selected = true;
                layer.property("Transform").property("Opacity").selected = true;
            } catch (ex) {
                // Camera / light layers don't have opacity — skip silently
            }
        }
        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Opacity keyframe failed: " + e.toString());
    }
}

// ── Fit to Comp ───────────────────────────────────────────────
// shift = false → fill horizontally (scale by width ratio, keep aspect ratio)
// shift = true  → fill vertically   (scale by height ratio, keep aspect ratio)
function kaycee_fitToComp(shift) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) return _err("No layers selected.");

        app.beginUndoGroup(shift ? "Fit to Comp (Vertical)" : "Fit to Comp (Horizontal)");
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            if (!layer.source) continue;

            var srcW = layer.source.width;
            var srcH = layer.source.height;
            if (!srcW || !srcH) continue;

            var scale;
            if (shift) {
                // Fill vertically — scale so layer height matches comp height
                scale = (comp.height / srcH) * 100;
            } else {
                // Fill horizontally — scale so layer width matches comp width
                scale = (comp.width / srcW) * 100;
            }

            layer.transform.scale.setValue([scale, scale]);
            layer.transform.position.setValue([comp.width / 2, comp.height / 2]);
        }
        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Fit to Comp failed: " + e.toString());
    }
}

// ── D-Pad Position ────────────────────────────────────────────
// px, py are 0.0–1.0 fractions of comp width/height
function kaycee_dpad(px, py) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) return _err("No layers selected.");

        app.beginUndoGroup("D-Pad Position");
        for (var i = 0; i < layers.length; i++) {
            layers[i].transform.position.setValue([
                comp.width  * parseFloat(px),
                comp.height * parseFloat(py)
            ]);
        }
        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("D-Pad failed: " + e.toString());
    }
}

// ── Trim to Last Time Remap Keyframe ─────────────────────────
// Untuk setiap layer yang dipilih dan punya Time Remap aktif,
// trim outPoint ke waktu keyframe Time Remap terakhir,
// lalu hapus semua keyframe setelah titik itu (bila ada).
function kaycee_trimToLastRemap() {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) return _err("No layers selected.");

        app.beginUndoGroup("Trim to Last Remap");

        var trimmed = 0;
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];

            // Cari property Time Remap
            var remap = null;
            try { remap = layer.timeRemapEnabled ? layer.property("Time Remap") : null; } catch(ex) {}
            if (!remap || !remap.numKeys || remap.numKeys < 2) continue;

            // Cari keyframe terakhir
            var lastKeyTime = remap.keyTime(remap.numKeys);

            // Hapus semua keyframe setelah keyframe terakhir (jaga-jaga kalau ada)
            // Lakukan dari index tertinggi ke bawah
            for (var k = remap.numKeys; k >= 1; k--) {
                if (remap.keyTime(k) > lastKeyTime) {
                    remap.removeKey(k);
                }
            }

            // Trim outPoint layer ke waktu keyframe terakhir
            layer.outPoint = lastKeyTime;
            trimmed++;
        }

        app.endUndoGroup();

        if (trimmed === 0) {
            return _err("No selected layers have Time Remap enabled.");
        }
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Trim Remap failed: " + e.toString());
    }
}

// ── Delete Layers ─────────────────────────────────────────────
function kaycee_deleteLayers() {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) return _err("No layers selected.");

        app.beginUndoGroup("Delete Layers");
        // Remove in reverse order to preserve indices
        for (var i = layers.length - 1; i >= 0; i--) {
            layers[i].remove();
        }
        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Delete Layers failed: " + e.toString());
    }
}

// ── Lock / Unlock Layers ──────────────────────────────────────
function kaycee_lockLayers() {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) return _err("No layers selected.");

        app.beginUndoGroup("Lock Layers");
        for (var i = 0; i < layers.length; i++) {
            layers[i].locked = !layers[i].locked;
        }
        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Lock Layers failed: " + e.toString());
    }
}

// ── Get Composition Size ──────────────────────────────────────
function kaycee_getCompSize() {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");
        return JSON.stringify({ ok: true, width: comp.width, height: comp.height, name: comp.name });
    } catch (e) {
        return _err("Get Comp Size failed: " + e.toString());
    }
}

// ── Set Composition Size ──────────────────────────────────────
function kaycee_setCompSize(width, height) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        width = parseInt(width, 10);
        height = parseInt(height, 10);
        if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
            return _err("Invalid dimensions: " + width + "x" + height);
        }

        app.beginUndoGroup("Resize Comp to " + width + "x" + height);
        comp.width = width;
        comp.height = height;
        app.endUndoGroup();

        return JSON.stringify({ ok: true, width: comp.width, height: comp.height });
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Resize Comp failed: " + e.toString());
    }
}

// ── Get Composition FPS ───────────────────────────────────────
function kaycee_getCompFps() {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");
        return JSON.stringify({ ok: true, frameRate: comp.frameRate, name: comp.name });
    } catch (e) {
        return _err("Get Comp FPS failed: " + e.toString());
    }
}

// ── Set Composition FPS ───────────────────────────────────────
function kaycee_setCompFps(fps) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition.");

        fps = parseFloat(fps);
        if (isNaN(fps) || fps <= 0) {
            return _err("Invalid FPS: " + fps);
        }

        app.beginUndoGroup("Change Comp FPS to " + fps);
        comp.frameRate = fps;
        app.endUndoGroup();

        return JSON.stringify({ ok: true, frameRate: comp.frameRate });
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Change Comp FPS failed: " + e.toString());
    }
}

// ── Audio Separation Helpers ─────────────────────────────────

// Cari file media (audio atau image) di dalam Pre-Comp (termasuk precomp bersarang)
function _findMediaInComp(innerComp, mediaType, currentOffset) {
    if (!innerComp || !(innerComp instanceof CompItem)) return null;
    if (currentOffset === undefined || currentOffset === null) currentOffset = 0;

    for (var i = 1; i <= innerComp.numLayers; i++) {
        var l = innerComp.layer(i);
        if (!l) continue;

        // Cek jika layer ini memiliki source FootageItem dengan file di disk
        if (l.source && (l.source instanceof FootageItem) && l.source.file && l.source.file.exists) {
            var fPath = l.source.file.fsName;
            var fLower = fPath.toLowerCase();

            if (mediaType === "audio") {
                var hasAud = false;
                try { hasAud = l.hasAudio; } catch(ex) {}
                var isAudioExt = (
                    fLower.indexOf('.mp3') !== -1 || fLower.indexOf('.wav') !== -1 ||
                    fLower.indexOf('.aac') !== -1 || fLower.indexOf('.m4a') !== -1 ||
                    fLower.indexOf('.flac') !== -1 || fLower.indexOf('.aif') !== -1 ||
                    fLower.indexOf('.aiff') !== -1 || fLower.indexOf('.mp4') !== -1 ||
                    fLower.indexOf('.mov') !== -1 || fLower.indexOf('.avi') !== -1 ||
                    fLower.indexOf('.mkv') !== -1 || fLower.indexOf('.wmv') !== -1
                );
                if (hasAud || isAudioExt) {
                    return {
                        layer: l,
                        file: l.source.file,
                        filePath: fPath,
                        offset: currentOffset + l.startTime,
                        width: l.source.width,
                        height: l.source.height
                    };
                }
            } else if (mediaType === "image") {
                var isImageExt = (
                    fLower.indexOf('.png') !== -1 || fLower.indexOf('.jpg') !== -1 ||
                    fLower.indexOf('.jpeg') !== -1 || fLower.indexOf('.webp') !== -1 ||
                    fLower.indexOf('.psd') !== -1 || fLower.indexOf('.tif') !== -1 ||
                    fLower.indexOf('.tiff') !== -1 || fLower.indexOf('.bmp') !== -1
                );
                if (isImageExt) {
                    return {
                        layer: l,
                        file: l.source.file,
                        filePath: fPath,
                        offset: currentOffset + l.startTime,
                        width: l.source.width,
                        height: l.source.height
                    };
                }
            }
        } else if (l.source && (l.source instanceof CompItem)) {
            // Pre-comp bersarang (nested), telusuri ke dalam
            var nested = _findMediaInComp(l.source, mediaType, currentOffset + l.startTime);
            if (nested) return nested;
        }
    }
    return null;
}

// Render/export frame saat ini dari comp/layer ke file PNG sementara
function _exportCompCurrentFrame(comp, lyr) {
    try {
        var tempFolder = Folder.temp;
        var tempFile = new File(tempFolder.fsName + "/kaycee_frame_" + (new Date().getTime()) + ".png");
        if (lyr && lyr.source && (lyr.source instanceof CompItem) && typeof lyr.source.saveFrameToPng === "function") {
            var innerTime = comp.time - lyr.startTime;
            lyr.source.saveFrameToPng(innerTime, tempFile);
            if (tempFile.exists) return tempFile;
        } else if (comp && typeof comp.saveFrameToPng === "function") {
            comp.saveFrameToPng(comp.time, tempFile);
            if (tempFile.exists) return tempFile;
        }
    } catch(e) {}
    return null;
}

// Get currently selected layer's audio file info (supports normal layers & pre-comps)
function kaycee_getSelectedAudioLayer() {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition in After Effects.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) {
            return _err("Please select an audio or video layer in the timeline first.");
        }

        var lyr = layers[0];
        var file = null;
        var innerOffset = 0;

        if (lyr.source && lyr.source.file) {
            file = lyr.source.file;
        } else if (lyr.source && (lyr.source instanceof CompItem)) {
            // Layer adalah Pre-Comp: cari media audio/video di dalamnya
            var found = _findMediaInComp(lyr.source, "audio", 0);
            if (found) {
                file = found.file;
                innerOffset = found.offset;
            } else {
                return _err("Layer Pre-Comp '" + lyr.name + "' tidak berisi file audio/video di dalamnya.");
            }
        } else {
            return _err("Layer '" + lyr.name + "' is not a media file on disk (must be audio/video).");
        }

        var info = {
            ok: true,
            name: lyr.name,
            filePath: file.fsName,
            hasAudio: lyr.hasAudio,
            inPoint: lyr.inPoint,
            outPoint: lyr.outPoint,
            startTime: lyr.startTime,
            innerOffset: innerOffset,
            index: lyr.index,
            isPreComp: (lyr.source instanceof CompItem)
        };

        return JSON.stringify(info);
    } catch (e) {
        return _err("Failed to detect audio layer: " + e.toString());
    }
}

// Import isolated stem files back into AE and align in timeline
function kaycee_importAndAddStems(vocalsPath, instPath, targetLayerIndex, muteOriginal, qualityLabel, innerOffset) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition in After Effects.");

        app.beginUndoGroup("Kaycee Audio Separation Import");

        var targetLayer = null;
        if (targetLayerIndex && targetLayerIndex <= comp.numLayers) {
            targetLayer = comp.layer(targetLayerIndex);
        }

        var offset = (typeof innerOffset === "number") ? innerOffset : 0;
        var inPoint = targetLayer ? targetLayer.inPoint : 0;
        var outPoint = targetLayer ? targetLayer.outPoint : comp.duration;
        var startTime = targetLayer ? (targetLayer.startTime + offset) : 0;

        var qLabel = (qualityLabel && qualityLabel !== "") ? qualityLabel : "Fast Quality";
        var importedCount = 0;

        // Import Instrumental Stem (if path provided)
        if (instPath && instPath !== "") {
            var instFile = new File(instPath);
            if (!instFile.exists) {
                app.endUndoGroup();
                return _err("Music file not found on disk: " + instPath);
            }
            var instImport = new ImportOptions(instFile);
            var instItem = app.project.importFile(instImport);
            try { instItem.name = "Music " + qLabel; } catch(e) {}
            var instLayer = comp.layers.add(instItem);
            try { instLayer.name = "Music " + qLabel; } catch(e) {}
            instLayer.startTime = startTime;
            instLayer.inPoint = inPoint;
            instLayer.outPoint = outPoint;
            if (targetLayer) {
                try {
                    instLayer.moveBefore(targetLayer);
                } catch(e) {}
            }
            importedCount++;
        }

        // Import Vocals Stem (if path provided)
        if (vocalsPath && vocalsPath !== "") {
            var vocFile = new File(vocalsPath);
            if (!vocFile.exists) {
                app.endUndoGroup();
                return _err("Vocal file not found on disk: " + vocalsPath);
            }
            var vocImport = new ImportOptions(vocFile);
            var vocItem = app.project.importFile(vocImport);
            try { vocItem.name = "Vocal " + qLabel; } catch(e) {}
            var vocLayer = comp.layers.add(vocItem);
            try { vocLayer.name = "Vocal " + qLabel; } catch(e) {}
            vocLayer.startTime = startTime;
            vocLayer.inPoint = inPoint;
            vocLayer.outPoint = outPoint;
            if (targetLayer) {
                try {
                    vocLayer.moveBefore(targetLayer);
                } catch(e) {}
            }
            importedCount++;
        }

        if (importedCount === 0) {
            app.endUndoGroup();
            return _err("No audio stems were imported. Check if files exist.");
        }

        // Mute original layer's audio if requested
        if (muteOriginal && targetLayer && targetLayer.hasAudio) {
            try {
                targetLayer.audioEnabled = false;
            } catch(e) {}
        }

        app.endUndoGroup();
        return _ok();
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Failed to import audio stems into AE: " + e.toString());
    }
}

// ── AI Image Background Removal (Cutout) ──────────────────────

// Detect currently selected image layer in After Effects (supports normal layers & pre-comps)
function kaycee_getSelectedImageLayer() {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition in After Effects.");

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) {
            return _err("Please select an image layer in the timeline.");
        }

        var lyr = layers[0];
        var filePath = null;
        var width = 0;
        var height = 0;

        if (lyr.source && (lyr.source instanceof FootageItem) && lyr.source.file && lyr.source.file.exists) {
            var fPath = lyr.source.file.fsName;
            var fLower = fPath.toLowerCase();
            var isImage = (
                fLower.indexOf('.png') !== -1 ||
                fLower.indexOf('.jpg') !== -1 ||
                fLower.indexOf('.jpeg') !== -1 ||
                fLower.indexOf('.webp') !== -1 ||
                fLower.indexOf('.psd') !== -1 ||
                fLower.indexOf('.tif') !== -1 ||
                fLower.indexOf('.tiff') !== -1 ||
                fLower.indexOf('.bmp') !== -1
            );

            if (!isImage) {
                return _err("Selected layer '" + lyr.name + "' is not a supported image file (PNG, JPG, PSD, WebP, etc.).");
            }
            filePath = fPath;
            width = lyr.source.width;
            height = lyr.source.height;

        } else if (lyr.source && (lyr.source instanceof CompItem)) {
            // Pre-Comp layer:
            // 1. Cek apakah ada layer gambar di dalam precomp
            var found = _findMediaInComp(lyr.source, "image", 0);
            if (found) {
                filePath = found.filePath;
                width = found.width;
                height = found.height;
            } else {
                // 2. Render frame saat ini dari comp jika didukung
                var exportedFile = _exportCompCurrentFrame(comp, lyr);
                if (exportedFile) {
                    filePath = exportedFile.fsName;
                    width = comp.width;
                    height = comp.height;
                } else {
                    return _err("Layer Pre-Comp '" + lyr.name + "' tidak berisi file gambar (PNG, JPG, PSD, dll.) di dalamnya.");
                }
            }
        } else {
            return _err("Selected layer '" + lyr.name + "' is not an image footage layer (PNG, JPG, PSD, WebP, etc.).");
        }

        return JSON.stringify({
            ok: true,
            name: lyr.name,
            index: lyr.index,
            filePath: filePath,
            width: width,
            height: height,
            isPreComp: (lyr.source instanceof CompItem)
        });
    } catch (e) {
        return _err("Error detecting image layer: " + e.toString());
    }
}

// Import cutout PNG into project and position exactly over target layer
function kaycee_importAndAddCutout(pngPath, targetLayerIndex, hideOriginal, qualityLabel) {
    try {
        var comp = kaycee_getComp();
        if (!comp) return _err("No active composition in After Effects.");

        var targetLayer = null;
        if (targetLayerIndex && targetLayerIndex <= comp.numLayers) {
            targetLayer = comp.layer(targetLayerIndex);
        }

        var pngFile = new File(pngPath);
        if (!pngFile.exists) {
            return _err("Cutout image not found on disk: " + pngPath);
        }

        app.beginUndoGroup("Kaycee AI Background Removal");

        var qLabel = (qualityLabel && qualityLabel !== "") ? qualityLabel : "Cutout";
        var itemName = (targetLayer ? targetLayer.name : "Image") + " (" + qLabel + ")";

        var io = new ImportOptions(pngFile);
        var item = app.project.importFile(io);
        try { item.name = itemName; } catch(e) {}

        var newLayer = comp.layers.add(item);
        try { newLayer.name = itemName; } catch(e) {}

        if (targetLayer) {
            // Match timing
            newLayer.startTime = targetLayer.startTime;
            newLayer.inPoint = targetLayer.inPoint;
            newLayer.outPoint = targetLayer.outPoint;

            // Copy 2D / 3D transform properties
            try {
                if (targetLayer.threeDLayer) {
                    newLayer.threeDLayer = true;
                }
            } catch(e) {}

            try {
                if (targetLayer.transform.position.dimensionsSeparated) {
                    newLayer.transform.position.dimensionsSeparated = true;
                    newLayer.transform.xPosition.setValue(targetLayer.transform.xPosition.value);
                    newLayer.transform.yPosition.setValue(targetLayer.transform.yPosition.value);
                    if (targetLayer.threeDLayer) {
                        newLayer.transform.zPosition.setValue(targetLayer.transform.zPosition.value);
                    }
                } else {
                    newLayer.transform.position.setValue(targetLayer.transform.position.value);
                }
            } catch(e) {}

            try { newLayer.transform.scale.setValue(targetLayer.transform.scale.value); } catch(e) {}
            try { newLayer.transform.rotation.setValue(targetLayer.transform.rotation.value); } catch(e) {}
            try { newLayer.transform.opacity.setValue(targetLayer.transform.opacity.value); } catch(e) {}
            try { newLayer.transform.anchorPoint.setValue(targetLayer.transform.anchorPoint.value); } catch(e) {}

            // Place directly above original layer
            try {
                newLayer.moveBefore(targetLayer);
            } catch(e) {}

            // Hide original layer if requested
            if (hideOriginal) {
                try {
                    targetLayer.enabled = false;
                } catch(e) {}
            }
        }

        app.endUndoGroup();
        return JSON.stringify({ ok: true, name: newLayer.name, index: newLayer.index });
    } catch (e) {
        try { app.endUndoGroup(); } catch(ex) {}
        return _err("Failed to import cutout into AE: " + e.toString());
    }
}
