module.exports = {
  config: {
    name: "autoreact",
    author: "👭Bruno👩‍🏭",
    version: "1.0",
    countDown: 5,
    role: 0,
    shortDescription: "Auto React",
    longDescription: " ",
    category: "System",
  },
  onStart: async function () {
    // Add initialization logic here if needed
  },
  onChat: async function ({ event, api }) {
    // Liste des émojis à utiliser comme réactions
    const reactions = [
      "😘", "😂", "🤣", "🍟", "😎", "❤️", "💕", "🍓", "🍒", "💥", "👈", "🐔", "🐓", "🎉", 
      "👉", "⚾", "😍", "💗", "😗", "👍", "🥰", "🤩", "🥳", "😊", "😜", "🤪", "😛", "🥴", 
      "😹", "😻", "❤️", "♥️", "❣️", "💓", "💝", "💅", "🤼", "👷", "👸", "👩‍🚒", "👩‍🏫", 
      "👩‍🔧", "👩‍⚖️", "👩‍💼", "👩‍🏭", "👭", "💏", "👯", "👨‍❤️‍👨", "👩‍❤️‍👩", "🌺", 
      "💐", "💮", "🌾", "🍃", "🍂", "🌲", "🌵", "❄️"
    ];

    // Choisir un émoji aléatoire dans la liste des réactions
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];

    // Affiche le message reçu pour le débogage
    console.log("Message:", event.body);
    console.log("Reacting with:", randomReaction);

    // Ajoute la réaction aléatoire au message
    api.setMessageReaction(randomReaction, event.messageID, event.threadID, api);
  },
};
