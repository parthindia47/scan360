import React, { useEffect, useState } from 'react';
import axios from 'axios';

function News() {

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Latest Market News</h2>
      <a
        href="https://iinvest.cogencis.com/news"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        iinvest
      </a>
      <br/>
      <a
        href="https://economictimes.indiatimes.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        economic times
      </a>
      <br/>
      <a
        href="https://pulse.zerodha.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Zerodha Pulse
      </a>


      <h2 className="text-xl font-bold mb-2 mt-2">Global News</h2>
      <a
        href="https://www.bbc.com/news/world"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        BBC world news
      </a>
      <br/>

      <h2 className="text-xl font-bold mb-2 mt-2">Magazines</h2>
      <a
        href="https://smartinvestment.in/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Smart Investment
      </a>
      <br/>
      <a
        href="https://www.dsij.in/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Dalal Street
      </a>
      <br/>
      <a
        href="https://www.capitalmarket.com/news"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Capital Market
      </a>


      <h2 className="text-xl font-bold mb-2 mt-2">Forums</h2>
      <a
        href="https://forum.valuepickr.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Value Picker
      </a>
      <br/>
      <a
        href="https://tradingqna.com/c/stocks/13"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Trading qna
      </a> 
      <br/>
      <a
        href="https://www.reddit.com/r/IndianStreetBets/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Reddit : IndianStreetBets
      </a>
      <br/>
      <a
        href="https://www.reddit.com/r/IndiaInvestments/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        Reddit : IndiaInvestments
      </a> 
    </div>
  );
}

export default News;
