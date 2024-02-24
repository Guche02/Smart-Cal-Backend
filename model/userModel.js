const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require("bcrypt");

const foodSchema = new mongoose.Schema({
  foodName: { type: String, required: true },
  serving: { type: String, required: true },
  calories: { type: Number, required: true },

});

const dailyLogSchema = new mongoose.Schema({
  day: { type: Date, required: true },
  foodEaten: [foodSchema], // Array of food items
  totalCalories: { type: Number, default: 0 }, // Total calories for the day
});

const userSchema = new mongoose.Schema({ 
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  calorieGoalPerDay: { type: Number, required: true },
  dailyLogs: [dailyLogSchema], // Array of daily logs
});

userSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Plugin passport-local-mongoose into the schema
userSchema.plugin(passportLocalMongoose ,{ usernameField: 'email' });

module.exports = mongoose.model('User', userSchema);
