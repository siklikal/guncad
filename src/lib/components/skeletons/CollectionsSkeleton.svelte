<div class="responsive-grid-5 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
	{#each Array(5) as _}
		<div class="animate-pulse rounded-lg">
			<div class="grid grid-cols-2 grid-rows-2 gap-0.5 rounded-tl-lg rounded-tr-lg bg-neutral-800 p-0.5">
				{#each Array(4) as _}
					<div class="h-24 rounded-lg bg-neutral-700"></div>
				{/each}
			</div>
			<div class="flex flex-col gap-2 rounded-br-lg rounded-bl-lg bg-black px-5 py-3">
				<div class="h-5 w-3/4 rounded bg-neutral-800"></div>
				<div class="h-4 w-full rounded bg-neutral-800"></div>
				<div class="h-4 w-5/6 rounded bg-neutral-800"></div>
			</div>
		</div>
	{/each}
</div>
