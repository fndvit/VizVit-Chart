<script lang="ts">
	export let data = [
		{ label: 'A', value: 30 },
		{ label: 'B', value: 80 },
		{ label: 'C', value: 45 },
		{ label: 'D', value: 60 }
	];

	// Highlights opcionales, un array con la misma longitud que data
	export let highlights: { index: number; color: string; annotation?: string }[] = [];

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
			fill={highlights[i]?.color || 'teal'}
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

		{#if highlights[i]?.annotation}
			<text
				x={padding +
					i * ((width - 2 * padding) / data.length) +
					((width - 2 * padding) / data.length - 5) / 2}
				y={height - padding - (value / maxValue) * (height - 2 * padding) - 5}
				text-anchor="middle"
				font-size="10"
				fill={highlights[i]?.color || 'black'}
			>
				{highlights[i].annotation}
			</text>
		{/if}
	{/each}
</svg>
