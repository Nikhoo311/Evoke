const { TextInputStyle, ModalBuilder, TextInputBuilder, LabelBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { readFileSync } = require("fs");
const path = require("path");

module.exports = {
    data: {
        name: "btn-creation-config"
    },
    async execute (interaction, client) {
        const games = JSON.parse(readFileSync(path.resolve(__dirname, "../../../../config/games.json"), "utf-8"));

        const modal = new ModalBuilder()
            .setCustomId("creation-config-modal")
            .setTitle("Création d'une nouvelle configuration");

        const textInput = new TextInputBuilder()
            .setCustomId("config_name")
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const label = new LabelBuilder()
            .setLabel('Le nom de la configuration')
            .setTextInputComponent(textInput);
        
        const select = new StringSelectMenuBuilder()
            .setCustomId("select_game_name")
            .setMinValues(1)
            .setMaxValues(1)
            .setPlaceholder("Choisir un jeu...")
            .setRequired(true)
            .setOptions(games.map(game => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(game.name)
                    .setValue(game.name)
                    .setEmoji(game.emoji ?? "🎮")
            }))

        const selectLabel = new LabelBuilder()
            .setStringSelectMenuComponent(select)
            .setLabel("Le jeu de la configuration :");

        modal.addLabelComponents(label, selectLabel);
        
        return await interaction.showModal(modal);
    }
}