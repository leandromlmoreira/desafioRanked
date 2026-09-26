import { defineConfig, type Plugin } from 'vite'

function commonJsLogicInDev(): Plugin {
  return {
    name: 'desafio-ranked-commonjs-dev',
    apply: 'serve',
    transform(code, id) {
      if (!id.endsWith('desafioRanked.js')) return null
      return `${code}\nexport { classifyHeroSwitch }\n`
    }
  }
}

export default defineConfig({
  base: '/ranktier/',
  plugins: [commonJsLogicInDev()],
  build: {
    commonjsOptions: {
      include: [/desafioRanked\.js$/, /node_modules/]
    }
  }
})
