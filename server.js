const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;


app.use(cors());
app.use(express.json({ limit: "10mb" })); 


let products = [
  {
    id: 1,
    name: "Quantum Processor Unit",
    price: 450000,
    stock: 1,
    lowStockThreshold: 2,
    category: "Components",
    image: "",
  },
  {
    id: 2,
    name: "Neural Interface Headset",
    price: 120000,
    stock: 4,
    lowStockThreshold: 5,
    category: "Wearables",
    image: "",
  },
  {
    id: 3,
    name: "Holographic Display Emitter",
    price: 85000,
    stock: 1,
    lowStockThreshold: 3,
    category: "Displays",
    image: "",
  },
  {
    id: 4,
    name: "Fusion Battery Cell",
    price: 32000,
    stock: 45,
    lowStockThreshold: 10,
    category: "Power",
    image: "",
  },
  {
    id: 5,
    name: "Exoskeleton Armature",
    price: 750000,
    stock: 3,
    lowStockThreshold: 1,
    category: "Robotics",
    image: "",
  },
];




app.get("/products", (req, res) => {
  res.json(products);
});


app.post("/update-stock", (req, res) => {
  const { id, newQuantity } = req.body;

  if (id === undefined || newQuantity === undefined) {
    return res.status(400).json({ error: "Missing 'id' or 'newQuantity'." });
  }

  if (newQuantity < 0) {
    return res.status(400).json({ error: "Stock quantity cannot be negative." });
  }

  const productIndex = products.findIndex((p) => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found." });
  }

  products[productIndex].stock = newQuantity;

  res.json(products[productIndex]);
});


app.post("/add-product", (req, res) => {
  const { name, price, stock, category, lowStockThreshold, image } = req.body;

  if (!name || price === undefined || stock === undefined || !category) {
    return res.status(400).json({
      error: "Missing required fields: name, price, stock, category.",
    });
  }

  const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);

  const newProduct = {
    id: maxId + 1,
    name,
    price: Number(price),
    stock: Number(stock),
    lowStockThreshold: Number(lowStockThreshold || 5),
    category,
    image: image || "", 
  };

  products.push(newProduct);

  res.json(newProduct);
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Data stored in memory (will reset on restart)`);
});
