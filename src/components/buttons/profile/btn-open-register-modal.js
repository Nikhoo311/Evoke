const { TextInputStyle, ModalBuilder, TextInputBuilder, LabelBuilder } = require("discord.js");

module.exports = {
    data: {
        name: "btn-open-register-modal"
    },
    async execute (interaction, client) {
        const modal = new ModalBuilder()
            .setCustomId('register-modal')
            .setTitle('📜 Inscription à la Ligue');

        // Champ pour le Riot ID
        const riotIdInput = new TextInputBuilder()
            .setCustomId('riot_id_input')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Faker#KR1 ou Bjergsen#NA1')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(50);

        const label = new LabelBuilder()
            .setLabel('Votre Riot ID complet')
            .setTextInputComponent(riotIdInput)
        modal.addLabelComponents(label);

        return await interaction.showModal(modal);
    }
}