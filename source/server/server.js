const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
app.use(cors());


let industryData = {};
let eventsMap = {}; // key: symbol, value: array of events
const candleDataFolder = path.join(__dirname, '../../stock_charts/');
const consolidatedDataFolder = path.join(__dirname, '../../stock_results/consolidated');
const standaloneDataFolder = path.join(__dirname, '../../stock_results/standalone');
const newsFolder = path.join(__dirname, '../../stock_news');
const stockNewsPath = path.join(__dirname, '../../stock_news/all_stock_news.csv');
const stockInfoFilePath = path.join(__dirname, '../../stock_info/yFinStockInfo_NSE.csv');

const announcementPath = path.join(__dirname, '../../stock_fillings/announcements_nse.csv');

const eventsPath = path.join(__dirname, '../../stock_fillings/events_nse.csv');
const upcomingIssuesPath = path.join(__dirname, '../../stock_fillings/upcomingIssues_nse.csv');
const forthcomingListingPath = path.join(__dirname, '../../stock_fillings/forthcomingListing_nse.csv');
const forthcomingOfsPath = path.join(__dirname, '../../stock_fillings/forthcomingOfs_nse.csv');
const upcomingTenderPath = path.join(__dirname, '../../stock_fillings/upcomingTender_nse.csv');
const economicCalenderPath = path.join(__dirname, '../../stock_fillings/sensiBullEconomicCalender_nse.csv');

const rightsFilingsPath = path.join(__dirname, '../../stock_fillings/rightsFilings_nse.csv');
const qipFilingsPath = path.join(__dirname, '../../stock_fillings/qipFilings_nse.csv');
const prefIssuePath = path.join(__dirname, '../../stock_fillings/prefIssue_nse.csv');
const schemeOfArrangementPath = path.join(__dirname, '../../stock_fillings/schemeOfArrangement_nse.csv');
const liveRightsPath = path.join(__dirname, '../../stock_fillings/liveRights_nse.csv');

const integratedResultsPath = path.join(__dirname, '../../stock_fillings/integratedResults_nse.csv');

const bulkDealsPath = path.join(__dirname, '../../stock_fillings/bulkDeals_nse.csv');
const blockDealsPath = path.join(__dirname, '../../stock_fillings/blockDeals_nse.csv');
const shortDealsPath = path.join(__dirname, '../../stock_fillings/shortDeals_nse.csv');
const sastDealsPath = path.join(__dirname, '../../stock_fillings/sastDeals_nse.csv');
const insiderDealsPath = path.join(__dirname, '../../stock_fillings/insiderDeals_nse.csv');

const csvPaths = {
  announcements: announcementPath,

  events: eventsPath,
  upcomingIssues: upcomingIssuesPath,
  forthcomingListing: forthcomingListingPath,
  forthcomingOfs: forthcomingOfsPath,
  upcomingTender: upcomingTenderPath,
  economicCalender: economicCalenderPath,

  rightsFilings: rightsFilingsPath,
  qipFilings: qipFilingsPath,
  prefIssue: prefIssuePath,
  schemeOfArrangement: schemeOfArrangementPath,
  liveRights: liveRightsPath,

  integratedResults: integratedResultsPath,

  bulkDeals: bulkDealsPath,
  blockDeals: blockDealsPath,
  shortDeals: shortDealsPath,
  sastDeals: sastDealsPath,
  insiderDeals: insiderDealsPath,

  stockNews: stockNewsPath
};

const dateKeys = {
  announcements: "an_dt",

  events: "date",
  upcomingIssues: "issueEndDate",
  forthcomingListing: "effectiveDate",
  forthcomingOfs: "endDate",
  upcomingTender: "todEndDate",
  economicCalender: "date",

  rightsFilings: "date",
  qipFilings: "date",
  prefIssue: "systemDate",
  schemeOfArrangement: "date",
  liveRights: "rightEndDate",

  integratedResults: "creation_Date",

  bulkDeals: "date",
  blockDeals: "date",
  shortDeals: "date",
  sastDeals: "date",
  insiderDeals: "date",

  stockNews: "published"
};

const daysPastList = {
  announcements: 2,

  events: 2,
  upcomingIssues: 2,
  forthcomingListing: 3,
  forthcomingOfs: 3,
  upcomingTender: 20,
  economicCalender: 4,

  rightsFilings: 15,
  qipFilings: 15,
  prefIssue: 5,
  schemeOfArrangement: 10,
  liveRights: 10,

  integratedResults: 4,

  bulkDeals: 2,
  blockDeals: 10,
  shortDeals: 2,
  sastDeals: 2,
  insiderDeals: 2,

  stockNews: 2
};

// ===================== Helper Functions ===================================

function toCrores(value, decimals = 2) {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return +(num / 1e7).toFixed(decimals);
}

const formatDate = (rawDateStr) => {
  const dateObj = new Date(rawDateStr);
  if (isNaN(dateObj)) return rawDateStr; // fallback in case of bad date
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Put these near the top of your file
function parseAsOfDate(asOfStr) {
  if (!asOfStr) return null; // was: return new Date()
  const s = String(asOfStr).trim();

  // Try YYYY-MM-DD
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(s)) {
    const d = new Date(s + 'T00:00:00'); // local midnight
    if (!isNaN(d)) return d;
  }

  // Try DD-MM-YYYY
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/;
  const m = s.match(dmy);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d)) return d;
  }

  // Fallback
  const d = new Date(s);
  return isNaN(d) ? new Date() : d;
}

function findRefIndex(dates, referenceDate) {
  // returns largest index i where Date(dates[i]) <= referenceDate, else -1
  for (let i = dates.length - 1; i >= 0; i--) {
    const di = new Date(dates[i]);
    if (!isNaN(di) && di <= referenceDate) return i;
  }
  return -1;
}

// ===================== Data Loading Functions =============================
function loadEventsFromCSV(callback) {
  const offsetDate = new Date();
  offsetDate.setDate(offsetDate.getDate() - 10);

  fs.createReadStream(eventsPath)
    .pipe(csv())
    .on('data', (row) => {
      const symbol = (row.symbol || '').trim();
      if (!symbol) return;

      const eventDate = new Date(row.date);
      if (isNaN(eventDate.getTime())) return; // skip invalid dates

      if (eventDate < offsetDate) return; // skip old events

      if (!eventsMap[symbol]) {
        eventsMap[symbol] = [];
      }

      eventsMap[symbol].push({
        company: row.company || '',
        purpose: row.purpose || '',
        date: row.date || '',
      });
    })
    .on('end', () => {
      console.log('✅ Events loaded (filtered by date)');
      callback();
    });
}

const getStockReturns = async (symbolWithNS, asOfDate) => {
  return new Promise((resolve) => {
    if (!symbolWithNS) {
      console.log('No symbolWithNS ' + symbol);
      return resolve({
        '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
        '6M': 'N/A', '1Y': 'N/A', 'vs52WH': 'N/A'
      });
    }

    const symbol = symbolWithNS.replace('.NS', '');
    const csvPath = path.join(candleDataFolder, `${symbol}.csv`);
    if (!fs.existsSync(csvPath)) {
      console.log('No CSV path for symbol ' + symbol);
      return resolve({
        '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
        '6M': 'N/A', '1Y': 'N/A', 'vs52WH': 'N/A'
      });
    }

    const closes = [];
    const dates = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (row['Close']) closes.push(parseFloat(row['Close']));
        if (row['Date']) dates.push(row['Date']); // aligned with closes
      })
      .on('end', () => {
        if (closes.length < 2 || dates.length !== closes.length) {
          console.log('No close length ' + symbol);
          console.log('close length ' + closes.length)
          console.log('date length ' + dates.length)
          return resolve({
            '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
            '6M': 'N/A', '1Y': 'N/A', 'vs52WH': 'N/A'
          });
        }

        const referenceDate = asOfDate || new Date();
        const refIdx = findRefIndex(dates, referenceDate);
        if (refIdx < 1) {
          // no candle on/before asOf date
          console.log('refIdx ' + symbol);
          
          return resolve({
            '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
            '6M': 'N/A', '1Y': 'N/A', 'vs52WH': 'N/A',
            '1M_candle': [],
            'lastCandleDate': null
          });
        }

        const latest = closes[refIdx];

        // 52W high using up to refIdx (last 252 trading days)
        const start52 = Math.max(0, refIdx - 251);
        const highestvs52WHClose = Math.max(...closes.slice(start52, refIdx + 1));
        const vs52WH =
          highestvs52WHClose > 0
            ? (((latest - highestvs52WHClose) / highestvs52WHClose) * 100).toFixed(2) + '%'
            : 'N/A';

        const calc = (indexAgo) => {
          const idx = refIdx - indexAgo;
          if (idx < 0 || !isFinite(idx)) return 'N/A';
          const old = closes[idx];
          if (!isFinite(old) || old === 0) return 'N/A';
          return (((latest - old) / old) * 100).toFixed(2) + '%';
        };

        const last20Start = Math.max(0, refIdx - 19);
        const last20Candles = closes.slice(last20Start, refIdx + 1);
        const lastCandleDate = dates[refIdx];

        resolve({
          '1D': calc(1),
          '1W': calc(5),
          '1M': calc(22),
          '3M': calc(66),
          '6M': calc(132),
          '1Y': calc(252),
          'vs52WH': vs52WH,
          '1M_candle': last20Candles,
          'lastCandleDate': lastCandleDate
        });
      })
      .on('error', () => {
        console.log('error ' + symbol);
        resolve({
          '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
          '6M': 'N/A', '1Y': 'N/A', 'vs52WH': 'N/A'
        });
      });
  });
};

const loadIndustries = async (asOfDate) => {
  // fresh local snapshot every run
  let industryData_local = {};

  const results = [];
  await new Promise((resolve) => {
    fs.createReadStream(stockInfoFilePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', resolve);
  });

  // Load events only for LIVE (no asOf) runs; clear old events first
  if (!asOfDate) {                        // clear stale events
    await new Promise((resolve) => loadEventsFromCSV(resolve));
  }

  for (const row of results) {
    const industries = row['tjiIndustry']?.split('\\').flatMap(i => i.split('/').map(s => s.trim())) || [];
    const realReturns = await getStockReturns(row['symbol'], asOfDate);

    industries
      .filter(industry => industry !== 'N' && industry !== 'NEW')
      .forEach(industry => {
        if (!industryData_local[industry]) {
          industryData_local[industry] = {
            stocks: [],
            type: row['quoteType'] || 'Other'
          };
        }
        const symbol_clean = row['symbol'].replace('.NS', '');
        industryData_local[industry].stocks.push({
          symbol: symbol_clean,
          name: row['longName'] ? row['longName'] : symbol_clean,
          marketCap: parseFloat(row['marketCap'] || '0'),
          price: parseFloat(row['currentPrice'] || '0'),
          pe: parseFloat(row['trailingPE'] || '0'),
          roe: parseFloat(row['returnOnEquity'] || '0'),
          // no events for asOf snapshots
          events: asOfDate ? [] : (eventsMap[symbol_clean] || []),  // was eventsMap[...] always
          sparklineData: realReturns['1M_candle'],
          lastUpdateDate: realReturns['lastCandleDate'],
          dummyData: {
            weight: 1,
            ...realReturns                                      // fix earlier ".realReturns" typo
          }
        });
      });
  }

  for (const [industry, data] of Object.entries(industryData_local)) {
    const stocks = data.stocks;

    const totalMarketCap = stocks.reduce((acc, stock) => acc + stock.marketCap, 0);

    const weightedAverage = (field) => {
      if (totalMarketCap === 0) return 'N/A';
      const weightedSum = stocks.reduce((acc, stock) => {
        const value = parseFloat(stock.dummyData[field]);
        if (isNaN(value)) return acc;
        return acc + (value * stock.marketCap);
      }, 0);
      return (weightedSum / totalMarketCap).toFixed(2) + '%';
    };

    const unweightedAverage = (field) => {
      const validValues = stocks
        .map(stock => parseFloat(stock.dummyData[field]))
        .filter(val => !isNaN(val));

      if (validValues.length === 0) return 'N/A';

      const sum = validValues.reduce((a, b) => a + b, 0);
      return (sum / validValues.length).toFixed(2) + '%';
    };

    data.weightedReturns = {
      '1D': weightedAverage('1D'),
      '1W': weightedAverage('1W'),
      '1M': weightedAverage('1M'),
      '3M': weightedAverage('3M'),
      '6M': weightedAverage('6M'),
      '1Y': weightedAverage('1Y'),

      '1D_N': unweightedAverage('1D'),
      '1W_N': unweightedAverage('1W'),
      '1M_N': unweightedAverage('1M'),
      '3M_N': unweightedAverage('3M'),
      '6M_N': unweightedAverage('6M'),
      '1Y_N': unweightedAverage('1Y'),

      'vs52WH': weightedAverage('vs52WH'),
      'vs52WH_N': unweightedAverage('vs52WH')
    };
  }

  return industryData_local; // <-- return the snapshot for this run
};

// ==================== Main DashBoard API ===============================
app.get('/api/industries', async (req, res) => {
  try {
    const asOf = parseAsOfDate(req.query.asOf); // returns Date or null

    if (asOf) {
      // As-of request: one-off snapshot; DO NOT touch global
      const snapshot = await loadIndustries(asOf);
      return res.json(snapshot);
    }

    // Live request: build once and cache in the global
    if (!industryData || Object.keys(industryData).length === 0) {
      const snapshot = await loadIndustries(null);
      industryData = snapshot; // atomic replace
    }
    return res.json(industryData);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to build industries snapshot' });
  }
});

// ===================== Document APIS ===================================

function getTradeDate(dayPast = 0) {
  let tradeDate = new Date();

  // If before 9:30 AM, go to previous calendar day
  const now = new Date();
  const isBeforeMarketOpen =
    now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() < 30);
  if (isBeforeMarketOpen) {
    tradeDate.setDate(tradeDate.getDate() - 1);
  }

  // Now move back `dayPast` *trading days*
  let remaining = dayPast;
  while (remaining > 0) {
    tradeDate.setDate(tradeDate.getDate() - 1);
    if (tradeDate.getDay() !== 0 && tradeDate.getDay() !== 6) {
      remaining--;
    }
  }

  // If we land on weekend (just in case), move back to Friday
  while (tradeDate.getDay() === 0 || tradeDate.getDay() === 6) {
    tradeDate.setDate(tradeDate.getDate() - 1);
  }

  return tradeDate;
}


app.get('/api/:type', (req, res) => {
  const { type } = req.params;

  const filePath = csvPaths[type];
  const dateKey = dateKeys[type];
  const dayPast = daysPastList[type];

  const filterDate = getTradeDate(dayPast);
  // filterDate.setDate(filterDate.getDate() - dayPast);

  // ✅ Check if CSV file exists — if not, return empty array
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV file for '${type}' not found at ${filePath}`);
    return res.json([]); // return empty list instead of throwing
  }

  if (!fs.existsSync(stockInfoFilePath)) {
    console.warn(`Stock info CSV not found at ${stockInfoFilePath}`);
    return res.json([]); // same safeguard for stock info
  }

  // Step 1: Read stock info first
  const stockMap = {}; // symbol => marketCap
  fs.createReadStream(stockInfoFilePath)
    .pipe(csv())
    .on('data', (row) => {
      if (row.symbol && row.marketCap) {
        const cleanSymbol = row.symbol.trim().toUpperCase().replace(/\.NS$/, '');
        stockMap[cleanSymbol] = {
          marketCap: parseFloat(row.marketCap || 0),
          currentPrice: parseFloat(row.currentPrice || 0),
          previousClose: parseFloat(row.previousClose || 0),
          last5revenue_consolidated: row.last5revenue_consolidated ? JSON.parse(row.last5revenue_consolidated) : null,
          last5PAT_consolidated: row.last5PAT_consolidated ? JSON.parse(row.last5PAT_consolidated) : null,
          last5revenue_standalone: row.last5revenue_standalone ? JSON.parse(row.last5revenue_standalone) : null,
          last5PAT_standalone: row.last5PAT_standalone ? JSON.parse(row.last5PAT_standalone) : null,
        };
      }
    })
    .on('end', () => {
      // Step 2: Process the requested type CSV
      const results = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const dtStr = row[dateKey] || '';
          
          const parsed = new Date(dtStr);

          if (!isNaN(parsed) && parsed >= filterDate) {
            // Try to attach marketCap if symbol is present
            const symbol = (row.symbol || '').trim().toUpperCase();
            if (symbol && stockMap[symbol] !== undefined) {
              row.marketCap = stockMap[symbol].marketCap;
              row.currentPrice = stockMap[symbol].currentPrice;
              row.previousClose = stockMap[symbol].previousClose;
              row.last5revenue_consolidated = stockMap[symbol].last5revenue_consolidated;
              row.last5PAT_consolidated = stockMap[symbol].last5PAT_consolidated;
              row.last5revenue_standalone = stockMap[symbol].last5revenue_standalone;
              row.last5PAT_standalone = stockMap[symbol].last5PAT_standalone;
            }
            results.push(row);
          }
        })
        .on('end', () => res.json(results))
        .on('error', err => {
          console.error(`Error reading file for type '${type}':`, err);
          res.status(500).json({ error: `Failed to load data for type '${type}'` });
        });
    })
    .on('error', err => {
      console.error('Error reading stock info file:', err);
      res.status(500).json({ error: 'Failed to load stock info data' });
    });
});

// ===================== Other APIs ======================================
/* returns
{
  "close": [<oldest>, ..., <latest>],
  "volume": [<oldest>, ..., <latest>]
}
*/
app.get('/api/candles/:symbol', (req, res) => {
  const { symbol } = req.params;
  const filePath = path.join(candleDataFolder, `${symbol}.csv`);

  const result = {
    close: [],
    volume: [],
    date: []
  };

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Data for symbol '${symbol}' not found.` });
  }

  fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    const closeVal = parseFloat(parseFloat(row['Close']));
    const volumeVal = parseFloat(row['Volume']);
    const dateVal = row['Date'];

    if (!isNaN(closeVal)) {
      result.close.push(closeVal);
    }

    if (!isNaN(volumeVal)) {
      result.volume.push(volumeVal);
    }

    if (dateVal) {
      const formattedDate = formatDate(dateVal); // ✅ format the date
      result.date.push(formattedDate);
    }
  })
  .on('end', () => res.json(result))
  .on('error', (err) => {
    console.error(`Error reading CSV for '${symbol}':`, err);
    res.status(500).json({ error: `Failed to load data for symbol '${symbol}'` });
  });

});

app.get('/api/info/:symbol', (req, res) => {
  const { symbol } = req.params;
  yFinSymbol = symbol + ".NS"
  let found = false;

  const result = {};

  fs.createReadStream(stockInfoFilePath)
    .pipe(csv())
    .on('data', (row) => {
      if (((row.symbol || '').toUpperCase() === yFinSymbol.toUpperCase()) || 
           ((row.symbol || '').toUpperCase() === symbol.toUpperCase())) {
        Object.assign(result, row);
        found = true;
      }
    })
    .on('end', () => {
      if (found) {
        res.json(result);
      } else {
        res.status(404).json({ error: `Symbol '${symbol}' not found.` });
      }
    })
    .on('error', (err) => {
      console.error('Error reading CSV:', err);
      res.status(500).json({ error: 'Error reading stock info CSV.' });
    });
});

app.get('/api/results/:type/:symbol', (req, res) => {
  const { type, symbol } = req.params;
  const baseType = type.toLowerCase();

  if (!['consolidated', 'standalone'].includes(baseType)) {
    return res.status(400).json({ error: `Invalid type '${type}'. Use 'consolidated' or 'standalone'.` });
  }

  const baseFolder = baseType === 'standalone' ? standaloneDataFolder : consolidatedDataFolder;
  const filePath = path.join(baseFolder, symbol, `${symbol}.csv`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Data for symbol '${symbol}' not found. path '${filePath}'` });
  }

  const result = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      // Optionally parse numeric fields
      const parsedRow = {
        Sales: toCrores(row.Sales),
        InterestBanking: toCrores(row.InterestBanking),
        Expenses: toCrores(row.Expenses),
        OperatingProfit: toCrores(row.OperatingProfit),
        OPM: parseFloat(row.OPM).toFixed(1),
        OtherIncome: toCrores(row.OtherIncome),
        ExceptionalItem: toCrores(row.ExceptionalItem),
        Interest: toCrores(row.Interest),
        Depreciation: toCrores(row.Depreciation),
        ProfitBeforeTax: toCrores(row.ProfitBeforeTax),
        TaxPercentage: parseFloat(row.TaxPercentage).toFixed(1),
        NetProfit: toCrores(row.NetProfit),
        EPS: parseFloat(row.EPS),
        toDate: row.toDate,
        audited: row.audited,
        xbrl: row.xbrl,
        broadCastDate: row.broadCastDate
      };
      result.push(parsedRow);
    })
    .on('end', () => res.json(result))
    .on('error', (err) => {
      console.error(`Error reading CSV for '${symbol}' (${type}):`, err);
      res.status(500).json({ error: `Failed to load ${type} data for symbol '${symbol}'` });
    });
});

app.get('/api/news/:symbol', (req, res) => {
  const { symbol } = req.params;

  const baseFolder = newsFolder;
  const filePath = path.join(baseFolder, `${symbol}.csv`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Data for symbol '${symbol}' not found. path '${filePath}'` });
  }

  const result = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      // Optionally parse numeric fields
      const parsedRow = {
        type: row.type,
        date: row.date,
        details: row.details,
        url: row.url,
      };
      result.push(parsedRow);
    })
    .on('end', () => res.json(result))
    .on('error', (err) => {
      console.error(`Error reading CSV for '${symbol}' `, err);
      res.status(500).json({ error: `Failed to load news data for symbol '${symbol}'` });
    });
});

// Always serve client build if it exists
// Serve React build files for non-API requests
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  
  // Catch-all for frontend routes
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Catch-all for any other undefined route
app.use((req, res) => {
  res.status(404).send('404 - The requested resource does not exist.');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
