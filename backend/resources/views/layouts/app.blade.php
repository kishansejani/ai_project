<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}"> {{-- CSRF token for AJAX requests --}}

    <title>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Basic inline CSS for demonstration purposes -->
    <style>
        /* Base styles */
        body {
            font-family: 'Figtree', sans-serif;
            margin: 0;
            display: flex;
            min-height: 100vh;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        .sidebar {
            width: 250px;
            background-color: #f8f9fa;
            padding: 20px;
            border-right: 1px solid #e0e0e0;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        .sidebar ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .sidebar ul li {
            margin-bottom: 10px;
        }

        .sidebar ul li a, .sidebar .settings-toggle-btn {
            text-decoration: none;
            color: #333;
            display: block;
            padding: 10px 15px;
            border-radius: 5px;
            transition: background-color 0.3s ease, color 0.3s ease;
            cursor: pointer;
        }

        .sidebar ul li a:hover, .sidebar .settings-toggle-btn:hover {
            background-color: #e2e6ea;
        }

        .main-content {
            flex-grow: 1;
            padding: 20px;
            background-color: #ffffff;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* Theme & Color Specific Styles */
        body.theme-light {
            background-color: #f4f7f6;
            color: #333;
        }
        body.theme-light .sidebar {
            background-color: #ffffff;
            border-right-color: #e0e0e0;
        }
        body.theme-light .main-content {
            background-color: #fefefe;
        }

        body.theme-dark {
            background-color: #2c2c2c;
            color: #f0f0f0;
        }
        body.theme-dark .sidebar {
            background-color: #3a3a3a;
            border-right-color: #444;
        }
        body.theme-dark .sidebar ul li a, body.theme-dark .sidebar .settings-toggle-btn {
            color: #e0e0e0;
        }
        body.theme-dark .sidebar ul li a:hover, body.theme-dark .sidebar .settings-toggle-btn:hover {
            background-color: #4a4a4a;
        }
        body.theme-dark .main-content {
            background-color: #343434;
        }

        /* Color Schemes */
        body.color-default .sidebar {
            /* No specific changes for default */
        }
        body.color-default .sidebar ul li a:hover, body.color-default .sidebar .settings-toggle-btn:hover {
             background-color: #e2e6ea; /* light theme */
        }
        body.theme-dark.color-default .sidebar ul li a:hover, body.theme-dark.color-default .sidebar .settings-toggle-btn:hover {
            background-color: #4a4a4a;
        }

        body.color-blue .sidebar {
            background-color: #e6f7ff;
            border-right-color: #91d5ff;
        }
        body.color-blue .sidebar ul li a, body.color-blue .sidebar .settings-toggle-btn {
            color: #1890ff;
        }
        body.color-blue .sidebar ul li a:hover, body.color-blue .sidebar .settings-toggle-btn:hover {
            background-color: #bae7ff;
        }
        body.theme-dark.color-blue .sidebar {
            background-color: #1f3a5f;
            border-right-color: #10233a;
        }
        body.theme-dark.color-blue .sidebar ul li a, body.theme-dark.color-blue .sidebar .settings-toggle-btn {
            color: #40a9ff;
        }
        body.theme-dark.color-blue .sidebar ul li a:hover, body.theme-dark.color-blue .sidebar .settings-toggle-btn:hover {
            background-color: #102a43;
        }

        body.color-green .sidebar {
            background-color: #e6fffb;
            border-right-color: #87e8de;
        }
        body.color-green .sidebar ul li a, body.color-green .sidebar .settings-toggle-btn {
            color: #08979c;
        }
        body.color-green .sidebar ul li a:hover, body.color-green .sidebar .settings-toggle-btn:hover {
            background-color: #b5f5ec;
        }
        body.theme-dark.color-green .sidebar {
            background-color: #0c363d;
            border-right-color: #032929;
        }
        body.theme-dark.color-green .sidebar ul li a, body.theme-dark.color-green .sidebar .settings-toggle-btn {
            color: #36cfc9;
        }
        body.theme-dark.color-green .sidebar ul li a:hover, body.theme-dark.color-green .sidebar .settings-toggle-btn:hover {
            background-color: #072327;
        }

        /* Settings Panel */
        .settings-panel {
            position: fixed;
            bottom: 20px;
            left: 270px; /* Adjust based on sidebar width */
            width: 200px;
            background-color: #ffffff;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 15px;
            z-index: 1000;
            display: none; /* Hidden by default */
            transition: all 0.3s ease;
            color: #333;
        }
        body.theme-dark .settings-panel {
            background-color: #3a3a3a;
            border-color: #555;
            color: #f0f0f0;
        }
        .settings-panel.active {
            display: block;
        }
        .settings-panel h4 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 1.1em;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        body.theme-dark .settings-panel h4 {
            border-bottom-color: #555;
        }
        .settings-panel label {
            display: block;
            margin-bottom: 8px;
            cursor: pointer;
        }
        .settings-panel input[type="radio"] {
            margin-right: 5px;
        }
    </style>
</head>
<body class="antialiased">
    <div class="sidebar">
        <div>
            <h3>Dashboard</h3>
            <ul>
                <li><a href="#">Home</a></li>
                <li><a href="#">Users</a></li>
                <li><a href="#">Products</a></li>
                <li><a href="#">Orders</a></li>
            </ul>
        </div>
        <div class="bottom-links">
            <ul>
                <li>
                    <a href="javascript:void(0)" class="settings-toggle-btn" onclick="toggleSettingsPanel()">
                        ⚙️ Settings
                    </a>
                </li>
            </ul>
        </div>
    </div>

    <div class="main-content">
        <h1>Welcome to your Laravel Application!</h1>
        <p>This is the main content area. Your theme and color preferences will be applied here.</p>

        @auth
            <p>Hello, {{ Auth::user()->name }}!</p>
            <p>Current Theme: <span id="currentTheme">{{ Auth::user()->theme ?? 'light' }}</span></p>
            <p>Current Color Scheme: <span id="currentColorScheme">{{ Auth::user()->color_scheme ?? 'default' }}</span></p>
        @else
            <p>Please log in to see personalized settings.</p>
        @endauth

        <!-- Your page specific content will go here -->
        @yield('content')
    </div>

    <!-- Settings Panel HTML -->
    <div id="settingsPanel" class="settings-panel">
        <h4>Theme Preferences</h4>
        <div>
            <label>
                <input type="radio" name="theme" value="light" onchange="updatePreferencesFromUI()">
                Light Theme
            </label>
            <label>
                <input type="radio" name="theme" value="dark" onchange="updatePreferencesFromUI()">
                Dark Theme
            </label>
        </div>

        <h4 style="margin-top: 15px;">Color Scheme</h4>
        <div>
            <label>
                <input type="radio" name="color_scheme" value="default" onchange="updatePreferencesFromUI()">
                Default
            </label>
            <label>
                <input type="radio" name="color_scheme" value="blue" onchange="updatePreferencesFromUI()">
                Blue
            </label>
            <label>
                <input type="radio" name="color_scheme" value="green" onchange="updatePreferencesFromUI()">
                Green
            </label>
        </div>
    </div>

    <!-- Basic inline JavaScript for demonstration purposes -->
    <script>
        const settingsPanel = document.getElementById('settingsPanel');
        const body = document.body;

        // Function to toggle settings panel visibility
        function toggleSettingsPanel() {
            settingsPanel.classList.toggle('active');
        }

        // Function to update preferences based on UI selection and send to backend
        function updatePreferencesFromUI() {
            const selectedTheme = document.querySelector('input[name="theme"]:checked')?.value;
            const selectedColorScheme = document.querySelector('input[name="color_scheme"]:checked')?.value;

            if (selectedTheme || selectedColorScheme) {
                updateThemePreferences(selectedTheme, selectedColorScheme);
            }
        }

        // Function to send theme preferences to the backend
        function updateThemePreferences(theme, colorScheme) {
            // Use current values if not explicitly passed
            const currentTheme = theme || (body.classList.contains('theme-dark') ? 'dark' : 'light');
            const currentColorScheme = colorScheme || (body.classList.contains('color-blue') ? 'blue' : (body.classList.contains('color-green') ? 'green' : 'default'));

            fetch('{{ route('user.theme.update') }}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({ theme: currentTheme, color_scheme: currentColorScheme })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    console.log(data.message);
                    // Update UI immediately after successful update
                    applyThemeToBody(data.theme, data.color_scheme);

                    // Update displayed text (optional)
                    document.getElementById('currentTheme').innerText = data.theme;
                    document.getElementById('currentColorScheme').innerText = data.color_scheme;

                    // Close panel after update (optional)
                    // settingsPanel.classList.remove('active');
                }
            })
            .catch(error => {
                console.error('Error updating theme:', error);
                alert('Error updating theme preferences. Please try again.');
            });
        }

        // Function to apply theme and color classes to the body element
        function applyThemeToBody(theme, colorScheme) {
            body.className = 'antialiased'; // Reset all theme/color classes
            body.classList.add(`theme-${theme}`);
            body.classList.add(`color-${colorScheme}`);

            // Set radio button states
            document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
            document.querySelector(`input[name="color_scheme"][value="${colorScheme}"]`).checked = true;
        }

        // Function to load and apply user preferences on page load
        function applyUserPreferences() {
            @auth
                const userTheme = "{{ Auth::user()->theme ?? 'light' }}";
                const userColorScheme = "{{ Auth::user()->color_scheme ?? 'default' }}";
                applyThemeToBody(userTheme, userColorScheme);
            @else
                // Default for guests
                applyThemeToBody('light', 'default');
            @endauth
        }

        // Run on page load
        document.addEventListener('DOMContentLoaded', applyUserPreferences);
    </script>
</body>
</html>
