import React, { createContext, useState, useEffect, useContext } from 'react';

// Default API endpoints
const DEFAULT_API_ENDPOINTS = [
  {
    name: 'Mainnet API',
    url: 'https://api.p2plending.example.com',
    chainId: 1
  },
  {
    name: 'Goerli Testnet API',
    url: 'https://testnet-api.p2plending.example.com',
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

  // Add a new API endpoint
  const addApiEndpoint = (endpoint) => {
    setApiEndpoints([...apiEndpoints, endpoint]);
  };

  // Remove an API endpoint
  const removeApiEndpoint = (index) => {
    const newEndpoints = [...apiEndpoints];
    newEndpoints.splice(index, 1);
    setApiEndpoints(newEndpoints);
    
    // If the selected endpoint was removed, select the first one
    if (selectedEndpoint === apiEndpoints[index]) {
      setSelectedEndpoint(newEndpoints[0]);
    }
  };

  // Update an existing API endpoint
  const updateApiEndpoint = (index, endpoint) => {
    const newEndpoints = [...apiEndpoints];
    newEndpoints[index] = endpoint;
    setApiEndpoints(newEndpoints);
    
    // If the selected endpoint was updated, update the selection
    if (selectedEndpoint === apiEndpoints[index]) {
      setSelectedEndpoint(endpoint);
    }
  };

  // Reset to default API endpoints
  const resetApiEndpoints = () => {
    setApiEndpoints(DEFAULT_API_ENDPOINTS);
    setSelectedEndpoint(DEFAULT_API_ENDPOINTS[0]);
  };

  return (
    <ApiContext.Provider
      value={{
        apiEndpoints,
        selectedEndpoint,
        setSelectedEndpoint,
        addApiEndpoint,
        removeApiEndpoint,
        updateApiEndpoint,
        resetApiEndpoints
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

// Custom hook to use the API context
export const useApi = () => useContext(ApiContext); 