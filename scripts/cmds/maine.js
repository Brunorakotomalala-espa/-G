const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  config: {
    name: "maine",
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
  onStart: async function({ api, event, args, commandName }) {
    if (!args[0]) {
      return api.sendMessage("Please provide a prompt for Bruno.", event.threadID);
    }

    const prompt = args.slice(0, -1).join(' ');
    const imageURL = args[args.length - 1]; // On suppose que la dernière partie est l'URL de l'image

    try {
      if (imageURL) {
        // Télécharger l'image depuis l'URL
        const response = await axios.get(imageURL, { responseType: 'stream' });

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

        // Envoyer la réponse et préparer la réponse suivante
        api.sendMessage(output, event.threadID, (err, info) => {
          if (!err) {
            // Enregistrer le message pour la gestion des réponses
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              previousQuestion: prompt // Conserver la question précédente
            });
          }
        });
      } else {
        api.sendMessage("Please provide an image URL along with your prompt.", event.threadID);
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

    // Si l'utilisateur a répondu à un message avec une image
    if (event.type === 'message_reply' && event.messageReply.attachments) {
      const attachment = event.messageReply.attachments[0];
      if (attachment.type === 'photo') {
        const image_url = attachment.url;

        try {
          // Télécharger l'image depuis l'URL
          const response = await axios.get(image_url, { responseType: 'stream' });

          // Créer FormData et ajouter l'image et le prompt
          const form = new FormData();
          form.append('prompt', args.join(' '));
          form.append('image', response.data, { filename: 'image.jpg' });

          // Faire la requête POST vers votre API
          const apiResponse = await axios.post('https://finaletestgeminiimage-l0vh.onrender.com/api/bas', form, {
            headers: {
              ...form.getHeaders(),
            },
          });

          const data = apiResponse.data;
          const output = data.response;

          // Envoyer la réponse et préparer la réponse suivante
          api.sendMessage(output, event.threadID, (err, info) => {
            if (!err) {
              // Enregistrer le message pour la gestion des réponses
              global.GoatBot.onReply.set(info.messageID, {
                commandName,
                messageID: info.messageID,
                author: event.senderID,
                previousQuestion: args.join(" ") // Conserver la question précédente
              });
            }
          });
        } catch (error) {
          console.error('Error processing image:', error.message, error.response?.data);
          api.sendMessage("An error occurred while processing the image.", event.threadID);
        }
        return;
      }
    }

    // Gérer le contexte de la conversation s'il n'y a pas d'image
    let prompt;

    // Gérer le contexte de la conversation
    if (previousQuestion) {
      prompt = args.join(" ");
    } else {
      prompt = args.join(" ");
    }

    try {
      const apiUrl = `https://finaletestgeminiimage-l0vh.onrender.com/api/haut?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        api.sendMessage(response.data.response, event.threadID, (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              previousQuestion: prompt // Mettre à jour le contexte
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
