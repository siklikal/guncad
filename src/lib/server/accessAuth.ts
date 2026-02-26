import { createHmac } from 'crypto';
import { env } from '$env/dynamic/private';

export const ACCESS_COOKIE_NAME = 'guncad_access';
export const ACCESS_COOKIE_TTL_DAYS = 30;

export function computeAccessToken(password: string): string {
	return createHmac('sha256', password).update('guncad_access_granted').digest('hex');
}

export function isValidAccessCookie(cookieValue: string | undefined): boolean {
	if (!cookieValue || !env.BETA_ACCESS_PASSWORD) return false;
	const expected = computeAccessToken(env.BETA_ACCESS_PASSWORD);
	return cookieValue === expected;
}
