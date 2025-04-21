const express = require("express");
const router = express.Router();
const seedlingController = require("../controllers/seedling.controller");
const { protect } = require("../middleware/auth");

// All seedling routes require authentication
router.use(protect);

// Routes for seedlings
router.get("/", seedlingController.getAllSeedlings);
router.get("/samples", seedlingController.getSampleSeedlings);
router.get("/:id", seedlingController.getSeedlingById);
router.post("/", seedlingController.createSeedling);
router.put("/:id", seedlingController.updateSeedling);
router.delete("/:id", seedlingController.deleteSeedling);

module.exports = router;
