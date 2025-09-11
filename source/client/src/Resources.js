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
    category: 'Startup News',
    links: [
    { name: 'ycombinator news', url: 'https://news.ycombinator.com/' },
    { name: 'Tech Crunch', url: 'https://techcrunch.com/latest/' },
    { name: 'Tech in Asia', url: 'https://www.techinasia.com/' },
    { name: 'VentureBeat', url: 'https://venturebeat.com/' },
    { name: 'Business Insider', url: 'https://www.businessinsider.com/seed-100-best-early-stage-vc-investors-2025-5?utm_source=chatgpt.com' },
    { name: 'thestartupboard', url: 'https://www.thestartupboard.com/blog/10-best-websites-to-find-angel-investors-for-startups?utm_source=chatgpt.com' },
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
      { name: 'Reddit: IndianStocks', url: 'https://www.reddit.com/r/IndianStocks/' },
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
    category: 'YT Channels',
    links: [
      { name: 'Groww', url: 'https://www.youtube.com/@GrowwOfficial' },
      { name: 'ET NOW', url: 'https://www.youtube.com/@ETNOW' },
      { name: 'CNBC-TV18', url: 'https://www.youtube.com/@cnbctv18india' },
      { name: 'Moneycontrol', url: 'https://www.youtube.com/@moneycontrol' },
      { name: 'Markets By Zerodha', url: 'https://www.youtube.com/@marketsbyzerodha' },
      { name: 'Upstox', url: 'https://www.youtube.com/@UpstoxOfficial' },
      { name: 'FinnovationZ', url: 'https://www.youtube.com/@namaskarprasad' },
      { name: 'CA Rachana Ranade', url: 'https://www.youtube.com/@CARachanaRanade' },
      { name: 'Sahil Bhadviya', url: 'https://www.youtube.com/@SahilBhadviya' },
      
    ],
  },
  {
    category: 'Scanners',
    links: [
      { name: 'Volume Pump', url: 'https://trendlyne.com/stock-screeners/volume-based/high-volume-stocks/top-gainers/today/' },
      { name: 'Below IPO price', url: 'https://www.screener.in/ipo/below-price/' },
      { name: 'IPO listing Returns', url: 'https://groww.in/ipo/closed' },
      { name: 'NSE Mood Index', url: 'https://www.tickertape.in/market-mood-index?ref=homepage_mmi_section' },
      { name: 'Crypto Mood Index', url: 'https://coinmarketcap.com/charts/fear-and-greed-index/' },
    ],
  },
];

function Resources() {
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

export default Resources;
