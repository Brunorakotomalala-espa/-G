  const axios = require("axios");

// ID de l'administrateur (remplacez par le vrai ID)
const ADMIN_ID = "100041841881488"; // Remplacez par l'ID réel de l'administrateur

// Variable globale pour contrôler si le bot doit répondre
let botEnabled = true;  // Initialement activé

// Dictionnaire pour stocker l'historique des conversations par utilisateur
let conversationHistory = {};
let imageCache = {}; // Stocker l'image temporairement par utilisateur

// Fonction modifiée pour gérer l'historique complet
async function principe(prompt, customId, link = null) {
    try {
        if (!conversationHistory[customId]) {
            conversationHistory[customId] = { prompts: [], lastResponse: "" };
        }

        if (link) {
            conversationHistory[customId].prompts.push({ prompt: "Image reçue", link });
        } else {
            conversationHistory[customId].prompts.push({ prompt });
        }

        let context = conversationHistory[customId].prompts.map(entry => entry.link ? `Image: ${entry.link}` : entry.prompt).join("\n");

        const data = {
            prompt: prompt,
            customId,
            link
        };

        const res = await axios.post(`https://gemini-ap-espa-bruno.onrender.com/api/gemini`, data); // Remplacé avec la nouvelle URL de l'API

        conversationHistory[customId].lastResponse = res.data.message;

        const title = "🍟❤️ Bruno IA ❤️🍟\n ";
        let responseWithTitle = `${title}${res.data.message}`;

        return responseWithTitle;
    } catch (error) {
        return `Erreur: ${error.message}`;
    }
}

module.exports = {
    config: {
        name: "principe",  // Le nouveau nom de la commande
        author: "Bruno",
        version: "1.0.0",
        category: "Ai",
        shortDescription: {
            en: "Automatic Image/Text Response Bot"
        }
    },

    onStart: async function ({ api }) {
        // Initialisation si nécessaire
    },

    onChat: async function ({ event, api }) {
        const message = event.body?.toLowerCase();
        const senderID = event.senderID;

        // Vérification des commandes administrateur "principe off" et "principe on"
        if (message === "principe off" || message === "principe on") {
            if (senderID !== ADMIN_ID) {
                api.sendMessage("❌ Vous n'avez pas la permission d'utiliser cette commande.", event.threadID);
                return;
            }

            if (message === "principe off") {
                botEnabled = false;
                api.sendMessage("🚫 Le bot est maintenant désactivé pour tous.", event.threadID);
                return;
            } else if (message === "principe on") {
                botEnabled = true;
                api.sendMessage("✅ Le bot est maintenant activé pour tous.", event.threadID);
                return;
            }
        }

        // Si le bot est désactivé, ne pas répondre, même à l'administrateur
        if (!botEnabled) {
            return;
        }

        let res;

        // Si une image est envoyée avec le message
        if (event.attachments?.[0]?.type === "photo") {
            const imageUrl = event.attachments[0].url;
            imageCache[senderID] = imageUrl;

            res = "✨Photo reçue avec succès !✨\n Pouvez-vous ajouter un texte pour m'expliquer ce que vous voulez savoir à propos de cette photo ?";
            api.sendMessage(res, event.threadID);

        } else if (imageCache[senderID]) {
            const imageUrl = imageCache[senderID];
            res = await principe(message || "Merci pour l'image !", senderID, imageUrl);
            delete imageCache[senderID];
        } else {
            res = await principe(message || "hello", senderID);
        }

        // Envoyer la réponse à l'utilisateur si ce n'était pas déjà fait
        if (!imageCache[senderID]) {
            api.sendMessage(res, event.threadID);
        }
    }
};
