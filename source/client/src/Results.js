import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Results() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'creation_Date', direction: 'desc' });

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/integratedResults`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch results', err);
        setLoading(false);
      });
  }, []);

  const getChange = (curr, prev) => {
    if (isNaN(curr) || isNaN(prev) || prev === 0) return '—';
    const change = ((curr - prev) / prev) * 100;
    const colorClass = change >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={`font-semibold ${colorClass}`}>{change.toFixed(2)}%</span>;
  };

  const normalizeDateString = dateStr => {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return d
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/ /g, '-');
  };

  const formatInCrores = value => {
    if (typeof value !== 'number' || isNaN(value)) return '—';
    return `₹${(value / 1e7).toFixed(2)} Cr`;
  };

  const getPrevDate = (sortedDateKeys, currentDateStr, offset = 1) => {
    const currentDate = new Date(currentDateStr);
    const dateObjects = sortedDateKeys
      .map(d => ({ raw: d, dateObj: new Date(d) }))
      .sort((a, b) => a.dateObj - b.dateObj);

    const currIndex = dateObjects.findIndex(
      d => d.dateObj.toDateString() === currentDate.toDateString()
    );
    if (currIndex === -1 || currIndex - offset < 0) return null;
    return dateObjects[currIndex - offset].raw;
  };

  const renderSortableHeader = (label, key) => (
    <th
      className="p-2 cursor-pointer select-none text-blue-600"
      onClick={() =>
        setSortConfig(prev => ({
          key,
          direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }))
      }
    >
      {label}
      {sortConfig.key === key ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  );

  // Prepare enriched data
  const enrichedData = data
    .filter(row => row.type === 'Integrated Filing- Financials')
    .map(row => {
      const isConsolidated = row.consolidated?.toLowerCase() === 'consolidated';
      const revenueData = isConsolidated
        ? row.last5revenue_consolidated || {}
        : row.last5revenue_standalone || {};
      const patData = isConsolidated
        ? row.last5PAT_consolidated || {}
        : row.last5PAT_standalone || {};

      const dates = Object.keys(revenueData).sort((a, b) => new Date(a) - new Date(b));
      const currDate = normalizeDateString(row.qe_Date);
      const prevQ = getPrevDate(dates, currDate, 1);
      const prevY = getPrevDate(dates, currDate, 4);

      const revCurr = revenueData[currDate];
      const revPrevQ = revenueData[prevQ];
      const revPrevY = revenueData[prevY];
      const patCurr = patData[currDate];
      const patPrevQ = patData[prevQ];
      const patPrevY = patData[prevY];

      const pct = (curr, prev) =>
        isNaN(curr) || isNaN(prev) || prev === 0 ? null : ((curr - prev) / prev) * 100;

      return {
        ...row,
        revCurr,
        revPrevQ,
        revPrevY,
        patCurr,
        patPrevQ,
        patPrevY,
        revQQ: pct(revCurr, revPrevQ),
        revYY: pct(revCurr, revPrevY),
        patQQ: pct(patCurr, patPrevQ),
        patYY: pct(patCurr, patPrevY),
        change: pct(row.currentPrice, row.previousClose),
      };
    });

  const sortedData = [...enrichedData].sort((a, b) => {
    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;
    if (key === 'creation_Date') {
      return dir * (new Date(a.creation_Date) - new Date(b.creation_Date));
    }
    const valA = a[key] ?? -Infinity;
    const valB = b[key] ?? -Infinity;
    return dir * (valA - valB);
  });

  if (loading) {
    return (
      <div className="text-center text-blue-600 font-medium py-6 animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-4 mb-6">
      <div className="overflow-x-auto relative">
        <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
          <thead className="bg-gray-200 text-left sticky top-0 z-40">
            <tr>
              <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
              <th className="p-2">Quarter End</th>
              {renderSortableHeader('Date', 'creation_Date')}
              <th className="p-2">Consolidated</th>
              {renderSortableHeader('Change', 'change')}
              {renderSortableHeader('Revenue Q-Q%', 'revQQ')}
              {renderSortableHeader('Revenue Y-Y%', 'revYY')}
              {renderSortableHeader('PAT Q-Q%', 'patQQ')}
              {renderSortableHeader('PAT Y-Y%', 'patYY')}
              <th className="p-2">XBRL</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 sticky left-0 bg-white z-10 font-medium">
                  <a
                    href={`symbol/${row.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {row.cmName || '—'}
                  </a>
                </td>
                <td className="p-2">{row.qe_Date}</td>
                <td className="p-2">{row.creation_Date}</td>
                <td className="p-2">{row.consolidated}</td>
                <td className="p-2">{getChange(row.currentPrice, row.previousClose)}</td>

                {/* Revenue Q-Q */}
                <td className="p-2">
                  {getChange(row.revCurr, row.revPrevQ)}
                  {row.revCurr != null && row.revPrevQ != null && (
                    <div className="text-xs text-gray-500">
                      {formatInCrores(row.revCurr)} Vs {formatInCrores(row.revPrevQ)}
                    </div>
                  )}
                </td>

                {/* Revenue Y-Y */}
                <td className="p-2">
                  {getChange(row.revCurr, row.revPrevY)}
                  {row.revCurr != null && row.revPrevY != null && (
                    <div className="text-xs text-gray-500">
                      {formatInCrores(row.revCurr)} Vs {formatInCrores(row.revPrevY)}
                    </div>
                  )}
                </td>

                {/* PAT Q-Q */}
                <td className="p-2">
                  {getChange(row.patCurr, row.patPrevQ)}
                  {row.patCurr != null && row.patPrevQ != null && (
                    <div className="text-xs text-gray-500">
                      {formatInCrores(row.patCurr)} Vs {formatInCrores(row.patPrevQ)}
                    </div>
                  )}
                </td>

                {/* PAT Y-Y */}
                <td className="p-2">
                  {getChange(row.patCurr, row.patPrevY)}
                  {row.patCurr != null && row.patPrevY != null && (
                    <div className="text-xs text-gray-500">
                      {formatInCrores(row.patCurr)} Vs {formatInCrores(row.patPrevY)}
                    </div>
                  )}
                </td>

                <td className="p-2">
                  <a
                    href={row.xbrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Results;
