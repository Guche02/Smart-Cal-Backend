const axios = require("axios");
const FormData = require("form-data");
const { getCalorie } = require("../utils/api_request");
const jwt = require('jsonwebtoken');
const path = require('path'); // Add this line to import the path module
require('dotenv').config();
const fs = require('fs');
const User = require("../model/userModel");


// Define a route to serve the image file
const getImage = async(req, res) =>{
    // Define the path to the images folder
    const imagesFolder = path.join(__dirname, '..', 'images');
    try {
      // Read the list of image files from the images folder
      fs.readdir(imagesFolder, (err, files) => {
        if (err) {
          console.error('Error reading images folder:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        // Filter only files with image extensions
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
  
        // Check if there are any image files
        if (imageFiles.length === 0) {
          return res.status(404).json({ error: 'No images found' });
        }
  
        // Get the path of the first image file
        const imagePath = path.join(imagesFolder, imageFiles[0]);
  
        // Create a read stream to the image file
        const imageStream = fs.createReadStream(imagePath);
  
        // Set the appropriate content type
        res.setHeader('Content-Type', 'image/jpg');
  
        // Pipe the image stream to the response
        imageStream.pipe(res);
      });
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

// DELETE route to delete the current image file
const deleteImage = async(req, res) => {
    // Define the path to the images folder
    const imagesFolder = path.join(__dirname, '..', 'images');
    try {
      // Read the list of image files from the images folder
      fs.readdir(imagesFolder, (err, files) => {
        if (err) {
          console.error('Error reading images folder:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        // Filter only files with image extensions
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
  
        if (imageFiles.length === 0) {
          return res.status(404).json({ error: 'No image files found' });
        }
  
        const currentImagePath = path.join(imagesFolder, imageFiles[0]);
  
        // Check if the current image file exists
        if (fs.existsSync(currentImagePath)) {
          // Delete the file
          fs.unlinkSync(currentImagePath);
          console.log(`Deleted image file: ${imageFiles[0]}`);
          res.status(200).json({ message: 'Image deleted successfully' });
        } else {
          res.status(404).json({ error: 'Image not found' });
        }
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  
  const getDeviceInfo = async(req, res) => {
    // Define the path to the images folder
    const imagesFolder = path.join(__dirname, '..', 'images');
    try {
      const { dateTime } = req.query; // Get date-time from the query parameters
  
      fs.readdir(imagesFolder, async (err, files) => {
        if (err) {
          console.error('Error reading images folder:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        // Filter only files with image extensions
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
  
        if (imageFiles.length === 0) {
          // No images found in the folder
          return res.status(404).json({ error: 'No images found' });
        }
  
        const imagePath = path.join(imagesFolder, imageFiles[0]);
  
        // Read the image file as a buffer
        const imageBuffer = fs.readFileSync(imagePath);
  
        // Create a FormData object
        const formData = new FormData();
  
        // Append the image file to the FormData object
        formData.append("file", imageBuffer, { filename: "test.jpg" });
  
        try {
          // Send a POST request to the prediction endpoint
          const response = await axios.post("http://127.0.0.1:5000/predict", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
  
          console.log("File uploaded successfully.");
          console.log(response.data);
  
          // Extract detected food items and visualized image from the response
          const { detected_instances, visualized_image } = response.data;
  
          // Process detected instances as needed
          console.log(detected_instances);
  
          // Extract detected food items from the response
          const detectedInstances = await Promise.all(response.data.detected_instances.map(async (instance) => {
            let servingSize = 60; // Default serving size
  
            // Adjust serving size based on food type
            switch (instance.class_name.toLowerCase()) {
              case "rice":
                servingSize = 160 * 0.80; // Rice density: 0.80 g/cm^3
                break;
              case "spinach":
                servingSize = 160 * 1.016; // Spinach density: 1.016 g/cm^3
                break;
              case "lentils":
                servingSize = 160 * 0.85; // Lentils density: 0.85 g/cm^3
                break;
              default:
                break;
            }
  
            return {
              foodName: instance.class_name,
              serving: servingSize.toFixed(2) + " gm",
              calories: await getCalorie(`${servingSize.toFixed(2)}gm ${instance.class_name}`), // Get calorie count for each food item
            };
          }));
  
          // Calculate total calories for the day
          const totalCalories = detectedInstances.reduce((total, instance) => total + parseFloat(instance.calories), 0);
  
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
  
          // Check if a daily log exists for the current day
          const currentDate = new Date().toDateString();
          let dailyLog = user.dailyLogs.find((log) => log.day.toDateString() === currentDate);
  
          if (!dailyLog) {
            // If no daily log exists for the specified date, create a new one
            dailyLog = {
              day: new Date(),
              foodEaten: [],
              totalCalories: 0,
            };
            // Push the newly created daily log to the user's dailyLogs array
            user.dailyLogs.push(dailyLog);
            await user.save();
          }
  
          // Add the detected food items to the foodEaten array
          dailyLog.foodEaten.push(...detectedInstances);
  
          // Update the total calories for the day
          dailyLog.totalCalories += parseFloat(totalCalories);
  
          // Round the total calories to 2 decimal points
          dailyLog.totalCalories = dailyLog.totalCalories.toFixed(2);
  
          // Update the daily log in the user document
          await User.findOneAndUpdate(
            { _id: user._id, "dailyLogs.day": dailyLog.day },
            { $set: { "dailyLogs.$": dailyLog } },
            { upsert: true }
          );
  
         // Decode the base64 encoded visualized image
        //  const visualizedImageData = Buffer.from(visualized_image, 'base64');
  
  
          // Send the response back with the food details and visualized image
          res.json({ total_calories_taken: dailyLog.totalCalories, instances: detectedInstances, visualized_image: visualized_image});
  
          // Empty the images folder's first file.
          fs.readdir(imagesFolder, (err, files) => {
            if (err) {
              console.error('Error reading images folder:', err);
            } else {
              if (files.length > 0) {
                const firstFilePath = path.join(imagesFolder, files[0]);
                fs.unlinkSync(firstFilePath);
                console.log('First file in images folder deleted.');
              } else {
                console.log('No files found in images folder.');
              }
            }
          });
        } catch (error) {
          console.error("Error fetching device information:", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      });
    } catch (error) {
      console.error("Error fetching device information:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  module.exports = {
    getImage,
    deleteImage,
    getDeviceInfo
  };
  
  

  