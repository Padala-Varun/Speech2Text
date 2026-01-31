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
        <div key={item.filename} className="result-container">
            <div className="result-header">
                <FaCheckCircle style={{ color: '#03dac6' }} />
                <h3>
                    {item.filename}
                    {isViral && <span className="viral-badge">Viral</span>}
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
                        <div className="text-content">
                            {item.transcript}
                        </div>
                    </div>
                )}

                {item.analysis && (
                    <div className="data-box">
                        <h4><FaBrain /> AI Analysis</h4>
                        <div className="text-content analysis-text">
                            {item.analysis}
                        </div>
                    </div>
                )}
            </div>

            <div className="download-link-wrapper">
                <a
                    href={window.location.hostname === 'localhost' ? `http://localhost:3000${item.videoPath}` : item.videoPath}
                    className="download-link"
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Download Video
                </a>
            </div>
        </div>
    );

    return (
        <div className="downloader-container">
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
                        style={{ width: '100%' }}
                    >
                        <FaPlus /> Add More Reels
                    </button>
                </div>

                <div className="viral-section">
                    <h2 className="column-header"><FaFire /> Viral Reference Reel</h2>
                    <div className="url-input-wrapper">
                        <input
                            type="text"
                            placeholder="Paste Viral Reel URL here..."
                            value={viralUrl}
                            onChange={(e) => setViralUrl(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: '0.5rem' }}>
                        Viral reels are transcribed but skip AI analysis.
                    </p>
                </div>
            </div>

            <div className="action-buttons">
                <button
                    onClick={handleDownload}
                    disabled={loading || (urls.every(u => !u.trim()) && !viralUrl.trim())}
                    className={`download-btn ${loading ? 'loading' : ''}`}
                    style={{ maxWidth: '400px', margin: '0 auto' }}
                >
                    {loading ? (
                        <>
                            <FaSpinner className="spinner" />
                            Processing All...
                        </>
                    ) : (
                        <>
                            <FaDownload />
                            Analyze & Process All
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="error-msg">
                    <FaExclamationTriangle /> {error}
                </div>
            )}

            {generatedContent && (
                <div className="generated-content-section" style={{ marginTop: '3rem', animation: 'fadeIn 0.5s ease' }}>
                    <div
                        className="data-box"
                        style={{
                            background: generatedContent.startsWith('ERROR:') ? 'rgba(207, 102, 121, 0.1)' : 'rgba(187, 134, 252, 0.1)',
                            border: `1px solid ${generatedContent.startsWith('ERROR:') ? '#cf6679' : 'var(--primary-color)'}`,
                            textAlign: 'left'
                        }}
                    >
                        <h3 style={{
                            color: generatedContent.startsWith('ERROR:') ? '#cf6679' : 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '1.5rem',
                            justifyContent: 'center'
                        }}>
                            {generatedContent.startsWith('ERROR:') ? <FaExclamationTriangle /> : <FaMagic />}
                            {generatedContent.startsWith('ERROR:') ? 'AI PROCESSING LIMIT REACHED' : 'VIRAL REMAKE SCRIPT'}
                        </h3>
                        <div className="text-content" style={{ color: '#fff', fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>
                            {generatedContent}
                        </div>
                    </div>
                </div>
            )}

            {(results.length > 0 || viralResult) && (
                <div className="results-list" style={{ marginTop: generatedContent ? '2rem' : '0' }}>
                    <div className="main-grid">
                        <div className="standard-results">
                            {results.map((item) => renderResult(item, false))}
                        </div>
                        <div className="viral-results">
                            {viralResult && renderResult(viralResult, true)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReelDownloader;
