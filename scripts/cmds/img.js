// Fonction pour appliquer le style de police fancytext
function formatFont(text) {
  const fontMapping = {
    a: "𝚊", b: "𝚋", c: "𝚌", d: "𝚍", e: "𝚎", f: "𝚋", g: "𝚐", h: "𝚑", i: "𝚒", j: "𝚓", k: "𝚔", l: "𝚕", m: "𝚖",
    n: "𝚗", o: "𝚘", p: "𝚙", q: "𝚚", r: "𝚛", s: "𝚜", t: "𝚝", u: "𝚞", v: "𝚟", w: "𝚠", x: "𝚡", y: "𝚢", z: "𝚣",
    A: "𝙰", B: "𝙱", C: "𝙲", D: "𝙳", E: "𝙴", F: "𝙵", G: "𝙶", H: "𝙷", I: "𝙸", J: "𝙹", K: "𝙺", L: "𝙻", M: "𝙼",
    N: "𝙽", O: "𝙾", P: "𝙿", Q: "𝚀", R: "𝚁", S: "𝚂", T: "𝚃", U: "𝚄", V: "𝚅", W: "𝚆", X: "𝚇", Y: "𝚈", Z: "𝚉"
  };

  let formattedText = "";
  for (const char of text) {
    if (char in fontMapping) {
      formattedText += fontMapping[char];
    } else {
      formattedText += char;
    }
  }
  return formattedText;
}

const axios = require("axios");

// Dictionnaire pour stocker l'historique des conversations par utilisateur
let conversationHistory = {};
let imageCache = {}; // Stocker l'image temporairement par utilisateur

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

        // Ajouter le titre à la réponse avec fancy text
        const title = "🍟❤️𝔹𝕣𝕦𝕟𝕠 𝕀𝔸 𝔼𝕊ℙ𝔸❤️🍟\n ";
        let responseWithTitle = `${title}${res.data.message}`;

        // Formater la réponse avec la fonction formatFont
        responseWithTitle = formatFont(responseWithTitle);

        // Retourner le message de réponse avec le titre et le style fancy text
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
            // Stocker l'image dans le cache
            const imageUrl = event.attachments[0].url;
            imageCache[senderID] = imageUrl;

            // Envoyer un message demandant à l'utilisateur d'ajouter un texte à propos de la photo
            res = "✨Photo reçue avec succès !✨\n Pouvez-vous ajouter un texte pour m'expliquer ce que vous voulez savoir à propos de cette photo ?";
            api.sendMessage(res, event.threadID);

        } else if (imageCache[senderID]) {
            // Si une image a été précédemment envoyée, utiliser le message actuel comme prompt
            const imageUrl = imageCache[senderID];
            res = await img(message || "Merci pour l'image !", senderID, imageUrl);
            delete imageCache[senderID]; // Nettoyer le cache une fois l'image traitée
        } else {
            // Sinon, traitement normal du texte
            res = await img(message || "hello", senderID);
        }

        // Envoyer la réponse à l'utilisateur si ce n'était pas déjà fait
        if (!imageCache[senderID]) {
            api.sendMessage(res, event.threadID);
        }
    }
};
