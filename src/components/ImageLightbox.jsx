import { useState, useRef } from 'react';

export default function ImageLightbox({ src, name, label, onClose }) {
  const [zoom, setZoom] = useState(1);
  const lastTapRef = useRef(0);

  const zoomIn  = () => setZoom(z => Math.min(5, parseFloat((z + 0.5).toFixed(1))));
  const zoomOut = () => setZoom(z => Math.max(1, parseFloat((z - 0.5).toFixed(1))));

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) setZoom(z => z === 1 ? 2.5 : 1);
    lastTapRef.current = now;
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = name || 'image.jpg';
    a.click();
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
        <div className="lightbox-actions">
          <span className="lightbox-label">{label}</span>
          <button className="lightbox-zoom-btn" onPointerDown={e => { e.stopPropagation(); zoomOut(); }}>－</button>
          <button className="lightbox-zoom-btn" onPointerDown={e => { e.stopPropagation(); zoomIn(); }}>＋</button>
          <button className="btn btn-primary" style={{ fontSize: 14, padding: '6px 14px' }} onPointerDown={e => e.stopPropagation()} onClick={download}>Download</button>
          <button className="lightbox-close" onPointerDown={e => { e.stopPropagation(); onClose(); }}>✕</button>
        </div>
        <div className="lightbox-scroll">
          <img
            src={src}
            alt={name}
            className="lightbox-img"
            onClick={handleTap}
            style={{
              width: `${zoom * 100}%`,
              minWidth: '100%',
              cursor: zoom > 1 ? 'grab' : 'zoom-in',
              userSelect: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}
