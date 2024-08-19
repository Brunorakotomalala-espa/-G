const axios = require('axios');

module.exports = {
  config: {
    name: "resultats",
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
        return api.sendMessage("Please provide a candidate number or matricule.", event.threadID);
      }

      const candidateNumber = args[0];
      const fianarantsoaApiUrl = `https://bacc.univ-fianarantsoa.mg/api/search/num/${candidateNumber}`;
      const diegoApiUrl = `https://diego-api.bacc.digital.gov.mg/api/search?num=${candidateNumber}`;

      // Attempt to get result from Fianarantsoa API
      let response = await axios.get(fianarantsoaApiUrl);

      if (response.data && response.data.count > 0) {
        // The Fianarantsoa API response contains a "message" field that can be sent directly to the user
        const resultMessage = response.data.message;
        return api.sendMessage(resultMessage, event.threadID);
      } 

      // If no result from Fianarantsoa, try Diego API
      response = await axios.get(diegoApiUrl);

      if (response.data && response.data.status === "OK") {
        // Diego API returned a valid result
        const resultMessage = response.data.message;
        return api.sendMessage(resultMessage, event.threadID);
      } else if (response.data && response.data.status === "KO") {
        // Diego API returned an error message (invalid number or matricule)
        return api.sendMessage(response.data.errors, event.threadID);
      } else {
        // If neither API returned a valid result
        return api.sendMessage(`No result found for candidate number ${candidateNumber}.`, event.threadID);
      }
      
    } catch (error) {
      console.error('Error fetching Bac result:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
