<script lang="ts">
	import { blog } from '$lib/data/blog';
</script>

<svelte:head>
	<title>Blog - GUNCAD</title>
	<meta name="description" content="Stay updated with the latest news, guides, and tutorials for 3D-printed firearm projects" />
</svelte:head>

<div class="container mx-auto">
	<div class="mb-8">
		<h1 class="text-3xl font-bold md:text-4xl">Blog</h1>
		<p class="mt-2 text-neutral-400">
			Stay updated with the latest news, guides, and tutorials
		</p>
	</div>

	<div
		class="responsive-grid-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
	>
		{#each blog as item, index}
			<a href="/blog/getting-started-with-3d-printing" class="group">
				<div class="rounded-lg">
					<div
						class="rounded-tl-lg rounded-tr-lg bg-cover bg-center"
						style="background-image: url('images/blog-{index + 1}.jpg'); aspect-ratio: 16 / 9;"
					></div>
					<div
						class="flex flex-1 flex-col justify-between gap-4 rounded-br-lg rounded-bl-lg bg-black p-4"
					>
						<p class="line-clamp-2 font-semibold group-hover:text-blue-600">
							{item.title}
						</p>
						<p class="text-sm text-neutral-400">
							{item.category}
						</p>
					</div>
				</div>
			</a>
		{/each}
	</div>
</div>
