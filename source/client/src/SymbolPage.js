import React, { useEffect, useState, useMemo, useCallback} from 'react';
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
  Tooltip,
  ReferenceDot,     // ← add
  ReferenceLine     // ← optional
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

const PriceChart = React.memo(function PriceChart({
  chartData,
  isMobile,
  margin,
  xTicks,
  volumeTicks,
  priceTicks,
  yMin,
  yMax,
  decimalPoints,
  tickPrefix,
  newsData,
  onDotClick,
  getCloseByDate,
  activeDotKey,   // 👈 new
  eventKey,       // 👈 new
}) {

  // Map each event type to a label
  const EVENT_LABELS = {
    news: "N",
    dividend: "D",
    result: "R",
    split: "S",
    // fallback
    default: "•"
  };

  return (
    <div className="-mx-4 sm:mx-0">
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
        <ComposedChart 
        data={chartData} 
        margin={margin} 
        tabIndex={-1} 
        focusable={false}
        >
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="date"
            ticks={isMobile ? xTicks.filter((_, i) => i % 2 === 0) : xTicks}
            tick={{ fontSize: isMobile ? 8 : 10, fill: "#4f5763" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={{ stroke: "#e5e7eb" }}
          />

          <YAxis
            yAxisId="left"
            orientation="left"
            ticks={volumeTicks}
            tick={{ fontSize: isMobile ? 8 : 10, fill: "#4f5763" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={{ stroke: "#e5e7eb" }}
            vertical={false}
            label={
              !isMobile
                ? { value: "Volume", angle: -90, position: "insideLeft", fill: "#4f5763" }
                : undefined
            }
            tickFormatter={(value) => {
              if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
              if (value >= 1_000) return (value / 1_000).toFixed(0) + "K";
              return value;
            }}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[yMin * 0.98, yMax * 1.02]}
            ticks={priceTicks}
            tick={{ fontSize: isMobile ? 10 : 12, fill: "#4f5763" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={{ stroke: "#e5e7eb" }}
            label={
              !isMobile
                ? { value: "Price", angle: -90, position: "insideRight", fill: "#4f5763" }
                : undefined
            }
            tickFormatter={(value) => value.toFixed(decimalPoints)}
          />

          <Tooltip
            content={({ active, payload }) => {
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

          <Bar yAxisId="left" dataKey="volume" barSize={isMobile ? 10 : 20} fill="#14eba3" />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          {newsData.map((ev) => {
            const match = getCloseByDate(chartData, ev.date);
            if (!match) return null;

            const { date: xDate, close: y } = match;
            const key = eventKey(ev);
            const isActive = key === activeDotKey;

            return (
              <ReferenceDot
                key={key}
                x={xDate}
                y={y}
                yAxisId="right"
                r={12}
                isFront={isActive}
                isAnimationActive={false}
                // keep your click through props on the dot – they'll be passed to shape
                onClick={() =>
                  onDotClick({
                    type: ev.type,
                    date: xDate,
                    text: ev.details,
                    url: ev.url,
                    price: y,
                  })
                }
                // 👇 custom renderer: move both circle + text together
                shape={(props) => {
                  const { cx, cy, onClick } = props; // recharts passes these
                  const offsetY = -10;               // << shift up 10px (tweak as you like)
                  const r = 12;

                  return (
                    <g
                      transform={`translate(${cx}, ${cy + offsetY})`}
                      style={{ cursor: "pointer" }}
                      onClick={onClick}
                    >
                      {/* (Optional) larger invisible hit area so it’s easier to click */}
                      <circle r={20} fill="transparent" style={{ pointerEvents: "all" }} />

                      {/* Visible dot */}
                      <circle
                        r={r}
                        fill={isActive ? "#ef4444" : "#f59e0b"}
                        stroke={isActive ? "#111827" : "white"}
                        strokeWidth={isActive ? 3 : 2}
                      />

                      {/* Center label "N" */}
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={isActive ? 12 : 10}
                        fill="white"
                      >
                        {EVENT_LABELS[ev.type] || EVENT_LABELS.default}
                      </text>
                    </g>
                  );
                }}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

function SymbolPage() {
  const [candles, setCandles] = useState({ close: [], volume: [] });
  const [loading, setLoading] = useState(true);
  const [stockInfo, setStockInfo] = useState(null);
  const [tickPrefix, setTickPrefix] = useState("");
  const [selectedRange, setSelectedRange] = useState('1Y');
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [standaloneData, setStandaloneData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [activeResultsTab, setActiveResultsTab] = useState('consolidated');
  const [isMobile, setIsMobile] = useState(false);
  const [clickedMsg, setClickedMsg] = useState(null);
  const [activeDotKey, setActiveDotKey] = useState(null);

  const { symbol } = useParams();
  let decimalPoints = 2;

  if(symbol.endsWith('USD') && symbol.length === 6)
  {
    decimalPoints = 4;
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/candles/${symbol}`)
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
    axios.get(`${process.env.REACT_APP_API_URL}/api/info/${symbol}`)
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
    axios.get(`${process.env.REACT_APP_API_URL}/api/results/consolidated/${symbol}`)
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
    axios.get(`${process.env.REACT_APP_API_URL}/api/results/standalone/${symbol}`)
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

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/news/${symbol}`)
      .then(res => {
        setNewsData(res.data);
      })
      .catch(err => {
        console.error('Error fetching consolidated data:', err);
        setNewsData([]);
      });
  }, [symbol]);

  // build a unique key for each event (adjust if your data shape differs)
  const eventKey = useCallback((ev) => {
    return `${ev.date}__${ev.type || ""}__${ev.url || ""}`;
  }, []);

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

  // Normalize any incoming date to "YYYY-MM-DD"
  const toYMD = (d) => {
    if (!d) return d;
    // Handle "DD-MM-YYYY"
    if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
      const [DD, MM, YYYY] = d.split('-');
      return `${YYYY}-${MM}-${DD}`;
    }
    // Handle ISO like "2025-08-01T00:00:00Z"
    const dt = new Date(d);
    if (!isNaN(dt)) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return d; // already Y-M-D string
  };

  const getChartData = () => {
    const totalLength = candles.close.length;
    const limit = timeFrames[selectedRange];
    const start = Math.max(0, totalLength - limit);

    return candles.close.slice(start).map((close, i) => ({
      date: toYMD(candles.date?.[start + i]),      // ← normalize to Y-M-D
      close: Number(close),                        // optional: ensure numeric
      volume: candles.volume[start + i] ?? 0
    }));
  };

  // if date fall on saturday or sunday, if will fall to monday
  const getCloseByDate = (data, dateStr) => {
    if (!data?.length) return null;

    const toYMD = (d) => {
      const dt = new Date(d);
      if (isNaN(dt)) return null;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const target = toYMD(dateStr);
    if (!target) return null;

    // exact match
    const exact = data.find(d => d.date === target);
    if (exact) return { date: exact.date, close: exact.close };

    // next available trading day
    const targetTs = new Date(target).getTime();
    const future = data.find(d => new Date(d.date).getTime() > targetTs);
    return future ? { date: future.date, close: future.close } : null;
  };


  // 1) chartData memo
  const chartData = useMemo(() => getChartData(), [candles, selectedRange]);

  // 2) derived ranges memo
  const closePrices = useMemo(() => chartData.map(d => d.close), [chartData]);
  const yMin = useMemo(() => Math.min(...closePrices), [closePrices]);
  const yMax = useMemo(() => Math.max(...closePrices), [closePrices]);

  const volumeData = useMemo(() => chartData.map(d => d.volume), [chartData]);
  const vMin = useMemo(() => Math.min(...volumeData), [volumeData]);
  const vMax = useMemo(() => Math.max(...volumeData), [volumeData]);

  // 3) ticks memo
  const priceTicks = useMemo(
    () => generateTicks(yMin, yMax, 8, decimalPoints),
    [yMin, yMax, decimalPoints]
  );
  const volumeTicks = useMemo(
    () => generateTicks(vMin, vMax, 8),
    [vMin, vMax]
  );
  const xTicks = useMemo(() => {
    const xTickCount = 6;
    const interval = Math.max(1, Math.floor(chartData.length / (xTickCount - 1)));
    const ticks = chartData.filter((_, i) => i % interval === 0).map(d => d.date);
    if (chartData.length > 0 && ticks[ticks.length - 1] !== chartData[chartData.length - 1].date) {
      ticks.push(chartData[chartData.length - 1].date);
    }
    return ticks;
  }, [chartData]);

  // 4) stable margin + click handler
  const chartMargin = useMemo(
    () => ({ top: 20, right: isMobile ? 10 : 50, left: isMobile ? 10 : 50, bottom: 0 }),
    [isMobile]
  );

  // Avoid setting state if the same event is clicked again (prevents useless parent re-renders)
  const handleDotClick = useCallback((msg) => {
    setClickedMsg(prev =>
      prev &&
      prev.type === msg.type &&
      prev.date === msg.date &&
      prev.price === msg.price &&
      prev.url === msg.url &&
      prev.text === msg.text
        ? prev
        : msg
    );
    // mark the dot active
    setActiveDotKey(eventKey(msg)); // msg has date/type/url
  }, [eventKey]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!candles.close || candles.close.length === 0) return <div className="p-4">No data available</div>;

  return (
    <div className="p-1 mb-10 overscroll-y-contain overflow-x-hidden touch-pan-y">
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
              {stockInfo.quoteType == "EQUITY" && (
              <div className="text-sm text-gray-800 flex flex-wrap gap-x-6 gap-y-2 mb-2">
                <span>
                  <span className="text-gray-500">NSE:</span>{' '}
                  {symbol}
                </span>

                <span>
                  <span className="text-gray-500">Market Cap:</span>{' '}
                  {isNaN(parseFloat(stockInfo.marketCap))
                    ? '—'
                    : `₹${(parseFloat(stockInfo.marketCap) / 1e7).toFixed(2)} Cr`}
                </span>

                <span>
                  <span className="text-gray-500">PE:</span>{' '}
                  {isNaN(parseFloat(stockInfo.trailingPE))
                    ? '—'
                    : parseFloat(stockInfo.trailingPE).toFixed(2)}
                </span>

                <span>
                  <span className="text-gray-500">ROE:</span>{' '}
                  {stockInfo.returnOnEquity
                    ? `${(stockInfo.returnOnEquity * 100).toFixed(2)}%`
                    : '—'}
                </span>
              </div>
              )}

              {/* Row 3: Website Link */}
              {stockInfo.quoteType == "EQUITY" && (
              <div className="text-base text-gray-800 mb-1 flex flex-wrap gap-3">
                {stockInfo.website && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">🔗</span>
                    <a
                      href={
                        stockInfo.website.startsWith('http')
                          ? stockInfo.website
                          : `https://${stockInfo.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-all"
                    >
                      {stockInfo.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <span className="text-gray-600">🔗</span>
                  <a
                    href={`https://www.screener.in/company/${symbol}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all"
                  >
                    screener.in
                  </a>
                </div>
              </div>
              )}

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

      {/* Sticky message box above the chart */}
      <div className="mb-2">   {/* 👈 reserve ~80px */}
        {clickedMsg ? (
          <div className="w-full max-w-full md:max-w-3xl px-3 py-2 border rounded-lg bg-white shadow-sm text-sm">
            {/* Row 1: type + meta */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              {/* Type chip */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {clickedMsg.type}
              </span>

              {/* Date */}
              <span className="font-mono text-gray-700">
                {clickedMsg.date}
              </span>

              {/* Price */}
              <span className="font-mono text-gray-900">
                {tickPrefix}{Number(clickedMsg.price).toFixed(decimalPoints)}
              </span>
            </div>

            {/* Row 2: details (wraps + scrolls if very long) */}
            <p className="text-gray-700 whitespace-pre-wrap break-words max-h-28 overflow-auto">
              {clickedMsg.text}
            </p>

            {/* Row 3: link (breaks on small screens) */}
            {clickedMsg.url && (
              <a
                href={clickedMsg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-blue-600 underline break-all"
              >
                Read source
              </a>
            )}
          </div>
        ) : (
          <div className="inline-flex items-start gap-2 sm:gap-3 px-3 py-2 border rounded bg-white shadow-sm text-sm">
            💡 Tip: tap a marker on the chart to show event details.
          </div>
        )}
      </div>


      {/* Stock Chart */}
      <PriceChart
        chartData={chartData}
        isMobile={isMobile}
        margin={chartMargin}
        xTicks={xTicks}
        volumeTicks={volumeTicks}
        priceTicks={priceTicks}
        yMin={yMin}
        yMax={yMax}
        decimalPoints={decimalPoints}
        tickPrefix={tickPrefix}
        newsData={newsData}
        onDotClick={handleDotClick}
        getCloseByDate={getCloseByDate}
        activeDotKey={activeDotKey}   // 👈
        eventKey={eventKey}           // 👈
      />

      <div>
        <h4 className="text-lg font-semibold">
          Financial Results
          <span className="text-sm text-gray-400 font-normal ml-2">(Rs. Crores)</span>
        </h4>
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
      </div>

      {(consolidatedData.length > 0 || standaloneData.length > 0) ? (
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-300 mb-4">
          {/* Table */}
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 sticky left-0 bg-gray-100 z-10"></th>
                {(activeResultsTab === 'consolidated' ? consolidatedData : standaloneData).map((row, idx) => (
                  <th
                    key={idx}
                    className="border px-2 py-1 whitespace-nowrap text-right"
                  >
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
              ].map((metric, rowIdx) => {
                const isEven = rowIdx % 2 === 0;
                const rowBg = isEven ? 'bg-white' : 'bg-gray-200';

                return (
                  <tr key={metric} className={rowBg}>
                    <td
                      className={`border px-2 py-1 font-medium sticky left-0 z-10 ${rowBg}`}
                    >
                      {metric}
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 text-gray-500 italic text-sm mb-4">
          No financial data available
        </div>
      )}

    { stockInfo && 
    <div className="flex flex-col md:flex-row gap-4">
      {/* Positive List */}
      <div className="flex-1">
        <h3 className="font-semibold text-green-600 mb-2">Positive Impacts</h3>
        {stockInfo.positiveImpacts && stockInfo.positiveImpacts.length > 5 && stockInfo.positiveImpacts.trim() !== "" ? (
          <ul className="list-disc list-inside text-sm">
            {stockInfo.positiveImpacts.split("*").map((item, idx) => (
              <li key={idx}>{item.trim()}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm italic">No positive impacts available</p>
        )}
      </div>

      {/* Negative List */}
      <div className="flex-1">
        <h3 className="font-semibold text-red-600 mb-2">Negative Impacts</h3>
        {stockInfo.negativeImpacts && stockInfo.negativeImpacts.length > 5 && stockInfo.negativeImpacts.trim() !== "" ? (
          <ul className="list-disc list-inside text-sm">
            {stockInfo.negativeImpacts.split("/").map((item, idx) => (
              <li key={idx}>{item.trim()}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm italic">No negative impacts available</p>
        )}
      </div>
    </div>}


    </div>
  );
}

export default SymbolPage;
