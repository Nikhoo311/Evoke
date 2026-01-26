const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ButtonBuilder, SectionBuilder, ActionRowBuilder, ActionRow } = require("discord.js");

module.exports = {
    data: {
        name: "select-modif-status-channel-active",
        multi: "select-modif-status-channel-desactive"
    },
    async execute(interaction, client) {
        const id = interaction.message.components[0].data.content.split("-# ")[1];
        const { configs } = client;
        const currentConfig = configs.get(id);
        const channelNames = interaction.values;

        channelNames.map(name => {
            const channel = currentConfig.channels.find(ch => ch.name === name);
            channel.active = interaction.customId === "select-modif-status-channel-active";
        })

        const text = currentConfig.channels
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(ch => {
                const lockEmoji = ch.alwaysActive ? " 🔒" : "";
                const statusEmoji = ch.active ? "<:switch_enabled:1462293151610830900>" : "<:switch_disabled:1462293239145959496>"
                const channelType = ch.type === "text" ? "<:channel:1462295158388429017>" : "<:channel_voice:1463730529663844543>"
                return `### ${statusEmoji} ${channelType} ${ch.type === "text" ? ch.name.trim().replace(/\s+/g, "-") : ch.name.trim()} ${lockEmoji}`;
            })
            .join("\n");
        const channelsTextDisplay = new TextDisplayBuilder({ content: text });
        const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

        const oldContainer = interaction.message.components[1];

        const firstSection = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder({ content: oldContainer.components[0].components[0].content }))
            .setButtonAccessory(ButtonBuilder.from(oldContainer.components[0].accessory.data));
            const buttonsIndex = oldContainer.components.findIndex(c => c instanceof ActionRow && c.id === 1001);
            // text / buttons 
            const buttons = [oldContainer.components[buttonsIndex-1], oldContainer.components[buttonsIndex]];

        const containerWithChannels = new ContainerBuilder()
            .setAccentColor(oldContainer.data.accent_color)
            .addSectionComponents(firstSection)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(channelsTextDisplay)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(new TextDisplayBuilder({ content: buttons[0].data.content }))
            .addActionRowComponents(ActionRowBuilder.from(buttons[1]));

        if (currentConfig.channels.filter(ch => !ch.alwaysActive).length > 0) {
            containerWithChannels.addSeparatorComponents(separator);
            containerWithChannels.addActionRowComponents([ActionRowBuilder.from(oldContainer.components[7]), ActionRowBuilder.from(oldContainer.components[8])]);
        }

        const components = [...interaction.message.components];
        components[1] = containerWithChannels;
        return await interaction.update({ components });
    }
}