# K-Map Solver

<p align="left">
  <img alt="React" src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss&logoColor=white" />
  <img alt="Framer Motion" src="https://img.shields.io/badge/Framer_Motion-12-black?logo=framer&logoColor=white" />
  <img alt="MathJax" src="https://img.shields.io/badge/MathJax-3-1f7a8c" />
  <img alt="License: GPL-3.0" src="https://img.shields.io/badge/License-GPLv3-blue.svg" />
</p>

An educational web application for Boolean minimization and sequential-machine design.

K-Map Solver combines an interactive Karnaugh-map workflow with automatic logic simplification, circuit visualization, and a recognizer-automaton section for Moore and Mealy machines. The goal is to provide a clean academic tool for studying digital logic, computer architecture, and sequential networks in a single interface.

## Overview

The project currently offers two main workflows:

- **Karnaugh Map Solver** for 2 to 5 variables
- **Recognizer Automaton** generation from an input string

The application is fully client-side and focuses on clarity, visual feedback, and educational value.

![K-Map Solver Interface Overview](docs/images/app-overview.png)

After simplification, the app displays canonical forms, simplified expressions, Karnaugh groupings, and logic circuits.

![Equivalent Logic Circuit Overview](docs/images/circuit-overview.png)

## Main Features

- Interactive Karnaugh-map editing
- Truth-table based editing and synchronization
- SOP and POS simplification
- Client-side Boolean minimization with Quine-McCluskey
- MathJax rendering for symbolic expressions
- Logic-circuit generation from simplified formulas
- Moore and Mealy recognizer automata generation
- Binary state/transition tables
- Karnaugh maps for next-state and output functions
- Complete sequential-machine diagrams with D flip-flops and feedback lines
- Support for overlapping string recognition

## Recognizer Automaton Workflow

The `Recognizer Automaton` section turns a target word into a sequential machine that recognizes the pattern.

From a single input string, the application can:

- build the automaton as **Moore** or **Mealy**
- encode states in binary
- generate the state and transition table
- derive each next-state output `y'` and the external output `z`
- construct the related Karnaugh map for every output
- simplify each Boolean function
- draw both the combinational logic and the complete sequential circuit

This makes the project useful not only for Karnaugh-map exercises, but also for exam-oriented sequential-machine design.

## Why This Project

This repository is meant to be both practical and didactic:

- it helps students move from truth tables to simplified logic quickly
- it shows how symbolic simplification maps to real circuits
- it connects automata theory with sequential hardware design
- it provides visual outputs that are useful for study, demos, and documentation

## Technology Stack

- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Framer Motion**
- **MathJax**
- **Mermaid**

## Project Structure

- `src/components/` contains UI components and visual panels
- `src/lib/` contains minimization, automata, Karnaugh, and circuit logic
- `src/types/` contains shared TypeScript types
- `public/` contains static assets
- `config/` contains Vite and project configuration
- `docs/images/` contains README screenshots

## Local Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/SimoneRemoli/K-Map-Solver.git
cd K-Map-Solver
npm install
```

Run the development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

## Credits

The basic algorithmic foundation originates from **Marco Marulli**.  
This repository extends that work with a later development focused on interface design, recognizer automata, Karnaugh-map generation for sequential outputs, and full sequential-circuit visualization.

Development and project extension by **Simone Remoli**.  
GitHub: https://github.com/SimoneRemoli

## Academic Reference

**Tor Vergata University, Faculty of Engineering**  
https://inginformatica.uniroma2.it/

## License

This project is released under the **GNU General Public License v3.0 (GPL-3.0)**.  
See `LICENSE` for the full license text.
