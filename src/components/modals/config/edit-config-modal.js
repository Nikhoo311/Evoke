const { SectionBuilder, ButtonBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder, ActionRowBuilder, ActionRow } = require("discord.js");

module.exports = {
    data: { name: "edit-config-modal" },

    async execute(interaction, client) {
        const { configs } = client;
        
        const id = interaction.message.components[0].data.content.split("-# ")[1];
        
        const configName = interaction.fields.getTextInputValue("config_name");
        const gameSelected = interaction.fields.getStringSelectValues("select_game_name")[0];
        const currentConfig = configs.get(id);
        
        currentConfig.name = configName;
        currentConfig.game = gameSelected;
        
        const oldContainer1 = interaction.message.components[1];
        const oldContainer2 = interaction.message.components[2];
        
        const firstSection = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder({ content: `### 🔧 ${currentConfig.name}\nVous trouvez ici la liste des salons de cette configuration.\n\n*Attention les salons avec le 🔒 sont des salons __**obligatoires**__, non modifiable, pour mon bon fonctionnement.*` }))
            .setButtonAccessory(ButtonBuilder.from(oldContainer1.components[0].accessory.data).setCustomId("btn-back-new-pannel"));

        const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);
        
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

        const buttonsIndex = oldContainer1.components.findIndex(c => c instanceof ActionRow && c.id === 1001);
        // text / buttons 
        const buttons = [oldContainer1.components[buttonsIndex-1], oldContainer1.components[buttonsIndex]];

        const containerWithChannels = new ContainerBuilder()
            .setAccentColor(oldContainer1.data.accent_color)
            .addSectionComponents(firstSection)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(channelsTextDisplay)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(new TextDisplayBuilder({ content: buttons[0].data.content }))
            .addActionRowComponents(ActionRowBuilder.from(buttons[1]));
        
        if (currentConfig.channels.some(({ active, alwaysActive }) => active && !alwaysActive)) {
            containerWithChannels.addSeparatorComponents(separator);
            containerWithChannels.addActionRowComponents([ActionRowBuilder.from(oldContainer1.components[7]), ActionRowBuilder.from(oldContainer1.components[8])]);
        }
        const containerDelete = new ContainerBuilder()
            .setAccentColor(oldContainer2.data.accent_color)
            .addTextDisplayComponents(new TextDisplayBuilder({content: `Vous pouvez ici, **supprimer** la configuration \`${currentConfig.name}\` du jeu **${currentConfig.game}**.\n\n⚠️ __Attention :__ Cette action est irréversible une fois la procédure de suppression confirmée.`}))
            .addActionRowComponents(ActionRowBuilder.from(oldContainer2.components[1]))
        const components = [interaction.message.components[0], containerWithChannels, containerDelete];
        
        return await interaction.update({ components });
    }
}