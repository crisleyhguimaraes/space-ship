# Mundo de Kaelith: fauna e ambiente

Desenho do que vive e do que acontece na superfície. Cada item diz o que é, como é feito dentro das restrições (60 FPS em GPU integrada, carga pequena) e em que rodada entra. Regra de desempate continua: fluidez > beleza > quantidade.

## Fauna

### Princípios

- Até 80 animais ao mesmo tempo. Bandos instanciados custam quase nada; cada animal com esqueleto animado custa um clone, por isso são poucos.
- Todo bicho tem uma rotina visível sem a nave por perto. O mundo não espera o jogador.
- Reação à nave em três níveis: ignora (alto), foge (baixo e perto), ataca (predador, baixo e perto).
- Monstros grandes são raros e vivem longe do ponto de pouso. Encontrar um é um evento.

### Espécies

| Espécie | Modelo | Animação no arquivo | Quantidade | Grupo | Locomoção | Rotina | Reação à nave | Caça | É caçado por |
|---|---|---|---|---|---|---|---|---|---|
| Criatura rosa | creature | nenhuma, balanço procedural | 15 | 3 bandos de 5 | anda | pasta perto da origem, vagueia | debanda em leque a 110, volta em 4 s | — | inseto, goblins |
| Coelho-rato | bunny | só "TakeDamage", ignorada | 12 | 2 bandos de 6 | anda, rápido | pasta, vagueia | debanda | — | goblins, lagarto, águia (mergulho) |
| Órix | oryx | nenhuma | 12 | 2 bandos de 6 | anda | pasta | debanda | — | inseto |
| Cervo | stag | idle, run, hornAttack, getHit, death | 4 | 1 bando | anda, corre com animação real | pasta em repouso, corre ao fugir | debanda | — | inseto; chifra goblins (v2) |
| Elefante | elephant | nenhuma | 2 | 1 par | anda devagar | pasta | afasta-se devagar | — | ninguém, predadores desviam |
| Águia | eagle | nenhuma | 3 | 1 grupo | voa alto, círculos largos | plana a 70 | sobe a 110 e afasta a órbita | mergulho visual sobre coelhos (v2) | — |
| Pato | duck | nenhuma | 8 | 1 grupo | nada, voa | círculos na água | levanta voo a 28, pousa depois | — | lagarto (v2) |
| Mosca | fly | nenhuma | 30 | 3 enxames | voa baixo | orbita a beira do lago | — | — | — |
| Inseto gigante | insectoid | Prowl (caminhada) | 1 | solitário | anda | ronda a toca | caça se a nave estiver abaixo de 70 | criaturas, órix, cervos | — |
| Lagarto voador | lizard | nenhuma, planeio procedural | 1 | solitário | voa | ronda a toca a 40 de altura | caça em qualquer altitude | coelhos, criaturas | — |
| Goblin ghoul | ghoul | Idle, Walk, Attack Combo, Death | 3 | 1 matilha | anda | ronda a toca em grupo | caça se a nave estiver baixa | coelhos, criaturas | cervo (chifrada, v2) |

Recusados e por quê: javali (extraído de jogo comercial), robin (CC-BY-SA), orc pintado (CC-BY-NC-ND), orc Tilt Brush (285 mil triângulos de pinceladas), goblin sem licença (130 mil triângulos).

### Cadeia alimentar

- Predador escolhe alvo nesta ordem: a nave, se estiver no alcance e alcançável; senão o animal vivo mais próximo dentro de 260 que esteja na lista de presas da espécie.
- Perseguição igual à da nave. Ao alcançar a presa, abate: a presa some, o predador fica parado comendo por 8 s, depois volta à toca.
- A presa reaparece na origem do seu bando 45 s depois. As quantidades da tabela são o teto, nunca aumentam.
- Bandos fogem de predador em caça do mesmo jeito que fogem da nave.
- Elefantes nunca são alvo. Aves e moscas não são alvo nesta rodada.

### Encontros do jogador

- Sobrevoo alto: nada reage. Bom para observar bandos e predadores de longe.
- Descida baixo perto de um bando: debandada em leque. É o momento de foto.
- Perto de predador em caça: alerta pulsante com a distância, câmera treme a cada golpe, casco cai 20%. Casco em zero vira decolagem de emergência.
- Matilha de goblins: três alvos ao mesmo tempo, mais perigosa que o inseto, mais fraca individualmente.
- Rótulo da espécie no HUD quando a nave passa a menos de 60 de um animal. Base para o futuro objetivo de "escanear três formas de vida".

## Sistema estelar

Catálogo em `system.ts`, visual em `space.ts`. Todos os corpos orbitam de verdade, devagar; a nave volta da superfície para o mesmo ponto relativo ao planeta.

| Corpo | Órbita | Raio | Visual | Visitável |
|---|---|---|---|---|
| Sol | centro | 200 | superfície em ruído animado, coroa, luz do sistema | não |
| Cinza | 700 | 30 | rocha escura com fendas de lava brilhando | sim, mundo de cinzas e lava |
| Rubra | 1500 | 45 | textura de Marte, atmosfera fina laranja | sim, deserto vermelho |
| Kaelith | 2500 | 60 | verde-azul com nuvens, lua Vela | sim, mundo misto |
| Zafir | 3600 | 55 | oceano azul com nuvens densas | sim, ilhas no oceano |
| Brumal | 4800 | 40 | gelo branco-azul | sim, mundo de neve |
| Cinturão | 5400 a 5900 | — | 2500 asteroides instanciados girando | — |
| Vorn | 6500 | 150 | gigante gasoso em faixas, anéis largos, luas Ilo e Teu | não |
| Ocre | 8000 | 38 | deserto ocre | não |
| Lilás | 9500 | 110 | gigante roxo em faixas, anel fino | não |
| Ferrugem | 11000 | 35 | rocha ferrugem | não |
| Noite | 12000 | 48 | gelo escuro | não |
| Cometas | 3 elipses | — | núcleo brilhante, cauda de pontos apontando para longe do Sol | — |
| Buraco negro | fixo, a 25 mil | 300 | esfera negra, disco de acreção em espiral, halo | não |

Navegação: Tab troca o alvo, o colchete na tela mostra nome e distância, e gruda na borda quando o alvo está fora do quadro.

## Mundos visitáveis

Perfis em `worlds.ts`. O mesmo acervo é combinado de formas diferentes.

| Mundo | Relevo e água | Chão e céu | Flora | Fauna |
|---|---|---|---|---|
| Kaelith | oceano ao norte, lago, vulcão, deserto a oeste, floresta a leste | musgo, terra, neve nos picos; entardecer roxo | tudo | todos os bandos, águias, patos, inseto, lagarto, goblins |
| Rubra | dunas aplainadas, vulcão, sem água | areia avermelhada; céu rosa empoeirado ao meio-dia | rochas, arbustos ralos | órix, coelhos, águias, inseto, lagarto |
| Brumal | campos nevados, mar gelado ao norte, bosques em manchas | neve a partir de 18 de altura; céu azul pálido de manhã | abetos, pinheiros, rochas | cervos, coelhos, elefantes, águias, goblins |
| Zafir | oceano com ilhas, vulcão numa ilha | verde úmido; céu azul claro | selva noturna, moitas, arbustos | criaturas, coelhos, patos, águias, lagarto |
| Cinza | planície de cinzas, vulcão | cinza escuro; céu vermelho-escuro ao anoitecer | só rochas | inseto e goblins, nada para eles caçarem além da nave |

`?em=rubra` nasce ao lado de Rubra. As superfícies carregam em segundo plano quando a nave chega a 12 raios do planeta.

## Ambiente

### Ciclo de dia e noite

- Um dia dura 6 minutos reais. Começa no entardecer, que é o visual atual.
- O sol percorre um arco; a luz direcional e a hemisférica, o gradiente do céu e a cor da neblina interpolam entre quatro momentos: amanhecer laranja, dia azul-claro, entardecer roxo, noite azul-escura com estrelas.
- À noite a bioluminescência aparece: criaturas e lago brilham mais, o vulcão tinge o céu.

### Nuvens

- Camada de 60 quadrados instanciados a 170 de altitude, textura suave gerada em canvas, deriva com o vento. Opacidade sobe com a nebulosidade do clima. Sem sombras no chão: custo alto, ganho pequeno vista do alto.

### Clima: chuva, tempestade, raios

- Máquina de estados: limpo (2 a 4 min) → nublando (30 s) → chuva (1,5 a 2,5 min) → tempestade (1 min) → clareando (30 s) → limpo.
- Chuva: 3000 gotas em uma caixa que acompanha a câmera, caem a 60 por segundo. Neblina fecha, céu acinzenta, sol enfraquece.
- Tempestade: raios como clarão global de 0,1 s a cada 4 a 12 s. Som fica para quando o áudio entrar.
- Nada de poças, respingos ou molhado no chão nesta rodada.

### Vulcão

- Um cone adicionado ao heightmap no canto oposto ao pouso, 220 de raio, 170 de altura, cratera de 40.
- Cratera com disco de lava: shader emissivo com ruído pulsante, bloom faz brilhar. Luz pontual laranja pulsante ilumina a fumaça e o flanco à noite.
- Fumaça: 400 partículas sobem da cratera, crescem, derivam com o vento e somem.
- Magma escorrendo pelo flanco, tremor perto da cratera e dano ao casco dentro dela ficam para a próxima rodada.

### Ordem de implementação

| Rodada | Entra |
|---|---|
| Feito em 16/10/2026 | predação entre espécies, bandos fugindo de predadores, rótulo de espécie no HUD, biomas (oceano, deserto, floresta, campo), mar, ciclo dia e noite, nuvens, chuva com raios, vulcão com lava e fumaça, dano ao casco dentro da cratera, mergulho periódico das águias, áudio sintetizado com trovão, superfície carregando em segundo plano |
| Depois | chifrada do cervo nos goblins, lagarto caçando patos, magma escorrendo no flanco |
