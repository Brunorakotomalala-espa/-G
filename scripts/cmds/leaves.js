let messageCounts = {};
const spamThreshold = 10;
const spamInterval = 60000;
let spamDetectionActive = true;

module.exports = {
  config: {
    name: "leaves",
    author: "cliff", // api by hazey
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}bruno"
    }
  },

  onStart: async function({ api, event, args }) {
    const { threadID } = event;
    const action = args.join(' '); // Combine all arguments into a single string

    // Check if the bot is an admin
    if (!(await api.getThreadInfo(threadID)).adminIDs.some(e => e.id == api.getCurrentUserID())) {
      return api.sendMessage("Erreur : Le bot doit être administrateur pour activer cette commande.", threadID);
    }

    // Handle different actions
    if (action === 'on') {
      spamDetectionActive = true;
      api.sendMessage("🛡️ | Détection de spam activée", threadID);
    } 
    else if (action === 'off') {
      spamDetectionActive = false;
      api.sendMessage("📪 | Détection de spam désactivée", threadID);
    }
    else if (action === 'leave all') {
      const threadInfo = await api.getThreadInfo(threadID);
      const memberIDs = threadInfo.participantIDs;

      // Remove all members except the bot
      for (const memberID of memberIDs) {
        if (memberID !== api.getCurrentUserID()) {
          await api.removeUserFromGroup(memberID, threadID);
        }
      }
      api.sendMessage("🗑️ | Tous les membres ont été supprimés du groupe.", threadID);
    }
    else {
      api.sendMessage("Commande invalide. Utilisez 'on', 'off' ou 'leave all'.", threadID);
    }
  },

  handleEvent: async function({ api, event }) {
    if (!spamDetectionActive) return;

    const { threadID, messageID, senderID } = event;

    // Check if the bot is an admin
    if (!(await api.getThreadInfo(threadID)).adminIDs.some(e => e.id == api.getCurrentUserID())) {
      return;
    }

    if (!messageCounts[threadID]) {
      messageCounts[threadID] = {};
    }

    if (!messageCounts[threadID][senderID]) {
      messageCounts[threadID][senderID] = {
        count: 1,
        timer: setTimeout(() => {
          delete messageCounts[threadID][senderID];
        }, spamInterval)
      };
    } else {
      messageCounts[threadID][senderID].count++;
      if (messageCounts[threadID][senderID].count > spamThreshold) {
        api.removeUserFromGroup(senderID, threadID);
        const message = `🛡️ | Détection de spam. L'utilisateur ${senderID} a été retiré du groupe.`;
        
        if (message && message.trim()) {
          api.sendMessage(message, threadID, messageID);
        } else {
          console.log("Message vide, rien n'a été envoyé.");
        }
      }
    }
  }
};
