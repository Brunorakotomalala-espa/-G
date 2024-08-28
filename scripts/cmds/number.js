const axios = require('axios');

module.exports = {
  config: {
    name: "number",
    author: "cliff", // API by hazey
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Fun",
    shortDescription: {
      en: "{p}numberfact [number]"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      // Récupère le nombre depuis les arguments, ou utilise 1 par défaut
      const number = args[0] || '1';
      
      // URL de l'API pour obtenir un fait sur le nombre
      const apiUrl = `http://numbersapi.com/${number}`;

      // Envoi d'une requête GET à l'API
      const response = await axios.get(apiUrl);

      // Vérifie si la réponse contient des données
      if (response.data) {
        // Envoie le fait trouvé au thread ID de l'événement
        api.sendMessage(response.data, event.threadID);
      } else {
        // Message en cas d'absence de données
        api.sendMessage("Unable to get a fact for that number.", event.threadID);
      }

    } catch (error) {
      // En cas d'erreur, affiche un message d'erreur
      console.error('Error making Numbers API request:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
