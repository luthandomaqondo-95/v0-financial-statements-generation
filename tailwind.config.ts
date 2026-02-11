import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
    	extend: {
    		colors: {
    			background: 'rgba(var(--background), <alpha-value>)',
    			foreground: 'rgba(var(--foreground), <alpha-value>)',
    			card: {
    				DEFAULT: 'rgba(var(--card), <alpha-value>)',
    				foreground: 'rgba(var(--card-foreground), <alpha-value>)'
    			},
    			popover: {
    				DEFAULT: 'rgba(var(--popover), <alpha-value>)',
    				foreground: 'rgba(var(--popover-foreground), <alpha-value>)'
    			},
    			primary: {
    				DEFAULT: 'rgba(var(--primary), <alpha-value>)',
    				foreground: 'rgba(var(--primary-foreground), <alpha-value>)'
    			},
    			secondary: {
    				DEFAULT: 'rgba(var(--secondary), <alpha-value>)',
    				foreground: 'rgba(var(--secondary-foreground), <alpha-value>)'
    			},
    			muted: {
    				DEFAULT: 'rgba(var(--muted), <alpha-value>)',
    				foreground: 'rgba(var(--muted-foreground), <alpha-value>)'
    			},
    			accent: {
    				DEFAULT: 'rgba(var(--accent), <alpha-value>)',
    				foreground: 'rgba(var(--accent-foreground), <alpha-value>)'
    			},
    			destructive: {
    				DEFAULT: 'rgba(var(--destructive), <alpha-value>)',
    				foreground: 'rgba(var(--destructive-foreground), <alpha-value>)'
    			},
    			border: 'rgba(var(--border), <alpha-value>)',
    			input: 'rgba(var(--input), <alpha-value>)',
    			ring: 'rgba(var(--ring), <alpha-value>)',
    			chart: {
    				'1': 'rgba(var(--chart-1), <alpha-value>)',
    				'2': 'rgba(var(--chart-2), <alpha-value>)',
    				'3': 'rgba(var(--chart-3), <alpha-value>)',
    				'4': 'rgba(var(--chart-4), <alpha-value>)',
    				'5': 'rgba(var(--chart-5), <alpha-value>)'
    			},
    			sidebar: {
				DEFAULT: 'rgba(var(--sidebar-background), <alpha-value>)',
				foreground: 'rgba(var(--sidebar-foreground), <alpha-value>)',
				primary: 'rgba(var(--sidebar-primary), <alpha-value>)',
				'primary-foreground': 'rgba(var(--sidebar-primary-foreground), <alpha-value>)',
				accent: 'rgba(var(--sidebar-accent), <alpha-value>)',
				'accent-foreground': 'rgba(var(--sidebar-accent-foreground), <alpha-value>)',
				border: 'rgba(var(--sidebar-border), <alpha-value>)',
				ring: 'rgba(var(--sidebar-ring), <alpha-value>)'
			},
			'light-blue': {
				50: '#f0f9ff',
				100: '#e0f2fe',
				200: '#bae6fd',
				300: '#7dd3fc',
				400: '#38bdf8',
				500: '#0ea5e9',
				600: '#0284c7',
				700: '#0369a1',
				800: '#075985',
				900: '#0c4a6e',
			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			shimmer: {
    				'0%': {
    					'background-position': '-100% 0'
    				},
    				'100%': {
    					'background-position': '100% 0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			shimmer: 'shimmer 3s infinite linear'
    		}
    	}
    },
	plugins: [
		require("tailwindcss-animate"),
		require("@tailwindcss/typography"),
	],
};
export default config;