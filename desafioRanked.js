function classifyHeroSwitch(wins, losses) {
    const balance = wins - losses
    let level
    switch (true) {
        case wins < 10:
            level = 'Ferro'
            break
        case wins <= 20:
            level = 'Bronze'
            break
        case wins <= 50:
            level = 'Prata'
            break
        case wins <= 80:
            level = 'Ouro'
            break
        case wins <= 90:
            level = 'Diamante'
            break
        case wins <= 100:
            level = 'Lendário'
            break
        default:
            level = 'Imortal'
    }
    return { balance, level }
}

function classifyHeroTernary(wins, losses) {
    const balance = wins - losses
    const level = wins < 10 ? 'Ferro'
        : wins <= 20 ? 'Bronze'
        : wins <= 50 ? 'Prata'
        : wins <= 80 ? 'Ouro'
        : wins <= 90 ? 'Diamante'
        : wins <= 100 ? 'Lendário'
        : 'Imortal'
    return { balance, level }
}

const heroLevels = [
    { max: 9, name: 'Ferro' },
    { max: 20, name: 'Bronze' },
    { max: 50, name: 'Prata' },
    { max: 80, name: 'Ouro' },
    { max: 90, name: 'Diamante' },
    { max: 100, name: 'Lendário' },
    { max: Infinity, name: 'Imortal' }
]

function classifyHeroArray(wins, losses) {
    const balance = wins - losses
    const level = heroLevels.find(l => wins <= l.max).name
    return { balance, level }
}

function classifyHeroLoop(wins, losses) {
    const balance = wins - losses
    const levels = [
        { limit: 10, name: 'Ferro' },
        { limit: 21, name: 'Bronze' },
        { limit: 51, name: 'Prata' },
        { limit: 81, name: 'Ouro' },
        { limit: 91, name: 'Diamante' },
        { limit: 101, name: 'Lendário' },
        { limit: Infinity, name: 'Imortal' }
    ]
    let level = 'Imortal'
    for (let i = 0; i < levels.length; i++) {
        if (wins < levels[i].limit) {
            level = levels[i].name
            break
        }
    }
    return { balance, level }
}

function classifyHeroRecursive(wins, losses, levels = [
    { max: 9, name: 'Ferro' },
    { max: 20, name: 'Bronze' },
    { max: 50, name: 'Prata' },
    { max: 80, name: 'Ouro' },
    { max: 90, name: 'Diamante' },
    { max: 100, name: 'Lendário' },
    { max: Infinity, name: 'Imortal' }
]) {
    const balance = wins - losses
    function findLevel(index) {
        if (wins <= levels[index].max) return levels[index].name
        return findLevel(index + 1)
    }
    const level = findLevel(0)
    return { balance, level }
}

function showResult(result) {
    console.log(`O Herói tem de saldo de ${result.balance} está no nível de ${result.level}`)
}

showResult(classifyHeroSwitch(18, 5))
showResult(classifyHeroTernary(30, 7))
showResult(classifyHeroArray(70, 15))
showResult(classifyHeroLoop(85, 2))
showResult(classifyHeroRecursive(150, 10)) 
if (typeof module !== "undefined") {
    module.exports = {
        classifyHeroSwitch,
        classifyHeroTernary,
        classifyHeroArray,
        classifyHeroLoop,
        classifyHeroRecursive
    }
}
