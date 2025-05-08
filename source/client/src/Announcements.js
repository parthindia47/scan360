import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Announcements() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/announcements')
      .then(res => setData(res.data))
      .catch(err => console.error('Failed to fetch announcements', err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">NSE Announcements</h1>
      <table className="table-auto border-collapse w-full">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Date</th>
            <th className="p-2">Symbol</th>
            <th className="p-2">Type</th>
            <th className="p-2">Description</th>
            <th className="p-2">Attachment</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{row.an_dt}</td>
              <td className="p-2">{row.symbol}</td>
              <td className="p-2">{row.desc}</td>
              <td className="p-2">{row.attchmntText?.slice(0, 100)}...</td>
              <td className="p-2">
                <a href={row.attchmntFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  PDF
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Announcements;
