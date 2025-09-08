# To‑Do List (HTML/CSS/JS)

A modern, accessible to‑do app with themes (light/dark/system/pink + custom), drag‑and‑drop reordering, i18n (ru/en/es/de/fr), and localStorage persistence. No build tools, just open in a browser.

## Features
- Themes: light, dark, system, pink
- Custom theme editor (modal) with live preview and persistence
- Drag & drop reordering (in “All” filter), persisted across reloads
- Filters: All / Active / Completed
- Edit task via double‑click, confirm on blur or Enter, Esc to cancel
- Clear completed tasks
- Items‑left counter
- i18n: RU, EN, ES, DE, FR (auto‑detect via navigator.language; persisted selection)
- Fully client‑side, data in localStorage

## Quick start
1. Clone the repo
   ```bash
   git clone https://github.com/HadzimeSan/To-Do-List.git
   cd To-Do-List
   ```
2. Open `index.html` in your browser

No dependencies required.

## Project structure
```
To-Do List/
├─ index.html     # Markup: header, list, footer, theme & language selectors, modal
├─ style.css      # Styles: theme variables, layout, modal, DnD cues
└─ script.js      # Logic: tasks, filters, storage, themes, customizer, i18n, DnD
```

## Usage
- Add task: type and press Enter or click “Add”
- Toggle complete: checkbox
- Edit: double‑click task title → Enter to save, Esc to cancel, blur to save
- Delete: “Удалить” button
- Clear completed: footer button
- Reorder: drag tasks (in the “All” filter)

## Theming
- Choose theme in the header.
- “System” follows OS preference (`prefers-color-scheme`).
- “Custom” opens a “Настроить” button; click to open a modal and pick colors:
  - bg, panel, text, muted, primary, border
- All theme choices are saved in localStorage.

## Internationalization (i18n)
- Language selector in the header (RU/EN/ES/DE/FR)
- Auto‑detects from `navigator.language` on first load, then persists your choice
- All UI labels update instantly

## Accessibility
- ARIA labels/roles on key controls and live region for list updates
- Keyboard support: Enter/Esc in editors, Esc to close modal

## Data persistence
- Tasks, theme, custom palette, and language are stored in `localStorage`:
  - `todo.tasks.v1`
  - `todo.theme.v1` and `todo.theme.custom.v1`
  - `todo.lang.v1`

## Deploy (GitHub Pages)
- Push the `main` branch
- In the repository settings → Pages → Build and deployment → Branch: `main` / folder: `/ (root)`
- The app will be served at `https://<your-user>.github.io/To-Do-List/`

## Roadmap ideas
- Task due dates and reminders
- Search and bulk actions
- Import/export JSON
- Unit tests

## License
MIT


