const { MessageFlags } = require('discord.js');

module.exports = {
    data: {
        name: "register-modal"
    },
    async execute(interaction, client) {
        const riotPseudo = interaction.fields.getTextInputValue("riot_id_input");
        try {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            await client.manager.registerPlayer(interaction.user.id, riotPseudo);
            
            return await interaction.editReply({ content: `✅ Votre compte \`${riotPseudo}\` a bien été enregistré.` });
            
        } catch (error) {
            console.log(error);
            const message = error.isUserError ? `${error.message}` : '⚠️ Une erreur interne est survenue. Contactez un administrateur.';
            return await interaction.editReply({ content: `❌ ${message}` });
        }
    }
}