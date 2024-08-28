const axios = require('axios');

module.exports = {
  config: {
    name: "advice",
    author: "cliff", // API by hazey
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}advice [text]"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      // Récupère le texte fourni par l'utilisateur, s'il y en a
      const userText = args.join(" ") || "Here's some advice for you:";

      // URL de l'API pour obtenir un conseil aléatoire
      const apiUrl = 'https://api.adviceslip.com/advice';

      // Envoi d'une requête GET à l'API
      const response = await axios.get(apiUrl);

      // Vérifie si la réponse contient des données
      if (response.data && response.data.slip && response.data.slip.advice) {
        // Récupère le texte du conseil
        const advice = response.data.slip.advice;
        // Envoie le texte personnalisé suivi du conseil au thread ID de l'événement
        api.sendMessage(`${userText}\n\nAdvice: ${advice}`, event.threadID);
      } else {
        // Message en cas d'absence de conseil
        api.sendMessage("Unable to get advice at the moment.", event.threadID);
      }

    } catch (error) {
      // En cas d'erreur, affiche un message d'erreur
      console.error('Error making Advice API request:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
