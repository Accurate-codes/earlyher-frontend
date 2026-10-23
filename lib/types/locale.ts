/** Interface languages. English is required; Yoruba is shown only where reviewed text exists. */
export type Locale = "en" | "yo";

export type LocalizedText = { en: string } & Partial<Record<Exclude<Locale, "en">, string>>;
