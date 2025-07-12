import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FundRaise() {
  const [rightsData, setRightsData] = useState([]);
  const [qipData, setQipData] = useState([]);
  const [prefData, setPrefData] = useState([]);
  const [schemeData, setSchemeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rightsFilings');

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

  return (
    <div className="p-4">
      {/* 🔹 Tabs */}
      <div className="flex border-b mb-4 gap-x-6 ml-1">
        {['rightsFilings', 'qipFilings', 'prefIssue', 'schemeOfArrangement'].map(tab => (
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

      {/* 🔹 Rights Filings */}
      {activeTab === 'rightsFilings' && (
        <>
          {loading ? (
            <div className="text-center text-blue-600">Loading...</div>
          ) : (
            <table className="table-auto border-collapse w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Company</th>
                  <th className="p-2 text-left">Draft Date</th>
                </tr>
              </thead>
              <tbody>
                {rightsData.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="p-2">{row.company || '—'}</td>
                    <td className="p-2">{formatDate(row.draftDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* 🔹 QIP Filings */}
      {activeTab === 'qipFilings' && (
        <>
          <h1 className="text-xl font-bold mb-4">QIP Filings</h1>
          <table className="table-auto border-collapse w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {qipData.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2">{item.company || '—'}</td>
                  <td className="p-2">{formatDate(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 🔹 Preferential Issue */}
      {activeTab === 'prefIssue' && (
        <>
          <h1 className="text-xl font-bold mb-4">Preferential Issues</h1>
          <table className="table-auto border-collapse w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Allotment Date</th>
                <th className="p-2 text-left">Submission Date</th>
              </tr>
            </thead>
            <tbody>
              {prefData.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2">{item.nameOfTheCompany || '—'}</td>
                  <td className="p-2">{formatDate(item.dateOfAllotmentOfShares)}</td>
                  <td className="p-2">{formatDate(item.dateOfSubmission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 🔹 Scheme of Arrangement */}
      {activeTab === 'schemeOfArrangement' && (
        <>
          <h1 className="text-xl font-bold mb-4">Scheme of Arrangement</h1>
          <table className="table-auto border-collapse w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {schemeData.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="p-2">{item.company || '—'}</td>
                  <td className="p-2">{formatDate(item.date)}</td>
                  <td className="p-2">{(item.scheme_details || '-').slice(0, 100)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default FundRaise;
