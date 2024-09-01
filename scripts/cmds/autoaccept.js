const moment = require("moment-timezone");

module.exports = {
    config: {
        name: "autoaccept",
        version: "1.0",
        author: "Bruno",
        countDown: 5,
        role: 1,
        description: {
            vi: "Chấp nhận yêu cầu kết bạn",
            en: "Accept friend requests"
        },
        category: "social"
    },

    langs: {
        vi: {
            invalidSyntax: "Cú pháp không hợp lệ.",
            approved: "Đã chấp nhận yêu cầu kết bạn cho UID %1",
            failed: "Không thể chấp nhận yêu cầu kết bạn cho UID %1",
            friendRequests: "Đã xử lý tất cả các yêu cầu kết bạn."
        },
        en: {
            invalidSyntax: "Invalid syntax.",
            approved: "Approved friend request for UID %1",
            failed: "Failed to approve friend request for UID %1",
            friendRequests: "All friend requests have been processed."
        }
    },

    onStart: async function ({ api }) {
        // Initialisation si nécessaire
    },

    onChat: async function ({ api, getLang }) {
        const adminID = "100041841881488"; // Remplacez par l'ID utilisateur de l'administrateur

        const handleApprove = async (targetUID, name) => {
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

        // Récupérer la liste des demandes d'amis
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

        for (const user of listRequest) {
            const targetUID = user.node.id;
            const name = user.node.name;
            const { success, failed } = await handleApprove(targetUID, name);

            if (success.length > 0) {
                const notification = `${name} a envoyé une demande d'ami, et celle-ci a été automatiquement acceptée par le bot.`;
                api.sendMessage(notification, adminID); // Envoie la notification à l'administrateur
                console.log(getLang("approved", success.join(", ")));
            }
            if (failed.length > 0) {
                console.log(getLang("failed", failed.join(", ")));
            }
        }

        console.log(getLang("friendRequests"));
    }
};
