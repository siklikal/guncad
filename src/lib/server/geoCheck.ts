import { VPNAPI_API_KEY } from '$env/static/private';

// US states where purchases are blocked
const BLOCKED_STATES = ['California', 'New Jersey', 'Washington', 'Delaware', 'Rhode Island', 'Connecticut', 'District of Columbia'];

interface GeoResult {
	allowed: boolean;
	reason?: string;
	ip?: string;
	state?: string;
	country?: string;
}


/**
 * Check if a purchase is allowed based on IP geolocation.
 * Blocks VPN/proxy/Tor/relay users and users from restricted states.
 * Uses vpnapi.io for detection.
 */
export async function checkGeoPurchase(ip: string): Promise<GeoResult> {
	try {
		const response = await fetch(
			`https://vpnapi.io/api/${ip}?key=${VPNAPI_API_KEY}`
		);

		if (!response.ok) {
			console.error('[GeoCheck] API returned status:', response.status);
			return { allowed: false, reason: 'Unable to verify your location. Please try again later.' };
		}

		const data = await response.json();

		console.log('[GeoCheck] Full API response:', JSON.stringify(data, null, 2));

		// API returns a message instead of geo data for invalid IPs (e.g. localhost)
		if (!data.security || !data.location) {
			console.warn('[GeoCheck] No security/location data returned (likely localhost or invalid IP)');
			return { allowed: false, reason: 'Unable to verify your location.' };
		}

		console.log('[GeoCheck] IP:', data.ip);
		console.log('[GeoCheck] Country:', data.location.country, '| Region:', data.location.region);
		console.log('[GeoCheck] VPN:', data.security.vpn, '| Proxy:', data.security.proxy, '| Tor:', data.security.tor, '| Relay:', data.security.relay);

		// Check VPN/proxy/Tor/relay
		if (data.security.vpn || data.security.proxy || data.security.tor || data.security.relay) {
			return {
				allowed: false,
				reason: 'Purchases are not available when using a VPN, proxy, or Tor. Please disable it and try again.',
				ip: data.ip,
				state: data.location.region,
				country: data.location.country
			};
		}

		// Must be in the United States
		if (data.location.country !== 'United States') {
			return {
				allowed: false,
				reason: 'Purchases are only available within the United States.',
				ip: data.ip,
				state: data.location.region,
				country: data.location.country
			};
		}

		// Check blocked states
		if (BLOCKED_STATES.includes(data.location.region)) {
			return {
				allowed: false,
				reason: `Purchases are currently not available in ${data.location.region}.`,
				ip: data.ip,
				state: data.location.region,
				country: data.location.country
			};
		}

		return {
			allowed: true,
			ip: data.ip,
			state: data.location.region,
			country: data.location.country
		};
	} catch (error) {
		console.error('[GeoCheck] Error:', error);
		return { allowed: false, reason: 'Unable to verify your location. Please try again later.' };
	}
}

/**
 * Extract client IP from SvelteKit request event.
 * Checks common headers set by reverse proxies (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
	return (
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		request.headers.get('cf-connecting-ip') ||
		'127.0.0.1'
	);
}
