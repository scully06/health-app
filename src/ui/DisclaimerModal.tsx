// src/ui/DisclaimerModal.tsx
import React from 'react';
import { buttonStyle } from './styles';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '12px',
  maxWidth: '500px',
  width: '90%',
  textAlign: 'left',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
};

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, color: '#2c3e50' }}>免責事項</h2>
        <p style={{ lineHeight: 1.6, color: '#34495e' }}>
          このアプリは、栄養士の代わりになるものではなく、医療アドバイスを提供するものでもありません。
        </p>
        <p style={{ lineHeight: 1.6, color: '#34495e' }}>
          不明な点がある場合は、医師に相談してください。
        </p>
        <button onClick={onClose} style={{ ...buttonStyle, width: 'auto', padding: '10px 20px', float: 'right' }}>
          理解しました
        </button>
      </div>
    </div>
  );
};