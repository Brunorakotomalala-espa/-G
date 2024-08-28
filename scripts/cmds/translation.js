const axios = require('axios');

// Taille maximale des morceaux de texte à envoyer à l'API
const MAX_LENGTH = 500;

module.exports = {
  config: {
    name: "translation",
    author: "cliff",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Fun",
    shortDescription: {
      en: "{p}translate [source-lang] [target-lang] texte"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const sourceLanguage = args[0].trim();
      const targetLanguage = args[1].trim();
      const textToTranslate = args.slice(2).join(" ");

      if (!sourceLanguage || !targetLanguage || !textToTranslate) {
        return api.sendMessage("Veuillez fournir une langue source, une langue cible et un texte à traduire. Exemple : -translate en fr Hello", event.threadID);
      }

      // Diviser le texte en morceaux
      const chunks = splitText(textToTranslate, MAX_LENGTH);

      // Traduire chaque morceau
      const translatedChunks = await Promise.all(chunks.map(chunk => translateChunk(chunk, sourceLanguage, targetLanguage)));

      // Combiner les morceaux traduits
      const translatedText = translatedChunks.join(" ");

      // Envoyer le texte traduit à l'utilisateur
      api.sendMessage(translatedText, event.threadID);

    } catch (error) {
      console.error('Erreur lors de la requête API:', error.message);
      api.sendMessage("Une erreur est survenue lors du traitement de votre demande.", event.threadID);
    }
  }
};

// Fonction pour diviser le texte en morceaux de taille spécifiée
function splitText(text, maxLength) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLength;
    if (end > text.length) end = text.length;
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

// Fonction pour traduire un morceau de texte
async function translateChunk(chunk, sourceLanguage, targetLanguage) {
  const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLanguage}|${targetLanguage}`;
  const response = await axios.get(apiUrl);
  if (response.data && response.data.responseData) {
    return response.data.responseData.translatedText;
  } else {
    throw new Error("Erreur lors de la traduction");
  }
}
