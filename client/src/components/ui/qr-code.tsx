import { useEffect, useRef } from "react";

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 192 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Simple QR code generation using a library would go here
    // For now, we'll create a placeholder
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw a simple pattern representing a QR code
    ctx.fillStyle = '#000000';
    
    // Create a grid pattern
    const cellSize = size / 25;
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        // Create a pseudo-random pattern based on the value
        const hash = value.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        if ((x + y + hash) % 3 === 0) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }

    // Draw corner squares (QR code positioning markers)
    const markerSize = cellSize * 7;
    
    // Top-left
    ctx.fillRect(0, 0, markerSize, markerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cellSize, cellSize, markerSize - 2 * cellSize, markerSize - 2 * cellSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(cellSize * 2, cellSize * 2, markerSize - 4 * cellSize, markerSize - 4 * cellSize);
    
    // Top-right
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - markerSize, 0, markerSize, markerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size - markerSize + cellSize, cellSize, markerSize - 2 * cellSize, markerSize - 2 * cellSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - markerSize + cellSize * 2, cellSize * 2, markerSize - 4 * cellSize, markerSize - 4 * cellSize);
    
    // Bottom-left
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, size - markerSize, markerSize, markerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cellSize, size - markerSize + cellSize, markerSize - 2 * cellSize, markerSize - 2 * cellSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(cellSize * 2, size - markerSize + cellSize * 2, markerSize - 4 * cellSize, markerSize - 4 * cellSize);
    
  }, [value, size]);

  return (
    <div className="bg-white p-6 rounded-xl inline-block">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="block"
      />
      <div className="text-center mt-3 text-gray-600 text-sm">
        Scan to submit questions
      </div>
    </div>
  );
}
