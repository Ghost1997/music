import React from 'react';
import '../styles/Toast.css';

const Toast = ({ message, type = 'success', onClose }) => {
  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        {type === 'success' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        )}
        {type === 'error' && (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )}
        <span>{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

export default Toast;
