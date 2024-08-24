const axios = require('axios');

module.exports = {
  config: {
    name: "mail",
    author: "cliff", // api by hazey
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}mail generate | {p}mail inbox"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      const command = args[0];
      const userId = event.senderID; // Identifiant de l'utilisateur pour stocker l'email généré

      if (command === 'generate') {
        // Pas de prompt requis pour la génération d'email
        const generateEmailUrl = `https://t-mail.vercel.app/api/generate_email`;

        const response = await axios.get(generateEmailUrl);

        if (response.data && response.data.status && response.data.email) {
          const email = response.data.email;

          // Stockez l'email généré dans un espace de stockage temporaire pour l'utilisateur
          this.emailStorage[userId] = email;

          api.sendMessage(`🍟Email generated🍟: ${email}`, event.threadID);
        } else {
          api.sendMessage("Unable to generate an email from the API.", event.threadID);
        }
      } else if (command === 'inbox') {
        // Récupérez l'email stocké pour l'utilisateur
        const email = this.emailStorage[userId];

        if (!email) {
          return api.sendMessage("No generated email found. Please generate an email first using '-mail generate'.", event.threadID);
        }

        const inboxUrl = `https://t-mail.vercel.app/api/inbox?email=${encodeURIComponent(email)}`;
        const inboxResponse = await axios.get(inboxUrl);

        if (inboxResponse.data && inboxResponse.data.status) {
          const inboxData = inboxResponse.data;
          let message = `🎉Inbox for email🎉 ${email}:\n`;

          if (inboxData.messages && inboxData.messages.length > 0) {
            inboxData.messages.forEach((msg, index) => {
              message += `\n**Message ${index + 1}:**\n`;
              message += `- **From:** ${msg.from}\n`;
              message += `- **Subject:** ${msg.subject}\n`;
              message += `- **Body:** ${msg.body}\n`; // Ajustez en fonction du format réel
            });
          } else {
            message += "No messages found in the inbox.";
          }

          api.sendMessage(message, event.threadID);
        } else {
          api.sendMessage("Unable to get inbox data from the API.", event.threadID);
        }
      } else {
        api.sendMessage("Invalid command. Use '-mail generate' to generate an email or '-mail inbox' to check the inbox.", event.threadID);
      }
    } catch (error) {
      console.error('Error handling API request:', error.message);
      api.sendMessage("An error occurred while processing your request.", event.threadID);
    }
  },
  emailStorage: {} // Stockage temporaire des emails générés
};
