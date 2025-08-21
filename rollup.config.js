import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'

export default {
	input: 'main.ts',
	output: {
		file: 'dist/main.js',
		format: 'cjs',
		sourcemap: true,
	},
	plugins: [
		resolve({ browser: true }),
		commonjs(),
		typescript({ tsconfig: './tsconfig.json' }),
	],
	external: [
		'obsidian',
	],
}