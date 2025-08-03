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
  const [sortBulkDealConfig, setSortBulkDealConfig] = useState({ key: 'date', direction: 'asc' });

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/bulkDeals')
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
    axios.get('http://localhost:5000/api_2/blockDeals')
      .then(res => setBlockDealsData(res.data))
      .catch(err => console.error('Failed to fetch blockDeals', err));
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/shortDeals')
      .then(res => setShortDealsData(res.data))
      .catch(err => console.error('Failed to fetch shortDeals', err));
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/sastDeals')
      .then(res => setSastDealsData(res.data))
      .catch(err => console.error('Failed to fetch sastDeals', err));
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/insiderDeals')
      .then(res => setInsiderDealsData(res.data))
      .catch(err => console.error('Failed to fetch sastDeals', err));
  }, []);

  const renderSortableHeader = (label, key) => (
    <th
      className="p-2 cursor-pointer select-none text-blue-600"
      onClick={() =>
        setSortBulkDealConfig(prev => ({
          key,
          direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
      }
    >
      {label}
      {sortBulkDealConfig.key === key ? (sortBulkDealConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  );

  const enrichedBulkDealsData = bulkDeals.map(row => {
    const curr = parseFloat(row.currentPrice);
    const prev = parseFloat(row.previousClose);
    const change = !isNaN(curr) && !isNaN(prev) && prev !== 0
      ? ((curr - prev) / prev) * 100
      : null;

    const dealValue = (!isNaN(row.qty) && !isNaN(row.watp))
      ? (parseFloat(row.qty) * parseFloat(row.watp)) / 1e7
      : null;

    return { ...row, change, dealValue };
  });

  const sortedBulkDeals = [...enrichedBulkDealsData].sort((a, b) => {
    const { key, direction } = sortBulkDealConfig;
    const dir = direction === 'asc' ? 1 : -1;

    if (key === 'change' || key === 'dealValue') {
      const valA = isNaN(a[key]) ? -Infinity : a[key];
      const valB = isNaN(b[key]) ? -Infinity : b[key];
      return dir * (valA - valB);
    }

    if (key === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dir * (dateA - dateB);
    }

    return 0;
  });

  const sortedBlockDeals = [...blockDeals].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedShortDeals = [...shortDeals].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedSastDeals  = [...sastDeals].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const sortedInsiderDeals  = [...insiderDeals].sort((a, b) => new Date(b.date) - new Date(a.date));

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
      <div className="flex border-b mb-4 gap-x-6 ml-1">
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
        <p>Loading data...</p>
      ) : (
        <>
          {activeTab === 'bulkDeals' && (
          <>
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Company</th>
                  {renderSortableHeader('Change', 'change')}
                  {renderSortableHeader('Date', 'date')}
                  <th className="p-2 text-left">Client Name</th>
                  <th className="p-2 text-left">Buy/Sell</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Weighted Avg Price</th>
                  {renderSortableHeader('Deal Value', 'dealValue')}
                </tr>
              </thead>
              <tbody>
                {sortedBulkDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
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
                    <td className="p-2">{row.name || '—'}</td>

                    <td className="p-2">
                      {getChange(row.currentPrice, row.previousClose)}
                    </td>
                    <td className="p-2">{formatDate(row.date)}</td>
                    <td className="p-2">{row.clientName}</td>
                    <td className="p-2">{row.buySell}</td>
                    <td className="p-2">{row.qty}</td>
                    <td className="p-2">{row.watp}</td>

                    {/* 🔸 Computed Deal Size in Cr */}
                    <td className="p-2 font-medium">
                      {(() => {
                        const dealValue = (parseFloat(row.qty) * parseFloat(row.watp)) / 1e7;
                        if (!isNaN(dealValue)) {
                          return `₹${dealValue.toFixed(2)} Cr`;
                        }
                        return '—';
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
          )}

          {activeTab === 'blockDeals' && (
          <>
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Company</th>
                  <th className="p-2 text-left">Change</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Client Name</th>
                  <th className="p-2 text-left">Buy/Sell</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Weighted Avg Price</th>
                  <th className="p-2 text-left">Deal Value</th>
                </tr>
              </thead>
              <tbody>
                {sortedBlockDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
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
                    <td className="p-2">{row.name || '—'}</td>
                    <td className="p-2">
                      {getChange(row.currentPrice, row.previousClose)}
                    </td>
                    <td className="p-2">{formatDate(row.date)}</td>
                    <td className="p-2">{row.clientName}</td>
                    <td className="p-2">{row.buySell}</td>
                    <td className="p-2">{row.qty}</td>
                    <td className="p-2">{row.watp}</td>
                    {/* 🔸 Computed Deal Size in Cr */}
                    <td className="p-2 font-medium">
                      {(() => {
                        const dealValue = (parseFloat(row.qty) * parseFloat(row.watp)) / 1e7;
                        if (!isNaN(dealValue)) {
                          return `₹${dealValue.toFixed(2)} Cr`;
                        }
                        return '—';
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
          )}

          {activeTab === 'shortDeals' && (
          <>
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Company</th>
                  <th className="p-2 text-left">Change</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {sortedShortDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
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
                    <td className="p-2">{row.name || '—'}</td>
                    <td className="p-2">
                      {getChange(row.currentPrice, row.previousClose)}
                    </td>
                    <td className="p-2">{formatDate(row.date)}</td>
                    <td className="p-2">{row.qty}</td>
                    <td className="p-2 font-medium">
                      {(() => {
                        const totalValue = (parseFloat(row.qty) * parseFloat(row.currentPrice)) / 1e7;
                        if (!isNaN(totalValue)) {
                          return `₹${totalValue.toFixed(2)} Cr`;
                        }
                        return '—';
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
          )}

          {activeTab === 'sastDeals' && (
          <>
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Company</th>
                  <th className="p-2 text-left">Change</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Buyer/Seller Name</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Est. Amount</th>
                </tr>
              </thead>
              <tbody>
                {sortedSastDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
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
                    <td className="p-2">{row.company || '—'}</td>
                    <td className="p-2">
                      {getChange(row.currentPrice, row.previousClose)}
                    </td>
                    <td className="p-2">{formatDate(row.timestamp)}</td>
                    <td className="p-2">{row.acqSaleType}</td>
                    <td className="p-2">{row.acquirerName}</td>
                    <td className="p-2">{row.noOfShareAcq || row.noOfShareSale}</td>
                    <td className="p-2 font-medium">
                      {(() => {
                        let qnt = row.noOfShareAcq || row.noOfShareSale
                        qnt = (parseFloat(qnt)) * (parseFloat(row.currentPrice)) / 1e7;
                        if (!isNaN(qnt)) {
                          return `₹${qnt.toFixed(2)} Cr`;
                        }
                        return '—';
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
          )}

          {activeTab === 'insiderDeals' && (
          <>
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal mb-6">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Company</th>
                  <th className="p-2 text-left">Change</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Buyer/Seller Name</th>

                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Est. Amount</th>
                </tr>
              </thead>
              <tbody>
                {sortedInsiderDeals.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
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
                    <td className="p-2">{row.company || '—'}</td>
                    <td className="p-2">
                      {getChange(row.currentPrice, row.previousClose)}
                    </td>
                    <td className="p-2">{formatDate(row.date)}</td>
                    <td className="p-2">{row.acqMode}</td>
                    <td className="p-2">{row.acqName}</td>

                    <td className="p-2">{row.secAcq}</td>
                    <td className="p-2 font-medium">
                      {(() => {
                        let val = (parseFloat(row.secVal)) / 1e7;
                        if (!isNaN(val)) {
                          return `₹${val.toFixed(2)} Cr`;
                        }
                        return '—';
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
          )}
        </>
      )}
    </div>
  );
}

export default Trades;
