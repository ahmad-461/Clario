/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clarioBg: '#F4F6F9',
        clarioPrimary: '#0F172A',
        clarioHighlight: '#0D9488',
        clarioSecondary: '#475569',
        clarioBorder: '#E2E8F0',
        clarioErrorBg: '#FEF2F2',
        clarioErrorText: '#991B1B',
        clarioTealTint: '#F0FDFA',
        clarioTealDeep: '#0F766E',
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-fraunces)", "serif"],
      },
    },
  },
  plugins: [],
}
