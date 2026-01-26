const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { color } = require("../../../../config/config.json");

module.exports = {
    data: {
        name: "btn-restore-no",
    },
    async execute(interaction, client) {
        const backBtn = new ButtonBuilder()
            .setCustomId("btn-back-new-pannel")
            .setLabel("Retour au menu principal")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("<:left_arrow:1463680935118503976>")

        const container = new ContainerBuilder()
            .setAccentColor(parseInt(color.blue.replace("#", ""), 16))
            .addTextDisplayComponents(new TextDisplayBuilder({content: "## Restauration des paramètres par défaut"}))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
            .addTextDisplayComponents(new TextDisplayBuilder({content: `✅ **Opération annulée :** La restoration des paramètres par défaut de la configuation a été annulée.`}))
            .addActionRowComponents(new ActionRowBuilder().addComponents(backBtn))

       return await interaction.update({ components: [container] });
    }
}