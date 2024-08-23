const axios = require('axios');

module.exports = {
  config: {
    name: "weather",
    author: "Bruno", //api by Bruno
    version: "1.0.0",
    countDown: 5,
    role: 0,
    category: "Ai",
    shortDescription: {
      en: "{p}weather2"
    }
  },
  onStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage("Veuillez fournir un nom de ville pour obtenir la météo.", event.threadID);
      }

      const city = encodeURIComponent(args.join(" "));
      const apiUrl = `https://weather-api-44r1.onrender.com/api/weather?city=${city}`;

      const response = await axios.get(apiUrl);

      if (response.data) {
        const weatherData = response.data;
        const mainWeather = weatherData.weather[0];

        // Format des informations météo en français
        const weatherInfo = `
Météo à ${weatherData.name}, ${weatherData.sys.country} :
- Température : ${weatherData.main.temp}°C (Ressenti : ${weatherData.main.feels_like}°C)
- Températures Min/Max : ${weatherData.main.temp_min}°C / ${weatherData.main.temp_max}°C
- Temps : ${mainWeather.main} (${mainWeather.description})
- Humidité : ${weatherData.main.humidity}%
- Vitesse du vent : ${weatherData.wind.speed} m/s
        `;

        api.sendMessage(weatherInfo, event.threadID);
      } else {
        api.sendMessage("Impossible d'obtenir les données météorologiques.", event.threadID);
      }
    } catch (error) {
      console.error('Erreur lors de la requête API météo :', error.message);
      api.sendMessage("Une erreur est survenue lors de la récupération des données météo.", event.threadID);
    }
  }
};
