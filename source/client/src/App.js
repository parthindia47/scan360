import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import Announcements from './Announcements'; // you will create this
import SymbolPage from './SymbolPage';
import UpcomingEvents from './UpcomingEvents';
import FundRaise from './FundRaise';

import Footer from './Footer';

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: '20px 20px 60px' }}>  {/* extra bottom padding to prevent overlap */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/upcoming_events" element={<UpcomingEvents />} />
          <Route path="/fund_raise" element={<FundRaise />} />
          <Route path="symbol/:symbol" element={<SymbolPage />} /> {/* Dynamic symbol route */}
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;