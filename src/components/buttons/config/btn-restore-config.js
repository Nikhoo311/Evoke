const { MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
const { color, owners } = require("../../../../config/config.json");

module.exports = {
    data: {
        name: "btn-restore-config",
    },
    async execute(interaction, client) {
        if (!owners.includes(interaction.user.id)) return await interaction.reply({ content: "❌ Vous n'avez pas la permission de réinitialiser la configuration du scraping par défaut...\n\n**Veuillez contacter le(s) propriétaire(s).**", flags: [MessageFlags.Ephemeral]});

        const yesBtn = new ButtonBuilder()
            .setCustomId("btn-restore-yes")
            .setStyle(ButtonStyle.Success)
            .setEmoji({ name: "✅" })
            .setLabel("Oui")
        
        const noBtn = new ButtonBuilder()
            .setCustomId("btn-restore-no")
            .setStyle(ButtonStyle.Danger)
            .setEmoji({ name: "✖️" })
            .setLabel("Non")
    
        const container = new ContainerBuilder()
            .setAccentColor(parseInt(color.red.replace("#", ""), 16))
            .addTextDisplayComponents(new TextDisplayBuilder({content: "## Restauration des paramètres par défaut"}))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
            .addTextDisplayComponents(new TextDisplayBuilder({content: "### **Voulez-vous vraiment réinitialiser toutes les configurations actuelles ?**\n```ps\n[Attention] : Cette action est définitive.\n\nToutes les modifications apportées aux configurations existantes seront supprimées.\n```\n-# **Confirmez votre choix** pour lancer la restauration."}))
            .addActionRowComponents(new ActionRowBuilder().addComponents(yesBtn, noBtn))
       

        return await interaction.update({ components: [container] });
    }
}
