const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

// Helper: Ensure file exists
const ensureDataFile = () => {
    if (!fs.existsSync(DATA_FILE)) {
        console.log("Creating new data file...");
        // Initialize with empty array or default structure if missing
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
};

// Helper: Read Data
const readData = () => {
    ensureDataFile();
    try {
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(rawData);
    } catch (err) {
        console.error("Error reading data file:", err);
        return [];
    }
};

// Helper: Write Data
const writeData = (data) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error("Error writing file:", err);
        throw new Error("Failed to save data.");
    }
};

// Routes

// GET /products
app.get('/products', (req, res) => {
    try {
        const products = readData();
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to read inventory data." });
    }
});

// POST /update-stock
app.post('/update-stock', (req, res) => {
    const { id, newQuantity } = req.body;

    if (id === undefined || newQuantity === undefined) {
        return res.status(400).json({ error: "Missing 'id' or 'newQuantity'." });
    }

    if (newQuantity < 0) {
        return res.status(400).json({ error: "Stock quantity cannot be negative." });
    }

    try {
        const products = readData();
        const productIndex = products.findIndex(p => p.id === id);

        if (productIndex === -1) {
            return res.status(404).json({ error: "Product not found." });
        }

        // Update stock
        products[productIndex].stock = newQuantity;

        // Save back to file
        writeData(products);

        // Return updated product
        res.json(products[productIndex]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to update inventory." });
    }
});

// POST /add-product
app.post('/add-product', (req, res) => {
    const { name, price, stock, category, lowStockThreshold } = req.body;

    // Basic Validation
    if (!name || price === undefined || stock === undefined || !category) {
        return res.status(400).json({ error: "Missing required fields: name, price, stock, category." });
    }

    try {
        const products = readData();

        // Calculate new ID
        const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
        const newProduct = {
            id: maxId + 1,
            name,
            price: Number(price),
            stock: Number(stock),
            lowStockThreshold: Number(lowStockThreshold || 5), // default to 5 if not provided
            category
        };

        products.push(newProduct);
        writeData(products);

        res.json(newProduct);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to add product." });
    }
});

// Start Server
app.listen(PORT, () => {
    ensureDataFile(); // Initialize on start
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Data stored in: ${DATA_FILE}`);
});
