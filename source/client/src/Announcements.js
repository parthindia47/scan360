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
  "Movement in price", "name change", "Demand Notice", "Incorporation"
];

function Announcements() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [marketCapFilter, setMarketCapFilter] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState(null);
  const [priceChangeFilter, setPriceChangeFilter] = useState(false);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'an_dt', direction: 'desc' });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api_2/announcements`)
      .then(res => {
        setData(res.data);
        setLoading(false);

        // Extract unique dates
        const dateSet = new Set(
          res.data
            .map(row => row.an_dt)
            .filter(Boolean)
            .map(d => {
              const dt = new Date(d);
              return dt.toLocaleDateString('en-CA'); // yyyy-mm-dd in local timezone
            })
        );
        const sortedDates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
        setUniqueDates(sortedDates);
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

  const getChange = (curr, prev) => {
    if (isNaN(curr) || isNaN(prev) || prev === 0) return '—';

    const change = ((curr - prev) / prev) * 100;
    const colorClass = change >= 0 ? 'text-green-600' : 'text-red-600';

    return (
      <span className={`font-semibold ${colorClass}`}>
        {change.toFixed(2)}%
      </span>
    );
  };

  const renderSortableHeader = (label, key) => (
    <th
      className="p-2 cursor-pointer select-none text-blue-600"
      onClick={() =>
        setSortConfig(prev => ({
          key,
          direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
      }
    >
      {label}
      {sortConfig.key === key ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  );

  const filteredData = data.filter((row) => {
    const text = `${row.announcement_type || ''} ${row.attchmntText || row.desc || ''}`.toLowerCase();
    const marketCap = parseFloat(row.marketCap) || 0;

    const keywordMatch = announcementKeywords.some(k => text.includes(k.toLowerCase()));
    const marketCapMatch = marketCap > 800 * 1e7;

    const rowDate = new Date(row.an_dt || row.sort_date || '');
    rowDate.setHours(0, 0, 0, 0);
    const localRowDate = rowDate.toLocaleDateString('en-CA');
    const isSameSelectedDate = selectedDateFilter ? localRowDate === selectedDateFilter : true;

    // Price change check
    const current = parseFloat(row.currentPrice);
    const prev = parseFloat(row.previousClose);
    const priceMoved = !isNaN(current) && !isNaN(prev) && prev > 0 && ((current - prev) / prev) * 100 > 3;

    return (!filtered || keywordMatch)
      && (!marketCapFilter || marketCapMatch)
      && (!priceChangeFilter || priceMoved)
      && isSameSelectedDate;
  });

  const enrichedData = filteredData.map(row => {
    const curr = parseFloat(row.currentPrice);
    const prev = parseFloat(row.previousClose);
    const change = !isNaN(curr) && !isNaN(prev) && prev !== 0
      ? ((curr - prev) / prev) * 100
      : null;

    return { ...row, change };
  });

  const sortedData = [...enrichedData].sort((a, b) => {
    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;

    if (key === 'change') {
      const valA = isNaN(a.change) ? -Infinity : a.change;
      const valB = isNaN(b.change) ? -Infinity : b.change;
      return dir * (valA - valB);
    }

    const dateA = new Date(a.an_dt || a.sort_date);
    const dateB = new Date(b.an_dt || b.sort_date);
    return dir * (dateA - dateB);
  });

  return (
    <div className="p-4 mb-4">

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
              onClick={() => setPriceChangeFilter(!priceChangeFilter)}
              className={`px-3 py-1 text-xs rounded-full border ${
                priceChangeFilter ? 'bg-green-300 text-black font-semibold' : 'bg-gray-200'
              }`}
            >
              Price Move &gt; 3%
            </button>

          </div>

          {uniqueDates.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="text-gray-600 mr-2">Filter by Date:</div>
              {uniqueDates.map(dateStr => (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateFilter(dateStr)}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    selectedDateFilter === dateStr ? 'bg-yellow-300 font-semibold' : 'bg-gray-100'
                  }`}
                >
                  {new Date(dateStr).toLocaleDateString('en-IN')}
                </button>
              ))}
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="px-2 py-1 text-xs border border-red-400 rounded-full bg-white text-red-600 ml-2"
                >
                  Clear Date
                </button>
              )}
            </div>
          )}

          <div className="text-sm mt-3 text-gray-600">
            Total rows {sortedData.length}
          </div>
        </div>

        <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
          <thead>
            <tr className="bg-gray-200">
              {renderSortableHeader('Date', 'an_dt')}
              <th className="p-2 text-left">Symbol</th>
              {renderSortableHeader('Change', 'change')}
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
                  <tr 
                    key={idx} 
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
                  >
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
                    <td className="p-2">
                      {getChange(row.currentPrice, row.previousClose)}
                    </td>
                    <td className="p-2">{row.announcement_type || row.desc || '—'}</td>
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
