const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "accept",
        version: "1.0",
        author: "YourName",
        countDown: 5,
        role: 1,
        description: {
            vi: "Chấp nhận yêu cầu kết bạn",
            en: "Accept friend requests"
        },
        category: "social",
        guide: {
            vi: "   {pn} approve <UID>: Chấp nhận yêu cầu kết bạn theo UID",
            en: "   {pn} approve <UID>: Accept friend request by UID"
        }
    },

    langs: {
        vi: {
            invalidSyntax: "Cú pháp không hợp lệ. Sử dụng: acc approve <UID>",
            approved: "Đã chấp nhận yêu cầu kết bạn cho UID %1",
            failed: "Không thể chấp nhận yêu cầu kết bạn cho UID %1",
            friendRequests: "Danh sách yêu cầu kết bạn:\n%1\nChấp nhận yêu cầu kết bạn bằng UID: acc approve <UID>"
        },
        en: {
            invalidSyntax: "Invalid syntax. Use: acc approve <UID>",
            approved: "Approved friend request for UID %1",
            failed: "Failed to approve friend request for UID %1",
            friendRequests: "Friend requests list:\n%1\nApprove friend request using UID: acc approve <UID>"
        }
    },

    onStart: async function ({ args, message, event, api, getLang }) {
        const handleApprove = async (targetUID) => {
            const form = {
                av: api.getCurrentUserID(),
                fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
                doc_id: "3147613905362928",
                variables: JSON.stringify({
                    input: {
                        source: "friends_tab",
                        actor_id: api.getCurrentUserID(),
                        friend_requester_id: targetUID,
                        client_mutation_id: Math.round(Math.random() * 19).toString(),
                    },
                    scale: 3,
                    refresh_num: 0,
                }),
            };
            const success = [];
            const failed = [];
            try {
                const friendRequest = await api.httpPost(
                    "https://www.facebook.com/api/graphql/",
                    form,
                );
                if (JSON.parse(friendRequest).errors) failed.push(targetUID);
                else success.push(targetUID);
            } catch (e) {
                failed.push(targetUID);
            }
            return { success, failed };
        };

        if (args[0] === "approve") {
            if (args.length !== 2 || isNaN(args[1])) {
                return message.reply(getLang("invalidSyntax"));
            }
            const targetUID = args[1];
            const { success, failed } = await handleApprove(targetUID);
            if (success.length > 0) {
                message.reply(getLang("approved", success.join(", ")));
            }
            if (failed.length > 0) {
                message.reply(getLang("failed", failed.join(", ")));
            }
            return;
        }

        const form = {
            av: api.getCurrentUserID(),
            fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
            fb_api_caller_class: "RelayModern",
            doc_id: "4499164963466303",
            variables: JSON.stringify({ input: { scale: 3 } }),
        };
        const listRequest = JSON.parse(
            await api.httpPost("https://www.facebook.com/api/graphql/", form),
        ).data.viewer.friending_possibilities.edges;

        let msg = "";
        let i = 0;
        for (const user of listRequest) {
            i++;
            msg +=
                `\n${i}. Name: ${user.node.name}` +
                `\nID: ${user.node.id}` +
                `\nUrl: ${user.node.url.replace("www.facebook", "fb")}` +
                `\nTime: ${moment(user.time * 1000).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}\n`;
        }
        message.reply(getLang("friendRequests", msg));
    }
};
