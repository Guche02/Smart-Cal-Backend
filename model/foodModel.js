const mongoose = require('mongoose');

// Define the food schema
const foodSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  serving: { type: Number, required: true },
  caloriesPerServe: { type: Number, required: true },
  proteinsPerServe: { type: Number, required: true },
  // Add other properties as needed
});

module.exports = mongoose.model('Food',foodSchema)