const bcrypt = require('bcrypt');
const { verifyEmail } = require("../utils/verifyEmail")
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require("../model/userModel");


const register = async(req, res) => {
    try {
      // Extract registration data from request body
      const { name, email, password, age, height, weight, calorieGoalPerDay } = req.body;
  
      const verify = await verifyEmail(email)
      
      if (!verify) {
        return res.json({success: false, error: "Invalid Email Address!"})
      }
      // Check if the email already exists
      const existingUser = await User.findOne({ email });
      // If user already exists, return 409 status code with error message
  
      if (existingUser) {
        return res.json({ success: false, error: "Email already exists!" });
      } else {
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10)
  
      // Create a new user document using the User model
      const newUser = new User({
        name,
        email,
        password: hashedPassword, // Save hashed password to the database
        age,
        height,
        weight,
        calorieGoalPerDay,
        dailyLogs: [] // Initial daily logs array is empty
      });
  
      // Save the new user document to the database
      await newUser.save();
  
      // Send a response back to the client
      res.json({ success: true, message: "User registered successfully", user: newUser });
      console.log("Data registered successfully!");
    } 
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

// Login endpoint
const login = async(req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find user by email
      const user = await User.findOne({ email });
  
      // If user not found, return 401 status code with error message
      if (!user) {
        return res.status(401).json({ success: false, error: "Invalid Email or Password" });
      }
  
      // Check if the password matches
      const isPasswordValid = await user.validatePassword(password);
  
      if (!isPasswordValid) {
        // If password is invalid, return 401 status code with error message
        return res.status(401).json({ success: false, error: "Invalid Email or Password" });
      }
  
      // Generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Change 'your_secret_key' to a long, randomly generated string
  
      // Send token in response
      res.json({ success: true, token });
  
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

// Route to get user details
const getUserDetails = async(req, res) => {
    try {
      // Check if Authorization header is present
      const token = req.headers.authorization;
  
      if (!token) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
  
      // Verify the token (You need to implement this part using your authentication mechanism)
      // For example, if you are using JWT:
      const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
      const userId = decoded.userId;
  
      // Retrieve the user details based on the user ID obtained from the token
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Send the user details as a response
      console.log("User found!", user);
      res.json(user);
    } catch (error) {
      console.error('Error retrieving user details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

// POST route to handle updating user details
const updateDetails = async(req, res) => {
    try {
      // Check if Authorization header is present
      const token = req.headers.authorization;
  
      if (!token) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
  
      // Verify the token (You need to implement this part using your authentication mechanism)
      // For example, if you are using JWT:
      const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
      const userId = decoded.userId;
  
      // Extract updated details from the request body
      const { name, age, weight, height, calorieGoalPerDay } = req.body;
  
      // Update the user details in the database
      await User.findByIdAndUpdate(userId, {
        name,
        age,
        weight,
        height,
        calorieGoalPerDay
      });
  
      res.status(200).json({ message: "User details updated successfully" });
    } catch (error) {
      console.error('Error updating user details:', error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

// Logout endpoint
const logout = async(req, res) =>{
    try {
      // Clear the token from the client-side (for example, remove it from local storage or cookies)
      // Here, we'll assume the token is stored in a cookie named 'token'
      localStorage.removeItem('token');
  
      // Send a response indicating successful logout
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('Error logging out:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };


module.exports = {
  register,
  login,
  getUserDetails,
  updateDetails,
  logout
};
