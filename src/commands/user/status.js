const { MessageFlags, SlashCommandBuilder } = require("discord.js");

module.exports = {
    name: "status",
    categorie: "Joueur",
    active: true,
    data: new SlashCommandBuilder()
        .setName("status")
        .setDescription('Modifier son status de joueur pour la prochaine saison')
        .addSubcommand(sub => 
            sub.setName("disponible").setDescription("Se mettre disponible")
        )
        .addSubcommand(sub => 
            sub.setName("absent").setDescription("Se mettre absent")
        ),

    async execute(interaction, client) {
        const user = interaction.user;
        let status = interaction.options.getSubcommand() === "disponible"

        try {
            const updatedProfile = await client.manager.setAvailability(user.id, status);
            return interaction.reply({ content: `✅ ${updatedProfile.message}`, flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            console.log(error);
            
            return interaction.reply({ content: `❌ ${error.message}`, flags: [MessageFlags.Ephemeral] });
        }
    }
}