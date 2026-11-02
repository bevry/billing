import { defineConfig } from 'eslint/config'
import eslintBevry from 'eslint-config-bevry'

export default defineConfig([
	{ ignores: ['.wrangler/**', 'public/*.min.css'] },
	eslintBevry,
	{
		files: ['**/*.{ts,tsx}'],
		settings: { react: { version: 'detect' } },
		rules: {
			// TypeScript modules are not scripts, and the JSX runtime is automatic.
			'no-implicit-globals': 'off',
			'react/react-in-jsx-scope': 'off',
			// The invoice records use non-null assertions after explicit checks.
			'@typescript-eslint/no-non-null-assertion': 'off',
		},
	},
])
