const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Stockage global pour suivre les images et les conversations
const conversationHistory = {};

module.exports = {
  config: {
    name: "prisca",
    version: "1.0.0",
    description: "Bot with continuous conversation capability including image handling",
  },

  onStart: async function({ api, event, args }) {
    const userID = event.senderID;
    let prompt = args.join(' ');

    // Initialiser l'historique pour l'utilisateur si nécessaire
    if (!conversationHistory[userID]) {
      conversationHistory[userID] = { image: null, messages: [], previousQuestion: null };
    }

    // Gérer le contexte de la conversation
    if (conversationHistory[userID].previousQuestion) {
      if (conversationHistory[userID].previousQuestion.toLowerCase().includes("résolution")) {
        prompt = `expliquez en détail la résolution de l'équation : ${conversationHistory[userID].previousQuestion}`;
      } else {
        prompt = encodeURIComponent(args.join(" "));
      }
    } else {
      prompt = encodeURIComponent(args.join(" "));
    }

    // Gestion des images si l'utilisateur répond à un message contenant une image
    if (event.type === 'message_reply' && event.messageReply.attachments) {
      const attachment = event.messageReply.attachments[0];

      if (attachment && attachment.type === 'photo') {
        const image_url = attachment.url;

        try {
          // Télécharger l'image
          const response = await axios.get(image_url, { responseType: 'stream' });
          const imagePath = path.join('/tmp', 'image.jpg');
          const writer = fs.createWriteStream(imagePath);
          response.data.pipe(writer);

          writer.on('finish', async () => {
            // Envoyer l'image à l'API avec le prompt
            const form = new FormData();
            form.append('file', fs.createReadStream(imagePath));
            form.append('question', prompt);

            try {
              const apiResponse = await axios.post('https://continue-gemini-photo.onrender.com/api/', form, {
                headers: {
                  ...form.getHeaders(),
                },
              });

              const data = apiResponse.data;
              const output = data.response;

              // Envoyer la réponse et sauvegarder l'image
              api.sendMessage(output, event.threadID);
              conversationHistory[userID].image = imagePath;
              conversationHistory[userID].messages.push({ role: 'user', content: prompt });
              conversationHistory[userID].previousQuestion = prompt; // Mettre à jour le contexte

              fs.unlinkSync(imagePath); // Nettoyer le fichier après usage
            } catch (error) {
              console.error('Error:', error);
              api.sendMessage('⚠️ An error occurred!', event.threadID);
            }
          });
        } catch (error) {
          console.error('Error downloading image:', error);
          api.sendMessage('⚠️ Failed to download image.', event.threadID);
        }
      }
    } else if (conversationHistory[userID].image) {
      // Traitement des réponses textuelles après avoir reçu une image
      if (prompt) {
        const form = new FormData();
        form.append('file', fs.createReadStream(conversationHistory[userID].image));
        form.append('question', prompt);

        try {
          const apiResponse = await axios.post('https://continue-gemini-photo.onrender.com/api/', form, {
            headers: {
              ...form.getHeaders(),
            },
          });

          const data = apiResponse.data;
          const output = data.response;

          // Envoyer la réponse à l'utilisateur et mettre à jour l'historique
          api.sendMessage(output, event.threadID);
          conversationHistory[userID].messages.push({ role: 'user', content: prompt });
          conversationHistory[userID].previousQuestion = prompt; // Mettre à jour le contexte

        } catch (error) {
          console.error('Error:', error);
          api.sendMessage('⚠️ An error occurred!', event.threadID);
        }
      } else {
        api.sendMessage('Please provide a message to continue the conversation.', event.threadID);
      }
    } else {
      // Pas d'image, demande à l'utilisateur de télécharger une image
      api.sendMessage('Please upload an image first.', event.threadID);
    }
  },
};
