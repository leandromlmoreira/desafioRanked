import type { SceneId } from './journey.ts'

export type Speaker = 'coruja' | 'corvo' | 'heroi' | 'narrador'
export type Actor = 'coruja' | 'corvo'

export interface Line {
  speaker: Speaker
  text: string
}

export interface StoryScene {
  id: SceneId
  eyebrow: string
  title: string
  backdrop: number
  cast: Actor[]
  lines: Line[]
}

export const SPEAKER_NAMES: Record<Speaker, string> = {
  coruja: 'Mestra Coruja',
  corvo: 'Rei Corvo',
  heroi: 'Você',
  narrador: 'Narrador'
}

const coruja = (text: string): Line => ({ speaker: 'coruja', text })
const corvo = (text: string): Line => ({ speaker: 'corvo', text })
const heroi = (text: string): Line => ({ speaker: 'heroi', text })
const narrador = (text: string): Line => ({ speaker: 'narrador', text })

export const STORY: StoryScene[] = [
  {
    id: 'prologo',
    eyebrow: 'Prólogo',
    title: 'A noite em que a chama sumiu',
    backdrop: 0,
    cast: ['coruja'],
    lines: [
      narrador('Toda noite, a Chama do Topo acendia o templo no alto da montanha, e o vale inteiro dormia quentinho.'),
      narrador('Até que, numa noite sem lua, a chama sumiu. No lugar dela, só um bater de asas negras.'),
      coruja('Hu-hu! Então você é o aprendiz que veio da vila. Eu sou a Mestra Coruja, guardiã desta trilha.'),
      coruja('Quem levou a chama foi o Rei Corvo. Ele se trancou no templo e anunciou que as noites agora são dele.'),
      coruja('A montanha só deixa passar quem prova seu valor em duelos. Cada vitória é um degrau, do Ferro ao Imortal.'),
      coruja('Tome a minha velha Espada do Aprendiz. Mire com calma: golpe bem no centro vale o dobro.'),
      heroi('Vou trazer a chama de volta. Prometo.')
    ]
  },
  {
    id: 'capitulo-0',
    eyebrow: 'Capítulo 1 · Ferro',
    title: 'A fogueira da vila',
    backdrop: 0,
    cast: ['coruja'],
    lines: [
      coruja('Primeira lição: na sua vez, pare o ponteiro no alvo dourado. Na vez do inimigo, bloqueie quando o golpe chegar à marca.'),
      coruja('Ali perto da fogueira mora o Gosmo. Resmunga muito, mas é um ótimo professor. Vença duas vezes e o Bronze é seu.')
    ]
  },
  {
    id: 'capitulo-1',
    eyebrow: 'Capítulo 2 · Bronze',
    title: 'O bosque da neblina',
    backdrop: 1,
    cast: ['coruja', 'corvo'],
    lines: [
      narrador('Os aldeões tocaram o sino velho da praça pela última vez e, com ele, forjaram um escudo para você.'),
      corvo('Crá! Um aprendiz de Bronze subindo a minha montanha? Que coisa mais fofa.'),
      corvo('A neblina do bosque vai te fazer dar meia-volta. O Uivo cuida disso para mim.'),
      coruja('Não ligue para ele. Na neblina, confie no ritmo, não nos olhos. E agora você tem um escudo.')
    ]
  },
  {
    id: 'capitulo-2',
    eyebrow: 'Capítulo 3 · Prata',
    title: 'As pedras que dormem',
    backdrop: 2,
    cast: ['coruja'],
    lines: [
      coruja('Prata! Daqui já dá para ver os telhados da vila. Tem gente acenando lá embaixo.'),
      narrador('Num baú de pedra, entre samambaias, brilhava um elmo de prata com um penacho vermelho.'),
      coruja('O Pedrusco dorme nestes terraços há cem anos. Acordá-lo é falta de educação... mas é o único caminho.'),
      heroi('Então eu peço desculpas antes. E durante.')
    ]
  },
  {
    id: 'capitulo-3',
    eyebrow: 'Capítulo 4 · Ouro',
    title: 'O vento dourado',
    backdrop: 3,
    cast: ['coruja', 'corvo'],
    lines: [
      coruja('Ouro! Sente esse vento? Ele sopra a favor de quem não desiste.'),
      corvo('Chegou longe, pequeno. Mas o planalto é da Plumária, e ela detesta visitas.'),
      coruja('Por isso trouxe a Capa Dourada. Ela mostra onde mirar: o seu alvo fica maior.'),
      coruja('E repare numa coisa: o Rei Corvo parece cansado. Ninguém guarda uma chama sozinho por tanto tempo.')
    ]
  },
  {
    id: 'capitulo-4',
    eyebrow: 'Capítulo 5 · Diamante',
    title: 'A caverna de cristal',
    backdrop: 4,
    cast: ['coruja'],
    lines: [
      narrador('A trilha entra numa caverna onde cada parede é um espelho, e cada espelho tem uma versão sua.'),
      coruja('Diamante! Pouca gente chega tão alto. As Botas de Diamante vão acalmar seus passos.'),
      coruja('Lúmen, o espectro, mostra o que a gente mais teme. Olhe através dele, não para ele.'),
      heroi('Meu medo é decepcionar a vila. Mas foram eles que me mandaram até aqui, né?'),
      coruja('Hu-hu. Exatamente.')
    ]
  },
  {
    id: 'capitulo-5',
    eyebrow: 'Capítulo 6 · Lendário',
    title: 'O portão do templo',
    backdrop: 5,
    cast: ['coruja', 'corvo'],
    lines: [
      narrador('As estrelas estão tão perto que dá para ouvi-las tilintar. Nas suas costas, brotam asas de luz.'),
      corvo('Então é você. O aprendiz que não sabe desistir.'),
      corvo('Para que tanta pressa em acender a chama? Quando ela brilha, todo mundo olha para ela. Ninguém olha para mim.'),
      coruja('Ah, velho amigo. Então era isso.'),
      corvo('A Sentinela guarda o portão. Se passar por ela, eu mesmo te enfrento.')
    ]
  },
  {
    id: 'capitulo-6',
    eyebrow: 'Epílogo · Imortal',
    title: 'A chama do topo',
    backdrop: 6,
    cast: ['coruja', 'corvo'],
    lines: [
      narrador('A última pena preta caiu devagar. O Rei Corvo abriu as asas e, lá dentro, a Chama do Topo tremulava.'),
      corvo('Pode levar. Eu só... não queria ficar sozinho no escuro.'),
      heroi('Então fica com a gente. Chama esquenta melhor quando tem gente em volta.'),
      narrador('A chama voltou ao altar e o vale inteiro acordou dourado. Lá embaixo, a vila cantava.'),
      coruja('Imortal. Eu sabia desde o primeiro degrau. A Coroa é sua, campeão.'),
      coruja('A trilha segue aberta para os Desafios Imortais sempre que quiser treinar. O Corvo prometeu ajudar.'),
      corvo('Crá. Só se tiver bolo.')
    ]
  }
]

export function sceneById(id: SceneId): StoryScene {
  const scene = STORY.find((entry) => entry.id === id)
  if (!scene) throw new Error(`Cena desconhecida: ${id}`)
  return scene
}

const VICTORY_CHEERS = ['Que golpe bonito!', 'Mandou muito bem!', 'Isso, aprendiz!', 'A montanha sentiu essa!']
const DEFEAT_COMFORT = [
  'Tudo bem cair. O importante é o degrau seguinte.',
  'Respira. Até a Mestra aqui já perdeu para o Gosmo.',
  'Ninguém sobe a montanha em linha reta.'
]

export function victoryLine(foeName: string, amount: number, duelsWon: number, remaining: string): string {
  return `${VICTORY_CHEERS[duelsWon % VICTORY_CHEERS.length]} ${foeName} ficou para trás: +${amount} vitórias. ${remaining}`
}

export function defeatLine(foeName: string, amount: number, duelsLost: number): string {
  return `${DEFEAT_COMFORT[duelsLost % DEFEAT_COMFORT.length]} ${foeName} levou essa (+${amount} derrotas), mas a patente só conta vitórias.`
}
