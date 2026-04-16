import {
  Playfair_Display,
  DM_Sans,
  Cormorant_Garamond,
  Lato,
} from "next/font/google";
import localFont from "next/font/local";

/**
 * Catálogo de fuentes del SaaS.
 * Cada font se carga una sola vez en build time con next/font.
 * Se exponen como variables CSS que los tenants pueden referenciar.
 *
 * Variable CSS → valor en tenant.brand_font_heading / brand_font_body
 *
 * | Variable               | Valor a usar en el tenant          |
 * |------------------------|------------------------------------|
 * | --font-playfair        | var(--font-playfair), serif         |
 * | --font-dm-sans         | var(--font-dm-sans), sans-serif     |
 * | --font-cormorant       | var(--font-cormorant), serif        |
 * | --font-lato            | var(--font-lato), sans-serif        |
 * (Georgia y system-ui son fuentes del sistema — no necesitan carga)
 */

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

/**
 * Clases que se aplican al <body> para activar todas las fuentes.
 * Uso: <body className={fontVariables}>
 */
export const fontVariables = [
  playfairDisplay.variable,
  dmSans.variable,
  cormorantGaramond.variable,
  lato.variable,
].join(" ");
