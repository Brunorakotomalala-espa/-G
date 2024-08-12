const axios = require('axios');

module.exports = {
  config: {
    name: "par",
    author: "cliff",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}bruno"
    }
  },

  // Fonction déclenchée lorsque la commande est appelée
  onStart: async function ({ api, event, args, commandName }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Please provide a prompt for Bruno.", event.threadID);
      }

      const prompt = encodeURIComponent(args.join(" "));
      const apiUrl = `https://discussion-continue-gem29.vercel.app/api?ask=${prompt}`; // Nouvelle URL de l'API

      // Envoyer le message de patience
      api.sendMessage("Bruno vous répondra dans quelques instants, mais veuillez patienter...", event.threadID);

      // Faire la requête à l'API
      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        // Envoyer la réponse et préparer la réponse suivante
        api.sendMessage(response.data.response, event.threadID, (err, info) => {
          if (!err) {
            // Enregistrer le message pour la gestion des réponses
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              previousQuestion: args.join(" ")  // Conserver la question précédente
            });
          }
        });
      } else {
        api.sendMessage("Unable to get a response from Bruno.", event.threadID);
      }
    } catch (error) {
      console.error('Error making API request:', error.message, error.response?.data);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  },

  // Fonction déclenchée lorsque l'utilisateur répond au bot
  onReply: async function({ api, event, Reply, args }) {
    const { author, commandName, previousQuestion } = Reply;

    if (author !== event.senderID) return;  // Vérifiez que c'est le bon utilisateur

    let prompt;

    // Gérer le contexte de la conversation
    if (previousQuestion) {
      if (previousQuestion.toLowerCase().includes("résolution")) {
        prompt = `expliquez en détail la résolution de l'équation : ${previousQuestion}`;
      } else {
        prompt = encodeURIComponent(args.join(" "));
      }
    } else {
      prompt = encodeURIComponent(args.join(" "));
    }

    try {
      const apiUrl = `https://discussion-continue-gem29.vercel.app/api?ask=${prompt}`; // Nouvelle URL de l'API
      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        api.sendMessage(response.data.response, event.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              previousQuestion: prompt,  // Mettre à jour le contexte
            });
          }
        });
      } else {
        api.sendMessage("Unable to get a response from Bruno.", event.threadID);
      }
    } catch (error) {
      console.error('Error making API request:', error.message, error.response?.data);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
