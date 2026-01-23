const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ButtonBuilder, SectionBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { color } = require("../../../../config/config.json");
const { createChannelSelectMenu } = require("../../../functions/utils/createChannelSelectMenu");

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
                return `### ${statusEmoji} ${channelType} ${ch.type === "text" ? ch.name.trim().replace(/\s+/g, "-") : ch.name.trim()} ${lockEmoji}`;
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
            .setCustomId("btn-suppr-this-config")
            .setLabel("Supprimer la configuration")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("<:trash:1462294387881935031>")
        
        const editConfigBtn = new ButtonBuilder()
            .setCustomId("btn-edit-config")
            .setLabel("Modifier")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("📝")

        const container = new ContainerBuilder()
            .setAccentColor(oldContainer.data.accent_color)
            .addSectionComponents(firstSection)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(channelsTextDisplay)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(new TextDisplayBuilder({ content: `**Modifier** ici le nom et le jeu de la configuration, et administrez les salons associés (**création** et **suppression**).` }).setId(1000))
            .addActionRowComponents(new ActionRowBuilder().setId(1001).addComponents(editConfigBtn, createChannel, supprChannelBtn))
        
        if (currentConfig.channels.some(({ active, alwaysActive }) => active && !alwaysActive)) {
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
        
        const supprConfigContainer = new ContainerBuilder()
            .setAccentColor(parseInt(color.red.replace("#", ""), 16))
            .addTextDisplayComponents(new TextDisplayBuilder({content: `Vous pouvez ici, **supprimer** la configuration \`${currentConfig.name}\` du jeu **${currentConfig.game}**.\n\n⚠️ __Attention :__ Cette action est irréversible une fois la procédure de suppression confirmée.`}))
            .addActionRowComponents(new ActionRowBuilder().addComponents(supprConfigBtn))
        
        return await interaction.update({ components: [new TextDisplayBuilder({content: `-# ${currentConfig._id.toString()}`}), container, supprConfigContainer] });
    }
}