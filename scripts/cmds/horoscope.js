const axios = require('axios');

const MAX_LENGTH = 500; // Limite de longueur pour les requêtes MyMemory

// Dates des signes astrologiques avec leurs noms en français
const zodiacDates = [
  { sign: "aries", name: "Bélier", dates: "21 mars – 19 avril" },
  { sign: "taurus", name: "Taureau", dates: "20 avril – 20 mai" },
  { sign: "gemini", name: "Gémeaux", dates: "21 mai – 20 juin" },
  { sign: "cancer", name: "Cancer", dates: "21 juin – 22 juillet" },
  { sign: "leo", name: "Lion", dates: "23 juillet – 22 août" },
  { sign: "virgo", name: "Vierge", dates: "23 août – 22 septembre" },
  { sign: "libra", name: "Balance", dates: "23 septembre – 22 octobre" },
  { sign: "scorpio", name: "Scorpion", dates: "23 octobre – 21 novembre" },
  { sign: "sagittarius", name: "Sagittaire", dates: "22 novembre – 21 décembre" },
  { sign: "capricorn", name: "Capricorne", dates: "22 décembre – 19 janvier" },
  { sign: "aquarius", name: "Verseau", dates: "20 janvier – 18 février" },
  { sign: "pisces", name: "Poissons", dates: "19 février – 20 mars" }
];

// Fonction pour traduire un texte en morceaux
async function translateText(text, targetLang = 'fr', sourceLang = 'en') {
  let translatedText = '';

  try {
    // Diviser le texte en morceaux plus petits si nécessaire
    const segments = [];
    for (let i = 0; i < text.length; i += MAX_LENGTH) {
      segments.push(text.slice(i, i + MAX_LENGTH));
    }

    // Traduire chaque morceau
    for (const segment of segments) {
      const response = await axios.get('https://api.mymemory.translated.net/get', {
        params: {
          q: segment,
          langpair: `${sourceLang}|${targetLang}`
        }
      });
      translatedText += response.data.responseData.translatedText;
    }
  } catch (error) {
    console.error('Erreur de traduction:', error.message);
    return text; // Retourner le texte original en cas d'erreur
  }

  return translatedText;
}

module.exports = {
  config: {
    name: "horoscope",
    author: "cliff",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}horoscope"
    }
  },

  onStart: async function ({ api, event, args }) {
    let message = "Choisissez un signe astrologique en répondant avec le numéro correspondant:\n";
    zodiacDates.forEach((zodiac, index) => {
      message += `${index + 1}- ${zodiac.name} (${zodiac.sign.charAt(0).toUpperCase() + zodiac.sign.slice(1)}) : ${zodiac.dates}\n`;
    });

    // Envoyer le message contenant les signes et leurs dates au thread
    api.sendMessage(message, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "horoscope",
          messageID: info.messageID,
          author: event.senderID,
          zodiacDates // Enregistrer les signes pour l'utilisation ultérieure
        });
      }
    });
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, zodiacDates } = Reply;

    if (author !== event.senderID) return;

    const userResponse = parseInt(event.body);

    if (zodiacDates) {
      // Gestion de la sélection du signe astrologique
      const signIndex = userResponse - 1;

      if (signIndex >= 0 && signIndex < zodiacDates.length) {
        const chosenZodiac = zodiacDates[signIndex];
        const horoscopeUrl = `https://ohmanda.com/api/horoscope/${chosenZodiac.sign}`;
        const todayDate = new Date().toISOString().split('T')[0]; // Date au format YYYY-MM-DD
        
        try {
          // Récupérer l'horoscope du signe choisi
          const horoscopeResponse = await axios.get(horoscopeUrl);
          const horoscopeText = horoscopeResponse.data.horoscope;

          // Traduire l'horoscope en français et malgache
          const frenchHoroscope = await translateText(horoscopeText, 'fr');
          const malagasyHoroscope = await translateText(horoscopeText, 'mg');

          // Créer le message avec les traductions
          const resultMessage = `
Horoscope pour ${chosenZodiac.name} (${chosenZodiac.sign.charAt(0).toUpperCase() + chosenZodiac.sign.slice(1)}):
Date: ${todayDate}
\n
En Anglais:
${horoscopeText}
\n
En Français:
${frenchHoroscope}
\n
En Malgache:
${malagasyHoroscope}
`;

          // Envoyer le message avec les traductions
          api.sendMessage(resultMessage, event.threadID);
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'horoscope:', error.message);
          api.sendMessage("Une erreur est survenue lors de la récupération de l'horoscope.", event.threadID);
        }
      } else {
        api.sendMessage("Numéro de signe invalide. Veuillez essayer à nouveau.", event.threadID);
      }
    } else {
      api.sendMessage("Réponse invalide. Veuillez essayer à nouveau.", event.threadID);
    }
  }
};
