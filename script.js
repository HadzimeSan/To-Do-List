(function () {
    "use strict";

    /** @typedef {{ id: string, title: string, completed: boolean }} Task */

    const STORAGE_KEY = "todo.tasks.v1";
    const THEME_KEY = "todo.theme.v1"; // "system" | "light" | "dark" | "pink" | "custom"
    const THEME_CUSTOM_KEY = "todo.theme.custom.v1"; // stores {bg,panel,text,muted,primary,border}
    const LANG_KEY = "todo.lang.v1";

    /** @type {Task[]} */
    let tasks = [];
    /** @type {"all"|"active"|"completed"} */
    let currentFilter = "all";

    // Elements
    const form = document.getElementById("new-task-form");
    const input = document.getElementById("new-task-input");
    const list = document.getElementById("task-list");
    const itemsLeft = document.getElementById("items-left");
    const clearCompletedBtn = document.getElementById("clear-completed");
    const filterButtons = Array.from(document.querySelectorAll(".filters .filter"));
    const themeSelect = document.getElementById("theme-select");
    const customPanel = document.getElementById("theme-customizer");
    const openCustomizerBtn = document.getElementById("open-theme-customizer");
    const modal = document.getElementById("theme-modal");
    const closeModalBtn = document.getElementById("close-theme-modal");
    const langSelect = document.getElementById("lang-select");
    const colorInputs = {
        bg: document.getElementById("color-bg"),
        panel: document.getElementById("color-panel"),
        text: document.getElementById("color-text"),
        muted: document.getElementById("color-muted"),
        primary: document.getElementById("color-primary"),
        border: document.getElementById("color-border"),
    };

    function loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                tasks = parsed.filter(Boolean).map((t) => ({
                    id: String(t.id ?? crypto.randomUUID?.() ?? Date.now()),
                    title: String(t.title ?? ""),
                    completed: Boolean(t.completed),
                }));
            }
        } catch (_) {
            // ignore
        }
    }

    function saveToStorage() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (_) { /* ignore */ }
    }

    function loadTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || "system";
        } catch (_) {
            return "system";
        }
    }

    function saveTheme(theme) {
        try { localStorage.setItem(THEME_KEY, theme); } catch (_) { /* ignore */ }
    }

    function applyTheme(theme) {
        const root = document.documentElement;
        root.classList.remove("theme-light", "theme-dark", "theme-pink", "theme-system", "theme-custom");
        const valid = ["system", "light", "dark", "pink", "custom"].includes(theme) ? theme : "system";
        root.classList.add(`theme-${valid}`);
        if (themeSelect) themeSelect.value = valid;

        if (valid === "custom") {
            // Load custom palette and set CSS variables inline on :root
            const palette = loadCustomTheme();
            setRootVariables(palette);
            if (openCustomizerBtn) openCustomizerBtn.hidden = false;
            // Seed inputs
            if (colorInputs.bg) colorInputs.bg.value = toColor(palette.bg, "#0f172a");
            if (colorInputs.panel) colorInputs.panel.value = toColor(palette.panel, "#111827");
            if (colorInputs.text) colorInputs.text.value = toColor(palette.text, "#e5e7eb");
            if (colorInputs.muted) colorInputs.muted.value = toColor(palette.muted, "#9ca3af");
            if (colorInputs.primary) colorInputs.primary.value = toColor(palette.primary, "#22d3ee");
            if (colorInputs.border) colorInputs.border.value = toColor(palette.border, "#1f2937");
        } else {
            if (openCustomizerBtn) openCustomizerBtn.hidden = true;
            if (modal) hideModal();
        }
    }

    function toColor(value, fallback) {
        const v = (value || fallback || "").toString();
        // ensure starts with #
        return v.startsWith("#") ? v : fallback;
    }

    function setRootVariables(palette) {
        const rootStyle = document.documentElement.style;
        if (!palette) return;
        if (palette.bg) rootStyle.setProperty("--bg", palette.bg);
        if (palette.panel) rootStyle.setProperty("--panel", palette.panel);
        if (palette.text) rootStyle.setProperty("--text", palette.text);
        if (palette.muted) rootStyle.setProperty("--muted", palette.muted);
        if (palette.primary) rootStyle.setProperty("--primary", palette.primary);
        if (palette.border) rootStyle.setProperty("--border", palette.border);
    }

    function loadCustomTheme() {
        try {
            const raw = localStorage.getItem(THEME_CUSTOM_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (_) { return {}; }
    }

    function saveCustomTheme(palette) {
        try { localStorage.setItem(THEME_CUSTOM_KEY, JSON.stringify(palette)); } catch (_) { /* ignore */ }
    }

    function setFilter(filter) {
        currentFilter = filter;
        filterButtons.forEach((btn) => {
            const isActive = btn.dataset.filter === filter;
            btn.classList.toggle("is-active", isActive);
            btn.setAttribute("aria-selected", String(isActive));
        });
        render();
    }

    function getVisibleTasks() {
        switch (currentFilter) {
            case "active": return tasks.filter(t => !t.completed);
            case "completed": return tasks.filter(t => t.completed);
            default: return tasks;
        }
    }

    function updateCounters() {
        const left = tasks.filter(t => !t.completed).length;
        itemsLeft.textContent = formatItemsLeft(left);
    }

    // i18n
    const translations = {
        ru: {
            title: "Задачи",
            add: "Добавить",
            placeholder: "Что нужно сделать?",
            filters: { all: "Все", active: "Активные", completed: "Выполненные" },
            clearCompleted: "Очистить выполненные",
            themeLabel: "Тема:",
            theme: { system: "Системная", light: "Светлая", dark: "Тёмная", pink: "Розовая", custom: "Пользовательская" },
            langLabel: "Язык:",
            itemsLeft: (n) => `${n} активных`,
            modalTitle: "Пользовательская тема",
            customize: "Настроить",
            delete: "Удалить",
        },
        en: {
            title: "Tasks",
            add: "Add",
            placeholder: "What needs to be done?",
            filters: { all: "All", active: "Active", completed: "Completed" },
            clearCompleted: "Clear completed",
            themeLabel: "Theme:",
            theme: { system: "System", light: "Light", dark: "Dark", pink: "Pink", custom: "Custom" },
            langLabel: "Language:",
            itemsLeft: (n) => `${n} active`,
            modalTitle: "Custom Theme",
            customize: "Customize",
            delete: "Delete",
        },
        es: {
            title: "Tareas",
            add: "Añadir",
            placeholder: "¿Qué hay que hacer?",
            filters: { all: "Todas", active: "Activas", completed: "Completadas" },
            clearCompleted: "Borrar completadas",
            themeLabel: "Tema:",
            theme: { system: "Sistema", light: "Claro", dark: "Oscuro", pink: "Rosa", custom: "Personalizado" },
            langLabel: "Idioma:",
            itemsLeft: (n) => `${n} activas`,
            modalTitle: "Tema personalizado",
            customize: "Personalizar",
            delete: "Eliminar",
        },
        de: {
            title: "Aufgaben",
            add: "Hinzufügen",
            placeholder: "Was ist zu tun?",
            filters: { all: "Alle", active: "Aktiv", completed: "Erledigt" },
            clearCompleted: "Erledigte löschen",
            themeLabel: "Thema:",
            theme: { system: "System", light: "Hell", dark: "Dunkel", pink: "Pink", custom: "Benutzerdefiniert" },
            langLabel: "Sprache:",
            itemsLeft: (n) => `${n} aktiv`,
            modalTitle: "Benutzerdefiniertes Thema",
            customize: "Anpassen",
            delete: "Löschen",
        },
        fr: {
            title: "Tâches",
            add: "Ajouter",
            placeholder: "Que faut-il faire ?",
            filters: { all: "Toutes", active: "Actives", completed: "Terminées" },
            clearCompleted: "Effacer terminées",
            themeLabel: "Thème:",
            theme: { system: "Système", light: "Clair", dark: "Sombre", pink: "Rose", custom: "Personnalisé" },
            langLabel: "Langue:",
            itemsLeft: (n) => `${n} actives`,
            modalTitle: "Thème personnalisé",
            customize: "Personnaliser",
            delete: "Supprimer",
        },
    };

    function getLang() {
        try { return localStorage.getItem(LANG_KEY) || navigator.language.slice(0,2) || 'en'; } catch (_) { return 'en'; }
    }
    function saveLang(code) { try { localStorage.setItem(LANG_KEY, code); } catch (_) { /* ignore */ } }
    function t() {
        const code = (getLang() in translations) ? getLang() : 'en';
        return translations[code];
    }
    function formatItemsLeft(n) {
        const dict = t();
        return typeof dict.itemsLeft === 'function' ? dict.itemsLeft(n) : `${n}`;
    }
    function applyI18n() {
        const dict = t();
        const titleEl = document.getElementById('i18n-title');
        const addBtn = document.getElementById('add-task-btn');
        const inputEl = document.getElementById('new-task-input');
        const themeLabel = document.getElementById('i18n-theme-label');
        const langLabel = document.getElementById('i18n-lang-label');
        const clearBtn = document.getElementById('clear-completed');
        const themeModalTitle = document.getElementById('theme-modal-title');
        const openCustomize = document.getElementById('open-theme-customizer');

        if (titleEl) titleEl.textContent = dict.title;
        if (addBtn) addBtn.textContent = dict.add;
        if (inputEl) { inputEl.placeholder = dict.placeholder; inputEl.setAttribute('aria-label', dict.add); }
        if (themeLabel) themeLabel.textContent = dict.themeLabel;
        if (langLabel) langLabel.textContent = dict.langLabel;
        if (clearBtn) clearBtn.textContent = dict.clearCompleted;
        if (themeModalTitle) themeModalTitle.textContent = dict.modalTitle;
        if (openCustomize) openCustomize.textContent = dict.customize;

        // theme select options by data-i18n
        document.querySelectorAll('#theme-select option').forEach(opt => {
            const key = opt.getAttribute('data-i18n');
            if (!key) return;
            const parts = key.split('.');
            let v = dict;
            for (const p of parts) v = v?.[p];
            if (typeof v === 'string') opt.textContent = v;
        });

        // filters
        document.querySelectorAll('.filters .filter').forEach(btn => {
            const type = btn.getAttribute('data-filter');
            if (type && dict.filters[type]) btn.textContent = dict.filters[type];
        });
        // items left will be set via updateCounters()
        updateCounters();
    }

    function createTaskElement(task) {
        const li = document.createElement("li");
        li.className = "task" + (task.completed ? " completed" : "");
        li.dataset.id = task.id;
        // Enable drag only in "all" filter
        li.draggable = currentFilter === "all";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.className = "toggle";
        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;
            saveToStorage();
            render();
        });

        const title = document.createElement("span");
        title.className = "title";
        title.textContent = task.title;
        title.title = task.title;
        title.addEventListener("dblclick", () => startEdit(li, task));

        const destroy = document.createElement("button");
        destroy.className = "destroy";
        destroy.setAttribute("aria-label", "Удалить");
        destroy.textContent = "Удалить";
        destroy.addEventListener("click", () => {
            tasks = tasks.filter(t => t.id !== task.id);
            saveToStorage();
            render();
        });

        li.appendChild(checkbox);
        li.appendChild(title);
        li.appendChild(destroy);

        if (li.draggable) {
            li.addEventListener("dragstart", () => {
                li.classList.add("dragging");
            });
            li.addEventListener("dragend", () => {
                li.classList.remove("dragging");
                // Sync order after drag ends
                syncTasksOrderFromDOM();
                render();
            });
        }
        return li;
    }

    function startEdit(li, task) {
        const titleNode = li.querySelector(".title");
        if (!titleNode) return;
        const inputEdit = document.createElement("input");
        inputEdit.type = "text";
        inputEdit.className = "edit-input";
        inputEdit.value = task.title;
        li.replaceChild(inputEdit, titleNode);
        inputEdit.focus();
        inputEdit.selectionStart = inputEdit.value.length;

        const finish = (commit) => {
            if (commit) {
                const value = inputEdit.value.trim();
                if (value) {
                    task.title = value;
                } else {
                    // empty means delete
                    tasks = tasks.filter(t => t.id !== task.id);
                }
                saveToStorage();
            }
            render();
        };

        inputEdit.addEventListener("keydown", (e) => {
            if (e.key === "Enter") finish(true);
            else if (e.key === "Escape") finish(false);
        });
        inputEdit.addEventListener("blur", () => finish(true));
    }

    function render() {
        list.innerHTML = "";
        getVisibleTasks().forEach(task => list.appendChild(createTaskElement(task)));
        updateCounters();
    }

    function syncTasksOrderFromDOM() {
        if (currentFilter !== "all") return;
        const ids = Array.from(list.children).map(li => li.dataset.id);
        tasks.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        saveToStorage();
    }

    function getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll('.task:not(.dragging)')];
        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - (box.top + box.height / 2);
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    }

    function addTask(title) {
        const t = title.trim();
        if (!t) return;
        const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
        tasks.unshift({ id, title: t, completed: false });
        saveToStorage();
        input.value = "";
        render();
    }

    // Events
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        addTask(input.value);
    });

    clearCompletedBtn.addEventListener("click", () => {
        const hadCompleted = tasks.some(t => t.completed);
        if (!hadCompleted) return;
        tasks = tasks.filter(t => !t.completed);
        saveToStorage();
        render();
    });

    filterButtons.forEach(btn => btn.addEventListener("click", () => setFilter(btn.dataset.filter)));

    // Drag & Drop on the list container (only meaningful in 'all')
    list.addEventListener('dragover', (e) => {
        if (currentFilter !== 'all') return;
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const dragging = document.querySelector('.task.dragging');
        if (!dragging) return;
        if (afterElement == null) {
            list.appendChild(dragging);
        } else {
            list.insertBefore(dragging, afterElement);
        }
    });

    // Theme events
    if (themeSelect) {
        themeSelect.addEventListener("change", () => {
            const value = themeSelect.value;
            applyTheme(value);
            saveTheme(value);
        });
    }

    // Modal helpers
    function showModal() {
        if (!modal) return;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.addEventListener('keydown', onEscClose);
    }
    function hideModal() {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        modal.hidden = true;
        document.removeEventListener('keydown', onEscClose);
    }
    function onEscClose(e) { if (e.key === 'Escape') hideModal(); }

    if (openCustomizerBtn) {
        openCustomizerBtn.addEventListener('click', showModal);
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideModal);
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList && e.target.classList.contains('modal-backdrop')) hideModal();
        });
    }

    // Custom theme inputs live update
    Object.entries(colorInputs).forEach(([key, el]) => {
        if (!el) return;
        el.addEventListener('input', () => {
            const current = loadCustomTheme();
            current[key] = el.value;
            saveCustomTheme(current);
            if ((localStorage.getItem(THEME_KEY) || 'system') === 'custom') {
                setRootVariables(current);
            }
        });
    });

    // React to system changes when in system mode
    const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (media && media.addEventListener) {
        media.addEventListener('change', () => {
            if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') {
                applyTheme('system');
            }
        });
    }

    // Language selector
    if (langSelect) {
        const code = getLang();
        if ([...langSelect.options].some(o => o.value === code)) langSelect.value = code;
        langSelect.addEventListener('change', () => {
            saveLang(langSelect.value);
            applyI18n();
            render();
        });
    }

    // Init
    loadFromStorage();
    // Init theme
    const initialTheme = loadTheme();
    applyTheme(initialTheme);
    applyI18n();
    render();
})();


