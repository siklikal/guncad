/**
 * Create a URL-friendly slug from title and ID
 * Example: "APM-180" + "db8c4da5..." -> "apm-180-db8c4da5"
 */
export function createProjectSlug(title: string, id: string): string {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	const shortId = id.substring(0, 8);
	return `${slug}-${shortId}`;
}

/**
 * Get the full URL path for a project details page
 */
export function getProjectUrl(title: string, id: string): string {
	return `/details/${id}`;
}
