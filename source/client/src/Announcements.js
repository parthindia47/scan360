import React, { useEffect, useState } from 'react';
import axios from 'axios';

const announcementKeywords = [
  "Acquisition", "Acquire", "Amalgamation", "Arrangement", "Merger", "Demerge", "De merge", "Demerger", "disinvestment",
  "Re-structuring", "Restructuring", "Offer For Sale", "Bonus", "split", "Buy back", "Buyback", "Rights issue",
  "Right issue", "Public offer", "public offering", "fund raise", "fund raising", "raise fund", "New Project",
  "new contract", "new order", "order received", "Awarding of order", "Bagging", "beg", "begs", "winning", "Expansion",
  "to invest", "settlement", "Raising of funds", "Rating", "clarification", "Partnership", "Joint venture",
  "Collaboration", "Capital expenditure", "capacity addition", "Strategic alliance", "Revenue growth", "Profit increase",
  "Earnings beat", "Record earnings", "Cost reduction", "Debt reduction", "Product launch", "New technology",
  "Innovation", "License", "Patent granted", "FDA approval", "Contract extension", "Market expansion", "Upgraded",
  "downgraded", "Buy recommendation", "Positive outlook", "Guidance raised", "Milestone achieved", "Supply agreement",
  "Exclusive agreement", "Patent filing", "Product approval", "Regulatory approval", "Secondary offering",
  "Share repurchase", "Equity infusion", "Capital raise", "Increase in volume", "Spurt in Volume",
  "Movement in price", "name change"
];

function Announcements() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [marketCapFilter, setMarketCapFilter] = useState(false);
  const [todayFilter, setTodayFilter] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/announcements')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch announcements', err);
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

  const highlightText = (text = '') => {
    let result = text;
    announcementKeywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      result = result.replace(regex, `<span class="bg-yellow-200 font-semibold">$1</span>`);
    });
    return result;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize time to midnight

  const filteredData = data.filter((row) => {

    const text = `${row.announcement_type || ''} ${row.attchmntText || row.desc || ''}`.toLowerCase();
    const marketCap = parseFloat(row.marketCap) || 0;

    const keywordMatch = announcementKeywords.some(k => text.includes(k.toLowerCase()));
    const marketCapMatch = marketCap > 800 * 1e7; // 800 Cr

    const rowDate = new Date(row.an_dt || row.sort_date || '');
    rowDate.setHours(0, 0, 0, 0);

    const isToday = rowDate.getTime() === today.getTime();

    return (!filtered || keywordMatch)
      && (!marketCapFilter || marketCapMatch)
      && (!todayFilter || isToday);
  });

  const sortedData = [...filteredData].sort(
    (a, b) => new Date(b.an_dt || b.sort_date) - new Date(a.an_dt || a.sort_date)
  );

  return (
    <div className="p-4">

      {loading ? (
        <div className="text-center text-blue-600 font-medium py-6 animate-pulse">Loading...</div>
      ) : (
        <>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="text-gray-600">Use Filters : </div>
            <button
              onClick={() => setFiltered(!filtered)}
              className={`px-3 py-1 text-xs rounded-full border ${
                filtered ? 'bg-green-300 text-black font-semibold' : 'bg-gray-200'
              }`}
            >
              Important Keywords
            </button>

            <button
              onClick={() => setMarketCapFilter(!marketCapFilter)}
              className={`px-3 py-1 text-xs rounded-full border ${
                marketCapFilter ? 'bg-green-300 text-black font-semibold' : 'bg-gray-200'
              }`}
            >
              Market Cap &gt; 800 Cr
            </button>

            <button
              onClick={() => setTodayFilter(!todayFilter)}
              className={`px-3 py-1 text-xs rounded-full border ${
                todayFilter ? 'bg-blue-300 text-black font-semibold' : 'bg-indigo-100 text-gray-800'
              }`}
            >
              Today
            </button>
          </div>

          <div className="text-sm text-gray-600">
            Total rows {sortedData.length}
          </div>
        </div>

        <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
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
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No matching announcements found.
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => {
                const fullText = row.attchmntText || row.desc || '';
                const isExpanded = expandedRows[idx];

                return (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="p-2">{formatDate(row.an_dt || row.sort_date)}</td>
                    <td className="p-2">
                      <a
                        href={`symbol/${row.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {row.symbol || '—'}
                      </a>
                    </td>
                    <td className="p-2">{row.announcement_type || row.desc || '—'}</td>
                    {/* <td className="p-2 whitespace-normal break-words w-48">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlightText(row.announcement_type || row.desc || '—')
                        }}
                      />
                    </td> */}
                    <td className="p-2">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: isExpanded
                            ? highlightText(fullText)
                            : highlightText(fullText.slice(0, 250)) + (fullText.length > 250 ? '...' : '')
                        }}
                      />
                      {fullText.length > 200 && (
                        <button
                          className="ml-2 text-blue-600 underline text-xs"
                          onClick={() => toggleExpanded(idx)}
                        >
                          {isExpanded ? 'less' : 'more'}
                        </button>
                      )}
                    </td>
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
                );
              })
            )}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
}

export default Announcements;
