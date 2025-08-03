import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import Announcements from './Announcements'; // you will create this
import SymbolPage from './SymbolPage';
import UpcomingEvents from './UpcomingEvents';
import FundRaise from './FundRaise';
import Trades from './Trades';
import AboutUs from './AboutUs';
import Terms from './Terms';
import Contact from './Contact';
import Results from './Results';
import News from './News';

import Footer from './Footer';

function App() {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: '20px 20px 20px' }}>  {/* extra bottom padding to prevent overlap */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/upcoming_events" element={<UpcomingEvents />} />
          <Route path="/fund_raise" element={<FundRaise />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="symbol/:symbol" element={<SymbolPage />} /> {/* Dynamic symbol route */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/results" element={<Results />} />
          <Route path="/news" element={<News />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;