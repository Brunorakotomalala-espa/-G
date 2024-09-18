const axios = require('axios');

module.exports = {
  config: {
    name: "search",
    author: "Bruno Rakotomalala", // API by Deku
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Search",
    shortDescription: {
      en: "{p}search [query]"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Please provide a search query.", event.threadID);
      }

      const query = encodeURIComponent(args.join(" "));
      const apiUrl = `https://deku-rest-api.gleeze.com/prn/search/${query}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.results) {
        const results = response.data.results;
        let message = `Search results for "${query}":\n\n`;

        results.forEach((result, index) => {
          message += `${index + 1}. ${result.title} - ${result.url}\n`;
        });

        api.sendMessage(message, event.threadID);
      } else {
        api.sendMessage("No results found for your search query.", event.threadID);
      }
    } catch (error) {
      console.error('Error making search API request:', error.message);
      api.sendMessage("An error occurred while processing your search request.", event.threadID);
    }
  }
};
