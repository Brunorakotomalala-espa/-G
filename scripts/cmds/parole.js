const axios = require('axios');

module.exports = {
  config: {
    name: "parole",
    author: "cliff",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Music",
    shortDescription: {
      en: "{p}lyrics [artist] [title]"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      // Vérifier si les arguments nécessaires sont fournis
      if (args.length < 2) {
        return api.sendMessage("Please provide both the artist and the title of the song.", event.threadID);
      }

      // Extraire l'artiste et le titre des arguments
      const artist = encodeURIComponent(args[0]);
      const title = encodeURIComponent(args.slice(1).join(" "));

      // Construire l'URL de l'API Lyrics.ovh
      const apiUrl = `https://api.lyrics.ovh/v1/${artist}/${title}`;

      // Envoyer le message de patience
      api.sendMessage("Fetching lyrics, please wait...", event.threadID);

      // Faire la requête GET à l'API Lyrics.ovh
      const response = await axios.get(apiUrl);

      if (response.data && response.data.lyrics) {
        // Envoyer les paroles de la chanson
        api.sendMessage(`Lyrics for "${title}" by ${artist}:\n\n${response.data.lyrics}`, event.threadID);
      } else {
        // Gérer les cas où les paroles ne sont pas trouvées
        api.sendMessage("Lyrics not found for the specified song.", event.threadID);
      }
    } catch (error) {
      console.error('Error making Lyrics.ovh API request:', error.message);
      api.sendMessage("An error occurred while fetching the lyrics.", event.threadID);
    }
  }
};
