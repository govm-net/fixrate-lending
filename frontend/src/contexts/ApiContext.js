import React, { createContext, useState, useEffect, useContext } from 'react';

// Default API endpoints
const DEFAULT_API_ENDPOINTS = [
  {
    name: 'Mainnet API',
    url: 'https://api.fixratelending.example.com',
    chainId: 1
  },
  {
    name: 'Goerli Testnet API',
    url: 'https://testnet-api.fixratelending.example.com',
    chainId: 5
  },
  {
    name: 'Local Development',
    url: 'http://localhost:3001',
    chainId: 31337
  }
];

export const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  // Get saved endpoints from localStorage or use defaults
  const getSavedEndpoints = () => {
    const saved = localStorage.getItem('apiEndpoints');
    return saved ? JSON.parse(saved) : DEFAULT_API_ENDPOINTS;
  };

  const [apiEndpoints, setApiEndpoints] = useState(getSavedEndpoints);
  const [selectedEndpoint, setSelectedEndpoint] = useState(() => {
    const saved = localStorage.getItem('selectedEndpoint');
    return saved ? JSON.parse(saved) : apiEndpoints[0];
  });

  // Save endpoints to localStorage when they change
  useEffect(() => {
    localStorage.setItem('apiEndpoints', JSON.stringify(apiEndpoints));
  }, [apiEndpoints]);

  // Save selected endpoint to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedEndpoint', JSON.stringify(selectedEndpoint));
  }, [selectedEndpoint]);

  return (
    <ApiContext.Provider
      value={{
        apiEndpoints,
        setApiEndpoints,
        selectedEndpoint,
        setSelectedEndpoint
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};