import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const timeFrames = {
  '1M': 22,
  '6M': 132,
  '1Y': 252,
  '3Y': 252 * 3,
  '5Y': 252 * 5,
  '10Y': 252 * 10,
  'Max': Infinity
};

function SymbolPage() {
  const [candles, setCandles] = useState({ close: [], volume: [] });
  const [loading, setLoading] = useState(true);
  const [stockInfo, setStockInfo] = useState(null);
  const [tickPrefix, setTickPrefix] = useState("");
  const [selectedRange, setSelectedRange] = useState('1Y');
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [standaloneData, setStandaloneData] = useState([]);
  const [activeResultsTab, setActiveResultsTab] = useState('consolidated');
  const { symbol } = useParams();
  let decimalPoints = 2;

  if(symbol.endsWith('USD') && symbol.length === 6)
  {
    decimalPoints = 4;
  }

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api_2/candles/${symbol}`)
      .then(res => {
        setCandles(res.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data', error);
        setLoading(false);
      });

      if (symbol) {
        document.title = `${symbol} | Scan360`;
      }
      return () => {
        document.title = "Scan360"; // Optional cleanup
      };
  }, [symbol]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api_2/info/${symbol}`)
      .then(res => {
        setStockInfo(res.data)
        const quoteType = res.data.quoteType;
        if (quoteType === 'USD') {
          setTickPrefix("$");
        } else if (quoteType === 'WORLD_INDEX') {
          setTickPrefix("");
        } else {
          setTickPrefix("₹");
        }
      })
      .catch(err => {
        console.error('Error fetching stock info:', err);
        setStockInfo(null);
      });

  }, [symbol]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api_2/results/consolidated/${symbol}`)
      .then(res => {
        const sortedData = res.data.sort((a, b) => new Date(a.toDate) - new Date(b.toDate));
        setConsolidatedData(sortedData);
      })
      .catch(err => {
        console.error('Error fetching consolidated data:', err);
        setConsolidatedData([]);
      });
  }, [symbol]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api_2/results/standalone/${symbol}`)
      .then(res => {
        const sortedData = res.data.sort((a, b) => new Date(a.toDate) - new Date(b.toDate));
        setStandaloneData(sortedData);
      })
      .catch(err => {
        console.error('Error fetching consolidated data:', err);
        setStandaloneData([]);
      });
  }, [symbol]);

  useEffect(() => {
    if (consolidatedData.length === 0 && standaloneData.length > 0) {
      setActiveResultsTab('standalone');
    }
  }, [consolidatedData, standaloneData]);


  // Utility function to generate N ticks between min and max
  const generateTicks = (min, max, count, toFixed = null) => {
    if (min === max) {
      // Prevent division by zero; add ±1 step around flat value
      return Array.from({ length: count }, (_, i) => min + (i - Math.floor(count / 2)));
    }

    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, i) => {
      const val = min + i * step;
      return toFixed !== null ? Number(val.toFixed(toFixed)) : Math.round(val);
    });
  };

  const getChartData = () => {
    const totalLength = candles.close.length;
    const limit = timeFrames[selectedRange];
    const start = Math.max(0, totalLength - limit);

    return candles.close.slice(start).map((close, i) => ({
      date: candles.date[start + i],               // ✅ Add date here
      close: Number(close),                        // optional: ensure numeric
      volume: candles.volume[start + i] ?? 0
    }));
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!candles.close || candles.close.length === 0) return <div className="p-4">No data available</div>;

  const chartData = getChartData();
  const closePrices = chartData.map(d => d.close);
  const yMin = Math.min(...closePrices);
  const yMax = Math.max(...closePrices);

  // Generate ticks
  const priceTicks = generateTicks(yMin, yMax, 8, decimalPoints);   // Two decimals for price
  const volumeData = chartData.map(d => d.volume);
  const vMin = Math.min(...volumeData);
  const vMax = Math.max(...volumeData);
  const volumeTicks = generateTicks(vMin, vMax, 8);     // Rounded integers for volume

  // X ticks 
  const xTickCount = 6;
  const xTickInterval = Math.max(1, Math.floor(chartData.length / (xTickCount - 1)));
  const xTicks = chartData
    .filter((_, i) => i % xTickInterval === 0)
    .map(d => d.date);

  // Ensure the last date is included
  if (chartData.length > 0 && xTicks[xTicks.length - 1] !== chartData[chartData.length - 1].date) {
    xTicks.push(chartData[chartData.length - 1].date);
  }

  return (
    <div className="p-1 mb-10">
      <div>
        {stockInfo && (
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">

            {/* Left Column — 1/4 width */}
            <div className="flex-[1]">
              {/* Row 1: Name, Price, % Change */}
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h3 className="text-2xl font-bold">{stockInfo.longName}</h3>
                <span className="text-base">
                  {tickPrefix}{parseFloat(stockInfo.currentPrice).toFixed(decimalPoints)}
                </span>
                {stockInfo.currentPrice && stockInfo.previousClose && (() => {
                  const curr = parseFloat(stockInfo.currentPrice);
                  const prev = parseFloat(stockInfo.previousClose);
                  if (!isNaN(curr) && !isNaN(prev) && prev !== 0) {
                    const percentChange = ((curr - prev) / prev) * 100;
                    const isPositive = percentChange >= 0;
                    const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
                    return (
                      <span className={`text-sm font-semibold ${changeColor}`}>
                        {`${isPositive ? '+' : ''}${percentChange.toFixed(2)}%`}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Row 2: Market Cap, ROE, PE */}
              <div className="text-sm text-gray-800 flex flex-wrap gap-x-6 gap-y-2 mb-2">
                <span>
                  <span className="text-gray-500">NSE:</span>{' '}
                  {symbol}
                </span>

                <span>
                  <span className="text-gray-500">ROE:</span>{' '}
                  {stockInfo.returnOnEquity
                    ? `${(stockInfo.returnOnEquity * 100).toFixed(2)}%`
                    : '—'}
                </span>

                <span>
                  <span className="text-gray-500">PE:</span>{' '}
                  {isNaN(parseFloat(stockInfo.trailingPE))
                    ? '—'
                    : parseFloat(stockInfo.trailingPE).toFixed(2)}
                </span>

                <span>
                  <span className="text-gray-500">Market Cap:</span>{' '}
                  {isNaN(parseFloat(stockInfo.marketCap))
                    ? '—'
                    : `₹${(parseFloat(stockInfo.marketCap) / 1e7).toFixed(2)} Cr`}
                </span>
              </div>

              {/* Row 3: Website Link */}
              <div className="text-base text-gray-800 mb-1">
                {stockInfo.website && (
                  <a
                    href={stockInfo.website.startsWith('http') ? stockInfo.website : `https://${stockInfo.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all mr-3"
                  >
                    {stockInfo.website.replace(/^https?:\/\//, '')}
                  </a>
                )}

                <a
                  href={`https://www.screener.in/company/${symbol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-all mr-3"
                >
                  screener.in
                </a>
              </div>

            </div>

            {/* Right Column — 3/4 width */}
            {stockInfo.longBusinessSummary && (
              <div className="flex-[1]">
                <h4 className="text-base font-semibold mb-1">About</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {(() => {
                  const summary = stockInfo.longBusinessSummary;
                  const first200 = summary.slice(0, 300);
                  const lastPeriodIdx = first200.lastIndexOf(".");
                  
                  // If a period is found, cut up to and include it
                  if (lastPeriodIdx !== -1) {
                    return first200.slice(0, lastPeriodIdx + 1);
                  }

                  // Fallback: if no period in first 200 chars, return entire first sentence
                  const firstSentenceEnd = summary.indexOf(".");
                  return firstSentenceEnd !== -1 ? summary.slice(0, firstSentenceEnd + 1) : summary;
                })()}
              </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline Buttons */}
      <div className="mt-6 mb-1 flex flex-wrap gap-3">
        {Object.keys(timeFrames).map((range) => {
          const isActive = selectedRange === range;

          return (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-all duration-200 border
                ${isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow ring-2 ring-blue-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'}
              `}
            >
              {range}
            </button>
          );
        })}
      </div>

      {/* Combined Price + Volume Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 50, left: 50, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tick={{ fontSize: 10 }}
            textAnchor="middle"
          />

          {/* Volume Axis (left) */}
          <YAxis
            yAxisId="left"
            orientation="left"
            ticks={volumeTicks}
            tick={{ fontSize: 10 }}
            label={{ value: "Volume", angle: -90, position: "insideLeft" }}
            tickFormatter={(value) => {
              if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
              if (value >= 1_000) return (value / 1_000).toFixed(0) + 'K';
              return value;
            }}
          />

          {/* Price Axis (right) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[yMin * 0.98, yMax * 1.02]}
            ticks={priceTicks}
            tick={{ fontSize: 12 }}
            label={{ value: "Price", angle: -90, position: "insideRight" }}
            tickFormatter={(value) => value.toFixed(decimalPoints)}
          />

        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const { date, close, volume } = payload[0].payload;
              return (
                <div className="bg-white p-2 border rounded shadow text-sm">
                  <div>{date}</div>
                  <div>{tickPrefix}{close.toFixed(decimalPoints)}</div>
                  <div><strong>Vol:</strong> {volume.toLocaleString()}</div>
                </div>
              );
            }
            return null;
          }}
        />

          {/* Volume Bars */}
          <Bar
            yAxisId="left"
            dataKey="volume"
            barSize={20}
            fill="#14eba3"
          />

          {/* Price Line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {(consolidatedData.length > 0 || standaloneData.length > 0) ? (
        <div className="mt-8 overflow-x-auto rounded-lg border border-gray-300">
          <h4 className="text-lg font-semibold">Financial Results</h4>
          <span className="text-gray-400">Figures in Rs. Crores</span>

          {/* Tab buttons */}
          {consolidatedData.length > 0 && standaloneData.length > 0 && (
            <div className="my-2 flex gap-2">
              <button
                onClick={() => setActiveResultsTab('consolidated')}
                className={`px-3 py-1 text-sm rounded border ${activeResultsTab === 'consolidated' ? 'bg-blue-200 font-semibold' : 'bg-gray-100'}`}
              >
                Consolidated
              </button>
              <button
                onClick={() => setActiveResultsTab('standalone')}
                className={`px-3 py-1 text-sm rounded border ${activeResultsTab === 'standalone' ? 'bg-blue-200 font-semibold' : 'bg-gray-100'}`}
              >
                Standalone
              </button>
            </div>
          )}

          {/* Table */}
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1"></th>
                {(activeResultsTab === 'consolidated' ? consolidatedData : standaloneData).map((row, idx) => (
                  <th key={idx} className="border px-2 py-1 whitespace-nowrap text-right">
                    {row.toDate}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                "Sales", "OperatingProfit", "OPM", "OtherIncome",
                "Interest", "Depreciation", "ProfitBeforeTax",
                "NetProfit", "EPS"
              ].map((metric, rowIdx) => (
                <tr
                  key={metric}
                  className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-200'}
                >
                  <td className="border px-2 py-1 font-medium">{metric}</td>
                  {(activeResultsTab === 'consolidated' ? consolidatedData : standaloneData).map((row, idx) => {
                    const value = row[metric];
                    const formattedValue =
                      value !== undefined
                        ? metric === "OPM"
                          ? `${parseFloat(value).toFixed(1)}%`
                          : parseFloat(value).toLocaleString()
                        : '—';

                    return (
                      <td key={idx} className="border px-2 py-1 text-right">
                        {formattedValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 text-gray-500 italic text-sm">No financial data available</div>
      )}

    </div>
  );
}

export default SymbolPage;
