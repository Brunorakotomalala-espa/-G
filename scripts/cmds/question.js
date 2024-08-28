const axios = require('axios'); // Importer la bibliothèque axios pour faire des requêtes HTTP

module.exports = {
  config: {
    name: "quiz", // Nom de la commande
    author: "Bruno", // Auteur du module
    version: "1.0.0", // Version du module
    countDown: 5, // Temps d'attente entre les commandes (en secondes)
    role: 0, // Niveau d'autorisation requis pour utiliser la commande
    category: "Ai", // Catégorie de la commande
    shortDescription: {
      en: "{p}question" // Description courte de la commande
    }
  },

  // Fonction déclenchée lorsque la commande est appelée
  onStart: async function ({ api, event, args, commandName }) {
    try {
      // Faire une requête à l'API OpenTDB pour obtenir une question de quiz avec des choix multiples
      const apiUrl = `https://opentdb.com/api.php?amount=1&type=multiple`; 
      const response = await axios.get(apiUrl); // Envoyer la requête et attendre la réponse

      // Vérifier si la réponse contient des questions valides
      if (response.data && response.data.results && response.data.results.length > 0) {
        const questionData = response.data.results[0]; // Obtenir les données de la première question
        const question = questionData.question; // Extraire la question
        const correctAnswer = questionData.correct_answer; // Extraire la réponse correcte
        const incorrectAnswers = questionData.incorrect_answers; // Extraire les réponses incorrectes

        // Combiner la réponse correcte avec les réponses incorrectes
        const allAnswers = [...incorrectAnswers, correctAnswer];
        // Mélanger les réponses pour que la réponse correcte ne soit pas toujours à la même position
        const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);

        // Créer une liste de choix numérotés (1, 2, 3, 4) avec les réponses mélangées
        const choices = shuffledAnswers.map((answer, index) => `${index + 1}) ${answer}`).join("\n");

        // Construire l'URL pour traduire la question en français en utilisant l'API MyMemory
        const translationUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(question)}&langpair=en|fr`;
        const translationResponse = await axios.get(translationUrl); // Envoyer la requête de traduction et attendre la réponse

        let translatedQuestion = question; // Par défaut, garder la question en anglais
        // Si la traduction a réussi, utiliser la version traduite de la question
        if (translationResponse.data && translationResponse.data.responseData) {
          translatedQuestion = translationResponse.data.responseData.translatedText;
        }

        // Ajouter un titre avant la question pour rendre le message plus engageant
        const title = `🍟🐔Bruno va te jouer🐔🐓 \n`;
        // Construire le message final avec le titre, la question traduite, et les choix de réponse
        const message = `${title}\n${translatedQuestion}\n\n${choices}`;

        // Envoyer la question traduite avec le titre et les choix de réponse au groupe
        api.sendMessage(message, event.threadID, (err, info) => {
          if (!err) {
            // Si l'envoi a réussi, enregistrer la réponse correcte et les choix pour la gestion des réponses de l'utilisateur
            global.GoatBot.onReply.set(info.messageID, {
              commandName, // Le nom de la commande (pour référence future)
              messageID: info.messageID, // L'ID du message envoyé (pour suivre la conversation)
              author: event.senderID, // L'ID de l'utilisateur qui a lancé la commande
              correctAnswerIndex: shuffledAnswers.indexOf(correctAnswer) + 1 // Stocker l'index de la réponse correcte (1 à 4)
            });
          }
        });
      } else {
        // Si l'API OpenTDB n'a pas renvoyé de question valide, envoyer un message d'erreur
        api.sendMessage("Unable to fetch a quiz question.", event.threadID);
      }
    } catch (error) {
      // En cas d'erreur lors de la requête, loguer l'erreur et envoyer un message d'erreur
      console.error('Error making API request:', error.message, error.response?.data);
      api.sendMessage("An error occurred while fetching the quiz question.", event.threadID);
    }
  },

  // Fonction déclenchée lorsque l'utilisateur répond au bot
  onReply: async function({ api, event, Reply, args }) {
    const { author, correctAnswerIndex } = Reply; // Extraire l'auteur et la réponse correcte stockée

    // Vérifier que c'est bien l'utilisateur qui a initialement posé la question qui répond
    if (author !== event.senderID) return;

    // Convertir la réponse de l'utilisateur en nombre (1, 2, 3, ou 4)
    const userAnswer = parseInt(args[0], 10);

    // Vérifier si la réponse de l'utilisateur est correcte
    if (userAnswer === correctAnswerIndex) {
      // Si correcte, envoyer un message de félicitations
      api.sendMessage("Correct! 🎉", event.threadID);
    } else {
      // Sinon, envoyer un message d'erreur avec la bonne réponse
      api.sendMessage(`Incorrect. 😔 La réponse correcte était: ${correctAnswerIndex}`, event.threadID);
    }

    // Supprimer la gestion de la réponse après l'avoir traitée
    global.GoatBot.onReply.delete(Reply.messageID);
  }
};
