import { atom } from "jotai";
export interface QuoteData {
    services: { [key: string]: { tier: number; quantity: number } };
    complexity: number;
    timeline: number;
    addOns: string[];
    total: number;
}
// Define an atom to hold the quote data
export const quoteAtom = atom<QuoteData>({
    services: {},
    complexity: 1,
    timeline: 1,
    addOns: [],
    total: 0,
});
