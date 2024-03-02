// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController.js");

router.get("/getImage", deviceController.getImage);
router.delete("/deleteImage", deviceController.deleteImage);
router.get("/getDeviceInfo", deviceController.getDeviceInfo);


module.exports = router;
