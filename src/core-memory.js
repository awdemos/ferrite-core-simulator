/**
 * Ferrite Core Memory Physics Engine
 * 
 * Simulates the magnetic behavior of ferrite core memory:
 * - Grid of toroidal ferrite cores
 * - Coincident-current addressing (half-current on X and Y)
 * - Destructive read operation
 * - Inhibit line for selective writing
 * - Sense wire for state detection
 */

class FerriteCoreMemory {
  constructor(width = 8, height = 8) {
    this.width = width;
    this.height = height;
    this.cores = [];
    this.listeners = [];
    this.currentOperation = null;
    this.operationStep = 0;
    this.senseOutput = null;
    this.activeX = -1;
    this.activeY = -1;
    this.inhibitActive = false;
    this.initCores();
  }

  initCores() {
    this.cores = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push({ x, y, state: 0, magneticField: 0 });
      }
      this.cores.push(row);
    }
  }

  resize(width, height) {
    const oldStates = this.getAllStates();
    this.width = Math.max(2, Math.min(16, width));
    this.height = Math.max(2, Math.min(16, height));
    this.initCores();
    this.currentOperation = null;
    for (const { x, y, state } of oldStates) {
      if (x < this.width && y < this.height) {
        this.cores[y][x].state = state;
      }
    }
    this.notify({ type: 'resize', width: this.width, height: this.height });
  }
  
  addListener(listener) {
    this.listeners.push(listener);
  }
  
  notify(event) {
    this.listeners.forEach(listener => listener(event));
  }
  
  /**
   * Read a bit from the specified address
   * Destructive read - the bit is cleared to 0
   * 
   * Physics:
   * 1. Apply half-current to X line
   * 2. Apply half-current to Y line  
   * 3. Selected core gets full current, flips to 0
   * 4. If core was 1, sense wire detects magnetic flux change
   * 5. Return original value
   */
  read(x, y) {
    if (!this.isValidAddress(x, y)) {
      throw new Error(`Invalid address: (${x}, ${y})`);
    }
    
    const core = this.cores[y][x];
    const originalState = core.state;
    
    this.currentOperation = {
      type: 'read',
      x, y,
      originalState,
      steps: [
        { description: 'Apply half-current to X line', activeX: x, activeY: -1, inhibit: false },
        { description: 'Apply half-current to Y line', activeX: x, activeY: y, inhibit: false },
        { description: 'Core receives full current, flips to 0', activeX: x, activeY: y, inhibit: false, flip: true },
        { description: originalState === 1 ? 'Sense wire detects pulse!' : 'Sense wire: no pulse', activeX: x, activeY: y, inhibit: false, sense: originalState === 1 }
      ],
      currentStep: 0
    };
    
    core.state = 0;
    this.senseOutput = originalState;
    
    this.notify({
      type: 'read',
      x, y,
      value: originalState,
      operation: this.currentOperation
    });
    
    return originalState;
  }
  
  /**
   * Write a bit to the specified address
   * 
   * Physics:
   * 1. To write 1: Apply half-current to X and Y (core flips to 1)
   *    Note: In real memory, writing 1 requires the core to be in 0 state first
   *    (due to hysteresis loop asymmetry). For simulation, we just set it.
   * 2. To write 0: Apply half-current to X and Y, plus inhibit current
   *    Inhibit current opposes Y current, so selected core only gets I/2 (no flip)
   *    Other cores on X line get I/2 - I_inhibit (no flip)
   *    Other cores on Y line get I/2 (no flip)
   */
  write(x, y, value) {
    if (!this.isValidAddress(x, y)) {
      throw new Error(`Invalid address: (${x}, ${y})`);
    }
    
    if (value !== 0 && value !== 1) {
      throw new Error(`Invalid value: ${value}. Must be 0 or 1.`);
    }
    
    const core = this.cores[y][x];
    const previousState = core.state;
    
    if (value === 1) {
      this.currentOperation = {
        type: 'write1',
        x, y,
        previousState,
        steps: [
          { description: 'Apply half-current to X line', activeX: x, activeY: -1, inhibit: false },
          { description: 'Apply half-current to Y line', activeX: x, activeY: y, inhibit: false },
          { description: 'Core receives full current, flips to 1', activeX: x, activeY: y, inhibit: false, flip: true }
        ],
        currentStep: 0
      };
      
      core.state = 1;
    } else {
      this.currentOperation = {
        type: 'write0',
        x, y,
        previousState,
        steps: [
          { description: 'Apply half-current to X line', activeX: x, activeY: -1, inhibit: false },
          { description: 'Apply half-current to Y line', activeX: x, activeY: y, inhibit: false },
          { description: 'Activate inhibit line', activeX: x, activeY: y, inhibit: true },
          { description: 'Inhibit current cancels Y current at selected core', activeX: x, activeY: y, inhibit: true },
          { description: 'Core stays at 0 (not enough current to flip)', activeX: x, activeY: y, inhibit: true }
        ],
        currentStep: 0
      };
      
      core.state = 0;
    }
    
    this.notify({
      type: 'write',
      x, y,
      value,
      previousState,
      operation: this.currentOperation
    });
  }
  
  peek(x, y) {
    if (!this.isValidAddress(x, y)) return null;
    return this.cores[y][x].state;
  }
  
  reset() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cores[y][x].state = 0;
      }
    }
    this.currentOperation = null;
    this.senseOutput = null;
    this.activeX = -1;
    this.activeY = -1;
    this.inhibitActive = false;
    
    this.notify({ type: 'reset' });
  }
  
  randomize() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cores[y][x].state = Math.random() > 0.5 ? 1 : 0;
      }
    }
    this.currentOperation = null;
    
    this.notify({ type: 'randomize' });
  }
  
  getAllStates() {
    const states = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        states.push({
          x, y,
          state: this.cores[y][x].state
        });
      }
    }
    return states;
  }
  
  toBinaryString() {
    let binary = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        binary += this.cores[y][x].state;
      }
    }
    return binary;
  }
  
  toHexString() {
    const binary = this.toBinaryString();
    let hex = '';
    for (let i = 0; i < binary.length; i += 4) {
      const nibble = binary.slice(i, i + 4);
      hex += parseInt(nibble, 2).toString(16).toUpperCase();
    }
    return hex;
  }
  
  toDecimal() {
    return parseInt(this.toBinaryString(), 2);
  }
  
  isValidAddress(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  
  /**
   * Advance operation animation to next step.
   * Returns true if there are more steps to execute.
   */
  nextOperationStep() {
    if (!this.currentOperation) return false;
    
    const step = this.currentOperation.steps[this.currentOperation.currentStep];
    if (step) {
      this.activeX = step.activeX;
      this.activeY = step.activeY;
      this.inhibitActive = step.inhibit || false;
      
      if (step.flip) {
        const core = this.cores[this.currentOperation.y][this.currentOperation.x];
        core.magneticField = 1;
      }
    }
    
    this.currentOperation.currentStep++;
    
    if (this.currentOperation.currentStep >= this.currentOperation.steps.length) {
      this.activeX = -1;
      this.activeY = -1;
      this.inhibitActive = false;
      
      setTimeout(() => {
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            this.cores[y][x].magneticField = 0;
          }
        }
      }, 500);
      
      return false;
    }
    
    return true;
  }
  
  getCurrentStepDescription() {
    if (!this.currentOperation) return null;
    const step = this.currentOperation.steps[this.currentOperation.currentStep];
    return step ? step.description : null;
  }

  setState(x, y, state) {
    if (!this.isValidAddress(x, y)) return false;
    this.cores[y][x].state = state ? 1 : 0;
    this.notify({ type: 'stateChange', x, y, state: this.cores[y][x].state });
    return true;
  }

  fromBinaryString(binary) {
    const maxBits = this.width * this.height;
    const padded = binary.padStart(maxBits, '0').slice(-maxBits);
    let idx = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cores[y][x].state = padded[idx] === '1' ? 1 : 0;
        idx++;
      }
    }
    this.notify({ type: 'bulkUpdate' });
  }

  fromHexString(hex) {
    const binary = hex.split('').map(h => parseInt(h, 16).toString(2).padStart(4, '0')).join('');
    this.fromBinaryString(binary);
  }

  fromDecimal(decimal) {
    const binary = BigInt(decimal).toString(2);
    this.fromBinaryString(binary);
  }

  exportState() {
    return {
      width: this.width,
      height: this.height,
      binary: this.toBinaryString(),
      hex: this.toHexString(),
      decimal: this.toDecimal()
    };
  }

  importState(state) {
    if (state.width && state.height) {
      this.resize(state.width, state.height);
    }
    if (state.binary) {
      this.fromBinaryString(state.binary);
    } else if (state.hex) {
      this.fromHexString(state.hex);
    }
    this.notify({ type: 'bulkUpdate' });
  }
}

FerriteCoreMemory.ARCHITECTURES = {
  'agc': {
    name: 'Apollo Guidance Computer',
    year: 1966,
    manufacturer: 'MIT Instrumentation Lab / Raytheon',
    width: 16,
    height: 16,
    wordSize: 16,
    memorySize: '4,096 words',
    cycleTime: '11.7 μs',
    description: 'Used in Apollo missions. Core rope memory for fixed data, erasable core for variables. First computer to use integrated circuits.',
    significance: 'First computer to guide humans to the Moon and back'
  },
  'whirlwind': {
    name: 'Whirlwind I',
    year: 1953,
    manufacturer: 'MIT Lincoln Laboratory',
    width: 16,
    height: 8,
    wordSize: 16,
    memorySize: '1,024 words',
    cycleTime: '8 μs',
    description: 'First computer to use magnetic core memory. Developed by Jay Forrester. Real-time processing for air defense.',
    significance: 'Birth of core memory technology; foundation for all modern RAM'
  },
  'ibm704': {
    name: 'IBM 704',
    year: 1954,
    manufacturer: 'IBM',
    width: 16,
    height: 16,
    wordSize: 36,
    memorySize: '32,768 words',
    cycleTime: '12 μs',
    description: 'First mass-produced computer with floating-point hardware. Used Fortran compiler. Core memory replaced CRT storage.',
    significance: 'Introduced floating-point arithmetic; Fortran programming language'
  },
  'pdp1': {
    name: 'DEC PDP-1',
    year: 1960,
    manufacturer: 'Digital Equipment Corporation',
    width: 16,
    height: 8,
    wordSize: 18,
    memorySize: '4,096 words',
    cycleTime: '5 μs',
    description: 'First commercial minicomputer. Used in early hacker culture at MIT. Spacewar! game created on this machine.',
    significance: 'Pioneered interactive computing and hacker culture'
  },
  'cdc6600': {
    name: 'CDC 6600',
    year: 1964,
    manufacturer: 'Control Data Corporation',
    width: 16,
    height: 16,
    wordSize: 60,
    memorySize: '131,072 words',
    cycleTime: '1 μs',
    description: 'Designed by Seymour Cray. Fastest computer in the world 1964-1969. Ten peripheral processors with one central processor.',
    significance: 'World\'s fastest supercomputer for 5 years; Cray\'s masterpiece'
  },
  'univac1107': {
    name: 'UNIVAC 1107',
    year: 1962,
    manufacturer: 'Sperry Rand',
    width: 16,
    height: 12,
    wordSize: 36,
    memorySize: '65,536 words',
    cycleTime: '4 μs',
    description: 'First commercial computer with thin-film memory. Used in military and scientific computing.',
    significance: 'Advanced thin-film memory technology for its era'
  },
  'ibm360': {
    name: 'IBM System/360 Model 50',
    year: 1964,
    manufacturer: 'IBM',
    width: 16,
    height: 16,
    wordSize: 32,
    memorySize: '262,144 bytes',
    cycleTime: '2 μs',
    description: 'Part of IBM\'s revolutionary System/360 family. Compatible instruction set across models. Microprogrammed control.',
    significance: 'Unified computing architecture; software compatibility across hardware'
  },
  'tx2': {
    name: 'MIT Lincoln Lab TX-2',
    year: 1958,
    manufacturer: 'MIT Lincoln Laboratory',
    width: 16,
    height: 16,
    wordSize: 36,
    memorySize: '65,536 words',
    cycleTime: '6 μs',
    description: 'Advanced transistor computer with massive core memory. Used for early computer graphics research by Ivan Sutherland.',
    significance: 'Sketchpad system pioneered interactive computer graphics and CAD'
  },
  'custom': {
    name: 'Custom Configuration',
    year: null,
    manufacturer: 'User Defined',
    width: 8,
    height: 8,
    wordSize: 8,
    memorySize: 'User defined',
    cycleTime: 'Variable',
    description: 'Configure your own core memory array. Adjust dimensions, word size, and visual parameters.',
    significance: 'Explore core memory at any scale'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FerriteCoreMemory;
}
