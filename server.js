const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
require('dotenv').config();
const session = require("express-session");
const userRoutes = require("./routes/userRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const app = express();

// Session middleware
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false
}));

app.use(cors());
app.use(express.json());

// Connection string of MongoDB
const connection_url = process.env.MONGO_URL;
mongoose.connect(connection_url);


app.use("/user", userRoutes);
app.use("/device", deviceRoutes);


// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}.`);
});