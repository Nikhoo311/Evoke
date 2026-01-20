const mongoose = require("mongoose");

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  active: { type: Boolean, required: true, default: false },
  alwaysActive: { type: Boolean }
});

const ConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  game: { type: String, required: true },

  channels: {
    type: [ChannelSchema],
    default: [
      { name: "général", active: true, alwaysActive: true },
      { name: "informations", active: true, alwaysActive: true },
      { name: "aide et questions", active: true, alwaysActive: true },
    ]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("config", ConfigSchema);