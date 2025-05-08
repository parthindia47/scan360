import React from 'react';
import { Link } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: '#f8f9fa',
      padding: '10px 20px',
      borderBottom: '1px solid #ccc',
    }}>
      <ul style={{ display: 'flex', gap: '20px', listStyle: 'none', margin: 0, padding: 0 }}>
        <NavLink to="/" style={({ isActive }) => ({ fontWeight: isActive ? 'bold' : 'normal' })}>Dashboard</NavLink>
        <NavLink to="/announcements" style={({ isActive }) => ({ fontWeight: isActive ? 'bold' : 'normal' })}>Announcements</NavLink>
        <NavLink to="/news_events" style={({ isActive }) => ({ fontWeight: isActive ? 'bold' : 'normal' })}>News & Events</NavLink>
        <NavLink to="/smart_money" style={({ isActive }) => ({ fontWeight: isActive ? 'bold' : 'normal' })}>Smart Money</NavLink>
      </ul>
    </nav>
  );
}

export default Navbar;
