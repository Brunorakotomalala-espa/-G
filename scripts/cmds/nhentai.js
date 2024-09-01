const { get } = require('axios');

const nm = ["⓪", "⓵", "⓶", "⓷", "⓸", "⓹", "⓺", "⓻", "⓼", "⓽"];


module.exports = {
  config: {
    name: "nhentai",
    aliases: ["nh"],
    version: "1.3",
    author: "issam6",
    shortDescription: "Search for hentai",
    guide: {
      en: "{pn} query"
    }
  },

  onStart: async function({ message, args, event }) {
    let q = args.join(" ");
    let p = 1;
    let nan = q.split("-");
    if (nan.length > 1) {
      let am = nan[1];
      if (!isNaN(am)) {
        p = am;
      } else {
        return message.reply("Enter a valid number");
      }
    }
    if (!q) {
      return message.reply("Enter hentai name");
    }

    try {
      message.reaction('🍭', event.messageID);
      const a = await get(`https://issam-dev-v1.onrender.com/api/nhentai/search?q=${q}&page=${p}`);
      const res = a.data.result;

      
      if (res.length === 0) {
        message.reaction('❌', event.messageID);
        return message.reply("No results found");
      }
      
      message.reaction('✅', event.messageID);
      
      const r6 = res.slice(0, 6);
      let msg = "◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕\n";

      r6.forEach((r, i) => {
        const { name, code } = r;
        const index = (i + 1).toString().split('').map(num => nm[parseInt(num)]).join('');
        msg += `\n◕◕◕◕◕◕◕◕✧${index}✧◕◕◕◕◕◕◕◕\n\n✧◝${name}◜✧\n`;
      });

      const img = await Promise.all(r6.map(async j => await global.utils.getStreamFromURL(j.coverScr)));
      let ne = "»»» ✧◝NEXT";
      if (res.length <= 6) {
        ne = "◍•ᴗ•◍✧*OK*";
      }
      await message.reply({
        body: msg + `\n◕◕◕◕◕◕◕◕◕◕◕◕${ne}`,
        attachment: img
      }, (error, message) => {
        global.GoatBot.onReply.set(message.messageID, {
          commandName: "nhentai",
          messageID: message.messageID,
          author: event.senderID,
          type: "nx",
          pg: 1,
          total: res.length,
          res: res
        });
      });
    } catch (e) {
      console.error("err fetching data:", e);
      return message.reply("error 🔻");
    }
  },

  onReply: async function({ Reply, api, message, event }) {
    const { type, author, pg, total, res } = Reply;
    if (author != event.senderID) return;

    const messageBody = event.body.trim().toLowerCase();

    if (type === "nx" && messageBody === "next") {
      const nextPage = pg + 1;
      const start = (nextPage - 1) * 6;
      const end = start + 6;

      if (start >= total) {
        return message.reply("There are no other results");
      }

      const nextResults = res.slice(start, end);
      let msg = "◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕◕\n";

      nextResults.forEach((d, i) => {
        const { name } = d;
        const index = (start + i + 1).toString().split('').map(num => nm[parseInt(num)]).join('');
        msg += `\n◕◕◕◕◕◕◕◕✧${index}✧◕◕◕◕◕◕◕◕\n\n✧◝${name}◜✧\n`;
      });

      const attachments = await Promise.all(nextResults.map(async j => await global.utils.getStreamFromURL(j.coverScr)));
      let ne = "»»» ✧◝NEXT";
      if (end >= total) {
        ne = "◍•ᴗ•◍✧*OK*";
      }
      await message.reply({
        body: msg + `◕◕◕◕◕◕◕◕◕◕◕◕${ne}`,
        attachment: attachments
      }, (error, message) => {
        global.GoatBot.onReply.set(message.messageID, {
          commandName: "nhentai",
          messageID: message.messageID,
          author: event.senderID,
          type: "nx",
          pg: nextPage,
          total: total,
          res: res
        });
      });
    } else if (!isNaN(messageBody)) {
      const index = parseInt(messageBody, 10) - 1;
      if (index < 0 || index >= res.length) {
        return message.reply(`Reply with a valid number. Available result numbers ${res.length}`);
      }

      const sRe = res[index];
      const { code } = sRe;

      try {
        const res = await get(`https://issam-dev-v1.onrender.com/api/nhentai/view/${code}`);
        const dt = res.data.result;
        let title = 'nothing' 
        if (dt.nativeTitle) {

                    title = dt.nativeTitle;

                }
        let msg = `title: ${dt.title}\nNative Title: ${title}\n`;

        
        const pages = dt.pages;
        let curBch = 1;

        const send = async (batch) => {
          const start = (batch - 1) * 12;
          const end = start + 12;

          if (start >= pages.length) {
            return message.reply("There are no other photos");
          }

          const pgs = await Promise.all(pages.slice(start, end).map(async url => await global.utils.getStreamFromURL(url)));
          let ne = "»»» ✧◝NEXT";
          if (end >= pages.length) {
            ne = "◍•ᴗ•◍✧*OK*";
          }

          await message.reply({
            body: msg + `\n${ne}`,
            attachment: pgs
          }, (error, message) => {
            global.GoatBot.onReply.set(message.messageID, {
              commandName: "nhentai",
              messageID: message.messageID,
              author: event.senderID,
              type: "imagePagination",
              curBch: batch,
              pages: pages
            });
          });
        };

        await send(curBch);

      } catch (e) {
        console.error("Err fetching data:", e);
        return message.reply("An error occurred while fetching data. Please try again");
      }
    } else if (type === "imagePagination" && messageBody === "next") {
      const { curBch, pages } = Reply;
      const nextBatch = curBch + 1;
      const send = async (batch) => {
        const start = (batch - 1) * 12;
        const end = start + 12;

        if (start >= pages.length) {
          return message.reply("There are no other photos");
        }

        const pgs2 = await Promise.all(pages.slice(start, end).map(async url => await global.utils.getStreamFromURL(url)));
        let ne = "»»» ✧◝NEXT";
        if (end >= pages.length) {
          ne = "◍•ᴗ•◍✧*OK*";
        }

        await message.reply({
          body: `\n${ne}`,
          attachment: pgs2
        }, (error, message) => {
          global.GoatBot.onReply.set(message.messageID, {
            commandName: "nhentai",
            messageID: message.messageID,
            author: event.senderID,
            type: "imagePagination",
            curBch: batch,
            pages: pages
          });
        });
      };

      await send(nextBatch);
    }
  }
};
