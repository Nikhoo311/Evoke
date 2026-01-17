const { MessageFlags } = require('discord.js');

module.exports = {
    data: {
        name: "register_modal"
    },
    async execute(interaction, client) {
        const riotPseudo = interaction.fields.getTextInputValue("riot_id_input");
        const data = await client.manager.registerPlayer(interaction.user.id, riotPseudo)
        console.log(data);
        
    }
}