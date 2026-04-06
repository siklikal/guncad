import { IPGEOLOCATION_API_KEY } from '$env/static/private';

// US states where purchases are blocked
const BLOCKED_STATES = ['California', 'New Jersey', 'Washington', 'Delaware', 'Rhode Island', 'Connecticut', 'District of Columbia'];

interface GeoResult {
	allowed: boolean;
	reason?: string;
	ip?: string;
	state?: string;
	country?: string;
	security?: {
		isVpn: boolean;
		isProxy: boolean;
		isTor: boolean;
		isRelay: boolean;
	};
}

function getSecurityDenyReason(security: {
	is_vpn: boolean;
	is_proxy: boolean;
	is_tor: boolean;
	is_relay: boolean;
}): string {
	const deniedBy = [];

	if (security.is_vpn) deniedBy.push('VPN');
	if (security.is_proxy) deniedBy.push('proxy');
	if (security.is_tor) deniedBy.push('Tor');
	if (security.is_relay) deniedBy.push('network relay');

	if (deniedBy.length === 0) {
		return 'This network connection is not eligible for downloads.';
	}

	if (deniedBy.length === 1) {
		return `Downloads are not available while using ${deniedBy[0]}.`;
	}

	const last = deniedBy[deniedBy.length - 1];
	const leading = deniedBy.slice(0, -1).join(', ');

	return `Downloads are not available while using ${leading} or ${last}.`;
}


/**
 * Check if a purchase is allowed based on IP geolocation.
 * Blocks VPN/proxy/Tor/relay users and users from restricted states.
 * Uses ipgeolocation.io for geolocation and security detection.
 */
export async function checkGeoPurchase(ip: string): Promise<GeoResult> {
	try {
		const query = new URLSearchParams({
			apiKey: IPGEOLOCATION_API_KEY,
			ip,
			include: 'security',
			fields: [
				'location.country_name',
				'location.state_prov',
				'security.is_vpn',
				'security.is_proxy',
				'security.is_tor',
				'security.is_relay'
			].join(',')
		});
		const response = await fetch(`https://api.ipgeolocation.io/v3/ipgeo?${query}`);

		if (!response.ok) {
			console.error('[GeoCheck] API returned status:', response.status);
			return { allowed: false, reason: 'Unable to verify your location. Please try again later.' };
		}

		const data = await response.json();

		console.log('[GeoCheck] Full API response:', JSON.stringify(data, null, 2));

		// API may omit geo/security data for invalid or private IPs (e.g. localhost)
		if (!data.security || !data.location) {
			console.warn('[GeoCheck] No security/location data returned (likely localhost or invalid IP)');
			return { allowed: false, reason: 'Unable to verify your location.' };
		}

		console.log('[GeoCheck] IP:', data.ip);
		console.log('[GeoCheck] Country:', data.location.country_name, '| Region:', data.location.state_prov);
		console.log('[GeoCheck] VPN:', data.security.is_vpn, '| Proxy:', data.security.is_proxy, '| Tor:', data.security.is_tor, '| Relay:', data.security.is_relay);

		// Check VPN/proxy/Tor/relay
		if (data.security.is_vpn || data.security.is_proxy || data.security.is_tor || data.security.is_relay) {
			return {
				allowed: false,
				reason: getSecurityDenyReason(data.security),
				ip: data.ip,
				state: data.location.state_prov,
				country: data.location.country_name,
				security: {
					isVpn: data.security.is_vpn,
					isProxy: data.security.is_proxy,
					isTor: data.security.is_tor,
					isRelay: data.security.is_relay
				}
			};
		}

		// Must be in the United States
		if (data.location.country_name !== 'United States') {
			return {
				allowed: false,
				reason: 'Downloads are only available within the United States.',
				ip: data.ip,
				state: data.location.state_prov,
				country: data.location.country_name,
				security: {
					isVpn: data.security.is_vpn,
					isProxy: data.security.is_proxy,
					isTor: data.security.is_tor,
					isRelay: data.security.is_relay
				}
			};
		}

		// Check blocked states
		if (BLOCKED_STATES.includes(data.location.state_prov)) {
			return {
				allowed: false,
				reason: 'Downloads are not available in your state.',
				ip: data.ip,
				state: data.location.state_prov,
				country: data.location.country_name,
				security: {
					isVpn: data.security.is_vpn,
					isProxy: data.security.is_proxy,
					isTor: data.security.is_tor,
					isRelay: data.security.is_relay
				}
			};
		}

		return {
			allowed: true,
			ip: data.ip,
			state: data.location.state_prov,
			country: data.location.country_name,
			security: {
				isVpn: data.security.is_vpn,
				isProxy: data.security.is_proxy,
				isTor: data.security.is_tor,
				isRelay: data.security.is_relay
			}
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
