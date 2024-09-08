const axios = require("axios");
const a = 'xyz';

module.exports = {
  config: {
    name: "musique", // Changement ici
    version: "1.1",
    author: "Fahim_Noob",
    countDown: 5,
    role: 0,
    description: {
      en: "Plays a music track from the given URL and provides a download link."
    },
    category: "music",
    guide: {
      en: "Type the command followed by the song name to play the music."
    }
  },
  langs: {
    en: {
      syntaxError: "Please provide a valid song name!",
      fetchError: "Error occurred while fetching the song."
    }
  },

  onStart: async function ({ message, event, args, getLang, api }) {
    const songName = args.join(" ");
    if (!songName) return message.reply(getLang('syntaxError'));

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const url = `https://smfahim.${a}/ytb/audio?search=${encodeURIComponent(songName)}`;
      const { data: { audioUrl, title } } = await axios.get(url);

      // Envoyer la réponse avec le lien de téléchargement et le titre de la musique
      await message.reply({
        body: `${title}\n\n[Download Music]( ${audioUrl} )`, // Lien de téléchargement
        attachment: await global.utils.getStreamFromURL(audioUrl, "music.mp3") // Pour écouter la musique
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
      console.error(error);
      message.reply(getLang('fetchError'));
    }
  }
};
