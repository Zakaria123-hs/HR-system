import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { scanQrToken } from '../services/Qr';
import { useNotifications } from "../hooks/useNotifications";
import DashboardLayout from '../layouts/DashboardLayout';

const QrScanner = () => {
    const { notifications, unreadCount, fetchNotifications } = useNotifications();
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef(null);
    const initializedRef = useRef(false); // prevents StrictMode double-init

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        // Safety net: clear any leftover DOM from a previous instance
        const readerEl = document.getElementById('reader');
        if (readerEl) readerEl.innerHTML = '';

        const scanner = new Html5QrcodeScanner('reader', {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [0]
        });

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((err) => console.error("Failed to clear scanner:", err));
                scannerRef.current = null;
            }
            initializedRef.current = false;
        };
    }, []);

    const onScanSuccess = async (decodedText) => {
        if (isProcessing) return;

        setIsProcessing(true);
        setScanError(null);
        setScanResult(null);

        if (scannerRef.current) {
            scannerRef.current.pause(true);
        }

        try {
            const response = await scanQrToken({ token: decodedText });
            if (response.data) {
                setScanResult(response.data);
            }
        } catch (err) {
            console.error('API Scan Error:', err);
            const errorMessage = err.response?.data?.error || 'Erreur de connexion au serveur.';
            setScanError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const onScanFailure = (error) => {
        console.log('faillescan', error)
    };

    const handleReset = () => {
        setScanResult(null);
        setScanError(null);
        if (scannerRef.current) {
            scannerRef.current.resume();
        }
    };

    return (
        <DashboardLayout notifications={notifications} unreadCount={unreadCount} fetchNotifications={fetchNotifications}>
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.title}>Scanner un Code QR</h1>
                    <p style={styles.subtitle}>Cadrez le code QR de la tablette murale dans la zone de détection</p>

                    <div style={{ display: (scanResult || scanError) ? 'none' : 'block' }}>
                        <div id="reader" style={styles.scannerViewport}></div>
                    </div>

                    {isProcessing && <p style={styles.infoText}>Vérification en cours...</p>}

                    {scanResult && (
                        <div style={styles.successBox}>
                            <div style={styles.iconCircle}>✓</div>
                            <h3>{scanResult.message}</h3>
                            <div style={styles.detailsList}>
                                <p>⏱️ <strong>Heure :</strong> {scanResult.time}</p>
                                {scanResult.type === 'check_out' && (
                                    <p>💼 <strong>Temps travaillé :</strong> {Math.round(scanResult.worked_minutes)} min</p>
                                )}
                            </div>
                            <button onClick={handleReset} style={styles.resetButton}>Terminer</button>
                        </div>
                    )}

                    {scanError && (
                        <div style={styles.errorBox}>
                            <div style={{ ...styles.iconCircle, backgroundColor: '#fee2e2', color: '#dc2626' }}>✕</div>
                            <h3>Échec du pointage</h3>
                            <p style={{ margin: '8px 0 24px 0' }}>{scanError}</p>
                            <button onClick={handleReset} style={{ ...styles.resetButton, backgroundColor: '#dc2626' }}>Réessayer</button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif', padding: '16px' },
    card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', textAlign: 'center', maxWidth: '400px', width: '100%' },
    title: { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' },
    subtitle: { fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0', lineHeight: '1.4' },
    scannerViewport: { border: 'none', borderRadius: '12px', overflow: 'hidden' },
    infoText: { margin: '16px 0', color: '#2563eb', fontWeight: '600' },
    successBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' },
    errorBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' },
    iconCircle: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' },
    detailsList: { backgroundColor: '#f9fafb', padding: '12px 24px', borderRadius: '8px', textAlign: 'left', width: '80%', margin: '12px 0 24px 0', fontSize: '15px', border: '1px solid #f3f4f6' },
    resetButton: { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }
};

export default QrScanner;