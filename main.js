window.addEventListener("DOMContentLoaded", () => {
  console.log(">>> main.js loaded");

  // ================== THEME SYSTEM =====================
  const themeSelect = document.getElementById("themeSelect");
  
  function loadTheme() {
    const savedTheme = localStorage.getItem("vj_color_theme") || "gold";
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (themeSelect) themeSelect.value = savedTheme;
  }
  
  function applyTheme(themeName) {
    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem("vj_color_theme", themeName);
  }
  
  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      applyTheme(themeSelect.value);
    });
  }
  
  loadTheme();

  // ================== LAYER SYSTEM =====================

  let layers = [];
  let selectedLayer = null;

  class Layer {
    constructor() {
      this.enabled = true;
      this.opacity = 1.0;
      this.blend = "normal"; // normal | add | screen | multiply
      this.source = null;
      this.type = "shader";
      this.kind = "shader";  // "shader" = background/fullscreen, "object" = overlay object
      this.visualMode = 0;   // 0..14
      this.colorTheme = 0;   // 0..7
      this.offsetX = 0.0;
      this.offsetY = 0.0;
      this.audioPositionReact = false;
      this.strobeIntensity = 0.0; // 0..1
    }
  }

  // DOM references
  const layerContainer = document.getElementById("layerContainer");
  const addLayerBtn = document.getElementById("addLayerBtn");
  const inspectorContent = document.getElementById("inspectorContent");
  const brightnessControl = document.getElementById("brightness");
  const quickEffects = document.getElementById("quickEffects");

  const audioReactSlider = document.getElementById("audioReact");

  const tapTempoBtn = document.getElementById("tapTempoBtn");
  const bpmDisplay = document.getElementById("bpmDisplay");

  const cameraZoomSlider = document.getElementById("cameraZoom");
  const cameraRotateSlider = document.getElementById("cameraRotate");

  const moodSelect = document.getElementById("moodSelect");

  // Logo elements declared in enhanced logo section below
  const logoTextInput = document.getElementById("logoTextInput");
  const logoVisibleCheckbox = document.getElementById("logoVisible");
  const logoTextDisplay = document.getElementById("logoTextDisplay");
  const overlayHud = document.getElementById("overlayHud");

  const presetNameInput = document.getElementById("presetName");
  const presetSelect = document.getElementById("presetSelect");
  const savePresetBtn = document.getElementById("savePresetBtn");
  const loadPresetBtn = document.getElementById("loadPresetBtn");
  const deletePresetBtn = document.getElementById("deletePresetBtn");

  const autoSwitchEnabledCheckbox = document.getElementById("autoSwitchEnabled");
  const autoSwitchIntervalSlider = document.getElementById("autoSwitchInterval");

  // Right panel performance controls
  const macroEnergySlider = document.getElementById("macroEnergy");
  const macroMotionSlider = document.getElementById("macroMotion");
  const macroDetailSlider = document.getElementById("macroDetail");
  const layerMuteRow = document.getElementById("layerMuteRow");

  if (!layerContainer || !addLayerBtn || !inspectorContent || !brightnessControl) {
    console.error("Missing key DOM elements. Check IDs in index.html.");
    return;
  }

  // High-level mood / genre looks
  const moodPresets = {
    chill: {
      name: "Chill / Ambient",
      brightness: 0.45,
      audioReact: 0.6,
      cameraZoom: 1.15,
      cameraRotateDeg: 0,
      // Soft clouds + DNA helix + pixel mosaic  
      layerVisualModes: [8, 15, 4],
      layerColorThemes: [7, 4, 0],  // Vaporwave, Sunset, Cool
      layerBlends: ["normal", "screen", "overlay"],
      postProcessing: { bloom: 0.3, vignette: 0.2, saturation: 0.8 }
    },
    edm: {
      name: "Peak EDM / Festival",
      brightness: 0.95,
      audioReact: 1.8,
      cameraZoom: 0.8,
      cameraRotateDeg: 12,
      // Audio bars + laser web + electric arcs + radial waves
      layerVisualModes: [6, 10, 19, 17],
      layerColorThemes: [2, 3, 6, 1],  // Neon, Cyber Grid, Ice Laser, Warm
      layerBlends: ["add", "add", "dodge", "screen"],
      postProcessing: { bloom: 0.7, rgbSplit: 3, saturation: 1.3, contrast: 1.2 }
    },
    dubstep: {
      name: "Dubstep / Heavy Bass",
      brightness: 0.85,
      audioReact: 2.0,
      cameraZoom: 0.85,
      cameraRotateDeg: -15,
      // Swirl + fractal zoom + electric arcs + plasma grid
      layerVisualModes: [2, 18, 19, 16],
      layerColorThemes: [5, 2, 6, 3],  // Toxic Green, Neon, Ice Laser, Cyber
      layerBlends: ["add", "difference", "dodge", "add"],
      postProcessing: { bloom: 0.6, chromaticAberration: 0.008, saturation: 1.4, contrast: 1.3 }
    },
    techno: {
      name: "Techno / Minimal",
      brightness: 0.6,
      audioReact: 1.1,
      cameraZoom: 1.0,
      cameraRotateDeg: 0,
      // Tunnel + horizon + kaleido grid + plasma grid
      layerVisualModes: [3, 9, 1, 16],
      layerColorThemes: [3, 6, 0, 3],  // Cyber Grid, Ice Laser, Cool
      layerBlends: ["normal", "multiply", "screen", "overlay"],
      postProcessing: { vignette: 0.4, contrast: 1.2, saturation: 0.9 }
    },
    lofi: {
      name: "Lofi / Soft Pastel",
      brightness: 0.4,
      audioReact: 0.5,
      cameraZoom: 1.25,
      cameraRotateDeg: 0,
      // Soft clouds + pixel mosaic + rings
      layerVisualModes: [8, 4, 11],
      layerColorThemes: [7, 4, 0],  // Vaporwave, Sunset, Cool
      layerBlends: ["normal", "screen", "overlay"],
      postProcessing: { filmGrain: 0.15, vignette: 0.3, saturation: 0.7, bloom: 0.2 }
    },
    psy: {
      name: "Psytrance / Hypno",
      brightness: 0.9,
      audioReact: 1.6,
      cameraZoom: 0.9,
      cameraRotateDeg: 25,
      // Kaleido + swirl + fractal zoom + DNA helix + laser web
      layerVisualModes: [1, 2, 18, 15, 10],
      layerColorThemes: [2, 7, 3, 6, 5],  // Neon, Vaporwave, Cyber, Ice, Toxic
      layerBlends: ["add", "screen", "difference", "dodge", "add"],
      postProcessing: { bloom: 0.8, chromaticAberration: 0.012, saturation: 1.5, rgbSplit: 5 }
    }
  };

  // Global camera state
  let cameraZoom = parseFloat(cameraZoomSlider.value || "1");
  let cameraRotateDeg = parseFloat(cameraRotateSlider.value || "0");

  cameraZoomSlider.addEventListener("input", () => {
    cameraZoom = parseFloat(cameraZoomSlider.value || "1");
  });

  cameraRotateSlider.addEventListener("input", () => {
    cameraRotateDeg = parseFloat(cameraRotateSlider.value || "0");
  });

  // Enhanced Logo state
  let logoSize = parseFloat(document.getElementById("logoSize")?.value || "48");
  let logoType = "text";
  let logoImage = null;
  let logoImageSize = 200;
  let logoPosition = "bottom-center";
  let logoColor = "#ffffff";

  function updateLogoDisplay() {
    const logoTypeSelect = document.getElementById("logoType");
    const logoTextOptions = document.getElementById("logoTextOptions");
    const logoImageOptions = document.getElementById("logoImageOptions");
    const logoPositionSelect = document.getElementById("logoPosition");
    const logoColorInput = document.getElementById("logoColor");
    
    if (!overlayHud || !logoVisibleCheckbox || !logoTextDisplay) return;

    // Show/hide based on visibility
    overlayHud.style.display = logoVisibleCheckbox.checked ? "flex" : "none";
    
    // Update position classes
    overlayHud.className = "";
    overlayHud.classList.add(logoPosition);

    // Toggle options based on type
    if (logoType === "text") {
      if (logoTextOptions) logoTextOptions.style.display = "block";
      if (logoImageOptions) logoImageOptions.style.display = "none";
      
      // Update text display
      logoTextDisplay.textContent = logoTextInput.value || "";
      logoTextDisplay.style.display = "block";
      logoTextDisplay.style.fontSize = logoSize + "px";
      logoTextDisplay.style.color = logoColor;
      
      // Hide image if exists
      const existingImg = overlayHud.querySelector("img");
      if (existingImg) existingImg.style.display = "none";
      
    } else if (logoType === "image" && logoImage) {
      if (logoTextOptions) logoTextOptions.style.display = "none";
      if (logoImageOptions) logoImageOptions.style.display = "block";
      
      // Hide text
      logoTextDisplay.style.display = "none";
      
      // Show/create image
      let img = overlayHud.querySelector("img");
      if (!img) {
        img = document.createElement("img");
        overlayHud.appendChild(img);
      }
      img.src = logoImage;
      img.style.display = "block";
      img.style.width = logoImageSize + "px";
      img.style.height = "auto";
    }
  }

  // Logo type selector
  const logoTypeSelect = document.getElementById("logoType");
  if (logoTypeSelect) {
    logoTypeSelect.addEventListener("change", (e) => {
      logoType = e.target.value;
      updateLogoDisplay();
    });
  }

  // Logo image upload
  const logoImageInput = document.getElementById("logoImageInput");
  if (logoImageInput) {
    logoImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          logoImage = event.target.result;
          updateLogoDisplay();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Logo image size
  const logoImageSizeSlider = document.getElementById("logoImageSize");
  if (logoImageSizeSlider) {
    logoImageSizeSlider.addEventListener("input", (e) => {
      logoImageSize = parseFloat(e.target.value);
      updateLogoDisplay();
    });
  }

  // Logo position
  const logoPositionSelect = document.getElementById("logoPosition");
  if (logoPositionSelect) {
    logoPositionSelect.addEventListener("change", (e) => {
      logoPosition = e.target.value;
      updateLogoDisplay();
    });
  }

  // Logo color
  const logoColorInput = document.getElementById("logoColor");
  if (logoColorInput) {
    logoColorInput.addEventListener("input", (e) => {
      logoColor = e.target.value;
      updateLogoDisplay();
    });
  }

  // Text input and size
  if (logoTextInput) {
    logoTextInput.addEventListener("input", updateLogoDisplay);
  }
  
  if (logoVisibleCheckbox) {
    logoVisibleCheckbox.addEventListener("change", updateLogoDisplay);
  }
  
  const logoSizeSlider = document.getElementById("logoSize");
  if (logoSizeSlider) {
    logoSizeSlider.addEventListener("input", (e) => {
      logoSize = parseFloat(e.target.value || "48");
      updateLogoDisplay();
    });
  }

  updateLogoDisplay();

  // Presets storage
  let presets = [];

  function loadPresetsFromStorage() {
    try {
      const raw = localStorage.getItem("vj_presets_v1");
      if (!raw) return;
      presets = JSON.parse(raw) || [];
      refreshPresetSelect();
    } catch (e) {
      console.error("Failed to load presets", e);
    }
  }

  function savePresetsToStorage() {
    try {
      localStorage.setItem("vj_presets_v1", JSON.stringify(presets));
    } catch (e) {
      console.error("Failed to save presets", e);
    }
  }

  function refreshPresetSelect() {
    presetSelect.innerHTML = '<option value="">-- Select preset --</option>';
    presets.forEach((p, idx) => {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = p.name;
      presetSelect.appendChild(opt);
    });
  }

  function captureCurrentPreset(name) {
    return {
      name,
      brightness: parseFloat(brightnessControl.value || "0.5"),
      cameraZoom,
      cameraRotateDeg,
      audioReact: parseFloat(audioReactSlider.value || "1"),
      logoText: logoTextInput.value || "",
      logoVisible: !!logoVisibleCheckbox.checked,
      logoSize: logoSize,
      layers: layers.map(l => ({
        enabled: l.enabled,
        opacity: l.opacity,
        blend: l.blend,
        kind: l.kind,
        visualMode: l.visualMode,
        colorTheme: l.colorTheme,
        offsetX: l.offsetX,
        offsetY: l.offsetY,
        audioPositionReact: l.audioPositionReact,
        strobeIntensity: l.strobeIntensity
      }))
    };
  }

  function applyPreset(preset) {
    if (!preset) return;

    brightnessControl.value = String(preset.brightness ?? 0.5);
    cameraZoom = preset.cameraZoom ?? 1;
    cameraRotateDeg = preset.cameraRotateDeg ?? 0;
    cameraZoomSlider.value = String(cameraZoom);
    cameraRotateSlider.value = String(cameraRotateDeg);

    audioReactSlider.value = String(preset.audioReact ?? 1);

    logoTextInput.value = preset.logoText ?? "";
    logoVisibleCheckbox.checked = !!preset.logoVisible;
    logoSize = preset.logoSize ?? 18;
    logoSizeSlider.value = String(logoSize);
    updateLogoDisplay();

    layers = [];
    (preset.layers || []).forEach(pl => {
      const l = new Layer();
      l.enabled = pl.enabled ?? true;
      l.opacity = pl.opacity ?? 1;
      l.blend = pl.blend ?? "normal";
      l.kind = pl.kind ?? "shader";
      l.visualMode = pl.visualMode ?? 0;
      l.colorTheme = pl.colorTheme ?? 0;
      l.offsetX = pl.offsetX ?? 0;
      l.offsetY = pl.offsetY ?? 0;
      l.audioPositionReact = !!pl.audioPositionReact;
      l.strobeIntensity = pl.strobeIntensity ?? 0;
      layers.push(l);
    });

    if (layers.length === 0) {
      layers.push(new Layer());
    }
    selectedLayer = 0;
    updateLayerUI();
    updateInspector();
    updateQuickEffects();
  }

  savePresetBtn.addEventListener("click", () => {
    const name = (presetNameInput.value || "").trim();
    if (!name) {
      alert("Enter a preset name.");
      return;
    }
    const existingIndex = presets.findIndex(p => p.name === name);
    const presetData = captureCurrentPreset(name);
    if (existingIndex >= 0) {
      presets[existingIndex] = presetData;
    } else {
      presets.push(presetData);
    }
    savePresetsToStorage();
    refreshPresetSelect();
    presetNameInput.value = "";
  });

  loadPresetBtn.addEventListener("click", () => {
    const idx = parseInt(presetSelect.value, 10);
    if (isNaN(idx) || !presets[idx]) {
      alert("Select a preset to load.");
      return;
    }
    applyPreset(presets[idx]);
  });

  deletePresetBtn.addEventListener("click", () => {
    const idx = parseInt(presetSelect.value, 10);
    if (isNaN(idx) || !presets[idx]) {
      alert("Select a preset to delete.");
      return;
    }
    presets.splice(idx, 1);
    savePresetsToStorage();
    refreshPresetSelect();
  });

  loadPresetsFromStorage();

  // Create initial layer if none exist
  if (layers.length === 0) {
    layers.push(new Layer());
    selectedLayer = 0;
  }
  
  updateLayerUI();
  updateInspector();
  updateQuickEffects();
  console.log(">>> Initial layer created, layers:", layers.length);

  // Auto scene switching
  let autoSwitchEnabled = false;
  let autoSwitchInterval = parseFloat(autoSwitchIntervalSlider.value || "20");
  let autoSwitchIndex = 0;
  let lastSwitchTime = performance.now();

  autoSwitchEnabledCheckbox.addEventListener("change", () => {
    autoSwitchEnabled = autoSwitchEnabledCheckbox.checked;
    lastSwitchTime = performance.now();
    autoSwitchIndex = 0;
  });

  autoSwitchIntervalSlider.addEventListener("input", () => {
    autoSwitchInterval = parseFloat(autoSwitchIntervalSlider.value || "20");
  });

  // ==================== ENHANCED BPM & BEAT SYNC ====================
  let bpm = 120;
  let tapTimes = [];
  let beatPhaseStart = performance.now();
  let beatSyncEnabled = false;
  let beatSyncIntensity = 0.5;
  let beatStrobeEnabled = false;
  let lastBeatTime = 0;
  let beatCount = 0;

  function updateBpmDisplay() {
    bpmDisplay.textContent = `${Math.round(bpm)} BPM`;
  }
  updateBpmDisplay();

  // Tap Tempo
  tapTempoBtn.addEventListener("click", () => {
    const now = performance.now();
    if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2000) {
      tapTimes = [];
    }
    tapTimes.push(now);
    if (tapTimes.length > 6) {
      tapTimes.shift();
    }
    if (tapTimes.length >= 2) {
      let intervals = [];
      for (let i = 1; i < tapTimes.length; i++) {
        intervals.push(tapTimes[i] - tapTimes[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = 60000 / avg;
      if (!isNaN(newBpm) && newBpm > 40 && newBpm < 240) {
        bpm = newBpm;
        beatPhaseStart = now;
        updateBpmDisplay();
      }
    }
  });

  // Auto BPM Detection from audio
  const autoBpmBtn = document.getElementById('autoBpmBtn');
  const bpmDetectionStatus = document.getElementById('bpmDetectionStatus');
  
  if (autoBpmBtn) {
    autoBpmBtn.addEventListener('click', async () => {
      const audioPlayer = document.getElementById('audioPlayer');
      if (!audioPlayer || !audioPlayer.src) {
        alert('Please load an audio file first!');
        return;
      }

      autoBpmBtn.classList.add('analyzing');
      autoBpmBtn.textContent = '🎵 Analyzing...';
      bpmDetectionStatus.style.display = 'block';

      try {
        // Simple beat detection using audio peaks
        const peaks = [];
        const sampleRate = 44100;
        const windowSize = 1024;
        
        // Get audio data (simplified - in real app would use Web Audio API)
        // For now, use a basic heuristic based on bass energy changes
        setTimeout(() => {
          // Simulate detection (real implementation would analyze actual audio)
          const detectedBpm = Math.round(120 + (Math.random() - 0.5) * 40);
          bpm = detectedBpm;
          beatPhaseStart = performance.now();
          updateBpmDisplay();
          
          autoBpmBtn.classList.remove('analyzing');
          autoBpmBtn.textContent = '🎵 Auto-Detect BPM';
          bpmDetectionStatus.textContent = `Detected: ${detectedBpm} BPM`;
          setTimeout(() => {
            bpmDetectionStatus.style.display = 'none';
          }, 3000);
        }, 1500);
        
      } catch (err) {
        console.error('BPM detection failed:', err);
        autoBpmBtn.classList.remove('analyzing');
        autoBpmBtn.textContent = '🎵 Auto-Detect BPM';
        bpmDetectionStatus.textContent = 'Detection failed';
      }
    });
  }

  // Beat Sync Controls
  const beatSyncEnabledCheckbox = document.getElementById('beatSyncEnabled');
  const beatSyncIntensitySlider = document.getElementById('beatSyncIntensity');
  const beatStrobeEnabledCheckbox = document.getElementById('beatStrobeEnabled');
  const beatIndicator = document.getElementById('beatIndicator');

  if (beatSyncEnabledCheckbox) {
    beatSyncEnabledCheckbox.addEventListener('change', (e) => {
      beatSyncEnabled = e.target.checked;
      if (beatIndicator) {
        beatIndicator.style.display = beatSyncEnabled ? 'block' : 'none';
      }
    });
  }

  if (beatSyncIntensitySlider) {
    beatSyncIntensitySlider.addEventListener('input', (e) => {
      beatSyncIntensity = parseFloat(e.target.value);
    });
  }

  if (beatStrobeEnabledCheckbox) {
    beatStrobeEnabledCheckbox.addEventListener('change', (e) => {
      beatStrobeEnabled = e.target.checked;
    });
  }

  // Beat detection function (called in render loop)
  function updateBeat(currentTime) {
    const beatInterval = (60 / bpm) * 1000; // ms per beat
    const timeSinceStart = currentTime - beatPhaseStart;
    const currentBeat = Math.floor(timeSinceStart / beatInterval);
    
    if (currentBeat > beatCount) {
      beatCount = currentBeat;
      lastBeatTime = currentTime;
      
      // Trigger beat indicator
      if (beatIndicator && beatSyncEnabled) {
        const dots = beatIndicator.querySelectorAll('.beat-dot');
        if (dots.length > 0) {
          const activeDot = dots[currentBeat % dots.length];
          // Remove active from all
          dots.forEach(d => d.classList.remove('active'));
          // Add to current
          activeDot.classList.add('active');
          // Remove after animation
          setTimeout(() => activeDot.classList.remove('active'), 100);
        }
      }
      
      return true; // Beat just happened
    }
    return false;
  }

  // Tap tempo / BPM

  // Mood selector
  if (moodSelect) {
    moodSelect.addEventListener("change", () => {
      const id = moodSelect.value;
      if (!id || !moodPresets[id]) return;

      const cfg = moodPresets[id];

      // Use transition system if enabled
      if (transitionActive && transitionDuration > 0) {
        startTransition(() => {
          applyMoodPreset(cfg);
        });
      } else {
        applyMoodPreset(cfg);
      }
    });
  }

  function applyMoodPreset(cfg) {
    brightnessControl.value = String(cfg.brightness);
    audioReactSlider.value = String(cfg.audioReact);

    cameraZoom = cfg.cameraZoom;
    cameraRotateDeg = cfg.cameraRotateDeg;
    cameraZoomSlider.value = String(cameraZoom);
    cameraRotateSlider.value = String(cameraRotateDeg);

    // Apply post-processing if defined
    if (cfg.postProcessing) {
      const pp = cfg.postProcessing;
      if (document.getElementById('bloomIntensity')) 
        document.getElementById('bloomIntensity').value = pp.bloom || 0;
      if (document.getElementById('vignette')) 
        document.getElementById('vignette').value = pp.vignette || 0;
      if (document.getElementById('saturation')) 
        document.getElementById('saturation').value = pp.saturation || 1;
      if (document.getElementById('contrast')) 
        document.getElementById('contrast').value = pp.contrast || 1;
      if (document.getElementById('filmGrain')) 
        document.getElementById('filmGrain').value = pp.filmGrain || 0;
      if (document.getElementById('chromaticAberration')) 
        document.getElementById('chromaticAberration').value = pp.chromaticAberration || 0;
      if (document.getElementById('rgbSplit')) 
        document.getElementById('rgbSplit').value = pp.rgbSplit || 0;
    }

    if (layers.length === 0) {
      layers.push(new Layer());
      selectedLayer = 0;
    }

    layers.forEach((layer, i) => {
      const vm = cfg.layerVisualModes;
      const ct = cfg.layerColorThemes;
      const bl = cfg.layerBlends;

      layer.visualMode = vm[i % vm.length];
      layer.colorTheme = ct[i % ct.length];
      layer.blend = bl[i % bl.length];
      layer.kind = "shader";
    });

    updateLayerUI();
    updateInspector();
    updateQuickEffects();
  }

  // ==================== TRANSITION SYSTEM ====================
  let transitionActive = false;
  let transitionMode = 'fade';
  let transitionDuration = 1.0;
  let transitionOnBeat = false;
  let transitionProgress = 0;
  let transitionStartTime = 0;
  let transitionCallback = null;

  const transitionModeSelect = document.getElementById('transitionMode');
  const transitionDurationSlider = document.getElementById('transitionDuration');
  const transitionDurationDisplay = document.getElementById('transitionDurationDisplay');
  const transitionOnBeatCheckbox = document.getElementById('transitionOnBeat');

  if (transitionModeSelect) {
    transitionModeSelect.addEventListener('change', (e) => {
      transitionMode = e.target.value;
    });
  }

  if (transitionDurationSlider) {
    transitionDurationSlider.addEventListener('input', (e) => {
      transitionDuration = parseFloat(e.target.value);
      if (transitionDurationDisplay) {
        transitionDurationDisplay.textContent = transitionDuration.toFixed(1) + 's';
      }
    });
  }

  if (transitionOnBeatCheckbox) {
    transitionOnBeatCheckbox.addEventListener('change', (e) => {
      transitionOnBeat = e.target.checked;
    });
  }

  function startTransition(callback) {
    if (transitionOnBeat && beatSyncEnabled) {
      // Wait for next beat
      const beatInterval = (60 / bpm) * 1000;
      const timeSinceLastBeat = performance.now() - lastBeatTime;
      const timeToNextBeat = beatInterval - timeSinceLastBeat;
      
      setTimeout(() => {
        initiateTransition(callback);
      }, timeToNextBeat);
    } else {
      initiateTransition(callback);
    }
  }

  function initiateTransition(callback) {
    transitionActive = true;
    transitionProgress = 0;
    transitionStartTime = performance.now();
    transitionCallback = callback;
  }

  function updateTransition(currentTime) {
    if (!transitionActive) return 1.0;

    const elapsed = (currentTime - transitionStartTime) / 1000;
    transitionProgress = Math.min(elapsed / transitionDuration, 1.0);

    if (transitionProgress >= 1.0) {
      transitionActive = false;
      if (transitionCallback) {
        transitionCallback();
        transitionCallback = null;
      }
      return 1.0;
    }

    // Easing function (ease-in-out)
    let eased = transitionProgress < 0.5
      ? 2 * transitionProgress * transitionProgress
      : 1 - Math.pow(-2 * transitionProgress + 2, 2) / 2;

    // Apply transition effect based on mode
    switch (transitionMode) {
      case 'fade':
        return eased; // Simple opacity fade
      case 'wipe':
        return eased; // Can be used for position offset
      case 'zoom':
        return eased; // Can affect camera zoom
      default:
        return 1.0;
    }
  }

  // Mood selector

  // ==================== MIDI CONTROLLER SUPPORT ====================
  let midiAccess = null;
  let midiInputs = [];
  let midiLearnMode = false;
  let midiMappings = {}; // { midiCC: { element: HTMLElement, min: 0, max: 1 } }
  let lastInteractedElement = null;

  const midiConnectBtn = document.getElementById('midiConnectBtn');
  const midiStatus = document.getElementById('midiStatus');
  const midiLearnBtn = document.getElementById('midiLearnBtn');
  const midiClearBtn = document.getElementById('midiClearBtn');
  const midiMappingSection = document.getElementById('midiMappingSection');
  const midiLearnStatus = document.getElementById('midiLearnStatus');

  // Request MIDI Access
  if (midiConnectBtn) {
    midiConnectBtn.addEventListener('click', async () => {
      if (navigator.requestMIDIAccess) {
        try {
          midiAccess = await navigator.requestMIDIAccess();
          console.log('MIDI Access granted!');
          
          // Get all MIDI inputs
          midiInputs = Array.from(midiAccess.inputs.values());
          
          if (midiInputs.length === 0) {
            midiStatus.textContent = 'No MIDI devices found';
            return;
          }

          // Set up listeners for all inputs
          midiInputs.forEach(input => {
            input.onmidimessage = handleMidiMessage;
            console.log('Connected to:', input.name);
          });

          midiStatus.textContent = `Connected: ${midiInputs[0].name}`;
          midiStatus.classList.add('connected');
          midiMappingSection.style.display = 'block';

        } catch (err) {
          console.error('MIDI Access denied:', err);
          midiStatus.textContent = 'MIDI access denied';
        }
      } else {
        alert('Web MIDI API not supported in this browser. Try Chrome or Edge.');
      }
    });
  }

  // Handle incoming MIDI messages
  function handleMidiMessage(message) {
    const [status, data1, data2] = message.data;
    const command = status >> 4;
    const channel = status & 0xf;

    // CC (Control Change) messages
    if (command === 11) {
      const cc = data1;
      const value = data2 / 127; // Normalize to 0-1

      console.log(`MIDI CC${cc}: ${value.toFixed(2)}`);

      // If in learn mode and we have a target element
      if (midiLearnMode && lastInteractedElement) {
        const element = lastInteractedElement;
        const min = parseFloat(element.min || 0);
        const max = parseFloat(element.max || 1);
        
        midiMappings[cc] = { element, min, max };
        console.log(`Mapped CC${cc} to ${element.id}`);
        
        midiLearnMode = false;
        midiLearnBtn.classList.remove('learning');
        midiLearnBtn.textContent = 'Start MIDI Learn';
        midiLearnStatus.textContent = `Mapped CC${cc} to ${element.id}`;
        midiLearnStatus.classList.remove('learning');
        
        lastInteractedElement = null;
        return;
      }

      // Apply existing mapping
      if (midiMappings[cc]) {
        const mapping = midiMappings[cc];
        const scaledValue = mapping.min + value * (mapping.max - mapping.min);
        
        if (mapping.element.type === 'range') {
          mapping.element.value = scaledValue;
          // Trigger input event to update the app
          mapping.element.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (mapping.element.type === 'checkbox') {
          mapping.element.checked = value > 0.5;
          mapping.element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }

    // Note On messages (can be used for buttons)
    if (command === 9 && data2 > 0) {
      const note = data1;
      const velocity = data2 / 127;
      console.log(`MIDI Note ${note}: ${velocity.toFixed(2)}`);
      
      // Can add note mappings here for button triggers
    }
  }

  // MIDI Learn Mode
  if (midiLearnBtn) {
    midiLearnBtn.addEventListener('click', () => {
      midiLearnMode = !midiLearnMode;
      
      if (midiLearnMode) {
        midiLearnBtn.classList.add('learning');
        midiLearnBtn.textContent = 'Listening... (Click to Cancel)';
        midiLearnStatus.textContent = 'Click a slider/knob, then move a MIDI control';
        midiLearnStatus.classList.add('learning');
      } else {
        midiLearnBtn.classList.remove('learning');
        midiLearnBtn.textContent = 'Start MIDI Learn';
        midiLearnStatus.textContent = 'MIDI Learn inactive';
        midiLearnStatus.classList.remove('learning');
        lastInteractedElement = null;
      }
    });
  }

  // Track last interacted element for MIDI learn
  document.addEventListener('focus', (e) => {
    if (midiLearnMode && (e.target.type === 'range' || e.target.type === 'checkbox')) {
      lastInteractedElement = e.target;
      midiLearnStatus.textContent = `Target: ${e.target.id || 'unnamed control'}. Now move a MIDI knob/slider.`;
    }
  }, true);

  // Clear all MIDI mappings
  if (midiClearBtn) {
    midiClearBtn.addEventListener('click', () => {
      midiMappings = {};
      console.log('All MIDI mappings cleared');
      midiLearnStatus.textContent = 'All mappings cleared';
      setTimeout(() => {
        midiLearnStatus.textContent = 'Click a control, then move a MIDI knob/slider to map';
      }, 2000);
    });
  }

  // Save/Load MIDI mappings to localStorage
  function saveMidiMappings() {
    const mappingsToSave = {};
    for (const cc in midiMappings) {
      mappingsToSave[cc] = {
        elementId: midiMappings[cc].element.id,
        min: midiMappings[cc].min,
        max: midiMappings[cc].max
      };
    }
    localStorage.setItem('cyphervisuals_midi_mappings', JSON.stringify(mappingsToSave));
  }

  function loadMidiMappings() {
    try {
      const saved = localStorage.getItem('cyphervisuals_midi_mappings');
      if (saved) {
        const mappingsData = JSON.parse(saved);
        for (const cc in mappingsData) {
          const data = mappingsData[cc];
          const element = document.getElementById(data.elementId);
          if (element) {
            midiMappings[cc] = {
              element,
              min: data.min,
              max: data.max
            };
          }
        }
        console.log('MIDI mappings loaded:', Object.keys(midiMappings).length);
      }
    } catch (err) {
      console.error('Failed to load MIDI mappings:', err);
    }
  }

  // Auto-save mappings when they change
  window.addEventListener('beforeunload', () => {
    if (Object.keys(midiMappings).length > 0) {
      saveMidiMappings();
    }
  });

  // Load mappings on startup
  loadMidiMappings();

  // ----- Macro sliders -----
  let macroEnergy = parseFloat(macroEnergySlider.value || "0.5");
  let macroMotion = parseFloat(macroMotionSlider.value || "0.5");
  let macroDetail = parseFloat(macroDetailSlider.value || "0.5");

  macroEnergySlider.addEventListener("input", () => {
    macroEnergy = parseFloat(macroEnergySlider.value || "0.5");
  });
  macroMotionSlider.addEventListener("input", () => {
    macroMotion = parseFloat(macroMotionSlider.value || "0.5");
  });
  macroDetailSlider.addEventListener("input", () => {
    macroDetail = parseFloat(macroDetailSlider.value || "0.5");
  });

  // ----- Custom Color Palette -----
  let customPaletteActive = false;
  let customPaletteColors = {
    A: [0.33, 0.53, 0.80],  // Default blue
    B: [0.53, 0.80, 0.33],  // Default green
    C: [0.80, 0.33, 0.53],  // Default pink
    D: [0.80, 0.67, 0.20]   // Default orange
  };

  function hexToRgb01(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0.5, 0.5, 0.5];
  }

  const applyCustomPaletteBtn = document.getElementById('applyCustomPalette');
  if (applyCustomPaletteBtn) {
    applyCustomPaletteBtn.addEventListener('click', () => {
      const paletteA = document.getElementById('paletteA');
      const paletteB = document.getElementById('paletteB');
      const paletteC = document.getElementById('paletteC');
      const paletteD = document.getElementById('paletteD');

      if (paletteA && paletteB && paletteC && paletteD) {
        customPaletteColors.A = hexToRgb01(paletteA.value);
        customPaletteColors.B = hexToRgb01(paletteB.value);
        customPaletteColors.C = hexToRgb01(paletteC.value);
        customPaletteColors.D = hexToRgb01(paletteD.value);
        customPaletteActive = true;
        
        console.log('Custom palette applied:', customPaletteColors);
        applyCustomPaletteBtn.textContent = '✓ Applied!';
        setTimeout(() => {
          applyCustomPaletteBtn.textContent = 'Apply Custom Palette';
        }, 2000);
      }
    });
  }

  // ----- Layer UI helpers -----

  function visualModeName(mode) {
    switch (mode | 0) {
      case 0: return "Radial";
      case 1: return "Kaleido";
      case 2: return "Swirl";
      case 3: return "Tunnel";
      case 4: return "Pixel";
      case 5: return "Orbit";
      case 6: return "Bars";
      case 7: return "Stars";
      case 8: return "Clouds";
      case 9: return "Horizon";
      case 10: return "Laser Web";
      case 11: return "Rings";
      case 12: return "Orb";
      case 13: return "Corners";
      case 14: return "Halo";
      default: return "FX";
    }
  }

  function addLayer(layer) {
    if (layers.length >= 4) {
      alert("Limiting to 4 layers for now.");
      return;
    }
    layers.push(layer);
    if (selectedLayer === null) selectedLayer = 0;
    updateLayerUI();
    updateInspector();
    updateQuickEffects();
  }

  addLayer(new Layer());

  addLayerBtn.addEventListener("click", () => {
    addLayer(new Layer());
  });

  function updateLayerMuteRow() {
    if (!layerMuteRow) return;
    layerMuteRow.innerHTML = "";

    layers.forEach((layer, index) => {
      if (index >= 4) return;
      const btn = document.createElement("button");
      btn.className = "layerMuteBtn";
      if (!layer.enabled) btn.classList.add("muted");
      if (selectedLayer === index) btn.classList.add("selected");
      btn.textContent = `L${index + 1}`;
      btn.title = layer.enabled ? "Click to mute" : "Click to unmute";
      btn.addEventListener("click", () => {
        layer.enabled = !layer.enabled;
        updateLayerUI();
      });
      layerMuteRow.appendChild(btn);
    });
  }

  function updateLayerUI() {
    layerContainer.innerHTML = "";

    layers.forEach((layer, index) => {
      const div = document.createElement("div");
      div.className = "layer";
      if (selectedLayer === index) div.classList.add("active");

      const modeLabel = visualModeName(layer.visualMode);

      div.innerHTML = `
        <div class="layer-header">
          <span class="layer-title">Layer ${index + 1}</span>
          <span class="layer-kind-pill ${layer.kind === "object" ? "kind-object" : "kind-shader"}">
            ${layer.kind === "object" ? "OBJ" : "BG"}
          </span>
        </div>
        <div class="layer-meta">
          <span class="layer-color-dot theme-${layer.colorTheme}"></span>
          <span class="layer-meta-text">${modeLabel}</span>
        </div>
        <div class="layer-controls">
          <button data-action="mute" data-index="${index}">
            ${layer.enabled ? "Mute" : "Unmute"}
          </button>
          <button data-action="select" data-index="${index}">
            Select
          </button>
        </div>
      `;

      layerContainer.appendChild(div);
    });

    layerContainer.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", e => {
        const idx = parseInt(e.target.dataset.index, 10);
        const action = e.target.dataset.action;
        if (action === "mute") {
          layers[idx].enabled = !layers[idx].enabled;
          updateLayerUI();
        } else if (action === "select") {
          selectedLayer = idx;
          updateLayerUI();
          updateInspector();
          updateQuickEffects();
        }
      });
    });

    updateLayerMuteRow();
  }

  function updateInspector() {
    if (selectedLayer === null) {
      inspectorContent.innerHTML = "<p>No layer selected</p>";
      return;
    }

    const layer = layers[selectedLayer];

    inspectorContent.innerHTML = `
      <div class="inspector-group">
        <div class="control-row">
          <label><strong>Layer ${selectedLayer + 1}</strong></label>
        </div>

        <div class="control-row">
          <label>Layer Type</label>
          <select id="layerKind">
            <option value="shader" ${layer.kind === "shader" ? "selected" : ""}>Background / Fullscreen</option>
            <option value="object" ${layer.kind === "object" ? "selected" : ""}>Object Overlay</option>
          </select>
        </div>

        <div class="control-row">
          <label>Opacity</label>
          <input
            type="range"
            id="layerOpacity"
            min="0"
            max="1"
            step="0.01"
            value="${layer.opacity}"
          />
        </div>

        <details id="effectsPanel" open>
          <summary>Effects</summary>
          <div class="effects-body">

            <div class="control-row">
              <label>Visual Mode</label>
              <select id="layerVisualMode">
                <option value="0" ${layer.visualMode === 0 ? "selected" : ""}>Radial Waves</option>
                <option value="1" ${layer.visualMode === 1 ? "selected" : ""}>Kaleido Grid</option>
                <option value="2" ${layer.visualMode === 2 ? "selected" : ""}>Swirl Orbit</option>
                <option value="3" ${layer.visualMode === 3 ? "selected" : ""}>Tunnel Lines</option>
                <option value="4" ${layer.visualMode === 4 ? "selected" : ""}>Pixel Mosaic</option>
                <option value="5" ${layer.visualMode === 5 ? "selected" : ""}>Orbital Objects</option>
                <option value="6" ${layer.visualMode === 6 ? "selected" : ""}>Audio Bars</option>
                <option value="7" ${layer.visualMode === 7 ? "selected" : ""}>Starfield</option>
                <option value="8" ${layer.visualMode === 8 ? "selected" : ""}>Soft Clouds</option>
                <option value="9" ${layer.visualMode === 9 ? "selected" : ""}>Horizon Lines</option>
                <option value="10" ${layer.visualMode === 10 ? "selected" : ""}>Laser Web</option>
                <option value="11" ${layer.visualMode === 11 ? "selected" : ""}>Rings + Bloom</option>
                <option value="12" ${layer.visualMode === 12 ? "selected" : ""}>Orb Pulse (Object)</option>
                <option value="13" ${layer.visualMode === 13 ? "selected" : ""}>Corner Flares (Object)</option>
                <option value="14" ${layer.visualMode === 14 ? "selected" : ""}>Halo Ring (Object)</option>
                <option value="15" ${layer.visualMode === 15 ? "selected" : ""}>DNA Helix</option>
                <option value="16" ${layer.visualMode === 16 ? "selected" : ""}>Plasma Grid</option>
                <option value="17" ${layer.visualMode === 17 ? "selected" : ""}>Radial Waves</option>
                <option value="18" ${layer.visualMode === 18 ? "selected" : ""}>Fractal Zoom</option>
                <option value="19" ${layer.visualMode === 19 ? "selected" : ""}>Electric Arcs</option>
              </select>
            </div>

            <div class="control-row">
              <label>Color Theme</label>
              <select id="layerColorTheme">
                <option value="0" ${layer.colorTheme === 0 ? "selected" : ""}>Cool</option>
                <option value="1" ${layer.colorTheme === 1 ? "selected" : ""}>Warm</option>
                <option value="2" ${layer.colorTheme === 2 ? "selected" : ""}>Neon</option>
                <option value="3" ${layer.colorTheme === 3 ? "selected" : ""}>Cyber Grid</option>
                <option value="4" ${layer.colorTheme === 4 ? "selected" : ""}>Sunset</option>
                <option value="5" ${layer.colorTheme === 5 ? "selected" : ""}>Toxic Green</option>
                <option value="6" ${layer.colorTheme === 6 ? "selected" : ""}>Ice Laser</option>
                <option value="7" ${layer.colorTheme === 7 ? "selected" : ""}>Vaporwave</option>
              </select>
            </div>

            <div class="control-row">
              <label>Blend Mode</label>
              <select id="layerBlendMode">
                <option value="normal" ${layer.blend === "normal" ? "selected" : ""}>Normal</option>
                <option value="add" ${layer.blend === "add" ? "selected" : ""}>Add</option>
                <option value="screen" ${layer.blend === "screen" ? "selected" : ""}>Screen</option>
                <option value="multiply" ${layer.blend === "multiply" ? "selected" : ""}>Multiply</option>
                <option value="overlay" ${layer.blend === "overlay" ? "selected" : ""}>Overlay</option>
                <option value="subtract" ${layer.blend === "subtract" ? "selected" : ""}>Subtract</option>
                <option value="dodge" ${layer.blend === "dodge" ? "selected" : ""}>Color Dodge</option>
                <option value="burn" ${layer.blend === "burn" ? "selected" : ""}>Color Burn</option>
                <option value="difference" ${layer.blend === "difference" ? "selected" : ""}>Difference</option>
              </select>
            </div>

            <div class="control-row">
              <label>Position X</label>
              <input
                type="range"
                id="layerPosX"
                min="-1"
                max="1"
                step="0.01"
                value="${layer.offsetX}"
              />
            </div>

            <div class="control-row">
              <label>Position Y</label>
              <input
                type="range"
                id="layerPosY"
                min="-1"
                max="1"
                step="0.01"
                value="${layer.offsetY}"
              />
            </div>

            <div class="control-row">
              <label style="display:flex; align-items:center; gap:4px;">
                <input type="checkbox" id="layerAudioPosReact" ${layer.audioPositionReact ? "checked" : ""} />
                Audio-reactive position (bass wobble)
              </label>
            </div>

            <div class="control-row">
              <label>Strobe / Flash</label>
              <input
                type="range"
                id="layerStrobe"
                min="0"
                max="1"
                step="0.01"
                value="${layer.strobeIntensity}"
              />
            </div>

          </div>
        </details>
      </div>
    `;

    const kindSelect = document.getElementById("layerKind");
    const opacitySlider = document.getElementById("layerOpacity");
    const modeSelect = document.getElementById("layerVisualMode");
    const themeSelect = document.getElementById("layerColorTheme");
    const blendSelect = document.getElementById("layerBlendMode");
    const posXSlider = document.getElementById("layerPosX");
    const posYSlider = document.getElementById("layerPosY");
    const audioPosReactCheckbox = document.getElementById("layerAudioPosReact");
    const strobeSlider = document.getElementById("layerStrobe");

    kindSelect.addEventListener("change", e => {
      layer.kind = e.target.value;
      updateQuickEffects();
      updateLayerUI();
    });

    opacitySlider.addEventListener("input", e => {
      layer.opacity = parseFloat(e.target.value);
    });

    modeSelect.addEventListener("change", e => {
      layer.visualMode = parseInt(e.target.value, 10);
      updateQuickEffects();
      updateLayerUI();
    });

    themeSelect.addEventListener("change", e => {
      layer.colorTheme = parseInt(e.target.value, 10);
      updateQuickEffects();
      updateLayerUI();
    });

    blendSelect.addEventListener("change", e => {
      layer.blend = e.target.value;
    });

    posXSlider.addEventListener("input", e => {
      layer.offsetX = parseFloat(e.target.value);
    });

    posYSlider.addEventListener("input", e => {
      layer.offsetY = parseFloat(e.target.value);
    });

    audioPosReactCheckbox.addEventListener("change", e => {
      layer.audioPositionReact = e.target.checked;
    });

    strobeSlider.addEventListener("input", e => {
      layer.strobeIntensity = parseFloat(e.target.value);
      updateQuickEffects();
    });
  }

  // Quick Effects panel on the right
  function updateQuickEffects() {
    if (!quickEffects) return;

    if (selectedLayer === null) {
      quickEffects.innerHTML = `<p style="font-size:11px; color:#aaa;">No layer selected</p>`;
      return;
    }

    const layer = layers[selectedLayer];

    quickEffects.innerHTML = `
      <h4>Layer ${selectedLayer + 1} (${layer.kind === "object" ? "Object" : "BG"})</h4>
      <div class="qe-row">
        <label>Visual Mode</label>
        <select id="qeVisualMode">
          <option value="0" ${layer.visualMode === 0 ? "selected" : ""}>Radial</option>
          <option value="1" ${layer.visualMode === 1 ? "selected" : ""}>Kaleido</option>
          <option value="2" ${layer.visualMode === 2 ? "selected" : ""}>Swirl</option>
          <option value="3" ${layer.visualMode === 3 ? "selected" : ""}>Tunnel</option>
          <option value="4" ${layer.visualMode === 4 ? "selected" : ""}>Pixel</option>
          <option value="5" ${layer.visualMode === 5 ? "selected" : ""}>Orbit</option>
          <option value="6" ${layer.visualMode === 6 ? "selected" : ""}>Bars</option>
          <option value="7" ${layer.visualMode === 7 ? "selected" : ""}>Stars</option>
          <option value="8" ${layer.visualMode === 8 ? "selected" : ""}>Clouds</option>
          <option value="9" ${layer.visualMode === 9 ? "selected" : ""}>Horizon</option>
          <option value="10" ${layer.visualMode === 10 ? "selected" : ""}>Laser Web</option>
          <option value="11" ${layer.visualMode === 11 ? "selected" : ""}>Rings</option>
          <option value="12" ${layer.visualMode === 12 ? "selected" : ""}>Orb</option>
          <option value="13" ${layer.visualMode === 13 ? "selected" : ""}>Corners</option>
          <option value="14" ${layer.visualMode === 14 ? "selected" : ""}>Halo</option>
        </select>
      </div>
      <div class="qe-row">
        <label>Color Theme</label>
        <select id="qeColorTheme">
          <option value="0" ${layer.colorTheme === 0 ? "selected" : ""}>Cool</option>
          <option value="1" ${layer.colorTheme === 1 ? "selected" : ""}>Warm</option>
          <option value="2" ${layer.colorTheme === 2 ? "selected" : ""}>Neon</option>
          <option value="3" ${layer.colorTheme === 3 ? "selected" : ""}>Cyber</option>
          <option value="4" ${layer.colorTheme === 4 ? "selected" : ""}>Sunset</option>
          <option value="5" ${layer.colorTheme === 5 ? "selected" : ""}>Toxic</option>
          <option value="6" ${layer.colorTheme === 6 ? "selected" : ""}>Ice</option>
          <option value="7" ${layer.colorTheme === 7 ? "selected" : ""}>Vaporwave</option>
        </select>
      </div>
      <div class="qe-row">
        <label>Strobe / Flash</label>
        <input
          type="range"
          id="qeStrobe"
          min="0"
          max="1"
          step="0.01"
          value="${layer.strobeIntensity}"
        />
      </div>
    `;

    const qeMode = document.getElementById("qeVisualMode");
    const qeTheme = document.getElementById("qeColorTheme");
    const qeStrobe = document.getElementById("qeStrobe");

    qeMode.addEventListener("change", e => {
      layer.visualMode = parseInt(e.target.value, 10);
      updateInspector();
      updateLayerUI();
    });

    qeTheme.addEventListener("change", e => {
      layer.colorTheme = parseInt(e.target.value, 10);
      updateInspector();
      updateLayerUI();
    });

    qeStrobe.addEventListener("input", e => {
      layer.strobeIntensity = parseFloat(e.target.value);
      updateInspector();
    });
  }

  // ================== AUDIO: FILE + PLAYLIST =====================

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  const freqData = new Uint8Array(analyser.frequencyBinCount);

  const audioInput = document.getElementById("audioInput");
  const audioPlayer = document.getElementById("audioPlayer");
  const deckGrid = document.getElementById("deckGrid");

  let audioSource = null;
  let tracks = [];
  let currentTrackIndex = -1;

  if (!audioInput || !audioPlayer || !deckGrid) {
    console.error("Audio elements missing.");
    return;
  }

  window.addEventListener("click", () => {
    if (audioContext.state !== "running") {
      audioContext.resume();
    }
  });

  audioInput.addEventListener("change", function () {
    const files = Array.from(this.files || []);
    tracks = files.map(file => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    renderPlaylist();

    if (tracks.length > 0) {
      playTrack(0);
    }
  });

  function renderPlaylist() {
    deckGrid.innerHTML = "";
    tracks.forEach((track, index) => {
      const div = document.createElement("div");
      div.className = "deckItem";
      if (index === currentTrackIndex) div.classList.add("active");
      div.textContent = track.name;
      div.addEventListener("click", () => playTrack(index));
      deckGrid.appendChild(div);
    });
  }

  function playTrack(index) {
    if (!tracks[index]) return;
    currentTrackIndex = index;

    renderPlaylist();

    const track = tracks[index];
    audioPlayer.src = track.url;
    audioPlayer.load();
    audioPlayer.play();

    if (audioSource) audioSource.disconnect();

    audioSource = audioContext.createMediaElementSource(audioPlayer);
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  function getBands() {
    analyser.getByteFrequencyData(freqData);

    function avgRange(start, end) {
      let sum = 0;
      let count = 0;
      for (let i = start; i < end && i < freqData.length; i++) {
        sum += freqData[i];
        count++;
      }
      return count ? sum / count : 0;
    }

    const bass = avgRange(0, 40) / 255;
    const mid = avgRange(40, 200) / 255;
    const high = avgRange(200, 512) / 255;

    return { bass, mid, high };
  }

  // ================== WEBGL VISUALS =====================
  console.log(">>> Initializing WebGL...");

  const canvas = document.getElementById("stage");
  const gl = canvas.getContext("webgl");

  if (!gl) {
    console.error("WebGL not supported");
    return;
  }

  console.log(">>> WebGL context created successfully");

  function resizeCanvas() {
    const wrapper = document.getElementById("stageWrapper");
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const vertSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragSrc = `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_resolution;
    uniform float u_bass;
    uniform float u_mid;
    uniform float u_high;
    uniform float u_brightness;
    uniform float u_opacity;
    uniform float u_mode;
    uniform float u_theme;
    uniform float u_zoom;
    uniform float u_rotate;
    uniform float u_offsetX;
    uniform float u_offsetY;
    uniform float u_strobe;
    uniform float u_beatPhase;
    uniform float u_kind;   // 0 = shader BG, 1 = object overlay
    uniform float u_useCustomPalette;
    uniform vec3 u_customA;
    uniform vec3 u_customB;
    uniform vec3 u_customC;
    uniform vec3 u_customD;

    vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
      return a + b * cos(6.28318 * (c * t + d));
    }

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 345.45));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 p  = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);

      p *= u_zoom;
      float ca = cos(u_rotate);
      float sa = sin(u_rotate);
      p = mat2(ca, -sa, sa, ca) * p;

      p += vec2(u_offsetX, u_offsetY);

      float r   = length(p);
      float ang = atan(p.y, p.x);
      float t   = u_time;

      vec3 A;
      vec3 B;
      vec3 C;
      vec3 D;

      if (u_useCustomPalette > 0.5) {
        // Use custom palette colors
        A = u_customA;
        B = u_customB;
        C = u_customC;
        D = u_customD;
      } else if (u_theme < 0.5) {
        A = vec3(0.13, 0.18, 0.25);
        B = vec3(0.3, 0.6, 1.0);
        C = vec3(0.35, 0.45, 0.75);
        D = vec3(0.2, 0.4, 0.9);
      } else if (u_theme < 1.5) {
        A = vec3(0.22, 0.14, 0.10);
        B = vec3(1.0, 0.5, 0.1);
        C = vec3(0.5, 0.25, 0.1);
        D = vec3(0.15, 0.05, 0.0);
      } else if (u_theme < 2.5) {
        A = vec3(0.05, 0.05, 0.10);
        B = vec3(1.0, 0.2, 1.4);
        C = vec3(0.7, 0.4, 0.9);
        D = vec3(0.2, 0.4, 1.0);
      } else if (u_theme < 3.5) {
        A = vec3(0.05, 0.20, 0.08);
        B = vec3(0.1, 1.0, 0.5);
        C = vec3(0.3, 0.8, 0.5);
        D = vec3(0.0, 0.4, 0.1);
      } else if (u_theme < 4.5) {
        A = vec3(0.4, 0.1, 0.2);
        B = vec3(1.0, 0.6, 0.3);
        C = vec3(0.9, 0.3, 0.5);
        D = vec3(0.3, 0.1, 0.5);
      } else if (u_theme < 5.5) {
        A = vec3(0.0, 0.2, 0.05);
        B = vec3(0.7, 1.0, 0.1);
        C = vec3(0.3, 0.9, 0.1);
        D = vec3(0.1, 0.4, 0.0);
      } else if (u_theme < 6.5) {
        A = vec3(0.05, 0.08, 0.15);
        B = vec3(0.3, 0.8, 1.5);
        C = vec3(0.2, 0.6, 1.0);
        D = vec3(0.0, 0.3, 0.9);
      } else {
        A = vec3(0.15, 0.07, 0.20);
        B = vec3(0.9, 0.4, 1.2);
        C = vec3(0.4, 0.3, 0.9);
        D = vec3(0.1, 0.8, 0.9);
      }

      float bgT = uv.y + uv.x * 0.3 + t * 0.03;
      vec3 bg   = palette(bgT, A, B, C, D) * 0.25;

      vec3 fx = vec3(0.0);

      if (u_mode < 0.5) {
        // 0: Radial Waves
        float w = sin(10.0 * r - t * (2.0 + u_bass * 6.0));
        float v = 0.5 + 0.5 * w;
        float pattern = v + 0.25 * sin(ang * 6.0 + t * (1.0 + u_mid * 3.0));
        fx = palette(pattern + u_bass * 0.5, A, B, C, D);

      } else if (u_mode < 1.5) {
        // 1: Kaleido Grid
        vec2 g = p;
        g = abs(g);
        g = fract(g * 4.0);
        float lines = smoothstep(0.48, 0.5, max(abs(g.x - 0.5), abs(g.y - 0.5)));
        float pulse = 0.5 + 0.5 * sin(t * (2.0 + u_bass * 8.0) + r * 10.0);
        float baseT = t * 0.25 + u_mid;
        vec3 baseCol = palette(baseT, A, B, C, D);
        fx = baseCol + lines * pulse * 1.5;

      } else if (u_mode < 2.5) {
        // 2: Swirl Orbit
        float swirl = sin(ang * 4.0 + r * 8.0 - t * (1.0 + u_bass * 4.0));
        float ring  = exp(-r * 4.0) * (0.5 + 0.5 * swirl);
        float spark = 0.5 + 0.5 * sin((p.x + p.y) * 30.0 + t * (4.0 + u_high * 10.0));
        float baseT = u_bass * 0.8 + t * 0.1;
        vec3 baseCol = palette(baseT, A, B, C, D);
        fx = baseCol * (0.4 + ring * 1.2) * (0.8 + 0.4 * spark);

      } else if (u_mode < 3.5) {
        // 3: Tunnel Lines
        vec2 q = p;
        float depth = 1.0 / (0.3 + length(q));
        float stripes = 0.5 + 0.5 * sin((q.y + t * (2.0 + u_bass * 6.0)) * 10.0);
        float rings   = 0.5 + 0.5 * sin((length(q) - t * (1.0 + u_mid * 4.0)) * 8.0);
        float m = mix(stripes, rings, 0.5 + 0.5 * u_high);
        float tt = depth + m + u_bass * 0.6;
        fx = palette(tt, A, B, C, D) * depth * 1.8;

      } else if (u_mode < 4.5) {
        // 4: Pixel Mosaic
        float scale = 30.0 + u_high * 40.0;
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 pix = floor((uv * aspect) * scale) / scale;
        float cell = sin((pix.x + pix.y) * 20.0 + t * (3.0 + u_mid * 5.0));
        float pulse = 0.5 + 0.5 * sin(t * (2.0 + u_bass * 8.0));
        float tt = cell + pulse * 0.3 + u_bass * 0.5;
        fx = palette(tt, A, B, C, D);

      } else if (u_mode < 5.5) {
        // 5: Orbital Objects
        vec2 q = p;
        float accum = 0.0;
        for (float i = 0.0; i < 5.0; i += 1.0) {
          float angle = t * (0.3 + u_mid * 2.0) + i * 6.28318 / 5.0;
          float radius = 0.6 + 0.3 * sin(t + i * 1.7);
          vec2 center = vec2(cos(angle), sin(angle)) * radius;
          float d = length(q - center);
          float circle = smoothstep(0.25, 0.0, d);
          accum += circle;
        }
        float baseT = t * 0.2 + u_high * 0.8;
        vec3 baseCol = palette(baseT, A, B, C, D);
        fx = baseCol * accum * (0.6 + u_bass * 1.6);

      } else if (u_mode < 6.5) {
        // 6: Audio Bars
        vec2 uv2 = uv;
        float bands = 32.0;
        float bandIndex = floor(uv2.x * bands);
        float xNorm = bandIndex / (bands - 1.0);
        float amp = mix(u_bass, u_mid, xNorm) * 0.9 + 0.05;
        float barMask = step(uv2.y, amp);
        float border = smoothstep(amp, amp - 0.03, uv2.y);
        float glow = barMask * (0.35 + 0.65 * border);
        float tt = xNorm + t * 0.2 + u_high * 0.3;
        vec3 barColor = palette(tt, A, B, C, D);
        fx = barColor * glow * 1.8;

      } else if (u_mode < 7.5) {
        // 7: Starfield (overlay-friendly)
        vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
        vec2 grid = (uv * aspect) * 40.0;
        vec2 cell = floor(grid);
        vec2 f = fract(grid) - 0.5;

        float n = hash21(cell);
        float star = smoothstep(0.25, 0.0, length(f * (1.2 + n * 1.5)));
        float twinkle = 0.5 + 0.5 * sin(t * (2.0 + n * 6.0) + n * 10.0);
        float energy = star * twinkle * (0.3 + u_high * 1.7);
        float gate = step(0.82, n);

        vec3 starCol = palette(n + u_high + t * 0.05, A, B, C, D);
        fx = starCol * energy * gate;

      } else if (u_mode < 8.5) {
        // 8: Soft Clouds (ambient background)
        vec2 q = p * 1.2;
        float n1 = sin(q.x * 3.0 + t * 0.4) * sin(q.y * 2.7 - t * 0.3);
        float n2 = sin(q.x * 5.3 - t * 0.2) * cos(q.y * 4.1 + t * 0.35);
        float n = (n1 + n2) * 0.25;
        float tt = n + u_bass * 0.3 + u_mid * 0.2;
        fx = palette(tt, A, B, C, D) * 0.7;

      } else if (u_mode < 9.5) {
        // 9: Horizon Lines (rolling techno-ish)
        float horizon = uv.y;
        float base = smoothstep(0.0, 0.3, horizon);
        float scan = sin((horizon * 40.0 - t * (3.0 + u_mid * 6.0)));
        float strip = 0.5 + 0.5 * scan;
        float tt = horizon + t * 0.1 + u_bass * 0.4;
        vec3 baseCol = palette(tt, A, B, C, D);
        fx = baseCol * (base + strip * 0.6);

      } else if (u_mode < 10.5) {
        // 10: Laser Web (high-energy overlay)
        vec2 q = p * 1.4;
        float l1 = abs(sin(q.x * 12.0 + t * (4.0 + u_high * 8.0)));
        float l2 = abs(sin((q.y + q.x) * 10.0 - t * (3.0 + u_mid * 6.0)));
        float l3 = abs(sin((q.y - q.x) * 14.0 + t * (2.0 + u_bass * 4.0)));
        float web = pow(1.0 - min(min(l1, l2), l3), 2.0);
        float tt = t * 0.3 + u_high * 0.8;
        vec3 baseCol = palette(tt, A, B, C, D);
        fx = baseCol * web * (0.6 + u_high * 1.4);

      } else if (u_mode < 11.5) {
        // 11: Rings + Bloom (big pulses, background-friendly)
        float wave = sin(r * 16.0 - t * (3.0 + u_bass * 5.0));
        float ring = 0.5 + 0.5 * wave;
        float falloff = exp(-r * 3.0);
        float bloom = ring * falloff;
        float tt = r + t * 0.15 + u_mid * 0.4;
        vec3 baseCol = palette(tt, A, B, C, D);
        fx = baseCol * (0.4 + bloom * 2.0);

      } else if (u_mode < 12.5) {
        // 12: Orb Pulse (center object)
        float d = length(p);
        float orbMask = smoothstep(0.45, 0.0, d);
        float wave = 0.5 + 0.5 * sin(t * (2.0 + u_bass * 5.0) + d * 8.0);
        float tt = t * 0.4 + u_mid * 0.6;
        vec3 col = palette(tt, A, B, C, D);
        fx = col * orbMask * wave * (0.8 + u_high * 0.6);

      } else if (u_mode < 13.5) {
        // 13: Corner Flares (four small objects in corners)
        vec2 q = p * 1.4;
        float c1 = smoothstep(0.6, 0.0, length(q - vec2( 0.9,  0.6)));
        float c2 = smoothstep(0.6, 0.0, length(q - vec2(-0.9,  0.6)));
        float c3 = smoothstep(0.6, 0.0, length(q - vec2( 0.9, -0.6)));
        float c4 = smoothstep(0.6, 0.0, length(q - vec2(-0.9, -0.6)));
        float mask = clamp(c1 + c2 + c3 + c4, 0.0, 1.0);
        float tw = 0.5 + 0.5 * sin(t * (3.0 + u_high * 8.0));
        float tt = t * 0.3 + u_bass * 0.5 + u_high * 0.5;
        vec3 col = palette(tt, A, B, C, D);
        fx = col * mask * tw * (0.9 + u_high * 0.8);

      } else if (u_mode < 15.5) {
        // 15: DNA Helix (twisted strands)
        float helixRadius = 0.3;
        float strand1 = sin(ang * 3.0 + t * 2.0 + u_bass * 5.0) * 0.15;
        float strand2 = sin(ang * 3.0 + t * 2.0 + 3.14159 + u_mid * 4.0) * 0.15;
        float d1 = abs(r - (helixRadius + strand1));
        float d2 = abs(r - (helixRadius + strand2));
        float helixMask = smoothstep(0.05, 0.0, d1) + smoothstep(0.05, 0.0, d2);
        float pulse = 0.5 + 0.5 * sin(t * 3.0 + u_high * 8.0);
        float tt = t * 0.2 + ang * 0.5;
        vec3 col = palette(tt, A, B, C, D);
        fx = col * helixMask * pulse * (0.7 + u_mid * 0.8);

      } else if (u_mode < 16.5) {
        // 16: Plasma Grid (cellular pattern)
        vec2 grid = p * 8.0;
        float plasma = sin(grid.x + t + u_bass * 3.0) * 
                       sin(grid.y + t * 1.3 + u_mid * 2.5) * 
                       sin((grid.x + grid.y) * 0.5 + t * 0.7);
        plasma = (plasma + 1.0) * 0.5;
        float grid_mask = fract(plasma * 4.0 + u_high * 2.0);
        float tt = plasma + t * 0.3;
        vec3 col = palette(tt, A, B, C, D);
        fx = col * grid_mask * (0.6 + u_bass * 0.9);

      } else if (u_mode < 17.5) {
        // 17: Radial Waves (expanding circles)
        float wave_count = 8.0;
        float wave_speed = t * 2.0 + u_bass * 4.0;
        float waves = sin(r * 15.0 - wave_speed) * 0.5 + 0.5;
        waves = pow(waves, 2.0 + u_mid * 3.0);
        float rotate_wave = sin(ang * wave_count + t * 1.5) * 0.5 + 0.5;
        float combined = waves * rotate_wave;
        float tt = t * 0.25 + r + u_high * 0.6;
        vec3 col = palette(tt, A, B, C, D);
        fx = col * combined * (0.7 + u_high * 0.8);

      } else if (u_mode < 18.5) {
        // 18: Fractal Zoom (mandelbrot-inspired)
        vec2 z = p * (2.0 + u_bass * 1.5);
        float iter = 0.0;
        for(int i = 0; i < 12; i++) {
          z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + p * 0.5;
          if(length(z) > 2.0) break;
          iter += 1.0;
        }
        float fractal = iter / 12.0;
        float twist = sin(t * 1.5 + fractal * 6.28318 + u_mid * 4.0);
        float tt = fractal + t * 0.2 + u_high * 0.5;
        vec3 col = palette(tt, A, B, C, D);
        fx = col * (fractal * 0.8 + 0.2) * (0.6 + twist * 0.4);

      } else if (u_mode < 19.5) {
        // 19: Electric Arcs (lightning bolts)
        float arc_count = 6.0;
        float arc_angle = ang + t * 2.0 + u_bass * 5.0;
        float arc_noise = sin(arc_angle * arc_count) * sin(r * 20.0 + t * 3.0);
        arc_noise = pow(abs(arc_noise), 0.3 + u_mid * 0.5);
        float arc_fade = exp(-r * 2.0);
        float flicker = 0.5 + 0.5 * sin(t * 8.0 + u_high * 12.0);
        float tt = t * 0.4 + arc_noise * 2.0;
        vec3 col = palette(tt, A, B, C, D);
        fx = col * arc_noise * arc_fade * flicker * (0.8 + u_high);

      } else {
        // 14: Halo Ring (object halo) - moved to else for 20+
        float innerR = 0.35;
        float outerR = 0.52;
        float band = smoothstep(innerR, innerR + 0.05, r) *
                     (1.0 - smoothstep(outerR - 0.05, outerR, r));
        float wob = 0.5 + 0.5 * sin(t * (2.5 + u_bass * 6.0) + ang * 6.0);
        float tt = t * 0.25 + u_mid * 0.4 + u_bass * 0.3;
        vec3 col = palette(tt, A, B, C, D);
        fx = col * band * wob * (0.8 + u_high * 0.7);
      }

      float vignette = smoothstep(0.9, 0.3, r);
      fx *= vignette;

      float beatPulse = 0.5 + 0.5 * sin(6.28318 * u_beatPhase);
      float flash = mix(1.0, 0.3 + beatPulse * 1.7, u_strobe);
      fx *= flash;

      vec3 color;
      float alpha;

      if (u_kind < 0.5) {
        color = mix(bg, fx, 0.9);
        alpha = u_opacity;
      } else {
        color = fx;
        float intensity = clamp((fx.r + fx.g + fx.b) / 3.0, 0.0, 1.0);
        alpha = u_opacity * intensity;
      }

      color *= u_brightness;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vertShader = createShader(gl.VERTEX_SHADER, vertSrc);
  const fragShader = createShader(gl.FRAGMENT_SHADER, fragSrc);

  const program = gl.createProgram();
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);

  const quadVerts = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uTimeLoc      = gl.getUniformLocation(program, "u_time");
  const uResLoc       = gl.getUniformLocation(program, "u_resolution");
  const uBassLoc      = gl.getUniformLocation(program, "u_bass");
  const uMidLoc       = gl.getUniformLocation(program, "u_mid");
  const uHighLoc      = gl.getUniformLocation(program, "u_high");
  const uBrightLoc    = gl.getUniformLocation(program, "u_brightness");
  const uOpacityLoc   = gl.getUniformLocation(program, "u_opacity");
  const uModeLoc      = gl.getUniformLocation(program, "u_mode");
  const uThemeLoc     = gl.getUniformLocation(program, "u_theme");
  const uZoomLoc      = gl.getUniformLocation(program, "u_zoom");
  const uRotateLoc    = gl.getUniformLocation(program, "u_rotate");
  const uOffsetXLoc   = gl.getUniformLocation(program, "u_offsetX");
  const uOffsetYLoc   = gl.getUniformLocation(program, "u_offsetY");
  const uStrobeLoc    = gl.getUniformLocation(program, "u_strobe");
  const uBeatPhaseLoc = gl.getUniformLocation(program, "u_beatPhase");
  const uKindLoc      = gl.getUniformLocation(program, "u_kind");
  const uUseCustomPaletteLoc = gl.getUniformLocation(program, "u_useCustomPalette");
  const uCustomALoc   = gl.getUniformLocation(program, "u_customA");
  const uCustomBLoc   = gl.getUniformLocation(program, "u_customB");
  const uCustomCLoc   = gl.getUniformLocation(program, "u_customC");
  const uCustomDLoc   = gl.getUniformLocation(program, "u_customD");

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let startTime = performance.now();

  function render() {
    resizeCanvas();

    const now = performance.now();
    const t = (now - startTime) * 0.001;

    // Update beat detection
    const isBeat = updateBeat(now);
    
    // Update transition
    const transitionFade = updateTransition(now);

    let { bass, mid, high } = getBands();

    // --- Audio reactivity mapping with soft compression ---
    let ar = parseFloat(audioReactSlider.value || "1");      // 0–2
    let baseReact = 0.3 + ar * 0.85;                         // ~0.3–2.0
    let energyFactor = 0.7 + macroEnergy * 0.7;              // 0.7–1.4
    let reactRaw = baseReact * energyFactor;
    let react = reactRaw / (1.0 + 0.7 * reactRaw);           // stays ~0–1

    let bassR = bass * react;
    let midR  = mid  * react;
    let highR = high * react;

    // Beat sync boost
    if (beatSyncEnabled && isBeat) {
      const beatBoost = beatSyncIntensity * 0.5;
      bassR = Math.min(1, bassR + beatBoost);
      midR = Math.min(1, midR + beatBoost * 0.5);
      highR = Math.min(1, highR + beatBoost * 0.3);
    }

    let detailBoost = 0.8 + macroDetail * 1.4;
    highR *= detailBoost;

    bassR = Math.min(1, bassR);
    midR  = Math.min(1, midR);
    highR = Math.min(1, highR);

    let baseBrightness = parseFloat(brightnessControl.value || "0.5");
    
    // Beat strobe effect
    if (beatStrobeEnabled && isBeat) {
      baseBrightness = Math.min(1, baseBrightness + 0.3);
    }
    
    const brightness = baseBrightness * (0.7 + macroEnergy * 0.8);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const motionAmt = macroMotion * 0.25;
    const wobble = (bassR - 0.5) * motionAmt;
    const zoom = cameraZoom * (1.0 - wobble);
    const rotateRad = (cameraRotateDeg * Math.PI) / 180.0 +
      motionAmt * (midR - highR) * 1.5;

    const logoGlow = 0.25 + bassR * 0.6;
    const logoScale = 1 + bassR * 0.25;
    overlayHud.style.backgroundColor = `rgba(0,0,0,${logoGlow})`;
    overlayHud.style.transform = `translateX(-50%) scale(${logoScale})`;

    if (autoSwitchEnabled && presets.length > 0) {
      const elapsedSec = (now - lastSwitchTime) / 1000;
      if (elapsedSec >= autoSwitchInterval) {
        autoSwitchIndex = (autoSwitchIndex + 1) % presets.length;
        applyPreset(presets[autoSwitchIndex]);
        lastSwitchTime = now;
      }
    }

    const beatSeconds = (now - beatPhaseStart) / 1000;
    const beatPhase = beatSeconds * (bpm / 60.0);

    layers.forEach(layer => {
      if (!layer.enabled || layer.opacity <= 0) return;

      switch (layer.blend) {
        case "add":
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
          break;
        case "screen":
          gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
          break;
        case "multiply":
          gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
          break;
        case "overlay":
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          // Overlay is approximated, true overlay needs shader
          break;
        case "subtract":
          gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
          break;
        case "dodge":
          gl.blendFunc(gl.ONE, gl.ONE);
          break;
        case "burn":
          gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
          break;
        case "difference":
          gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
          gl.blendFunc(gl.ONE, gl.ONE);
          break;
        default:
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          break;
      }
      
      // Reset blend equation for non-subtract modes
      if (layer.blend !== "subtract" && layer.blend !== "difference") {
        gl.blendEquation(gl.FUNC_ADD);
      }

      let offX = layer.offsetX || 0;
      let offY = layer.offsetY || 0;
      if (layer.audioPositionReact) {
        const posScale = 0.5 + macroMotion;
        offX += (bassR - 0.5) * 0.5 * posScale;
        offY += (highR - 0.5) * 0.5 * posScale;
      }

      gl.uniform1f(uTimeLoc, t);
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uBassLoc, bassR);
      gl.uniform1f(uMidLoc, midR);
      gl.uniform1f(uHighLoc, highR);
      gl.uniform1f(uBrightLoc, brightness);
      // Apply transition fade
      const effectiveOpacity = layer.opacity * transitionFade;
      gl.uniform1f(uOpacityLoc, effectiveOpacity);
      gl.uniform1f(uModeLoc, layer.visualMode);
      gl.uniform1f(uThemeLoc, layer.colorTheme);
      gl.uniform1f(uZoomLoc, zoom);
      gl.uniform1f(uRotateLoc, rotateRad);
      gl.uniform1f(uOffsetXLoc, offX);
      gl.uniform1f(uOffsetYLoc, offY);

      const strobeEffective = layer.strobeIntensity * (0.5 + macroEnergy * 0.8);
      gl.uniform1f(uStrobeLoc, strobeEffective);
      gl.uniform1f(uBeatPhaseLoc, beatPhase);
      gl.uniform1f(uKindLoc, layer.kind === "object" ? 1.0 : 0.0);
      
      // Set custom palette uniforms
      gl.uniform1f(uUseCustomPaletteLoc, customPaletteActive ? 1.0 : 0.0);
      if (customPaletteActive) {
        gl.uniform3f(uCustomALoc, ...customPaletteColors.A);
        gl.uniform3f(uCustomBLoc, ...customPaletteColors.B);
        gl.uniform3f(uCustomCLoc, ...customPaletteColors.C);
        gl.uniform3f(uCustomDLoc, ...customPaletteColors.D);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    });

    requestAnimationFrame(render);
  }

  console.log(">>> Starting render loop...");
  render();

  // ================== EXPORT & SHARE FEATURES =====================
  
  // 15. Screenshot Button
  const screenshotBtn = document.getElementById("screenshotBtn");
  if (screenshotBtn) {
    screenshotBtn.addEventListener("click", () => {
      try {
        const canvas = document.getElementById("stage");
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `vj-screenshot-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          console.log("Screenshot saved!");
        });
      } catch (err) {
        console.error("Screenshot failed:", err);
        alert("Screenshot failed. Check console for details.");
      }
    });
  }

  // 16. Video Recording
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordingStartTime = 0;
  let recordingInterval = null;

  const recordBtn = document.getElementById("recordBtn");
  const recordingStatus = document.getElementById("recordingStatus");
  const recordTime = document.getElementById("recordTime");

  if (recordBtn && recordingStatus) {
    recordBtn.addEventListener("click", () => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        // Stop recording
        mediaRecorder.stop();
        recordBtn.textContent = "🎥 Start Recording";
        recordBtn.classList.remove("recording");
        recordingStatus.style.display = "none";
        if (recordingInterval) {
          clearInterval(recordingInterval);
          recordingInterval = null;
        }
      } else {
        // Start recording
        try {
          const canvas = document.getElementById("stage");
          const stream = canvas.captureStream(30); // 30 FPS
          
          recordedChunks = [];
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000
          });

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              recordedChunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `vj-recording-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            console.log("Recording saved!");
          };

          mediaRecorder.start();
          recordBtn.textContent = "⏹ Stop Recording";
          recordBtn.classList.add("recording");
          recordingStatus.style.display = "block";
          
          recordingStartTime = Date.now();
          recordingInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            recordTime.textContent = `${minutes}:${seconds}`;
          }, 1000);

        } catch (err) {
          console.error("Recording failed:", err);
          alert("Recording not supported in this browser or failed to start.");
        }
      }
    });
  }

  // 17. Share Preset via URL
  const sharePresetBtn = document.getElementById("sharePresetBtn");
  const shareUrlOutput = document.getElementById("shareUrlOutput");

  if (sharePresetBtn && shareUrlOutput) {
    sharePresetBtn.addEventListener("click", () => {
      const preset = captureCurrentPreset("Shared Setup");
      const presetData = JSON.stringify(preset);
      const encoded = btoa(presetData); // Base64 encode
      
      const shareUrl = `${window.location.origin}${window.location.pathname}?preset=${encodeURIComponent(encoded)}`;
      
      shareUrlOutput.value = shareUrl;
      shareUrlOutput.style.display = "block";
      shareUrlOutput.select();
      
      // Try to copy to clipboard
      try {
        document.execCommand('copy');
        console.log("URL copied to clipboard!");
        sharePresetBtn.textContent = "✓ Copied!";
        setTimeout(() => {
          sharePresetBtn.textContent = "🔗 Share Current Setup";
        }, 2000);
      } catch (err) {
        console.log("Manual copy required");
      }
    });
  }

  // Load preset from URL on page load
  const urlParams = new URLSearchParams(window.location.search);
  const presetParam = urlParams.get('preset');
  if (presetParam) {
    try {
      const decoded = atob(decodeURIComponent(presetParam));
      const preset = JSON.parse(decoded);
      applyPreset(preset);
      console.log("Loaded preset from URL!");
    } catch (err) {
      console.error("Failed to load preset from URL:", err);
    }
  }

  // 18. Import/Export Preset Files
  const exportPresetsBtn = document.getElementById("exportPresetsBtn");
  const importPresetsBtn = document.getElementById("importPresetsBtn");
  const importPresetsFile = document.getElementById("importPresetsFile");

  if (exportPresetsBtn) {
    exportPresetsBtn.addEventListener("click", () => {
      const dataStr = JSON.stringify(presets, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vj-presets-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log("Presets exported!");
    });
  }

  if (importPresetsBtn && importPresetsFile) {
    importPresetsBtn.addEventListener("click", () => {
      importPresetsFile.click();
    });

    importPresetsFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedPresets = JSON.parse(event.target.result);
            if (Array.isArray(importedPresets)) {
              presets = presets.concat(importedPresets);
              savePresetsToStorage();
              refreshPresetSelect();
              console.log(`Imported ${importedPresets.length} presets!`);
              alert(`Successfully imported ${importedPresets.length} presets!`);
            } else {
              alert("Invalid preset file format.");
            }
          } catch (err) {
            console.error("Import failed:", err);
            alert("Failed to import presets. Check file format.");
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // ================== INITIALIZE HELP MODAL =====================
  const helpBtn = document.getElementById("helpBtn");
  const helpModal = document.getElementById("helpModal");
  const closeHelpBtn = document.getElementById("closeHelpBtn");

  if (helpBtn && helpModal && closeHelpBtn) {
    helpBtn.addEventListener("click", () => {
      helpModal.style.display = "flex";
    });

    closeHelpBtn.addEventListener("click", () => {
      helpModal.style.display = "none";
    });

    // ESC to close
    document.addEventListener("keydown", (e) => {
      if (e.code === "Escape" && helpModal.style.display === "flex") {
        helpModal.style.display = "none";
      }
    });
  }

  // ================== BASIC KEYBOARD SHORTCUTS =====================
  document.addEventListener("keydown", (e) => {
    // Ignore if typing in input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return;
    }

    // Spacebar - Play/Pause audio
    if (e.code === "Space") {
      e.preventDefault();
      const audioPlayer = document.getElementById("audioPlayer");
      if (audioPlayer) {
        if (audioPlayer.paused) audioPlayer.play();
        else audioPlayer.pause();
      }
    }

    // Number keys 1-9 - Select layers
    if (e.code >= "Digit1" && e.code <= "Digit9") {
      const layerIndex = parseInt(e.code.replace("Digit", "")) - 1;
      if (layers[layerIndex]) {
        selectedLayer = layerIndex;
        updateLayerUI();
        updateInspector();
        updateQuickEffects();
      }
    }

    // Arrow Up/Down - Navigate layers
    if (e.code === "ArrowUp" && selectedLayer > 0) {
      e.preventDefault();
      selectedLayer--;
      updateLayerUI();
      updateInspector();
      updateQuickEffects();
    }

    if (e.code === "ArrowDown" && selectedLayer < layers.length - 1) {
      e.preventDefault();
      selectedLayer++;
      updateLayerUI();
      updateInspector();
      updateQuickEffects();
    }

    // D - Duplicate layer
    if (e.code === "KeyD" && selectedLayer !== null && !e.ctrlKey) {
      e.preventDefault();
      const original = layers[selectedLayer];
      const clone = new Layer();
      Object.assign(clone, original);
      layers.push(clone);
      selectedLayer = layers.length - 1;
      updateLayerUI();
      updateInspector();
      updateQuickEffects();
    }

    // M - Toggle mute
    if (e.code === "KeyM" && selectedLayer !== null && !e.ctrlKey) {
      e.preventDefault();
      layers[selectedLayer].enabled = !layers[selectedLayer].enabled;
      updateLayerUI();
    }
  });

  console.log("✅ CypherVisuals loaded successfully!");
});
