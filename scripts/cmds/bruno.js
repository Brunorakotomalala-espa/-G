const axios = require("axios");

// Dictionnaire pour stocker l'historique des conversations par utilisateur
let conversationHistory = {};

// Fonction pour corriger automatiquement la phrase et utiliser l'API Gemini
async function Bruno(prompt, customId, link = null) {
    try {
        // Initialiser l'historique pour l'utilisateur s'il n'existe pas encore
        if (!conversationHistory[customId]) {
            conversationHistory[customId] = [];
        }

        // Ajouter la nouvelle entrée (texte et/ou lien de l'image) à l'historique
        if (link) {
            conversationHistory[customId].push({ prompt: "Image reçue", link });
        } else {
            conversationHistory[customId].push({ prompt });
        }

        // Encodage du prompt pour l'utiliser dans l'URL de l'API TextGears
        const encodedPrompt = encodeURIComponent(prompt);

        // Requête à l'API TextGears pour la correction automatique de phrases
        const correctionRes = await axios.get(`https://api.textgears.com/correct?text=${encodedPrompt}&language=fr-FR&key=X2ePBKvJHFHYUMzE`);

        // Obtenir la correction de l'API
        const correctedText = correctionRes.data.response.corrected || prompt; // Utilise le texte original s'il n'y a pas de correction

        // Ajouter la correction à l'historique
        conversationHistory[customId].push({ prompt: correctedText });

        // Préparer les données pour l'API Gemini
        const geminiData = {
            prompt: correctedText,
            customId,
            link // Lien de l'image s'il est présent
        };

        // Faire la requête POST à l'API Gemini pour continuer la discussion
        const geminiRes = await axios.post(`https://app-j3tw.vercel.app/api/gemini`, geminiData);

        // Ajouter un titre à la réponse avec la mise en forme demandée
        const title = "❤🍟Bruno IA ESPA🍟❤\n\n";
        const correctionSection = `💥Correction automatique👈:\n${correctedText}\n\n`;
        const responseSection = `🐓Réponse🐔:\n${geminiRes.data.message}`;

        // Combiner toutes les parties pour former la réponse complète
        const responseWithTitle = `${title}${correctionSection}${responseSection}`;

        // Retourner le message de réponse avec la mise en forme
        return responseWithTitle;
    } catch (error) {
        return error.message;
    }
}

module.exports = {
    config: { 
        name: "Bruno", 
        category: "ai"
    },
    onStart: async ({ message: { reply: r }, args: a, event: { senderID: s, messageReply }, commandName }) => {
        let res;

        // Si une image est envoyée avec le message
        if (messageReply?.attachments?.[0]?.type === "photo") {
            // Le bot répond à l'image via l'API
            res = await Bruno("Merci pour l'image ! Que voulez-vous savoir à propos de cette image ?", s, messageReply.attachments[0].url);
        } else {
            // Sinon, traitement normal du texte
            res = await Bruno(a.join(" ") || "hello", s);
        }

        // Envoyer la réponse et stocker l'identifiant du message pour les réponses continues
        const { messageID: m } = await r(res);
        global.GoatBot.onReply.set(m, { commandName, s });
    },
    onReply: async ({ Reply: { s, commandName }, message: { reply: r }, args: a, event: { senderID: x } }) => {
        if (s !== x) return;

        // Le bot répond en tenant compte de l'historique de conversation complet
        const res = await Bruno(a.join(" ") || "hello", s);
        const { messageID: m } = await r(res);
        global.GoatBot.onReply.set(m, { commandName, m, s });
    }
};
