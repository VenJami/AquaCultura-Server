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

// Hash password before saving
User.schema.pre("save", async function (next) {
  console.log("--- USER PRE-SAVE HOOK TRIGGERED ---"); // Log hook start
  if (!this.isModified("password")) {
    console.log("Password not modified, skipping hash."); // Log skip
    return next();
  }
  try {
    console.log(`Hashing password for user: ${this.email}`); // Log hashing attempt
    const plainPassword = this.password; // Log plain password before hashing
    console.log(`Plain password length: ${plainPassword ? plainPassword.length : 'undefined'}`);
    
    this.password = await bcrypt.hash(plainPassword, 12);
    console.log(`Password hashed successfully for: ${this.email}`); // Log success
    next();
  } catch (error) {
    console.error(`--- ERROR HASHING PASSWORD for ${this.email}: ---`, error); // Log any error during hashing
    next(error); // Pass error to Mongoose
  }
});

// Add compare password method
User.schema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
