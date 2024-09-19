const axios = require('axios');

module.exports = {
  config: {
    name: "ytsearch",
    author: "cliff",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}youtube"
    }
  },

  // Fonction déclenchée lorsque la commande est appelée
  onStart: async function ({ api, event, args, commandName }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Veuillez fournir un terme de recherche pour YouTube.", event.threadID);
      }

      const searchQuery = encodeURIComponent(args.join(" "));
      const apiUrl = `http://api-nako-choru-production.up.railway.app/yt?search=${searchQuery}&limit=10`; // URL de recherche

      // Envoyer le message de patience
      api.sendMessage("Recherche en cours, veuillez patienter...", event.threadID);

      // Faire la requête à l'API
      const response = await axios.get(apiUrl);

      if (response.data && response.data.results) {
        const videoList = response.data.results;
        let message = "Voici les 10 premières vidéos trouvées :\n\n";

        videoList.forEach((video, index) => {
          message += `${index + 1}. ${video.title} (${video.duration})\n`;
        });

        message += "\nRépondez avec le numéro de la vidéo que vous souhaitez télécharger, et précisez MP4 ou MP3.";

        // Envoyer la liste des vidéos et préparer la gestion de la réponse
        api.sendMessage(message, event.threadID, (err, info) => {
          if (!err) {
            // Enregistrer le message pour la gestion des réponses
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              videoList  // Conserver la liste des vidéos pour référence
            });
          }
        });
      } else {
        api.sendMessage("Aucune vidéo trouvée.", event.threadID);
      }
    } catch (error) {
      console.error('Erreur lors de la requête à l\'API YouTube :', error.message, error.response?.data);
      api.sendMessage("Une erreur est survenue lors de la recherche.", event.threadID);
    }
  },

  // Fonction déclenchée lorsque l'utilisateur répond au bot
  onReply: async function({ api, event, Reply, args }) {
    const { author, videoList } = Reply;

    if (author !== event.senderID) return;  // Vérifiez que c'est bien le bon utilisateur

    const selection = parseInt(args[0]) - 1;  // Convertir la réponse de l'utilisateur en un index de tableau
    const format = args[1]?.toLowerCase(); // MP4 ou MP3

    if (isNaN(selection) || selection < 0 || selection >= videoList.length) {
      return api.sendMessage("Numéro invalide. Veuillez choisir un numéro parmi la liste (1-10).", event.threadID);
    }

    if (!format || (format !== "mp4" && format !== "mp3")) {
      return api.sendMessage("Veuillez préciser le format : MP4 ou MP3.", event.threadID);
    }

    const selectedVideo = videoList[selection];
    const videoLink = encodeURIComponent(`https://m.youtube.com/watch?v=${selectedVideo.id}`);
    let downloadUrl;

    if (format === "mp4") {
      downloadUrl = `http://api-nako-choru-production.up.railway.app/yt/mp4?link=${videoLink}`;
    } else if (format === "mp3") {
      downloadUrl = `http://api-nako-choru-production.up.railway.app/yt/mp3?link=${videoLink}`;
    }

    try {
      api.sendMessage(`Téléchargement en cours de ${selectedVideo.title} au format ${format.toUpperCase()}. Veuillez patienter...`, event.threadID);

      // Faire la requête de téléchargement
      const downloadResponse = await axios.get(downloadUrl);

      if (downloadResponse.data && downloadResponse.data.url) {
        api.sendMessage(`Téléchargement terminé ! Voici le lien pour télécharger la vidéo :\n${downloadResponse.data.url}`, event.threadID);
      } else {
        api.sendMessage("Impossible de télécharger la vidéo.", event.threadID);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement :', error.message, error.response?.data);
      api.sendMessage("Une erreur est survenue lors du téléchargement.", event.threadID);
    }
  }
};
