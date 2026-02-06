const { SlashCommandBuilder ,ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const { color } = require("../../../config/config.json");

module.exports = {
    name: "profil",
    categorie: "Joueur",
    active: true,
    data: new SlashCommandBuilder()
        .setName("profil")
        .setDescription('Voir le profil d\'un joueur')
        .addUserOption(option => 
            option.setName("joueur").setDescription("Mentionnez le joueur dont vous souhaitez consulter les statistiques").setRequired(false)
        ),

    async execute(interaction, client) {
        const user = interaction.options.getUser("joueur") || interaction.user;
        if (user.bot) return await interaction.reply({ content: `❌ <@${user.id}> est un bot... les bots **ne peuvent pas** avoir de profil joueur.`, flags: [MessageFlags.Ephemeral] });
        
        const rankEmojis =  {
            'IRON': "<:iron:1466876271073169530>", 'BRONZE': "", 'SILVER': "<:silver:1466876965113037025>", 'GOLD': "<:gold:1466876296293519622>",
            'PLATINUM': "<:platine:1466876863501570201>", 'EMERALD': "<:emeraude:1466876576821149908>", 'DIAMOND': "<:diamant:1466876173572378827>",
            'MASTER': "<:master:1466876240802615410>", 'GRANDMASTER': "<:grandmaster:1466876209127362845>", 'CHALLENGER': "<:challenger:1466875211571007680>",
            'UNRANKED': ""
        };
        try {
            const profile = client.manager.getPlayerProfile(user.id);
            console.log(profile);
            const embed = new EmbedBuilder()
                .setColor(color.orange)
                .setTitle(`📊 Stats classées – ${profile.gameName}`)
                .setDescription(`**Riot ID :** ${profile.riotId}`)
                .addFields(
                    { name: "🏆 Rang", value: `${rankEmojis[profile.tier]} ${profile.fullRank}`, inline: true },
                    { name: "⭐ LP", value: `${profile.leaguePoints} LP`, inline: true },
                    { name: "🎯 Rôle préféré", value: profile.preferredRole, inline: true },
                    { name: "💰 Valeur en points", value: `${profile.pointValue} pts`, inline: true },
                    { name: "KDA", value: `${profile.stats.kdaAverage}`, inline: true },
                    { name: "Winrate", value: `${profile.stats.winrate} %`, inline: true },
                    { name: "Nombre de games", value: `${profile.stats.gamesPlayed}`, inline: true },
                    { name: "Wins", value: `${profile.stats.wins}`, inline: true },
                    { name: "Losses", value: `${profile.stats.losses}`, inline: true },
                    { name: "\u200b", value: "\u200b", inline: true },
                    { name: "\u200b", value: "\u200b", inline: true },
                    { name: "Statut", value: `${profile.availability === "AVAILABLE" ? "🟩 Disponible" : "🟥 Indisponible"}`, inline: true},
                )
                .setFooter({ text: `Discord ID : ${profile.discordId}` })
                .setTimestamp();

            const availabilityBtn = new ButtonBuilder()
                .setCustomId("btn-set-avability")
                .setLabel(`Se mettre ${profile.availability === "AVAILABLE" ? "indisponible" : "disponible"}`)
                .setStyle(profile.availability === "AVAILABLE" ? ButtonStyle.Danger : ButtonStyle.Success)

            const opGgLink = new ButtonBuilder()
                .setLabel("Profil op.gg")
                .setEmoji("<:orangesite:1465283796843757693>")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://op.gg/lol/summoners/euw/${encodeURIComponent(profile.riotId.replace("#", "-"))}`)

            const actionRow = new ActionRowBuilder().addComponents(opGgLink);
            if (user.id === interaction.user.id) {
                actionRow.addComponents(availabilityBtn);
            }

            return await interaction.reply({ embeds: [embed], components: [actionRow], flags: [MessageFlags.Ephemeral]})
        } catch (error) {
            return interaction.reply({ content: `❌ ${error.message}`, flags: [MessageFlags.Ephemeral] });
        }
        
    }
}