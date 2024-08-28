const axios = require('axios');

module.exports = {
  config: {
    name: "trivia",
    author: "cliff",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}trivia"
    }
  },

  // Fonction déclenchée lorsque la commande est appelée
  onStart: async function ({ api, event, args, commandName }) {
    try {
      // Faire la requête à l'API OpenTDB pour obtenir une question de quiz
      const apiUrl = `https://opentdb.com/api.php?amount=1`; // URL de l'API de quiz
      const response = await axios.get(apiUrl);

      if (response.data && response.data.results && response.data.results.length > 0) {
        const questionData = response.data.results[0];
        const question = questionData.question;
        const correctAnswer = questionData.correct_answer.toLowerCase();

        // Traduire la question en français en utilisant l'API MyMemory
        const translationUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(question)}&langpair=en|fr`;
        const translationResponse = await axios.get(translationUrl);

        let translatedQuestion = question; // Par défaut, la question reste en anglais
        if (translationResponse.data && translationResponse.data.responseData) {
          translatedQuestion = translationResponse.data.responseData.translatedText;
        }

        // Envoyer la question traduite au groupe
        api.sendMessage(`Question: ${translatedQuestion}`, event.threadID, (err, info) => {
          if (!err) {
            // Enregistrer la question et la réponse correcte pour la gestion des réponses
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              correctAnswer: correctAnswer // Stocker la réponse correcte
            });
          }
        });
      } else {
        api.sendMessage("Unable to fetch a quiz question.", event.threadID);
      }
    } catch (error) {
      console.error('Error making API request:', error.message, error.response?.data);
      api.sendMessage("An error occurred while fetching the quiz question.", event.threadID);
    }
  },

  // Fonction déclenchée lorsque l'utilisateur répond au bot
  onReply: async function({ api, event, Reply, args }) {
    const { author, correctAnswer } = Reply;

    if (author !== event.senderID) return; // Vérifiez que c'est le bon utilisateur

    const userAnswer = args.join(" ").toLowerCase();

    // Vérifier si la réponse de l'utilisateur est correcte
    if (userAnswer === correctAnswer) {
      api.sendMessage("Correct! 🎉", event.threadID);
    } else {
      api.sendMessage(`Incorrect. 😔 La réponse correcte était: ${correctAnswer}`, event.threadID);
    }

    // Supprimer la gestion de la réponse après l'avoir traitée
    global.GoatBot.onReply.delete(Reply.messageID);
  }
};
