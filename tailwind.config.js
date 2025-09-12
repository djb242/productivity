/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  safelist: [
    'container','mx-auto','max-w-6xl','p-4','md:p-8',
    'grid','grid-cols-1','md:grid-cols-2','md:grid-cols-3','md:grid-cols-4',
    'gap-4','mb-6','space-y-4',
    'md:col-span-2','lg:col-span-1'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
