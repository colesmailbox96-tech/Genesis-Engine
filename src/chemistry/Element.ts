export enum Element {
  H = 'H',
  C = 'C',
  N = 'N',
  O = 'O',
  P = 'P',
  S = 'S',
}

export interface ElementProperties {
  symbol: string;
  bondSites: number;
  electronegativity: number;
  mass: number;
  color: [number, number, number];
  abundance: number;
}

export const ELEMENT_PROPERTIES: Record<Element, ElementProperties> = {
  [Element.H]: { symbol: 'H', bondSites: 1, electronegativity: 0.21, mass: 1, color: [200, 220, 255], abundance: 0.40 },
  [Element.C]: { symbol: 'C', bondSites: 4, electronegativity: 0.55, mass: 12, color: [100, 100, 100], abundance: 0.15 },
  [Element.N]: { symbol: 'N', bondSites: 3, electronegativity: 0.65, mass: 14, color: [100, 150, 255], abundance: 0.10 },
  [Element.O]: { symbol: 'O', bondSites: 2, electronegativity: 0.75, mass: 16, color: [255, 80, 80], abundance: 0.20 },
  [Element.P]: { symbol: 'P', bondSites: 5, electronegativity: 0.45, mass: 31, color: [255, 180, 50], abundance: 0.05 },
  [Element.S]: { symbol: 'S', bondSites: 2, electronegativity: 0.50, mass: 32, color: [255, 255, 80], abundance: 0.10 },
};
