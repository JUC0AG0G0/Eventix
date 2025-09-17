// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["eslint.config.mjs", "dist", "node_modules"],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	eslintPluginPrettierRecommended,
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest,
				...globals.browser,
			},
			sourceType: "commonjs",
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",

			eqeqeq: ["error", "always"],
			"no-var": "error",
			"prefer-const": "warn",
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

			curly: ["error", "all"],
			"default-case": "warn",
			"no-fallthrough": "error",

			quotes: "off",
			semi: ["error", "always"],
			"comma-dangle": ["error", "always-multiline"],
		},
	},
	// Configuration spécifique pour les fichiers de test
	{
		files: ["**/*.spec.ts", "**/*.test.ts", "**/*.e2e-spec.ts"],
		rules: {
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
		},
	},
);
