import React, { useState } from 'react';
import axios from 'axios';
import { FaDownload, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaFileAlt, FaBrain, FaPlus, FaTrash, FaFire, FaVideo, FaMagic } from 'react-icons/fa';

const ReelDownloader = () => {
    const [urls, setUrls] = useState(['']);
    const [viralUrl, setViralUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState([]);
    const [viralResult, setViralResult] = useState(null);
    const [generatedContent, setGeneratedContent] = useState(null);

    const handleAddUrl = () => {
        setUrls([...urls, '']);
    };

    const handleRemoveUrl = (index) => {
        const newUrls = [...urls];
        newUrls.splice(index, 1);
        setUrls(newUrls);
    };

    const handleUrlChange = (index, value) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const handleDownload = async () => {
        const validUrls = urls.filter(u => u.trim() !== '');
        const hasViralUrl = viralUrl.trim() !== '';

        if (validUrls.length === 0 && !hasViralUrl) {
            setError('Please enter at least one Reel URL or a Viral Reel URL');
            return;
        }

        setLoading(true);
        setError('');
        setResults([]);
        setViralResult(null);
        setGeneratedContent(null);

        try {
            const backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
            const response = await axios.post(`${backendUrl}/api/download`, {
                urls: validUrls,
                viralUrl: viralUrl.trim()
            });

            if (response.data.success) {
                if (response.data.results) setResults(response.data.results);
                if (response.data.viralResult) setViralResult(response.data.viralResult);
                if (response.data.generatedContent) setGeneratedContent(response.data.generatedContent);
            } else {
                setError('Failed to process the reels. Please try again.');
            }
        } catch (err) {
            console.error('Download error:', err);
            setError(err.response?.data?.error || 'An error occurred while connecting to the server.');
        } finally {
            setLoading(false);
        }
    };

    const renderResult = (item, isViral = false) => (
        <div key={item.filename}>
            <div className="result-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <FaCheckCircle style={{ color: 'var(--secondary-color)' }} />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                    {item.filename.split('_').slice(0, 2).join('_')}...
                    {isViral && <span className="badge viral-badge" style={{ marginLeft: '10px' }}>Viral</span>}
                </h3>
            </div>

            <video
                className="video-player"
                controls
                src={window.location.hostname === 'localhost' ? `http://localhost:3000${item.videoPath}` : item.videoPath}
            >
                Your browser does not support the video tag.
            </video>

            <div className="analysis-section">
                {item.transcript && (
                    <div className="data-box">
                        <h4><FaFileAlt /> Transcript</h4>
                        <div className="text-content" style={{ fontSize: '0.95rem', opacity: 0.8 }}>
                            {item.transcript}
                        </div>
                    </div>
                )}

                {item.analysis && (
                    <div className="data-box" style={{ borderLeft: '3px solid var(--primary-color)' }}>
                        <h4><FaBrain /> Style Analysis</h4>
                        <div className="text-content analysis-text" style={{ fontSize: '0.95rem' }}>
                            {item.analysis}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <a
                    href={window.location.hostname === 'localhost' ? `http://localhost:3000${item.videoPath}` : item.videoPath}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'inline-flex' }}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Download
                </a>
            </div>
        </div>
    );

    return (
        <div className="downloader-container">
            <header className="App-header">
                <h1>ReelScript Pro</h1>
                <p>Transform Viral Content into Your Authentic Speaking Style</p>
            </header>

            <div className="glass-card">
                <div className="main-grid">
                    <div className="standard-section">
                        <h2 className="column-header"><FaVideo /> Your Reels</h2>
                        <div className="input-list">
                            {urls.map((url, index) => (
                                <div key={index} className="url-input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="Paste Instagram Reel URL here..."
                                        value={url}
                                        onChange={(e) => handleUrlChange(index, e.target.value)}
                                        disabled={loading}
                                    />
                                    {urls.length > 1 && (
                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemoveUrl(index)}
                                            disabled={loading}
                                            title="Remove URL"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            className="add-btn"
                            onClick={handleAddUrl}
                            disabled={loading}
                        >
                            <FaPlus /> Add More Reels
                        </button>
                    </div>

                    <div className="viral-section">
                        <h2 className="column-header"><FaFire /> Viral Reference</h2>
                        <div className="url-input-wrapper">
                            <input
                                type="text"
                                placeholder="Paste Viral Reel URL here..."
                                value={viralUrl}
                                onChange={(e) => setViralUrl(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                            We'll transcribe this viral hit and adapt its core message to your unique style.
                        </p>
                    </div>
                </div>

                <div className="action-buttons">
                    <button
                        onClick={handleDownload}
                        disabled={loading || (urls.every(u => !u.trim()) && !viralUrl.trim())}
                        className={`btn-primary ${loading ? 'loading' : ''}`}
                        style={{ width: '100%', maxWidth: 'none', padding: '20px' }}
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="spinner" />
                                Processing AI Magic...
                            </>
                        ) : (
                            <>
                                <FaDownload />
                                Generate Authenticated Remake
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="error-msg">
                        <FaExclamationTriangle /> {error}
                    </div>
                )}
            </div>

            <div className="results-container">
                {generatedContent && (
                    <div className="result-item">
                        <div
                            className="glass-card remake-script-card"
                            style={{
                                background: generatedContent.startsWith('ERROR:') ? 'rgba(239, 68, 68, 0.1)' : undefined,
                                borderColor: generatedContent.startsWith('ERROR:') ? '#ef4444' : undefined,
                                textAlign: 'left'
                            }}
                        >
                            <h3 style={{
                                color: generatedContent.startsWith('ERROR:') ? '#ef4444' : 'var(--primary-color)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '1.5rem',
                                justifyContent: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em'
                            }}>
                                {generatedContent.startsWith('ERROR:') ? <FaExclamationTriangle /> : <FaMagic />}
                                {generatedContent.startsWith('ERROR:') ? 'AI LIMIT REACHED' : 'VIRAL REMAKE SCRIPT'}
                            </h3>
                            <div className="text-content" style={{ fontSize: '1.2rem', lineHeight: '1.8' }}>
                                {generatedContent}
                            </div>
                        </div>
                    </div>
                )}

                {(results.length > 0 || viralResult) && (
                    <div className="main-grid" style={{ marginTop: '40px' }}>
                        <div className="standard-results" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {results.map((item) => (
                                <div className="result-item glass-card" key={item.filename}>
                                    {renderResult(item, false)}
                                </div>
                            ))}
                        </div>
                        <div className="viral-results">
                            {viralResult && (
                                <div className="result-item glass-card">
                                    {renderResult(viralResult, true)}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReelDownloader;
