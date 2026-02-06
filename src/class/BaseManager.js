const { Collection } = require("discord.js");

module.exports = class BaseManager {
    constructor(baseModel, autoSaveInterval = 60_000) {
        this.cache = new Collection();
        this.model = baseModel;
        this.autoSaveInterval = autoSaveInterval;
        this.saveTimer = null;
    }

    async fillCache(keyProperty) {
        const documents = await this.model.find();
        documents.map(doc => {
            const key = doc[keyProperty];
            doc.isDirty = false;
            this.cache.set(key, doc);
        })

        this.startAutoSave();
        return this.cache;
    }

    markDirty(key) {
        const doc = this.cache.get(key);
        if (doc) {
            doc.isDirty = true;
        }
    }

    async saveDirtyDocuments() {
        const dirtyDocs = this.cache.filter(doc => doc.isDirty === true);
        
        if (dirtyDocs.size === 0) {
            console.log('Aucun document à sauvegarder');
            return { saved: 0, errors: 0 };
        }

        let saved = 0;
        let errors = 0;

        const savePromises = dirtyDocs.map(async (doc) => {
            try {
                await doc.save();
                doc.isDirty = false;
                saved++;
            } catch (error) {
                console.error(`Erreur lors de la sauvegarde du document:`, error);
                errors++;
            }
        });

        await Promise.all(savePromises);
        
        console.log(`Sauvegarde terminée: ${saved} documents sauvegardés, ${errors} erreurs`);
        
        return { saved, errors };
    }

    startAutoSave() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
        }
        
        this.saveTimer = setInterval(async () => {
            await this.saveDirtyDocuments();
        }, this.autoSaveInterval);
        
        console.log(`Auto-save activé: sauvegarde toutes les ${this.autoSaveInterval / 1000} secondes`);
    }

    stopAutoSave() {
        if (this.saveTimer) {
            clearInterval(this.saveTimer);
            this.saveTimer = null;
            console.log('Auto-save désactivé');
        }
    }

    async shutdown() {
        this.stopAutoSave();
        console.log('Sauvegarde finale avant fermeture...');
        await this.saveDirtyDocuments();
    }
}