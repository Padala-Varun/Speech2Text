import React, { useState, useEffect } from 'react';
import { FaBrain, FaAtom, FaMagic, FaSync } from 'react-icons/fa';

const LoadingOverlay = ({ isActive }) => {
    const [statusIndex, setStatusIndex] = useState(0);
    const statuses = [
        "Initializing Neural Engine...",
        "Extracting Visual DNA...",
        "Decoding Vocal Patterns...",
        "Synthesizing Persona...",
        "Re-engineering Hook Strategy...",
        "Polishing Viral Script...",
        "Finalizing Masterpiece..."
    ];

    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statuses.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isActive]);

    if (!isActive) return null;

    return (
        <div className="loading-overlay">
            <div className="orbital-loader">
                <div className="orbit orbit-1">
                    <FaBrain className="loader-icon" />
                </div>
                <div className="orbit orbit-2">
                    <FaAtom className="loader-icon" />
                </div>
                <div className="orbit orbit-3">
                    <FaMagic className="loader-icon" />
                </div>
                <div className="loader-center">
                    <FaSync className="loader-spin" />
                </div>
            </div>

            <div className="loading-content">
                <h2 className="loading-title">Synthesizing...</h2>
                <p className="loading-status">{statuses[statusIndex]}</p>
                <div className="loading-progress-bar">
                    <div className="progress-fill"></div>
                </div>
            </div>

            <div className="loading-particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className={`particle p${i}`}></div>
                ))}
            </div>
        </div>
    );
};

export default LoadingOverlay;
