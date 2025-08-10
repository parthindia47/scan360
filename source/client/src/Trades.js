import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Trades() {
  const [bulkDeals, setBulkDealsData] = useState([]);
  const [blockDeals, setBlockDealsData] = useState([]);
  const [shortDeals, setShortDealsData] = useState([]);
  const [sastDeals, setSastDealsData] = useState([]);
  const [insiderDeals, setInsiderDealsData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bulkDeals');

  const [sortConfigs, setSortConfigs] = useState({
    bulkDeals: { key: 'date', direction: 'desc' },
    blockDeals: { key: 'date', direction: 'desc' },
    shortDeals: { key: 'date', direction: 'desc' },
    sastDeals: { key: 'date', direction: 'desc' },
    insiderDeals: { key: 'date', direction: 'desc' },
  });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/bulkDeals`)
      .then(res => {
        setBulkDealsData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch bulkDeals', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/blockDeals`)
      .then(res => setBlockDealsData(res.data))
      .catch(err => console.error('Failed to fetch blockDeals', err));
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/shortDeals`)
      .then(res => setShortDealsData(res.data))
      .catch(err => console.error('Failed to fetch shortDeals', err));
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/sastDeals`)
      .then(res => setSastDealsData(res.data))
      .catch(err => console.error('Failed to fetch sastDeals', err));
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/insiderDeals`)
      .then(res => setInsiderDealsData(res.data))
      .catch(err => console.error('Failed to fetch sastDeals', err));
  }, []);

  const renderSortableHeader = (label, columnKey, tabKey) => {
    const config = sortConfigs[tabKey];

    const handleSort = () => {
      setSortConfigs((prev) => ({
        ...prev,
        [tabKey]: {
          key: columnKey,
          direction:
            prev[tabKey].key === columnKey && prev[tabKey].direction === 'asc'
              ? 'desc'
              : 'asc',
        },
      }));
    };

    return (
      <th
        className="p-2 cursor-pointer select-none text-blue-600"
        onClick={handleSort}
      >
        {label}
        {config.key === columnKey
          ? config.direction === 'asc'
            ? ' ↑'
            : ' ↓'
          : ''}
      </th>
    );
  };

  const sortByConfig = (data, config) => {
    const { key, direction } = config;
    const dir = direction === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
      let valA = null;
      let valB = null;

      if (key === 'change') {
        const valA = isNaN(a.change) ? -Infinity : a.change;
        const valB = isNaN(b.change) ? -Infinity : b.change;
        return dir * (valA - valB);
      }

      if (key === 'change' || key === 'dealValue') {
        valA = parseFloat(a[key]);
        valB = parseFloat(b[key]);

        valA = Number.isFinite(valA) ? valA : -Infinity;
        valB = Number.isFinite(valB) ? valB : -Infinity;

        return dir * (valA - valB);
      }

      if (key === 'date') {
        valA = a.date;
        valB = b.date;
        return dir * (new Date(valA) - new Date(valB));
      }

      return 0;
    });
  };


  const enrichedBulkDeals = bulkDeals.map(row => ({
    ...row,
    change: (!isNaN(row.currentPrice) && !isNaN(row.previousClose) && row.previousClose !== 0)
      ? ((parseFloat(row.currentPrice) - parseFloat(row.previousClose)) / parseFloat(row.previousClose)) * 100
      : null,
    dealValue: (!isNaN(row.qty) && !isNaN(row.watp))
      ? (parseFloat(row.qty) * parseFloat(row.watp)) / 1e7
      : null
  }));

  const enrichedBlockDeals = blockDeals.map(row => ({
    ...row,
    change: (!isNaN(row.currentPrice) && !isNaN(row.previousClose) && row.previousClose !== 0)
      ? ((parseFloat(row.currentPrice) - parseFloat(row.previousClose)) / parseFloat(row.previousClose)) * 100
      : null,
    dealValue: (!isNaN(row.qty) && !isNaN(row.watp))
      ? (parseFloat(row.qty) * parseFloat(row.watp)) / 1e7
      : null
  }));

  const enrichedShortDeals = shortDeals.map(row => ({
    ...row,
    change: (!isNaN(row.currentPrice) && !isNaN(row.previousClose) && row.previousClose !== 0)
      ? ((parseFloat(row.currentPrice) - parseFloat(row.previousClose)) / parseFloat(row.previousClose)) * 100
      : null,
    dealValue: (!isNaN(row.qty) && !isNaN(row.currentPrice))
      ? (parseFloat(row.qty) * parseFloat(row.currentPrice)) / 1e7
      : null
  }));

  const enrichedSastDeals = sastDeals.map(row => {
    const qty = parseFloat(row.noOfShareAcq || row.noOfShareSale);
    const price = parseFloat(row.currentPrice);
    return {
      ...row,
      change: (!isNaN(price) && !isNaN(row.previousClose) && row.previousClose !== 0)
        ? ((price - parseFloat(row.previousClose)) / parseFloat(row.previousClose)) * 100
        : null,
      dealValue: (!isNaN(qty) && !isNaN(price)) ? (qty * price) / 1e7 : null
    };
  });

  const enrichedInsiderDeals = insiderDeals.map(row => ({
    ...row,
    change: (!isNaN(row.currentPrice) && !isNaN(row.previousClose) && row.previousClose !== 0)
      ? ((parseFloat(row.currentPrice) - parseFloat(row.previousClose)) / parseFloat(row.previousClose)) * 100
      : null,
    dealValue: (!isNaN(row.secVal)) ? parseFloat(row.secVal) / 1e7 : null
  }));

  const sortedBulkDeals = sortByConfig(enrichedBulkDeals, sortConfigs.bulkDeals);
  const sortedBlockDeals = sortByConfig(enrichedBlockDeals, sortConfigs.blockDeals);
  const sortedShortDeals = sortByConfig(enrichedShortDeals, sortConfigs.shortDeals);
  const sortedSastDeals = sortByConfig(enrichedSastDeals, sortConfigs.sastDeals);
  const sortedInsiderDeals = sortByConfig(enrichedInsiderDeals, sortConfigs.insiderDeals);


  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date) ? '—' : date.toLocaleDateString('en-IN');
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

  return (
    <div className="p-4">

      {/* 🔹 Tabs */}
      <div className="flex flex-wrap gap-3 border-b mb-4 ml-1">
        {['bulkDeals', 'blockDeals', 'shortDeals', 'sastDeals', 'insiderDeals'].map(tab => (
          <a
            key={tab}
            href="#"
            style={{ marginRight: '1rem' }}  // 👈 1rem = 16px
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(tab);
            }}
            className={`inline-block mr-4 pb-2 px-2 text-sm font-medium transition duration-150 ease-in-out border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
            }`}
          >
            {tab === 'bulkDeals' ? 'Bulk Deals' :
             tab === 'blockDeals' ? 'Block Deals' :
             tab === 'shortDeals' ? 'Short Deals' :
             tab === 'insiderDeals' ? 'Insider Deals' :
             'SAST Deals'}
          </a>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-blue-600 font-medium py-6 animate-pulse">Loading...</div>
      ) : (
        <>
          {activeTab === 'bulkDeals' && (
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                  {renderSortableHeader('Change', 'change', activeTab)}
                  {renderSortableHeader('Date', 'date', activeTab)}
                  <th className="p-2 text-left">Buyer/Seller</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Mode</th>
                  <th className="p-2">Qty</th>
                  {renderSortableHeader('Deal Value', 'dealValue', activeTab)}
                </tr>
              </thead>
              <tbody>
                {sortedBulkDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">
                      <a
                        href={`symbol/${row.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {row.name || row.company || '—'}
                      </a>
                    </td>
                    <td className={`p-2 ${row.change ? row.change >= 0 ? 'text-green-600' : 'text-red-600': 'text-gray-600'}`}>
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
          )}

          {activeTab === 'blockDeals' && (
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                  {renderSortableHeader('Change', 'change', activeTab)}
                  {renderSortableHeader('Date', 'date', activeTab)}
                  <th className="p-2 text-left">Buyer/Seller</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Mode</th>
                  <th className="p-2">Qty</th>
                  {renderSortableHeader('Deal Value', 'dealValue', activeTab)}
                </tr>
              </thead>
              <tbody>
                {sortedBlockDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">
                      <a
                        href={`symbol/${row.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {row.name || row.company || '—'}
                      </a>
                    </td>
                    <td className={`p-2 ${row.change ? row.change >= 0 ? 'text-green-600' : 'text-red-600': 'text-gray-600'}`}>
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
          )}

          {activeTab === 'shortDeals' && (
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                  {renderSortableHeader('Change', 'change', activeTab)}
                  {renderSortableHeader('Date', 'date', activeTab)}
                  <th className="p-2 text-left">Buyer/Seller</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Mode</th>
                  <th className="p-2">Qty</th>
                  {renderSortableHeader('Deal Value', 'dealValue', activeTab)}
                </tr>
              </thead>
              <tbody>
                {sortedShortDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">
                      <a
                        href={`symbol/${row.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {row.name || row.company || '—'}
                      </a>
                    </td>
                    <td className={`p-2 ${row.change ? row.change >= 0 ? 'text-green-600' : 'text-red-600': 'text-gray-600'}`}>
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
          )}

          {activeTab === 'sastDeals' && (
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                  {renderSortableHeader('Change', 'change', activeTab)}
                  {renderSortableHeader('Date', 'date', activeTab)}
                  <th className="p-2 text-left">Buyer/Seller</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Mode</th>
                  <th className="p-2">Qty</th>
                  {renderSortableHeader('Deal Value', 'dealValue', activeTab)}
                </tr>
              </thead>
              <tbody>
                {sortedSastDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">
                      <a
                        href={`symbol/${row.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {row.name || row.company || '—'}
                      </a>
                    </td>
                    <td className={`p-2 ${row.change ? row.change >= 0 ? 'text-green-600' : 'text-red-600': 'text-gray-600'}`}>
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
          )}

          {activeTab === 'insiderDeals' && (
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                  {renderSortableHeader('Change', 'change', activeTab)}
                  {renderSortableHeader('Date', 'date', activeTab)}
                  <th className="p-2 text-left">Buyer/Seller</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Mode</th>
                  <th className="p-2">Qty</th>
                  {renderSortableHeader('Deal Value', 'dealValue', activeTab)}
                </tr>
              </thead>
              <tbody>
                {sortedInsiderDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">
                      <a
                        href={`symbol/${row.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {row.name || row.company || '—'}
                      </a>
                    </td>
                    <td className={`p-2 ${row.change ? row.change >= 0 ? 'text-green-600' : 'text-red-600': 'text-gray-600'}`}>
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
          )}
        </>
      )}
    </div>
  );
}

export default Trades;
