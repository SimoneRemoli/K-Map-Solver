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

**K-Map Solver** is a client-side web application for Boolean function minimization based on Karnaugh maps and the Quine-McCluskey method. The project is designed to provide a practical and educational workflow: edit values, minimize the function, and inspect the resulting logical structure.

The application supports **2 to 5 variables**, both **SOP** (Sum of Products) and **POS** (Product of Sums), and executes all computations directly in the browser.

The interface is centered on interactive map editing with synchronized truth-table input.

![K-Map Solver Interface Overview](docs/images/app-overview.png)

After minimization, the tool presents the canonical decimal form (`Σ`/`Π`), the minimized symbolic expression rendered with MathJax, and the equivalent logic circuit.

![Equivalent Logic Circuit Overview](docs/images/circuit-overview.png)

## Local Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/M4rulli/K-Map-Solver.git
cd K-Map-Solver
npm install
```

Run the development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

## Repository Structure

- `src/components/` contains UI components (K-map, truth table, logic circuit, modals).
- `src/lib/` contains minimization and utility logic.
- `public/` contains static assets and icons.
- `config/` contains Vite, TypeScript, Tailwind, and ESLint configuration.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See `LICENSE` for full terms.
