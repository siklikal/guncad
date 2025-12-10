<script lang="ts">
	import type { PageData } from './$types';
	import Fa from 'svelte-fa';
	import {
		faEye,
		faHeart,
		faGem,
		faStar,
		faFire,
		faBookmark,
		faShare,
		faDownload
	} from '@fortawesome/free-solid-svg-icons';
	import { getTagColorClass } from '$lib/utils/tagColors';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<div class="container mx-auto">
	<h1 class="text-4xl font-semibold">Settings</h1>
</div>
