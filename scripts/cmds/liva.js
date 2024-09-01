const axios = require('axios');

module.exports = {
  config: {
    name: "liva",
    author: "Bruno",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "Automatic Response Bot"
    }
  },
  onStart: async function ({ api }) {
    // Initialisation si nécessaire
  },
  onChat: async function ({ event, api }) {
    const message = event.body.toLowerCase();

    // Titre à ajouter à chaque réponse
    const title = "𝗜𝗡𝗧𝗘𝗟𝗟𝗜𝗚𝗘𝗡𝗧 𝗔𝗜\n▬▬▬▬▬▬▬▬▬▬\n";

    // Réponse automatique pour les messages spécifiques
    if (message.includes("bonjour") || message.includes("hello")) {
      api.sendMessage(`${title}Bonjour! Comment puis-je vous aider aujourd'hui?`, event.threadID);
      return;
    }

    // Logique pour traiter d'autres messages avec l'API
    try {
      const prompt = encodeURIComponent(message);
      const apiUrl = `https://discussion-continue-gem29.vercel.app/api?ask=${prompt}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        api.sendMessage(`${title}${response.data.response}`, event.threadID);
      } else {
        api.sendMessage(`${title}Je n'ai pas pu obtenir de réponse à votre demande.`, event.threadID);
      }
    } catch (error) {
      console.error('Error making Llama API request:', error.message);
      api.sendMessage(`${title}Une erreur est survenue lors du traitement de votre demande.`, event.threadID);
    }
  }
};
