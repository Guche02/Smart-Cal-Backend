const express = require("express");
const cors = require("cors");
const app = express();
require('dotenv').config();
const { getCalorie } = require("./api_request");

const axios = require("axios");
const FormData = require("form-data");

const fs = require("fs"); //for image handling.
app.use(cors());

app.use(express.json());

// object to store user details.
const userDetails = {
  name: String,
  age: Number,
  calorie_intake_goal: Number,
};

app.get("/getUserDetails", (req, res) => {
  res.json(userDetails);
});

// object to store food details.
const foodDetails = {
  total_calories_taken: 0,
  instances: [], // an array to store detected instances
};

app.get("/getDeviceInfo", async (req, res) => {
  const imagePath = "test.jpg";

  // Read the image file as a buffer
  const imageBuffer = fs.readFileSync(imagePath);

  // Create a FormData object
  const formData = new FormData();

  // Append the image file to the FormData object
  formData.append("file", imageBuffer, { filename: "image.jpg" });

  try {
    const response = await axios.post("http://127.0.0.1:5000/predict", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("File uploaded successfully.");
    console.log(response.data);


    // Assuming the response from the prediction endpoint contains food details
    const detectedInstances = response.data.detected_instances.map(async (instance) => ({
      class_name: instance.class_name,
      score: instance.score,
      calorie: await getCalorie(instance.class_name),
    }));

    // Wait for all promises to resolve
    const instancesWithCalories = await Promise.all(detectedInstances);

    foodDetails.instances = instancesWithCalories;
    foodDetails.total_calories_taken = instancesWithCalories.reduce((sum, instance) => sum + instance.calorie, 0);

    console.log(foodDetails);
    res.json(foodDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/register", (req, res) => {
  const registrationData = req.body;
  console.log("Registration Data Received:", registrationData);

  userDetails.name = registrationData.name;
  userDetails.age = registrationData.age;
  userDetails.calorie_intake_goal = registrationData.calorie_intake_goal;

  res.json({ message: "Data received successfully" });
});


// react runs on port 3000, so we choose 4000.
app.listen(4000, () => {
  console.log("Server started on port 4000.");
});
