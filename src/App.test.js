import React from 'react';
import ReactDOM from 'react-dom';
import { act } from "react-dom/test-utils";
import App from './App';
import { fireEvent } from '@testing-library/dom'

let container

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
})

afterEach(() => {
	ReactDOM.unmountComponentAtNode(container);
})

const data1 = require('./weather-data.1.json')
const data2 = require('./weather-data.2.json')
const data3 = require('./weather-data.3.json')

it('renders without crashing', () => {
	act(() => {
		ReactDOM.render(<App />, container);
	})
	expect(container.children[0].className).toBe('App')
	expect(container.querySelector('input').value).toBe('Belarus, Minsk')
});

it('fetches weather data', async () => {
	jest.spyOn(global, "fetch").mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve(data1)
    })
  );
	await act(async () => {
		ReactDOM.render(<App />, container);
	})

	expect(container.querySelector('input').value).toBe('Belarus, Minsk')
	expect(container.querySelector('.weather-now').textContent).toBe(`Right now it's kinda 9°`)
	expect(container.querySelector('.actual-city').textContent).toBe(`Commonly known as Belarus, Minsk`)

	global.fetch.mockRestore();
})

it('fetches new data', async() => {
	jest.spyOn(global, "fetch").mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve(data2)
    })
  );
	await act(async () => {
		ReactDOM.render(<App />, container);
		fireEvent.change(container.querySelector('input'), { target: { value: 'Belarus, hrodna' } })
		// container.querySelector('input').dispatchEvent(new Event('change', {value: 'Belarus, hrodna'}))
	})

	expect(container.querySelector('input').value).toBe('Belarus, hrodna')
	expect(container.querySelector('.weather-now').textContent).toBe(`Right now it's kinda 8°`)
	expect(container.querySelector('.actual-city').textContent).toBe(`Commonly known as Belarus, Hrodna`)

  global.fetch.mockRestore();
});

it('fetches remote data', twoFetchTest);
/**
 * @summary Async test which grabs initial data then requests more data over "network" awaiting its delivery
 * @var RequestAwaiter {Promise} request awaiter, resolves when main (second) request is made
 * @var RequestAwaiterResolve {Promise.resolve} request awaiter bindable resolver
 *
 * @var query {string} test variable to see if request was made with correct url
 *
 * @var i {number} logging variable keeping count of made "requests"
 * @var _start {number} timestamp when test started
 */
async function twoFetchTest() {
	let RequestAwaiter, RequestAwaiterResolve,
			query,
			i = 0, _start = performance.now()

	RequestAwaiter = new Promise(res => RequestAwaiterResolve = res)

	jest.useFakeTimers()

	jest.spyOn(global, "fetch").mockImplementation(async (req) => {
		i++
		console.info(`request ${i} after ${performance.now() - _start}`)

		// complex resolution for awaitable request
		if (i === 2) {
			query = req

			const data = await new Promise(res => setTimeout(() => res(data3), 50))
			console.info(`request ${i} ready after ${performance.now() - _start}`)

			// fetch's mock response that resolves Request Awaiter promise
			return new Promise(res =>
				RequestAwaiterResolve(() => {
					res({ json: () => Promise.resolve(data) })
				})
			)
		}
		// simple resolution for first request
		return Promise.resolve({
			json: () => Promise.resolve(data1)
		})
	});

	// render component and update input to trigger effect
	await act(async () => {
		ReactDOM.render(<App />, container);
		fireEvent.change(container.querySelector('input'), { target: { value: 'United States of America, Los Angeles' } })
		jest.runAllTimers() // fast-forward debouncer
	})
	expect(container.querySelector('input').value).toBe('United States of America, Los Angeles')

	await act(async () => {
		const resolveRequest = await RequestAwaiter
		resolveRequest()
	})
	expect(query).toBe('//localhost:3001/weather?query=United States of America, Los Angeles&units=m')
	expect(container.querySelector('.weather-now').textContent).toBe(`Right now it's kinda 20°`)
	expect(container.querySelector('.actual-city').textContent).toBe(`Commonly known as United States of America, Los Angeles`)
}
