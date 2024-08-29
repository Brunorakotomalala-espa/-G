const axios = require('axios'); // Importation de la bibliothèque axios pour effectuer des requêtes HTTP

// Fonction pour traduire du texte de l'anglais vers le français en utilisant l'API MyMemory
async function translateText(text) {
  try {
    // Effectue une requête GET vers l'API MyMemory pour traduire le texte
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text, // Texte à traduire
        langpair: 'en|fr' // Indique que la traduction est de l'anglais (en) vers le français (fr)
      }
    });
    return response.data.responseData.translatedText; // Retourne le texte traduit
  } catch (error) {
    console.error('Translation error:', error.message); // Affiche une erreur si la traduction échoue
    return null; // Retourne null en cas d'erreur
  }
}

module.exports = {
  config: {
    name: "cocktail", // Nom de la commande
    author: "Bruno", // Auteur du module
    version: "1.0.0", // Version du module
    countDown: 5, // Délai avant que la commande puisse être réutilisée
    role: 0, // Rôle requis pour utiliser la commande (0 signifie aucun rôle spécial requis)
    category: "Ai", // Catégorie de la commande
    shortDescription: {
      en: "{p}lu" // Courte description de la commande (en anglais)
    }
  },

  // Fonction principale qui s'exécute lorsque la commande est utilisée
  onStart: async function ({ api, event }) {
    try {
      const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/random.php`; // URL de l'API pour obtenir un cocktail aléatoire
      const response = await axios.get(apiUrl); // Effectue une requête GET à l'API

      // Vérifie si la réponse contient des données sur les cocktails
      if (response.data && response.data.drinks && response.data.drinks.length > 0) {
        const cocktail = response.data.drinks[0]; // Récupère le premier cocktail de la réponse
        const cocktailName = cocktail.strDrink; // Récupère le nom du cocktail
        const ingredients = []; // Initialise un tableau pour stocker les ingrédients

        // Boucle sur les 15 ingrédients possibles du cocktail
        for (let i = 1; i <= 15; i++) {
          const ingredient = cocktail[`strIngredient${i}`]; // Récupère le nom de l'ingrédient
          const measure = cocktail[`strMeasure${i}`]; // Récupère la mesure associée à l'ingrédient
          if (ingredient) {
            // Ajoute l'ingrédient et sa mesure au tableau des ingrédients
            ingredients.push(`- ${ingredient} : ${measure || "à votre goût"}`);
          }
        }

        const instructions = cocktail.strInstructions; // Récupère les instructions de préparation du cocktail

        // Préparation du message original en ajoutant des sauts de ligne pour une meilleure lisibilité
        const message = `🍸 **${cocktailName}** 🍸\n\n` + // Ajoute le nom du cocktail
                        `**Ingrédients :**\n${ingredients.join('\n')}\n\n` + // Ajoute la liste des ingrédients
                        `**Préparation :**\n${instructions}`; // Ajoute les instructions de préparation

        // Divise le message en morceaux de 500 caractères max pour respecter la limite de l'API MyMemory
        const parts = message.match(/.{1,500}/g);
        let translatedMessage = ''; // Initialise une chaîne vide pour le message traduit

        // Boucle sur chaque partie du message pour les traduire et les combiner
        for (const part of parts) {
          const translatedPart = await translateText(part); // Traduit chaque partie du message
          translatedMessage += (translatedPart ? translatedPart : part) + "\n"; // Ajoute la partie traduite au message final avec un saut de ligne
        }

        // Envoie le message traduit à l'utilisateur
        api.sendMessage(translatedMessage, event.threadID);
      } else {
        // Envoie un message d'erreur si aucun cocktail n'a été récupéré
        api.sendMessage("Impossible de récupérer un cocktail pour le moment.", event.threadID);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du cocktail:', error.message); // Affiche une erreur si la récupération du cocktail échoue
      api.sendMessage("Une erreur est survenue lors du traitement de votre demande.", event.threadID); // Envoie un message d'erreur à l'utilisateur
    }
  }
};
