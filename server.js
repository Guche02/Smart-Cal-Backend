const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
require('dotenv').config();
const axios = require("axios");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require("express-session");
const bcrypt = require('bcrypt');
const FormData = require("form-data");
const { getCalorie } = require("./routes/api_request");
const jwt = require('jsonwebtoken');
const path = require('path'); // Add this line to import the path module
const { exec } = require('child_process');

// Importing the User model
const User = require("./model/userModel");

const fs = require("fs"); //for image handling.


const app = express();

// Session middleware
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport after initializing session middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(cors());
app.use(express.json());

// Connection string of MongoDB
const connection_url = "mongodb+srv://loozasubedy998:mongo%40jojo.com@cluster0.0h7kiso.mongodb.net/SmartcalDB?retryWrites=true&w=majority";
mongoose.connect(connection_url);

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return done(null, false, { message: 'Incorrect email or password' });
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.post("/register", async (req, res) => {
  try {
    // Extract registration data from request body
    const { name, email, password, age, height, weight, calorieGoalPerDay } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

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
    res.json({ message: "User registered successfully", user: newUser });
    console.log("Data registered successfully!");
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // If user not found or password doesn't match, return 401 status code
    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' }); // Change 'your_secret_key' to a long, randomly generated string

    // Send token in response
    res.json({ success: true, token });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Route to get user details
app.get("/getUserDetails", async (req, res) => {
  try {
    // Check if Authorization header is present
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    // Verify the token (You need to implement this part using your authentication mechanism)
    // For example, if you are using JWT:
    const decoded = jwt.verify(token.split(' ')[1], 'your_secret_key');
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
});


// Define the path to the images folder
const imagesFolder = path.join(__dirname, 'images');


// Define a route to serve the image file
app.get("/getImage", (req, res) => {
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
});

// DELETE route to delete the current image file
app.delete("/deleteImage", (req, res) => {
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
});


// // Route to get device information and detect food items
// // Full or relative path to your Python script
// const batchFilePath = "D:\\SmartCal-Final\\server\\path.bat";
 

// // Activate the virtual environment using activate
// exec(`${batchFilePath}`, (error, stdout, stderr) => {
//     if (error) {
//         console.error(`Error: ${error.message}`);
//         return;
//     }
 
//     console.log(`Output:\n${stdout}`);
// });


app.get("/getDeviceInfo", async (req, res) => {
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
        const decoded = jwt.verify(token.split(' ')[1], 'your_secret_key');
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

        // Send the response back with the food details
        res.json({ total_calories_taken: dailyLog.totalCalories, instances: detectedInstances });

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
});

// POST route to handle updating user details
app.post("/updatedetails", async (req, res) => {
  try {
    // Check if Authorization header is present
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    // Verify the token (You need to implement this part using your authentication mechanism)
    // For example, if you are using JWT:
    const decoded = jwt.verify(token.split(' ')[1], 'your_secret_key');
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
});


// Logout endpoint
app.post("/logout", (req, res) => {
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
});


// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}.`);
});