const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, LabelBuilder, MessageFlags } = require("discord.js");
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
        name: "btn-suppr-config"
    },
    async execute (interaction, client) {
        const { configs } = client;
        if(configs.size <= 0) {
            return await interaction.reply({ content: "❌ Je ne dispose d'aucune configuration dans ma base de données...\n* Commence par en créer une avec le bouton `Créer`, puis remplis les informations nécessaires", flags: [MessageFlags.Ephemeral] })
        }

        const gameFile = JSON.parse(readFileSync(path.join(__dirname, "../../../../config/games.json"), "utf-8"));
        
        const configsClient = configs.map(config => {
            const gameFromFile = gameFile.find(g => g.name === config.game);
            return {
                id: config._id.toString(),
                name: config.name,
                game: config.game,
                emoji: gameFromFile.emoji ?? "🎮"
            }
        });

        const modal = new ModalBuilder()
            .setCustomId("suppr-config-modal")
            .setTitle("Suppression de configuration(s)");
        
        const select = new StringSelectMenuBuilder()
            .setCustomId("select_configs_ids")
            .setMinValues(1)
            .setMaxValues(configs.size)
            .setPlaceholder("Supprimer des configurations...")
            .setRequired(true)
            .setOptions(configsClient.map(config => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(config.name)
                    .setValue(config.id)
                    .setEmoji(config.emoji)
                    .setDescription(`Jeu: ${config.game} - le ${dayjs(config.createdAt).format("D MMMM YYYY à HH:mm")}`)
            }))

        const selectLabel = new LabelBuilder()
            .setStringSelectMenuComponent(select)
            .setLabel("Quelle(s) configuration(s) ?");

        modal.addLabelComponents(selectLabel);
        
        return await interaction.showModal(modal);
    }
}