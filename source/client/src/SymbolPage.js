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
  const [selectedRange, setSelectedRange] = useState('1Y');
  const { symbol } = useParams();

  useEffect(() => {
    axios.get(`http://localhost:5000/api_2/candles/${symbol}`)
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
  const priceTicks = generateTicks(yMin, yMax, 8, 2);   // Two decimals for price
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
    <div className="p-4">
      <h3 className="text-2xl font-bold mb-4">{symbol}</h3>

      {/* Timeline Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        {Object.keys(timeFrames).map((range) => {
          const isActive = selectedRange === range;

          return (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
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
            tickFormatter={(value) => value.toFixed(2)}
          />

        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const { date, close, volume } = payload[0].payload;
              return (
                <div className="bg-white p-2 border rounded shadow text-sm">
                  <div>{date}</div>
                  <div>₹{close.toFixed(2)}</div>
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


    </div>
  );
}

export default SymbolPage;
