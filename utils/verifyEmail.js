const axios = require('axios');
require('dotenv').config();

const verifyEmail = async (email) => {
  const apiKey = process.env.EMAIL_API_KEY;

  try {
    const response = await axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.EMAIL_API_KEY}&email=${email}`);

    const isSMTPValid = response.data.is_smtp_valid.value;
    // Assuming the response contains calorie information
    return isSMTPValid;

  } catch (error) {
    console.error('Request failed:', error.message);
    return 0; // Return 0 calories in case of an error
  }
};


module.exports = { verifyEmail }


