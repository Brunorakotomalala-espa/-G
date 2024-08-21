const axios = require('axios');

module.exports = {
  config: {
    name: "Github",
    author: "cliff", // api by hazey
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
        return api.sendMessage("Please provide a prompt for the GitHub repository search.", event.threadID);
      }

      const query = encodeURIComponent(args.join(" "));
      const apiUrl = `https://api.github.com/search/repositories?q=${query}`;

      const response = await axios.get(apiUrl);

      if (response.data && response.data.items && response.data.items.length > 0) {
        // Format the response to display relevant information about repositories
        const repos = response.data.items.slice(0, 5); // Limit to first 5 results
        let message = "Here are some GitHub repositories matching your query:\n";

        repos.forEach(repo => {
          message += `- ${repo.name}: ${repo.html_url}\n`;
        });

        api.sendMessage(message, event.threadID);
      } else {
        api.sendMessage("No repositories found matching your query.", event.threadID);
      }
    } catch (error) {
      console.error('Error making GitHub API request:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  }
};
