
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [industries, setIndustries] = useState({});
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    axios.get('http://localhost:5000/industries')
      .then(res => setIndustries(res.data));
  }, []);

  const toggleExpand = (industry) => {
    setExpanded(prev => ({ ...prev, [industry]: !prev[industry] }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4 font-bold">Industry Dashboard</h1>
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Industry</th>
            <th>Weight</th>
            <th>LTP vs 52W High</th>
            <th>1D</th>
            <th>1W</th>
            <th>1M</th>
            <th>3M</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(industries).map(([industry, stocks]) => (
            <React.Fragment key={industry}>
              <tr className="border-t">
                <td className="p-2 cursor-pointer text-blue-600" onClick={() => toggleExpand(industry)}>
                  {expanded[industry] ? '−' : '+'} {industry}
                </td>
                <td>{stocks.reduce((acc, s) => acc + parseInt(s.dummyData.weight), 0)}</td>
                <td>{stocks[0].dummyData.ltpVs52WHigh}</td>
                <td>{stocks[0].dummyData['1D']}</td>
                <td>{stocks[0].dummyData['1W']}</td>
                <td>{stocks[0].dummyData['1M']}</td>
                <td>{stocks[0].dummyData['3M']}</td>
              </tr>
              {expanded[industry] && stocks.map((stock, idx) => (
                <tr key={idx} className="bg-blue-50 border-t">
                  <td className="symbol-cell">{stock.symbol}</td>
                  <td className="text-sm">{stock.dummyData.weight}</td>
                  <td className="text-sm">{stock.dummyData.ltpVs52WHigh}</td>
                  <td className="text-sm">{stock.dummyData['1D']}</td>
                  <td className="text-sm">{stock.dummyData['1W']}</td>
                  <td className="text-sm">{stock.dummyData['1M']}</td>
                  <td className="text-sm">{stock.dummyData['3M']}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
