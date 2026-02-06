const { SlashCommandBuilder ,ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, EmbedBuilder } = require("discord.js");
const { color } = require("../../../config/config.json");

module.exports = {
    name: "verification",
    categorie: "Administation",
    active: true,
    data: new SlashCommandBuilder()
        .setName("verification")
        .setDescription('Pannel de vérification joueur'),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor(color.orange)
            .setTitle('⚔️ INSCRIPTION À LA LIGUE ⚔️')
            .setDescription(
                '**Bienvenue, Invocateur !**\n\n' +
                'Pour rejoindre notre institution compétitive, vous devez lier votre compte Riot Games à votre profil Discord.\n\n' +
                '**📋 Informations requises :**\n' +
                '> Votre **Riot ID** complet (ex: `Faker#KR1`)\n\n' +
                '**🎯 Ce que nous récupérerons :**\n' +
                '> • Votre rang actuel (Solo/Duo)\n' +
                '> • Votre coût en points (8 à 50)\n' +
                '> • Vos statistiques récentes\n' +
                '> • Votre rôle préféré\n\n' +
                '**⚖️ Valeurs des rangs :**\n' +
                '```\n' +
                'Iron/Bronze    →  8 points\n' +
                'Silver/Gold    → 15 points\n' +
                'Plat/Emeraude  → 25 points\n' +
                'Diamant        → 35 points\n' +
                'Master+        → 50 points\n' +
                '```\n' +
                '**Cliquez sur le bouton ci-dessous pour commencer.**'
            )
            .setFooter({ text: 'La Ligue • Que l\'honneur guide vos choix', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        const registerButton = new ButtonBuilder()
            .setCustomId('btn-open-register-modal')
            .setLabel('S\'inscrire maintenant')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⚔️');
        await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(registerButton)] })
        return await interaction.reply({content: "✅ Le message à bien été envoyer avec succès !", flags: [MessageFlags.Ephemeral]})
    }
}