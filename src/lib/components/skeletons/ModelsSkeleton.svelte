<div class="responsive-grid-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
	{#each Array(5) as _}
		<div class="animate-pulse rounded-lg">
			<div class="h-48 w-full rounded-tl-lg rounded-tr-lg bg-neutral-800"></div>
			<div class="flex flex-col gap-2 bg-black px-4 py-4">
				<div class="h-5 w-3/4 rounded bg-neutral-800"></div>
				<div class="flex items-center justify-between">
					<div class="h-4 w-24 rounded bg-neutral-800"></div>
					<div class="flex gap-2">
						<div class="h-4 w-12 rounded bg-neutral-800"></div>
						<div class="h-4 w-12 rounded bg-neutral-800"></div>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
