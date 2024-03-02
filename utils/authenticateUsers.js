// Function to authenticate user based on token

const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require("../model/userModel");

const authenticateUser = async (token) => {
    try {
      if (!token) {
        throw new Error("Authorization header missing");
      }
      const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
      const userId = decoded.userId;
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      throw new Error("Authentication failed");
    }
  };


module.exports = { authenticateUser }