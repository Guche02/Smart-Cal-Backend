const axios = require("axios");
require('dotenv').config();


const getCalorie = async (foodName) => {
  const apiKey = "Your API Key.";

  try {
    const response = await axios.get(`https://api.api-ninjas.com/v1/nutrition?query=${foodName}`, {
      headers: {
        'X-Api-Key': apiKey
      }
    });

    console.log(response.data[0].calories);
    // Assuming the response contains calorie information
    return response.data[0].calories;
  } catch (error) {
    console.error('Request failed:', error.message);
    return 0; // Return 0 calories in case of an error
  }
};


module.exports = { getCalorie }





