const axios = require('axios');

module.exports = {
  config: {
    name: "dictionnaire",
    author: "bruno",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}dictionnaire"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      // Vérifie si le mot est fourni
      if (!args[0]) {
        return api.sendMessage("Veuillez fournir un mot à définir.", event.threadID);
      }

      // Extraire le mot à partir des arguments
      const word = encodeURIComponent(args.join(" "));

      // Construire l'URL de l'API
      const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

      // Faire une requête GET à l'API
      const response = await axios.get(apiUrl);

      // Vérifie si la réponse contient des données
      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        let message = `**Mot :** ${data.word}\n`;

        // Ajouter les prononciations
        if (data.phonetics) {
          message += `**Prononciations :**\n`;
          data.phonetics.forEach(ph => {
            if (ph.audio) {
              message += `- [Audio](${ph.audio}) (${ph.text || 'Pas de phonétique'})\n`;
            } else {
              message += `- Phonétique : ${ph.text || 'Non disponible'}\n`;
            }
          });
        }

        // Ajouter les significations
        if (data.meanings) {
          message += `**Significations :**\n`;
          data.meanings.forEach(meaning => {
            message += `- **Partie du discours :** ${meaning.partOfSpeech}\n`;
            meaning.definitions.forEach(def => {
              message += `  - Définition : ${def.definition}\n`;
              if (def.example) {
                message += `    - Exemple : ${def.example}\n`;
              }
            });
            if (meaning.synonyms.length > 0) {
              message += `  - Synonymes : ${meaning.synonyms.join(', ')}\n`;
            }
            if (meaning.antonyms.length > 0) {
              message += `  - Antonymes : ${meaning.antonyms.join(', ')}\n`;
            }
          });
        }

        // Ajouter la source
        if (data.sourceUrls) {
          message += `**Source :**\n`;
          data.sourceUrls.forEach(url => {
            message += `- [Source](${url})\n`;
          });
        }

        api.sendMessage(message, event.threadID);
      } else {
        api.sendMessage("Impossible de trouver une définition pour ce mot.", event.threadID);
      }
    } catch (error) {
      console.error('Erreur lors de la requête à l\'API Dictionnaire:', error.message);
      api.sendMessage("Une erreur s'est produite lors de la recherche du mot.", event.threadID);
    }
  }
};
