const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Purchase = require('./models/Purchase');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

function getPriceForFruit(fruit) {
  const inventory = {
    apple: { count: 100, price: 2 },
    banana: { count: 100, price: 1.5 },
    pear: { count: 100, price: 2.3 },
    orange: { count: 100, price: 1.8 },
  };

  return inventory[fruit].price;
}

app.get('/purchases', async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ timestamp: 'desc' });
    res.status(200).json(purchases);
  } catch (err) {
    console.error('Failed to retrieve purchase history:', err);
    res.status(500).json({ error: 'Failed to retrieve purchase history' });
  }
});

app.post('/purchases', async (req, res) => {
  try {
    const { items, totalPrice } = req.body;
    const purchases = [];

    for (const item of items) {
      const { fruit, quantity } = item;
      const price = getPriceForFruit(fruit); // Retrieve the price for the selected fruit
      const purchase = new Purchase({ fruit, quantity, totalPrice, price }); // Include the price and totalPrice in the purchase document
      await purchase.save();
      purchases.push(purchase);
    }

    res.status(201).json(purchases);
  } catch (err) {
    console.error('Failed to save purchase:', err);
    res.status(500).json({ error: 'Failed to save purchase' });
  }
});

app.get('/fruits', async (req, res) => {
    try {
      const inventory = {
        apple: { count: 100, price: getPriceForFruit('apple') },
        banana: { count: 100, price: getPriceForFruit('banana') },
        pear: { count: 100, price: getPriceForFruit('pear') },
        orange: { count: 100, price: getPriceForFruit('orange') },
      };
  
      // Fetch the purchases from the database and update the counts
      const purchases = await Purchase.aggregate([
        {
          $group: {
            _id: '$fruit',
            totalQuantity: { $sum: '$quantity' },
          },
        },
      ]);
  
      // Update the inventory counts based on the purchases
      purchases.forEach((purchase) => {
        inventory[purchase._id].count -= purchase.totalQuantity;
      });
  
      res.json(inventory);
    } catch (err) {
      console.error('Failed to retrieve inventory:', err);
      res.status(500).json({ error: 'Failed to retrieve inventory' });
    }
  });


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
