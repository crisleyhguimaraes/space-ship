import { defineConfig } from 'vite'

// base './' gera caminhos relativos no dist/ (./assets/..., ./models/...),
// assim o jogo funciona na raiz do domínio ou em subpastas (ex.: /jogo/).
export default defineConfig({
  base: './',
})
