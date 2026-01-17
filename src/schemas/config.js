const mongoose = require("mongoose");

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  active: { type: Boolean, required: true, default: false },
  alwaysActive: { type: Boolean }
});

const ConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  hours: { type: String, required: true },
  materials: { type: String, default: "Aucun" },

  channels: {
    type: [ChannelSchema],
    default: [
      { name: "général", active: true, alwaysActive: true },
      { name: "photos", active: true, alwaysActive: true },
      { name: "informations", active: true, alwaysActive: true },
    ]
  }
});

module.exports = mongoose.model("config", ConfigSchema);