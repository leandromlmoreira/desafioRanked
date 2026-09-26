# 🎯 Desafio Calculadora de Partidas Rankeadas

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![DIO](https://img.shields.io/badge/DIO-000000?style=for-the-badge&logo=dio&logoColor=white)](https://www.dio.me/)

## 📋 Descrição

Projeto desenvolvido como parte do desafio da **DIO** que implementa uma calculadora de partidas ranqueadas. O sistema classifica o nível do herói conforme a quantidade de vitórias, demonstrando lógica de programação com variáveis, operadores, laços, decisões e funções.

## 🎮 Funcionalidades

- ✅ **Classificação de Níveis**: Sistema que categoriza heróis em 7 níveis diferentes
- ✅ **Exemplos de Uso**: Demonstração de vários cenários
- ✅ **Cálculo de Saldo**: Subtração entre vitórias e derrotas

## 🏆 Níveis de Herói

| Vitórias | Nível |
|----------|-------|
| < 10     | Ferro |
| 10-20    | Bronze |
| 21-50    | Prata |
| 51-80    | Ouro |
| 81-90    | Diamante |
| 91-100   | Lendário |
| ≥ 101    | Imortal |

## 🛠️ Tecnologias Utilizadas

- **JavaScript**: Linguagem principal
- **Node.js**: Ambiente de execução
- **Conceitos**: Variáveis, Operadores, Laços, Estruturas de Decisão, Funções

## 🚀 Como Executar

```bash
# Clone o repositório
git clone https://github.com/leandromlmoreira/desafioRanked.git

# Entre no diretório
cd desafioRanked

# Execute o projeto
node desafioRanked.js
```

### Testes

```bash
npm test
```

Usa o test runner nativo do Node (`node --test`, sem dependências) e confere as bordas de todas as faixas de nível e o cálculo do saldo nas 5 implementações.

## 📊 Conceitos Demonstrados

- **Variáveis**
- **Operadores**
- **Laços de Repetição**
- **Estruturas de Decisão**
- **Funções**

## 📤 Saída

O sistema exibe a mensagem:
```
O Herói tem de saldo de {saldoVitorias} está no nível de {nivel}
```

### Exemplo de Saída:

`node desafioRanked.js` roda um exemplo com cada uma das 5 implementações da classificação:

| Implementação | Chamada |
|---|---|
| `switch (true)` | `classifyHeroSwitch(18, 5)` |
| operador ternário | `classifyHeroTernary(30, 7)` |
| array + `find` | `classifyHeroArray(70, 15)` |
| laço `for` | `classifyHeroLoop(85, 2)` |
| recursão | `classifyHeroRecursive(150, 10)` |

```
O Herói tem de saldo de 13 está no nível de Bronze
O Herói tem de saldo de 23 está no nível de Prata
O Herói tem de saldo de 55 está no nível de Ouro
O Herói tem de saldo de 83 está no nível de Diamante
O Herói tem de saldo de 140 está no nível de Imortal
```

## 🔗 DIO

Projeto desenvolvido como parte do curso de **JavaScript** na [Digital Innovation One (DIO)](https://www.dio.me/).

---

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

**Tags**: `javascript` `dio` `desafio` `programacao` `logica`

