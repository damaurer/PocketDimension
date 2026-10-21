import type { ContainerStats } from 'dockerode';
import { describe, expect, it } from 'vitest';
import { computeResources } from '#lib/server/games/status.ts';

function stats(overrides: {
	total: [number, number];
	system: [number, number];
	cpus?: number;
	usage?: number;
	inactive?: number;
}): ContainerStats {
	return {
		cpu_stats: {
			cpu_usage: { total_usage: overrides.total[1] },
			system_cpu_usage: overrides.system[1],
			online_cpus: overrides.cpus ?? 4
		},
		precpu_stats: {
			cpu_usage: { total_usage: overrides.total[0] },
			system_cpu_usage: overrides.system[0]
		},
		memory_stats: {
			usage: overrides.usage ?? 0,
			limit: 16 * 1024 ** 3,
			stats: { inactive_file: overrides.inactive ?? 0 }
		}
	} as unknown as ContainerStats;
}

describe('computeResources', () => {
	it('computes CPU like docker stats', () => {
		// 50 of 400 system ticks on 4 CPUs = 50 %
		expect(computeResources(stats({ total: [100, 150], system: [1000, 1400] }), 0).cpuPercent).toBe(
			50
		);
		expect(computeResources(stats({ total: [0, 0], system: [0, 0] }), 0).cpuPercent).toBe(0);
	});

	it('subtracts the page cache from memory usage', () => {
		const result = computeResources(
			stats({ total: [0, 0], system: [0, 0], usage: 300, inactive: 100 }),
			1024
		);
		expect(result.memoryBytes).toBe(200);
		expect(result.memoryLimitBytes).toBe(1024);
	});

	it('reports no limit when the container has none', () => {
		expect(
			computeResources(stats({ total: [0, 0], system: [0, 0] }), 0).memoryLimitBytes
		).toBeNull();
	});
});
