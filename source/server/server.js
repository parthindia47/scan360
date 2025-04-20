
const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
app.use(cors());

let industryData = {};

fs.createReadStream('./data/updated_yahoo_with_tji.csv')
  .pipe(csv())
  .on('data', (row) => {
    const industries = row['tjiIndustry']?.split('\\').flatMap(i => i.split('/').map(s => s.trim())) || [];
    industries.forEach(industry => {
      if (!industryData[industry]) {
        industryData[industry] = [];
      }
      industryData[industry].push({
        symbol: row['longName'],
        dummyData: generateDummyData()
      });
    });
  })
  .on('end', () => {
    console.log('CSV file processed.');
  });

function generateDummyData() {
  return {
    weight: Math.floor(Math.random() * 10) + 1,
    ltpVs52WHigh: (Math.random() * 50 - 30).toFixed(1) + '%',
    '1D': (Math.random() * 5).toFixed(1) + '%',
    '1W': (Math.random() * 15).toFixed(1) + '%',
    '1M': (Math.random() * 20).toFixed(1) + '%',
    '3M': (Math.random() * 25 - 10).toFixed(1) + '%'
  };
}

app.get('/industries', (req, res) => {
  res.json(industryData);
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
