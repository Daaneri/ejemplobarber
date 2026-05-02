/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Podés personalizar el dorado aquí si querés
        amber: {
          500: '#D4AF37', // Un dorado más tipo "oro" para el cliente
        }
      }
    },
  },
  plugins: [],
}