import React from 'react';
import { NavLink } from 'react-router-dom';

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
      <div style={{ marginBottom: '5px' }}>
        Scan360 © 2025
        <a href="/contact" style={{ margin: '0 10px', color: '#007bff', textDecoration: 'none' }}>Contact Us</a>
        <a href="/about" style={{ margin: '0 10px', color: '#007bff', textDecoration: 'none' }}>About</a>
        <a href="/terms" style={{ margin: '0 10px', color: '#007bff', textDecoration: 'none' }}>Terms</a>
      </div>
    </footer>
  );
}

export default Footer;
