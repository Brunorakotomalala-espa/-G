const axios = require('axios');

module.exports = {
  config: {
    name: "fbguard",
    author: "Bruno", // API by Bruno
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}fbguard"
    }
  },

  onStart: async ({ api, event, args }) => {
    const userToken = args[0];

    if (!userToken) {
      return api.sendMessage('PROVIDE A VALID FACEBOOK TOKEN.', event.threadID, event.messageID);
    }

    try {
      const response = await turnShield(userToken);
      api.sendMessage(response, event.threadID);
    } catch (error) {
      console.error(error.message);
      api.sendMessage('FAILED TO TURN ON, PLEASE TRY AGAIN LATER.', event.threadID);
    }
  }
};

async function turnShield(token) {
  const data = `variables={"0":{"is_shielded": true,"session_id":"9b78191c-84fd-4ab6-b0aa-19b39f04a6bc","actor_id":"${await getFacebookUserId(token)}","client_mutation_id":"b0316dd6-3fd6-4beb-aed4-bb29c5dc64b0"}}&method=post&doc_id=1477043292367183&query_name=IsShieldedSetMutation&strip_defaults=true&strip_nulls=true&locale=en_US&client_country_code=US&fb_api_req_friendly_name=IsShieldedSetMutation&fb_api_caller_class=IsShieldedSetMutation`;
  const headers = { "Content-Type": "application/x-www-form-urlencoded", "Authorization": `OAuth ${token}` };
  const url = "https://graph.facebook.com/graphql";

  try {
    await axios.post(url, data, { headers });
    return 'GUARD ON HAS BEEN ACTIVATED.';
  } catch (error) {
    console.error(error);
    throw new Error('FAILED TO TURN ON, PLEASE TRY AGAIN LATER.');
  }
}

async function getFacebookUserId(token) {
  const url = `https://graph.facebook.com/me?access_token=${token}`;
  const response = await axios.get(url);
  return response.data.id;
}
