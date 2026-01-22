const { SectionBuilder, TextDisplayBuilder, ButtonBuilder, ContainerBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
const path = require("path");
const { readFileSync } = require("fs");

const dayjs = require("dayjs");
require("dayjs/locale/fr");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.locale("fr");
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
    data: {
        name: "select-settings-game"
    },
    async execute(interaction, client) {
        const gameFile = JSON.parse(readFileSync(path.join(__dirname, "../../../../config/games.json"), "utf-8"))
        const gameName = interaction.values[0];
        const allFindedConfigs = [...client.configs.values()].filter(c => c.game === gameName);
        const { configs } = client;

        const oldContainer = interaction.message.components[0];

        const backBtn = new ButtonBuilder()
            .setCustomId("btn-back-settings-panel")
            .setLabel("Retour")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("<:left_arrow:1463680935118503976>")

        const firstSection = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder({ content: oldContainer.components[0].components[0].content }))
            .setButtonAccessory(backBtn);

        const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);
        const container = new ContainerBuilder()
            .setAccentColor(oldContainer.data.accent_color)
            .addSectionComponents(firstSection)
            .addSeparatorComponents(separator)

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

        const s = allFindedConfigs.length > 1 ? "s" : "";
        const text = `### Configuation${s} disponible${s}\n${allFindedConfigs.map(c => `* ${c.name}`).join('\n')}`
        container.addTextDisplayComponents(new TextDisplayBuilder({content: text }));
        container.addSeparatorComponents(separator);

        const selectConfig = new StringSelectMenuBuilder()
            .setCustomId("select-info-config")
            .setPlaceholder("Choisir une configuration...")
            .setMinValues(1)
            .setMaxValues(1)
            .setOptions(allFindedConfigs.map(config => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(config.name)
                    .setValue(config._id.toString())
                    .setDescription(`Créer le ${dayjs(config.createdAt).format("D MMMM YYYY à HH:mm")}`)
            }))
        const selectRow2 = new ActionRowBuilder().addComponents(selectConfig);
        container.addActionRowComponents(selectRow2);

        return await interaction.update({ components: [container] });
    }
}