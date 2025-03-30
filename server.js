const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Define backend directory dynamically
const backendDir = __dirname; // Works across all platforms
const dataFilePath = path.join(backendDir, "data.json");

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static(path.join(backendDir, "public")));

// Ensure `data.json` exists and has a valid structure
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(
        dataFilePath,
        JSON.stringify({ deposits: [], selections: [], totalA: 0, totalB: 0 }, null, 2)
    );
}

// Load JSON data safely
const loadData = () => {
    try {
        return JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    } catch (error) {
        console.error("Error reading data.json:", error);
        return { deposits: [], selections: [], totalA: 0, totalB: 0 };
    }
};

// Save JSON data safely
const saveData = (jsonData) => {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(jsonData, null, 2));
    } catch (error) {
        console.error("Error writing to data.json:", error);
    }
};

// Get all data (GET /data)
app.get("/data", (req, res) => {
    res.json(loadData());
});

// Save deposit or selection (POST /save-selection)
app.post("/save-selection", (req, res) => {
    let jsonData = loadData();

    if (!jsonData.deposits || !Array.isArray(jsonData.deposits)) jsonData.deposits = [];
    if (!jsonData.selections || !Array.isArray(jsonData.selections)) jsonData.selections = [];
    if (jsonData.totalA === undefined) jsonData.totalA = 0;
    if (jsonData.totalB === undefined) jsonData.totalB = 0;

    const { phone, name, depositAmount, choice, type } = req.body;

    if (!phone || !name || !depositAmount || isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    if (type === "deposit") {
        if (jsonData.deposits.some(d => d.phone === phone)) {
            return res.status(400).json({ error: "User has already deposited" });
        }
        jsonData.deposits.push({ phone, name, depositAmount, time: new Date().toISOString(), type });
    } 
    else if (type === "selection") {
        jsonData.selections.push({ phone, name, depositAmount, choice, time: new Date().toISOString(), type });

        if (choice === "A") jsonData.totalA += depositAmount;
        else if (choice === "B") jsonData.totalB += depositAmount;
    } 
    else {
        return res.status(400).json({ error: "Invalid type" });
    }

    saveData(jsonData);
    res.json({ success: true, message: "Data saved successfully!" });
});

// Get total deposits for A & B (GET /total-deposits)
app.get("/total-deposits", (req, res) => {
    let jsonData = loadData();
    res.json({ totalA: jsonData.totalA, totalB: jsonData.totalB });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

