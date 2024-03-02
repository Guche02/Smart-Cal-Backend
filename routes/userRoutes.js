// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController.js");

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/getUserDetails", UserController.getUserDetails);
router.post("/updatedetails", UserController.updateDetails);
router.post("/logout", UserController.logout);

module.exports = router;
