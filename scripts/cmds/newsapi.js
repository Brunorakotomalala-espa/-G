const axios = require('axios');

module.exports = {
  config: {
    name: "newsapi",
    author: "cliff", // API by hazey
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}news"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Please provide a source for the news.", event.threadID);
      }

      // Encode the source parameter
      const source = encodeURIComponent(args.join(" "));
      // Update this URL to use your deployed API
      const apiUrl = `https://news-api-zwkp.onrender.com/api/news?source=${source}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.articles) {
        const articles = response.data.articles.slice(0, 5); // Get the first 5 articles
        let message = "Here are the top news articles:\n\n";

        articles.forEach((article, index) => {
          message += `${index + 1}. ${article.title}\n${article.url}\n\n`;
        });

        api.sendMessage(message, event.threadID);
      } else {
        api.sendMessage("Unable to get news articles from the API.", event.threadID);
      }
    } catch (error) {
      console.error('Error making News API request:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
