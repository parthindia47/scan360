import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UpcomingEvents() {
  const [eventsData, setEventsData] = useState([]);
  const [upcomingIssuesData, setUpcomingIssuesData] = useState([]);
  const [forthcomingListingData, setForthcomingListingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events'); // 🔹 tracks which tab is active
  const [filtered, setFiltered] = useState(false); // ✅ Missing
  const [marketCapFilter, setMarketCapFilter] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null); // or null if nothing selected
  const [periodFilter, setPeriodFilter] = useState(null); // "today" | "next3days" | null

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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date) ? 'Invalid date' : date.toLocaleDateString('en-IN');
  };

  const filteredData = eventsData.filter((row) => {
    const text = `${row.purpose || ''}`.toLowerCase();
    const marketCap = parseFloat(row.marketCap ?? 0);

    const keywordMatch = selectedKeyword
      ? text.includes(selectedKeyword.toLowerCase())
      : true;

    const marketCapMatch = marketCapFilter
      ? marketCap > 800 * 1e7
      : true;

    const eventDate = new Date(row.date);
    const today = new Date();
    const dateMatch =
      periodFilter === 'today'
        ? eventDate.toDateString() === today.toDateString()
        : periodFilter === 'next3days'
        ? eventDate >= today &&
          eventDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)
        : true;

    return keywordMatch && marketCapMatch && dateMatch;
  });

  const sortedEventsData = [...filteredData].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const sortedUpcomingIssuesData = [...upcomingIssuesData].sort(
    (a, b) => new Date(b.issueEndDate) - new Date(a.issueEndDate)
  );

  const sortedForthcomingListingData = [...forthcomingListingData].sort(
    (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)
  );

  return (
    <div className="p-4">
      {/* 🔹 Navbar Tabs */}
      <div className="flex border-b mb-4 gap-x-6 ml-1">
        {['events', 'upcomingIssues', 'forthcomingListing'].map(tab => (
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
             'Forthcoming Listings'}
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
                {["Financial Results", "Stock Split", "Bonus", "Dividend"].map(keyword => (
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
                {["today", "next3days"].map((label) => (
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
                    {label === 'today' ? 'Today' : 'Next 3 Days'}
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
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Symbol</th>
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
                    <tr key={idx} className="border-t hover:bg-gray-50">
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
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Issue Type</th>
                <th className="p-2 text-left">Opening Date</th>
                <th className="p-2 text-left">Closing Date</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Issue Size</th>
                <th className="p-2 text-left">Issue Price</th>
                <th className="p-2 text-left">Total Size</th>
              </tr>
            </thead>
            <tbody>
              {sortedUpcomingIssuesData.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
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
                <th className="p-2 text-left">Effective Date</th>
                <th className="p-2 text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {sortedForthcomingListingData.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
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
    </div>
  );
}

export default UpcomingEvents;
