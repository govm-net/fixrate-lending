import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ApiProvider } from './contexts/ApiContext';
import { Web3Provider } from './contexts/Web3Context';
import Navbar from './components/Navbar';
import Home from './components/Home';
import LendingPool from './components/LendingPool';
// import LendingPoolWithLP from './components/LendingPoolWithLP';  // Removed LP version
import UnifiedMatching from './components/UnifiedMatching';
import LiquidityMining from './components/LiquidityMining';
import MyOrders from './components/MyOrders';
import Settings from './components/Settings';
import Footer from './components/Footer';

// 确定基础路径
const basename = process.env.NODE_ENV === 'production' ? '/fixrate-lending' : '/';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <BrowserRouter basename={basename}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ApiProvider>
          <Web3Provider>
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
          </Web3Provider>
        </ApiProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;