import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Announcements() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/announcements')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch announcements', err);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date) ? 'Invalid date' : date.toLocaleDateString('en-IN');
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Announcements (Last 2 Days)</h1>

      {loading ? (
        <div className="text-center text-blue-600">Loading...</div>
      ) : (
        <table className="table-auto border-collapse w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Symbol</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Attachment</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No recent announcements found.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2">{formatDate(row.an_dt || row.sort_date)}</td>
                  <td className="p-2">{row.symbol || '—'}</td>
                  <td className="p-2">{row.announcement_type || row.desc || '—'}</td>
                  <td className="p-2">{(row.attchmntText || row.desc || '').slice(0, 100)}...</td>
                  <td className="p-2">
                    {row.attchmntFile ? (
                      <a
                        href={row.attchmntFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View PDF
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Announcements;
