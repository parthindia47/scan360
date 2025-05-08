import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import Announcements from './Announcements'; // you will create this
import SymbolPage from './SymbolPage';
import SmartMoney from './SmartMoney';
import NewsEvents from './NewsEvents';
import Footer from './Footer';

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: '20px 20px 60px' }}>  {/* extra bottom padding to prevent overlap */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/smart_money" element={<SmartMoney />} />
          <Route path="/news_events" element={<NewsEvents />} />
          <Route path="/:symbol" element={<SymbolPage />} /> {/* Dynamic symbol route */}
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;