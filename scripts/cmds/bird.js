const fs = require('fs');
const path = require('path');

const birdDataPath = path.join(__dirname, 'birdData.json');
let birdData = new Map();

if (fs.existsSync(birdDataPath)) {
    const storedData = JSON.parse(fs.readFileSync(birdDataPath, 'utf8'));
    birdData = new Map(Object.entries(storedData));
}

function saveBirdData() {
    const obj = Object.fromEntries(birdData);
    fs.writeFileSync(birdDataPath, JSON.stringify(obj, null, 2));
}

module.exports = {
    config: {
        name: "bird",
        version: "1.1",
        author: "AceGerome",
        role: 0,
        description: {
            en: "Buy, sell, feed, check, and collect rewards from your birds in this engaging game with special features."
        },
        category: "game",
        guide: {
            en: "{pn} buy/sell/feed/check/collect - Interact with your virtual birds and explore special features."
        }
    },

    onStart: async function ({ message, args, event }) {
        const userID = event.senderID;
        const userData = birdData.get(userID) || { birds: [], coins: 1000, collected: 0, lastFeedTime: null };

        const action = args[0]?.toLowerCase();
        if (!action) return message.reply("Please provide an action: buy, sell, feed, check, or collect.");

        switch (action) {
            case "buy":
                return await buyBird({ message, userData, userID });
            case "sell":
                return await sellBird({ message, userData, userID, args });
            case "feed":
                return await feedBird({ message, userData, userID, args });
            case "check":
                return checkBirds({ message, userData });
            case "collect":
                return await collectRewards({ message, userData, userID });
            default:
                return message.reply("Invalid action! Please use: buy, sell, feed, check, or collect.");
        }
    },
    
    onReply: async function({ message, Reply, event }) {
    const { author, messageID, action, birdIndex, timeout } = Reply;

    if (event.senderID !== author) return;

    clearTimeout(timeout);

    if (event.body.trim().toLowerCase() === 'yes') {
        const userData = birdData.get(author);
        const birdToSell = userData.birds[birdIndex];
        userData.coins += birdToSell.value;
        userData.birds.splice(birdIndex, 1);

        birdData.set(author, userData);
        saveBirdData();

        message.unsend(messageID);
        message.reply(`You sold ${birdToSell.name} for ${birdToSell.value} coins.`);
    } else {
        message.reply("Sale canceled.");
    }

    global.GoatBot.onReply.delete(messageID);
  }
};

async function buyBird({ message, userData, userID }) {
    const maxBirds = 10;
    if (userData.birds.length >= maxBirds) return message.reply(`You cannot own more than ${maxBirds} birds.`);

    if (userData.coins < 200) return message.reply("You don't have enough coins to buy a bird (Cost: 200 coins).");

    const rareBirdChance = Math.random();
    let birdType = "Common";
    let birdValue = 100;

    if (rareBirdChance < 0.1) {
        birdType = "Rare";
        birdValue = 500;
        message.reply("Congratulations! You've bought a rare bird!");
    }

    const newBirdName = `Bird-${userData.birds.length + 1}`;
    const newBird = {
        id: generateID(),
        name: newBirdName,
        level: 1,
        value: birdValue,
        type: birdType 
    };

    userData.coins -= 200;
    userData.birds.push(newBird);

    birdData.set(userID, userData);
    saveBirdData();

    message.reply(`You bought a new ${birdType} bird: ${newBird.name}!`);
}

async function sellBird({ message, userData, userID, args }) {
    if (userData.birds.length === 0) return message.reply("You don't have any birds to sell.");

    if (args.length < 2) {
        return message.reply("Please specify which bird you want to sell or type 'all' to sell all your birds.");
    }

    const sellOption = args[1] ? args[1].toLowerCase() : null;
    if (sellOption === "all") {
        const totalValue = userData.birds.reduce((sum, bird) => sum + bird.value, 0);
        userData.coins += totalValue;
        userData.birds = [];
        birdData.set(userID, userData);
        saveBirdData();
        return message.reply(`You sold all your birds for ${totalValue} coins.`);
    } else {
        const birdIndex = parseInt(args[1]) - 1;
        if (isNaN(birdIndex) || birdIndex < 0 || birdIndex >= userData.birds.length) return message.reply("Invalid bird selection.");

        const birdToSell = userData.birds[birdIndex];
        message.reply(`Are you sure you want to sell ${birdToSell.name} for ${birdToSell.value} coins? Reply with 'yes' to confirm.`, async (err, info) => {
            if (err) throw err;

            const messageID = info.messageID;
            const timeout = setTimeout(() => {
                message.unsend(messageID);
                global.GoatBot.onReply.delete(messageID);
                message.reply("Time's Up! You didn't confirm the sale in time.");
            }, 60000); // 60 seconds

            global.GoatBot.onReply.set(messageID, {
                commandName: 'bird',
                messageID,
                author: userID,
                action: 'sell',
                birdIndex,
                timeout
            });
        });
    }
}



async function feedBird({ message, userData, userID, args }) {
    if (userData.birds.length === 0) return message.reply("You don't have any birds to feed.");

    const cooldownPeriod = 60 * 60 * 1000; // 1 hour cooldown
    const currentTime = Date.now();

    const birdIndex = args[2] ? parseInt(args[2]) - 1 : userData.birds.length - 1;
    if (isNaN(birdIndex) || birdIndex < 0 || birdIndex >= userData.birds.length) {
        return message.reply("Invalid bird selection. Use the correct bird index.");
    }

    const birdToFeed = userData.birds[birdIndex];

    if (birdToFeed.lastFeedTime && currentTime - birdToFeed.lastFeedTime < cooldownPeriod) {
        const timeLeft = ((cooldownPeriod - (currentTime - birdToFeed.lastFeedTime)) / 60000).toFixed(1);
        return message.reply(`You can feed ${birdToFeed.name} again in ${timeLeft} minutes.`);
    }

    const feedType = args[1]?.toLowerCase();
    let feedAmount = 50;

    if (feedType === "snack") feedAmount = 20;
    else if (feedType === "meal") feedAmount = 100;
    else if (feedType) return message.reply("Invalid feed type! Use 'snack' or 'meal'.");

    birdToFeed.level += 1;
    birdToFeed.value += feedAmount;
    birdToFeed.lastFeedTime = currentTime; 

    birdData.set(userID, userData);
    saveBirdData();

    message.reply(`You fed ${birdToFeed.name} with a ${feedType || "regular meal"}. It's now at level ${birdToFeed.level} and worth ${birdToFeed.value} coins.`);
}


function checkBirds({ message, userData }) {
    if (userData.birds.length === 0 && userData.coins === 0) {
        return message.reply("You don't have any birds or coins.");
    }

    let response = "";
    if (userData.birds.length > 0) {
        const birdsInfo = userData.birds.map((bird, index) => 
            `${index + 1}. ${bird.name} - Level: ${bird.level}, Value: ${bird.value}, Type: ${bird.type}`
        ).join("\n");
        response += `Your Birds:\n${birdsInfo}\n`;
    }

    if (userData.coins > 0) {
        response += `\nCoins: ${userData.coins}`;
    }

    message.reply(response);
}


async function collectRewards({ message, userData, userID }) {
    const collectableCoins = userData.birds.reduce((total, bird) => total + (bird.level * 10), 0);
    if (collectableCoins === 0) return message.reply("You have no rewards to collect.");

    const bonus = userData.birds.length >= 5 ? 100 : 0;
    userData.coins += collectableCoins + bonus;
    userData.collected += collectableCoins + bonus;

    birdData.set(userID, userData);
    saveBirdData();

    message.reply(`You collected ${collectableCoins} coins from your birds${bonus ? ` plus a ${bonus} coin bonus!` : "!"}`);
}

function generateID() {
    return Math.random().toString(36).substring(2, 9);
}
