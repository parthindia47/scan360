import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Results() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/integratedResults')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch results', err);
        setLoading(false);
      });
  }, []);

  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.broadcast_Date);
    const dateB = new Date(b.broadcast_Date);
    return dateB - dateA;
  });

  if (loading) return <div className="p-4">Loading Financial results...</div>;

  return (
    <div className="p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Financial Results</h2>
      <div className="overflow-x-auto">
        <table className="table-auto border-collapse w-full text-sm">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="p-2">Symbol</th>
              <th className="p-2">Company</th>
              <th className="p-2">Type</th>
              <th className="p-2">Quarter End</th>
              <th className="p-2">Broadcast Date</th>
              <th className="p-2">XBRL</th>
              <th className="p-2">Audited</th>
              <th className="p-2">Consolidated</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2">{row.symbol}</td>
                <td className="p-2">{row.cmName}</td>
                <td className="p-2">{row.type}</td>
                <td className="p-2">{row.qe_Date}</td>
                <td className="p-2">{row.broadcast_Date}</td>
                <td className="p-2">
                  <a href={row.xbrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    View
                  </a>
                </td>
                <td className="p-2">{row.audited}</td>
                <td className="p-2">{row.consolidated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Results;
