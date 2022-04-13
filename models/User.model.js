const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    username: {type: String, unique: true, required: true, maxLength: 16},
    password: {type: String, required: true, minLength: 8},
    email: {type: String, unique: true, required: true, minLength: 8},
  },
  {
    timestamps: true,
  }
);

const User = model("User", userSchema);
module.exports = User;
