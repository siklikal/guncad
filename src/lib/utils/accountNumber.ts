const ACCOUNT_NUMBER_LENGTH = 16;

export function normalizeAccountNumber(value: string): string {
	return value.replace(/\D/g, '');
}

export function isValidAccountNumber(value: string): boolean {
	return normalizeAccountNumber(value).length === ACCOUNT_NUMBER_LENGTH;
}

export function formatAccountNumber(value: string): string {
	const normalized = normalizeAccountNumber(value);
	return normalized.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function accountNumberToEmail(accountNumber: string): string {
	const normalized = normalizeAccountNumber(accountNumber);
	return `acc_${normalized}@accounts.guncad.local`;
}
