const axios = require('axios');

module.exports = {
  config: {
    name: "bitcoin",
    author: "cliff", // API by hazey
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Finance",
    shortDescription: {
      en: "{p}bitcoin [currency]"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      // Récupère la devise demandée, ou utilise USD par défaut
      const currency = args[0] ? args[0].toUpperCase() : 'USD';
      
      // URL de l'API pour obtenir le prix du Bitcoin
      const apiUrl = 'https://api.coindesk.com/v1/bpi/currentprice.json';

      // Envoi d'une requête GET à l'API
      const response = await axios.get(apiUrl);

      // Vérifie si la réponse contient des données
      if (response.data && response.data.bpi && response.data.bpi[currency]) {
        // Récupère les informations de prix pour la devise demandée
        const priceData = response.data.bpi[currency];
        const priceMessage = `The current Bitcoin price in ${priceData.description} is ${priceData.symbol}${priceData.rate}.`;
        // Envoie le message au thread ID de l'événement
        api.sendMessage(priceMessage, event.threadID);
      } else {
        // Message en cas d'absence de données pour la devise demandée
        api.sendMessage(`Unable to get Bitcoin price for currency ${currency}.`, event.threadID);
      }

    } catch (error) {
      // En cas d'erreur, affiche un message d'erreur
      console.error('Error making Bitcoin API request:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
