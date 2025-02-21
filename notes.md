# sample app structure

/electron-app
│── /src
│   ├── /main           # Main Electron process
│   │   ├── main.js     # Electron app entry point
│   │   ├── preload.js  # Preload script for renderer processes
│   │   ├── ipc.js      # IPC communication handlers
│   │   ├── config.js   # App configuration (e.g., paths, settings)
│   │   ├── windows.js  # Window management logic
│   │   └── menu.js     # Application menu (if needed)
│   │
│   ├── /renderer       # Shared assets and utilities for all websites
│   │   ├── /components # Shared components (optional)
│   │   ├── /utils      # Shared utility functions
│   │   ├── /styles     # Shared CSS
│   │   ├── index.html  # Default landing page (optional)
│   │   ├── preload.js  # Shared preload scripts for security
│   │   └── ipc.js      # Shared IPC utilities
│   │
│   ├── /websites       # Separate frontend "websites"
│   │   ├── /site1      # Website 1
│   │   │   ├── index.html
│   │   │   ├── main.js
│   │   │   ├── styles.css
│   │   │   ├── site1.js
│   │   │   ├── /assets
│   │   │   └── /components
│   │   │
│   │   ├── /site2      # Website 2
│   │   │   ├── index.html
│   │   │   ├── main.js
│   │   │   ├── styles.css
│   │   │   ├── site2.js
│   │   │   ├── /assets
│   │   │   └── /components
│   │   │
│   │   ├── /site3      # Website 3 (more can be added)
│   │
│── /public             # Static assets (favicons, logos, images, etc.)
│── /dist               # Compiled/Bundled output
│── /node_modules       # Dependencies
│── package.json        # Project metadata & scripts
│── electron-builder.json # Electron packaging settings
│── webpack.config.js   # Webpack config (if using Webpack)
│── .gitignore          # Git ignore file
│── README.md           # Documentation
