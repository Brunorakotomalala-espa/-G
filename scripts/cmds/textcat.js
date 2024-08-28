const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "lu",
    author: "cliff", // api by hazey
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}lu"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Please provide a prompt for Bruno.", event.threadID);
      }

      const prompt = encodeURIComponent(args.join(" "));
      const apiUrl = `https://llama3-70b.vercel.app/api?ask=${prompt}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.response) {
        // Récupération des images de chats
        const catApiUrl = 'https://api.thecatapi.com/v1/images/search?limit=5'; // Modifier le limit pour le nombre d'images souhaité
        const catResponse = await axios.get(catApiUrl);

        if (catResponse.data && catResponse.data.length > 0) {
          const imageUrls = catResponse.data.map(cat => cat.url);

          const imagePromises = imageUrls.map(async (url) => {
            const imagePath = path.join(__dirname, path.basename(url));
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));
            return fs.createReadStream(imagePath);
          });

          const images = await Promise.all(imagePromises);

          api.sendMessage({ body: response.data.response, attachment: images }, event.threadID, () => {
            images.forEach(image => {
              fs.unlinkSync(image.path); // Supprimer les images après l'envoi
            });
          });
        } else {
          api.sendMessage(response.data.response, event.threadID);
        }
      } else {
        api.sendMessage("Unable to get a response from Bruno.", event.threadID);
      }
    } catch (error) {
      console.error('Error making Llama API request:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
