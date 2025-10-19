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

/**
 * Usage:
 * <NewsFeedTable data={newsFeedData} />
 */
const NewsFeedTable = ({ data = [] }) => {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState(null); // "1D" | "1W" | null
  const [sortDir, setSortDir] = useState("desc");   // "asc" | "desc"

  const siteName = (linkOrHost) => {
    if (!linkOrHost) return "unknown";
    try {
      const host = linkOrHost.includes("://")
        ? new URL(linkOrHost).hostname
        : linkOrHost;
      const cleaned = host.replace(/^www\./i, "");
      return cleaned.split(".")[0] || cleaned;
    } catch {
      const cleaned = String(linkOrHost)
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "");
      return cleaned.split(".")[0] || "unknown";
    }
  };

  const formatDate = (d) => {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d || "");
    return dt.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const sorted = useMemo(() => {
    let items = [...(data || [])];
    if (sortField === "1D") {
      items.sort((a, b) => {
        const ca = parseFloat(a?.change_1D ?? 0);
        const cb = parseFloat(b?.change_1D ?? 0);
        return sortDir === "asc" ? ca - cb : cb - ca;
      });
    } else if (sortField === "1W") {
      items.sort((a, b) => {
        const ca = parseFloat(a?.change_1W ?? 0);
        const cb = parseFloat(b?.change_1W ?? 0);
        return sortDir === "asc" ? ca - cb : cb - ca;
      });
    } else {
      // default sort by published desc
      items.sort((a, b) => {
        const ta = new Date(a?.published || 0).getTime();
        const tb = new Date(b?.published || 0).getTime();
        return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
      });
    }
    return items;
  }, [data, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const pageSlice = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, pageSafe]);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const toggleSort = (field) => {
    if (sortField === field) {
      // toggle direction
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      // new field defaults to desc
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  return (
    <div className="w-full mt-6">
      <h4 className="text-lg font-semibold">News & Stories</h4>

      {/* Top controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <div className="text-sm text-gray-500">
          Showing {pageSlice.length} of {sorted.length} items
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSort("1D")}
            className="px-3 py-1.5 rounded-md border text-sm"
          >
            1D{" "}
            {sortField === "1D" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            onClick={() => toggleSort("1W")}
            className="px-3 py-1.5 rounded-md border text-sm"
          >
            1W{" "}
            {sortField === "1W" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            onClick={goPrev}
            disabled={pageSafe === 1}
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm tabular-nums">
            Page {pageSafe} of {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={pageSafe === totalPages}
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Table wrapper */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <tbody className="divide-y">
            {pageSlice.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-gray-500">
                  No news found.
                </td>
              </tr>
            ) : (
              pageSlice.map((row, idx) => {
                const title = row?.title || "(No title)";
                const link = row?.link || "#";
                const sourceLabel = siteName(row?.source || row?.link || "");
                const published = formatDate(row?.published);

                const change_1D = parseFloat(row?.change_1D ?? null);
                const change_1W = parseFloat(row?.change_1W ?? null);

                const changeText_1D =
                  change_1D != null && !isNaN(change_1D)
                    ? `1D ${change_1D.toFixed(2)}%`
                    : "";

                const changeText_1W =
                  change_1W != null && !isNaN(change_1W)
                    ? `1W ${change_1W.toFixed(2)}%`
                    : "";

                const changeClass_1D =
                  change_1D != null && !isNaN(change_1D)
                    ? change_1D >= 0
                      ? "text-green-600"
                      : "text-red-600"
                    : "text-gray-500";

                const changeClass_1W =
                  change_1W != null && !isNaN(change_1W)
                    ? change_1W >= 0
                      ? "text-green-600"
                      : "text-red-600"
                    : "text-gray-500";

                return (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}
                  >
                    <td className="px-3 py-2">
                      <span className="font-light hover:decoration-solid break-words">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={title}
                        >
                          {title}
                        </a>
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        <a
                          href={row.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {sourceLabel}
                        </a>{" "}
                        ({published})
                      </span>
                      {changeText_1D && (
                        <span className={`text-xs ml-2 ${changeClass_1D}`}>
                          {changeText_1D}
                        </span>
                      )}
                      {changeText_1W && (
                        <span className={`text-xs ml-2 ${changeClass_1W}`}>
                          {changeText_1W}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const FinancialImpacts = ({ stockInfo, className = "" }) => {
  if (!stockInfo) return null;

  const parseList = (str = "", delim = "*") =>
    String(str)
      .split(delim)
      .map(s => s.trim())
      .filter(Boolean);

  const positives = parseList(stockInfo.positiveImpacts || "", "*");
  const negatives = parseList(stockInfo.negativeImpacts || "", "/");

  return (
    <div className={`mt-6 ${className}`}>
      {/* Header with top margin */}
      <h4 className="text-lg font-semibold mb-2">
        Financial Impacts
      </h4>

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Two-column layout (stacks on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
          {/* Positive column */}
          <div className="p-4 flex flex-col h-full border-b border-gray-200 md:border-b-0 md:border-r">
            <div className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
              <span aria-hidden>👍</span>
              <span>Positive Impacts</span>
            </div>

            {positives.length ? (
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-gray-800">
                {positives.map((item, idx) => (
                  <li key={idx} className="break-words">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-400 italic">
                No positive impacts available
              </p>
            )}
          </div>

          {/* Negative column */}
          <div className="p-4 flex flex-col h-full">
            <div className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
              <span aria-hidden>👎</span>
              <span>Negative Impacts</span>
            </div>

            {negatives.length ? (
              <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-gray-800">
                {negatives.map((item, idx) => (
                  <li key={idx} className="break-words">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-400 italic">
                No negative impacts available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StockEvents = ({ data = [] }) => {
  // ✅ Hooks always first; no early returns before hooks
  const [sortField, setSortField] = useState("Date"); // "Date" | "1D" | "1W"
  const [sortDir, setSortDir] = useState("desc");     // "asc" | "desc"

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortedEvents = useMemo(() => {
    const arr = [...(data || [])];
    if (sortField === "1D") {
      arr.sort((a, b) => {
        const av = parseFloat(a?.change_1D ?? 0);
        const bv = parseFloat(b?.change_1D ?? 0);
        return sortDir === "asc" ? av - bv : bv - av;
      });
    } else if (sortField === "1W") {
      arr.sort((a, b) => {
        const av = parseFloat(a?.change_1W ?? 0);
        const bv = parseFloat(b?.change_1W ?? 0);
        return sortDir === "asc" ? av - bv : bv - av;
      });
    } else {
      // Date
      arr.sort((a, b) => {
        const ta = new Date(a?.date || 0).getTime();
        const tb = new Date(b?.date || 0).getTime();
        const diff = (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
        return sortDir === "asc" ? -diff : diff;
      });
    }
    return arr;
  }, [data, sortField, sortDir]);

  const pctText = (v) =>
    v == null || isNaN(v) ? "—" : `${Number(v).toFixed(2)}%`;
  const pctClass = (v) =>
    v == null || isNaN(v)
      ? "text-gray-500"
      : Number(v) >= 0
      ? "text-green-600"
      : "text-red-600";
  const sortCaret = (field) =>
    sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "";

  return (
    <div className="w-full mt-6">
      <h4 className="text-lg font-semibold mb-2">Events</h4>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="px-4 py-2 text-left border border-gray-200 cursor-pointer select-none"
                onClick={() => toggleSort("Date")}
                title="Sort by Date"
              >
                Date {sortCaret("Date")}
              </th>
              <th className="px-4 py-2 text-left border border-gray-200">Purpose</th>
              <th
                className="px-4 py-2 text-left border border-gray-200 cursor-pointer select-none"
                onClick={() => toggleSort("1D")}
                title="Sort by 1D change"
              >
                1D {sortCaret("1D")}
              </th>
              <th
                className="px-4 py-2 text-left border border-gray-200 cursor-pointer select-none"
                onClick={() => toggleSort("1W")}
                title="Sort by 1W change"
              >
                1W {sortCaret("1W")}
              </th>
            </tr>
          </thead>

          <tbody>
            {(!data || data.length === 0) ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No events available.
                </td>
              </tr>
            ) : (
              sortedEvents.map((event, idx) => {
                const d = new Date(event.date);
                const dateStr = isNaN(d) ? String(event.date ?? "") : d.toLocaleDateString("en-IN");
                const c1d = event.change_1D;
                const c1w = event.change_1W;

                return (
                  <tr
                    key={event.hash ?? `${event.symbol}-${event.date}-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2 border border-gray-200">{dateStr}</td>
                    <td className="px-4 py-2 border border-gray-200">{event.purpose || "—"}</td>
                    <td className={`px-4 py-2 border border-gray-200 tabular-nums ${pctClass(c1d)}`}>
                      {pctText(c1d)}
                    </td>
                    <td className={`px-4 py-2 border border-gray-200 tabular-nums ${pctClass(c1w)}`}>
                      {pctText(c1w)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const PAGE_SIZE = 10;

const StockAnnouncements = ({ data = [] }) => {
  // ✅ Hooks always first; no early returns before hooks
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState(null); // "1D" | "1W" | null
  const [sortDir, setSortDir] = useState("desc");   // "asc" | "desc"

  // Safe data
  const rows = Array.isArray(data) ? data : [];

  // Helpers (no hooks)
  const siteName = (url) => {
    if (!url) return "link";
    try {
      const host = new URL(url).hostname.replace(/^www\./i, "");
      return host.split(".")[0] || host;
    } catch {
      return "link";
    }
  };

  // "25 Sept 2025"
  const formatPrettyDate = (d) => {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d || "");
    return dt.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const pctText = (v) =>
    v == null || isNaN(v) ? "" : `${Number(v).toFixed(2)}%`;
  const pctClass = (v) =>
    v == null || isNaN(v) ? "text-gray-500" : Number(v) >= 0 ? "text-green-600" : "text-red-600";

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };
  const caret = (field) => (sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "");

  // Sort all, then paginate
  const sorted = useMemo(() => {
    const arr = [...rows];
    if (sortField === "1D") {
      arr.sort((a, b) => {
        const av = parseFloat(a?.change_1D ?? a?.chang ?? 0);
        const bv = parseFloat(b?.change_1D ?? b?.chang ?? 0);
        return sortDir === "asc" ? av - bv : bv - av;
      });
    } else if (sortField === "1W") {
      arr.sort((a, b) => {
        const av = parseFloat(a?.change_1W ?? 0);
        const bv = parseFloat(b?.change_1W ?? 0);
        return sortDir === "asc" ? av - bv : bv - av;
      });
    } else {
      // default: latest first using an_dt or date
      arr.sort((a, b) => {
        const ta = new Date(a?.an_dt || a?.date || 0).getTime();
        const tb = new Date(b?.an_dt || b?.date || 0).getTime();
        return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
      });
    }
    return arr;
  }, [rows, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const start = (pageSafe - 1) * PAGE_SIZE;
  const pageSlice = sorted.slice(start, start + PAGE_SIZE);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="w-full mt-6">
      <h4 className="text-lg font-semibold">Announcements</h4>

      {/* Top controls (paging + sort) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 mb-2">
        <div className="text-sm text-gray-500">
          Showing {pageSlice.length} of {sorted.length} items
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSort("1D")}
            className="px-3 py-1.5 rounded-md border text-sm"
            title="Sort by 1D change"
          >
            1D {caret("1D")}
          </button>
          <button
            onClick={() => toggleSort("1W")}
            className="px-3 py-1.5 rounded-md border text-sm"
            title="Sort by 1W change"
          >
            1W {caret("1W")}
          </button>
          <button
            onClick={goPrev}
            disabled={pageSafe === 1}
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm tabular-nums">
            Page {pageSafe} of {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={pageSafe === totalPages}
            className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* List-style rows in a bordered, rounded table for alignment/scroll */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <tbody className="divide-y">
            {pageSlice.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500">No announcements found.</td>
              </tr>
            ) : (
              pageSlice.map((row, idx) => {
                const type = row?.desc || row?.purpose || "—";
                const description = row?.attchmntText || row?.bm_desc || "";
                const href = row?.attchmntFile || row?.link || null;
                const dateRaw = row?.an_dt || row?.date || null;
                const dateStr = formatPrettyDate(dateRaw);

                const c1d = parseFloat(row?.change_1D ?? row?.chang ?? null);
                const c1w = parseFloat(row?.change_1W ?? null);

                return (
                  <tr
                    key={row.hash ?? `${row.symbol}-${dateRaw}-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 border">
                      {/* {Type} – {Description} – {link} – {date} – (1D …) (1W …) */}
                      <div className="space-x-1">
                        <span className="font-medium">{type}</span>
                        {description && <span className="font-light text-gray-500">– {description}</span>}
                        {href && (
                          <>
                            <span>–</span>
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                              title={href}
                            >
                              {siteName(href)}
                            </a>
                          </>
                        )}
                        {dateStr && (
                          <>
                            <span>–</span>
                            <span className="text-gray-700">{dateStr}</span>
                          </>
                        )}
                        {Number.isFinite(c1d) && (
                          <span className={`ml-2 ${pctClass(c1d)}`}>{`1D ${pctText(c1d)}`}</span>
                        )}
                        {Number.isFinite(c1w) && (
                          <span className={`ml-2 ${pctClass(c1w)}`}>{`1W ${pctText(c1w)}`}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Empty state AFTER hooks—no early return */}
      {rows.length === 0 && (
        <p className="mt-3 text-gray-500">No announcements available.</p>
      )}
    </div>
  );
};


const TAB_CONFIG = [
  { key: "stockBulkDeals",   label: "Bulk Deals" },
  { key: "stockBlockDeals",  label: "Block Deals" },
  { key: "stockSastDeals",   label: "SAST Deals" },
  { key: "stockInsiderDeals",label: "Insider Deals" },
];

/* ---- Tiny helpers (no per-tab schema) ---- */
const fmtNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";
};
const fmtPrice = (v) => {
  const n = Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
};
// 25 Sept 2025 (uniform)
const fmtDate = (d) => {
  const dt = new Date(d);
  return isNaN(dt) ? "—" : dt.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const pctTxt = (v) => (v == null || isNaN(v) ? "—" : `${Number(v).toFixed(2)}%`);
const pctCls = (v) =>
  v == null || isNaN(v) ? "text-gray-500" : Number(v) >= 0 ? "text-green-600" : "text-red-600";

// Resolve fields that vary across tabs (simple OR-chains)
const getClient = (r) => r.clientName || r.acquirerName || r.acqName || r.personName || "—";
const getSide   = (r) => r.buySell || r.acqSaleType || r.transactionType || "—";
const getMode   = (r) => r.acqMode || r.acquisitionMode || r.personCategory || r.relation || "—";
const getQty    = (r) => r.qty || r.noOfShareAcq || r.noOfShareSale || r.secAcq || null;
const getAvg    = (r) => r.watp || r.avgPrice || r.price || null;
const getDealCr = (r) => (r.dealValue != null ? Number(r.dealValue) : null); // already in Cr if you set it so
const getD1     = (r) => parseFloat(r.change_1D ?? r.change ?? r.chg ?? NaN);
const getW1     = (r) => parseFloat(r.change_1W ?? NaN);

const StockTrades = ({ symbol }) => {
  const [data, setData] = useState({
    stockBulkDeals:   { data: [], loading: true, error: null },
    stockBlockDeals:  { data: [], loading: true, error: null },
    stockSastDeals:   { data: [], loading: true, error: null },
    stockInsiderDeals:{ data: [], loading: true, error: null },
  });
  const [activeKey, setActiveKey] = useState(TAB_CONFIG[0].key);

  // sorting (just 3 keys)
  const [sortKey, setSortKey] = useState("date"); // 'date' | 'd1' | 'w1'
  const [sortDir, setSortDir] = useState("desc"); // 'asc' | 'desc'

  useEffect(() => {
    let cancelled = false;

    // reset
    setData({
      stockBulkDeals:   { data: [], loading: true, error: null },
      stockBlockDeals:  { data: [], loading: true, error: null },
      stockSastDeals:   { data: [], loading: true, error: null },
      stockInsiderDeals:{ data: [], loading: true, error: null },
    });

    TAB_CONFIG.forEach(({ key }) => {
      axios
        .get(`${process.env.REACT_APP_API_URL}/api_2/${key}/${symbol}`)
        .then((res) => {
          if (cancelled) return;
          setData((prev) => ({
            ...prev,
            [key]: { data: Array.isArray(res.data) ? res.data : [], loading: false, error: null },
          }));
        })
        .catch((err) => {
          if (cancelled) return;
          console.error(`Error fetching ${key}:`, err);
          setData((prev) => ({
            ...prev,
            [key]: { data: [], loading: false, error: "Failed to load" },
          }));
        });
    });

    return () => { cancelled = true; };
  }, [symbol]);

  const active = data[activeKey] || { data: [], loading: false, error: null };

  const sortedRows = useMemo(() => {
    const arr = [...(active.data || [])];

    if (sortKey === "date") {
      arr.sort((a, b) => {
        const ta = new Date(a?.date || 0).getTime();
        const tb = new Date(b?.date || 0).getTime();
        const diff = (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
        return sortDir === "asc" ? -diff : diff; // default desc
      });
    } else if (sortKey === "d1") {
      arr.sort((a, b) => {
        const av = getD1(a); const bv = getD1(b);
        const na = isNaN(av) ? -Infinity : av;
        const nb = isNaN(bv) ? -Infinity : bv;
        return sortDir === "asc" ? na - nb : nb - na;
      });
    } else if (sortKey === "w1") {
      arr.sort((a, b) => {
        const av = getW1(a); const bv = getW1(b);
        const na = isNaN(av) ? -Infinity : av;
        const nb = isNaN(bv) ? -Infinity : bv;
        return sortDir === "asc" ? na - nb : nb - na;
      });
    }
    return arr;
  }, [active.data, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };
  const caret = (key) => (sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : "");

  return (
    <div className="w-full">
      <h4 className="text-lg font-semibold mb-3 mt-3">Trades</h4>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b mb-3 pb-2">
        {TAB_CONFIG.map(({ key, label }) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              onClick={() => setActiveKey(key)}
              className={`px-3 py-1 text-sm rounded-t border-b-2 transition ${
                isActive
                  ? "border-blue-600 text-blue-700 font-semibold"
                  : "border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {active.loading ? (
        <div className="flex items-center gap-2 text-blue-700">
          <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : active.error ? (
        <div className="text-red-600 text-sm">No data available</div>
      ) : active.data.length === 0 ? (
        <div className="text-gray-500 text-sm">No records found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr className="font-semibold">
                <th
                  className="px-3 py-2 border border-gray-200 text-left whitespace-nowrap cursor-pointer select-none"
                  onClick={() => toggleSort("date")}
                  title="Sort by Date"
                >
                  Date {caret("date")}
                </th>
                <th className="px-3 py-2 border border-gray-200 text-left whitespace-nowrap">Buyer/Seller</th>
                <th className="px-3 py-2 border border-gray-200 text-left whitespace-nowrap">Type</th>
                <th className="px-3 py-2 border border-gray-200 text-left whitespace-nowrap">Mode</th>
                <th className="px-3 py-2 border border-gray-200 text-left whitespace-nowrap">Qty</th>
                <th className="px-3 py-2 border border-gray-200 text-left whitespace-nowrap">Avg/WATP</th>
                <th
                  className="px-3 py-2 border border-gray-200 text-left whitespace-nowrap cursor-pointer select-none"
                  onClick={() => toggleSort("d1")}
                  title="Sort by 1D"
                >
                  1D {caret("d1")}
                </th>
                <th
                  className="px-3 py-2 border border-gray-200 text-left whitespace-nowrap cursor-pointer select-none"
                  onClick={() => toggleSort("w1")}
                  title="Sort by 1W"
                >
                  1W {caret("w1")}
                </th>
              </tr>
            </thead>

            <tbody className="text-gray-700">
              {sortedRows.map((row, idx) => {
                const d1 = getD1(row);
                const w1 = getW1(row);
                const qty = getQty(row);
                const avg = getAvg(row);
                const dealCr = getDealCr(row);

                return (
                  <tr
                    key={row.hash ?? `${row.symbol}-${row.date}-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-3 py-2 border border-gray-200 align-top">{fmtDate(row.date)}</td>
                    <td className="px-3 py-2 border border-gray-200 align-top">{getClient(row)}</td>
                    <td className="px-3 py-2 border border-gray-200 align-top">
                      <span className={
                        (row.buySell || row.acqSaleType || "").toUpperCase() === "BUY" ? "text-green-700" :
                        (row.buySell || row.acqSaleType || "").toUpperCase() === "SELL" ? "text-red-700" :
                        "text-gray-700"
                      }>
                        {getSide(row)}
                      </span>
                    </td>
                    <td className="px-3 py-2 border border-gray-200 align-top">{getMode(row)}</td>
                    <td className="px-3 py-2 border border-gray-200 align-top tabular-nums">{fmtNum(qty)}</td>
                    <td className="px-3 py-2 border border-gray-200 align-top tabular-nums">{fmtPrice(avg)}</td>

                    <td className={`px-3 py-2 border border-gray-200 align-top tabular-nums ${pctCls(d1)}`}>
                      {pctTxt(d1)}
                    </td>
                    <td className={`px-3 py-2 border border-gray-200 align-top tabular-nums ${pctCls(w1)}`}>
                      {pctTxt(w1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


function SymbolPage() {
  const [candles, setCandles] = useState({ close: [], volume: [] });
  const [loading, setLoading] = useState(true);
  const [stockInfo, setStockInfo] = useState(null);
  const [tickPrefix, setTickPrefix] = useState("");
  const [selectedRange, setSelectedRange] = useState('1Y');
  const [consolidatedData, setConsolidatedData] = useState([]);
  const [standaloneData, setStandaloneData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [newsFeedData, setNewsFeedData] = useState([]);
  const [stockEventsData, setStockEventsData] = useState([]);
  const [stockAnnouncementsData, setStockAnnouncementsData] = useState([]);

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

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/news_feed/${symbol}`)
      .then(res => {
        setNewsFeedData(res.data);
      })
      .catch(err => {
        console.error('Error fetching news feed data:', err);
        setNewsFeedData([]);
      });
  }, [symbol]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api_2/stockEvents/${symbol}`)
      .then(res => {
        setStockEventsData(res.data);
      })
      .catch(err => {
        console.error('Error fetching news feed data:', err);
        setStockEventsData([]);
      });
  }, [symbol]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api_2/stockAnnouncements/${symbol}`)
      .then(res => {
        setStockAnnouncementsData(res.data);
      })
      .catch(err => {
        console.error('Error fetching news feed data:', err);
        setStockAnnouncementsData([]);
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
                  <span className="text-gray-500">Market Cap:</span>{" "}
                  {isNaN(parseFloat(stockInfo.marketCap))
                    ? "—"
                    : `₹${new Intl.NumberFormat("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(parseFloat(stockInfo.marketCap) / 1e7)} Cr`}
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
      <div className="mt-6 mb-1">
        {/* Mobile: single-row horizontal scroll; Desktop: same look, no wrap needed */}
        <div className="relative overflow-x-auto">
          <div className="inline-flex whitespace-nowrap gap-0 border border-gray-300 rounded-md overflow-hidden">
            {Object.keys(timeFrames).map((range, idx, arr) => {
              const isActive = selectedRange === range;
              const isFirst = idx === 0;
              const isLast = idx === arr.length - 1;

              return (
                <button
                  key={range}
                  onClick={() => setSelectedRange(range)}
                  className={[
                    // size: better tap targets on mobile
                    "px-4 py-2 text-xs sm:text-sm font-medium transition-colors duration-200",
                    // active/inactive styles
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100",
                    // divider between segments
                    !isLast ? "border-r border-gray-300" : "",
                    // keep outer corners slightly rounded
                    isFirst ? "rounded-l-md" : "",
                    isLast ? "rounded-r-md" : "",
                    // ensure each button doesn't shrink too small on mobile
                    "min-w-[64px]"
                  ].join(" ")}
                >
                  {range}
                </button>
              );
            })}
          </div>
        </div>
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
            <div>
              <span className="text-gray-700 whitespace-pre-wrap break-words max-h-28 overflow-auto">
                {clickedMsg.text}
              </span>

              {/* Row 3: link (breaks on small screens) */}
              <span className="ml-1">
              {clickedMsg.url && (
                <a
                  href={clickedMsg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-blue-600 underline break-all"
                >
                  source
                </a>
              )}
              </span>
            </div>
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

      {/* Financial Impacts */}
      {stockInfo && <FinancialImpacts stockInfo={stockInfo} />}

      {/* News & Stories */}
      <NewsFeedTable data={newsFeedData} />

      {/* Financial Results */}
      <div>
        <h4 className="text-lg font-semibold mt-6">
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


      <StockEvents data={stockEventsData} />
      <StockAnnouncements data={stockAnnouncementsData} />
      <StockTrades symbol={symbol} />
      {/* 
      <StockTrades symbol={symbol} /> */}
      
    </div>
  );
}

export default SymbolPage;
