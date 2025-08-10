import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Trades() {
  const tabs = [
    { key: 'bulkDeals', label: 'Bulk Deals', api: 'bulkDeals' },
    { key: 'blockDeals', label: 'Block Deals', api: 'blockDeals' },
    { key: 'shortDeals', label: 'Short Deals', api: 'shortDeals' },
    { key: 'sastDeals', label: 'SAST Deals', api: 'sastDeals' },
    { key: 'insiderDeals', label: 'Insider Deals', api: 'insiderDeals' },
  ];

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bulkDeals');
  const [sortConfigs, setSortConfigs] = useState(
    Object.fromEntries(tabs.map(t => [t.key, { key: 'date', direction: 'desc' }]))
  );

  useEffect(() => {
    setLoading(true);
    Promise.all(
      tabs.map(t =>
        axios
          .get(`${process.env.REACT_APP_API_URL}/api/${t.api}`)
          .then(res => ({ key: t.key, data: res.data }))
          .catch(() => ({ key: t.key, data: [] }))
      )
    ).then(results => {
      setData(Object.fromEntries(results.map(r => [r.key, enrichDeals(r.key, r.data)])));
      setLoading(false);
    });
  }, []);

  const enrichDeals = (type, deals) => {
    return deals.map(row => {
      let change = (!isNaN(row.currentPrice) && !isNaN(row.previousClose) && row.previousClose !== 0)
        ? ((parseFloat(row.currentPrice) - parseFloat(row.previousClose)) / parseFloat(row.previousClose)) * 100
        : null;

      let dealValue = null;
      if (['bulkDeals', 'blockDeals'].includes(type)) {
        dealValue = (!isNaN(row.qty) && !isNaN(row.watp))
          ? (parseFloat(row.qty) * parseFloat(row.watp)) / 1e7
          : null;
      } else if (type === 'shortDeals') {
        dealValue = (!isNaN(row.qty) && !isNaN(row.currentPrice))
          ? (parseFloat(row.qty) * parseFloat(row.currentPrice)) / 1e7
          : null;
      } else if (type === 'sastDeals') {
        const qty = parseFloat(row.noOfShareAcq || row.noOfShareSale);
        dealValue = (!isNaN(qty) && !isNaN(row.currentPrice))
          ? (qty * parseFloat(row.currentPrice)) / 1e7
          : null;
      } else if (type === 'insiderDeals') {
        dealValue = (!isNaN(row.secVal)) ? parseFloat(row.secVal) / 1e7 : null;
      }

      return { ...row, change, dealValue };
    });
  };

  const sortData = (rows, config) => {
    const dir = config.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      let valA = a[config.key];
      let valB = b[config.key];
      if (config.key === 'date') {
        valA = new Date(valA);
        valB = new Date(valB);
      }
      return dir * (valA - valB);
    });
  };

  const renderSortableHeader = (label, columnKey, tabKey) => {
    const config = sortConfigs[tabKey];
    return (
      <th
        className="p-2 cursor-pointer text-blue-600"
        onClick={() =>
          setSortConfigs(prev => ({
            ...prev,
            [tabKey]: {
              key: columnKey,
              direction:
                prev[tabKey].key === columnKey && prev[tabKey].direction === 'asc'
                  ? 'desc'
                  : 'asc',
            },
          }))
        }
      >
        {label}
        {config.key === columnKey ? (config.direction === 'asc' ? ' ↑' : ' ↓') : ''}
      </th>
    );
  };

  const DealsTable = ({ rows, tabKey }) => {
    const sorted = sortData(rows, sortConfigs[tabKey]);
    const scrollRef = React.useRef();

    // Restore scroll position after sort
    useEffect(() => {
      if (scrollRef.current && scrollRef.current.savedScrollLeft != null) {
        scrollRef.current.scrollLeft = scrollRef.current.savedScrollLeft;
      }
    }, [sortConfigs[tabKey]]);

    const saveScrollPosition = () => {
      if (scrollRef.current) {
        scrollRef.current.savedScrollLeft = scrollRef.current.scrollLeft;
      }
    };

    return (
        <div
          ref={scrollRef}
          onScroll={saveScrollPosition}
          className="overflow-x-auto mb-6"
        >
        <table className="table-auto border-collapse w-full text-sm text-gray-800">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left sticky left-0 bg-gray-200 z-10">Company</th>
              {renderSortableHeader('Change', 'change', tabKey)}
              {renderSortableHeader('Date', 'date', tabKey)}
              <th className="p-2 text-left">Buyer/Seller</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Mode</th>
              <th className="p-2">Qty</th>
              {renderSortableHeader('Deal Value', 'dealValue', tabKey)}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 sticky left-0 bg-white z-10">
                  <a
                    href={`symbol/${row.symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {row.name || row.company || '—'}
                  </a>
                </td>
                <td className={`p-2 ${row.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {row.change != null ? `${row.change.toFixed(2)}%` : '—'}
                </td>
                <td className="p-2">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                <td className="p-2">{row.clientName || row.acquirerName || row.acqName || '—'}</td>
                <td className="p-2">{row.buySell || row.acqSaleType || row.acqMode || '—'}</td>
                <td className="p-2">{row.acquisitionMode || row.personCategory || '—'}</td>
                <td className="p-2">{row.qty || row.noOfShareAcq || row.noOfShareSale || row.secAcq || '—'}</td>
                <td className="p-2 font-medium">
                  {row.dealValue != null ? `₹${row.dealValue.toFixed(2)} Cr` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex border-b mb-4 gap-x-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2 px-2 text-sm font-medium border-b-2 ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-blue-600 py-6 animate-pulse">Loading...</div>
      ) : (
        <DealsTable rows={data[activeTab] || []} tabKey={activeTab} />
      )}
    </div>
  );
}

export default Trades;
