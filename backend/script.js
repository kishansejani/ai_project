document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const settingsModule = document.getElementById('settings-module'); // Group icon and panel
    const settingsIcon = document.getElementById('settings-icon');
    const settingsPanel = document.getElementById('settings-panel');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const customAccentColorInput = document.getElementById('custom-accent-color');

    // --- Persistence (localStorage) ---
    const getSavedSetting = (key, defaultValue) => {
        const saved = localStorage.getItem(key);
        return saved !== null ? JSON.parse(saved) : defaultValue;
    };

    const saveSetting = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    // --- Dark Mode ---
    const applyDarkMode = (isDark) => {
        if (isDark) {
            body.setAttribute('data-theme', 'dark');
        } else {
            body.setAttribute('data-theme', 'light');
        }
        darkModeToggle.checked = isDark;
        saveSetting('darkMode', isDark);
    };

    darkModeToggle.addEventListener('change', () => {
        applyDarkMode(darkModeToggle.checked);
    });

    // Initialize dark mode from localStorage or system preference
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    let initialDarkMode = getSavedSetting('darkMode', prefersDarkScheme.matches);
    applyDarkMode(initialDarkMode);

    prefersDarkScheme.addEventListener('change', (e) => {
        if (getSavedSetting('darkMode', null) === null) { // Only update if no explicit user setting
            applyDarkMode(e.matches);
        }
    });

    // --- Accent Color ---
    const applyAccentColor = (color) => {
        document.documentElement.style.setProperty('--accent-color', color);
        // Also update the settings icon's background (if it's tied to accent)
        settingsIcon.style.backgroundColor = color;
        // Update the custom color input's value
        customAccentColorInput.value = color;
        saveSetting('accentColor', color);
    };

    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.dataset.color;
            applyAccentColor(color);
        });
    });

    customAccentColorInput.addEventListener('input', (event) => {
        applyAccentColor(event.target.value);
    });

    // Initialize accent color from localStorage
    const initialAccentColor = getSavedSetting('accentColor', '#007bff'); // Default to blue
    applyAccentColor(initialAccentColor);

    // --- Draggable Settings Icon & Panel Toggle ---
    let isDragging = false;
    let offsetX, offsetY; // Mouse position relative to element's top-left corner
    const DRAG_THRESHOLD = 5; // Pixels to distinguish click from drag

    const updatePanelPosition = () => {
        const iconRect = settingsIcon.getBoundingClientRect();
        const panelRect = settingsPanel.getBoundingClientRect();

        // Position panel 20px above the icon and aligned to the icon's right edge
        let newBottom = window.innerHeight - iconRect.top + 20; // 20px gap
        let newRight = window.innerWidth - iconRect.right; // Align right edge

        // Ensure panel doesn't go off screen left
        if (iconRect.left - panelRect.width < 0) { // If panel would go off left
             newRight = window.innerWidth - iconRect.left - panelRect.width; // Align left edge of panel with left edge of icon
             if (newRight < 0) newRight = 0; // If panel still too wide for screen, just align to left
        }

        // Ensure panel doesn't go off screen top
        if (iconRect.top - panelRect.height - 20 < 0) { // If panel would go off top
            newBottom = window.innerHeight - iconRect.bottom - 20; // Position below icon instead
            if (newBottom < 0) newBottom = 0; // If panel still too tall, align to bottom
        }

        settingsPanel.style.top = 'auto'; // Clear top/left
        settingsPanel.style.left = 'auto';
        settingsPanel.style.bottom = `${newBottom}px`;
        settingsPanel.style.right = `${newRight}px`;
    };


    settingsIcon.addEventListener('mousedown', (e) => {
        isDragging = false; // Assume it's a click initially
        const rect = settingsIcon.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // Change position from fixed bottom/right to fixed top/left for dragging
        settingsIcon.style.left = rect.left + 'px';
        settingsIcon.style.top = rect.top + 'px';
        settingsIcon.style.right = 'auto';
        settingsIcon.style.bottom = 'auto';
        settingsIcon.style.cursor = 'grabbing';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        const newLeft = e.clientX - offsetX;
        const newTop = e.clientY - offsetY;

        // Check if movement exceeds threshold to consider it a drag
        const currentRect = settingsIcon.getBoundingClientRect();
        if (Math.abs(newLeft - currentRect.left) > DRAG_THRESHOLD || Math.abs(newTop - currentRect.top) > DRAG_THRESHOLD) {
            isDragging = true;

            // Keep icon within viewport
            let finalLeft = Math.max(0, Math.min(newLeft, window.innerWidth - settingsIcon.offsetWidth));
            let finalTop = Math.max(0, Math.min(newTop, window.innerHeight - settingsIcon.offsetHeight));

            settingsIcon.style.left = `${finalLeft}px`;
            settingsIcon.style.top = `${finalTop}px`;
            saveSetting('iconPosition', { left: finalLeft, top: finalTop });
            updatePanelPosition(); // Update panel position during drag if it's active
        }
    }

    function onMouseUp(e) {
        settingsIcon.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (!isDragging) {
            // It was a click, not a drag
            settingsPanel.classList.toggle('active');
            if (settingsPanel.classList.contains('active')) {
                updatePanelPosition();
            }
        }
    }

    // Close panel if clicked outside
    document.addEventListener('click', (e) => {
        if (settingsPanel.classList.contains('active') &&
            !settingsPanel.contains(e.target) &&
            !settingsIcon.contains(e.target) &&
            !e.target.closest('#settings-module')) { // Check if click is outside the module entirely
            settingsPanel.classList.remove('active');
        }
    });

    // Initialize icon position from localStorage
    const savedIconPosition = getSavedSetting('iconPosition', null);
    if (savedIconPosition) {
        settingsIcon.style.left = savedIconPosition.left + 'px';
        settingsIcon.style.top = savedIconPosition.top + 'px';
        settingsIcon.style.right = 'auto';
        settingsIcon.style.bottom = 'auto';
    } else {
        // Default fixed positioning if no saved position
        settingsIcon.style.bottom = '30px';
        settingsIcon.style.right = '30px';
        settingsIcon.style.left = 'auto';
        settingsIcon.style.top = 'auto';
    }

    // Ensure panel position is updated if page size changes or icon moves implicitly
    window.addEventListener('resize', () => {
        if (settingsPanel.classList.contains('active')) {
            updatePanelPosition();
        }
    });
});