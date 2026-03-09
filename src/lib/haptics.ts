// @ts-ignore — web-haptics lacks type declarations
import { createWebHaptics } from 'web-haptics/svelte';
import type { Action } from 'svelte/action';

let instance: ReturnType<typeof createWebHaptics> | null = null;

export function initHaptics() {
	if (!instance) {
		instance = createWebHaptics();
	}
	return instance;
}

export function trigger(pattern: 'success' | 'nudge' | 'error' | 'buzz' = 'nudge') {
	instance?.trigger(pattern);
}

export const haptic: Action<HTMLElement, 'success' | 'nudge' | 'error' | 'buzz' | undefined> = (
	node,
	pattern = 'nudge'
) => {
	function handleClick() {
		trigger(pattern);
	}

	node.addEventListener('click', handleClick);

	return {
		destroy() {
			node.removeEventListener('click', handleClick);
		}
	};
};
