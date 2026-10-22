import { describe, expect, it } from 'vitest';
import { isPrivateAddress, publicFetch, readLimited } from './http';

describe('isPrivateAddress', () => {
	it('separates the local network from the internet', () => {
		for (const address of ['127.0.0.1', '10.1.2.3', '192.168.0.10', '169.254.169.254', '::1']) {
			expect(isPrivateAddress(address)).toBe(true);
		}
		expect(isPrivateAddress('::ffff:7f00:1')).toBe(true);
		expect(isPrivateAddress('64:ff9b::a00:1')).toBe(true);
		expect(isPrivateAddress('fd00::1')).toBe(true);
		expect(isPrivateAddress('93.184.215.14')).toBe(false);
		expect(isPrivateAddress('2606:4700::1111')).toBe(false);
	});
});

describe('publicFetch', () => {
	it('refuses local addresses, also when a name resolves to one', async () => {
		await expect(publicFetch('https://127.0.0.1/')).rejects.toThrow(/local network/);
		await expect(publicFetch('https://[::ffff:127.0.0.1]/')).rejects.toThrow(/local network/);
		await expect(publicFetch('https://localhost:9/')).rejects.toThrow(/local network/);
	});

	it('only speaks https', async () => {
		await expect(publicFetch('http://example.com/')).rejects.toThrow(/https/);
	});
});

describe('readLimited', () => {
	it('stops reading a body that is too large', async () => {
		let sent = 0;
		const endless = new ReadableStream<Uint8Array>({
			pull(controller) {
				sent++;
				controller.enqueue(new Uint8Array(64 * 1024));
			}
		});
		await expect(readLimited(new Response(endless), 1024 * 1024, 'too large')).rejects.toThrow(
			'too large'
		);
		expect(sent).toBeLessThan(40);
		expect((await readLimited(new Response('ok'), 10, 'too large')).toString()).toBe('ok');
	});
});
