const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

// Check if the model is already defined
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema({
      name: {
        type: String,
        required: [true, "Please provide your name"],
        trim: true,
      },
      email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email"],
      },
      password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: 8,
        select: false,
      },
      role: {
        type: String,
        enum: ["user", "admin", "superadmin"],
        default: "user",
      },
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        default: null
      },
      teamName: {
        type: String,
        default: ""
      },
      schedule: {
        type: String,
        default: "8:00 AM - 4:00 PM",
      },
      tasks: [
        {
          title: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            default: "",
          },
          startDate: {
            type: Date,
            default: Date.now,
          },
          dueDate: {
            type: Date,
            required: true,
          },
          status: {
            type: Boolean,
            default: false, // false = not done, true = done
          },
        },
      ],
      createdAt: {
        type: Date,
        default: Date.now,
      },
      phone: {
        type: String,
        default: "",
      },
    })
  );

// Only add pre-save hooks if we're defining the model for the first time
if (!mongoose.models.User) {
  // Hash password before saving
  User.schema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

  // Add compare password method
  User.schema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };
}

module.exports = User;
