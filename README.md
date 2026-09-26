# RankTier

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

Biblioteca Node.js que calcula a patente competitiva de um jogador a partir do seu histórico de vitórias e derrotas, no estilo dos sistemas de ranqueada usados em jogos multiplayer.

## O que ela resolve

Dado o número de vitórias e derrotas de um jogador, a biblioteca calcula:

- **Saldo**: `vitórias - derrotas`
- **Patente**: uma entre 7 faixas (Ferro, Bronze, Prata, Ouro, Diamante, Lendário, Imortal), definida pelo número de vitórias

## Funcionalidades

- Classificação de patente em 7 níveis, com faixas configuráveis
- Cálculo de saldo entre vitórias e derrotas
- Cinco implementações equivalentes do mesmo algoritmo (`switch`, ternário encadeado, array + `find`, laço `for` e recursão), úteis como referência de diferentes estilos de resolução do mesmo problema
- Suíte de testes automatizados cobrindo as bordas de cada faixa

## Tabela de patentes

| Vitórias | Patente |
|----------|---------|
| < 10     | Ferro |
| 10–20    | Bronze |
| 21–50    | Prata |
| 51–80    | Ouro |
| 81–90    | Diamante |
| 91–100   | Lendário |
| ≥ 101    | Imortal |

## Como usar

Importe qualquer uma das implementações e chame passando vitórias e derrotas:

```js
const { classifyHeroSwitch } = require('./desafioRanked')

const resultado = classifyHeroSwitch(18, 5)
// { balance: 13, level: 'Bronze' }
```

Todas as implementações abaixo são intercambiáveis — recebem `(vitorias, derrotas)` e retornam `{ balance, level }`:

| Implementação | Função |
|---|---|
| `switch (true)` | `classifyHeroSwitch` |
| operador ternário | `classifyHeroTernary` |
| array + `find` | `classifyHeroArray` |
| laço `for` | `classifyHeroLoop` |
| recursão | `classifyHeroRecursive` |

### Executando a demonstração

```bash
git clone https://github.com/leandromlmoreira/desafioRanked.git
cd desafioRanked
node desafioRanked.js
```

Saída esperada:

```
O Herói tem de saldo de 13 está no nível de Bronze
O Herói tem de saldo de 23 está no nível de Prata
O Herói tem de saldo de 55 está no nível de Ouro
O Herói tem de saldo de 83 está no nível de Diamante
O Herói tem de saldo de 140 está no nível de Imortal
```

## Stack

- **JavaScript** (Node.js), sem dependências externas
- Testes com o test runner nativo do Node (`node:test` + `node:assert/strict`)

## Testes

```bash
npm test
```

Executa `node --test`, validando as bordas de todas as faixas de patente e o cálculo de saldo nas 5 implementações (10 testes no total).

## Licença

Este projeto está sob a licença MIT — veja [LICENSE](./LICENSE).

---

Base: desafio de lógica de programação em JavaScript da trilha da [Digital Innovation One (DIO)](https://www.dio.me/).
