// News.js
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

function News() {
  const [stockNewsData, setStockNewsData] = useState([]);
  const [indiaNewsData, setIndiaNewsData] = useState([]);
  const [globalNewsData, setGlobalNewsData] = useState([]); // API uses "global", UI shows "World"

  const [loading, setLoading] = useState(true);

  // Keep exactly one expanded row per tab: { Stocks: <id|null>, India: <id|null>, World: <id|null> }
  const [expandedIdByTab, setExpandedIdByTab] = useState({
    Stocks: null,
    India: null,
    World: null,
  });

  const [activeTab, setActiveTab] = useState('Stocks'); // 'Stocks' | 'India' | 'World'
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD' or null

  // Fetch: Stocks
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/stockNews`)
      .then((res) => setStockNewsData(res.data || []))
      .catch((err) => console.error('Failed to fetch Stock News', err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch: India
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/indiaNews`)
      .then((res) => setIndiaNewsData(res.data || []))
      .catch((err) => console.error('Failed to fetch India News', err));
  }, []);

  // Fetch: Global (World)
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/globalNews`)
      .then((res) => setGlobalNewsData(res.data || []))
      .catch((err) => console.error('Failed to fetch Global/World News', err));
  }, []);

  // Helpers
  const toDate = (v) => {
    const raw = v?.published ?? v?.published_parsed ?? '';
    const d = new Date(raw);
    return isNaN(d) ? null : d;
  };
  const ymd = (d) => {
    if (!(d instanceof Date)) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const formatDatePretty = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const getSummaryText = (row) => (row?.summary ?? row?.Summary ?? '').toString();

  // Shared sorter (desc)
  const sortByPublishedDesc = (arr) =>
    [...(arr || [])].sort((a, b) => {
      const A = toDate(a);
      const B = toDate(b);
      if (!A && !B) return 0;
      if (!A) return 1;
      if (!B) return -1;
      return B - A;
    });

  // Current tab data
  const currentDataRaw = useMemo(() => {
    switch (activeTab) {
      case 'India':
        return indiaNewsData;
      case 'World':
        return globalNewsData;
      case 'Stocks':
      default:
        return stockNewsData;
    }
  }, [activeTab, stockNewsData, indiaNewsData, globalNewsData]);

  const currentDataSorted = useMemo(
    () => sortByPublishedDesc(currentDataRaw),
    [currentDataRaw]
  );

  // Unique dates (for active tab)
  const uniqueDates = useMemo(() => {
    const set = new Set();
    currentDataSorted.forEach((row) => {
      const d = toDate(row);
      if (d) set.add(ymd(d));
    });
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1)); // desc
  }, [currentDataSorted]);

  // Apply date filter
  const filteredData = useMemo(() => {
    if (!selectedDate) return currentDataSorted;
    return currentDataSorted.filter((row) => {
      const d = toDate(row);
      return d && ymd(d) === selectedDate;
    });
  }, [currentDataSorted, selectedDate]);

  // If the active tab changes, we keep its own expanded selection.
  // If filters change and the previously expanded item is no longer visible, collapse it.
  useEffect(() => {
    const currentExpandedId = expandedIdByTab[activeTab];
    if (!currentExpandedId) return;
    const stillVisible = filteredData.some((row) => {
      const id = row.link || `${row.title}|${row.published ?? row.published_parsed ?? ''}`;
      return id === currentExpandedId;
    });
    if (!stillVisible) {
      setExpandedIdByTab((prev) => ({ ...prev, [activeTab]: null }));
    }
  }, [filteredData, activeTab, expandedIdByTab]);

  // Styles
  const dateChipClass = (isActive) =>
    `px-2 py-1 text-xs rounded-full border ${
      isActive
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
    }`;

  // Tabs list
  const tabs = ['Stocks', 'India', 'World'];

  // Toggle handler to ensure only one expanded per tab
  const toggleExpandOne = (row) => {
    const rowId = row.link || `${row.title}|${row.published ?? row.published_parsed ?? ''}`;
    setExpandedIdByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] === rowId ? null : rowId,
    }));
  };

  return (
    <div className="p-4 mb-4">

      {/* Top Tabs (border-bottom link style) */}
      <div className="flex flex-wrap gap-2 border-b mb-2 pb-1">
        {tabs.map((tab) => (
          <a
            key={tab}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Switching tabs preserves its own expansion slot
              // (no need to reset selectedDate unless you want to)
              setActiveTab(tab);
            }}
            className={`px-3 py-1 text-sm font-medium transition border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
            }`}
            style={{ minWidth: 'fit-content' }}
          >
            {tab}
          </a>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-xs text-gray-600 mr-1">Filter by date:</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setSelectedDate(null);
          }}
          className={dateChipClass(!selectedDate)}
          title="Show all dates"
        >
          All Dates
        </a>
        {uniqueDates.map((d) => {
          const label = formatDatePretty(d);
          return (
            <a
              key={d}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSelectedDate(d);
              }}
              className={dateChipClass(selectedDate === d)}
              title={label}
            >
              {label}
            </a>
          );
        })}
      </div>

      {/* Total rows after filters */}
      <div className="text-sm mt-3 text-gray-600">
        Total rows {filteredData.length}
      </div>

      {loading ? (
        <div className="text-center text-blue-600 font-medium py-6 animate-pulse">Loading...</div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">News & Stories</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center text-gray-500 py-4">
                      No News found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const publishedStr = row?.published ?? row?.published_parsed ?? '';
                    const rowId = row.link || `${row.title}|${publishedStr}`;
                    const isExpanded = expandedIdByTab[activeTab] === rowId;
                    const summary = getSummaryText(row);

                    return (
                      <tr key={rowId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>

                        {/* Title + summary with +/- button */}
                        <td className="p-2">
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => toggleExpandOne(row)}
                              aria-expanded={isExpanded}
                              aria-controls={`summary-${idx}`}
                              className="inline-flex h-5 w-6 items-center justify-center rounded border border-gray-300 hover:bg-gray-100 text-gray-700"
                              title={isExpanded ? 'Collapse summary' : 'Expand summary'}
                            >
                              {isExpanded ? '−' : '+'}
                            </button>

                            <div className="flex-1">
                              <div className="font-medium">
                                <span>
                                {row.title || '—'}
                                </span>

                                <span className="ml-2 text-xs leading-relaxed">
                                {row.link ? (
                                  <a
                                    href={row.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    {(row.source ? row.source : '—') + (row.feed_key ? ` - ${row.feed_key}` : '')}
                                  </a>
                                ) : (
                                  (row.source ? row.source : '—') + (row.feed_key ? ` - ${row.feed_key}` : '')
                                )}
                                </span>
                          
                                <span className="ml-2 text-xs text-gray-700 leading-relaxed">
                                {"(" + formatDatePretty(publishedStr) + ")"}
                                </span>
                              </div>

                              {isExpanded && summary && (
                                <div
                                  id={`summary-${idx}`}
                                  className="mt-1 text-xs text-gray-600 leading-relaxed"
                                >
                                  {summary}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default News;
