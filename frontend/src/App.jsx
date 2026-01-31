import React from 'react';
import ReelDownloader from './components/ReelDownloader';
import './App.css';

function App() {
    return (
        <div className="app-container">
            <header className="app-header">
                <h1>InstaReel Downloader</h1>
                <p className="subtitle">Download your favorite Instagram Reels instantly</p>
            </header>
            <main>
                <ReelDownloader />
            </main>
        </div>
    );
}

export default App;
