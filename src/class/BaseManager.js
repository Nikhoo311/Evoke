const { Collection } = require("discord.js");

module.exports = class BaseManager {
    constructor(baseModel) {
        this.cache = new Collection();
        this.model = baseModel;
    }

    async fillCache(keyProperty) {
        const documents = await this.model.find();
        documents.map(doc => {
            const key = doc[keyProperty];
            this.cache.set(key, doc)
        })
        return this.cache;
    }
}