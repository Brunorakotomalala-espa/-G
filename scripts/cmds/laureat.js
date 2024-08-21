const axios = require('axios');

module.exports = {
  config: {
    name: "n",
    author: "cliff", //api by hazey
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}bruno"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Please provide a number to search for.", event.threadID);
      }

      // Join the arguments to form the full number and encode it for the URL
      const num = encodeURIComponent(args.join(" "));
      const apiUrl = `https://bacc.univ-fianarantsoa.mg/api/search/num/${num}`;

      console.log(`Requesting URL: ${apiUrl}`);

      const response = await axios.get(apiUrl);

      // Log the response to see exactly what is returned
      console.log('API Response:', response.data);

      if (response.data && response.data.count > 0) {
        const result = response.data.bacc[0]; // Access the first result
        const resultMessage = `Search Results:\n\nName: ${result.nom}\nID: ${result.num}\nSerie: ${result.serie}\nMention: ${result.mention}\nCenter: ${result.centre}\nResult: ${result.resultat}`;

        api.sendMessage(resultMessage, event.threadID);
      } else {
        api.sendMessage("No results found for the given number.", event.threadID);
      }
    } catch (error) {
      console.error('Error making the API request:', error.response ? error.response.data : error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
