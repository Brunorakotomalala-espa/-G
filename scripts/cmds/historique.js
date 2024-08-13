const axios = require('axios');

module.exports = {
  config: {
    name: "historique",
    author: "Bruno", // API by Bruno
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}historique"
    }
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const searchQuery = args.join(" ");

    if (!searchQuery) {
      return api.sendMessage("Veuillez fournir une requête de recherche (par exemple, histoire de la guerre anglo-népalaise).", threadID, messageID);
    }

    try {
      const response = await axios.get(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery)}`);

      if (response.data.title && response.data.extract) {
        const title = response.data.title;
        const extract = response.data.extract;
        api.sendMessage(`Informations sur "${title}" :\n${extract}`, threadID, messageID);
      } else {
        api.sendMessage(`Aucune information trouvée pour "${searchQuery}".`, threadID, messageID);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des informations historiques :", error);
      api.sendMessage("Une erreur est survenue lors de la récupération des informations historiques.", threadID, messageID);
    }
  }
};
