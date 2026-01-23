const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SectionBuilder, SeparatorSpacingSize, SeparatorBuilder, ButtonBuilder } = require("discord.js");
const { color } = require("../../../../config/config.json");

module.exports = {
    data: {
        name: "btn-save-update-config"
    },
    async execute (interaction, client) {
        const { configs } = client;
        const id = interaction.message.components[0].data.content.split("-# ")[1];
        const currentConfig = configs.get(id);

        try {
            await currentConfig.save();
            
            const oldContainer = interaction.message.components[1];
            const firstSection = new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder({ content: `### 🔧 ${currentConfig.name}` }))
                .setButtonAccessory(ButtonBuilder.from(oldContainer.components[0].accessory.data).setCustomId("btn-back-new-pannel"));
            const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);
            
            const container = new ContainerBuilder()
                .setAccentColor(oldContainer.data.accent_color)
                .addSectionComponents(firstSection)
                .addSeparatorComponents(separator)
                .addTextDisplayComponents(new TextDisplayBuilder({ content: `✅ La configuration \`${currentConfig.name}\` a été sauvegarder avec succès !`}))

            return await interaction.update({ components: [container] });
            
        } catch (error) {
            console.error(error);
            return await interaction.reply({ content: "❌ Erreur lors de l'enregistrement de la configuration", flags: [MessageFlags.Ephemeral] });
        }
    }
}