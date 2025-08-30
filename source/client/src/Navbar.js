import React, { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const navLinks = [
    ["/", "Dashboard"],
    ["/announcements", "Announcements"],
    ["/upcoming_events", "Upcoming Events"],
    ["/fund_raise", "Fund Raise"],
    ["/results", "Results"],
    ["/trades", "Trades"],
    ["/news", "Resources"],
    ["/chat", "Chat"],
    ["/ai", "AI"],
  ];

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-gray-100 border-b border-gray-300 shadow-sm">
      <div className="px-6 py-2 flex items-center space-x-4">
        {/* Hamburger button (mobile only) */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden focus:outline-none"
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6 text-gray-700" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-gray-700" />
          )}
        </button>

        {/* Logo */}
        <div className="text-xl font-bold text-blue-700">Scan360</div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-3 text-base font-medium text-gray-700">
          {navLinks.map(([to, label]) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded transition duration-150 ease-in-out ${
                    isActive
                      ? "text-blue-600 font-semibold"
                      : "hover:text-blue-500"
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div
          ref={menuRef}
          className="md:hidden bg-gray-100 border-t border-gray-300"
        >
          <ul className="flex flex-col space-y-1 py-2 text-base font-medium text-gray-700">
            {navLinks.map(([to, label]) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2 transition duration-150 ease-in-out ${
                      isActive
                        ? "text-blue-600 font-semibold"
                        : "hover:text-blue-500"
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
