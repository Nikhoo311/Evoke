const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, LabelBuilder, MessageFlags, SeparatorSpacingSize, SeparatorBuilder, ContainerBuilder, TextDisplayBuilder, SectionBuilder, ButtonBuilder } = require("discord.js");
const path = require("path");
const { readFileSync } = require("fs");
const ConfigModel = require("../../../schemas/config");

const dayjs = require("dayjs");
require("dayjs/locale/fr");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.locale("fr");
dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
    data: {
        name: "btn-suppr-config",
        multi: "btn-suppr-this-config"
    },
    async execute (interaction, client) {
        const { configs } = client;
        if(configs.size <= 0) {
            return await interaction.reply({ content: "❌ Je ne dispose d'aucune configuration dans ma base de données...\n* Commence par en créer une avec le bouton `Créer`, puis remplis les informations nécessaires", flags: [MessageFlags.Ephemeral] })
        }

        if(interaction.customId === "btn-suppr-this-config") {
            const id = interaction.message.components[0].data.content.split("-# ")[1];
            let name = configs.get(id).name;
            try {
                // Suppression de la config
                const result = await ConfigModel.deleteMany({ _id: id });
                if (result.deletedCount === 0) {
                    return await interaction.reply({ content: "⚠️ Aucune configuration trouvée à supprimer.", components: [], flags: [MessageFlags.Ephemeral] });
                }
                configs.delete(id);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: "❌ Une erreur est survenue lors de la suppression des configurations !", flags: [MessageFlags.Ephemeral] });
            }

            const oldContainer = interaction.message.components[1];
            const firstSection = new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder({ content: `### 🔧 ${name}` }))
                .setButtonAccessory(ButtonBuilder.from(oldContainer.components[0].accessory.data).setCustomId("btn-back-new-pannel"));
            const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);
            
            const container = new ContainerBuilder()
                .setAccentColor(oldContainer.data.accent_color)
                .addSectionComponents(firstSection)
                .addSeparatorComponents(separator)
                .addTextDisplayComponents(new TextDisplayBuilder({ content: `✅ La configuration \`${name}\` a été suppimée avec succès !`}))

            return await interaction.update({ components: [container] });
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