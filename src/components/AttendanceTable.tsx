import { useRef } from 'react';
import type { AttendanceRecord } from '../types';

const INTERNAL = new Set(['id', '_original', 'scannedAt']);

function getColumns(records: AttendanceRecord[]): string[] {
  const seen = new Set<string>();
  records.forEach(r =>
    Object.keys(r).forEach(k => { if (!INTERNAL.has(k)) seen.add(k); })
  );
  return [...seen];
}

interface SignatureCellProps {
  recordId: number;
  onSign: (recordId: number, dataUrl: string | null) => void;
}

function SignatureCell({ recordId, onSign }: SignatureCellProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasData = useRef(false);

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = 'touches' in e ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  };

  const start = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const move = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasData.current = true;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasData.current && canvasRef.current) {
      onSign(recordId, canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    hasData.current = false;
    onSign(recordId, null);
  };

  return (
    <div className="sig-cell-wrap">
      <canvas
        ref={canvasRef}
        className="sig-cell-canvas"
        width={200}
        height={60}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button className="sig-cell-clear btn-icon" onClick={clear} title="Clear">&#10005;</button>
    </div>
  );
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  signatures: Record<number, string | null>;
  onSign: (recordId: number, dataUrl: string | null) => void;
  onDelete: (id: number) => void;
}

export default function AttendanceTable({ records, signatures, onSign, onDelete }: AttendanceTableProps) {
  if (records.length === 0) {
    return (
      <div className="table-empty">
        <div className="table-empty-icon">&#128203;</div>
        <p>No records yet. Scan a QR code to add attendance.</p>
      </div>
    );
  }

  const columns = getColumns(records);

  return (
    <div className="table-scroll">
      <table className="attendance-table">
        <thead>
          <tr>
            <th className="col-no">#</th>
            {columns.map(col => <th key={col}>{col}</th>)}
            <th className="col-time">Scanned At</th>
            <th className="col-sig">Signature</th>
            <th className="col-action"></th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, i) => (
            <tr key={record.id}>
              <td className="col-no">{i + 1}</td>
              {columns.map(col => (
                <td key={col}>{record[col] ?? <span style={{ color: '#cbd5e1' }}>—</span>}</td>
              ))}
              <td className="col-time">{record.scannedAt}</td>
              <td className="col-sig">
                <SignatureCell recordId={record.id} onSign={onSign} />
              </td>
              <td className="col-action">
                <button className="btn-icon" title="Remove" onClick={() => onDelete(record.id)}>
                  &#10005;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
