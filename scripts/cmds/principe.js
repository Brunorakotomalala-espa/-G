const axios = require("axios");

// ID de l'administrateur (remplacez par le vrai ID)
const ADMIN_ID = "100041841881488"; // Remplacez par l'ID réel de l'administrateur

// Variable globale pour contrôler si le bot doit répondre
let botEnabled = true;  // Initialement activé

// Dictionnaire pour stocker l'historique des conversations par utilisateur
let conversationHistory = {};
let imageCache = {}; // Stocker l'image temporairement par utilisateur

// Fonction pour appliquer le style de police fancytext
function formatFont(text) {
  const fontMapping = {
    a: "𝚊", b: "𝚋", c: "𝚌", d: "𝚍", e: "𝚎", f: "𝚏", g: "𝚐", h: "𝚑", i: "𝚒", j: "𝚓", k: "𝚔", l: "𝚕", m: "𝚖",
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

        const res = await axios.post(`https://app-j3tw.vercel.app/api/gemini`, data); // Remplacez avec l'URL correcte de votre API

        conversationHistory[customId].lastResponse = res.data.message;

        const title = "🍟❤️𝔹𝕣𝕦𝕟𝕠 𝕀𝔸 𝔼𝕊ℙ𝔸❤️🍟\n ";
        let responseWithTitle = `${title}${res.data.message}`;

        responseWithTitle = formatFont(responseWithTitle);

        return responseWithTitle;
    } catch (error) {
        return `Erreur: ${error.message}`;
    }
}

module.exports = {
    config: {
        name: "principe",  // Le nouveau nom de la commande
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
                api.sendMessage("🚫 Le bot est maintenant désactivé.", event.threadID);
                return;
            } else if (message === "principe on") {
                botEnabled = true;
                api.sendMessage("✅ Le bot est maintenant activé.", event.threadID);
                return;
            }
        }

        // Si le bot est désactivé, ignorer les messages des utilisateurs non administrateurs
        if (!botEnabled && senderID !== ADMIN_ID) {
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
