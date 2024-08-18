const { loadImage, createCanvas } = require('canvas');
const fs = require('fs-extra');
const axios = require('axios');

module.exports = {
    config: {
        name: "biliboard",
        version: "9.7.5",
        hasPermission: 0,
        credits: "John Lester",
        description: "Generate an image with text overlay.",
        commandCategory: "edit-img",
        usages: "[text]",
        cooldowns: 5,
        dependencies: {
            "canvas": "",
            "axios": "",
            "fs-extra": ""
        }
    },

    wrapText: (ctx, text, maxWidth) => {
        return new Promise(resolve => {
            if (ctx.measureText(text).width < maxWidth) return resolve([text]);
            if (ctx.measureText('W').width > maxWidth) return resolve(null);
            const words = text.split(' ');
            const lines = [];
            let line = '';
            while (words.length > 0) {
                let split = false;
                while (ctx.measureText(words[0]).width >= maxWidth) {
                    const temp = words[0];
                    words[0] = temp.slice(0, -1);
                    if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
                    else {
                        split = true;
                        words.splice(1, 0, temp.slice(-1));
                    }
                }
                if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
                else {
                    lines.push(line.trim());
                    line = '';
                }
                if (words.length === 0) lines.push(line.trim());
            }
            return resolve(lines);
        });
    },

    onStart: async function({ api, event, args }) {
        const { senderID, threadID, messageID } = event;
        const text = args.join(" ");
        if (!text) {
            return api.sendMessage("Please enter the content for the board.", threadID, messageID);
        }

        const pathImg = __dirname + '/cache/fact.jpg';
        const imageURL = 'https://i.imgur.com/aOZUbNm.jpg';

        try {
            // Download and save the image
            const response = await axios.get(imageURL, { responseType: 'arraybuffer' });
            fs.writeFileSync(pathImg, Buffer.from(response.data));

            // Create image with text overlay
            const baseImage = await loadImage(pathImg);
            const canvas = createCanvas(baseImage.width, baseImage.height);
            const ctx = canvas.getContext("2d");

            ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
            ctx.font = "bold 400 30px Arial";
            ctx.fillStyle = "#000000";
            ctx.textAlign = "center";

            let fontSize = 40;
            while (ctx.measureText(text).width > 3800) {
                fontSize--;
                ctx.font = `bold 400 ${fontSize}px Arial`;
            }

            const lines = await this.wrapText(ctx, text, 500);
            ctx.fillText(lines.join('\n'), 330, 100); // Adjust text position if needed

            // Save and send the image
            const imageBuffer = canvas.toBuffer();
            fs.writeFileSync(pathImg, imageBuffer);

            api.sendMessage({ attachment: fs.createReadStream(pathImg) }, threadID, () => fs.unlinkSync(pathImg), messageID);
        } catch (error) {
            console.error('Error generating image:', error);
            api.sendMessage("An error occurred while generating the image.", threadID, messageID);
        }
    }
};
