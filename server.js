const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;  
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

const backendDir = __dirname;
const dataFilePath = path.join(backendDir, "data.json");

app.use(cors());  // Enable CORS for frontend API calls
app.use(express.json());
app.use(express.static(path.join(backendDir, "public")));  // Serve static files from public folder

// Initialize data if not available
const initializeData = async () => {
    try {
        await fs.access(dataFilePath);
        const data = await fs.readFile(dataFilePath, "utf8");
        JSON.parse(data); // to check if the data is valid
    } catch {
        const defaultData = { deposits: [], selections: [], totalA: 0, totalB: 0 };
        await fs.writeFile(dataFilePath, JSON.stringify(defaultData, null, 2));  // Create default data file if it doesn't exist
    }
};

// Load the data from data.json
const loadData = async () => {
    try {
        const data = await fs.readFile(dataFilePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading data.json:", error);
        return { deposits: [], selections: [], totalA: 0, totalB: 0 };
    }
};

// Save the updated data to data.json
const saveData = async (jsonData) => {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2));
    } catch (error) {
        console.error("Error writing to data.json:", error);
    }
};

// Route to get the data (deposits, selections, totalA, totalB)
app.get("/data", async (req, res) => {
    const jsonData = await loadData();
    res.json(jsonData);
});

// Route to save selection or deposit data
app.post("/save-selection", async (req, res) => {
    let jsonData = await loadData();

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
        if (jsonData.selections.some(s => s.phone === phone)) {
            return res.status(400).json({ error: "User has already selected an option" });
        }

        jsonData.selections.push({ phone, name, depositAmount, choice, time: new Date().toISOString(), type });

        if (choice === "A") jsonData.totalA += depositAmount;
        else if (choice === "B") jsonData.totalB += depositAmount;
    } 
    else {
        return res.status(400).json({ error: "Invalid type" });
    }

    await saveData(jsonData);
    res.json({ success: true, message: "Data saved successfully!" });
});

// Route to get the total deposits for A and B
app.get("/total-deposits", async (req, res) => {
    let jsonData = await loadData();
    res.json({ totalA: jsonData.totalA, totalB: jsonData.totalB });
});

// Initialize data and start server
initializeData().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});


