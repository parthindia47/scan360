import React, { useEffect, useState } from 'react';
import axios from 'axios';

function News() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'an_dt', direction: 'desc' });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/stockNews`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch News', err);
        setLoading(false);
      });
  }, []);

  const toggleExpanded = (index) => {
    setExpandedRows(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date) ? 'Invalid date' : date.toLocaleDateString('en-IN');
  };

  return (
    <div className="p-4 mb-4">
      {loading ? (
        <div className="text-center text-blue-600 font-medium py-6 animate-pulse">Loading...</div>
      ) : (
        <>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Published</th>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">Link</th>
                  <th className="p-2 text-left">Summary</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-500 py-4">No News found.</td>
                  </tr>
                ) : (
                  data.map((row, idx) => {
                    const fullText = row.Summary || '';
                    const isExpanded = expandedRows[idx];

                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                        <td className="p-2 sticky left-0 bg-inherit z-10">{formatDate(row.published)}</td>
                        <td className="p-2">{row.title ||  '—'}</td>

                        <td className="p-2">
                          {row.link ? (
                            <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                              Read
                            </a>
                          ) : '—'}
                        </td>
                        
                        <td className="p-2">
                          {fullText.length > 200 && (
                            <button
                              className="ml-2 text-blue-600 underline text-xs"
                              onClick={() => toggleExpanded(idx)}
                            >
                              {isExpanded ? 'less' : 'more'}
                            </button>
                          )}
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
