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

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/industries`)
      .then(res => {
        setIndustries(res.data);
        const types = Object.values(res.data).map(i => i.type || 'Other');
        const defaultType = types[0];
        setActiveType(defaultType);
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

  const industryDataList = Object.values(groupedByType[activeType] || {});
  const totalSymbols = new Set(
    industryDataList.flatMap(industryData => industryData.stocks.map(stock => stock.symbol))
  ).size;
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
              Updates Daily, last updated - {formatDate(lastUpdateDate)}. Tracked Symbols - {totalSymbols}
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
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse text-sm text-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="sticky left-0 top-0 bg-gray-100 z-30 p-2 w-[70px] min-w-[70px] max-w-[70px]">#</th>
                  <th className="sticky left-[70px] top-0 bg-gray-100 z-30 p-2 text-left min-w-[200px] max-w-[200px]">Industry</th>
                  {/* Header */}
                  {['ltpVs52WHigh', '1D', '1W', '1M', '3M', '6M', '1Y'].map((field) => (
                    <th
                      key={field}
                      className={`sticky top-0 bg-gray-100 z-20 p-2 cursor-pointer ${
                        field === 'ltpVs52WHigh' ? 'min-w-[100px] max-w-[100px] text-center' : ''
                      }`}
                      onClick={() => toggleSort(activeType, field)}
                    >
                      {field}
                      {sortConfigs[activeType]?.field === field &&
                        (sortConfigs[activeType].direction === 'asc' ? ' ↑' : ' ↓')}
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
                          className="sticky left-[70px] bg-inherit z-10 p-2 cursor-pointer text-blue-600 min-w-[200px] max-w-[200px]"
                          onClick={() => toggleExpand(industry)}
                        >
                          {expanded?.[activeType]?.[industry] ? '−' : '+'} {formatIndustryName(industry)} ({data.stocks.length})
                        </td>

                        {/* Data rows */}
                        {['ltpVs52WHigh', '1D', '1W', '1M', '3M', '6M', '1Y'].map((field) => (
                          <td
                            key={field}
                            className={field === 'ltpVs52WHigh' ? 'min-w-[100px] max-w-[100px] text-center' : ''}
                            style={getColorStyle(data.weightedReturns[weighted ? field : field + '_N'])}
                          >
                            {data.weightedReturns[weighted ? field : field + '_N'] || '-'}
                          </td>
                        ))}
                      </tr>

                    {expanded?.[activeType]?.[industry] &&
                      [...data.stocks]
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
                            <td className="sticky left-[70px] bg-blue-50 z-10 p-2 min-w-[200px] max-w-[200px]">
                              <a
                                href={`symbol/${stock.symbol}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                {stock.name}
                              </a>
                            </td>
                            {["ltpVs52WHigh", "1D", "1W", "1M", "3M", "6M", "1Y"].map((field) => (
                              <td key={field} style={getColorStyle(stock.dummyData[field])}>
                                {stock.dummyData[field] || "-"}
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
