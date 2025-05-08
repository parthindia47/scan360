import React from 'react';

function Footer() {
  return (
    <footer style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      background: '#f8f9fa',
      borderTop: '1px solid #ddd',
      padding: '10px 20px',
      textAlign: 'center',
      fontSize: '0.9rem',
      zIndex: 50
    }}>
      © 2025 Scan360 · All rights reserved.
    </footer>
  );
}

export default Footer;
