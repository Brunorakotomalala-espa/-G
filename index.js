require('dotenv').config(); // Charger les variables d'environnement depuis le fichier .env

const { spawn } = require("child_process");
const log = require("./logger/log.js");
const express = require('express');
const axios = require('axios');
const path = require('path');
const { RsnChat } = require('rsnchat');

const app = express();
const port = process.env.PORT || 3000;

// Lire les tokens depuis les variables d'environnement
const pageAccessToken = process.env.PAGE_ACCESS_TOKEN;
const verificationToken = process.env.VERIFY_TOKEN;
const rsnchatApiKey = process.env.RSNCHAT_API_KEY;

if (!pageAccessToken || !verificationToken || !rsnchatApiKey) {
    throw new Error('PAGE_ACCESS_TOKEN, VERIFY_TOKEN, and RSNCHAT_API_KEY must be set in the environment variables.');
}

const rsnchat = new RsnChat(rsnchatApiKey); // Utilisez la clé API RSNChat depuis les variables d'environnement

function startProject() {
    const child = spawn("node", ["Goat.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (code) => {
        if (code === 2) {
            log.info("Restarting Project...");
            startProject();
        } else if (code !== 0) {
            log.error(`Process exited with code ${code}`);
        }
    });
}

startProject();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'temp', 'chatbot.html'));
});

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
        log.error(`Error in /architecture endpoint: ${error.message}`);
        res.status(500).json({ error: 'An error occurred: ' + error.message });
    }
});

// Ajouter une vérification pour le webhook
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === verificationToken) {
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
