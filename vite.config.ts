import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		include: ['@lucide/svelte']
	},
	server: {
		allowedHosts: ['.ngrok-free.app', '.ngrok.io'],
		https: {
			key: fs.readFileSync('./localhost-key.pem'),
			cert: fs.readFileSync('./localhost.pem')
		}
	}
});
