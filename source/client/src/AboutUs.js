import React from 'react';

function AboutUs() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">About Scan360</h1>

      <p className="mb-6 text-lg">
        <strong>Scan360</strong> is a modern platform built to help investors, traders, and analysts make smarter decisions
        in the stock market. Our mission is to simplify the complexity of financial data and transform it into meaningful insights.
      </p>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
      <p className="mb-6">
        We aim to empower users with various financial metrics, smart filtering tools, and industry-level tracking so they
        can scan opportunities across multiple sectors — all in one place.
      </p>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">What Scan360 Offers</h2>
      <ul className="list-disc list-inside space-y-3 mb-6">
        <li>
          <strong>Industry Heatmaps:</strong> Visualize how different sectors are performing.
        </li>
        <li>
          <strong>Stock Filtering:</strong> Filter stocks based on PE ratio, ROE, Market Cap, and custom metrics.
        </li>
        <li>
          <strong>Announcements & Events:</strong> Stay updated with latest earnings, fundraises, and corporate actions.
        </li>
        <li>
          <strong>AI-Powered Insights:</strong> Use intelligent tools to uncover trends and forecasts.
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
