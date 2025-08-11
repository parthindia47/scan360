const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
app.use(cors());


const industryData = {};
const candleDataFolder = path.join(__dirname, '../../stock_charts/');
const consolidatedDataFolder = path.join(__dirname, '../../stock_results/consolidated');
const standaloneDataFolder = path.join(__dirname, '../../stock_results/standalone');
const stockInfoFilePath = path.join(__dirname, '../../stock_info/yFinStockInfo_NSE.csv');

const announcementPath = path.join(__dirname, '../../stock_fillings/announcements_nse.csv');

const eventsPath = path.join(__dirname, '../../stock_fillings/events_nse.csv');
const upcomingIssuesPath = path.join(__dirname, '../../stock_fillings/upcomingIssues_nse.csv');
const forthcomingListingPath = path.join(__dirname, '../../stock_fillings/forthcomingListing_nse.csv');
const forthcomingOfsPath = path.join(__dirname, '../../stock_fillings/forthcomingOfs_nse.csv');

const rightsFilingsPath = path.join(__dirname, '../../stock_fillings/rightsFilings_nse.csv');
const qipFilingsPath = path.join(__dirname, '../../stock_fillings/qipFilings_nse.csv');
const prefIssuePath = path.join(__dirname, '../../stock_fillings/prefIssue_nse.csv');
const schemeOfArrangementPath = path.join(__dirname, '../../stock_fillings/schemeOfArrangement_nse.csv');

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

  rightsFilings: rightsFilingsPath,
  qipFilings: qipFilingsPath,
  prefIssue: prefIssuePath,
  schemeOfArrangement: schemeOfArrangementPath,

  integratedResults: integratedResultsPath,

  bulkDeals: bulkDealsPath,
  blockDeals: blockDealsPath,
  shortDeals: shortDealsPath,
  sastDeals: sastDealsPath,
  insiderDeals: insiderDealsPath
};

const dateKeys = {
  announcements: "an_dt",

  events: "date",
  upcomingIssues: "issueEndDate",
  forthcomingListing: "effectiveDate",
  forthcomingOfs: "endDate",

  rightsFilings: "date",
  qipFilings: "date",
  prefIssue: "systemDate",
  schemeOfArrangement: "date",

  integratedResults: "creation_Date",

  bulkDeals: "date",
  blockDeals: "date",
  shortDeals: "date",
  sastDeals: "date",
  insiderDeals: "date"
};

const daysPastList = {
  announcements: 3,

  events: 2,
  upcomingIssues: 2,
  forthcomingListing: 3,
  forthcomingOfs: 3,

  rightsFilings: 15,
  qipFilings: 15,
  prefIssue: 5,
  schemeOfArrangement: 10,

  integratedResults: 6,

  bulkDeals: 4,
  blockDeals: 15,
  shortDeals: 4,
  sastDeals: 4,
  insiderDeals: 3
};

let eventsMap = {}; // key: symbol, value: array of events

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

const getStockReturns = async (symbolWithNS) => {
  if (!symbolWithNS) {
    return resolve({
      '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
      '6M': 'N/A', '1Y': 'N/A', 'vs52WH': 'N/A'
    });
  }

  const symbol = symbolWithNS.replace('.NS', '');
  const csvPath = path.join(candleDataFolder, `${symbol}.csv`);
  const candles = [];

  if (!fs.existsSync(csvPath)) {
    return resolve({
      '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
      '6M': 'N/A', '1Y': 'N/A', 'vs52WH': 'N/A'
    });
  }

  let lastCandleDate = null;

  return new Promise((resolve) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (row['Close']) {
          candles.push(parseFloat(row['Close']));
        }
        if (row['Date']) {
          lastCandleDate = row['Date']; // always overwrite — last value will be from last row
        }
      })
      .on('end', () => {
        if (candles.length < 2) {
          return resolve({
            '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
            '6M': 'N/A', '1Y': 'N/A', 'vs52WH': 'N/A'
          });
        }

        const latest = candles[candles.length - 1];
        const last252Candles = candles.slice(Math.max(candles.length - 252, 0));
        const highestvs52WHClose = Math.max(...last252Candles);

        let vs52WH = 'N/A';
        if (highestvs52WHClose !== 0) {
          vs52WH = (((latest - highestvs52WHClose) / highestvs52WHClose) * 100).toFixed(2) + '%';
        }

        const calc = (indexAgo) => {
          if (candles.length > indexAgo) {
            const old = candles[candles.length - 1 - indexAgo];
            if (old === 0) return 'N/A';
            return (((latest - old) / old) * 100).toFixed(2) + '%';
          }
          return 'N/A';
        };

        // Get last 20 days candles (oldest first)
        const last20Candles = candles.slice(-20);

        resolve({
          '1D': calc(1),
          '1W': calc(5),
          '1M': calc(22),
          '3M': calc(66),
          '6M': calc(132),
          '1Y': calc(252),
          'vs52WH': vs52WH,
          '1M_candle': last20Candles,
          'lastCandleDate': lastCandleDate  // 👈 added here
        });
      })
      .on('error', () => {
        resolve({
          '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
          '6M': 'N/A', '1Y': 'N/A', 'vs52WH': 'N/A'
        });
      });
  });
};

const loadIndustries = async () => {
  const results = [];

  await new Promise((resolve) => {
    fs.createReadStream(stockInfoFilePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', resolve);
  });

  loadEventsFromCSV(() => {});

  for (const row of results) {
    const industries = row['tjiIndustry']?.split('\\').flatMap(i => i.split('/').map(s => s.trim())) || [];
    const realReturns = await getStockReturns(row['symbol']);

    industries
    .filter(industry => industry !== 'N' && industry !== 'NEW')
    .forEach(industry => {
      if (!industryData[industry]) {
        industryData[industry] = {
          stocks: [],
          type: row['quoteType'] || 'Other'  // <== Add this line
        };
      }
      const symbol_clean = row['symbol'].replace('.NS', '')
      industryData[industry].stocks.push({
        symbol: symbol_clean,
        name: row['longName'] ? row['longName']  : symbol_clean,
        marketCap: parseFloat(row['marketCap'] || '0'),
        price: parseFloat(row['currentPrice'] || '0'),
        pe: parseFloat(row['trailingPE'] || '0'),
        roe: parseFloat(row['returnOnEquity'] || '0'),
        events: eventsMap[symbol_clean] || [], // ← Add matched events here
        sparklineData: realReturns['1M_candle'],
        lastUpdateDate: realReturns['lastCandleDate'],
        dummyData: {
          weight: 1,
          ...realReturns
        }
      });
    });
  }

  for (const [industry, data] of Object.entries(industryData)) {
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
};

// ==================== Main DashBoard API ===============================
app.get('/api/industries', async (req, res) => {
  if (Object.keys(industryData).length === 0) {
    await loadIndustries();
  }
  // console.log(industryData);
  res.json(industryData);
});

// ===================== Document APIS ===================================
app.get('/api/:type', (req, res) => {
  const { type } = req.params;

  const filePath = csvPaths[type];
  const dateKey = dateKeys[type];
  const dayPast = daysPastList[type];

  const filterDate = new Date();
  filterDate.setDate(filterDate.getDate() - dayPast);

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
