import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UpcomingEvents() {
  const [eventsData, setEventsData] = useState([]);
  const [upcomingIssuesData, setUpcomingIssuesData] = useState([]);
  const [forthcomingListingData, setForthcomingListingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events'); // 🔹 tracks which tab is active

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
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Company</th>
                  <th className="p-2 text-left">Purpose</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {eventsData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 py-4">
                      No recent events found.
                    </td>
                  </tr>
                ) : (
                  eventsData.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-2">{row.symbol || '—'}</td>
                      <td className="p-2">{row.company || '—'}</td>
                      <td className="p-2">{row.purpose || '—'}</td>
                      <td className="p-2">{formatDate(row.date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* 🔹 Upcoming Issues */}
      {activeTab === 'upcomingIssues' && (
        <>
          <h1 className="text-xl font-bold mb-4">Upcoming Issues</h1>
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
              {upcomingIssuesData.map((item, idx) => (
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
          <h1 className="text-xl font-bold mb-4">Forthcoming Listings</h1>
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
              {forthcomingListingData.map((item, idx) => (
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
