const { ModalBuilder, TextInputBuilder, LabelBuilder, StringSelectMenuBuilder, TextInputStyle, StringSelectMenuOptionBuilder } = require("discord.js");
const path = require("path");
const { readFileSync } = require("fs");

module.exports = {
    data: {
        name: "btn-edit-config"
    },
    async execute (interaction, client) {
        const { configs } = client;
        const config = configs.get(interaction.message.components[0].data.content.split("-# ")[1]);
        const games = JSON.parse(readFileSync(path.resolve(__dirname, "../../../../config/games.json"), "utf-8"));

        const modal = new ModalBuilder()
            .setCustomId("edit-config-modal")
            .setTitle("Modification de la configuration :");

        const textInput = new TextInputBuilder()
            .setCustomId("config_name")
            .setValue(config.name)
            .setPlaceholder(config.name)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(40)
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
                    .setDefault(game.name === config.game);
            }))

        const selectLabel = new LabelBuilder()
            .setStringSelectMenuComponent(select)
            .setLabel("Le jeu de la configuration :");

        modal.addLabelComponents(label, selectLabel);
        
        return await interaction.showModal(modal);
    }
}