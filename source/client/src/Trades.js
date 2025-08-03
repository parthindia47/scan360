import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Trades() {
  const [bulkDeals, setBulkDealsData] = useState([]);
  const [blockDeals, setBlockDealsData] = useState([]);
  const [shortDeals, setShortDealsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bulkDeals');

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

  const renderTable = (data) => (
    <div className="overflow-x-auto">
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Symbol</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Client</th>
            <th className="border p-2">Buy/Sell</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">WATP</th>
            <th className="border p-2">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border p-2">{row.date}</td>
              <td className="border p-2">{row.symbol}</td>
              <td className="border p-2">{row.name}</td>
              <td className="border p-2">{row.clientName}</td>
              <td className="border p-2">{row.buySell}</td>
              <td className="border p-2">{row.qty}</td>
              <td className="border p-2">{row.watp}</td>
              <td className="border p-2">{row.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const sortedBulkDeals = [...bulkDeals].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedBlockDeals = [...blockDeals].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedShortDeals = [...shortDeals].sort((a, b) => new Date(b.date) - new Date(a.date));

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
        {['bulkDeals', 'blockDeals', 'shortDeals'].map(tab => (
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
             'Short Deals'}
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
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Client Name</th>
                  <th className="p-2 text-left">Buy/Sell</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Weighted Avg Price</th>
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
                    <td className="p-2">{formatDate(row.date)}</td>
                    <td className="p-2">{row.clientName}</td>
                    <td className="p-2">{row.buySell}</td>
                    <td className="p-2">{row.qty}</td>
                    <td className="p-2">{row.watp}</td>
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
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Qty</th>
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
                    <td className="p-2">{formatDate(row.date)}</td>
                    <td className="p-2">{row.qty}</td>
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
