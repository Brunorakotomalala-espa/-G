const axios = require('axios');

module.exports = {
  config: {
    name: "baiboly",
    author: "Bruno",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}baiboly"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      // Vérifie si un argument est fourni (pour le livre, le chapitre et le verset)
      if (!args[0]) {
        return api.sendMessage("Please provide a reference for the Bible verse (e.g., John 3:16).", event.threadID);
      }

      // Formate l'URL pour interroger l'API Bible
      const reference = encodeURIComponent(args.join(" "));
      const apiUrl = `https://bible-api.com/${reference}`;

      // Effectue la requête à l'API Bible
      const response = await axios.get(apiUrl);

      if (response.data && response.data.verses) {
        // Obtient le texte du verset
        const verseText = response.data.verses[0].text.trim();
        const referenceText = response.data.reference;

        // Traduit le texte du verset en malgache
        const translationUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(verseText)}&langpair=en|mg`;
        const translationResponse = await axios.get(translationUrl);
        const translatedText = translationResponse.data.responseData.translatedText;

        // Envoie le message avec le titre et la réponse formatés
        const message = `🍟Baiboly Malagasy🍟\n\n🙏Verse👉: ${referenceText}\n❤️Text💕 : ${translatedText}\n\nCréé par 🎉Bruno ESPA🎉`;
        api.sendMessage(message, event.threadID);
      } else {
        api.sendMessage("Unable to get the verse from the Bible.", event.threadID);
      }
    } catch (error) {
      console.error('Error making Bible API request:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
