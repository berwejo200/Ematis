import type { Config } from "tailwindcss";

/**
 * Child-friendly theme: rounded font stack and a vivid palette
 * (azul / amarillo / verde / naranja / rojo) over soft background tones.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        rounded: [
          '"Nunito"',
          '"Baloo 2"',
          '"Varela Round"',
          "ui-rounded",
          '"Segoe UI Rounded"',
          '"SF Pro Rounded"',
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        azul: "#2f80ed",
        amarillo: "#f2c94c",
        verde: "#27ae60",
        naranja: "#f2994a",
        rojo: "#eb5757",
        fondo: {
          suave: "#f4f8ff",
          crema: "#fff8ec",
          menta: "#eefcf4",
        },
      },
      borderRadius: {
        card: "1.5rem",
      },
      boxShadow: {
        suave: "0 8px 24px rgba(47, 128, 237, 0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
