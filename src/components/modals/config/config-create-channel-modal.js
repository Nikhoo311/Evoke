const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, ActionRowBuilder, SeparatorSpacingSize, SectionBuilder, ButtonBuilder } = require("discord.js");
const { createChannelSelectMenu } = require("../../../functions/utils/createChannelSelectMenu");

module.exports = {
    data: { 
        name: "config-create-channel-modal",
        multi: "config-delete-channel-modal"
    },

    async execute(interaction, client) {
        const id = interaction.message.components[0].data.content.split("-# ")[1];
        const { configs } = client;
        const currentConfig = configs.get(id);

        if (interaction.customId === "config-create-channel-modal") {
            const newChannelName = interaction.fields.getTextInputValue("new_channel_name");
            const newChannelTypeSelected = interaction.fields.getStringSelectValues("select_channel_type")[0];

            currentConfig.channels.push({
                name: newChannelName,
                type: newChannelTypeSelected,
                active: false,
            })
        } else {
            const channelsNames = interaction.fields.getStringSelectValues("select_channels_delete");
            currentConfig.channels = currentConfig.channels.filter(ch => !channelsNames.includes(ch.name));   
        }

        const oldContainer = interaction.message.components[1];
        const text = currentConfig.channels
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(ch => {
                const lockEmoji = ch.alwaysActive ? " 🔒" : "";
                const statusEmoji = ch.active ? "<:switch_enabled:1462293151610830900>" : "<:switch_disabled:1462293239145959496>"
                const channelType = ch.type === "text" ? "<:channel:1462295158388429017>" : "<:channel_voice:1463730529663844543>"
                return `### ${statusEmoji} ${channelType} ${ch.type === "text" ? ch.name.trim().replace(/\s+/g, "-") : ch.name.trim()} ${lockEmoji}`;
            })
            .join("\n")
        const channelsTextDisplay = new TextDisplayBuilder({ content: text });

        const firstSection = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder({ content: oldContainer.components[0].components[0].content }))
            .setButtonAccessory(ButtonBuilder.from(oldContainer.components[0].accessory.data)); 
        
        const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);
        const container = new ContainerBuilder()
            .setAccentColor(oldContainer.data.accent_color)
            .addSectionComponents(firstSection)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(channelsTextDisplay)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(new TextDisplayBuilder({ content: oldContainer.components[4].content }))
            .addActionRowComponents(ActionRowBuilder.from(oldContainer.components[5]))
        
        if (currentConfig.channels.filter(ch => !ch.alwaysActive).length > 0) {
            const modifiableChannels = currentConfig.channels.filter(ch => !ch.alwaysActive);

            const selectStatusChannelEnable = createChannelSelectMenu({
                customId: "select-modif-status-channel-active",
                placeholder: "✅ Activer des salons",
                channels: modifiableChannels
            }).setMaxValues(modifiableChannels.length);

            const selectStatusChannelDisable = createChannelSelectMenu({
                customId: "select-modif-status-channel-desactive",
                placeholder: "❌ Désactiver des salons",
                channels: modifiableChannels
            }).setMaxValues(modifiableChannels.length);
            
            container.addSeparatorComponents(separator);
            container.addActionRowComponents([new ActionRowBuilder().addComponents(selectStatusChannelEnable), new ActionRowBuilder().addComponents(selectStatusChannelDisable)]);
        }

        const components = [...interaction.message.components];
        components[1] = container;
        return await interaction.update({ components });
        
    }
}