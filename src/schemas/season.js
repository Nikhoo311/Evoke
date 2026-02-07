const mongoose = require("mongoose");

const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  channelId: { type: String, required: true }
});

const SeasonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  game: { type: String, required: true },

  configId: { type: mongoose.Types.ObjectId, ref: "config", required: true },
  channels: { type: [ChannelSchema] },
}, {
  timestamps: true
});

module.exports = mongoose.model("season", SeasonSchema);