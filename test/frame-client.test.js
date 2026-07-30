import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '../src/index.js';

const API_KEY = `proseid_pk_${'a'.repeat(40)}`;

beforeEach(() => {
	document.body.innerHTML = '<div id="flow"></div>';
});

describe('hosted iframe client', () => {
	it('keeps the publishable key out of the iframe URL and forwards only validated colours', () => {
		const instance = mount('#flow', {
			apiKey: API_KEY,
			flow: 'acme/intake',
			apiBase: 'https://proseid.com',
			colors: { accent: '#AABBCC', ink: 'red;display:none' }
		});
		const frame = document.querySelector('iframe');
		expect(frame.src).toContain('https://proseid.com/embed/v1/flows/acme/intake#channel=');
		expect(frame.src).not.toContain(API_KEY);
		expect(frame.getAttribute('sandbox')).toContain('allow-scripts');
		instance.destroy();
	});

	it('initializes only after a message from its exact ProseID frame', () => {
		const instance = mount('#flow', { apiKey: API_KEY, flow: 'acme/intake', apiBase: 'https://proseid.com' });
		const post = vi.spyOn(instance.frame.contentWindow, 'postMessage');
		window.dispatchEvent(new MessageEvent('message', {
			origin: 'https://attacker.example',
			source: instance.frame.contentWindow,
			data: { protocol: 'proseid-embed-v1', channel: instance.channel, type: 'frame-ready' }
		}));
		expect(post).not.toHaveBeenCalled();
		instance.destroy();
	});
});
