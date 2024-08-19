const axios = require('axios');

module.exports = {
  config: {
    name: "bacc",
    author: "Bruno", //api by Bruno
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Education",
    shortDescription: {
      en: "{p}bacResult"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Please provide a candidate number.", event.threadID);
      }

      const candidateNumber = args[0];
      const apiUrl = `https://bacc.univ-fianarantsoa.mg/api/search/num/${candidateNumber}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.count > 0) {
        // The API response contains a "message" field that can be sent directly to the user
        const resultMessage = response.data.message;

        api.sendMessage(resultMessage, event.threadID);
      } else {
        api.sendMessage(`No result found for candidate number ${candidateNumber}.`, event.threadID);
      }
    } catch (error) {
      console.error('Error fetching Bac result:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
