import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FundRaise() {
  const [rightsData, setRightsData] = useState([]);
  const [qipData, setQipData] = useState([]);
  const [prefData, setPrefData] = useState([]);
  const [schemeData, setSchemeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prefIssue');
  const [sortConfig, setSortConfig] = useState({ key: 'boardResDate', direction: 'desc' });

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/rightsFilings')
      .then(res => {
        setRightsData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch rightsFilings', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/qipFilings')
      .then(res => setQipData(res.data))
      .catch(err => console.error('Failed to fetch qipFilings', err));
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/prefIssue')
      .then(res => setPrefData(res.data))
      .catch(err => console.error('Failed to fetch prefIssue', err));
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api_2/schemeOfArrangement')
      .then(res => setSchemeData(res.data))
      .catch(err => console.error('Failed to fetch schemeOfArrangement', err));
  }, []);

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

  const enrichedData = prefData.map(row => {
    const curr = parseFloat(row.currentPrice);
    const prev = parseFloat(row.previousClose);
    const change = !isNaN(curr) && !isNaN(prev) && prev !== 0
      ? ((curr - prev) / prev) * 100
      : null;

    return { ...row, change };
  });

  const sortedPrefData = [...enrichedData].sort((a, b) => {
    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;

    if (key === 'change') {
      const valA = isNaN(a.change) ? -Infinity : a.change;
      const valB = isNaN(b.change) ? -Infinity : b.change;
      return dir * (valA - valB);
    }

    const dateA = new Date(a.boardResDate);
    const dateB = new Date(b.boardResDate);
    return dir * (dateB - dateA);
  });

  const sortedRightsData = [...rightsData].sort((a, b) => {
    const dateA = new Date(a.draftDate);
    const dateB = new Date(b.draftDate);
    return dateB - dateA;
  });

  const sortedQipData = [...qipData].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });

  const sortedSchemeData = [...schemeData].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });

  return (
    <div className="p-4 mb-4">
      {/* 🔹 Tabs */}
      <div className="flex border-b mb-4 gap-x-6 ml-1">
        {['prefIssue', 'qipFilings', 'schemeOfArrangement', 'rightsFilings'].map(tab => (
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
            {tab === 'rightsFilings' ? 'Rights Filings' :
             tab === 'qipFilings' ? 'QIP Filings' :
             tab === 'prefIssue' ? 'Preferential Issues' :
             'Scheme of Arrangement'}
          </a>
        ))}
      </div>

      {/* 🔹 Preferential Issue */}
      {activeTab === 'prefIssue' && (
        <>
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Symbol</th>
                <th className="p-2 text-left">Company</th>
                {renderSortableHeader('Change', 'change')}
                <th className="p-2 text-left">Allotment Date</th>
                {renderSortableHeader('Board Resolution Date', 'boardResDate')}
                <th className="p-2 text-left">Offer Price</th>
                <th className="p-2 text-left">Amount Raised</th>
                <th className="p-2 text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {sortedPrefData.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
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
                  <td className="p-2">{row.nameOfTheCompany || '—'}</td>
                  <td className="p-2">
                    {getChange(row.currentPrice, row.previousClose)}
                  </td>
                  <td className="p-2">{formatDate(row.dateOfAllotmentOfShares)}</td>
                  <td className="p-2">{formatDate(row.boardResDate)}</td>
                  <td className="p-2">{row.offerPricePerSecurity}</td>
                  <td className="p-2">
                    {row.amountRaised
                      ? `₹${(parseFloat(row.amountRaised) / 1e7).toFixed(2)} Cr`
                      : '—'}
                  </td>
                  <td className="p-2">
                    {row.xmlFileName ? (
                      <a
                        href={row.xmlFileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View File
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

      {/* 🔹 QIP Filings */}
      {activeTab === 'qipFilings' && (
        <>
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {sortedQipData.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2">{row.company || '—'}</td>
                  <td className="p-2">{formatDate(row.date)}</td>
                  <td className="p-2">
                    {row.attachFile ? (
                      <a
                        href={row.attachFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View File
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

      {/* 🔹 Scheme of Arrangement */}
      {activeTab === 'schemeOfArrangement' && (
        <>
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Details</th>
                <th className="p-3 text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {sortedSchemeData.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2">{row.company || '—'}</td>
                  <td className="p-2">{formatDate(row.date)}</td>
                  <td className="p-2">{(row.scheme_details || '-')}</td>
                  <td className="p-3">
                    {row.date_attachmnt ? (
                      <a
                        href={row.date_attachmnt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View File
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

      {/* 🔹 Rights Filings */}
      {activeTab === 'rightsFilings' && (
        <>
          {loading ? (
            <div className="text-center text-blue-600">Loading...</div>
          ) : (
            <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Company</th>
                  <th className="p-2 text-left">Draft Date</th>
                  <th className="p-2 text-left">Attachment</th>
                </tr>
              </thead>
              <tbody>
                {sortedRightsData.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="p-2">{row.company || '—'}</td>
                    <td className="p-2">{formatDate(row.draftDate)}</td>
                    <td className="p-2">
                      {row.draftAttch ? (
                        <a
                          href={row.draftAttch}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          View Draft
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default FundRaise;
