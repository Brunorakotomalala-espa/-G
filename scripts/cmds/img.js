const axios = require("axios");

// Dictionnaire pour stocker l'historique des conversations par utilisateur
let conversationHistory = {};

// Fonction modifiée pour gérer l'historique complet
async function img(prompt, customId, link = null) {
    try {
        // Initialiser l'historique pour l'utilisateur s'il n'existe pas
        if (!conversationHistory[customId]) {
            conversationHistory[customId] = { prompts: [], lastResponse: "" };
        }

        // Ajouter le nouveau prompt à l'historique
        if (link) {
            conversationHistory[customId].prompts.push({ prompt: "Image reçue", link });
        } else {
            conversationHistory[customId].prompts.push({ prompt });
        }

        // Construire un résumé du contexte à partir des prompts précédents sans inclure la dernière réponse
        let context = conversationHistory[customId].prompts.map(entry => entry.link ? `Image: ${entry.link}` : entry.prompt).join("\n");

        // Préparer les données pour l'API (seulement le dernier prompt)
        const data = {
            prompt: prompt,
            customId,
            link // Lien de l'image s'il est présent
        };

        // Faire la requête POST à l'API Flask avec le dernier prompt uniquement
        const res = await axios.post(`https://app-j3tw.vercel.app/api/gemini`, data); // Remplace avec l'URL correcte de ton API

        // Stocker la nouvelle réponse
        conversationHistory[customId].lastResponse = res.data.message;

        // Ajouter le titre à la réponse
        const title = "❤️🍟Bruno IA ESPA🍟❤️ \n ";
        const responseWithTitle = `${title}${res.data.message}`;

        // Retourner le message de réponse avec le titre
        return responseWithTitle;
    } catch (error) {
        return `Erreur: ${error.message}`;
    }
}

module.exports = {
    config: {
        name: "img",
        author: "Bruno",
        version: "1.0.0",
        category: "Ai",
        shortDescription: {
            en: "Automatic Image/Text Response Bot"
        }
    },

    // Fonction appelée au démarrage du bot, si nécessaire
    onStart: async function ({ api }) {
        // Initialisation si nécessaire
    },

    // Fonction appelée à chaque message reçu
    onChat: async function ({ event, api }) {
        const message = event.body?.toLowerCase();
        const senderID = event.senderID;

        let res;

        // Si une image est envoyée avec le message
        if (event.attachments?.[0]?.type === "photo") {
            // Le bot répond à l'image via l'API
            const imageUrl = event.attachments[0].url;
            res = await img("Merci pour l'image ! Que voulez-vous savoir à propos de cette image ?", senderID, imageUrl);
        } else {
            // Sinon, traitement normal du texte
            res = await img(message || "hello", senderID);
        }

        // Envoyer la réponse à l'utilisateur
        api.sendMessage(res, event.threadID);
    }
};
