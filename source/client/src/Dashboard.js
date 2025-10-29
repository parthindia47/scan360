import React, { useEffect, useState, useMemo } from 'react';
import { Sparklines, SparklinesLine } from "react-sparklines";
import axios from 'axios';

function Dashboard() {
  const [industries, setIndustries] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortConfigs, setSortConfigs] = useState({});
  const [activeType, setActiveType] = useState(null);
  const [weighted, setWeighted] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [asOfInput, setAsOfInput] = useState(''); // html date input
  const TIMEFRAMES = ['vs52WH','1D','1W','1M','3M','6M','1Y'];

const makeInitialFilters = () => ({
  vs52WH: { op: '>', value: '' },
  '1D':   { op: '>', value: '' },
  '1W':   { op: '>', value: '' },
  '1M':   { op: '>', value: '' },
  '3M':   { op: '>', value: '' },
  '6M':   { op: '>', value: '' },
  '1Y':   { op: '>', value: '' },
});

const countFiltered = (stocks) => {
  return stocks.filter(stockPassesFilters).length;
};

// active filters (used for filtering the list)
const [filters, setFilters] = useState(makeInitialFilters());

// drafts (UI inputs; only copied into `filters` when Apply is clicked)
const [filterDrafts, setFilterDrafts] = useState(makeInitialFilters());

  // helper: compare number with op + ref
  const cmp = (num, op, ref) => {
    if (ref === '' || ref === null || Number.isNaN(ref)) return true; // no filter
    return op === '>' ? num > ref : num < ref;
  };

  // helper: does a stock pass all active filters?
  const stockPassesFilters = (stock) => {
    for (const k of TIMEFRAMES) {
      const { op, value } = filters[k] || {};
      if (value === '' || value === null) continue; // inactive
      const n = toNum(stock?.dummyData?.[k]);       // "12.34%" -> 12.34
      const ref = parseFloat(value);
      if (n == null || Number.isNaN(ref)) return false;
      if (!cmp(n, op || '>', ref)) return false;
    }
    return true;
  };

  const fetchIndustries = async (asOfStr = '') => {
    try {
      setLoading(true);
      // Convert YYYY-MM-DD -> DD-MM-YYYY for the API query as requested
      const asOfParam = asOfStr
        ? (() => {
            const [y, m, d] = asOfStr.split('-');
            return `${d}-${m}-${y}`;
          })()
        : '';
      const url = asOfParam
        ? `${process.env.REACT_APP_API_URL}/api/industries?asOf=${asOfParam}`
        : `${process.env.REACT_APP_API_URL}/api/industries`;
      const res = await axios.get(url);
      setIndustries(res.data);
      const types = Object.values(res.data).map(i => i.type || 'Other');
      const defaultType = types[0];
      setActiveType(defaultType);
      const initialSorts = {};
      types.forEach(type => {
        initialSorts[type] = { field: '1D', direction: 'desc' };
      });
      setSortConfigs(initialSorts);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchIndustries(); // live load (no asOf)
  }, []);

  // pass: buildExportRows()            -> exports stocks (current behavior)
  // pass: buildExportRows("sectors")   -> exports top-level sectors only
  const buildExportRows = (mode) => {
    const rows = [];
    const entries = Object.entries(industries)
      .filter(([, data]) => !activeType || data.type === activeType);

    const toNum = (v) => {
      if (v == null) return -Infinity;
      const s = String(v);
      if (s.endsWith('%')) {
        const n = parseFloat(s.slice(0, -1));
        return Number.isNaN(n) ? -Infinity : n;
      }
      const n = parseFloat(s);
      return Number.isNaN(n) ? -Infinity : n;
    };

    if (mode === "sectors") {
      // ---- sector-level export (one row per sector) ----
      for (const [industry, data] of entries) {
        const stocks = data.stocks || [];

        const totalMcap = stocks.reduce((acc, s) => acc + (s.marketCap || 0), 0);
        const latestUpdate = stocks.reduce((latest, s) => {
          const d = s?.lastUpdateDate ? new Date(s.lastUpdateDate) : null;
          if (!d || isNaN(d)) return latest;
          return !latest || d > latest ? d : latest;
        }, null);

        const wr = data.weightedReturns || {};

        rows.push({
          Industry: industry,
          Type: data.type || '',
          Stocks: stocks.length,
          MarketCapCr: totalMcap ? (totalMcap / 1e7).toFixed(2) : '',
          '1D': wr['1D'] ?? '',
          '1W': wr['1W'] ?? '',
          '1M': wr['1M'] ?? '',
          '3M': wr['3M'] ?? '',
          '6M': wr['6M'] ?? '',
          '1Y': wr['1Y'] ?? '',
          vs52WH: wr['vs52WH'] ?? '',
          LastUpdate: latestUpdate ? latestUpdate.toISOString().slice(0, 10) : '',
        });
      }
    } else {
      // ---- stock-level export (existing behavior) ----
      for (const [industry, data] of entries) {
        for (const s of (data.stocks || [])) {
          rows.push({
            Industry: industry,
            Symbol: s.symbol,
            Name: s.name,
            Price: Number.isFinite(s.price) ? s.price.toFixed(2) : '',
            PE: Number.isFinite(s.pe) ? s.pe.toFixed(2) : '',
            ROE: typeof s.roe === 'number' ? (s.roe * 100).toFixed(2) + '%' : '',
            MarketCapCr: Number.isFinite(s.marketCap) ? (s.marketCap / 1e7).toFixed(2) : '',
            '1D': s?.dummyData?.['1D'] ?? '',
            '1W': s?.dummyData?.['1W'] ?? '',
            '1M': s?.dummyData?.['1M'] ?? '',
            '3M': s?.dummyData?.['3M'] ?? '',
            '6M': s?.dummyData?.['6M'] ?? '',
            '1Y': s?.dummyData?.['1Y'] ?? '',
            vs52WH: s?.dummyData?.['vs52WH'] ?? '',
            LastUpdate: s?.lastUpdateDate ?? '',
          });
        }
      }
    }

    // Sort using the current UI config (works for both modes)
    const cfg = sortConfigs[activeType];
    if (cfg?.field) {
      const f = cfg.field;
      rows.sort((a, b) => {
        const av = toNum(a[f]);
        const bv = toNum(b[f]);
        return cfg.direction === 'asc' ? av - bv : bv - av;
      });
    }

    return rows;
  };

  const toCSV = (rows) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
  };

  const handleExportCSV = (mode) => {
    const rows = buildExportRows(mode);
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const asOfPart = asOfInput ? `_${asOfInput}` : '';
    const fname = `industries_${activeType || 'all'}_${mode || 'symbols'}_${asOfPart}.csv`;
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fname;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const groupedByType = useMemo(() => {
    const groups = {};
    Object.entries(industries).forEach(([industry, data]) => {
      const type = data.type || 'Other';
      if (!groups[type]) groups[type] = {};
      groups[type][industry] = data;
    });
    return groups;
  }, [industries]);

  const toggleExpand = (industry) => {
    setExpanded((prev) => {
      const currentType = activeType || 'Other';
      const updatedForType = {
        ...(prev[currentType] || {}),
        [industry]: !prev?.[currentType]?.[industry]
      };
      return { ...prev, [currentType]: updatedForType };
    });
  };

  const expandAllIndustries = () => {
    const industriesOfType = Object.keys(groupedByType[activeType] || {});
    const expandedMap = {};
    industriesOfType.forEach(ind => expandedMap[ind] = true);
    setExpanded(prev => ({ ...prev, [activeType]: expandedMap }));
  };

  const collapseAllIndustries = () => {
    setExpanded(prev => ({ ...prev, [activeType]: {} }));
  };

  const toggleSort = (type, field) => {
    setSortConfigs(prev => {
      const current = prev[type] || { field: '1D', direction: 'desc' };
      const newDirection = current.field === field && current.direction === 'desc' ? 'asc' : 'desc';
      return {
        ...prev,
        [type]: { field, direction: newDirection }
      };
    });
  };

  const formatIndustryName = (str) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const getColorStyle = (value) => {
    if (!value || value === 'N/A') return { color: 'gray' };
    const number = parseFloat(value);
    if (isNaN(number)) return { color: 'gray' };
    return number >= 0 ? { color: 'green' } : { color: 'red' };
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date) ? 'Invalid date' : date.toLocaleDateString('en-IN');
  };

  // parse "12.34%" or "12.34" -> number, else null
  const toNum = (v) => {
    if (v == null) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;

    // Normalize: unicode minus → ASCII hyphen, remove commas
    const s = String(v).trim().replace(/\u2212/g, '-').replace(/,/g, '');

    // Grab the first signed number anywhere in the string
    const m = s.match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  };

  // All-symbols counts for the active type (>= 0 is positive)
  const globalCounts = useMemo(() => {
    const counts = Object.fromEntries(TIMEFRAMES.map(tf => [tf, { pos: 0, neg: 0 }]));
    const list = Object.values(groupedByType[activeType] || {});
    for (const ind of list) {
      for (const s of (ind.stocks || [])) {
        for (const tf of TIMEFRAMES) {
          const n = toNum(s?.dummyData?.[tf]);
          if (n == null) continue;
          if (n >= 0) counts[tf].pos++; else counts[tf].neg++;
        }
      }
    }
    return counts;
  }, [groupedByType, activeType]);

  // Per-sector counts (memoized map: { [industry]: { [tf]: {pos,neg} } })
  const sectorCounts = useMemo(() => {
    const map = {};
    const byType = groupedByType[activeType] || {};
    for (const [industry, data] of Object.entries(byType)) {
      const c = Object.fromEntries(TIMEFRAMES.map(tf => [tf, { pos: 0, neg: 0 }]));
      for (const s of (data.stocks || [])) {
        for (const tf of TIMEFRAMES) {
          const n = toNum(s?.dummyData?.[tf]);
          if (n == null) continue;
          if (n >= 0) c[tf].pos++; else c[tf].neg++;
        }
      }
      map[industry] = c;
    }
    return map;
  }, [groupedByType, activeType]);


  const industryDataList = Object.values(groupedByType[activeType] || {});
  const lastUpdateDate = industryDataList[0]?.stocks?.[0]?.lastUpdateDate || null;

  const totalSymbols = new Set(
    industryDataList.flatMap(industryData =>
      industryData.stocks
        .filter(stockPassesFilters)   // ✅ only include visible stocks
        .map(stock => stock.symbol)
    )
  ).size;

  return (
    <div className="p-6 mb-4">
      {loading ? (
        <div className="text-center p-10">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <div className="mt-4 text-blue-700 font-semibold">Loading...</div>
        </div>
      ) : Object.keys(groupedByType).length === 0 ? (
        <div className="text-center text-red-500 font-semibold">No industry data available.</div>
      ) : (
        <>
          {/* Top Tabs */}
          <div className="flex flex-wrap gap-2 border-b mb-2 pb-1">
            {Object.keys(groupedByType).map((type) => (
              <a
                key={type}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveType(type);
                  setExpanded((prev) => ({ ...prev, [type]: {} }));
                }}
                className={`px-3 py-1 text-sm font-medium transition border-b-2 ${
                  activeType === type
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                }`}
                style={{
                  minWidth: 'fit-content', // keeps them from shrinking too small
                }}
              >
                {type.replace(/_/g, ' ')}
              </a>
            ))}
          </div>

          {/* Info + Buttons */}
          <div className="text-sm text-gray-500 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
            <div className="text-gray-400">
              Updates Daily, last updated - {formatDate(lastUpdateDate)}. Total Symbols - {totalSymbols}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={expandAllIndustries}
                className="px-2 py-1 text-xs border border-green-600 text-green-700 rounded hover:bg-green-50"
              >
                <b>+</b> All
              </button>
              <button
                onClick={collapseAllIndustries}
                className="px-2 py-1 text-xs border border-red-600 text-red-700 rounded hover:bg-red-50"
              >
                <b>-</b> All
              </button>
              {activeType === 'EQUITY' && (
                <>
                  <button
                    className={`px-3 py-1 text-xs border rounded-full transition-colors ${
                      weighted
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                    }`}
                    onClick={() => setWeighted(true)}
                  >
                    Weighted
                  </button>

                  <button
                    className={`px-3 py-1 text-xs border rounded-full transition-colors ${
                      !weighted
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                    }`}
                    onClick={() => setWeighted(false)}
                  >
                    Equal Weight
                  </button>
                </>
              )}

              {/* --- ADD: Date Picker + Go / Clear */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">Date:</span>
                <input
                  type="date"
                  value={asOfInput}
                  onChange={(e) => setAsOfInput(e.target.value)}
                  className="px-2 py-1 text-xs border rounded"
                  aria-label="As of date"
                />
                <button
                  onClick={() => asOfInput && fetchIndustries(asOfInput)}
                  className="px-3 py-1 text-xs border rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Go
                </button>
                <button
                  onClick={() => { setAsOfInput(''); fetchIndustries(); }}
                  className="px-3 py-1 text-xs border rounded bg-gray-100 hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>

              <div className={isMobile ? "grid grid-flow-col auto-cols-max gap-2" : "inline-flex gap-2 flex-nowrap"}>
                <button
                  onClick={() => handleExportCSV()}
                  className={`flex-none ${isMobile ? 'px-2 py-1 text-[11px]' : 'px-3 py-1 text-xs'} border rounded bg-emerald-600 text-white hover:bg-emerald-700`}
                >
                  Export Symbols
                </button>

                <button
                  onClick={() => handleExportCSV('sectors')}
                  className={`flex-none ${isMobile ? 'px-2 py-1 text-[11px]' : 'px-3 py-1 text-xs'} border rounded bg-emerald-600 text-white hover:bg-emerald-700`}
                >
                  Export Sectors
                </button>
              </div>

            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse text-sm text-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="sticky left-0 top-0 bg-gray-100 z-30 p-2 w-[70px] min-w-[70px] max-w-[70px]">#</th>
                  <th
                    className={`sticky left-[70px] top-0 bg-gray-100 z-30 p-2 text-left ${
                      isMobile ? "min-w-[200px] max-w-[200px]" : "min-w-[250px] max-w-[250px]"
                    }`}
                  >
                    Industry
                  </th>
                  {/* Header */}
                  {['vs52WH', '1D', '1W', '1M', '3M', '6M', '1Y'].map((field) => (
                    <th
                      key={field}
                      className={`sticky top-0 bg-gray-100 z-20 p-2 cursor-pointer`}
                      onClick={() => toggleSort(activeType, field)}
                    >
                      {field}
                      {sortConfigs[activeType]?.field === field &&
                        (sortConfigs[activeType].direction === 'asc' ? ' ↑' : ' ↓')}
                        <div className="text-xs">
                          <span className="text-green-600">+{globalCounts[field].pos}</span>
                          {' / '}
                          <span className="text-red-600">-{globalCounts[field].neg}</span>
                        </div>

                      <div
                        className="mt-1 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          className="border rounded px-1 py-0.5 text-xs"
                          value={filterDrafts[field]?.op ?? '>'}
                          onChange={(e) =>
                            setFilterDrafts(prev => ({
                              ...prev,
                              [field]: { ...(prev[field]||{}), op: e.target.value }
                            }))
                          }
                        >
                          <option value=">">&gt;</option>
                          <option value="<">&lt;</option>
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          placeholder="%"
                          className="w-8 border rounded px-1 py-0.5 text-xs"
                          value={filterDrafts[field]?.value ?? ''}
                          onChange={(e) =>
                            setFilterDrafts(prev => ({
                              ...prev,
                              [field]: { ...(prev[field] || {}), value: e.target.value }
                            }))
                          }
                        />

                      </div>

                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilters(prev => ({
                              ...prev,
                              [field]: {
                                ...(prev[field] || { op: '>', value: '' }),
                                ...(filterDrafts[field] || {})
                              }
                            }));
                          }}
                          className={`px-2 py-1 text-xs border rounded text-white transition-colors
                            ${filters[field]?.value
                              ? 'bg-blue-800 hover:bg-blue-700' // active state stays blue-700
                              : 'bg-blue-400 hover:bg-blue-700'} // inactive default
                          `}
                          title="Apply this column’s filter"
                        >
                          ✓
                        </button>

                        <button
                          className="px-2 py-1 text-xs border rounded bg-red-400 text-white hover:bg-red-700"
                          title="Clear this column’s filter"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterDrafts(prev => ({
                              ...prev,
                              [field]: { op: '>', value: '' }  // reset draft
                            }));
                            setFilters(prev => ({
                              ...prev,
                              [field]: { op: '>', value: '' }  // reset active
                            }));
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}

                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedByType[activeType] || {})
                  .sort(([, a], [, b]) => {
                    const field = sortConfigs[activeType]?.field || '1D';
                    const direction = sortConfigs[activeType]?.direction || 'desc';
                    const key = weighted ? field : `${field}_N`;
                    const valA = parseFloat(a.weightedReturns[key]) || 0;
                    const valB = parseFloat(b.weightedReturns[key]) || 0;
                    return direction === 'asc' ? valA - valB : valB - valA;
                  })
                  .map(([industry, data], index) => (
                    <React.Fragment key={`${activeType}-${industry}`}>
                      <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="sticky left-0 bg-inherit z-10 p-2 w-[70px] min-w-[70px] max-w-[70px]">{index + 1}</td>

                        <td
                          className={`sticky left-[70px] bg-inherit z-10 p-2 cursor-pointer text-blue-600 ${
                            isMobile ? "min-w-[200px] max-w-[200px]" : "min-w-[250px] max-w-[250px]"
                          }`}
                          onClick={() => toggleExpand(industry)}
                        >
                          {expanded?.[activeType]?.[industry] ? '− ' : '+ '}
                          {formatIndustryName(industry)}{" "}
                          ({countFiltered(data.stocks)}/{data.stocks.length})

                          {/* Per-sector +/– counts */}
                          {/* <span className="ml-1 text-[11px] text-gray-600">
                              <span className="text-green-600">+{sectorCounts[industry]?.['1D']?.pos ?? 0}</span>
                              {' / '}
                              <span className="text-red-600">-{sectorCounts[industry]?.['1D']?.neg ?? 0}</span>
                          </span> */}
                        </td>


                        {/* Data rows */}
                        {['vs52WH', '1D', '1W', '1M', '3M', '6M', '1Y'].map((field) => (
                            <td key={field} style={getColorStyle(data.weightedReturns[weighted ? field : field + '_N'])}>
                            {data.weightedReturns[weighted ? field : field + '_N'] || '-'}
                          </td>
                        ))}
                      </tr>

                    {expanded?.[activeType]?.[industry] &&
                      [...data.stocks]
                        .filter(stockPassesFilters)   // ← add this line
                        .sort((a, b) => {
                          const field = sortConfigs[activeType]?.field || "1D";
                          const valA = parseFloat(a.dummyData[field]) || 0;
                          const valB = parseFloat(b.dummyData[field]) || 0;
                          return sortConfigs[activeType]?.direction === "asc" ? valA - valB : valB - valA;
                        })
                        .map((stock) => (
                          <tr key={stock.symbol} className="bg-blue-50 border-t">
                            <td className="sticky left-0 bg-blue-50 z-10 p-2 w-[70px] min-w-[70px] max-w-[70px]">
                              <Sparklines data={stock.sparklineData} height={20} width={100}>
                                <SparklinesLine color="blue" style={{ strokeWidth: 2, fill: "none" }} />
                              </Sparklines>
                            </td>

                            <td
                              className={`symbol-cell sticky left-[70px] bg-blue-50 z-10 p-2 ${
                                isMobile ? "min-w-[200px] max-w-[200px]" : "min-w-[250px] max-w-[250px]"
                              }`}
                            >
                              <a
                                href={`symbol/${stock.symbol}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                {stock.name}
                              </a>
                                {" "}
                                {activeType === 'USD' ? 
                                  `(CMP $${(stock.price ?? 0).toFixed(3)})` :
                                  activeType === 'WORLD_INDEX' ?
                                  `(CMP ${(stock.price ?? 0).toFixed(2)})` :
                                  `(CMP ₹${(stock.price ?? 0).toFixed(2)})`
                                }
                                {activeType === 'EQUITY' && (                                
                                  <>
                                  <br />
                                    {"PE " + (stock.pe ?? 0).toFixed(2) +
                                    " | ROE " + ((stock.roe ?? 0) * 100).toFixed(2) + "%" +
                                    " | Mcap " +  `₹${new Intl.NumberFormat("en-IN", {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                    }).format(parseFloat(stock.marketCap) / 1e7)} Cr`}
                                  <br />
                                  {Array.isArray(stock.events) && stock.events.length > 0 && (
                                    <div className="text-gray-500 text-sm mt-1">
                                      {stock.events.map((e, idx) => (
                                        <div key={idx}>📌 {e.purpose} - {formatDate(e.date)}</div>
                                      ))}
                                    </div>
                                  )}
                                  </>
                                )}
                            </td>
                              {['vs52WH', '1D', '1W', '1M', '3M', '6M', '1Y'].map((field) => (
                              <td key={field} style={getColorStyle(stock.dummyData[field])}>
                                  {stock.dummyData[field] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
