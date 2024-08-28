const axios = require('axios'); // Importer la bibliothèque axios pour effectuer des requêtes HTTP

module.exports = {
  config: {
    name: "mathquiz", // Nom de la commande
    author: "Bruno", // Auteur de la commande
    version: "1.0.0", // Version de la commande
    countDown: 5, // Temps avant expiration (non utilisé dans cet exemple)
    role: 0, // Rôle requis pour utiliser la commande (0 signifie aucun rôle spécifique)
    category: "Ai", // Catégorie de la commande
    shortDescription: {
      en: "{p}mathquiz" // Description courte de la commande
    }
  },

  // Fonction déclenchée lorsque la commande est appelée
  onStart: async function ({ api, event }) {
    try {
      // Appel à l'API OpenTDB pour récupérer une question de mathématiques
      const apiUrl = `https://opentdb.com/api.php?amount=1&category=19&type=multiple`;
      const response = await axios.get(apiUrl); // Faire une requête GET à l'API et attendre la réponse

      // Vérifier si une question a été obtenue
      if (response.data && response.data.results && response.data.results.length > 0) {
        const questionData = response.data.results[0]; // Extraire les données de la première question
        const question = questionData.question; // Récupérer le texte de la question
        const correctAnswer = questionData.correct_answer; // Récupérer la réponse correcte
        const allAnswers = [...questionData.incorrect_answers, correctAnswer].sort(() => Math.random() - 0.5); // Mélanger les réponses incorrectes avec la correcte

        // Traduire la question en français
        const translationUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(question)}&langpair=en|fr`;
        const translationResponse = await axios.get(translationUrl); // Faire une requête GET à l'API de traduction
        const translatedQuestion = translationResponse.data.responseData.translatedText; // Récupérer le texte traduit

        // Préparer le message avec la question traduite et les choix en anglais
        let message = `🍟🐔Bruno va te jouer🐔🐓\n${translatedQuestion}\n`; // Ajouter un titre et la question traduite
        allAnswers.forEach((answer, index) => {
          message += `${index + 1}) ${answer}\n`; // Ajouter chaque choix de réponse avec un numéro
        });

        // Envoyer la question traduite à l'utilisateur
        api.sendMessage(message, event.threadID, (err, info) => {
          if (!err) {
            // Enregistrer le message pour la gestion des réponses
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "mathquiz", // Enregistrer le nom de la commande
              messageID: info.messageID, // Enregistrer l'ID du message
              author: event.senderID, // Enregistrer l'ID de l'utilisateur
              correctAnswer, // Enregistrer la réponse correcte pour vérification ultérieure
              allAnswers, // Enregistrer toutes les réponses pour comparaison
            });
          }
        });
      } else {
        // Si aucune question n'est trouvée, envoyer un message d'erreur
        api.sendMessage("Impossible d'obtenir une question de mathématiques pour le moment.", event.threadID);
      }
    } catch (error) {
      // Gérer les erreurs lors de la requête à l'API
      console.error('Erreur lors de la requête à l\'API:', error.message);
      api.sendMessage("Une erreur s'est produite lors du traitement de votre demande.", event.threadID);
    }
  },

  // Fonction déclenchée lorsque l'utilisateur répond au bot
  onReply: async function({ api, event, Reply }) {
    const { author, correctAnswer, allAnswers } = Reply; // Extraire les informations de la réponse sauvegardée

    if (author !== event.senderID) return;  // Vérifier que la réponse vient bien de l'utilisateur initial

    const userAnswerIndex = parseInt(event.body.trim()); // Convertir la réponse de l'utilisateur en un nombre

    // Vérifier que l'utilisateur a donné un chiffre valide correspondant à un choix
    if (isNaN(userAnswerIndex) || userAnswerIndex < 1 || userAnswerIndex > allAnswers.length) {
      return api.sendMessage("Veuillez répondre avec un chiffre correspondant à l'un des choix.", event.threadID);
    }

    const userAnswer = allAnswers[userAnswerIndex - 1]; // Récupérer la réponse correspondant au chiffre donné

    // Comparer la réponse de l'utilisateur avec la réponse correcte
    if (userAnswer === correctAnswer) {
      api.sendMessage("Bonne réponse ! 🎉", event.threadID); // Envoyer un message de félicitations si la réponse est correcte
    } else {
      api.sendMessage(`Mauvaise réponse ! La bonne réponse était : ${correctAnswer}`, event.threadID); // Informer l'utilisateur de la bonne réponse si la sienne est incorrecte
    }
  }
};
