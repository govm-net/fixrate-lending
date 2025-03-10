import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RestoreIcon from '@mui/icons-material/Restore';
import { useApi } from '../contexts/ApiContext';

const Settings = () => {
  const {
    apiEndpoints,
    selectedEndpoint,
    setSelectedEndpoint,
    addApiEndpoint,
    removeApiEndpoint,
    updateApiEndpoint,
    resetApiEndpoints
  } = useApi();

  const [openDialog, setOpenDialog] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [endpointName, setEndpointName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [endpointChainId, setEndpointChainId] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleOpenDialog = (index = -1) => {
    if (index >= 0) {
      // Edit existing endpoint
      const endpoint = apiEndpoints[index];
      setEndpointName(endpoint.name);
      setEndpointUrl(endpoint.url);
      setEndpointChainId(endpoint.chainId);
      setEditIndex(index);
    } else {
      // Add new endpoint
      setEndpointName('');
      setEndpointUrl('');
      setEndpointChainId(1);
      setEditIndex(-1);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveEndpoint = () => {
    if (!endpointName || !endpointUrl) {
      setSnackbarMessage('Please fill in all fields');
      setSnackbarOpen(true);
      return;
    }

    const endpoint = {
      name: endpointName,
      url: endpointUrl,
      chainId: endpointChainId
    };

    if (editIndex >= 0) {
      updateApiEndpoint(editIndex, endpoint);
      setSnackbarMessage('API endpoint updated successfully');
    } else {
      addApiEndpoint(endpoint);
      setSnackbarMessage('API endpoint added successfully');
    }

    setSnackbarOpen(true);
    handleCloseDialog();
  };

  const handleDeleteEndpoint = (index) => {
    removeApiEndpoint(index);
    setSnackbarMessage('API endpoint removed successfully');
    setSnackbarOpen(true);
  };

  const handleSelectEndpoint = (endpoint) => {
    setSelectedEndpoint(endpoint);
    setSnackbarMessage(`Connected to ${endpoint.name}`);
    setSnackbarOpen(true);
  };

  const handleResetEndpoints = () => {
    resetApiEndpoints();
    setSnackbarMessage('API endpoints reset to defaults');
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">API Endpoints</Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<RestoreIcon />}
                onClick={handleResetEndpoints}
                sx={{ mr: 1 }}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Endpoint
              </Button>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Configure the API endpoints for connecting to different networks. The selected endpoint will be used for all API calls.
          </Typography>

          <List>
            {apiEndpoints.map((endpoint, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem
                  button
                  selected={selectedEndpoint === endpoint}
                  onClick={() => handleSelectEndpoint(endpoint)}
                >
                  <ListItemText
                    primary={endpoint.name}
                    secondary={`${endpoint.url} (Chain ID: ${endpoint.chainId})`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleOpenDialog(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteEndpoint(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>

      {/* Add/Edit Endpoint Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editIndex >= 0 ? 'Edit API Endpoint' : 'Add API Endpoint'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Endpoint Name"
            fullWidth
            value={endpointName}
            onChange={(e) => setEndpointName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Endpoint URL"
            fullWidth
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Chain ID</InputLabel>
            <Select
              value={endpointChainId}
              onChange={(e) => setEndpointChainId(e.target.value)}
              label="Chain ID"
            >
              <MenuItem value={1}>1 - Ethereum Mainnet</MenuItem>
              <MenuItem value={5}>5 - Goerli Testnet</MenuItem>
              <MenuItem value={11155111}>11155111 - Sepolia Testnet</MenuItem>
              <MenuItem value={137}>137 - Polygon Mainnet</MenuItem>
              <MenuItem value={80001}>80001 - Mumbai Testnet</MenuItem>
              <MenuItem value={1337}>1337 - Local Development</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveEndpoint} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings; 