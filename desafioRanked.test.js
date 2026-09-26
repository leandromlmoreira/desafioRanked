const { test } = require("node:test")
const assert = require("node:assert/strict")
const {
    classifyHeroSwitch,
    classifyHeroTernary,
    classifyHeroArray,
    classifyHeroLoop,
    classifyHeroRecursive
} = require("./desafioRanked")

const implementacoes = {
    classifyHeroSwitch,
    classifyHeroTernary,
    classifyHeroArray,
    classifyHeroLoop,
    classifyHeroRecursive
}

const casos = [
    [0, "Ferro"],
    [9, "Ferro"],
    [10, "Bronze"],
    [20, "Bronze"],
    [21, "Prata"],
    [50, "Prata"],
    [51, "Ouro"],
    [80, "Ouro"],
    [81, "Diamante"],
    [90, "Diamante"],
    [91, "Lendário"],
    [100, "Lendário"],
    [101, "Imortal"],
    [500, "Imortal"]
]

for (const [nome, classificar] of Object.entries(implementacoes)) {
    test(`${nome} retorna o nível certo nas bordas de cada faixa`, () => {
        for (const [vitorias, esperado] of casos) {
            assert.equal(classificar(vitorias, 0).level, esperado, `vitórias = ${vitorias}`)
        }
    })

    test(`${nome} calcula o saldo como vitórias - derrotas`, () => {
        assert.equal(classificar(18, 5).balance, 13)
        assert.equal(classificar(3, 10).balance, -7)
    })
}
