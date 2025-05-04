
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [industries, setIndustries] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true); // <-- Add loading state
  const [sortConfig, setSortConfig] = useState({ field: '1D', direction: 'desc' });

  useEffect(() => {
    axios.get('http://localhost:5000/industries')
      .then(res => {
        setIndustries(res.data);
        setLoading(false); // <-- Set loading false after data is fetched
      })
      .catch(error => {
        console.error('Error fetching data', error);
        setLoading(false);
      });
  }, []);

  const toggleExpand = (industry) => {
    setExpanded(prev => ({ ...prev, [industry]: !prev[industry] }));
  };

  const toggleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const formatIndustryName = (str) => {
    if (!str) return '';
    return str.replace(/([a-z])([A-Z])/g, '$1 $2'); // inserts space before capital letter
  };

  const getColorStyle = (value) => {
    if (!value || value === 'N/A') return { color: 'gray' };
    const number = parseFloat(value);
    if (isNaN(number)) return { color: 'gray' };
    return number >= 0 ? { color: 'green' } : { color: 'red' };
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4 font-bold">Industry Dashboard</h1>
      {loading ? (
        <div className="text-center p-10">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <div className="mt-4 text-blue-700 font-semibold">Loading...</div>
        </div>
      ) : (
      <>
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th>#</th>
            <th className="p-2 text-left">Industry</th>
            <th className="sort-header" onClick={() => toggleSort('ltpVs52WHigh')}>
            LTP vs<br />52W High {sortConfig.field === 'ltpVs52WHigh' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="sort-header" onClick={() => toggleSort('1D')}>
            1D {sortConfig.field === '1D' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="sort-header" onClick={() => toggleSort('1W')}>
            1W {sortConfig.field === '1W' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="sort-header" onClick={() => toggleSort('1M')}>
            1M {sortConfig.field === '1M' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="sort-header" onClick={() => toggleSort('3M')}>
            3M {sortConfig.field === '3M' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
            {Object.entries(industries)
            .sort(([, a], [, b]) => {
              const valA = parseFloat(a.weightedReturns[sortConfig.field]) || 0;
              const valB = parseFloat(b.weightedReturns[sortConfig.field]) || 0;
              return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            })
            .map(([industry, data], index) => (
              <React.Fragment key={industry}>
                <tr className="border-t">
                  <td>{index + 1}</td> {/* use `index` instead of `idx` */}
                  <td className="p-2 cursor-pointer text-blue-600" onClick={() => toggleExpand(industry)}>
                    {expanded[industry] ? '−' : '+'} {formatIndustryName(industry)} {"(" + data.stocks.length + ")"}
                  </td>
                  <td style={getColorStyle(data.weightedReturns['ltpVs52WHigh'])}>{data.weightedReturns['ltpVs52WHigh']}</td>
                  <td style={getColorStyle(data.weightedReturns['1D'])}>{data.weightedReturns['1D']}</td>
                  <td style={getColorStyle(data.weightedReturns['1W'])}>{data.weightedReturns['1W']}</td>
                  <td style={getColorStyle(data.weightedReturns['1M'])}>{data.weightedReturns['1M']}</td>
                  <td style={getColorStyle(data.weightedReturns['3M'])}>{data.weightedReturns['3M']}</td>
                </tr>

                {/* Expanded stock rows */}
                {expanded[industry] && data.stocks.map((stock, idx)  => (
                  <tr className="bg-blue-50 border-t">
                    <td></td> {/* use `index` instead of `idx` */}
                    <td className="symbol-cell">{stock.symbol}</td>
                    <td style={getColorStyle(stock.dummyData.ltpVs52WHigh)}>{stock.dummyData.ltpVs52WHigh}</td>
                    <td style={getColorStyle(stock.dummyData['1D'])}>{stock.dummyData['1D']}</td>
                    <td style={getColorStyle(stock.dummyData['1W'])}>{stock.dummyData['1W']}</td>
                    <td style={getColorStyle(stock.dummyData['1M'])}>{stock.dummyData['1M']}</td>
                    <td style={getColorStyle(stock.dummyData['3M'])}>{stock.dummyData['3M']}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
        </tbody>
      </table>
      </>
      )}
    </div>
  );
}

export default App;
