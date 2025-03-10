import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './components/Home';
import LendingPool from './components/LendingPool';
import P2PMarketplace from './components/P2PMarketplace';
import MyOrders from './components/MyOrders';
import Settings from './components/Settings';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lending-pool" element={<LendingPool />} />
          <Route path="/p2p-marketplace" element={<P2PMarketplace />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}

export default App; 