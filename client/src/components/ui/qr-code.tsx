import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 192 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).catch((error: any) => {
      console.error('Error generating QR code:', error);
    });
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
