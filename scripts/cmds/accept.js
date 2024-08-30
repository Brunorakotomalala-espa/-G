const axios = require('axios');
const moment = require('moment-timezone');

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
            vi: "   {pn} accept all: Chấp nhận tất cả yêu cầu kết bạn\n{pn} accept <UID>: Chấp nhận yêu cầu kết bạn theo UID",
            en: "   {pn} accept all: Accept all friend requests\n{pn} accept <UID>: Accept friend request by UID"
        }
    },

    langs: {
        vi: {
            invalidSyntax: "Cú pháp không hợp lệ. Sử dụng: acc accept <UID> hoặc acc accept all",
            approved: "Đã chấp nhận yêu cầu kết bạn cho UID %1",
            failed: "Không thể chấp nhận yêu cầu kết bạn cho UID %1",
            friendRequests: "Danh sách yêu cầu kết bạn:\n%1\nChấp nhận yêu cầu kết bạn bằng UID: acc accept <UID>"
        },
        en: {
            invalidSyntax: "Invalid syntax. Use: acc accept <UID> or acc accept all",
            approved: "Accepted friend request for UID %1",
            failed: "Failed to accept friend request for UID %1",
            friendRequests: "Friend requests list:\n%1\nApprove friend request using UID: acc accept <UID>"
        }
    },

    onStart: async function ({ args, message, event, api, getLang }) {
        if (args[0] === "accept" && args[1] === "all") {
            try {
                // Step 1: Get all friend requests
                const formRequests = {
                    av: api.getCurrentUserID(),
                    fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
                    fb_api_caller_class: "RelayModern",
                    doc_id: "4499164963466303",
                    variables: JSON.stringify({ input: { scale: 3 } }),
                };
                const listRequest = JSON.parse(
                    await api.httpPost("https://www.facebook.com/api/graphql/", formRequests),
                ).data.viewer.friending_possibilities.edges;

                if (listRequest.length === 0) {
                    return message.reply(getLang("friendRequests", "No friend requests to process."));
                }

                // Display friend requests
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

                // Step 2: Accept all friend requests
                const success = [];
                const failed = [];

                for (const user of listRequest) {
                    const targetUID = user.node.id;
                    const formApprove = {
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
                    try {
                        const friendRequest = await api.httpPost(
                            "https://www.facebook.com/api/graphql/",
                            formApprove,
                        );
                        if (JSON.parse(friendRequest).errors) failed.push(targetUID);
                        else {
                            success.push(targetUID);

                            // Send automatic welcome message
                            api.sendMessage(
                                "Bonjour🏝️, je m'appelle Bruno Rakotomalala🏝️. Je suis un chatbot qui peut répondre à vos questions. Si vous avez une question, n'hésitez pas à me l'envoyer en commençant par exemple : '-par Bonjour ou -Bruno Bonjour'.",
                                targetUID
                            );
                        }
                    } catch (e) {
                        failed.push(targetUID);
                    }
                }

                // Notify user
                if (success.length > 0) {
                    message.reply(getLang("approved", success.join(", ")));
                }
                if (failed.length > 0) {
                    message.reply(getLang("failed", failed.join(", ")));
                }
            } catch (e) {
                console.error('Error:', e.message);
                message.reply(getLang("failed"));
            }
            return;
        }

        if (args[0] === "accept") {
            if (args.length !== 2 || isNaN(args[1])) {
                return message.reply(getLang("invalidSyntax"));
            }
            const targetUID = args[1];
            const formApprove = {
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
            try {
                const friendRequest = await api.httpPost(
                    "https://www.facebook.com/api/graphql/",
                    formApprove,
                );
                if (JSON.parse(friendRequest).errors) {
                    message.reply(getLang("failed", targetUID));
                } else {
                    message.reply(getLang("approved", targetUID));

                    // Send automatic welcome message
                    api.sendMessage(
                        "Bonjour🏝️, je m'appelle Bruno Rakotomalala🏝️. Je suis un chatbot qui peut répondre à vos questions. Si vous avez une question, n'hésitez pas à me l'envoyer en commençant par : '-par Bonjour'.",
                        targetUID
                    );
                }
            } catch (e) {
                console.error('Error:', e.message);
                message.reply(getLang("failed", targetUID));
            }
            return;
        }

        message.reply(getLang("invalidSyntax"));
    }
};
