import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UpcomingEvents() {
  // 🔹 your original state & effects unchanged
  const [eventsData, setEventsData] = useState([]);
  const [upcomingIssuesData, setUpcomingIssuesData] = useState([]);
  const [forthcomingListingData, setForthcomingListingData] = useState([]);
  const [forthcomingOfsData, setForthcomingOfsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [marketCapFilter, setMarketCapFilter] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [periodFilter, setPeriodFilter] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [sortConfigs, setSortConfigs] = useState({
    events: { key: 'date', direction: 'asc' },
    upcomingIssues: { key: 'date', direction: 'desc' },
    forthcomingListing: { key: 'date', direction: 'asc' },
    forthcomingOfs: { key: 'date', direction: 'asc' },
  });

  // 🔹 API calls unchanged...
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/events`)
      .then(res => { setEventsData(res.data); setLoading(false); })
      .catch(err => { console.error('Failed to fetch events', err); setLoading(false); });
  }, []);

  useEffect(() => { axios.get(`${process.env.REACT_APP_API_URL}/api/upcomingIssues`).then(res => setUpcomingIssuesData(res.data)).catch(console.error); }, []);
  useEffect(() => { axios.get(`${process.env.REACT_APP_API_URL}/api/forthcomingListing`).then(res => setForthcomingListingData(res.data)).catch(console.error); }, []);
  useEffect(() => { axios.get(`${process.env.REACT_APP_API_URL}/api/forthcomingOfs`).then(res => setForthcomingOfsData(res.data)).catch(console.error); }, []);

  // 🔹 Helpers unchanged...
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date) ? 'Invalid date' : date.toLocaleDateString('en-IN');
  };

  const getChange = (curr, prev) => {
    if (isNaN(curr) || isNaN(prev) || prev === 0) return '—';
    const change = ((curr - prev) / prev) * 100;
    const colorClass = change >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={`font-semibold ${colorClass}`}>{change.toFixed(2)}%</span>;
  };

  const renderSortableHeader = (label, columnKey, tabKey) => {
    const config = sortConfigs[tabKey];
    const handleSort = () => {
      setSortConfigs(prev => ({
        ...prev,
        [tabKey]: {
          key: columnKey,
          direction: prev[tabKey].key === columnKey && prev[tabKey].direction === 'asc' ? 'desc' : 'asc',
        },
      }));
    };
    return (
      <th className="p-2 cursor-pointer select-none text-blue-600" onClick={handleSort}>
        {label}{config.key === columnKey ? (config.direction === 'asc' ? ' ↑' : ' ↓') : ''}
      </th>
    );
  };

  const allSeriesOptions = [...new Set(upcomingIssuesData.filter(i => i.series).map(i => i.series))];

  // 🔹 filtering, sorting unchanged...
  const filteredEventsData = eventsData.filter((row) => {
    const text = `${row.purpose || ''}`.toLowerCase();
    const marketCap = parseFloat(row.marketCap ?? 0);
    const keywordMatch = selectedKeyword ? text.includes(selectedKeyword.toLowerCase()) : true;
    const marketCapMatch = marketCapFilter ? marketCap > 800 * 1e7 : true;
    const eventDate = row.date ? new Date(row.date) : null;
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const dateMatch =
      periodFilter === 'today' ? eventDate && eventDate.toDateString() === today.toDateString()
      : periodFilter === 'yesterday' ? eventDate && eventDate.toDateString() === yesterday.toDateString()
      : periodFilter === 'next3days' ? eventDate >= today && eventDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
      : true;
    return keywordMatch && marketCapMatch && dateMatch;
  });

  const enrichedEventsData = filteredEventsData.map(row => {
    const curr = parseFloat(row.currentPrice);
    const prev = parseFloat(row.previousClose);
    const change = !isNaN(curr) && !isNaN(prev) && prev !== 0 ? ((curr - prev) / prev) * 100 : null;
    return { ...row, change };
  });

  const sortedEventsData = [...enrichedEventsData].sort((a, b) => {
    const { key, direction } = sortConfigs.events;
    const dir = direction === 'asc' ? 1 : -1;
    if (key === 'change') return dir * ((isNaN(a.change) ? -Infinity : a.change) - (isNaN(b.change) ? -Infinity : b.change));
    return dir * (new Date(a.date) - new Date(b.date));
  });

  // 🔹 enriched/sorted for other tabs unchanged...

  return (
    <div className="p-4 mb-4">
      {/* 🔹 Navbar Tabs */}
      <div className="flex flex-wrap border-b mb-4 gap-4">
        {['events', 'upcomingIssues', 'forthcomingListing', 'forthcomingOfs'].map(tab => (
          <a
            href="#"
            key={tab}
            onClick={(e) => { e.preventDefault(); setActiveTab(tab); }}
            className={`pb-2 px-3 text-sm font-medium transition border-b-2 ${
              activeTab === tab ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
            }`}
          >
            {tab === 'events' ? 'Events' :
             tab === 'upcomingIssues' ? 'Upcoming Issues' :
             tab === 'forthcomingListing' ? 'Upcoming Listings' :
             'Upcoming OFS'}
          </a>
        ))}
      </div>

      {/* 🔹 Events */}
      {activeTab === 'events' && (
        loading ? <div className="text-center text-blue-600">Loading...</div> : (
          <>
            {/* Filters unchanged */}
            <div className="overflow-x-auto">
              <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
                <thead className="bg-gray-200">
                  <tr>
                    {renderSortableHeader('Date', 'date', 'events')}
                    <th className="p-2 text-left">Symbol</th>
                    {renderSortableHeader('Change', 'change', 'events')}
                    <th className="p-2 text-left">Company</th>
                    <th className="p-2 text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEventsData.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-gray-500 py-4">No matching events found.</td></tr>
                  ) : (
                    sortedEventsData.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                        <td className="p-2">{formatDate(row.date)}</td>
                        <td className="p-2">
                          <a href={`symbol/${row.symbol}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{row.symbol || '—'}</a>
                        </td>
                        <td className="p-2">{getChange(row.currentPrice, row.previousClose)}</td>
                        <td className="p-2">{row.company || '—'}</td>
                        <td className="p-2">{row.purpose || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )
      )}



      {/* 🔹 Repeat same overflow-x-auto & font styles for other tables */}
      {/* ... Keep your other tab JSX exactly same but wrap each <table> in <div className="overflow-x-auto"> */}
    </div>
  );
}

export default UpcomingEvents;
