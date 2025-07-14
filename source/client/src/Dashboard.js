import React, { useEffect, useState, useMemo } from 'react';
import { Sparklines, SparklinesLine } from "react-sparklines";
import axios from 'axios';

function Dashboard() {
  const [industries, setIndustries] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortConfigs, setSortConfigs] = useState({});
  const [activeType, setActiveType] = useState(null); // 🔹 active tab

  useEffect(() => {
    axios.get('http://localhost:5000/industries')
      .then(res => {
        setIndustries(res.data);
        const types = Object.values(res.data).map(i => i.type || 'Other');
        setActiveType(types[0]); // 🔹 auto-select first type
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
    setExpanded(prev => ({ ...prev, [industry]: !prev[industry] }));
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
    return str.replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const getColorStyle = (value) => {
    if (!value || value === 'N/A') return { color: 'gray' };
    const number = parseFloat(value);
    if (isNaN(number)) return { color: 'gray' };
    return number >= 0 ? { color: 'green' } : { color: 'red' };
  };

  return (
    <div className="p-6">
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
                  e.preventDefault(); // prevent page jump
                  setActiveType(type);
                }}
                className={`pb-2 px-3 text-sm font-medium transition duration-150 ease-in-out border-b-2 ${
                  activeType === type
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
                }`}
              >
                {type}
              </a>
            ))}
          </div>

          {/* 🔹 Table for Active Tab */}
          {activeType && (
            <>
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
                      const valA = parseFloat(a.weightedReturns[field]) || 0;
                      const valB = parseFloat(b.weightedReturns[field]) || 0;
                      return direction === 'asc' ? valA - valB : valB - valA;
                    })
                    .map(([industry, data], index) => (
                      <React.Fragment key={industry}>
                        <tr className="border-t">
                          <td>{index + 1}</td>
                          <td className="p-2 cursor-pointer text-blue-600" onClick={() => toggleExpand(industry)}>
                            {expanded[industry] ? '−' : '+'} {formatIndustryName(industry)} {"(" + data.stocks.length + ")"}
                          </td>
                          <td style={getColorStyle(data.weightedReturns['ltpVs52WHigh'])}>{data.weightedReturns['ltpVs52WHigh']}</td>
                          <td style={getColorStyle(data.weightedReturns['1D'])}>{data.weightedReturns['1D']}</td>
                          <td style={getColorStyle(data.weightedReturns['1W'])}>{data.weightedReturns['1W']}</td>
                          <td style={getColorStyle(data.weightedReturns['1M'])}>{data.weightedReturns['1M']}</td>
                          <td style={getColorStyle(data.weightedReturns['3M'])}>{data.weightedReturns['3M']}</td>
                          <td style={getColorStyle(data.weightedReturns['6M'])}>{data.weightedReturns['6M'] || '-'}</td>
                          <td style={getColorStyle(data.weightedReturns['1Y'])}>{data.weightedReturns['1Y'] || '-'}</td>
                        </tr>

                        {expanded[industry] && data.stocks.map((stock) => (
                          <tr className="bg-blue-50 border-t" key={stock.name}>
                            <td>
                              {/* Sparkline Chart */}
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
                              {" (CMP ₹" + (stock.price ?? 0).toFixed(2) + ")"}
                              <br />
                              {"PE " + (stock.pe ?? 0).toFixed(2) +
                              " | ROE " + ((stock.roe ?? 0) * 100).toFixed(2) + "%" +
                              " | Mcap ₹" + ((stock.marketCap ?? 0) / 1e7).toFixed(2) + " Cr"}
                            </td>
                            <td style={getColorStyle(stock.dummyData.ltpVs52WHigh)}>{stock.dummyData.ltpVs52WHigh}</td>
                            <td style={getColorStyle(stock.dummyData['1D'])}>{stock.dummyData['1D']}</td>
                            <td style={getColorStyle(stock.dummyData['1W'])}>{stock.dummyData['1W']}</td>
                            <td style={getColorStyle(stock.dummyData['1M'])}>{stock.dummyData['1M']}</td>
                            <td style={getColorStyle(stock.dummyData['3M'])}>{stock.dummyData['3M']}</td>
                            <td style={getColorStyle(stock.dummyData['6M'])}>{stock.dummyData['6M'] || '-'}</td>
                            <td style={getColorStyle(stock.dummyData['1Y'])}>{stock.dummyData['1Y'] || '-'}</td>
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
