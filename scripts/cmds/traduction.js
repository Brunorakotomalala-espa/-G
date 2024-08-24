const axios = require('axios');

module.exports = {
  config: {
    name: "traduction",
    author: "Bruno", //api by Bruno
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}traduction"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (args.length < 3) {
        return api.sendMessage("Please provide source language, target language, and the text to translate.", event.threadID);
      }

      const sourceLang = args[0].toLowerCase(); // Langue source : fr, en, de, etc.
      const targetLang = args[1].toLowerCase(); // Langue cible : en, es, it, etc.
      const textToTranslate = encodeURIComponent(args.slice(2).join(" ")); // Texte à traduire

      // Définition de la paire de langues
      const apiUrl = `https://api.mymemory.translated.net/get?q=${textToTranslate}&langpair=${sourceLang}|${targetLang}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.responseData && response.data.responseData.translatedText) {
        const translatedText = response.data.responseData.translatedText;

        // Ajout du titre et du retour à la ligne
        const message = `❤️AI traduction❤️\n\n${translatedText}`;
        api.sendMessage(message, event.threadID);

      } else {
        api.sendMessage("Unable to get a translation.", event.threadID);
      }
    } catch (error) {
      console.error('Error making MyMemory API request:', error.message);
      api.sendMessage("An error occurred while processing your translation request.", event.threadID);
    }
  }
};
