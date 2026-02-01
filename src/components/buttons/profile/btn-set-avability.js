const { EmbedBuilder, MessageFlags, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
    data: {
        name: "btn-set-avability"
    },
    async execute (interaction, client) {
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        const userId = embed.data.footer.text.split("Discord ID : ")[1];
        const profile = client.manager.getPlayerProfile(userId);

        let status = profile.availability === 'AVAILABLE'
        const fields = [...embed.data.fields];
        fields.pop()
        
        try {
            const updatedProfile = await client.manager.setAvailability(userId, !status);
            fields.push({ name: "Statut", value: `${updatedProfile.availability === "AVAILABLE" ? "🟩 Disponible" : "🟥 Indisponible"}`, inline: true})
            embed.setFields(fields)

            const avabilityBtn = ButtonBuilder.from(interaction.message.components[0].components[1])
                .setLabel(`Se mettre ${profile.availability === "UNAVAILABLE" ? "indisponible" : "disponible"}`)
                .setStyle(profile.availability === "UNAVAILABLE" ? ButtonStyle.Danger : ButtonStyle.Success)
            
            const components = [...interaction.message.components]
            components[0].components[1] = avabilityBtn;
            return await interaction.update({ embeds: [embed], components })
        } catch (error) {
            console.log(error);
            
            return interaction.reply({ content: `❌ ${error.message}`, flags: [MessageFlags.Ephemeral] });
        }
    }
}