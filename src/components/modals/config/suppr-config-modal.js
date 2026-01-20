const ConfigModel = require("../../../schemas/config");
const { TextDisplayBuilder, ContainerBuilder, SeparatorBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, SeparatorSpacingSize, SectionBuilder, ButtonBuilder, ComponentType, ActionRow, ButtonComponent, MessageFlags } = require("discord.js");
const path = require("path");
const { readFileSync } = require("fs");

module.exports = {
  data: { name: "suppr-config-modal" },

  async execute(interaction, client) {
    const gameFile = JSON.parse(readFileSync(path.join(__dirname, "../../../../config/games.json"), "utf-8"));
    const { configs } = client;

    const configIds = interaction.fields.getStringSelectValues("select_configs_ids");

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

    let names = [];
    try {
        // Suppression de toutes les configs dont le name est dans selectedNames
        const result = await ConfigModel.deleteMany({ _id: { $in: configIds } });
        if (result.deletedCount === 0) {
            return interaction.update({
                content: "⚠️ Aucune configuration trouvée à supprimer.",
                embeds: [],
                components: [],
                flags: [MessageFlags.Ephemeral]
            });
        }

        configIds.forEach(id => {
            const conf = configs.get(id);
            names.push(conf.name);
            configs.delete(id);
        });
    } catch (error) {
        console.error(error);
        interaction.reply({ content: "❌ Une erreur est survenue lors de la suppression des configurations !", flags: [MessageFlags.Ephemeral] });
    }

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

    if (configs.size > 0) {
        const selectRow = new ActionRowBuilder().addComponents(selectSettingsGame);
        container.addActionRowComponents(selectRow).addSeparatorComponents(separator);
    }

    container.addTextDisplayComponents(new TextDisplayBuilder({content: buttons[0].data.content}))
    container.addActionRowComponents(ActionRowBuilder.from(buttons[1]))
    container.addSeparatorComponents(separator).addTextDisplayComponents(new TextDisplayBuilder({ content: `✅ ${configIds > 1 ? "Les" : "La"} configuration${configIds > 1 ? "s" : ""} ${names.map(n => `\`${n}\``).join(', ')} ${configIds > 1 ? "ont" : "a"} été suppimée${configIds > 1 ? "s" : ""} avec succès !` }));
    
    return interaction.update({ components: [container] });
  }
};