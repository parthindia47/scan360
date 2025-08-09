import React, { useEffect, useState, useMemo } from 'react';
import { Sparklines, SparklinesLine } from "react-sparklines";
import axios from 'axios';

function Dashboard() {
  const [industries, setIndustries] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortConfigs, setSortConfigs] = useState({});
  const [activeType, setActiveType] = useState(null); // 🔹 active tab
  const [weighted, setWeighted] = useState(true); // 🔹 active tab

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/industries`)
      .then(res => {
        setIndustries(res.data);
        const types = Object.values(res.data).map(i => i.type || 'Other');
        const defaultType = types[0];
        setActiveType(defaultType);

        // Set default sort for all types
        const initialSorts = {};
        types.forEach(type => {
          initialSorts[type] = { field: '1D', direction: 'desc' };
        });
        setSortConfigs(initialSorts);

        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data', error);
        setLoading(false);
      });
  }, []);

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
    return str
      .replace(/_/g, ' ')                     // replace underscores with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2');   // insert space before capital in camelCase
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

  const industryDataList = Object.values(groupedByType[activeType] || {});

  const totalSymbols = new Set(
    industryDataList.flatMap(industryData => industryData.stocks.map(stock => stock.symbol))
  ).size;

  // Get the lastCandleDate of the first stock in the first industry
  const lastUpdateDate = industryDataList[0]?.stocks?.[0]?.lastUpdateDate || null;

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
          {/* 🔹 Navbar Tabs */}
          <div className="flex flex-wrap border-b mb-6 space-x-4">
            {Object.keys(groupedByType).map((type) => (
              <a
                key={type}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveType(type);

                  // Collapse all industries when switching tabs
                  setExpanded((prev) => ({
                    ...prev,
                    [type]: {}  // start with collapsed state
                  }));
                }}
                className={`pb-2 px-3 text-sm font-medium transition duration-150 ease-in-out border-b-2 ${
                  activeType === type
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                }`}
              >
                {type.replace(/_/g, ' ')}
              </a>
            ))}
          </div>

          {/* 🔹 Table for Active Tab */}
          {activeType && (
            <>
            <div className="text-sm text-gray-500 flex justify-between items-center mb-2">
              <div className="text-gray-400">
                Updates Daily, last updated - {formatDate(lastUpdateDate)}.
                Tracked Symbols - {totalSymbols}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAllIndustries}
                  className="px-2 py-1 text-xs border border-green-600 text-green-700 rounded hover:bg-green-50"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAllIndustries}
                  className="px-2 py-1 text-xs border border-red-600 text-red-700 rounded hover:bg-red-50"
                >
                  Collapse All
                </button>
                {activeType === 'EQUITY' && (
                  <>
                    <button
                      className={`px-3 py-1 text-xs border rounded-full ${weighted ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-100'}`}
                      onClick={() => setWeighted(true)}
                    >
                      Weighted
                    </button>
                    <button
                      className={`px-3 py-1 text-xs border rounded-full ${!weighted ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-100'}`}
                      onClick={() => setWeighted(false)}
                    >
                      Equal Weight
                    </button>
                  </>
                )}
              </div>
            </div>

              <table className="table-auto w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th>#</th>
                    <th className="p-2 text-left">Industry</th>
                    <th className="sort-header cursor-pointer" onClick={() => toggleSort(activeType, 'ltpVs52WHigh')}>
                      LTP vs<br />52W High {sortConfigs[activeType]?.field === 'ltpVs52WHigh' && (sortConfigs[activeType].direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sort-header cursor-pointer" onClick={() => toggleSort(activeType, '1D')}>
                      1D {sortConfigs[activeType]?.field === '1D' && (sortConfigs[activeType].direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sort-header cursor-pointer" onClick={() => toggleSort(activeType, '1W')}>
                      1W {sortConfigs[activeType]?.field === '1W' && (sortConfigs[activeType].direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sort-header cursor-pointer" onClick={() => toggleSort(activeType, '1M')}>
                      1M {sortConfigs[activeType]?.field === '1M' && (sortConfigs[activeType].direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sort-header cursor-pointer" onClick={() => toggleSort(activeType, '3M')}>
                      3M {sortConfigs[activeType]?.field === '3M' && (sortConfigs[activeType].direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sort-header cursor-pointer" onClick={() => toggleSort(activeType, '6M')}>
                      6M {sortConfigs[activeType]?.field === '6M' && (sortConfigs[activeType].direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sort-header cursor-pointer" onClick={() => toggleSort(activeType, '1Y')}>
                      1Y {sortConfigs[activeType]?.field === '1Y' && (sortConfigs[activeType].direction === 'asc' ? '↑' : '↓')}
                    </th>
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
                        <tr className="border-t">
                          <td>{index + 1}</td>
                          <td className="p-2 cursor-pointer text-blue-600" onClick={() => toggleExpand(industry)}>
                            {expanded?.[activeType]?.[industry] ? '−' : '+'} {formatIndustryName(industry)} {"(" + data.stocks.length + ")"}
                          </td>
                          {['ltpVs52WHigh', '1D', '1W', '1M', '3M', '6M', '1Y'].map((field) => (
                            <td key={field} style={getColorStyle(data.weightedReturns[weighted ? field : field + '_N'])}>
                              {data.weightedReturns[weighted ? field : field + '_N'] || '-'}
                            </td>
                          ))}
                        </tr>

                      {expanded?.[activeType]?.[industry] &&
                        [...data.stocks]
                          .sort((a, b) => {
                            const field = sortConfigs[activeType]?.field || '1D';
                            const direction = sortConfigs[activeType]?.direction || 'desc';
                            const valA = parseFloat(a.dummyData?.[field]) || 0;
                            const valB = parseFloat(b.dummyData?.[field]) || 0;
                            return direction === 'asc' ? valA - valB : valB - valA;
                          })
                          .map((stock) => (
                            <tr className="bg-blue-50 border-t" key={`${activeType}-${industry}-${stock.symbol}`}>
                              <td>
                                <Sparklines data={stock.sparklineData} height={20} width={100}>
                                  <SparklinesLine color="blue" style={{ strokeWidth: 2, fill: "none" }} />
                                </Sparklines>
                              </td>
                              <td className="symbol-cell">
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
                                    " | Mcap ₹" + ((stock.marketCap ?? 0) / 1e7).toFixed(2) + " Cr"}
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
                              {['ltpVs52WHigh', '1D', '1W', '1M', '3M', '6M', '1Y'].map((field) => (
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
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
