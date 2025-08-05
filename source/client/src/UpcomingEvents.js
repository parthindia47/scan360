import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UpcomingEvents() {
  const [eventsData, setEventsData] = useState([]);
  const [upcomingIssuesData, setUpcomingIssuesData] = useState([]);
  const [forthcomingListingData, setForthcomingListingData] = useState([]);
  const [forthcomingOfsData, setForthcomingOfsData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events'); // 🔹 tracks which tab is active
  const [marketCapFilter, setMarketCapFilter] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null); // or null if nothing selected
  const [periodFilter, setPeriodFilter] = useState(null); // "today" | "next3days" | null
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [sortConfigs, setSortConfigs] = useState({
    events: { key: 'date', direction: 'asc' },
    upcomingIssues: { key: 'date', direction: 'asc' },
    forthcomingListing: { key: 'date', direction: 'asc' },
    forthcomingOfs: { key: 'date', direction: 'asc' },
  });
  

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/events')
      .then(res => {
        setEventsData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch events', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/upcomingIssues')
      .then(res => {
        setUpcomingIssuesData(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch upcomingIssuesData', err);
      });
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/forthcomingListing')
      .then(res => {
        setForthcomingListingData(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch forthcomingListingData', err);
      });
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/forthcomingOfs')
      .then(res => {
        setForthcomingOfsData(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch forthcomingOfs', err);
      });
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date) ? 'Invalid date' : date.toLocaleDateString('en-IN');
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

  const allSeriesOptions = [
    ...new Set(
      upcomingIssuesData
        .filter((item) => item.series)
        .map((item) => item.series)
    ),
  ];

  const filteredEventsData = eventsData.filter((row) => {
    const text = `${row.purpose || ''}`.toLowerCase();
    const marketCap = parseFloat(row.marketCap ?? 0);


    const keywordMatch = selectedKeyword
      ? text.includes(selectedKeyword.toLowerCase())
      : true;

    const marketCapMatch = marketCapFilter
      ? marketCap > 800 * 1e7
      : true;

    const eventDate = row.date ? new Date(row.date) : null;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const dateMatch =
      periodFilter === 'today'
        ? eventDate && eventDate.toDateString() === today.toDateString()
        : periodFilter === 'yesterday'
        ? eventDate && eventDate.toDateString() === yesterday.toDateString()
        : periodFilter === 'next3days'
        ? eventDate >= today &&
          eventDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
        : true;

    return keywordMatch && marketCapMatch && dateMatch;
  });

  const enrichedEventsData = filteredEventsData.map(row => {
    const curr = parseFloat(row.currentPrice);
    const prev = parseFloat(row.previousClose);
    const change = !isNaN(curr) && !isNaN(prev) && prev !== 0
      ? ((curr - prev) / prev) * 100
      : null;

    return { ...row, change };
  });

  const sortedEventsData = [...enrichedEventsData].sort((a, b) => {
    const { key, direction } = sortConfigs.events;
    const dir = direction === 'asc' ? 1 : -1;

    if (key === 'change') {
      const valA = isNaN(a.change) ? -Infinity : a.change;
      const valB = isNaN(b.change) ? -Infinity : b.change;
      return dir * (valA - valB);
    }

    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dir * (dateA - dateB);
  });

  const sortedForthcomingListingData = [...forthcomingListingData].sort((a, b) => {
    const { key, direction } = sortConfigs.forthcomingListing;
    const dir = direction === 'asc' ? 1 : -1;

    if (key === 'date') {
      const dateA = new Date(a.effectiveDate);
      const dateB = new Date(b.effectiveDate);
      return dir * (dateA - dateB);
    }

    return 0;
  });

  const filteredUpcomingIssueData = (data, selectedSeries) => {
    return data.filter((item) => {
      const seriesMatch = selectedSeries ? item.series === selectedSeries : true;

      return seriesMatch;
    });
  };

  const enrichedUpcomingIssues = filteredUpcomingIssueData(upcomingIssuesData, selectedSeries).map(row => {
    const size = parseFloat((row.issueSize || '').toString().replace(/,/g, ''));
    const priceMatch = (row.issuePrice || '').match(/(\d+(\.\d+)?)(?!.*\d)/); // last number
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;

    const totalSize = (!isNaN(size) && !isNaN(price)) ? (size * price) / 1e7 : null;
    return { ...row, totalSize };
  });

  const sortedUpcomingIssuesData = [...enrichedUpcomingIssues].sort((a, b) => {
    const { key, direction } = sortConfigs.upcomingIssues;
    const dir = direction === 'asc' ? 1 : -1;

    if (key === 'totalSize') {
      const valA = isNaN(a.totalSize) ? -Infinity : a.totalSize;
      const valB = isNaN(b.totalSize) ? -Infinity : b.totalSize;
      return dir * (valA - valB);
    }

    if (key === 'date') {
      const dateA = new Date(a.issueEndDate);
      const dateB = new Date(b.issueEndDate);
      return dir * (dateA - dateB);
    }

    return 0;
  });

  const enrichedForthcomingOfs = forthcomingOfsData.map(row => {
    const size = parseFloat((row.issueSize || '').toString().replace(/,/g, ''));
    const price = parseFloat((row.floorPrice || '').toString().replace(/,/g, ''));
    const totalSize = (!isNaN(size) && !isNaN(price)) ? (size * price) / 1e7 : null;
    return { ...row, totalSize };
  });

  const sortedForthcomingOfsData = [...enrichedForthcomingOfs].sort((a, b) => {
    const { key, direction } = sortConfigs.forthcomingOfs;
    const dir = direction === 'asc' ? 1 : -1;

    if (key === 'totalSize') {
      const valA = isNaN(a.totalSize) ? -Infinity : a.totalSize;
      const valB = isNaN(b.totalSize) ? -Infinity : b.totalSize;
      return dir * (valA - valB);
    }

    if (key === 'date') {
      const dateA = new Date(a.endDate);
      const dateB = new Date(b.endDate);
      return dir * (dateA - dateB);
    }

    return 0;
  });

  return (
    <div className="p-4 mb-4">
      {/* 🔹 Navbar Tabs */}
      <div className="flex border-b mb-4 gap-x-6 ml-1">
        {['events', 'upcomingIssues', 'forthcomingListing', 'forthcomingOfs'].map(tab => (
          <a
            href="#"
            key={tab}
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
            {tab === 'events' ? 'Events' :
             tab === 'upcomingIssues' ? 'Upcoming Issues' :
             tab === 'forthcomingListing' ? 'Upcoming Listings':
             'Upcoming OFS'}
          </a>
        ))}
      </div>

      {/* 🔹 Events */}
      {activeTab === 'events' && (
        <>
          {loading ? (
            <div className="text-center text-blue-600">Loading...</div>
          ) : (
            <>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <div className="text-gray-600">Filters Subjects : </div>
                {["Financial Results", "Stock Split", "Bonus", "Dividend", "Fund Raising"].map(keyword => (
                  <button
                    key={keyword}
                    onClick={() =>
                      setSelectedKeyword(selectedKeyword === keyword ? null : keyword)
                    }
                    className={`px-3 py-1 text-xs rounded-full border ${
                      selectedKeyword === keyword ? 'bg-green-300 text-black font-semibold' : 'bg-gray-200'
                    }`}
                  >
                    {keyword}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <div className="text-gray-600">Filters Period : </div>
                {["yesterday", "today", "next3days"].map((label) => (
                  <button
                    key={label}
                    onClick={() =>
                      setPeriodFilter(periodFilter === label ? null : label)
                    }
                    className={`px-3 py-1 text-xs rounded-full border font-medium ${
                      periodFilter === label
                        ? 'bg-indigo-300 text-black'
                        : 'bg-indigo-100 text-gray-800'
                    }`}
                  >
                    {label === 'yesterday'
                      ? 'Yesterday'
                      : label === 'today'
                      ? 'Today'
                      : 'Next 3 Days'}
                  </button>
                ))}

                <button
                  onClick={() => setMarketCapFilter(!marketCapFilter)}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    marketCapFilter ? 'bg-green-300 text-black font-semibold' : 'bg-gray-200'
                  }`}
                >
                  Market Cap &gt; 800 Cr
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Total rows {sortedEventsData.length}
              </div>
            </div>

            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
              <thead>
                <tr className="bg-gray-200">
                  {renderSortableHeader('Date', 'date', 'events')}
                  <th className="p-2 text-left">Symbol</th>
                  {renderSortableHeader('Change', 'change', 'events')}
                  <th className="p-2 text-left">Company</th>
                  <th className="p-2 text-left">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {sortedEventsData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 py-4">
                      No matching events found.
                    </td>
                  </tr>
                ) : (
                  sortedEventsData.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                      <td className="p-2">{formatDate(row.date)}</td>
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
                      <td className="p-2">{row.company || '—'}</td>
                      <td className="p-2">{row.purpose || '—'}</td>
                      
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </>
          )}
        </>
      )}

      {/* 🔹 Upcoming Issues */}
      {activeTab === 'upcomingIssues' && (
        <>
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-gray-600 text-sm">Filter by Series:</span>
          {allSeriesOptions.map((seriesVal) => (
            <button
              key={seriesVal}
              onClick={() =>
                setSelectedSeries((prev) => (prev === seriesVal ? null : seriesVal))
              }
              className={`px-3 py-1 text-xs rounded-full border ${
                selectedSeries === seriesVal
                  ? 'bg-blue-500 text-white font-semibold'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {seriesVal}
            </button>
          ))}
        </div>

          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Issue Type</th>
                <th className="p-2 text-left">Opening Date</th>
                {renderSortableHeader('Closing Date', 'date', 'upcomingIssues')}
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Issue Size</th>
                <th className="p-2 text-left">Issue Price</th>
                {renderSortableHeader('Total Size', 'totalSize', 'upcomingIssues')}
              </tr>
            </thead>
            <tbody>
              {sortedUpcomingIssuesData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                  <td className="p-2">{item.companyName || '—'}</td>
                  <td className="p-2">{item.series || '—'}</td>
                  <td className="p-2">{formatDate(item.issueStartDate)}</td>
                  <td className="p-2">{formatDate(item.issueEndDate)}</td>
                  <td className="p-2">{item.status || '—'}</td>
                  <td className="p-2">{item.issueSize || '—'}</td>
                  <td className="p-2">{item.issuePrice || '—'}</td>

                  {/* 🔸 Computed Total Size in Cr */}
                  <td className="p-2 font-medium">
                    {(() => {
                      const size = parseFloat((item.issueSize || '').toString().replace(/,/g, ''));
                      const priceMatch = (item.issuePrice || '').match(/(\d+(\.\d+)?)(?!.*\d)/); // get last number
                      const price = priceMatch ? parseFloat(priceMatch[1]) : null;

                      if (!isNaN(size) && !isNaN(price)) {
                        const total = (size * price) / 1e7;
                        return `₹${total.toFixed(2)} Cr`;
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

      {/* 🔹 Forthcoming Listing*/}
      {activeTab === 'forthcomingListing' && (
        <>
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Issue Type</th>
                {renderSortableHeader('Effective Date', 'date', 'forthcomingListing')}
                <th className="p-2 text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {sortedForthcomingListingData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                  <td className="p-2">{item.companyName || '—'}</td>
                  <td className="p-2">{item.series || '—'}</td>
                  <td className="p-2">{formatDate(item.effectiveDate)}</td>
                  <td className="p-2">
                    {item.shdAttachment ? (
                      <a
                        href={item.shdAttachment}
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
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 🔹 Forthcoming Ofs*/}
      {activeTab === 'forthcomingOfs' && (
        <>
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Symbol</th>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Start Date</th>
                {renderSortableHeader('Closing Date', 'date', 'forthcomingOfs')}
                <th className="p-2 text-left">Floor Price</th>
                {renderSortableHeader('Total Size', 'totalSize', 'forthcomingOfs')}
              </tr>
            </thead>
            <tbody>
              {sortedForthcomingOfsData.map((row, idx) => (
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
                  <td className="p-2">{row.companyName || '—'}</td>
                  <td className="p-2">{row.series || '—'}</td>
                  <td className="p-2">{formatDate(row.startDate)}</td>
                  <td className="p-2">{formatDate(row.endDate)}</td>
                  <td className="p-2">{row.floorPrice}</td>
                  <td className="p-2 font-medium">
                    {(() => {
                      const size = parseFloat((row.issueSize || '').toString().replace(/,/g, ''));
                      const price = parseFloat((row.floorPrice || '').toString().replace(/,/g, ''));

                      if (!isNaN(size) && !isNaN(price)) {
                        const total = (size * price) / 1e7;
                        return `₹${total.toFixed(2)} Cr`;
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
    </div>
  );
}

export default UpcomingEvents;
