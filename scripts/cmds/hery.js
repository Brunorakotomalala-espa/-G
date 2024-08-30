const axios = require('axios');

module.exports = {
  config: {
    name: "hery",
    author: "cliff",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}bruno"
    }
  },

  onStart: async function ({ api, event, args, commandName }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Please provide a prompt for Bruno.", event.threadID);
      }

      const prompt = encodeURIComponent(args.join(" "));
      const apiUrl = `https://discussion-continue-gem29.vercel.app/api?ask=${prompt}`; // Nouvelle URL de l'API

      api.sendMessage("Bruno vous répondra dans quelques instants, mais veuillez patienter...", event.threadID);

      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        api.sendMessage(response.data.response, event.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              previousQuestion: args.join(" ")
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

  onReply: async function({ api, event, Reply, args }) {
    const { author, commandName, previousQuestion } = Reply;

    if (author !== event.senderID) return;

    let prompt;

    if (previousQuestion) {
      prompt = encodeURIComponent(args.join(" "));
    } else {
      prompt = encodeURIComponent(args.join(" "));
    }

    try {
      const apiUrl = `https://discussion-continue-gem29.vercel.app/api?ask=${prompt}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        api.sendMessage(response.data.response, event.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              previousQuestion: prompt,  // Toujours mettre à jour pour continuer
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
