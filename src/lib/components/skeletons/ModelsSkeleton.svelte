<div class="responsive-grid-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
	{#each Array(5) as _}
		<div class="animate-pulse rounded-lg">
			<div class="w-full rounded-lg bg-neutral-800" style="aspect-ratio: 14 / 9;"></div>
			<div class="pt-2 pb-2">
				<div class="h-5 w-3/4 rounded bg-neutral-800"></div>
			</div>
			<div class="flex justify-between gap-1 pb-4 md:gap-4">
				<div class="flex flex-[0.45] items-center gap-1">
					<div class="h-5 w-5 shrink-0 rounded-full bg-neutral-800"></div>
					<div class="h-3 w-16 rounded bg-neutral-800"></div>
				</div>
				<div class="flex flex-[0.55] justify-end gap-3">
					<div class="flex items-center gap-1">
						<div class="h-3 w-3 rounded bg-neutral-800"></div>
						<div class="h-3 w-5 rounded bg-neutral-800"></div>
					</div>
					<div class="flex items-center gap-1">
						<div class="h-3 w-3 rounded bg-neutral-800"></div>
						<div class="h-3 w-5 rounded bg-neutral-800"></div>
					</div>
					<div class="flex items-center gap-1">
						<div class="h-3 w-3 rounded bg-neutral-800"></div>
						<div class="h-3 w-5 rounded bg-neutral-800"></div>
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
