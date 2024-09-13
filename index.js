const { spawn } = require("child_process");
const log = require("./logger/log.js");

function startProject() {
const child = spawn("node", ["Goat.js"], {
cwd: __dirname,
stdio: "inherit",
shell: true
});

child.on("close", (code) => {
if (code == 2) {
log.info("Restarting Project...");
startProject();
}
});
}

startProject();

const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'temp', 'chatbot.html'));
});

const { RsnChat } = require('rsnchat');

const rsnchat = new RsnChat('rsnai_C5Y6ZSoUt3LRAWopF6PQ2Uef');

app.get('/architecture', async (req, res) => {
const query = req.query.ask;
if (!query) {
return res.status(400).json({ error: 'Your question is missing.' });
}

try {
const response = await rsnchat.gpt(query);
const jsonResponse = { architecture: response.message };
res.json(jsonResponse);
} catch (error) {
res.status(500).json({ error: 'An error occurred: ' + error.message });
}
});

app.listen(port, () => {
console.log(`Server is running on http://localhost:${port}`);
});

