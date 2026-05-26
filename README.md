# Ferrite Core Memory Simulator

Interactive web-based simulation of magnetic core memory technology used in computers from the 1950s through the 1970s.

![Simulator Screenshot](docs/screenshot.png)

## Overview

This simulator recreates the physics and operation of ferrite core memory - the dominant form of random-access memory before semiconductor RAM. Each tiny toroidal ferrite core stores one bit via clockwise or counter-clockwise magnetization. The simulator models coincident-current addressing, destructive read operations, inhibit lines for selective writing, and sense wire detection.

## Features

### Core Simulation
- **Destructive Read** - Reading a bit clears it to 0 (true to historical hardware)
- **Coincident-Current Addressing** - Half-current on X and Y lines selects one core
- **Inhibit Line** - Cancels Y-axis current to prevent flipping during Write 0
- **Sense Wire** - Detects magnetic flux change when a core flips from 1 to 0
- **Step-by-Step Animation** - Visualize current pulses traveling through wires

### Historical Architecture Presets
Load configurations from historically significant computers:

| System | Year | Words | Word Size | Cycle Time |
|--------|------|-------|-----------|------------|
| Apollo Guidance Computer | 1966 | 4,096 | 16-bit | 11.7 μs |
| Whirlwind I | 1953 | 1,024 | 16-bit | 8 μs |
| IBM 704 | 1954 | 32,768 | 36-bit | 12 μs |
| DEC PDP-1 | 1960 | 4,096 | 18-bit | 5 μs |
| CDC 6600 | 1964 | 131,072 | 60-bit | 1 μs |
| UNIVAC 1107 | 1962 | 65,536 | 36-bit | 4 μs |
| IBM System/360 | 1964 | Variable | 32-bit | 2 μs |
| MIT TX-2 | 1958 | 65,536 | 36-bit | 6 μs |

### Fully Editable Components
- **Grid Configuration** - Width (2-16), Height (2-16), Core Radius, Spacing, Word Size
- **Appearance** - Custom colors for states, wires, active elements, background
- **Wire Visibility** - Toggle X wires, Y wires, Sense wire, Labels independently
- **Memory Editor** - Direct binary/hex/decimal input with synchronized fields
- **Word Breakdown** - View memory as words with per-word hex values
- **Animation Speed** - Adjustable from 100ms to 2s per step

### Data Management
- **Export** - Save full state as JSON (memory, colors, grid config)
- **Import** - Restore state from JSON file

## Quick Start

### Local Development

```bash
cd ferrite-core-simulator
python3 -m http.server 8765
# Open http://localhost:8765 in your browser
```

### Docker

```bash
docker build -t ferrite-sim .
docker run -p 8080:8080 ferrite-sim
# Open http://localhost:8080 in your browser
```

## Usage

### Basic Operations
1. Select an operation mode: **Read**, **Write 0**, or **Write 1**
2. Click any core in the grid to perform the operation
3. Watch the animation show current pulses through X/Y wires
4. Observe the operation log and physics explanation panels

### Using Historical Presets
1. Select a system from the **Historical Architecture** dropdown
2. The grid automatically resizes to match the historical configuration
3. Details about the system (manufacturer, memory size, significance) are displayed

### Editing Memory Directly
- Enter binary, hex, or decimal values in the **Memory Editor** panel
- All fields stay synchronized
- View word-level breakdown below the inputs

### Customizing Appearance
- Use color pickers in the **Appearance** panel
- Toggle wire visibility to focus on specific components
- Adjust grid dimensions and core spacing in **Grid Configuration**

## Physics Explanation

### How Core Memory Works

**Storage:** Each toroidal core is made of ferrite material with a square hysteresis loop. A core magnetized clockwise stores 0; counter-clockwise stores 1.

**Reading (Destructive):**
1. Apply half-current to X line
2. Apply half-current to Y line
3. Selected core receives full current and flips to 0
4. If core was originally 1, sense wire detects the magnetic flux change
5. Original value is returned but the bit is now 0

**Writing 1:**
1. Apply half-current to X line
2. Apply half-current to Y line
3. Selected core receives enough energy to flip to 1

**Writing 0:**
1. Apply half-current to X line
2. Apply half-current to Y line
3. Activate inhibit line (opposes Y current)
4. Selected core only gets I/2 - insufficient to flip
5. Core remains at 0

## File Structure

```
ferrite-core-simulator/
├── index.html          # Main UI with all panels
├── style.css           # Dark retro theme with SVG animations
├── Dockerfile          # Chainguard nginx container
├── .dockerignore       # Build exclusions
├── src/
│   ├── core-memory.js  # Physics engine (destructive read, coincident current)
│   └── app.js          # Interactive renderer, event handling, IO
```

## Technical Details

### Core Memory Engine (`src/core-memory.js`)
- Grid-based core array with magnetic state tracking
- Operation step sequencing for animation
- Event-driven architecture for UI updates
- Import/export with JSON serialization
- Historical architecture database

### Application Controller (`src/app.js`)
- SVG-based grid renderer with dynamic sizing
- CSS custom properties for theming
- Real-time memory display synchronization
- File-based import/export handling
- Tooltip system for core inspection

### Styling (`style.css`)
- CSS custom properties for dynamic theming
- SVG filter effects for glow/bloom
- Responsive grid layout
- Mobile-friendly breakpoints

## Historical Context

Ferrite core memory was the dominant form of RAM from 1953 (Whirlwind I) through the mid-1970s. Key characteristics:
- **Non-volatile** - retained data without power
- **Destructive reads** - required write-back after reading
- **Cycle time** - typically 1-20 microseconds
- **Density** - about 1 bit per cubic millimeter
- **Cost** - dropped from $1/bit (1953) to $0.01/bit (1970)

The Apollo Guidance Computer's core memory was woven by hand - "core rope memory" for fixed programs and erasable core for variables. Women workers (called "Little Old Ladies" though many were young) used needles to thread wires through cores under microscopes.

## License

MIT
