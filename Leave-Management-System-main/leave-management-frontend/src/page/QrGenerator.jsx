import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
// Import your central API service
import { generateQrToken } from '../services/Qr'; 

const QrGenerator = () => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);

    // 1. Function using your custom API service file
    const fetchNewToken = async () => {
        try {
            setError(null);
            
            // Calling your integrated endpoint
            const response = await generateQrToken();
            
            if (response.data && response.data.token) {
                setToken(response.data.token);
                setTimeLeft(15); // Reset visual countdown timer
            }
        } catch (err) {
            console.error('Error fetching token:', err);
            setError('Failed to load QR Code. Retrying...');
        } finally {
            setLoading(false);
        }
    };

    // 2. Lifecycle effect: Runs once on load, starts 15-second loop
    useEffect(() => {
        fetchNewToken();

        // Interval 1: Fetch a brand new token from backend every 15 seconds
        const tokenInterval = setInterval(() => {
            fetchNewToken();
        }, 15000);

        // Interval 2: Visual 1-second countdown progress bar/text
        const countdownInterval = setInterval(() => {
            setTimeLeft((prevTime) => (prevTime > 1 ? prevTime - 1 : 15));
        }, 1000);

        // Clean up intervals when the tablet screen is closed/unmounted
        return () => {
            clearInterval(tokenInterval);
            clearInterval(countdownInterval);
        };
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Scanner pour pointer</h1>
                <p style={styles.subtitle}>Présentez votre application mobile devant l'écran</p>

                {/* State Render Engine */}
                {loading && <p style={styles.infoText}>Génération du code...</p>}
                
                {error && (
                    <div style={styles.errorBox}>
                        <p>{error}</p>
                        <button onClick={fetchNewToken} style={styles.retryButton}>
                            Réessayer
                        </button>
                    </div>
                )}

                {!loading && !error && token && (
                    <div style={styles.qrWrapper}>
                        <QRCode 
                            value={token} 
                            size={256} 
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                        <div style={styles.timerContainer}>
                            <p style={styles.timerText}>Prochain code dans : <strong>{timeLeft}s</strong></p>
                            {/* Visual Progress Bar */}
                            <div style={styles.progressBarBg}>
                                <div 
                                    style={{ 
                                        ...styles.progressBarFill, 
                                        width: `${(timeLeft / 15) * 100}%` 
                                    }} 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Simple, modern styling (ideal for wall display layout)
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '450px',
        width: '100%',
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1f2937',
        margin: '0 0 8px 0',
    },
    subtitle: {
        fontSize: '16px',
        color: '#6b7280',
        margin: '0 0 32px 0',
    },
    qrWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '16px',
        backgroundColor: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
    },
    infoText: {
        fontSize: '16px',
        color: '#4b5563',
    },
    errorBox: {
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        padding: '16px',
        borderRadius: '8px',
    },
    retryButton: {
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: '#dc2626',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    timerContainer: {
        width: '100%',
    },
    timerText: {
        fontSize: '14px',
        color: '#4b5563',
        margin: '0 0 8px 0',
    },
    progressBarBg: {
        width: '100%',
        height: '6px',
        backgroundColor: '#e5e7eb',
        borderRadius: '3px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2563eb',
        transition: 'width 1s linear',
    }
};

export default QrGenerator;