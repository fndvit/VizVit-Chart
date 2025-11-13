<script lang="ts">
	export let data = [
		{ label: 'A', value: 30 },
		{ label: 'B', value: 80 },
		{ label: 'C', value: 45 },
		{ label: 'D', value: 60 }
	];

	const width = 400;
	const height = 200;
	const padding = 20;

	const maxValue = Math.max(...data.map((d) => d.value));
</script>

<svg {width} {height}>
	{#each data as { label, value }, i}
		<rect
			x={padding + i * ((width - 2 * padding) / data.length)}
			y={height - padding - (value / maxValue) * (height - 2 * padding)}
			width={(width - 2 * padding) / data.length - 5}
			height={(value / maxValue) * (height - 2 * padding)}
			fill="teal"
		/>
		<text
			x={padding +
				i * ((width - 2 * padding) / data.length) +
				((width - 2 * padding) / data.length - 5) / 2}
			y={height - padding + 15}
			text-anchor="middle"
			font-size="12"
		>
			{label}
		</text>
	{/each}
</svg>
