const axios = require('axios');
const FormData = require('form-data');

// Dictionnaire pour stocker l'historique des conversations
const conversationHistory = {};

module.exports = {
  config: {
    name: 'main',
    version: '1.0.1',
    author: 'Bruno',
    role: 0,
    category: 'ai',
    longDescription: {
      en: 'This is a large Ai language model trained by OpenAi, it is designed to assist with a wide range of tasks.',
    },
    guide: {
      en: '\nAi < questions >\n\n🔎 𝗚𝘂𝗶𝗱𝗲\nAi what is capital of France?',
    },
  },

  langs: {
    en: {
      final: "",
      header: "🧋✨ | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n━━━━━━━━━━━━━━━━",
      footer: "━━━━━━━━━━━━━━━━",
    }
  },

  onStart: async function({ api, event, args }) {
    const prompt = args.join(' ');
    const title = '🎁❤️Bruno AI 👈🙏\n';

    if (!prompt) {
      return api.sendMessage(title + 'Hello 👋 How can I help you today?', event.threadID, event.messageID);
    }

    // Cas 1 : Si l'utilisateur a répondu à un message avec une image
    if (event.type === 'message_reply' && event.messageReply.attachments) {
      const attachment = event.messageReply.attachments[0];
      if (attachment.type === 'photo') {
        const image_url = attachment.url;

        try {
          // Télécharger l'image depuis l'URL
          const response = await axios.get(image_url, { responseType: 'stream' });

          // Créer FormData et ajouter l'image et le prompt
          const form = new FormData();
          form.append('prompt', prompt);
          form.append('image', response.data, { filename: 'image.jpg' });

          // Faire la requête POST vers votre API
          const apiResponse = await axios.post('https://finaletestgeminiimage-l0vh.onrender.com/api/bas', form, {
            headers: {
              ...form.getHeaders(),
            },
          });

          const data = apiResponse.data;
          const output = data.response;
          api.sendMessage(title + output, event.threadID, event.messageID);
        } catch (error) {
          console.error('Erreur lors du traitement de l\'image:', error);
          api.sendMessage(title + '⚠️ Une erreur est survenue lors du traitement de l\'image!', event.threadID, event.messageID);
        }
        return;
      }
    }

    // Cas 2 : Si seulement un prompt est fourni (sans image)
    const userID = event.senderID;
    const conversation = conversationHistory[userID] || [];

    try {
      // Ajouter le prompt à l'historique
      conversation.push({ role: 'user', content: prompt });
      conversationHistory[userID] = conversation;

      // Faire la requête GET vers votre API
      const apiResponse = await axios.get('https://finaletestgeminiimage-l0vh.onrender.com/api/haut', {
        params: { prompt: prompt },
      });

      const data = apiResponse.data;
      const output = data.response;

      // Ajouter la réponse du bot à l'historique
      conversation.push({ role: 'bot', content: output });
      conversationHistory[userID] = conversation;

      api.sendMessage(title + output, event.threadID, event.messageID);
    } catch (error) {
      console.error('Erreur lors du traitement du prompt:', error);
      api.sendMessage(title + '⚠️ Une erreur est survenue lors du traitement du prompt!', event.threadID, event.messageID);
    }
  },

  onReply: async function({ api, event, Reply, args }) {
    const { author, commandName, previousQuestion } = Reply;

    if (author !== event.senderID) return;  // Vérifiez que c'est le bon utilisateur

    let prompt;

    // Gérer le contexte de la conversation
    if (previousQuestion) {
      if (previousQuestion.toLowerCase().includes("résolution")) {
        prompt = `expliquez en détail la résolution de l'équation : ${previousQuestion}`;
      } else {
        prompt = args.join(" ");
      }
    } else {
      prompt = args.join(" ");
    }

    const userID = event.senderID;
    const conversation = conversationHistory[userID] || [];

    try {
      // Ajouter le prompt à l'historique
      conversation.push({ role: 'user', content: prompt });
      conversationHistory[userID] = conversation;

      // Faire la requête GET vers votre API
      const apiUrl = `https://finaletestgeminiimage-l0vh.onrender.com/api/haut?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        const output = response.data.response;

        // Ajouter la réponse du bot à l'historique
        conversation.push({ role: 'bot', content: output });
        conversationHistory[userID] = conversation;

        api.sendMessage(output, event.threadID, (err, info) => {
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
