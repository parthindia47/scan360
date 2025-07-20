const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
app.use(cors());

const industryData = {};
const candleDataFolder = path.join(__dirname, '../../stock_charts/');
const stockInfoFilePath = path.join(__dirname, '../../stock_info/yFinStockInfo_NSE.csv');

const announcementPath = path.join(__dirname, '../../stock_fillings/announcements_nse.csv');
const eventsPath = path.join(__dirname, '../../stock_fillings/events_nse.csv');
const upcomingIssuesPath = path.join(__dirname, '../../stock_fillings/upcomingIssues_nse.csv');
const forthcomingListingPath = path.join(__dirname, '../../stock_fillings/forthcomingListing_nse.csv');

const rightsFilingsPath = path.join(__dirname, '../../stock_fillings/rightsFilings_nse.csv');
const qipFilingsPath = path.join(__dirname, '../../stock_fillings/qipFilings_nse.csv');
const prefIssuePath = path.join(__dirname, '../../stock_fillings/prefIssue_nse.csv');
const schemeOfArrangementPath = path.join(__dirname, '../../stock_fillings/schemeOfArrangement_nse.csv');

const csvPaths = {
  announcements: announcementPath,
  events: eventsPath,
  upcomingIssues: upcomingIssuesPath,
  forthcomingListing: forthcomingListingPath,
  rightsFilings: rightsFilingsPath,
  qipFilings: qipFilingsPath,
  prefIssue: prefIssuePath,
  schemeOfArrangement: schemeOfArrangementPath,
};

const dateKeys = {
  announcements: "an_dt",

  events: "date",
  upcomingIssues: "issueEndDate",
  forthcomingListing: "effectiveDate",

  rightsFilings: "draftDate",
  qipFilings: "date",
  prefIssue: "dateOfSubmission",
  schemeOfArrangement: "date",
};

const daysPastList = {
  announcements: 2,

  events: 2,
  upcomingIssues: 2,
  forthcomingListing: 2,

  rightsFilings: 10,
  qipFilings: 10,
  prefIssue: 10,
  schemeOfArrangement: 10,
};


let eventsMap = {}; // key: symbol, value: array of events

// Step 1: Load events.csv and build eventsMap
function loadEventsFromCSV(callback) {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  fs.createReadStream(eventsPath)
    .pipe(csv())
    .on('data', (row) => {
      const symbol = (row.symbol || '').trim();
      if (!symbol) return;

      const eventDate = new Date(row.date);
      if (isNaN(eventDate.getTime())) return; // skip invalid dates

      if (eventDate < twoDaysAgo) return; // skip old events

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
      '6M': 'N/A', '1Y': 'N/A', 'ltpVs52WHigh': 'N/A'
    });
  }

  const symbol = symbolWithNS.replace('.NS', '');
  const csvPath = path.join(candleDataFolder, `${symbol}.csv`);
  const candles = [];

  if (!fs.existsSync(csvPath)) {
    return resolve({
      '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
      '6M': 'N/A', '1Y': 'N/A', 'ltpVs52WHigh': 'N/A'
    });
  }

  return new Promise((resolve) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (row['Close']) {
          candles.push(parseFloat(row['Close']));
        }
      })
      .on('end', () => {
        if (candles.length < 2) {
          return resolve({
            '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
            '6M': 'N/A', '1Y': 'N/A', 'ltpVs52WHigh': 'N/A'
          });
        }

        const latest = candles[candles.length - 1];
        const last252Candles = candles.slice(Math.max(candles.length - 252, 0));
        const highest52WClose = Math.max(...last252Candles);

        let ltpVs52WHigh = 'N/A';
        if (highest52WClose !== 0) {
          ltpVs52WHigh = (((latest - highest52WClose) / highest52WClose) * 100).toFixed(2) + '%';
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
          'ltpVs52WHigh': ltpVs52WHigh,
          '1M_candle': last20Candles
        });
      })
      .on('error', () => {
        resolve({
          '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A',
          '6M': 'N/A', '1Y': 'N/A', 'ltpVs52WHigh': 'N/A'
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

      'ltpVs52WHigh': weightedAverage('ltpVs52WHigh'),
      'ltpVs52WHigh_N': unweightedAverage('ltpVs52WHigh')
    };
  }
};

app.get('/industries', async (req, res) => {
  if (Object.keys(industryData).length === 0) {
    await loadIndustries();
  }
  // console.log(industryData);
  res.json(industryData);
});

// ========================================================================
app.get('/api_2/:type', (req, res) => {
  const { type } = req.params;

  const filePath = csvPaths[type];
  const dateKey = dateKeys[type];
  const dayPast = daysPastList[type];

  const filterDate = new Date();
  filterDate.setDate(filterDate.getDate() - dayPast);

  if (!filePath) {
    return res.status(400).json({ error: `Unknown type '${type}'` });
  }

  // Step 1: Read stock info first
  const stockMap = {}; // symbol => marketCap
  fs.createReadStream(stockInfoFilePath)
    .pipe(csv())
    .on('data', (row) => {
      if (row.symbol && row.marketCap) {
        const cleanSymbol = row.symbol.trim().toUpperCase().replace(/\.NS$/, '');
        stockMap[cleanSymbol] = parseFloat(row.marketCap);
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
              row.marketCap = stockMap[symbol];
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


// ========================================================================
/* returns
{
  "close": [<oldest>, ..., <latest>],
  "volume": [<oldest>, ..., <latest>]
}
*/

const formatDate = (rawDateStr) => {
  const dateObj = new Date(rawDateStr);
  if (isNaN(dateObj)) return rawDateStr; // fallback in case of bad date
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

app.get('/api_2/candles/:symbol', (req, res) => {
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
    const closeVal = parseFloat(parseFloat(row['Close']).toFixed(2));
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

app.get('/api_2/info/:symbol', (req, res) => {
  const { symbol } = req.params;
  yFinSymbol = symbol + ".NS"
  let found = false;

  const result = {};

  fs.createReadStream(stockInfoFilePath)
    .pipe(csv())
    .on('data', (row) => {
      if ((row.symbol || '').toUpperCase() === yFinSymbol.toUpperCase()) {
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

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
