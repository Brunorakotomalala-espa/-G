const axios = require('axios');

module.exports = {
  config: {
    name: "booksearch",
    author: "cliff",
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}search books"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Veuillez fournir un terme de recherche pour les livres.", event.threadID);
      }

      const searchTerm = encodeURIComponent(args.join(" "));
      const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchTerm}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.items && response.data.items.length > 0) {
        const book = response.data.items[0].volumeInfo;
        const message = `
          Titre : ${book.title}
          Auteur(s) : ${book.authors ? book.authors.join(", ") : "Inconnu"}
          Éditeur : ${book.publisher || "Inconnu"}
          Date de publication : ${book.publishedDate || "Inconnue"}
          Description : ${book.description ? book.description.substring(0, 200) + "..." : "Aucune description disponible"}
          Lien : ${book.infoLink}
        `;
        api.sendMessage(message, event.threadID);
      } else {
        api.sendMessage("Aucun livre trouvé pour le terme de recherche.", event.threadID);
      }
    } catch (error) {
      console.error('Erreur lors de la requête à l\'API Google Books:', error.message);
      api.sendMessage("Une erreur est survenue lors du traitement de votre demande.", event.threadID);
    }
  }
};
