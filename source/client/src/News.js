import React from 'react';

const linksData = [
  {
    category: 'Market News',
    links: [
      { name: 'iinvest', url: 'https://iinvest.cogencis.com/news' },
      { name: 'Zerodha Pulse', url: 'https://pulse.zerodha.com/' },
      { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/' },
      { name: 'CNBC TV18', url: 'https://www.cnbctv18.com/market/' },
      { name: 'Business Standard', url: 'https://www.business-standard.com/markets' },
      { name: 'Moneycontrol', url: 'https://www.moneycontrol.com/news/' },
      { name: 'Trendlyne Results', url: 'https://trendlyne.com/dashboard/results/industry/' },
    ],
  },
  {
    category: 'Global News',
    links: [
    { name: 'BBC World News', url: 'https://www.bbc.com/news/world' },
    { name: 'Reuters World News', url: 'https://www.reuters.com/news/world' },
    { name: 'CNBC World', url: 'https://www.cnbc.com/world/' },
    { name: 'Forbes', url: 'https://www.forbes.com/business/' },
    { name: 'Fortune', url: 'https://fortune.com/' },
    { name: 'The Wall Street Journal - World', url: 'https://www.wsj.com/news/world' },
    ],
  },
  {
    category: 'Magazines',
    links: [
      { name: 'Smart Investment', url: 'https://smartinvestment.in/' },
      { name: 'Dalal Street', url: 'https://www.dsij.in/' },
      { name: 'Capital Market', url: 'https://www.capitalmarket.com/news' },
    ],
  },
  {
    category: 'Forums',
    links: [
      { name: 'Value Pickr', url: 'https://forum.valuepickr.com/' },
      { name: 'Trading QnA', url: 'https://tradingqna.com/c/stocks/13' },
      { name: 'Reddit: IndianStreetBets', url: 'https://www.reddit.com/r/IndianStreetBets/' },
      { name: 'Reddit: IndiaInvestments', url: 'https://www.reddit.com/r/IndiaInvestments/' },
    ],
  },
  {
    category: 'Broker Reports',
    links: [
      { name: 'Dalal Street', url: 'https://www.dsij.in/markets/reports/broker-reports' },
      { name: 'Trendlyne Upgrade', url: 'https://trendlyne.com/research-reports/recent-upgrades/' },
      { name: 'Trendlyne Downgrade', url: 'https://trendlyne.com/research-reports/recent-downgrades/' },
      { name: 'Moneycontrol List', url: 'https://www.moneycontrol.com/markets/stock-ideas/?classic=true' },
      { name: 'Moneycontrol Daily Report', url: 'https://www.moneycontrol.com/markets/brokerage-view.php?c=4' },
    ],
  },
  {
    category: 'Channels',
    links: [
      { name: 'Groww', url: 'https://www.youtube.com/@GrowwOfficial' },
      { name: 'ET NOW', url: 'https://www.youtube.com/@ETNOW' },
      { name: 'CNBC-TV18', url: 'https://www.youtube.com/@cnbctv18india' },
      { name: 'Moneycontrol', url: 'https://www.youtube.com/@moneycontrol' },
      { name: 'Markets By Zerodha', url: 'https://www.youtube.com/@marketsbyzerodha' },
      { name: 'Upstox', url: 'https://www.youtube.com/@UpstoxOfficial' },
      { name: 'FinnovationZ by Prasad', url: 'https://www.youtube.com/@namaskarprasad' },
      { name: 'CA Rachana Phadke Ranade', url: 'https://www.youtube.com/@CARachanaRanade' },
      { name: 'Sahil Bhadviya', url: 'https://www.youtube.com/@SahilBhadviya' },
      
    ],
  },
];

function News() {
  return (
    <div className="p-4 mb-6">
      <h2 className="text-2xl font-bold mb-4">News & Resources</h2>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table-auto border-collapse w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              {linksData.map((section, idx) => (
                <th key={idx} className="p-2 border text-left">{section.category}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({
              length: Math.max(...linksData.map((s) => s.links.length)),
            }).map((_, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {linksData.map((section, colIdx) => (
                  <td key={colIdx} className="p-2 border">
                    {section.links[rowIdx] ? (
                      <a
                        href={section.links[rowIdx].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {section.links[rowIdx].name}
                      </a>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card/list view */}
      <div className="md:hidden space-y-6">
        {linksData.map((section, idx) => (
          <div key={idx} className="border rounded-lg shadow-sm p-4 bg-white">
            <h3 className="text-lg font-semibold mb-3">{section.category}</h3>
            <ul className="space-y-2">
              {section.links.map((link, linkIdx) => (
                <li key={linkIdx}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default News;
