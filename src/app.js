class FerriteSimulatorApp {
  constructor() {
    this.memory = new FerriteCoreMemory(8, 8);
    this.currentMode = 'read';
    this.animationSpeed = 800;
    this.isAnimating = false;
    this.operationQueue = [];
    this.architecture = FerriteCoreMemory.ARCHITECTURES.custom;
    
    this.gridConfig = {
      coreRadius: 22,
      coreSpacing: 60,
      offsetX: 80,
      offsetY: 80,
      wireOffset: 35
    };
    
    this.colors = {
      state0: '#444466',
      state1: '#00ff88',
      wire: '#555555',
      active: '#ffaa00',
      bg: '#1a1a2e'
    };
    
    this.visibility = {
      xWires: true,
      yWires: true,
      senseWire: true,
      labels: true
    };
    
    this.init();
  }
  
  init() {
    this.cacheDOMElements();
    this.bindEvents();
    this.applyColors();
    this.renderGrid();
    this.updateMemoryDisplay();
    this.updateWordDisplay();
    this.memory.addListener(this.handleMemoryEvent.bind(this));
  }
  
  cacheDOMElements() {
    this.svg = document.getElementById('memory-grid');
    this.wiresLayer = document.getElementById('wires-layer');
    this.coresLayer = document.getElementById('cores-layer');
    this.currentLayer = document.getElementById('current-layer');
    this.labelsLayer = document.getElementById('labels-layer');
    this.tooltip = document.getElementById('core-tooltip');
    
    this.modeButtons = document.querySelectorAll('.mode-btn');
    this.btnReset = document.getElementById('btn-reset');
    this.btnRandomize = document.getElementById('btn-randomize');
    this.btnStep = document.getElementById('btn-step');
    this.btnApplyGrid = document.getElementById('btn-apply-grid');
    this.btnExport = document.getElementById('btn-export');
    this.btnImport = document.getElementById('btn-import');
    this.importFile = document.getElementById('import-file');
    
    this.speedSlider = document.getElementById('animation-speed');
    this.speedDisplay = document.getElementById('speed-display');
    
    this.archSelect = document.getElementById('arch-preset');
    this.archDetails = document.getElementById('arch-details');
    
    this.gridWidth = document.getElementById('grid-width');
    this.gridHeight = document.getElementById('grid-height');
    this.coreRadius = document.getElementById('core-radius');
    this.coreSpacing = document.getElementById('core-spacing');
    this.wordSize = document.getElementById('word-size');
    this.radiusDisplay = document.getElementById('radius-display');
    this.spacingDisplay = document.getElementById('spacing-display');
    
    this.colorState0 = document.getElementById('color-state0');
    this.colorState1 = document.getElementById('color-state1');
    this.colorWire = document.getElementById('color-wire');
    this.colorActive = document.getElementById('color-active');
    this.colorBg = document.getElementById('color-bg');
    
    this.showXWires = document.getElementById('show-x-wires');
    this.showYWires = document.getElementById('show-y-wires');
    this.showSense = document.getElementById('show-sense');
    this.showLabels = document.getElementById('show-labels');
    
    this.binaryInput = document.getElementById('binary-input');
    this.hexInput = document.getElementById('hex-input');
    this.decimalInput = document.getElementById('decimal-input');
    this.wordCount = document.getElementById('word-count');
    this.wordBreakdown = document.getElementById('word-breakdown');
    
    this.ioTextarea = document.getElementById('io-textarea');
    
    this.logEntries = document.getElementById('log-entries');
    this.physicsText = document.getElementById('physics-text');
  }
  
  bindEvents() {
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
    });
    
    this.btnReset.addEventListener('click', () => this.memory.reset());
    this.btnRandomize.addEventListener('click', () => this.memory.randomize());
    this.btnStep.addEventListener('click', () => this.executeStep());
    this.btnApplyGrid.addEventListener('click', () => this.applyGridConfig());
    this.btnExport.addEventListener('click', () => this.exportState());
    this.btnImport.addEventListener('click', () => this.importFile.click());
    this.importFile.addEventListener('change', (e) => this.importState(e));
    
    this.speedSlider.addEventListener('input', (e) => {
      this.animationSpeed = parseInt(e.target.value);
      this.speedDisplay.textContent = `${this.animationSpeed}ms`;
    });
    
    this.archSelect.addEventListener('change', () => this.loadArchitecture());
    
    this.coreRadius.addEventListener('input', (e) => {
      this.radiusDisplay.textContent = e.target.value;
    });
    
    this.coreSpacing.addEventListener('input', (e) => {
      this.spacingDisplay.textContent = e.target.value;
    });
    
    [this.colorState0, this.colorState1, this.colorWire, this.colorActive, this.colorBg].forEach(input => {
      input.addEventListener('input', () => this.applyColors());
    });
    
    [this.showXWires, this.showYWires, this.showSense, this.showLabels].forEach(input => {
      input.addEventListener('change', () => this.applyVisibility());
    });
    
    this.binaryInput.addEventListener('change', () => this.updateFromBinary());
    this.hexInput.addEventListener('change', () => this.updateFromHex());
    this.decimalInput.addEventListener('change', () => this.updateFromDecimal());
    
    this.wordSize.addEventListener('change', () => this.updateWordDisplay());
  }
  
  loadArchitecture() {
    const key = this.archSelect.value;
    const arch = FerriteCoreMemory.ARCHITECTURES[key];
    if (!arch) return;
    
    this.architecture = arch;
    
    this.gridWidth.value = arch.width;
    this.gridHeight.value = arch.height;
    this.wordSize.value = arch.wordSize;
    
    this.applyGridConfig();
    this.renderArchDetails(arch);
  }
  
  renderArchDetails(arch) {
    this.archDetails.innerHTML = `
      <div><strong>System:</strong> ${arch.name}</div>
      <div><strong>Year:</strong> ${arch.year || 'N/A'}</div>
      <div><strong>Manufacturer:</strong> ${arch.manufacturer}</div>
      <div><strong>Memory:</strong> ${arch.memorySize}</div>
      <div><strong>Word Size:</strong> ${arch.wordSize} bits</div>
      <div><strong>Cycle Time:</strong> ${arch.cycleTime}</div>
      <div style="margin-top:8px"><strong>Description:</strong> ${arch.description}</div>
      <div style="margin-top:8px;color:#e94560"><strong>Significance:</strong> ${arch.significance}</div>
    `;
  }
  
  applyGridConfig() {
    const width = parseInt(this.gridWidth.value) || 8;
    const height = parseInt(this.gridHeight.value) || 8;
    this.gridConfig.coreRadius = parseInt(this.coreRadius.value) || 22;
    this.gridConfig.coreSpacing = parseInt(this.coreSpacing.value) || 60;
    
    this.memory.resize(width, height);
    this.renderGrid();
    this.updateMemoryDisplay();
    this.updateWordDisplay();
  }
  
  applyColors() {
    this.colors.state0 = this.colorState0.value;
    this.colors.state1 = this.colorState1.value;
    this.colors.wire = this.colorWire.value;
    this.colors.active = this.colorActive.value;
    this.colors.bg = this.colorBg.value;
    
    document.documentElement.style.setProperty('--state0-color', this.colors.state0);
    document.documentElement.style.setProperty('--state1-color', this.colors.state1);
    document.documentElement.style.setProperty('--wire-color', this.colors.wire);
    document.documentElement.style.setProperty('--active-color', this.colors.active);
    document.documentElement.style.setProperty('--bg-color', this.colors.bg);
    
    document.body.style.background = this.colors.bg;
  }
  
  applyVisibility() {
    this.visibility.xWires = this.showXWires.checked;
    this.visibility.yWires = this.showYWires.checked;
    this.visibility.senseWire = this.showSense.checked;
    this.visibility.labels = this.showLabels.checked;
    this.renderGrid();
  }
  
  setMode(mode) {
    this.currentMode = mode;
    this.modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    const explanations = {
      read: '<p><strong>Read Mode:</strong> Click a core to read its value. The read operation is destructive - the bit will be cleared to 0 after reading. A sense wire detects if the core was originally 1.</p>',
      write0: '<p><strong>Write 0 Mode:</strong> Click a core to write 0. An inhibit line activates to cancel the Y-axis current at the selected core, preventing it from flipping.</p>',
      write1: '<p><strong>Write 1 Mode:</strong> Click a core to write 1. Coincident current on X and Y lines provides enough energy to flip the core to the 1 state.</p>'
    };
    
    this.physicsText.innerHTML = explanations[mode];
  }
  
  renderGrid() {
    this.wiresLayer.innerHTML = '';
    this.coresLayer.innerHTML = '';
    this.currentLayer.innerHTML = '';
    this.labelsLayer.innerHTML = '';
    
    const { coreRadius, coreSpacing, offsetX, offsetY, wireOffset } = this.gridConfig;
    const width = this.memory.width;
    const height = this.memory.height;
    
    const svgWidth = offsetX * 2 + (width - 1) * coreSpacing;
    const svgHeight = offsetY * 2 + (height - 1) * coreSpacing;
    this.svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    
    if (this.visibility.xWires || this.visibility.yWires) {
      this.renderWires(width, height, coreSpacing, offsetX, offsetY, wireOffset);
    }
    this.renderCores(width, height, coreRadius, coreSpacing, offsetX, offsetY);
    if (this.visibility.labels) {
      this.renderLabels(width, height, coreSpacing, offsetX, offsetY);
    }
    if (this.visibility.senseWire) {
      this.renderSenseWire(width, height, coreSpacing, offsetX, offsetY);
    }
  }
  
  renderWires(width, height, spacing, offsetX, offsetY, wireOffset) {
    if (this.visibility.xWires) {
      for (let x = 0; x < width; x++) {
        const xPos = offsetX + x * spacing;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', xPos);
        line.setAttribute('y1', offsetY - wireOffset);
        line.setAttribute('x2', xPos);
        line.setAttribute('y2', offsetY + (height - 1) * spacing + wireOffset);
        line.setAttribute('class', 'wire-x');
        line.setAttribute('data-x', x);
        this.wiresLayer.appendChild(line);
      }
    }
    
    if (this.visibility.yWires) {
      for (let y = 0; y < height; y++) {
        const yPos = offsetY + y * spacing;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', offsetX - wireOffset);
        line.setAttribute('y1', yPos);
        line.setAttribute('x2', offsetX + (width - 1) * spacing + wireOffset);
        line.setAttribute('y2', yPos);
        line.setAttribute('class', 'wire-y');
        line.setAttribute('data-y', y);
        this.wiresLayer.appendChild(line);
      }
    }
  }
  
  renderCores(width, height, radius, spacing, offsetX, offsetY) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cx = offsetX + x * spacing;
        const cy = offsetY + y * spacing;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'core-group');
        group.setAttribute('data-x', x);
        group.setAttribute('data-y', y);
        group.addEventListener('click', () => this.handleCoreClick(x, y));
        group.addEventListener('mouseenter', (e) => this.showTooltip(e, x, y));
        group.addEventListener('mouseleave', () => this.hideTooltip());
        
        const torus = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        torus.setAttribute('cx', cx);
        torus.setAttribute('cy', cy);
        torus.setAttribute('r', radius);
        torus.setAttribute('class', 'core-torus state-0');
        torus.setAttribute('id', `core-${x}-${y}`);
        
        const hole = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hole.setAttribute('cx', cx);
        hole.setAttribute('cy', cy);
        hole.setAttribute('r', radius * 0.5);
        hole.setAttribute('fill', this.colors.bg);
        
        group.appendChild(torus);
        group.appendChild(hole);
        this.coresLayer.appendChild(group);
      }
    }
    this.updateCoreVisuals();
  }
  
  renderLabels(width, height, spacing, offsetX, offsetY) {
    for (let x = 0; x < width; x++) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', offsetX + x * spacing);
      text.setAttribute('y', offsetY - 50);
      text.setAttribute('class', 'grid-label');
      text.textContent = `X${x}`;
      this.labelsLayer.appendChild(text);
    }
    
    for (let y = 0; y < height; y++) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', offsetX - 50);
      text.setAttribute('y', offsetY + y * spacing + 5);
      text.setAttribute('class', 'grid-label');
      text.textContent = `Y${y}`;
      this.labelsLayer.appendChild(text);
    }
  }
  
  renderSenseWire(width, height, spacing, offsetX, offsetY) {
    let path = 'M';
    let first = true;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cx = offsetX + x * spacing;
        const cy = offsetY + y * spacing;
        if (first) {
          path += `${cx - 15},${cy}`;
          first = false;
        }
        path += ` L${cx},${cy}`;
      }
    }
    
    const senseWire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    senseWire.setAttribute('d', path);
    senseWire.setAttribute('class', 'sense-wire');
    this.wiresLayer.appendChild(senseWire);
  }
  
  handleCoreClick(x, y) {
    if (this.isAnimating) return;
    
    switch (this.currentMode) {
      case 'read':
        this.startOperation(() => this.memory.read(x, y));
        break;
      case 'write0':
        this.startOperation(() => this.memory.write(x, y, 0));
        break;
      case 'write1':
        this.startOperation(() => this.memory.write(x, y, 1));
        break;
    }
  }
  
  startOperation(operationFn) {
    operationFn();
    
    if (this.memory.currentOperation) {
      this.isAnimating = true;
      this.btnStep.disabled = false;
      this.operationQueue = [...this.memory.currentOperation.steps];
      this.memory.currentOperation.currentStep = 0;
      this.executeStep();
    }
  }
  
  executeStep() {
    if (!this.memory.currentOperation || this.memory.currentOperation.currentStep >= this.memory.currentOperation.steps.length) {
      this.finishAnimation();
      return;
    }
    
    const step = this.memory.currentOperation.steps[this.memory.currentOperation.currentStep];
    this.visualizeStep(step);
    
    const hasMore = this.memory.nextOperationStep();
    
    if (hasMore) {
      setTimeout(() => this.executeStep(), this.animationSpeed);
    } else {
      setTimeout(() => this.finishAnimation(), this.animationSpeed);
    }
  }
  
  visualizeStep(step) {
    this.clearVisualEffects();
    
    if (step.activeX >= 0 && this.visibility.xWires) {
      const wireX = this.wiresLayer.querySelector(`[data-x="${step.activeX}"]`);
      if (wireX) wireX.classList.add('wire-active');
    }
    
    if (step.activeY >= 0 && this.visibility.yWires) {
      const wireY = this.wiresLayer.querySelector(`[data-y="${step.activeY}"]`);
      if (wireY) wireY.classList.add('wire-active');
    }
    
    if (step.activeX >= 0 && step.activeY >= 0) {
      const core = document.getElementById(`core-${step.activeX}-${step.activeY}`);
      if (core) core.classList.add('selected');
      
      if (step.flip) {
        this.animateCoreFlip(step.activeX, step.activeY);
      }
    }
    
    if (step.inhibit) {
      this.showInhibitLine(step.activeX, step.activeY);
    }
    
    if (step.sense) {
      this.showSensePulse(step.activeX, step.activeY);
    }
    
    this.showStepDescription(step.description);
  }
  
  animateCoreFlip(x, y) {
    const core = document.getElementById(`core-${x}-${y}`);
    if (!core) return;
    
    const operation = this.memory.currentOperation;
    const newState = operation.type === 'read' ? 0 : (operation.type === 'write1' ? 1 : 0);
    
    setTimeout(() => {
      core.classList.remove('state-0', 'state-1');
      core.classList.add(`state-${newState}`);
    }, this.animationSpeed / 2);
  }
  
  showInhibitLine(x, y) {
    const { coreSpacing, offsetX, offsetY } = this.gridConfig;
    const cx = offsetX + x * coreSpacing;
    const cy = offsetY + y * coreSpacing;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', cx - 40);
    line.setAttribute('y1', cy);
    line.setAttribute('x2', cx + 40);
    line.setAttribute('y2', cy);
    line.setAttribute('class', 'inhibit-line active');
    this.currentLayer.appendChild(line);
  }
  
  showSensePulse(x, y) {
    const { coreSpacing, offsetX, offsetY } = this.gridConfig;
    const cx = offsetX + x * coreSpacing;
    const cy = offsetY + y * coreSpacing;
    
    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pulse.setAttribute('cx', cx + 30);
    pulse.setAttribute('cy', cy - 30);
    pulse.setAttribute('r', 5);
    pulse.setAttribute('class', 'sense-pulse active');
    this.currentLayer.appendChild(pulse);
    
    setTimeout(() => pulse.remove(), 1000);
  }
  
  clearVisualEffects() {
    this.wiresLayer.querySelectorAll('.wire-active').forEach(el => el.classList.remove('wire-active'));
    this.coresLayer.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    this.currentLayer.innerHTML = '';
  }
  
  showStepDescription(description) {
    const statusDiv = this.physicsText.querySelector('.operation-status');
    if (statusDiv) statusDiv.remove();
    
    const div = document.createElement('div');
    div.className = 'operation-status';
    div.innerHTML = `<span class="step-description">${description}</span>`;
    this.physicsText.appendChild(div);
  }
  
  finishAnimation() {
    this.isAnimating = false;
    this.btnStep.disabled = true;
    this.clearVisualEffects();
    this.updateMemoryDisplay();
    
    const statusDiv = this.physicsText.querySelector('.operation-status');
    if (statusDiv) statusDiv.remove();
  }
  
  showTooltip(event, x, y) {
    const state = this.memory.peek(x, y);
    this.tooltip.querySelector('.tooltip-coords').textContent = `[${x},${y}]`;
    this.tooltip.querySelector('.tooltip-state').textContent = `State: ${state}`;
    this.tooltip.classList.remove('hidden');
    
    const rect = this.svg.getBoundingClientRect();
    this.tooltip.style.left = `${event.clientX - rect.left + 15}px`;
    this.tooltip.style.top = `${event.clientY - rect.top - 30}px`;
  }
  
  hideTooltip() {
    this.tooltip.classList.add('hidden');
  }
  
  handleMemoryEvent(event) {
    switch (event.type) {
      case 'read':
        this.logOperation(`Read [${event.x},${event.y}]: Value = ${event.value} (destructive)`);
        break;
      case 'write':
        this.logOperation(`Write [${event.x},${event.y}]: ${event.value} (was ${event.previousState})`);
        break;
      case 'reset':
        this.logOperation('Reset all cores to 0');
        this.updateCoreVisuals();
        break;
      case 'randomize':
        this.logOperation('Randomized all core states');
        this.updateCoreVisuals();
        break;
      case 'resize':
        this.logOperation(`Resized grid to ${event.width}x${event.height}`);
        break;
      case 'bulkUpdate':
        this.updateCoreVisuals();
        break;
      case 'stateChange':
        this.updateCoreVisuals();
        break;
    }
    
    this.updateMemoryDisplay();
    this.updateWordDisplay();
  }
  
  updateCoreVisuals() {
    const states = this.memory.getAllStates();
    states.forEach(({ x, y, state }) => {
      const core = document.getElementById(`core-${x}-${y}`);
      if (core) {
        core.classList.remove('state-0', 'state-1');
        core.classList.add(`state-${state}`);
      }
    });
  }
  
  updateMemoryDisplay() {
    const binary = this.memory.toBinaryString();
    const hex = this.memory.toHexString();
    const decimal = this.memory.toDecimal();
    
    this.binaryInput.value = binary;
    this.hexInput.value = hex;
    this.decimalInput.value = decimal;
  }
  
  updateFromBinary() {
    const value = this.binaryInput.value.replace(/[^01]/g, '');
    if (value) {
      this.memory.fromBinaryString(value);
      this.updateMemoryDisplay();
      this.updateWordDisplay();
    }
  }
  
  updateFromHex() {
    const value = this.hexInput.value.replace(/[^0-9A-Fa-f]/g, '');
    if (value) {
      this.memory.fromHexString(value);
      this.updateMemoryDisplay();
      this.updateWordDisplay();
    }
  }
  
  updateFromDecimal() {
    const value = this.decimalInput.value.replace(/[^0-9]/g, '');
    if (value) {
      this.memory.fromDecimal(value);
      this.updateMemoryDisplay();
      this.updateWordDisplay();
    }
  }
  
  updateWordDisplay() {
    const wordSize = parseInt(this.wordSize.value) || 8;
    const binary = this.memory.toBinaryString();
    const totalBits = this.memory.width * this.memory.height;
    const numWords = Math.ceil(totalBits / wordSize);
    
    this.wordCount.textContent = numWords;
    this.wordBreakdown.innerHTML = '';
    
    for (let i = 0; i < numWords; i++) {
      const start = i * wordSize;
      const end = Math.min(start + wordSize, totalBits);
      const wordBits = binary.slice(start, end).padEnd(wordSize, '0');
      const wordHex = parseInt(wordBits, 2).toString(16).toUpperCase().padStart(Math.ceil(wordSize / 4), '0');
      const wordDec = parseInt(wordBits, 2);
      
      const item = document.createElement('div');
      item.className = 'word-item';
      item.title = `Word ${i}: ${wordBits}`;
      item.textContent = wordHex;
      this.wordBreakdown.appendChild(item);
    }
  }
  
  exportState() {
    const state = this.memory.exportState();
    state.architecture = this.archSelect.value;
    state.colors = this.colors;
    state.gridConfig = this.gridConfig;
    state.wordSize = parseInt(this.wordSize.value);
    
    const json = JSON.stringify(state, null, 2);
    this.ioTextarea.value = json;
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferrite-memory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    this.logOperation('Exported memory state to JSON');
  }
  
  importState(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target.result);
        this.memory.importState(state);
        
        if (state.colors) {
          this.colorState0.value = state.colors.state0;
          this.colorState1.value = state.colors.state1;
          this.colorWire.value = state.colors.wire;
          this.colorActive.value = state.colors.active;
          this.colorBg.value = state.colors.bg;
          this.applyColors();
        }
        
        if (state.gridConfig) {
          this.gridConfig = { ...this.gridConfig, ...state.gridConfig };
          this.coreRadius.value = this.gridConfig.coreRadius;
          this.coreSpacing.value = this.gridConfig.coreSpacing;
          this.radiusDisplay.textContent = this.gridConfig.coreRadius;
          this.spacingDisplay.textContent = this.gridConfig.coreSpacing;
        }
        
        if (state.wordSize) {
          this.wordSize.value = state.wordSize;
        }
        
        if (state.architecture) {
          this.archSelect.value = state.architecture;
          this.loadArchitecture();
        } else {
          this.renderGrid();
          this.updateMemoryDisplay();
          this.updateWordDisplay();
        }
        
        this.ioTextarea.value = JSON.stringify(state, null, 2);
        this.logOperation('Imported memory state from JSON');
      } catch (err) {
        this.logOperation(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }
  
  logOperation(message) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${this.currentMode === 'read' ? 'read' : 'write'}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.logEntries.insertBefore(entry, this.logEntries.firstChild);
    
    while (this.logEntries.children.length > 50) {
      this.logEntries.removeChild(this.logEntries.lastChild);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.simulator = new FerriteSimulatorApp();
});
