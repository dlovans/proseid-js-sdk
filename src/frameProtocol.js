export const FRAME_PROTOCOL = 'proseid-embed-v1';

export function frameChannel() {
	const bytes = new Uint8Array(16);
	globalThis.crypto?.getRandomValues?.(bytes);
	return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('') || Math.random().toString(36).slice(2);
}

export function frameMessage(channel, type, payload = {}) {
	return { protocol: FRAME_PROTOCOL, channel, type, ...payload };
}

export function isFrameMessage(value, channel) {
	return !!value && value.protocol === FRAME_PROTOCOL && value.channel === channel && typeof value.type === 'string';
}
