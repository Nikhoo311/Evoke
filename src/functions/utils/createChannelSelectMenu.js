const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");

function createChannelSelectMenu({ customId, placeholder, channels }) {
    return new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setMinValues(1)
      .setMaxValues(channels.length)
      .setPlaceholder(placeholder)
      .setOptions(
        channels.map(ch => {
            const channelType = ch.type === "text" ? "<:channel:1462295158388429017>" : "<:channel_voice:1463730529663844543>"
            return new StringSelectMenuOptionBuilder()
              .setLabel(ch.name)
              .setValue(ch.name)
              .setEmoji(channelType)
        })
      );
}

module.exports = { createChannelSelectMenu }