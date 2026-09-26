declare module '*/desafioRanked.js' {
  export interface HeroResult {
    balance: number
    level: string
  }

  export function classifyHeroSwitch(wins: number, losses: number): HeroResult
  export function classifyHeroTernary(wins: number, losses: number): HeroResult
  export function classifyHeroArray(wins: number, losses: number): HeroResult
  export function classifyHeroLoop(wins: number, losses: number): HeroResult
  export function classifyHeroRecursive(wins: number, losses: number): HeroResult
}
