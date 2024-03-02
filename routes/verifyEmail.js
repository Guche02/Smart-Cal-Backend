const axios = require('axios');
require('dotenv').config();


// axios.get('https://emailvalidation.abstractapi.com/v1/?api_key=5858eed9f6754b9a9fa77b958bd05d78&email=loozasubedy998@gmail.com')
//     .then(response => {
//         console.log(response.data);
//     })
//     .catch(error => {
//         console.log(error);
//     });


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
      
      
      