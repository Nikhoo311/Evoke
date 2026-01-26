const { EmbedBuilder, MessageFlags, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { color } = require("../../../../config/config.json");
const ConfigModel = require("../../../schemas/config");

module.exports = {
    data: {
        name: "btn-restore-yes",
    },
    async execute(interaction, client) {
        const { configs } = client;

        const backBtn = new ButtonBuilder()
            .setCustomId("btn-back-new-pannel")
            .setLabel("Retour au menu principal")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("<:left_arrow:1463680935118503976>")

        try {
            configs.clear();
            const result = await ConfigModel.deleteMany();
            
            const container = new ContainerBuilder()
                .setAccentColor(parseInt(color.green.replace("#", ""), 16))
                .addTextDisplayComponents(new TextDisplayBuilder({content: "## Restauration des paramètres par défaut"}))
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large))
                .addTextDisplayComponents(new TextDisplayBuilder({content: `✅ **Configuration restaurée :** Les paramètres par défaut ont été appliqués.\n\n__**Nombre de configuration(s) supprimée(s)**__: \`${result.deletedCount}\``}))
                .addActionRowComponents(new ActionRowBuilder().addComponents(backBtn))

            return await interaction.update({ components: [container] });
        } catch (error) {
            console.error(error)
            return await interaction.reply({ content: "❌ Erreur lors de la tantative de restauration des paramètres par défaut...", flags: [MessageFlags.Ephemeral] });
        }
    }
}
