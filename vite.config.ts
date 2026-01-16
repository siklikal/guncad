import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';

// Only use local HTTPS certs if they exist (local development only)
const httpsConfig =
	fs.existsSync('./localhost-key.pem') && fs.existsSync('./localhost.pem')
		? {
				key: fs.readFileSync('./localhost-key.pem'),
				cert: fs.readFileSync('./localhost.pem')
			}
		: undefined;

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		include: ['@lucide/svelte']
	},
	server: {
		allowedHosts: ['.ngrok-free.app', '.ngrok.io'],
		https: httpsConfig
	}
});
