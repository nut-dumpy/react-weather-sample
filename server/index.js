const express = require('express')
const cors = require('cors')
const axios = require('axios')
const Cache = require('./Cache')
const { getKey, lowerCase } = require('./util')

const port = +process.env.PORT || 3001

const cache = new Cache()

const app = express()
const corsOptions = {
	origin: 'http://localhost:3000'
}

app.use(cors(corsOptions))

app.get('/weather', async (req, res) => {
	const { units, query } = req.query
	const params = {
		access_key: '677c5eee3cdab8f6a9f443157461708f',
		query: lowerCase(query),
		units: units || 'm'
	}
	// console.log(params, getKey(params))

	const data = await cache.request(getKey(params), async () => {
		const resp = await axios.get(
			`http://api.weatherstack.com/current`,
			{ params }
		)
		const data = resp.data

		// console.log(data)
		return data
	})

	res.json(data)
})

app.listen(port, () => console.info(`listening on http://localhost:${port}`))
