const ConfigModel = require("../../../schemas/config");
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, SeparatorSpacingSize, SectionBuilder, ButtonBuilder, ComponentType, ActionRow, ButtonComponent } = require("discord.js");
const path = require("path");
const { readFileSync } = require("fs");

module.exports = {
  data: { name: "creation-config-modal" },

  async execute(interaction, client) {
    const gameFile = JSON.parse(readFileSync(path.join(__dirname, "../../../../config/games.json"), "utf-8"));
    const { configs } = client;

    const configName = interaction.fields.getTextInputValue("config_name");
    const gameSelected = interaction.fields.getStringSelectValues("select_game_name")[0];

    const oldContainer = interaction.message.components[0];
    const firstSection = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder({ content: oldContainer.components[0].components[0].content }))
        .setButtonAccessory(ButtonBuilder.from(oldContainer.components[0].accessory.data));
    const buttonsIndex = oldContainer.components.findIndex(c => c instanceof ActionRow && c.components.some(comp => comp instanceof ButtonComponent));
    const buttons = [oldContainer.components[buttonsIndex-1], oldContainer.components[buttonsIndex]];
    
    const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);
    const container = new ContainerBuilder()
        .setAccentColor(oldContainer.data.accent_color)
        .addSectionComponents(firstSection)
        .addSeparatorComponents(separator)

    const newConfig = await ConfigModel.create({
      name: configName,
      game: gameSelected
    });

    configs.set(newConfig._id.toString(), newConfig);

    const uniqueGames = [...new Set(configs.map(c => c.game))];
    const gamesInConfigs = uniqueGames.map(gameName => {
        const gameFromFile = gameFile.find(g => g.name === gameName);
        return {
            name: gameName,
            emoji: gameFromFile?.emoji ?? "🎮"
        };
    })

    const selectSettingsGame = new StringSelectMenuBuilder()
      .setCustomId("select-settings-game")
      .setPlaceholder("Choisir un jeu...")
      .setMinValues(1)
      .setMaxValues(1)
      .setRequired(true)
      .setOptions(gamesInConfigs.map(game => {
        return new StringSelectMenuOptionBuilder()
            .setLabel(game.name)
            .setValue(game.name)
            .setEmoji(game.emoji)
            .setDescription(`Voir les configurations pour ${game.name}`)
      }))

    const selectRow = new ActionRowBuilder().addComponents(selectSettingsGame);

    container.addActionRowComponents(selectRow).addSeparatorComponents(separator);
    container.addTextDisplayComponents(new TextDisplayBuilder({content: buttons[0].data.content}))
    container.addActionRowComponents(ActionRowBuilder.from(buttons[1]))
    container.addSeparatorComponents(separator).addTextDisplayComponents(new TextDisplayBuilder({ content: `✅ La configuration \`${configName}\` est créée avec succès !\n* Pour modifier les salons créer lors de la création d'une saison, cliquez sur la sélection pour consulter l'ensemble de configurations sur un jeu spécifique.\n* Les salons ${newConfig.channels.map(ch => `**${ch.name}**`).join(", ")} ont été créés par défaut.` }));
    
    return interaction.update({ components: [container] });
  }
};