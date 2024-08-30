const axios = require('axios'); // Importer la bibliothèque axios pour faire des requêtes HTTP
const stringSimilarity = require('string-similarity'); // Importer la bibliothèque pour comparer les similarités entre chaînes

module.exports = {
  config: {
    name: "poème", // Nom de la commande
    author: "Bruno", // Auteur du script
    version: "1.0.0", // Version du script
    countDown: 5, // Temps d'attente en secondes avant d'exécuter la commande
    role: 0, // Rôle requis pour exécuter la commande (0 signifie que tout le monde peut l'exécuter)
    category: "Ai", // Catégorie du script
    shortDescription: {
      en: "{p}lu" // Description courte en anglais
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      // Vérifie si un titre de poème a été fourni par l'utilisateur
      if (!args[0]) {
        return api.sendMessage("Veuillez fournir le titre d'un poème.", event.threadID);
      }

      const poemTitle = args.join(" "); // Combine les arguments en une seule chaîne pour former le titre du poème
      const encodedPoemTitle = encodeURIComponent(poemTitle); // Encode le titre du poème pour l'utiliser dans l'URL
      const apiUrl = `https://poetrydb.org/title/${encodedPoemTitle}`; // Construire l'URL de l'API pour rechercher le poème par titre

      // Faire une requête GET à l'API PoetryDB pour obtenir les détails du poème
      const response = await axios.get(apiUrl);

      // Vérifie si la réponse contient des données et si des poèmes ont été trouvés
      if (response.data && response.data.length > 0) {
        const poem = response.data[0]; // Prendre le premier poème trouvé (au cas où il y aurait plusieurs résultats)

        // Traduire chaque ligne du poème en français
        const translatedLines = await Promise.all(poem.lines.map(async (line) => {
          return await translateText(line); // Appeler la fonction pour traduire chaque ligne
        }));

        // Préparer le poème avec des emojis décoratifs
        const decoratedPoem = {
          "📝 Titre": poem.title, // Titre du poème avec un emoji
          "👤 Auteur": poem.author, // Auteur du poème avec un emoji
          "📜 Poème": translatedLines.map(line => `🌟 ${line}`).join("\n"), // Chaque ligne du poème traduite avec un emoji décoratif
          "🔢 Nombre de vers": poem.linecount // Nombre de lignes du poème avec un emoji
        };

        // Créer un message formaté avec les détails du poème
        const formattedResponse = `
          📝 *Titre*: ${decoratedPoem["📝 Titre"]}
          👤 *Auteur*: ${decoratedPoem["👤 Auteur"]}
          📜 *Poème*:\n${decoratedPoem["📜 Poème"]}
          🔢 *Nombre de vers*: ${decoratedPoem["🔢 Nombre de vers"]}
        `;

        // Envoyer le poème décoré et traduit à l'utilisateur
        api.sendMessage(formattedResponse, event.threadID);
      } else {
        // Si aucun poème n'est trouvé, rechercher des titres similaires
        const allTitlesResponse = await axios.get('https://poetrydb.org/title'); // Obtenir tous les titres disponibles
        const allTitles = allTitlesResponse.data.map(poem => poem.title); // Extraire les titres des poèmes

        // Trouver les titres similaires en utilisant la similarité de chaînes
        const similarTitles = stringSimilarity.findBestMatch(poemTitle, allTitles).ratings
          .filter(result => result.rating > 0.3) // Filtrer les titres similaires avec un seuil de similarité (0.3)
          .sort((a, b) => b.rating - a.rating) // Trier les résultats par ordre décroissant de similarité
          .slice(0, 5) // Limiter le nombre de suggestions à 5
          .map(result => result.target); // Extraire les titres similaires

        // Vérifier s'il y a des titres similaires trouvés
        if (similarTitles.length > 0) {
          const suggestions = similarTitles.join("\n"); // Joindre les titres similaires en une seule chaîne
          api.sendMessage(`Je n'ai pas trouvé de poème avec ce titre exact. Peut-être vouliez-vous dire :\n\n${suggestions}`, event.threadID);
          // Envoyer les suggestions de titres similaires à l'utilisateur
        } else {
          api.sendMessage("Aucun poème similaire trouvé. Essayez un autre titre.", event.threadID);
          // Informer l'utilisateur qu'aucun titre similaire n'a été trouvé
        }
      }
    } catch (error) {
      // Gestion des erreurs en cas de problème avec l'API ou le code
      console.error('Erreur lors de la requête à l\'API PoetryDB:', error.message);
      api.sendMessage("Une erreur est survenue lors du traitement de votre demande.", event.threadID);
    }
  }
};

// Fonction pour découper le texte en segments de 500 caractères maximum
function chunkText(text, size) {
  const chunks = []; // Tableau pour stocker les segments de texte
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size)); // Découper le texte en morceaux de taille spécifiée
  }
  return chunks; // Retourner les segments de texte
}

// Fonction pour traduire un segment de texte
async function translateTextSegment(segment) {
  const translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(segment)}&langpair=en|fr`;
  // Construire l'URL de l'API MyMemory pour la traduction
  const translationResponse = await axios.get(translateUrl); // Faire une requête GET pour traduire le texte
  return translationResponse.data.responseData.translatedText; // Retourner le texte traduit
}

// Fonction pour traduire tout le texte en découpant si nécessaire
async function translateText(text) {
  const chunks = chunkText(text, 500); // Découper le texte en morceaux de 500 caractères maximum
  const translatedChunks = await Promise.all(chunks.map(chunk => translateTextSegment(chunk)));
  // Traduire chaque morceau de texte simultanément
  return translatedChunks.join(" "); // Joindre les morceaux traduits en une seule chaîne
}
