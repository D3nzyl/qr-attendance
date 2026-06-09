import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046, ctx.currentTime); // C6
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch { /* ignore if audio unavailable */ }
}

export default function QRScanner({ onScan, readerId = 'qr-reader', autoStart = false, onClose }) {
  const [isActive, setIsActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ text: '', time: 0 });
  const flashTimer = useRef(null);

  const handleDecoded = (text) => {
    const now = Date.now();
    if (text === lastScanRef.current.text && now - lastScanRef.current.time < 2000) return;
    lastScanRef.current = { text, time: now };

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);

    // Sound feedback
    beep();

    // Green overlay flash
    clearTimeout(flashTimer.current);
    setFlash(true);
    flashTimer.current = setTimeout(() => setFlash(false), 900);

    onScan(text);
  };

  const clearDom = () => {
    const el = document.getElementById(readerId);
    if (el) el.innerHTML = '';
  };

  const start = async () => {
    setError('');
    clearDom();
    let scanner = new Html5Qrcode(readerId);
    scannerRef.current = scanner;
    const config = { fps: 10, qrbox: { width: 240, height: 240 } };
    try {
      try {
        await scanner.start({ facingMode: 'environment' }, config, handleDecoded, () => {});
      } catch {
        try { await scanner.stop(); } catch { /* ignore */ }
        clearDom();
        scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;
        await scanner.start({ facingMode: 'user' }, config, handleDecoded, () => {});
      }
      setIsActive(true);
    } catch (err) {
      setError(typeof err === 'string' ? err : (err?.message || 'Could not access camera.'));
      scannerRef.current = null;
    }
  };

  const stop = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch { /* ignore */ }
    scannerRef.current = null;
    setIsActive(false);
  };

  useEffect(() => {
    if (autoStart) start();
    return () => { stop(); };
  }, []); // eslint-disable-line

  const handleClose = async () => {
    await stop();
    if (onClose) onClose();
  };

  return (
    <div className="scanner-wrap">
      <div id={readerId} style={{ width: '100%' }} />

      {/* Green success overlay */}
      {flash && (
        <div className="scanner-success-overlay">
          <div className="scanner-success-tick">
            <svg viewBox="0 0 52 52" className="scanner-tick-svg">
              <circle className="scanner-tick-circle" cx="26" cy="26" r="24" />
              <path className="scanner-tick-check" d="M14 27 l8 8 l16-16" />
            </svg>
          </div>
        </div>
      )}

      {!isActive && (
        <div className="scanner-idle">
          <div className="scanner-idle-icon">&#128247;</div>
          {autoStart
            ? <p style={{ color: '#94a3b8', fontSize: 13 }}>Starting camera…</p>
            : <>
                <p>Point camera at a QR code to record attendance</p>
                <button className="btn btn-primary" onClick={start}>Start Camera</button>
              </>
          }
          {error && <p className="scanner-error">{error}</p>}
        </div>
      )}
      {isActive && (
        <div className="scanner-stop-row">
          <button
            className="btn btn-ghost"
            style={{ color: '#fff', borderColor: '#475569' }}
            onClick={onClose ? handleClose : stop}
          >
            {onClose ? '✕ Close Scanner' : 'Stop Camera'}
          </button>
        </div>
      )}
    </div>
  );
}
