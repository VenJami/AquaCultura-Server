const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const seedlingSchema = new Schema(
  {
    batchCode: {
      type: String,
      required: [true, "Batch code is required"],
      trim: true,
    },
    plantType: {
      type: String,
      required: [true, "Plant type is required"],
      trim: true,
    },
    plantedDate: {
      type: Date,
      required: [true, "Planting date is required"],
      default: Date.now,
    },
    growthRate: {
      type: Number,
      default: 0.5, // cm per day
      min: [0, "Growth rate cannot be negative"],
    },
    germination: {
      type: Number,
      default: 0,
      min: [0, "Germination cannot be negative"],
      max: [100, "Germination cannot exceed 100%"],
    },
    healthStatus: {
      type: String,
      enum: ["Poor", "Fair", "Good", "Excellent", "Healthy"],
      default: "Good",
    },
    pHLevel: {
      type: Number,
      default: 6.0,
      min: [0, "pH level cannot be negative"],
      max: [14, "pH level cannot exceed 14"],
    },
    temperature: {
      type: Number,
      default: 25.0, // Celsius
    },
    notes: {
      type: String,
      default: "",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Include virtuals when converting to JSON
    toObject: { virtuals: true }, // Include virtuals when converting to object
  }
);

// Virtual for batch name
seedlingSchema.virtual("batchName").get(function () {
  return `${this.batchCode} - ${this.plantType}`;
});

// Virtual for days since planting
seedlingSchema.virtual("daysSincePlanting").get(function () {
  if (!this.plantedDate) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.plantedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for estimated height
seedlingSchema.virtual("estimatedHeight").get(function () {
  const growthRate = this.growthRate || 0.5; // Default growth rate if not provided
  return parseFloat((this.daysSincePlanting * growthRate).toFixed(1));
});

// Virtual for expected transplant date (typically 28 days after planting)
seedlingSchema.virtual("expectedTransplantDate").get(function () {
  if (!this.plantedDate) return new Date();
  const transplantDate = new Date(this.plantedDate);
  transplantDate.setDate(transplantDate.getDate() + 28);
  return transplantDate;
});

const Seedling = mongoose.model("Seedling", seedlingSchema);

module.exports = Seedling;
