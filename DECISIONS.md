# Decisões do V1

Regra de desempate: fluidez > beleza > quantidade. Menos coisas, mais bonitas, a 60 FPS.

## Escopo

- 1 sistema estelar: Sol, 10 planetas, 2 luas, cinturão de asteroides, 3 cometas, 1 buraco negro distante.
- 5 planetas pousáveis com perfis distintos (`worlds.ts`), 5 de passagem, 3 luas, cinturão de asteroides, 3 cometas, buraco negro. Catálogo e órbitas em `system.ts`, visual em `space.ts`. Cada superfície carrega sob demanda a 12 raios do planeta e fica em cache.
- Desktop, teclado e mouse. Celular mostra aviso com imagem estática.
- Idioma da interface: pt-BR.

## Stack

- Three.js vanilla, Vite, TypeScript, npm, Node 24 LTS.
- Pós-processamento: pacote `postprocessing` (pmndrs). Bloom, vignette, tone mapping ACES, multisampling 4x.
- Sem biblioteca de física. Voo arcade inercial: velocidade, amortecimento, quaternion.
- Testes: `node --test` nativo em `src/*.test.ts`. Sem framework. Um teste por lógica real (voo, boids, altitude, tier de qualidade).
- Assets: `gltf-transform` na CLI. Geometria meshopt (decoder em JS, sem wasm extra), texturas WebP em 1024 px. KTX2 só se a memória de GPU apertar nos planetas-herói. Processados ficam no repo em `public/assets`. Fontes (.blend, .psd) ficam fora do repo.

## Orçamentos

| Item | Teto |
|---|---|
| Bundle inicial (JS + skybox + nave) | 5 MB |
| Nave | 1 MB |
| Planeta herói (textura + nuvens) | 2 MB |
| Cena de superfície (terreno + vegetação + criaturas) | 4 MB |
| Skybox KTX2 2048 | 4 MB |
| TTI primeira carga | 4 s |
| FPS | meta 60 em M-series, piso 30 em GPU integrada antiga |

## Mundo e escala

- Unidades arbitrárias. Raio de planeta 20 a 80, Sol 200, órbitas de 600 a 12000. Câmera near 0.5, far 50000, sem logarithmic depth.
- Tempo de viagem entre planetas vizinhos com boost: 15 s. Isso fixa a velocidade máxima.
- Planetas orbitam devagar (deriva visível) e giram no próprio eixo.
- Planetas em um só ShaderMaterial procedural com paleta, nuvens, faixas para gigantes gasosos e brilho de lava; Rubra usa textura. Anéis em RingGeometry com faixas de ruído iluminadas pelo Sol. Sol com superfície em ruído e coroa em sprite.
- Atmosfera: casca de fresnel aditiva, BackSide. Sem scattering.
- Luz: uma PointLight no Sol. Sem shadow map. Sol é esfera emissiva + bloom + sprite de corona.
- Fundo: cubemap gerado no Spacescape com nebulosa, exportado em KTX2. Mais 4000 estrelas próximas em Points para parallax.
- Buraco negro: quad com shader que amostra o cubemap com direção curvada (lente). Barato e vistoso.
- Asteroides: InstancedMesh de 1 rocha low-poly × 3000, entre a 3ª e 4ª órbita.
- Cometas: 3, órbita elíptica, cauda em Points.

## Planeta pousável

- Bioma: selva alienígena ao entardecer com bioluminescência. Contrasta com o vácuo, reaproveita o bloom, neblina esconde a borda do tile de forma natural.
- Assets do Sketchfab escolhidos pelo usuário: nave Raven (CC-BY), criatura (licença a confirmar), pinheiro, rochas e texturas de Marte (Sketchfab Standard, zona cinzenta para redistribuição em site). Créditos na tecla C. Risco aceito pelo usuário em 15/10/2026.
- Terreno: PlaneGeometry 2000×2000 com 256 segmentos, heightmap 257 px deslocado na CPU. Material padrão com quatro texturas (terra, musgo, rocha, neve) misturadas por altura e inclinação via `onBeforeCompile`, cada uma amostrada em duas escalas para esconder repetição. Texturas recortadas dos assets do usuário.
- Nave: o modelo Raven aponta para +Z no arquivo e é girado 180° ao carregar. Propulsão só nos dois motores traseiros. Nas curvas o casco inclina (banking) e a câmera atrasa a rotação, para a nave parecer virar em vez do mundo.
- Vegetação: InstancedMesh, tabela `FLORA` em `surface.ts`. Pinheiros, árvores e arbustos extraídos de cenas do Sketchfab (uma malha por tipo, re-centrada, texturas em 1024 WebP), mais blocos de rocha. Malhas de vários materiais são fundidas por material em `instancing.ts`; folhagem com blend vira alpha test.
- Fauna (`wildlife.ts`): bandos em `herd.ts` (3 de criaturas, 2 de coelhos-rato, 2 de órix, 1 de cervos com animação própria de corrida e repouso via clones do esqueleto, 1 par de elefantes); aves em `flock.ts` (3 águias planando alto, 8 patos no lago) que sobem e se afastam quando a nave chega e voltam a pousar. Modelos recusados: javali extraído de jogo comercial (não é do autor para licenciar) e pássaro CC-BY-SA. Bandos: pastam perto da âncora, debandam em leque quando a nave chega a 110 unidades abaixo de 120 de altitude, trotam de volta depois de 4 s. Caminhada é balanço procedural. Três enxames de moscas orbitam a beira do lago.
- Predadores (`predator.ts`, tabela `PREDATOR_SPECIES`): um inseto gigante no chão, animado pelo esqueleto do modelo, um lagarto voador, e uma matilha de 3 goblins ghoul animados que dividem a mesma toca. Recusados: orc pintado à mão (CC-BY-NC-ND, sem derivados), orc em Tilt Brush (285 mil triângulos de pinceladas) e goblin sem licença identificada com 130 mil triângulos. Nascem a mais de 450 unidades do ponto de pouso. Detectam a nave a 260 unidades (o inseto só se ela estiver abaixo de 70 de altitude), perseguem, desistem a 380 e voltam à toca. Golpe a cada 1,5 s dentro de 14 unidades: tira 20% do casco, treme a câmera e pisca vermelho. HUD mostra alerta pulsante com a distância. Casco em 0% dispara decolagem de emergência; em órbita o casco volta a 100%. Sem tela de morte.
- Biomas (`biomes.ts`): oceano ao norte, deserto a oeste, floresta a leste, campo no centro, fronteiras onduladas por ruído. O relevo é moldado depois do ruído: oceano afunda abaixo do nível do mar (6), deserto aplaina, vulcão de 170 de altura ergue no canto oeste. Flora e fauna usam pesos por bioma; o chão mistura areia, musgo mais escuro na floresta e cinza no vulcão.
- Mar: um plano no nível 6 cobrindo o mapa inteiro, com a textura da onda rolando e ondulação no vértice. Aparece onde o relevo afunda.
- Lago: malha de onda animada por esqueleto (Sketchfab), posicionada na bacia mais baixa em terra firme por `lowestBasin`, 260 unidades de lado. Nave e criaturas não entram na água; flora não nasce nela.
- Vulcão (`volcano.ts`): disco de lava com ruído pulsante e bloom, luz pontual laranja, 400 partículas de fumaça que sobem com o vento. Pairar dentro da cratera abaixo de 40 de altitude queima 12% do casco por segundo.
- Atmosfera (`atmosphere.ts`): dia de 6 minutos (`daylight.ts`, quatro momentos interpolados: noite, amanhecer, dia, entardecer) movendo sol, luz hemisférica, céu, neblina e estrelas. Clima (`weather.ts`): limpo → nublando → chuva → tempestade com raios → clareando. Nuvens são 60 quadrados instanciados a 170 de altura; chuva são 3000 pontos numa caixa que segue a câmera. `?hora=0.5` abre ao meio-dia.
- Neblina: começa em 600 unidades. Teto de altitude 150.
- Só voa. Não anda.

## Transição

- Duas `THREE.Scene` no mesmo renderer.
- Dentro de 1.5 raio do planeta pousável, HUD mostra "E para descer". Ao apertar, ou automaticamente a 14 unidades da superfície: controles travam, 2,5 s de transição (câmera fecha o FOV de 60 para 34, bloom sobe, calor nas bordas, clarão, desfoque radial que some enquanto a nova cena aparece), troca de cena no pico, câmera reposicionada a 110 de altitude.
- A superfície (modelos, texturas, relevo, fauna) começa a carregar logo após o primeiro frame do espaço, em segundo plano. Perto do planeta antes de pronta, o HUD mostra "preparando a descida" e o pouso espera.
- Decolar: subir acima do teto de altitude inverte a transição e devolve ao mesmo ponto na órbita.
- Colisão com planeta no espaço: empurrão suave para fora. Na superfície: nave fica acima de `altura(x,z) + 2`, lida do heightmap na CPU. Sem morte, sem explosão.

## Controles

| Tecla | Ação |
|---|---|
| Clique | trava o mouse (pointer lock) |
| Mouse | olhar / direção |
| W / S | acelera / freia |
| A / D | rolagem |
| Shift | boost |
| E | descer / pousar |
| M | mudo |
| C | créditos |
| Esc | solta o mouse |

- Câmera em terceira pessoa com atraso suave. A nave aparece sempre.

## Loop e primeiros segundos

- Sem menu. Sem tutorial. O jogador nasce em movimento, apontado para o planeta terrestre herói, com 3 linhas de controle que somem em 6 s ou no primeiro input.
- Tela de carregamento: preto com estrelas surgindo. Máximo 3 s.
- HUD em HTML sobre o canvas: velocidade, corpo mais próximo e distância, dica contextual. Fonte Space Grotesk, woff2 subset, self-hosted.
- Sem objetivo ou coleta no V1.

## Áudio

- Sintetizado em Web Audio (`audio.ts`), zero arquivo. Drone ambiente com LFO, motor (dente de serra + sub senoidal por passa-baixa) com tom e volume pela propulsão, ruído de reentrada que acompanha a transição, trovão no raio.
- Começa no primeiro clique ou tecla. Tecla M alterna mudo, com selo "mudo" no HUD.

## Qualidade adaptativa

- Mede FPS nos primeiros 5 s. Abaixo de 50: pixelRatio 0.75, bloom em meia resolução, boids em 100. Sem controle manual no V1.
- WebGL2 obrigatório. Sem WebGL2: mensagem e imagem estática.
- Navegadores: Chrome, Edge, Firefox, Safari 16+.

## Medição

- Umami Cloud, plano Hobby gratuito. Três eventos: `session_start`, `approach_start`, `landing_done`.
- Sem isso a métrica de sucesso não existe. Entra no primeiro deploy.

## Entrega

- Hostinger, hospedagem compartilhada (LiteSpeed). `vite build` e envio de `dist/` para `public_html` via Git deploy do hPanel ou SFTP.
- `.htaccess` obrigatório em `public/` para o build carregar:
  - MIME: `.glb` como `model/gltf-binary`, `.ktx2` como `image/ktx2`, `.wasm` como `application/wasm`.
  - `Cache-Control: max-age=31536000, immutable` para `/assets/*` com hash.
  - Compressão Brotli/gzip para js, css, wasm.
- HTTPS do próprio Hostinger.
- Página de créditos listando fontes dos assets, mesmo CC0.

## Teste em hardware fraco

- Máquina de desenvolvimento (MacBook Air M5) é muito acima do alvo. Antes de cada marco: pixelRatio forçado em 2 em tela cheia, sessão de 10 min com throttling térmico, e Safari local.
- Uma rodada em notebook Intel emprestado ou BrowserStack antes do lançamento.

## Fora do V1

- Andar na superfície, objetivos, coleta, save, gamepad, toque, scattering atmosférico, sombras, WebGPU, mais de um planeta pousável, inglês.

## Mundos temáticos (16/10/2026)

- Três planetas visitáveis de franquias de terceiros (Pokémon, Digimon, animes). O repositório entrega estrutura, biomas, vilas e elenco descrito em dados; **não entrega nem busca modelos desses personagens**, porque os disponíveis em sites de modelos costumam ser extraídos de jogos. O usuário fornece os arquivos.
- Elenco em `roster.ts`: papel, grupo, tamanho, habitat e presas por entrada. O jogo carrega só o elenco do mundo em que o jogador pousa e ignora modelo ausente (aviso no console).
- Bioma novo de gelo (peso no canal alfa do mapa de biomas) e layouts `verdant` e `anime`. Vilas procedurais em terreno plano de campo, com flora e fauna afastadas delas.

## Sistema de emergência de navegação (16/10/2026)

- Planetas pousáveis puxam a nave a até 5 raios (teto de 22 u/s, abaixo do motor). Decolar é um estilingue de 150 u/s com decaimento, e a gravidade volta aos poucos durante a trava de 12 s.
- Qualquer corpo não pousável (planetas, luas, Sol, buraco negro) e o cinturão de asteroides disparam o aviso a pouco mais de um raio de segurança e o desvio automático a 70 ou 0,7 raio da superfície.
- O desvio é um arco: o rumo do piloto vira o destino, a nave contorna o corpo deslizando por uma casca fina e volta à linha original num ponto logo depois dele, realinhando com o rumo. Qualquer comando do piloto cancela o desvio. Medido: desvio máximo de 67 e retorno a 1 unidade da linha.
- Alarme: borda vermelha pulsando e bip, ambos mais rápidos quanto mais perto. O rótulo no topo diz o que gera o alerta e muda para "desvio automático" quando o sistema assume.
