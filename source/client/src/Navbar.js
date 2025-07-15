import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-gray-100 border-b border-gray-300 shadow-sm">
      <div className="px-6 py-3 flex items-center space-x-6">
        {/* Logo / Brand */}
        <div className="text-xl font-bold text-blue-700">Scan360</div>

        {/* Navigation Links */}
        <ul className="flex space-x-3 text-base font-medium text-gray-700">
          {[
            ['/', 'Dashboard'],
            ['/announcements', 'Announcements'],
            ['/upcoming_events', 'Upcoming Events'],
            ['/fund_raise', 'Fund Raise'],
            ['/results', 'Results'],
            ['/news', 'News'],
            ['/chat', 'Chat'],
            ['/ai', 'AI'],
          ].map(([to, label]) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded transition duration-150 ease-in-out ${
                    isActive
                      ? 'text-blue-600 font-semibold'
                      : 'hover:text-blue-500'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
