const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require('mongoose')
require('dotenv').config();
const axios = require("axios");
const FormData = require("form-data");
const { getCalorie } = require("./api_request");


const fs = require("fs"); //for image handling.
app.use(cors());
app.use(express.json());

// Connection string of MongoDB
const connection_url = "Your Mongo URI";

mongoose.connect(connection_url);

// Importing the User model
const User = require("./model/userModel");

// Route to register a new user
app.post("/register", async (req, res) => {
  try {
    const registrationData = req.body;

    // Create a new user document using the User model
    const newUser = new User({
      name: registrationData.name,
      age: registrationData.age,
      height: registrationData.height,
      weight: registrationData.weight,
      calorieGoalPerDay: registrationData.calorieGoalPerDay,
      dailyLogs: [] // Initial daily logs array is empty
    });

    // Save the new user document to the database
    await newUser.save();

    // Send a response back to the client
    res.json({ message: "User registered successfully", user: newUser });
    console.log("Data registered successfully!");
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get user details
app.get("/getUserDetails", async (req, res) => {
  try {
    // Retrieve the first user document from the database
    const latestUser = await User.findOne().sort({ _id: -1 });

    if (!latestUser) {
      return res.status(404).json({ message: "No user found" });
    }

    // Send the retrieved user details as a response
    res.json(latestUser);
  } catch (error) {
    console.error('Error retrieving user details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get device information and detect food items
app.get("/getDeviceInfo", async (req, res) => {
  const { dateTime } = req.query; // Get date-time from the query parameters

  const imagePath = "test.jpg";

  // Read the image file as a buffer
  const imageBuffer = fs.readFileSync(imagePath);

  // Create a FormData object
  const formData = new FormData();

  // Append the image file to the FormData object
  formData.append("file", imageBuffer, { filename: "image.jpg" });

  try {
    // Send a POST request to the prediction endpoint
    const response = await axios.post("http://127.0.0.1:5000/predict", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("File uploaded successfully.");
    console.log(response.data);

    // Extract detected food items from the response
    const detectedInstances = response.data.detected_instances.map(async (instance) => ({
      foodName: instance.class_name,
      serving: "1.5 gm", // Assuming serving size for each detected instance is 1
      calories: await getCalorie(`1.5gm ${instance.class_name}`), // Get calorie count for each food item
    }));

    // Wait for all promises to resolve
    const instancesWithCalories = await Promise.all(detectedInstances);

    // Calculate total calories for the day
    const totalCalories = instancesWithCalories.reduce((total, instance) => total + instance.calories, 0);

    // Find the latest user
    const latestUser = await User.findOne().sort({ _id: -1 });

    if (!latestUser) {
      return res.status(404).json({ error: "No user found" });
    }

    // Check if a daily log exists for the current day
    const currentDate = new Date().toDateString();
    let dailyLog = latestUser.dailyLogs.find(log => log.day.toDateString() === currentDate);

    if (!dailyLog) {
      // If no daily log exists for the specified date, create a new one
      dailyLog = {
        day: new Date(),
        foodEaten: [],
        totalCalories: 0,
      };
      // Push the newly created daily log to the user's dailyLogs array
      latestUser.dailyLogs.push(dailyLog);

      // Save the updated user document with the new daily log
      await latestUser.save();
    }

    // Add the detected food items to the foodEaten array
    dailyLog.foodEaten.push(...instancesWithCalories);

    // Update the total calories for the day
    dailyLog.totalCalories += totalCalories;

    // rounding off the calorie values.
    dailyLog.totalCalories.toFixed(0);

    // Update the daily log in the user document
    await User.findOneAndUpdate(
      { _id: latestUser._id, "dailyLogs.day": dailyLog.day },
      { $set: { "dailyLogs.$": dailyLog } },
      { upsert: true }
    );

    // Send the response back with the food details
    res.json({ total_calories_taken: dailyLog.totalCalories, instances: instancesWithCalories });

  } catch (error) {
    console.error('Error fetching device information:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}.`);
});
