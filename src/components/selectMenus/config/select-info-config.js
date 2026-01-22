const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ButtonBuilder, SectionBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { color } = require("../../../../config/config.json");

module.exports = {
    data: {
        name: "select-info-config"
    },
    async execute(interaction, client) {
        const { configs } = client;
        const currentConfig = configs.get(interaction.values[0]);

        const text = currentConfig.channels
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(ch => {
                const lockEmoji = ch.alwaysActive ? " 🔒" : "";
                const statusEmoji = ch.active ? "<:switch_enabled:1462293151610830900>" : "<:switch_disabled:1462293239145959496>"
                const channelType = ch.type === "text" ? "<:channel:1462295158388429017>" : "<:channel_voice:1463730529663844543>"
                return `### ${statusEmoji} ${channelType} ${ch.name} ${lockEmoji}`;
            })
            .join("\n")
        const oldContainer = interaction.message.components[0];

        client.previousPannel.push(oldContainer);

        const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

        const firstSection = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder({ content: `### 🔧 ${currentConfig.name}\nVous trouvez ici la liste des salons de cette configuration.\n\n*Attention les salons avec le 🔒 sont des salons __**obligatoires**__, non modifiable, pour mon bon fonctionnement.*` }))
            .setButtonAccessory(ButtonBuilder.from(oldContainer.components[0].accessory.data));
            
        const channelsTextDisplay = new TextDisplayBuilder({ content: text });

        const createChannel = new ButtonBuilder()
            .setCustomId("btn-create-config-channel")
            .setLabel("Créer un salon")
            .setEmoji("<:channel:1462295158388429017>")
            .setStyle(ButtonStyle.Secondary);
        
        const supprChannelBtn = new ButtonBuilder()
            .setCustomId("btn-suppr-channel")
            .setLabel("Supprimer un salon")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("<:trash:1462294387881935031>")
        
        const supprConfigBtn = new ButtonBuilder()
            .setCustomId("btn-suppr-config")
            .setLabel("Supprimer la configuration")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("<:trash:1462294387881935031>")

        const container = new ContainerBuilder()
            .setAccentColor(oldContainer.data.accent_color)
            .addSectionComponents(firstSection)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(channelsTextDisplay)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(new TextDisplayBuilder({ content: `Cet espace est dédié à la **création** et **suppression** des différents salons de la configuration.` }))
            .addActionRowComponents(new ActionRowBuilder().addComponents(createChannel, supprChannelBtn))
        
        const supprConfigContainer = new ContainerBuilder()
            .setAccentColor(parseInt(color.red.replace("#", ""), 16))
            .addTextDisplayComponents(new TextDisplayBuilder({content: `Vous pouvez ici, **supprimer** la configuration \`${currentConfig.name}\` du jeu **${currentConfig.game}**.\n\n⚠️ __Attention :__ Cette action est irréversible une fois la procédure de suppression confirmée.`}))
            .addActionRowComponents(new ActionRowBuilder().addComponents(supprConfigBtn))
        
        return await interaction.update({ components: [container, supprConfigContainer] });
    }
}