import './ui/styles/tokens.css'
import './ui/styles/global.css'
import './ui/styles/animations.css'
import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'
import { hydrate } from './core/persistence/hydrate'

async function bootstrap() {
	try {
		await hydrate()
	} catch (error) {
		console.error('[bootstrap] hydrate failed', error)
	}
	return mount(App, { target: document.getElementById('app')! })
}

export default bootstrap()
