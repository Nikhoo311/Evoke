const { SlashCommandBuilder ,ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const { color } = require("../../../config/config.json");

module.exports = {
    name: "profil",
    categorie: "Administation",
    active: true,
    data: new SlashCommandBuilder()
        .setName("profil")
        .setDescription('Voir le profil d\'un joueur')
        .addUserOption(option => 
            option.setName("joueur").setDescription("Mentionnez le joueur dont vous souhaitez consulter les statistiques").setRequired(false)
        ),

    async execute(interaction, client) {
        const user = interaction.options.getUser("joueur") || interaction.user;
        try {
            const profile = client.manager.getPlayerProfile(user.id);
            console.log(profile);
            const embed = new EmbedBuilder()
                .setColor(color.orange)
                .setTitle(`📊 Stats classées – ${profile.gameName}`)
                .setDescription(`**Riot ID :** ${profile.riotId}`)
                .addFields(
                    { name: "🏆 Rang", value: profile.fullRank, inline: true },
                    { name: "⭐ LP", value: `${profile.leaguePoints} LP`, inline: true },
                    { name: "🎯 Rôle préféré", value: profile.preferredRole, inline: true },
                    { name: "💰 Valeur en points", value: `${profile.pointValue} pts`, inline: true }
                )
                .setFooter({ text: `Discord ID : ${profile.discordId}` })
                .setTimestamp();
    
            return await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral]})
        } catch (error) {
            return interaction.reply({ content: `❌ ${error.message}`, flags: [MessageFlags.Ephemeral] });
        }
        
    }
}