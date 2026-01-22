const { MessageFlags } = require("discord.js");

module.exports = {
    data: {
        name: "btn-back-settings-panel"
    },

    async execute(interaction, client) {
        if(!client.previousPannel) {
            return await interaction.reply({ content: "❌ Impossible de revenir en arrière. Supprimez le message et utilisez **/settings**.", flags: [MessageFlags.Ephemeral] });
        }
        
        return interaction.update({ components: [client.previousPannel] });
    }
}