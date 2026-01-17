const { readdirSync } = require("fs");
const path = require("path");

module.exports = (client) => {
    client.handleComponents = async () => {
        const componentsPath = path.join(__dirname, "../..", "components");
        const componentsFolders = readdirSync(componentsPath);

        for (const folder of componentsFolders) {
            const folderPath = path.join(componentsPath, folder);

            const { buttons, modals, selectMenus } = client;

            switch (folder) {
                case "buttons":
                    const buttonsSubFolders = readdirSync(folderPath)
                    for (const subFolder of buttonsSubFolders) {
                        const subFolderPath = path.join(folderPath, subFolder);
                        const componentFiles = readdirSync(subFolderPath).filter(file => file.endsWith(".js"));
                        
                        for (const file of componentFiles) {
                            const filePath = path.join(subFolderPath, file);
                            const btn = require(filePath);
                            buttons.set(btn.data.name, btn);
                            if (btn.data.multi) {
                                buttons.set(btn.data.multi, btn);
                            }
                        }
                    }
                    
                    break;

                case "modals":
                    const modalsSubFolders = readdirSync(folderPath);
                    for (const subFolder of modalsSubFolders) {
                        const subFolderPath = path.join(folderPath, subFolder);
                        const componentFiles = readdirSync(subFolderPath).filter(file => file.endsWith(".js"));
                        
                        for (const file of componentFiles) {
                            const filePath = path.join(subFolderPath, file);
                            const modal = require(filePath);
                            modals.set(modal.data.name, modal);
                            if (modal.data.multi) {
                                modals.set(modal.data.multi, modal);
                            }
                        }
                    }
                    break;

                case "selectMenus":
                    const selectMenusSubFolders = readdirSync(folderPath);
                    for (const subFolder of selectMenusSubFolders) {
                        const subFolderPath = path.join(folderPath, subFolder);
                        const componentFiles = readdirSync(subFolderPath).filter(file => file.endsWith(".js"));
                        
                        for (const file of componentFiles) {
                            const filePath = path.join(subFolderPath, file);
                            const selectMenu = require(filePath);
                            selectMenus.set(selectMenu.data.name, selectMenu);
                            if (selectMenu.data.multi) {
                                selectMenus.set(selectMenu.data.multi, selectMenu);
                            }
                        }
                    }
                    break;

                default:
                    break;
            }
        }
    };
};
