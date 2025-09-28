import React, { useEffect, useState } from 'react';

function AboutUs() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `About | Scan360`;

    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">About Scan360</h1>

      <p className="mb-6 text-lg">
        <strong>Scan360</strong> is a modern platform built to help investors, traders, and analysts make smarter decisions
        in the stock market. Our mission is to simplify the complexity of financial data and transform it into meaningful insights.
      </p>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
      <p className="mb-6">
        When a high-frequency trading giant pocketed ₹30,000 crore from the Indian markets, it became clear: the playing field in the options market is anything but level for retail traders. Competing with lightning-fast algorithms is a losing game.
        That's why we're building a different path — a powerful, easy-to-use tool designed for retail swing traders in the cash market. Our goal is simple: give everyday traders the data, insights, and edge they need to win.
      </p>

      <p className="mb-6">
        We aim to empower users with various financial metrics, smart filtering tools, and industry-level tracking so they
        can scan opportunities across multiple sectors — all in one place. We want to capture all the data which impact stock market. And we also want to focus on alternate data sources. Be it how the number of new job openings affects software companies, how marketing spending affects FMCG companies, social media following, how the number of app downloads impacts Zomato, or how gold prices influence jewelry stocks and gold finance companies. At Scan360, we're all about data and how it impacts stocks.
      </p>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Scan360 Release Plan</h2>
      <ul className="list-disc list-inside space-y-3 mb-6">
        <li>
          <strong>Gen 1:</strong> Data Categorization, Data Capturing, Data Visualization
        </li>
        <li>
          <strong>Gen 2:</strong> User Login, Chat, Artificial Intelligence
        </li>
        <li>
          <strong>Gen 3:</strong> Automated Suggestion, Automated anomaly detection, Hedging Suggestion
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose Us?</h2>
      <p className="mb-6">
        Whether you're a retail investor or a seasoned analyst, Scan360 delivers the clarity and speed you need to stay ahead in the markets.
        Our commitment is to transparency, simplicity, and user-focused innovation.
      </p>

      <p className="text-base text-gray-600">
        Built with ❤️ by finance and tech enthusiasts. If you have feedback or collaboration ideas, feel free to <a href="/contact" className="text-blue-600 underline">contact us</a>.
      </p>
    </div>
  );
}

export default AboutUs;
