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


const getStockReturns = async (symbolWithNS) => {
  if (!symbolWithNS) {
      return resolve({ '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A', '6M': 'N/A', '1Y': 'N/A', 
        'ltpVs52WHigh': 'N/A' });
  }

  // use .BO for BSE
  const symbol = symbolWithNS.replace('.NS', '');
  const csvPath = path.join(candleDataFolder, `${symbol}.csv`);
  
  const candles = [];

  if (!fs.existsSync(csvPath)) {
      return resolve({ '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A', '6M': 'N/A', '1Y': 'N/A', 
        'ltpVs52WHigh': 'N/A' });
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
            return resolve({ '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A', '6M': 'N/A', '1Y': 'N/A', 
              'ltpVs52WHigh': 'N/A' });
        }

        const latest = candles[candles.length - 1];
        // Take last 252 business days (or whatever is available)
        const last252Candles = candles.slice(Math.max(candles.length - 252, 0));

        // Find maximum close price in last 252 days
        const highest52WClose = Math.max(...last252Candles);

        // Calculate LTP vs 52W High
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

        resolve({
          '1D': calc(1),
          '1W': calc(5),
          '1M': calc(22),
          '3M': calc(66),
          '6M': calc(132),    // approx. 6 months (22 trading days × 6)
          '1Y': calc(252),    // approx. 1 year
          'ltpVs52WHigh': ltpVs52WHigh
        });
      })
      .on('error', () => {
        resolve({ '1D': 'N/A', '1W': 'N/A', '1M': 'N/A', '3M': 'N/A', '6M': 'N/A', '1Y': 'N/A', 'ltpVs52WHigh': 'N/A' });
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
      industryData[industry].stocks.push({
        symbol: row['longName'] ? row['longName']  : row['symbol'] ,
        marketCap: parseFloat(row['marketCap'] || '0'), // read market cap safely
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

    data.weightedReturns = {
      '1D': weightedAverage('1D'),
      '1W': weightedAverage('1W'),
      '1M': weightedAverage('1M'),
      '3M': weightedAverage('3M'),
      '6M': weightedAverage('6M'),
      '1Y': weightedAverage('1Y'),
      'ltpVs52WHigh': weightedAverage('ltpVs52WHigh')
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

app.get('/api/announcements', (req, res) => {
  const results = [];
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  fs.createReadStream(announcementPath)
    .pipe(csv())
    .on('data', (row) => {
      const dtStr = row.an_dt || row.sort_date || '';
      const parsed = new Date(dtStr);

      if (!isNaN(parsed) && parsed >= twoDaysAgo) {
        results.push(row);
      }
    })
    .on('end', () => res.json(results))
    .on('error', err => res.status(500).json({ error: 'Failed to load announcements' }));
});

app.get('/api/events', (req, res) => {
  const results = [];
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  fs.createReadStream(eventsPath)
    .pipe(csv())
    .on('data', (row) => {
      const dtStr = row.date || '';
      const parsed = new Date(dtStr);

      if (!isNaN(parsed) && parsed >= twoDaysAgo) {
        results.push(row);
      }
    })
    .on('end', () => res.json(results))
    .on('error', err => res.status(500).json({ error: 'Failed to load events' }));
});

// ========================================================================

app.get('/api_2/:type', (req, res) => {
  const { type } = req.params;

  const filePath = csvPaths[type];
  if (!filePath) {
    return res.status(400).json({ error: `Unknown type '${type}'` });
  }

  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      results.push(row);
    })
    .on('end', () => res.json(results))
    .on('error', err => {
      console.error(`Error reading file for type '${type}':`, err);
      res.status(500).json({ error: `Failed to load data for type '${type}'` });
    });
});


app.listen(5000, () => {
  console.log('Server running on port 5000');
});
