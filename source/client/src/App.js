import React, { useEffect, useState } from 'react';
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
import Resources from './Resources';
import Ai from './Ai';
import Chat from './Chat'
import News from './News'

import Footer from './Footer';

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

// First value → top = 5px
// Second value → right and left = 5px
// Third value → bottom = 20px

  return (
    <Router>
      <Navbar />
        <div
          style={{
            padding: isMobile ? "5px 5px 20px" : "20px 20px 20px"
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/upcoming_events" element={<UpcomingEvents />} />
            <Route path="/fund_raise" element={<FundRaise />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="symbol/:symbol" element={<SymbolPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/results" element={<Results />} />
            <Route path="/News" element={<News />} />
            <Route path="/Resources" element={<Resources />} />
            <Route path="/ai" element={<Ai />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </div>
      <Footer />
    </Router>
  );
}

export default App;