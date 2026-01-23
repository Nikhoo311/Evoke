const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { createChannelSelectMenu } = require("../../../functions/utils/createChannelSelectMenu");

module.exports = {
    data: {
        name: "btn-create-config-channel",
        multi: "btn-delete-config-channel"
    },

    async execute(interaction, client) {
        const id = interaction.message.components[0].data.content.split("-# ")[1];
        const config = client.configs.get(id);

        const isDelete = interaction.customId === "btn-delete-config-channel";

        const modalId = isDelete ? "config-delete-channel-modal" : "config-create-channel-modal";
        const modalTitle = isDelete ? "Supprimer salon(s)" : "Créer un salon";
        
        const modal = new ModalBuilder()
            .setCustomId(modalId)
            .setTitle(`${config.name} — ${modalTitle}`);

        if (isDelete) {
            const selectMenu = createChannelSelectMenu({
                customId: "select_channels_delete",
                channels: config.channels.filter(ch => !ch.alwaysActive),
                placeholder: "Choisir le(s) salon(s) à supprimer"
            })

            const selectMenuLabel = new LabelBuilder()
                .setStringSelectMenuComponent(selectMenu)
                .setLabel("Le(s) salon(s) :")

            modal.addLabelComponents(selectMenuLabel);
        } else {
            const channelNameInput = new TextInputBuilder()
                .setCustomId("new_channel_name")
                .setPlaceholder("Entrez un nom (max 70 caractères)")
                .setStyle(TextInputStyle.Short)
                .setMaxLength(70)
                .setRequired(true);
                    
            const channelNameInputLabel = new LabelBuilder()
                .setTextInputComponent(channelNameInput)
                .setLabel("Nom du salon :")
            
            const selectChannelTypes = new StringSelectMenuBuilder()
                .setCustomId("select_channel_type")
                .setMinValues(1)
                .setMaxValues(1)
                .setRequired(true)
                .setPlaceholder("Choisir un type de salon...")
                .setOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Salon textuel")
                        .setValue("text")
                        .setEmoji("<:channel:1462295158388429017>")
                        .setDefault(true),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Salon vocal")
                        .setValue("voice")
                        .setEmoji("<:channel_voice:1463730529663844543>")
                ])
            
            const selectLabel = new LabelBuilder().setStringSelectMenuComponent(selectChannelTypes).setLabel("Type du salon :")
            modal.addLabelComponents(channelNameInputLabel, selectLabel)
        }
        return await interaction.showModal(modal);
    }
};