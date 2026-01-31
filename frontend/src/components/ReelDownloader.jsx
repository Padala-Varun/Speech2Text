import React, { useState } from 'react';
import axios from 'axios';
import { FaDownload, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaFileAlt, FaBrain, FaPlus, FaTrash, FaFire, FaVideo, FaMagic } from 'react-icons/fa';
import LoadingOverlay from './LoadingOverlay';
import ReactMarkdown from 'react-markdown';



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
        <div key={item.filename} className="result-card">
            <div className="result-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <FaCheckCircle style={{ color: 'var(--secondary-color)', fontSize: '1.4rem' }} />
                <h3 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 600 }}>
                    {item.filename.split('_').slice(0, 2).join('_')}
                    {isViral && <span className="badge viral-badge" style={{ marginLeft: '12px', verticalAlign: 'middle' }}>Viral</span>}
                </h3>
            </div>

            <div className="video-container">
                <video
                    className="video-player"
                    controls
                    src={window.location.hostname === 'localhost' ? `http://localhost:3000${item.videoPath}` : item.videoPath}
                >
                    Your browser does not support the video tag.
                </video>
            </div>

            <div className="analysis-grid" style={{ display: 'grid', gap: '20px' }}>
                {item.transcript && (
                    <div className="data-box">
                        <h4><FaFileAlt /> Transcript Extract</h4>
                        <div className="text-content" style={{ fontSize: '0.95rem', opacity: 0.7 }}>
                            {item.transcript.length > 300 ? item.transcript.substring(0, 300) + '...' : item.transcript}
                        </div>
                    </div>
                )}

                {item.analysis && (
                    <div className="data-box" style={{ borderLeft: '4px solid var(--primary-color)' }}>
                        <h4><FaBrain /> AI Persona Analysis</h4>
                        <div className="text-content" style={{ fontSize: '0.95rem' }}>
                            <ReactMarkdown>{item.analysis}</ReactMarkdown>
                        </div>

                    </div>
                )}
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                <a
                    href={window.location.hostname === 'localhost' ? `http://localhost:3000${item.videoPath}` : item.videoPath}
                    className="btn-small-glow"
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <FaDownload /> Download MP4
                </a>
            </div>
        </div>
    );

    return (
        <div className="app-viewport">
            <LoadingOverlay isActive={loading} />
            {/* Background Layer */}
            <div className="mesh-bg"></div>


            <div className="downloader-container">
                <header className="App-header">
                    <h1>ReelScript Pro</h1>
                    <p>Remaster Viral Hits into Your Unique Personal Brand</p>
                </header>

                <div className="glass-panel">
                    <div className="main-grid">
                        <section className="input-column">
                            <h2 className="column-title"><FaVideo /> Your Base Style</h2>
                            <div className="input-list">
                                {urls.map((url, index) => (
                                    <div key={index} className="premium-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Paste your source reel URL..."
                                            value={url}
                                            onChange={(e) => handleUrlChange(index, e.target.value)}
                                            disabled={loading}
                                        />
                                        {urls.length > 1 && (
                                            <button
                                                className="remove-btn"
                                                onClick={() => handleRemoveUrl(index)}
                                                disabled={loading}
                                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}
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
                                style={{ marginTop: '10px' }}
                            >
                                <FaPlus /> Add Additional Reference
                            </button>
                        </section>

                        <section className="input-column">
                            <h2 className="column-title"><FaFire /> Viral Blueprint</h2>
                            <div className="premium-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Paste viral trend URL..."
                                    value={viralUrl}
                                    onChange={(e) => setViralUrl(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '15px', fontWeight: 300 }}>
                                Our AI will extract the viral hook and re-engineer the script specifically for your persona.
                            </p>
                        </section>
                    </div>

                    <div className="main-actions">
                        <button
                            onClick={handleDownload}
                            disabled={loading || (urls.every(u => !u.trim()) && !viralUrl.trim())}
                            className={`btn-legendary ${loading ? 'loading' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="spinner" />
                                    Synthesizing Persona...
                                </>
                            ) : (
                                <>
                                    <FaMagic />
                                    Generate Pro Remake Script
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

                <div className="results-wrapper">
                    {loading && (
                        <div className="main-grid" style={{ marginTop: '80px' }}>
                            <div className="persona-results">
                                <div className="result-card skeleton">
                                    <div className="skeleton-title skeleton"></div>
                                    <div className="skeleton-video skeleton"></div>
                                    <div className="analysis-grid">
                                        <div className="data-box skeleton" style={{ height: '100px' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="trend-results">
                                <div className="result-card skeleton">
                                    <div className="skeleton-title skeleton"></div>
                                    <div className="skeleton-video skeleton"></div>
                                    <div className="analysis-grid">
                                        <div className="data-box skeleton" style={{ height: '100px' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && generatedContent && (

                        <div
                            className="script-card-legendary"
                            style={{
                                background: generatedContent.startsWith('ERROR:') ? 'rgba(239, 68, 68, 0.1)' : undefined,
                                borderColor: generatedContent.startsWith('ERROR:') ? '#ef4444' : undefined,
                            }}
                        >
                            <h2 className="script-header" style={{
                                color: generatedContent.startsWith('ERROR:') ? '#ef4444' : 'var(--primary-color)',
                            }}>
                                {generatedContent.startsWith('ERROR:') ? 'System Alert' : 'VIRAL REMAKE SCRIPT'}
                            </h2>
                            <div className="script-content">
                                <ReactMarkdown>{generatedContent}</ReactMarkdown>
                            </div>

                        </div>
                    )}

                    {!loading && (results.length > 0 || viralResult) && (
                        <div className="main-grid" style={{ marginTop: '80px', alignItems: 'start' }}>

                            <div className="persona-results">
                                {results.length > 0 && <h3 className="column-title" style={{ fontSize: '1.2rem', opacity: 0.6 }}>Analysis Sources</h3>}
                                {results.map((item) => renderResult(item, false))}
                            </div>
                            <div className="trend-results">
                                {viralResult && <h3 className="column-title" style={{ fontSize: '1.2rem', opacity: 0.6 }}>Trend Source</h3>}
                                {viralResult && renderResult(viralResult, true)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReelDownloader;
