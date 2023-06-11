import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';

function App() {
  const [items, setItems] = useState([{ fruit: '', quantity: 0 }]);
  const [inventory, setInventory] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [purchaseHistory, setPurchaseHistory] = useState([]);

  useEffect(() => {
    // Fetch inventory data
    axios
      .get('http://localhost:3001/fruits')
      .then((response) => {
        setInventory(response.data);
      })
      .catch((error) => {
        console.error('Failed to fetch inventory:', error);
      });
  }, []);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleAddItem = () => {
    setItems([...items, { fruit: '', quantity: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handlePurchase = () => {
    let totalPrice = 0;
    const updatedInventory = { ...inventory };

    for (const item of items) {
      const { fruit, quantity } = item;

      // Check if the fruit exists in the inventory and the quantity is greater than 0
      if (updatedInventory[fruit] && updatedInventory[fruit].count >= quantity && quantity > 0) {
        totalPrice += updatedInventory[fruit].price * quantity;
        updatedInventory[fruit].count -= quantity;
      }
    }

    setTotalPrice(totalPrice);
    setInventory(updatedInventory);

    // Send the purchase data to the backend
    axios
      .post('http://localhost:3001/purchases', { items, totalPrice })
      .then((response) => {
        console.log('Purchase saved:', response.data);
        // Fetch the updated inventory after successful purchase
        axios
          .get('http://localhost:3001/fruits')
          .then((response) => {
            setInventory(response.data);
          })
          .catch((error) => {
            console.error('Failed to fetch inventory:', error);
          });
      })
      .catch((error) => {
        console.error('Failed to save purchase:', error);
      });
  };

  const handleHistory = () => {
    axios
      .get('http://localhost:3001/purchases')
      .then((response) => {
        setPurchaseHistory(response.data);
      })
      .catch((error) => {
        console.error('Failed to fetch purchase history:', error);
      });
  };

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Button variant="contained" onClick={handleHistory} sx={{ mt: 2 }}>
          Show Purchase History
        </Button>
        <Typography mt={4} variant="h4" align="left" gutterBottom>
          Total Amount: ${totalPrice}
        </Typography>
        <Grid container spacing={2}>
          {items.map((item, index) => (
            <Grid item xs={12} key={index}>
              <FormControl fullWidth>
                <Select
                  value={item.fruit}
                  onChange={(e) => handleItemChange(index, 'fruit', e.target.value)}
                >
                  <MenuItem value="">Select Fruit</MenuItem>
                  {Object.entries(inventory).map(([fruit, details]) => (
                    <MenuItem key={fruit} value={fruit}>
                      {`${fruit} (${details.count} left)`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                sx={{ mt: 2 }}
              />
              <Button variant="outlined" onClick={handleAddItem} sx={{ mt: 2, mr: 2 }}>
                Add Row
              </Button>
              <Button variant="outlined" onClick={() => handleRemoveItem(index)} sx={{ mt: 2 }}>
                Remove Row
              </Button>
            </Grid>
          ))}
        </Grid>
        <Button variant="contained" onClick={handlePurchase} sx={{ mt: 2, mr: 2 }}>
          Purchase
        </Button>
        {purchaseHistory.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fruit</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total Price($)</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseHistory.map((purchase) => (
                <TableRow key={purchase._id}>
                  <TableCell>{purchase.fruit}</TableCell>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>{purchase.totalPrice}</TableCell>
                  <TableCell>{purchase.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </Container>
  );
}

export default App;
