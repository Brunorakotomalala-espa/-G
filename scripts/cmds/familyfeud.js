const axios = require('axios');
let status = true;

module.exports = {
  config: {
    name: 'familyfeud',
    version: '1.0',
    aliases: ["ff", "ff-refresh"],
    author: 'LiANE @nealianacagara',
    role: 0,
    category: 'Ai-Chat',
    shortDescription: {
      en: ` `
    },
    longDescription: {
      en: ` `
    },
    guide: {
      en: '{pn} [query]'
    },
  },
  async onStart({ message, event, api }) {
    const timeA = Date.now();
    if (!status) return;
    try {
      event.prefixes = ["?"];
      //event.strictPrefix = true;
      if (event.type === "message_reply" && api.getCurrentUserID() === event.messageReply.senderID) {
      return;
     }
      const { prefix } = global.GoatBot.config;
      const response = await axios.get("https://cassidybot.onrender.com/postWReply", { params: {
      ...event,
       body: `?${event.body.slice(prefix.length)}`,
     } });
      const { result: { body, messageID }, status: estatus, result } = response.data;
      if (estatus === "fail") {
        return;
      }
      const timeB = Date.now();
      message.reply(body, (_, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: 'familyfeud',
          author: event.senderID,
          result
        });
      });
    } catch (error) {
      // don't do anything 
    }
  },
  async onReply({ Reply, message, event }) {
    const timeA = Date.now();
    const { author, result: messageReply } = Reply;
  /*  if (event.senderID !== author || !status) { 
      return;
    }*/
    messageReply.body = "";
    
      event.prefixes = ["#$#$#$#$#$#$#$"];
      event.strictPrefix = true;
    const response = await axios.get("https://cassidybot.onrender.com/postWReply", { params: { ...event, messageReply } });
    const { result: { body, messageID }, status: estatus, result } = response.data;
    if (estatus === "fail") {
      return;
    }
    const timeB = Date.now();
    message.reply(body, (_, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: 'familyfeud',
        author: event.senderID,
        result
      });
    });
  }
};
