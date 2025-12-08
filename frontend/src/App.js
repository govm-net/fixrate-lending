import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './components/Home';
import LendingPool from './components/LendingPool';
// import LendingPoolWithLP from './components/LendingPoolWithLP';  // Removed LP version
import UnifiedMatching from './components/UnifiedMatching';
import LiquidityMining from './components/LiquidityMining';
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
          {/* <Route path="/lending-pool-with-lp" element={<LendingPoolWithLP />} />  Removed LP version */}
          <Route path="/unified-matching" element={<UnifiedMatching />} />
          <Route path="/liquidity-mining" element={<LiquidityMining />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}

export default App;