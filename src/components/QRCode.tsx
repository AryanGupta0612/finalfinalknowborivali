import React from 'react';
import QRCodeReact from 'react-qr-code';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

function QRCode({ url, size = 100, className = '' }: QRCodeProps) {
  return (
    <div className={`inline-block ${className}`}>
      <QRCodeReact
        value={url}
        size={size}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
    </div>
  );
}

export default QRCode;