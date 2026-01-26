const { readFileSync, writeFile } = require("fs");
const { MessageFlags } = require("discord.js");

module.exports = {
    data: {
        name: "select-choose-config"
    },
    async execute(interaction, client) {
        const info = interaction.values[0]
        // Get the data base
        const chooseOption = JSON.parse(readFileSync("./config/choose-config.json", "utf-8"))['config_chosen'];

        const configInFile = chooseOption !== "" ? chooseOption : "Aucune"
        const message = `Vous avez choisi de mettre la configuration : \`${info}\`\nLa configuartion précédente était : \`${configInFile}\``

        try {
            writeFile('./config/choose-config.json', JSON.stringify({config_chosen: info}, null, 4), err => {
                if (err) throw new Error("/!\\ Error: Something wrong when we write in the 'choose-config.json'")
            })
            interaction.update({ content: `✅ ${message}`, embeds: [], components: [], flags: [MessageFlags.Ephemeral]})
            
        } catch (error) {
            interaction.reply({ content: "❌ Un erreur est survenu lors de l'écriture dans le fichier de configuration !\n" + error, flags: [MessageFlags.Ephemeral] })
        }
    }
}