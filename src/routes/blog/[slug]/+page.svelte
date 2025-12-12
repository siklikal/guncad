<script lang="ts">
	import { page } from '$app/state';

	// Get the slug from the URL (reactive)
	const slug = $derived(page.params.slug);

	// Dummy blog post data (you can edit this)
	const post = {
		title: 'FreeCAD 1.0: Complete Beginner Workflow for Firearm CAD Projects',
		author: 'GUNCAD Team',
		date: 'December 12, 2025',
		readTime: '8 min read',
		coverImage: '/images/blog-2.jpg',
		content: `
		<p class="lead">
			GUNCAD adopts FreeCAD as its native CAD environment to preserve parametric intent,
			enable long-term modification, and support reproducible manufacturing workflows.
			This document defines the technical standards required for all FreeCAD-based submissions.
		</p>

		<h2>Native CAD Philosophy</h2>
		<p>
			FreeCAD models submitted to GUNCAD must retain full parametric history.
			Mesh-only files are considered derived artifacts and must never be treated
			as authoritative sources. Design intent should be recoverable through the
			feature tree without destructive remodeling.
		</p>

		<h2>Supported Versions</h2>
		<p>
			All projects must be authored and validated using FreeCAD version 0.21.x or newer.
			Older versions are known to introduce topological instability and inconsistent
			sketch solver behavior.
		</p>

		<h2>Approved Workbenches</h2>
		<p>
			Only production-stable workbenches are permitted for GUNCAD models:
		</p>
		<ul>
			<li>Sketcher</li>
			<li>Part Design</li>
			<li>Part</li>
			<li>TechDraw</li>
			<li>Spreadsheet (for parametric control)</li>
		</ul>

		<h2>Sketching and Constraints</h2>
		<p>
			All sketches must be fully constrained with zero degrees of freedom.
			Datum-based constraints are preferred over geometry locking.
			External geometry references should be minimized to reduce dependency chains.
		</p>

		<h2>Topology Stability</h2>
		<p>
			Designs must account for FreeCAD’s topological naming behavior.
			Referencing generated edges and faces should be avoided whenever possible.
			Critical geometry should be anchored to origin planes or master sketches.
		</p>

		<h2>Body and Feature Structure</h2>
		<p>
			Each Part Design Body must contain exactly one solid.
			Boolean operations between solids must be performed at the Part level.
			Feature names should describe function rather than operation.
		</p>

		<h2>Parameters and Configuration</h2>
		<p>
			Reusable designs must expose configurable dimensions through the Spreadsheet
			workbench or named expressions. Hard-coded critical dimensions are discouraged.
		</p>

		<h2>Units and Precision</h2>
		<p>
			All models must use millimeters as the base unit system.
			Mixed units are not permitted. Manufacturing tolerances should be explicit
			where applicable.
		</p>

		<h2>Export and Validation</h2>
		<p>
			Each submission must include a validated FCStd file, a STEP export for
			CAD interoperability, and a clean STL suitable for manufacturing.
			Models must recompute without errors and produce manifold meshes.
		</p>

		<h2>Conclusion</h2>
		<p>
			GUNCAD prioritizes technically robust, parametric designs over static geometry.
			Submissions are expected to be auditable, modifiable, and suitable for
			long-term reuse across manufacturing contexts.
		</p>
	`,
		tags: ['FreeCAD', 'GUNCAD', 'CAD Standards', 'Engineering', 'Parametric Design']
	};
</script>

<article class="mx-auto max-w-4xl">
	<!-- Cover Image -->
	<div class="mb-8 overflow-hidden rounded-lg" style="aspect-ratio: 16/9;">
		<img src={post.coverImage} alt={post.title} class="h-full w-full object-cover" />
	</div>

	<!-- Article Header -->
	<header class="mb-8">
		<h1 class="mb-4 text-4xl font-bold md:text-5xl">{post.title}</h1>

		<div class="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
			<div class="flex items-center gap-2">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
					<span class="font-semibold text-primary">{post.author[0]}</span>
				</div>
				<span>{post.author}</span>
			</div>
			<span>•</span>
			<span>{post.date}</span>
			<span>•</span>
			<span>{post.readTime}</span>
		</div>

		<!-- Tags -->
		<div class="flex flex-wrap gap-2">
			{#each post.tags as tag}
				<span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
					{tag}
				</span>
			{/each}
		</div>
	</header>

	<!-- Article Content -->
	<div class="article-content">
		{@html post.content}
	</div>

	<!-- Footer -->
	<footer class="mt-12 border-t border-border pt-8">
		<div class="flex items-center gap-4">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
				<span class="text-2xl font-semibold text-primary">{post.author[0]}</span>
			</div>
			<div>
				<h3 class="font-semibold">{post.author}</h3>
				<p class="text-sm text-muted-foreground">Author and 3D printing enthusiast</p>
			</div>
		</div>
	</footer>
</article>

<style>
	.article-content :global(h2) {
		margin-top: 2rem;
		margin-bottom: 1rem;
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.article-content :global(h3) {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.article-content :global(p) {
		margin-bottom: 1rem;
		line-height: 1.75;
	}

	.article-content :global(p.lead) {
		font-size: 1.25rem;
		color: hsl(var(--muted-foreground));
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.article-content :global(ul),
	.article-content :global(ol) {
		margin-bottom: 1rem;
		margin-left: 1.5rem;
		line-height: 1.75;
	}

	.article-content :global(ul) {
		list-style-type: disc;
	}

	.article-content :global(ol) {
		list-style-type: decimal;
	}

	.article-content :global(li) {
		line-height: 1.75;
		margin-bottom: 0.5rem;
	}

	.article-content :global(strong) {
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.article-content :global(a) {
		color: hsl(var(--primary));
		text-decoration: underline;
	}

	.article-content :global(a:hover) {
		opacity: 0.8;
	}
</style>
