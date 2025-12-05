// Color palette for tags
const colorClasses = [
	'border-purple-300 text-purple-300 hover:bg-purple-300 hover:text-black',
	'border-cyan-300 text-cyan-300 hover:bg-cyan-300 hover:text-black',
	'border-rose-300 text-rose-300 hover:bg-rose-300 hover:text-black',
	'border-emerald-300 text-emerald-300 hover:bg-emerald-300 hover:text-black',
	'border-amber-300 text-amber-300 hover:bg-amber-300 hover:text-black',
	'border-indigo-300 text-indigo-300 hover:bg-indigo-300 hover:text-black',
	'border-pink-300 text-pink-300 hover:bg-pink-300 hover:text-black',
	'border-lime-300 text-lime-300 hover:bg-lime-300 hover:text-black',
	'border-sky-300 text-sky-300 hover:bg-sky-300 hover:text-black',
	'border-fuchsia-300 text-fuchsia-300 hover:bg-fuchsia-300 hover:text-black',
	'border-teal-300 text-teal-300 hover:bg-teal-300 hover:text-black',
	'border-orange-300 text-orange-300 hover:bg-orange-300 hover:text-black',
	'border-green-300 text-green-300 hover:bg-green-300 hover:text-black',
	'border-blue-300 text-blue-300 hover:bg-blue-300 hover:text-black',
	'border-yellow-300 text-yellow-300 hover:bg-yellow-300 hover:text-black',
	'border-violet-300 text-violet-300 hover:bg-violet-300 hover:text-black',
	'border-red-300 text-red-300 hover:bg-red-300 hover:text-black',
	'border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black',
	'border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-black',
	'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black',
	'border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black',
	'border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black',
	'border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-black',
	'border-rose-400 text-rose-400 hover:bg-rose-400 hover:text-black',
	'border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-black'
];

/**
 * Gets a consistent color class for a tag based on its slug
 * This ensures the same tag always gets the same color
 */
export function getTagColorClass(slug: string): string {
	// Simple hash function to get a consistent index for each slug
	let hash = 0;
	for (let i = 0; i < slug.length; i++) {
		hash = (hash << 5) - hash + slug.charCodeAt(i);
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Get positive index within color array bounds
	const index = Math.abs(hash) % colorClasses.length;
	return colorClasses[index];
}
