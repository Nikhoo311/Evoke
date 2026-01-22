const { MessageFlags, SectionBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ContainerBuilder, ActionRowBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
const { color } = require("../../../../config/config.json");
const path = require("path");
const { readFileSync } = require("fs");

module.exports = {
    data: {
        name: "btn-back-settings-panel",
        multi: "btn-back-new-pannel"
    },

    async execute(interaction, client) {
        if(client.previousPannel.length == 0) {
            return await interaction.reply({ content: "❌ Impossible de revenir en arrière. Supprimez le message et utilisez **/settings**.", flags: [MessageFlags.Ephemeral] });
        }

        if (interaction.customId === "btn-back-new-pannel") {
            const gameFile = JSON.parse(readFileSync(path.join(__dirname, "../../../../config/games.json"), "utf-8"));
            const { configs } = client;
            const uniqueGames = [...new Set(configs.map(c => c.game))];
    
            const gamesInConfigs = uniqueGames.map(gameName => {
                const gameFromFile = gameFile.find(g => g.name === gameName);
    
                return {
                    name: gameName,
                    emoji: gameFromFile?.emoji ?? "🎮"
                };
            });
            
    
            const restoreBtn = new ButtonBuilder()
                .setCustomId("btn-restore-config")
                .setEmoji({name: "⚙️"})
                .setLabel("Restaurer")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!interaction.guild.ownerId.includes(interaction.user.id))
    
            const section = new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder({content: `### Paramètres de ${client.user.username}\nUtilisez le menu ci-dessous pour naviguer entre les différentes paramètres sur les différents jeux disponibles.`}))
                .setButtonAccessory(restoreBtn)
            
            const selectSettingsGame = new StringSelectMenuBuilder()
                .setCustomId("select-settings-game")
                .setMinValues(1)
                .setMaxValues(1)
                .setPlaceholder("Choisir un jeu...")
                .setOptions(gamesInConfigs.map(game => {
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(game.name)
                        .setValue(game.name)
                        .setEmoji(game.emoji)
                        .setDescription(`Voir les configurations pour ${game.name}`)
                }))
            
            const separator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
    
            const creationConfigBtn = new ButtonBuilder()
                .setCustomId("btn-creation-config")
                .setLabel("Créer")
                .setStyle(ButtonStyle.Success)
                .setEmoji("➕")
    
            const supprConfigBtn = new ButtonBuilder()
                .setCustomId("btn-suppr-config")
                .setLabel("Supprimer")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("<:trash:1462294387881935031>")
            
            const container = new ContainerBuilder()
                .setAccentColor(parseInt(color.orange.replace("#", ""), 16))
                .addSectionComponents(section)
                .addSeparatorComponents(separator)
            
            if (configs.size > 0) {
                container.addActionRowComponents(new ActionRowBuilder().addComponents(selectSettingsGame)).addSeparatorComponents(separator);
            }
    
            container.addTextDisplayComponents(new TextDisplayBuilder({content: `Cet espace est dédié à la **création** et **suppression** des différentes configurations.`}));
            container.addActionRowComponents(new ActionRowBuilder().addComponents(creationConfigBtn, supprConfigBtn))
            
            client.previousPannel = [];
            return interaction.update({ components: [container] });
        }
        
        return interaction.update({ components: [client.previousPannel.pop()] });
    }
}