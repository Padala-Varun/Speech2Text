import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // We can keep this for basic resets if strictly needed, but App.css covers most
// Note: App.css is imported in App.jsx, but let's ensure global styles are here if needed.
// Actually, I'll clear index.css content to avoid conflicts or just leave it minimal.

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
