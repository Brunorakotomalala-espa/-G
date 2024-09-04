const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "pinterest2",
    author: "cliff",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}base"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (args.length < 2) {
        return api.sendMessage("Veuillez fournir un titre et le nombre d'images pour la recherche.", event.threadID);
      }

      const title = encodeURIComponent(args.slice(0, -1).join(" "));
      const count = parseInt(args[args.length - 1], 10); // Nombre d'images à récupérer

      if (isNaN(count) || count <= 0) {
        return api.sendMessage("Le nombre d'images doit être un nombre positif.", event.threadID);
      }

      const apiUrl = `https://jonellccprojectapis10.adaptable.app/api/pin?title=${title}&count=${count}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.data && response.data.data.length > 0) {
        // Téléchargement et envoi des images
        for (let i = 0; i < response.data.data.length; i++) {
          const imageUrl = response.data.data[i];
          
          // Téléchargement de l'image
          const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          const imagePath = path.join(__dirname, `image${i}.jpg`);
          
          // Enregistrement de l'image localement
          fs.writeFileSync(imagePath, imageResponse.data);

          // Envoi de l'image
          await api.sendMessage({ attachment: fs.createReadStream(imagePath) }, event.threadID);

          // Suppression du fichier après l'envoi
          fs.unlinkSync(imagePath);
        }
      } else {
        api.sendMessage("Aucune image trouvée pour la recherche.", event.threadID);
      }
    } catch (error) {
      console.error('Erreur lors de la requête API:', error.message);
      api.sendMessage("Une erreur est survenue lors du traitement de votre demande.", event.threadID);
    }
  }
};
