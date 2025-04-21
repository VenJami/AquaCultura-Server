const Seedling = require("../models/seedling");
const mongoose = require("mongoose");
const { errorHandler } = require("../utils/errorHandler");
const notificationHelper = require("../utils/notificationHelper");

/**
 * Get all seedlings for the authenticated user
 * @route GET /api/seedlings
 */
exports.getAllSeedlings = async (req, res) => {
  try {
    const seedlings = await Seedling.find({ owner: req.user._id });

    // Add computed fields to each seedling
    const seedlingsWithComputedFields = seedlings.map((seedling) => {
      const seedlingObj = seedling.toObject();
      seedlingObj.daysSincePlanting = calculateDaysSincePlanting(
        seedling.plantedDate
      );
      seedlingObj.expectedTransplantDate = calculateExpectedTransplantDate(
        seedling.plantedDate
      );
      seedlingObj.estimatedHeight = calculateEstimatedHeight(
        seedlingObj.daysSincePlanting,
        seedling.growthRate || 0.5
      );
      return seedlingObj;
    });

    res.json(seedlingsWithComputedFields);
  } catch (err) {
    errorHandler(res, err);
  }
};

/**
 * Get a single seedling by ID
 * @route GET /api/seedlings/:id
 */
exports.getSeedlingById = async (req, res) => {
  try {
    const seedling = await Seedling.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!seedling) {
      return res.status(404).json({ message: "Seedling not found" });
    }

    // Add computed fields
    const seedlingObj = seedling.toObject();
    seedlingObj.daysSincePlanting = calculateDaysSincePlanting(
      seedling.plantedDate
    );
    seedlingObj.expectedTransplantDate = calculateExpectedTransplantDate(
      seedling.plantedDate
    );
    seedlingObj.estimatedHeight = calculateEstimatedHeight(
      seedlingObj.daysSincePlanting,
      seedling.growthRate || 0.5
    );

    res.json(seedlingObj);
  } catch (err) {
    errorHandler(res, err);
  }
};

/**
 * Create a new seedling
 * @route POST /api/seedlings
 */
exports.createSeedling = async (req, res) => {
  try {
    const {
      batchCode,
      plantType,
      plantedDate,
      growthRate,
      germination,
      healthStatus,
      pHLevel,
      temperature,
      notes,
    } = req.body;

    const seedling = new Seedling({
      batchCode,
      plantType,
      plantedDate,
      growthRate,
      germination,
      healthStatus,
      pHLevel,
      temperature,
      notes,
      owner: req.user._id,
    });

    await seedling.save();

    // Send notification to admins about new seedling batch
    await notificationHelper.adminInfo(
      "New Seedling Batch Created",
      `${req.user.name} created a new batch of ${plantType} seedlings (${batchCode})`,
      "/seedlings"
    );

    // Add computed fields
    const seedlingObj = seedling.toObject();
    seedlingObj.daysSincePlanting = calculateDaysSincePlanting(
      seedling.plantedDate
    );
    seedlingObj.expectedTransplantDate = calculateExpectedTransplantDate(
      seedling.plantedDate
    );
    seedlingObj.estimatedHeight = calculateEstimatedHeight(
      seedlingObj.daysSincePlanting,
      seedling.growthRate || 0.5
    );

    res.status(201).json(seedlingObj);
  } catch (err) {
    errorHandler(res, err);
  }
};

/**
 * Update a seedling
 * @route PUT /api/seedlings/:id
 */
exports.updateSeedling = async (req, res) => {
  try {
    const updates = req.body;
    // Prevent updating the owner field
    delete updates.owner;

    // Find the seedling before updating to check health status change
    const oldSeedling = await Seedling.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });

    if (!oldSeedling) {
      return res.status(404).json({ message: "Seedling not found" });
    }

    const seedling = await Seedling.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true }
    );

    // Check for health status change
    if (updates.healthStatus && oldSeedling.healthStatus !== updates.healthStatus) {
      let notificationType = 'info';
      
      // Determine notification type based on health status
      if (updates.healthStatus === 'Poor') {
        notificationType = 'alert';
      } else if (updates.healthStatus === 'Fair') {
        notificationType = 'warning';
      }
      
      // Send notification to admins about health status change
      await notificationHelper.notifyAdmins(
        `Seedling Health Status Changed: ${seedling.plantType}`,
        `${seedling.batchCode} health status changed from ${oldSeedling.healthStatus} to ${updates.healthStatus}`,
        notificationType,
        `/seedlings/${seedling._id}`
      );
    }

    // Check for pH level outside ideal range
    if (updates.pHLevel) {
      if (updates.pHLevel < 5.5 || updates.pHLevel > 7.0) {
        await notificationHelper.adminWarning(
          `pH Level Alert: ${seedling.plantType}`,
          `${seedling.batchCode} pH level is outside ideal range (${updates.pHLevel})`,
          `/seedlings/${seedling._id}`
        );
      }
    }

    // Add computed fields
    const seedlingObj = seedling.toObject();
    seedlingObj.daysSincePlanting = calculateDaysSincePlanting(
      seedling.plantedDate
    );
    seedlingObj.expectedTransplantDate = calculateExpectedTransplantDate(
      seedling.plantedDate
    );
    seedlingObj.estimatedHeight = calculateEstimatedHeight(
      seedlingObj.daysSincePlanting,
      seedling.growthRate || 0.5
    );

    res.json(seedlingObj);
  } catch (err) {
    errorHandler(res, err);
  }
};

/**
 * Delete a seedling
 * @route DELETE /api/seedlings/:id
 */
exports.deleteSeedling = async (req, res) => {
  try {
    const seedling = await Seedling.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!seedling) {
      return res.status(404).json({ message: "Seedling not found" });
    }

    // Send notification about seedling deletion
    await notificationHelper.adminInfo(
      `Seedling Batch Removed: ${seedling.plantType}`,
      `${req.user.name} has removed batch ${seedling.batchCode}`,
      "/seedlings"
    );

    res.json({ message: "Seedling deleted successfully" });
  } catch (err) {
    errorHandler(res, err);
  }
};

/**
 * Get sample seedlings for testing
 * @route GET /api/seedlings/samples
 */
exports.getSampleSeedlings = async (req, res) => {
  try {
    // Check if the user already has seedlings
    const existingSeedlings = await Seedling.find({ owner: req.user._id });

    if (existingSeedlings.length > 0) {
      // User already has seedlings, return them instead of creating samples
      const seedlingsWithComputedFields = existingSeedlings.map((seedling) => {
        const seedlingObj = seedling.toObject();
        seedlingObj.daysSincePlanting = calculateDaysSincePlanting(
          seedling.plantedDate
        );
        seedlingObj.expectedTransplantDate = calculateExpectedTransplantDate(
          seedling.plantedDate
        );
        seedlingObj.estimatedHeight = calculateEstimatedHeight(
          seedlingObj.daysSincePlanting,
          seedling.growthRate || 0.5
        );
        return seedlingObj;
      });

      return res.json(seedlingsWithComputedFields);
    }

    // Create sample seedlings
    const sampleSeedlings = [
      {
        batchCode: "L001",
        plantType: "Lettuce",
        plantedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        germination: 85,
        healthStatus: "Good",
        pHLevel: 6.2,
        temperature: 24.5,
        notes: "First batch of lettuce",
        owner: req.user._id,
      },
      {
        batchCode: "S002",
        plantType: "Spinach",
        plantedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        germination: 75,
        healthStatus: "Excellent",
        pHLevel: 6.0,
        temperature: 23.0,
        notes: "Growing well after nutrient adjustment",
        owner: req.user._id,
      },
      {
        batchCode: "K003",
        plantType: "Kale",
        plantedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        germination: 90,
        healthStatus: "Good",
        pHLevel: 6.5,
        temperature: 25.0,
        notes: "New batch of kale",
        owner: req.user._id,
      },
    ];

    // Insert sample seedlings into the database
    const seedlings = await Seedling.insertMany(sampleSeedlings);

    // Add computed fields to the response
    const seedlingsWithComputedFields = seedlings.map((seedling) => {
      const seedlingObj = seedling.toObject();
      seedlingObj.daysSincePlanting = calculateDaysSincePlanting(
        seedling.plantedDate
      );
      seedlingObj.expectedTransplantDate = calculateExpectedTransplantDate(
        seedling.plantedDate
      );
      seedlingObj.estimatedHeight = calculateEstimatedHeight(
        seedlingObj.daysSincePlanting,
        seedling.growthRate || 0.5
      );
      return seedlingObj;
    });

    // Send notification about sample seedlings creation
    await notificationHelper.adminInfo(
      "Sample Seedlings Generated",
      `${req.user.name} has generated sample seedlings for testing`,
      "/seedlings"
    );

    res.json(seedlingsWithComputedFields);
  } catch (err) {
    errorHandler(res, err);
  }
};

// Helper functions to calculate seedling metrics

function calculateDaysSincePlanting(plantedDate) {
  const now = new Date();
  const planted = new Date(plantedDate);
  const diffTime = Math.abs(now - planted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function calculateExpectedTransplantDate(plantedDate) {
  const planted = new Date(plantedDate);
  // Assuming seedlings are ready for transplant after 21 days
  planted.setDate(planted.getDate() + 21);
  return planted;
}

function calculateEstimatedHeight(days, growthRate = 0.5) {
  // Simple growth model: height = days * growth rate
  return (days * growthRate).toFixed(1);
}
