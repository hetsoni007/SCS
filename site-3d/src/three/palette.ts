import { useStore, type Theme } from '../state/store'

// 3D mirror of the CSS tokens (DESIGN.md §2). Kept in one place so both themes
// stay in step with styles/tokens.css.
export const PALETTE = {
  dark: {
    bg: '#0b0e11',
    fg: '#ece7dc',
    signal: '#ff5a1f',
    cyan: '#86bcd9',
    metal: '#1b2127',
    glass: '#07090b',
    board: '#12181d',
    additive: true,
    fog: [7, 26] as [number, number],
    envBg: '#0a0c0e',
  },
  light: {
    bg: '#eeeae1',
    fg: '#12161a',
    signal: '#d9430f',
    cyan: '#2a6a8f',
    metal: '#2b3238',
    glass: '#0c0f12',
    board: '#1b2228',
    additive: false,
    fog: [8, 30] as [number, number],
    envBg: '#d8d3c8',
  },
} as const

export type Pal = (typeof PALETTE)[Theme]

export function usePalette(): Pal {
  const theme = useStore((s) => s.theme)
  return PALETTE[theme]
}
