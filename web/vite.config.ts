import { defineConfig } from 'vite'

export default defineConfig({
  base: '/desafioRanked/',
  build: {
    commonjsOptions: {
      include: [/desafioRanked\.js$/, /node_modules/]
    }
  }
})
