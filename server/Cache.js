const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

class Cache {
	constructor() {
		const adapter = new FileSync('cache.json')
		const db = low(adapter)
		db.defaults({ storage: [] }).write()
		this.db = db
	}
	async request(key, grabber) {
		const existingResource = this.db.get('storage').find({ key }).value()

		if (existingResource)
			return existingResource

		const data = await grabber(key)
		const stored = Date.now()
		this.db.get('storage').push({ key, stored, ...data }).write()
		return data
	}
}

export default Cache
