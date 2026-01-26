const { ActivityType } = require("discord.js");
const logger = require("../functions/utils/Logger");
const ConfigModel = require("../schemas/config");

module.exports = {
    name: "clientReady",
    once: true,
    async execute(client) {
        try {
            const statuses = [
                { name: "📅 Prochaine saison : [Date]", type: ActivityType.Watching },
                { name: "⌨️ S'enregistrer : /register", type: ActivityType.Custom },
            ];

            let index = 0;

            setInterval(() => {
                const status = statuses[index];

                client.user.setPresence({
                    activities: [{ name: status.name, type: status.type }],
                    status: "online"
                });

                index = (index + 1) % statuses.length;
            }, 10000);

        } catch (error) {
            console.error(error);
        }
        const configs = await ConfigModel.find();
        configs.map(config => client.configs.set(config._id.toString(), config));

        logger.clientStart(`${client.user.tag} est en ligne !`)
    }
}