const axios = require("axios");

// Dictionnaire pour stocker l'historique des conversations par utilisateur
let conversationHistory = {};

// Fonction modifiée pour ajouter un titre à la réponse
async function Aina(prompt, customId, link = null) {
    try {
        // Initialiser l'historique pour l'utilisateur s'il n'existe pas
        if (!conversationHistory[customId]) {
            conversationHistory[customId] = [];
        }

        // Ajouter la nouvelle entrée (texte et/ou lien de l'image) à l'historique
        if (link) {
            conversationHistory[customId].push({ prompt: "Image reçue", link });
        } else {
            conversationHistory[customId].push({ prompt });
        }

        // Préparer les données pour l'API
        const data = {
            prompt,
            customId,
            link // Lien de l'image s'il est présent
        };

        // Faire la requête POST à l'API Flask
        const res = await axios.post(`https://geminiavaoapi.onrender.com/`, data); // Remplace avec l'URL correcte de ton API

        // Ajouter le titre à la réponse avec un saut de ligne
        const title = "❤️🍟Aina IA ESPA🍟❤️ ";
        const responseWithTitle = `${title}\n${res.data.message}`;

        // Retourner le message de réponse avec le titre séparé
        return responseWithTitle;
    } catch (error) {
        return error.message;
    }
}

module.exports = {
    config: { 
        name: "Aina", 
        category: "ai"
    },
    onStart: async ({ message: { reply: r }, args: a, event: { senderID: s, messageReply }, commandName }) => {
        let res;

        // Si une image est envoyée avec le message
        if (messageReply?.attachments?.[0]?.type === "photo") {
            // Le bot répond à l'image via l'API
            res = await Aina("Merci pour l'image ! Que voulez-vous savoir à propos de cette image ?", s, messageReply.attachments[0].url);
        } else {
            // Sinon, traitement normal du texte
            res = await Aina(a.join(" ") || "hello", s);
        }

        const { messageID: m } = await r(res);
        global.GoatBot.onReply.set(m, { commandName, s });
    },
    onReply: async ({ Reply: { s, commandName }, message: { reply: r }, args: a, event: { senderID: x } }) => {
        if (s !== x) return;

        // Le bot répond en tenant compte de l'historique de conversation complet (y compris l'image précédemment reçue)
        const res = await Aina(a.join(" ") || "hello", s);
        const { messageID: m } = await r(res);
        global.GoatBot.onReply.set(m, { commandName, m, s });
    }
};
