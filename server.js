const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Determine the writable data file path
const LOCAL_DATA_FILE = path.join(__dirname, 'data.json');
let DATA_FILE = LOCAL_DATA_FILE;

// Helper: Ensure file exists and is writable
const initializeDataFile = () => {
    try {
        // Check if we can write to the local file
        fs.accessSync(LOCAL_DATA_FILE, fs.constants.W_OK);
        DATA_FILE = LOCAL_DATA_FILE;
        console.log(`Using local data file: ${DATA_FILE}`);
    } catch (err) {
        // If not writable (likely EROFS), use temp dir
        console.warn("Local file is read-only. Switching to temporary storage.");
        DATA_FILE = path.join(os.tmpdir(), 'data.json');
        console.log(`Using temporary data file: ${DATA_FILE}`);

        // If temp file doesn't exist, copy from local or init empty
        if (!fs.existsSync(DATA_FILE)) {
            if (fs.existsSync(LOCAL_DATA_FILE)) {
                console.log("Copying existing data to temp file...");
                const initialData = fs.readFileSync(LOCAL_DATA_FILE);
                fs.writeFileSync(DATA_FILE, initialData);
            } else {
                console.log("Creating new empty data file in temp...");
                fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
            }
        }
    }

    // Final check to ensure whatever file we picked exists
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
};

// Helper: Read Data
// Helper: Read Data
const readData = () => {
    // We assume initializeDataFile() was called at startup, but we can verify existence lightly
    // or just let it fail if something deleted it mid-run
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
    initializeDataFile(); // Initialize on start
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Data stored in: ${DATA_FILE}`);
});
