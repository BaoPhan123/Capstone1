const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true }, 
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  address: { type: String },
  sex: { type: String, enum: ["Nam", "Nữ"], default: "Nam" },
  roles: { type: [String], default: ["customer"] },  // ["customer"], ["admin"]
  status: { type: String, enum: ["active", "blocked"], default: "active" },

  // Fields for OTP and email verification
  otp: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);


