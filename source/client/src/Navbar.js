import React, { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [directory, setDirectory] = useState({});
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/other/symbol_list`)
      .then(res => {
        if (Array.isArray(res.data)) {
          // Convert array [{symbol, name}, ...] → { [symbol]: name }
          const map = {};
          res.data.forEach((row) => {
            if (row.symbol && row.name) {
              map[row.symbol] = row.name;
            }
          });
          setDirectory(map);
        }
      })
      .catch(err => {
        console.error('Failed to fetch bulkDeals', err);
      });
  }, []);

  // ---- Search state ----
  const [q, setQ] = useState("");
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const sugRef = useRef(null);
  const navigate = useNavigate();

  // Convert {SYM: "Name"} → [{symbol, name}]
  const entries = useMemo(
    () =>
      Object.entries(directory).map(([symbol, name]) => ({
        symbol: symbol.trim(),
        name: String(name || "").trim(),
      })),
    [directory]
  );

  // Filter suggestions by name (and symbol as fallback)
  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const out = [];
    for (const e of entries) {
      const hit =
        e.name.toLowerCase().includes(s) ||
        e.symbol.toLowerCase().includes(s);
      if (hit) out.push(e);
      if (out.length >= 8) break; // cap list
    }
    return out;
  }, [q, entries]);

  const goToSymbol = (symbol) => {
    if (!symbol) return;

    // ✅ open in new tab
    window.open(`/symbol/${symbol}`, "_blank");

    // then reset your UI states
    setQ("");
    setOpenSug(false);
    setIsOpen(false);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      // nav menu
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
      // suggestions
      if (
        sugRef.current &&
        inputRef.current &&
        !sugRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setOpenSug(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation for suggestions
  const onKeyDown = (e) => {
    if (!openSug || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = suggestions[activeIdx];
      if (chosen) goToSymbol(chosen.symbol);
    } else if (e.key === "Escape") {
      setOpenSug(false);
    }
  };

  const navLinks = [
    ["/", "Dashboard"],
    ["/announcements", "Announcements"],
    ["/upcoming_events", "Events"],
    ["/fund_raise", "Fund Raise"],
    ["/results", "Results"],
    ["/trades", "Trades"],
    ["/news", "News"],
    ["/resources", "Resources"],
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-100 border-b border-gray-300 shadow-sm">
      <div className="px-6 py-2 flex items-center space-x-4">
        {/* Hamburger (mobile) */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6 text-gray-700" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-gray-700" />
          )}
        </button>

        {/* Logo */}
        <NavLink to="/" className="text-xl font-bold text-blue-700">
          Scan360.in
        </NavLink>

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

        {/* --- Search (right-aligned) --- */}
        <div className="ml-auto relative hidden md:block" ref={sugRef}>
          <div className="relative">
            {/* 🔍 search icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z"
              />
            </svg>

            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpenSug(true);
                setActiveIdx(0);
              }}
              onFocus={() => q && setOpenSug(true)}
              onKeyDown={onKeyDown}
              placeholder="Search stocks…"
              className="w-72 pl-8 pr-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Suggestions */}
          {openSug && suggestions.length > 0 && (
            <div className="absolute right-0 mt-1 w-full max-h-80 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
              {suggestions.map((sug, idx) => (
                <button
                  key={sug.symbol}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    goToSymbol(sug.symbol);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm ${
                    idx === activeIdx ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">{sug.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div ref={menuRef} className="md:hidden bg-gray-100 border-t border-gray-300">
          {/* Mobile search */}
          <div className="p-3 border-b border-gray-200" ref={sugRef}>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpenSug(true);
                setActiveIdx(0);
              }}
              onFocus={() => q && setOpenSug(true)}
              onKeyDown={onKeyDown}
              placeholder="Search stocks…"
              className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {openSug && suggestions.length > 0 && (
              <div className="mt-2 max-h-80 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
                {suggestions.map((sug, idx) => (
                  <button
                    key={sug.symbol}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      goToSymbol(sug.symbol);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm ${
                      idx === activeIdx ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">{sug.name}</span>
                      <span className="ml-3 text-gray-500">{sug.symbol}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile links */}
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
