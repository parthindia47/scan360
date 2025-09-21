import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FundRaise() {
  const [rightsData, setRightsData] = useState([]);
  const [qipData, setQipData] = useState([]);
  const [prefData, setPrefData] = useState([]);
  const [schemeData, setSchemeData] = useState([]);
  const [liveRightsData, setLiveRightsData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prefIssue');

  const [sortConfigs, setSortConfigs] = useState({
    prefIssue: { key: 'systemDate', direction: 'desc' },
    qipFilings: { key: 'date', direction: 'desc' },
    schemeOfArrangement: { key: 'date', direction: 'desc' },
    rightsFilings: { key: 'draftDate', direction: 'desc' },
    liveRights: { key: 'rightEndDate', direction: 'desc' },
  });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/prefIssue`)
      .then(res => { 
        setPrefData(res.data)
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch prefIssue', err)
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/rightsFilings`)
      .then(res => {
        setRightsData(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch rightsFilings', err);
      });
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/qipFilings`)
      .then(res => setQipData(res.data))
      .catch(err => console.error('Failed to fetch qipFilings', err));
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/schemeOfArrangement`)
      .then(res => setSchemeData(res.data))
      .catch(err => console.error('Failed to fetch schemeOfArrangement', err));
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/liveRights`)
      .then(res => setLiveRightsData(res.data))
      .catch(err => console.error('Failed to fetch liveRights', err));
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

  const enrichedPrefData = prefData.map(row => {
    const curr = parseFloat(row.currentPrice);
    const prev = parseFloat(row.previousClose);
    const change = !isNaN(curr) && !isNaN(prev) && prev !== 0
      ? ((curr - prev) / prev) * 100
      : null;

    const amountRaised = parseFloat(row.amountRaised);
    const numericAmountRaised = !isNaN(amountRaised) ? amountRaised : null;

    return { ...row, change, numericAmountRaised };
  });

  const sortedPrefData = [...enrichedPrefData].sort((a, b) => {
    const { key, direction } = sortConfigs.prefIssue;
    const dir = direction === 'asc' ? 1 : -1;

    if (key === 'change') {
        const valA = isNaN(a.change) ? -Infinity : a.change;
        const valB = isNaN(b.change) ? -Infinity : b.change;
        return dir * (valA - valB);
    }

    if (key === 'numericAmountRaised') {
      const valA = typeof a.numericAmountRaised === 'number' ? a.numericAmountRaised : -Infinity;
      const valB = typeof b.numericAmountRaised === 'number' ? b.numericAmountRaised : -Infinity;
      return dir * (valA - valB);
    }

    // default to systemDate
    const dateA = new Date(a.systemDate);
    const dateB = new Date(b.systemDate);
    return dir * (dateA - dateB);
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

  const sortedLiveRightsData = [...liveRightsData].sort((a, b) => {
    const { key, direction } = sortConfigs.liveRights;
    const dir = direction === 'asc' ? 1 : -1;

    // default to systemDate
    const dateA = new Date(a.rightEndDate);
    const dateB = new Date(b.rightEndDate);
    return dir * (dateA - dateB);
  });

  return (
    <div className="p-4 mb-4">
      {/* 🔹 Tabs */}
      <div className="flex flex-wrap gap-3 border-b mb-4 ml-1">
        {['prefIssue', 'liveRights', 'qipFilings', 'rightsFilings', 'schemeOfArrangement'].map(tab => (
          <a
            key={tab}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(tab);
            }}
            className={`pb-2 px-2 text-sm font-medium transition duration-150 ease-in-out border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300'
            }`}
          >
            {
            tab === 'prefIssue' ?     'Preferential Issues' :
            tab === 'liveRights' ?    'Rights Issues' :
            tab === 'qipFilings' ?    'QIP Filings' :
            tab === 'rightsFilings' ? 'Rights Filings' :
            'Scheme of Arrangement'
            }
          </a>
        ))}
      </div>

      {/* 🔹 Preferential Issue */}
      {activeTab === 'prefIssue' && (
        <>
          {loading ? (
            <div className="text-center text-blue-600">Loading...</div>
          ) : (
          <div className="overflow-x-auto">
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200 text-left sticky top-0 z-40">
              <tr>
                <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                {renderSortableHeader('Change', 'change', 'prefIssue')}
                <th className="p-2 text-left">Allotment Date</th>
                {renderSortableHeader('System Date', 'systemDate', 'prefIssue')}
                <th className="p-2 text-left">Offer Price</th>
                {renderSortableHeader('Amount Raised', 'numericAmountRaised', 'prefIssue')}
                <th className="p-2 text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {sortedPrefData.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                  <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">
                    <a
                      href={`symbol/${row.symbol}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {row.nameOfTheCompany || '—'}
                    </a>
                  </td>
                  <td className="p-2">
                    {getChange(row.currentPrice, row.previousClose)}
                  </td>
                  <td className="p-2">{formatDate(row.dateOfAllotmentOfShares)}</td>
                  <td className="p-2">{formatDate(row.systemDate)}</td>
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
          </div>
          )}
        </>
      )}

      {/* 🔹 Live Rights */}
      {activeTab === 'liveRights' && (
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
              <thead className="bg-gray-200 text-left sticky top-0 z-40">
                <tr>
                  <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                  <th className="p-2 text-left">Start Date</th>
                  {renderSortableHeader('End Date', 'rightEndDate', 'liveRights')}
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Bid Qty</th>
                  <th className="p-2 text-left">Collected Qty</th>
                </tr>
              </thead>
              <tbody>
                {sortedLiveRightsData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                    <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">
                      <a
                        href={`symbol/${row.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {row.company || '—'}
                      </a>
                    </td>
                    <td className="p-2">{formatDate(row.rightStartDate)}</td>
                    <td className="p-2">{formatDate(row.rightEndDate)}</td>
                    <td className="p-2">{row.status || '—'}</td>
                    <td className="p-2">{row.bidQty || '—'}</td>
                    <td className="p-2">{row.nse_bse_cumu || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}

      {/* 🔹 QIP Filings */}
      {activeTab === 'qipFilings' && (
        <>
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200 text-left sticky top-0 z-40">
              <tr>
                <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {sortedQipData.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                  <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">{row.company || '—'}</td>
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
          </div>
        </>
      )}

      {/* 🔹 Rights Filings */}
      {activeTab === 'rightsFilings' && (
        <>
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
              <thead className="bg-gray-200 text-left sticky top-0 z-40">
                <tr>
                  <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Attachment</th>
                </tr>
              </thead>
              <tbody>
                {sortedRightsData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                    <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">{row.company || '—'}</td>
                    <td className="p-2">{formatDate(row.date)}</td>
                    <td className="p-2">{row.type || '—'}</td>
                    <td className="p-2">
                      {row.attachment ? (
                        <a
                          href={row.attachment}
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
            </div>
        </>
      )}

      {/* 🔹 Scheme of Arrangement */}
      {activeTab === 'schemeOfArrangement' && (
        <>
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse w-full text-sm text-gray-800 font-normal">
            <thead className="bg-gray-200 text-left sticky top-0 z-40">
              <tr>
                <th className="p-2 sticky left-0 bg-gray-200 z-50">Company</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Details</th>
                <th className="p-3 text-left">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {sortedSchemeData.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                  <td className="p-2 sticky left-0 bg-inherit z-10 font-medium">{row.company || '—'}</td>
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
          </div>
        </>
      )}

    </div>
  );
}

export default FundRaise;
