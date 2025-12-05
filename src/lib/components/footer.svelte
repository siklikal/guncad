<script lang="ts">
	import Fa from 'svelte-fa';
	import { faXTwitter } from '@fortawesome/free-brands-svg-icons';
	import { faInstagram } from '@fortawesome/free-brands-svg-icons';
	import { faYoutube } from '@fortawesome/free-brands-svg-icons';
	import { faBitcoin } from '@fortawesome/free-brands-svg-icons';
</script>

<div class="w-full bg-black p-4 md:px-8 md:py-4">
	<div class="flex justify-between">
		<div class="flex gap-4">
			<p class="text-xs">© 2025 Guncad</p>
			<div class="h-1 bg-red-500"></div>
			<a href="/" class="text-xs text-neutral-400">Privacy</a>
			<a href="/" class="text-xs text-neutral-400">Terms</a>
		</div>
		<div class="flex gap-4">
			<Fa icon={faXTwitter} class="text-lg" />
			<Fa icon={faInstagram} class="text-lg" />
			<Fa icon={faYoutube} class="text-lg" />
		</div>
	</div>
</div>
