import { createHmac, createHash, randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';
import { normalizeAccountNumber } from '$lib/utils/accountNumber';

export const SESSION_COOKIE_NAME = 'guncad_session';
const SESSION_TTL_DAYS = 30;

function getPepper(): string {
	if (!env.ACCOUNT_NUMBER_PEPPER) {
		throw new Error('Missing ACCOUNT_NUMBER_PEPPER');
	}
	return env.ACCOUNT_NUMBER_PEPPER;
}

export function buildLookupToken(accountNumber: string): string {
	const normalized = normalizeAccountNumber(accountNumber);
	return createHmac('sha256', getPepper()).update(normalized).digest('hex');
}

export function generateOpaqueSessionToken(): string {
	return randomBytes(48).toString('base64url');
}

export function hashSessionToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function getSessionExpiryDate(): Date {
	const out = new Date();
	out.setDate(out.getDate() + SESSION_TTL_DAYS);
	return out;
}
