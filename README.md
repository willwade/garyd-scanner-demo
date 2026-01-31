# garyd-scanner-demo

A client-side switch scanning simulator built with TypeScript and Vite.

This project is named after and inspired by **Gary Derwent**, an Occupational Therapist who created a seminal Flash-based switch scanning demo in the late 1990s. His original work helped demonstrate the mechanics and clinical applications of switch scanning for assistive technology. This project aims to replicate and extend those concepts using modern web technologies.

## Features

*   **Multiple Scanning Strategies:**
    *   Row-Column
    *   Column-Row
    *   Linear & Snake
    *   Quadrant (Group Scanning)
    *   Elimination (Binary/Quaternary)
    *   Continuous (Mouse emulation)
*   **Predictive Scanning:** Integrates PPM (Prediction by Partial Matching) to reorder targets based on probability.
*   **Configurable Settings:** Adjustable scan rate, acceptance time, post-selection delay, and more.
*   **Audio Feedback:** Web Audio API generated feedback for scanning steps and selections.
*   **Responsive Design:** Grid layout that adapts to container size.

## Usage

### Controls

The simulator mimics a multi-switch setup using keyboard keys:

| Switch Function | Default Key(s) | Description |
| :--- | :--- | :--- |
| **Switch 1 (Primary)** | `Space`, `Enter` | **Select** or **Hold**. Activates the currently highlighted item or group. |
| **Switch 2 (Secondary)** | `2` | **Step** or **Back-up**. Manually moves to the next item or goes back a level. |
| **Switch 3 (Utility)** | `3` | **Home/Reset**. Restarts the scan sequence or clears input. |
| **Switch 4 (Cancel)** | `4` | **Cancel**. Stops the current action. |
| **Settings Toggle** | `S` | Shows/Hides the configuration overlay. |

### Configuration (URL Parameters)

The application can be configured via URL parameters, making it easy to embed in iframes with specific presets.

**Example:** `?rate=800&strategy=row-column&ui=hidden`

| Parameter | Values | Description |
| :--- | :--- | :--- |
| `ui` | `hidden` | Hides the settings button and overlay (useful for embedding). |
| `rate` | `number` (ms) | Sets the scan speed in milliseconds (e.g., `1000`). |
| `strategy` | `row-column`, `linear`, `snake`, `quadrant`, `group-row-column`, `elimination`, `continuous`, `probability` | Sets the initial scanning strategy. |
| `content` | `numbers`, `keyboard` | Sets the grid content type. |
| `lang` | `en`, etc. | Sets the language for prediction and keyboard layout. |
| `layout` | `alphabetical`, `frequency` | Sets the keyboard layout mode. |
| `view` | `standard`, `cost-numbers`, `cost-heatmap` | Visual debug modes to analyze scanning cost. |
| `heatmax` | `number` | Sets the maximum value for the heatmap visualization. |

### Visualizing Scan Cost (Heatmap)

The simulator includes visualization modes to help analyze the efficiency of different scanning strategies and layouts.

1.  Open the **Settings** menu (click the gear icon or press `S`).
2.  Scroll down to the **Visualization** section.
3.  Change **View Mode** to:
    *   **Cost (Numbers):** Displays the "cost" (number of steps) to reach each item.
    *   **Cost (Heatmap):** Colors items from Green (low cost) to Red (high cost).
4.  Adjust **Heatmap Max Cost** to change the color scale sensitivity. Default is 20.
    *   *Tip:* If the grid is large, increase this value to see a smoother gradient.

## Developer Documentation

### Prerequisites

*   Node.js (latest LTS recommended)
*   npm

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd garyd-scanner-demo
npm install
```

### Running Locally

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

### Building

Build the project for production:

```bash
npm run build
```

This generates the static assets in the `dist/` directory.

### Tech Stack

*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Bundler:** [Vite](https://vitejs.dev/)
*   **Audio:** Web Audio API (No external assets required)
*   **Prediction:** `@willwade/ppmpredictor`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
