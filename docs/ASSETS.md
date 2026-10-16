# Assets

Os modelos de Kaelith, Rubra, Brumal, Zafir e Cinza, a nave e as texturas ficam fora do git. Vários vêm do Sketchfab com licença Standard, que permite usar em obra derivada mas não redistribuir o arquivo. Baixe cada um em **glTF**, otimize com `gltf-transform optimize <entrada> <saida> --compress meshopt --texture-compress webp --texture-size 1024` e salve com o nome abaixo.

## `public/models/`

| Arquivo | Origem | Licença |
|---|---|---|
| raven.glb | [Raven spaceship, Polenta](https://sketchfab.com/3d-models/raven-spaceship-star-conflict-v2-5edb70fdc0da4e6aa7d96f5f19f7a419) | CC BY 4.0 |
| insectoid.glb | [Insectoid Monster Rig, DM-913](https://sketchfab.com/3d-models/01323e4b2563430f9da85cd255b6e176) | CC BY 4.0 |
| lizard.glb | [flying lizard creature, V8063882](https://sketchfab.com/3d-models/55c4a578515f444d9ddc6de4150a1984) | CC BY 4.0 |
| bunny.glb | [Bunny Rat Monster, DWN](https://sketchfab.com/3d-models/a38d3a0d4d4248f298189be7106d9faa) | CC BY 4.0 |
| fly.glb | [Fly Rig, Cherry](https://sketchfab.com/3d-models/000ec112ae7f4a8a93f847ccfd4031be) | CC BY 4.0 |
| oryx.glb | [Animal: Oryx, mehdi_beigi](https://sketchfab.com/3d-models/a6de52aed4a840a28ff95c7d97f79564) | CC BY 4.0 |
| duck.glb | [Realistic Mallard Duck, 3Dima](https://sketchfab.com/3d-models/dd33cd2e30944a4aae2de1a06a828f4f) | CC BY 4.0 |
| eagle.glb | [Day 23 - Wild Eagle, Ida Faber](https://sketchfab.com/3d-models/dc4ecf9e517044b296e8ebb7505b42e7) | CC BY 4.0 |
| elephant.glb | [Elephant in the Rotunda, Abby Gancz](https://sketchfab.com/3d-models/26ee59c981964681bf9f4e5eae2a3a26) | CC BY 4.0 |
| ghoul.glb | [Goblin Ghoul, Rodrigo Bento](https://sketchfab.com/3d-models/goblin-ghoul-a6c6fffee3d34823b6d87a7054782577) | CC BY 4.0 |
| tree-night.glb, tree-night2.glb | uma árvore e um arbusto extraídos de [a forest (3) with a road at night, dasy444](https://sketchfab.com/3d-models/61f8c7817fe6457fb26e4814cfc48a3f) | CC BY 4.0 |
| tree-fir.glb, bush.glb | extraídos de [The landscape is a forest in the mountains, dasy444](https://sketchfab.com/3d-models/27b7e06431f244ef84e28bada7560c98) | Sketchfab Standard |
| pine.glb | [Fir Spruce Pine, High Quality Work](https://sketchfab.com/3d-models/7daf178b3fa64e2fa7b2c2d19cf2a4bf) | Sketchfab Standard |
| rocks.glb | [Desert rocks, WeSVa](https://sketchfab.com/3d-models/desert-rocks-fea49e7d365d4f46a0f2da1d22b68f80) | Sketchfab Standard |
| ocean.glb | [Free Ocean wave animation, the9thearl](https://sketchfab.com/3d-models/83d3a7d7fe5a4aaa8cc48ef5b242c9a8) | Sketchfab Standard |
| creature.glb, stag.glb | origem não identificada | a confirmar |

Para extrair uma árvore de uma cena grande, converta o FBX com `FBX2glTF`, deixe uma única malha, recentralize e otimize.

## `public/textures/`

| Arquivo | Origem |
|---|---|
| mars-color.webp, mars-normal.webp | [Mars, free, low-poly, the9thearl](https://sketchfab.com/3d-models/0781cd3ab59c4e6f94ae68d28fbf30a8), mapas 2K |
| ground-dirt.webp, ground-moss.webp, ground-rock.webp, ground-snow.webp | recortes quadrados de 1024 px das texturas das cenas de floresta, das rochas e da neve acima |

## Elencos de Monstrus, Digitalis e Animus

Estes vêm no repositório, em `public/models/monsters`, `creatures` e `adventurers`. Todos são CC0, sem exigência de crédito.

| Pasta | Origem |
|---|---|
| monsters/ | [Cute Animated Monsters Pack](https://quaternius.com/packs/cutemonsters.html), Quaternius |
| creatures/ | [Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html) e [Animated Mech Pack](https://quaternius.com/packs/animatedmech.html), Quaternius |
| adventurers/ | personagens e esqueletos dos packs [KayKit Adventurers](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) e [KayKit Skeletons](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0), de Kay Lousberg; animais, dinossauros, dragão, morcego, pássaro e peixes da Quaternius |

O Google Drive da Quaternius estoura a cota de download com frequência. Os mesmos modelos estão um a um no [Poly Pizza](https://poly.pizza/u/Quaternius), de onde vieram estes, e o nome repetido entre packs é desfeito pelo identificador:

| Arquivo | Origem |
|---|---|
| creatures/mushnub.glb | [poly.pizza/m/LWKmS30Xxl](https://poly.pizza/m/LWKmS30Xxl) |
| creatures/mushnub-evolved.glb | [poly.pizza/m/0SZyA6MV51](https://poly.pizza/m/0SZyA6MV51) |
| creatures/green-blob.glb | [poly.pizza/m/y4kJh8EeYS](https://poly.pizza/m/y4kJh8EeYS) |
| creatures/spiky-blob.glb | [poly.pizza/m/IoWG5F9WUc](https://poly.pizza/m/IoWG5F9WUc) |
| creatures/cactoro.glb | [poly.pizza/m/66CYX5UhRK](https://poly.pizza/m/66CYX5UhRK) |
| creatures/birb.glb | [poly.pizza/m/gZ2ExU9OAB](https://poly.pizza/m/gZ2ExU9OAB) |
| creatures/bunny.glb | [poly.pizza/m/irZjWFARyl](https://poly.pizza/m/irZjWFARyl) |
| creatures/frog.glb | [poly.pizza/m/37wofOCOzG](https://poly.pizza/m/37wofOCOzG) |
| creatures/dino.glb | [poly.pizza/m/wuerCFCWNR](https://poly.pizza/m/wuerCFCWNR) |
| creatures/alpaking.glb | [poly.pizza/m/AQ8zbFoDln](https://poly.pizza/m/AQ8zbFoDln) |
| creatures/alpaking-evolved.glb | [poly.pizza/m/UdJudob66v](https://poly.pizza/m/UdJudob66v) |
| creatures/goleling.glb | [poly.pizza/m/71gomWolax](https://poly.pizza/m/71gomWolax) |
| creatures/goleling-evolved.glb | [poly.pizza/m/iHEuXiH6Aj](https://poly.pizza/m/iHEuXiH6Aj) |
| creatures/armabee.glb | [poly.pizza/m/42djT5zJnx](https://poly.pizza/m/42djT5zJnx) |
| creatures/armabee-evolved.glb | [poly.pizza/m/GcttdvsqsQ](https://poly.pizza/m/GcttdvsqsQ) |
| creatures/hywirl.glb | [poly.pizza/m/zjr7CmWGER](https://poly.pizza/m/zjr7CmWGER) |
| creatures/glub.glb | [poly.pizza/m/x59pqJscry](https://poly.pizza/m/x59pqJscry) |
| creatures/glub-evolved.glb | [poly.pizza/m/Z9lddNpM1M](https://poly.pizza/m/Z9lddNpM1M) |
| creatures/squidle.glb | [poly.pizza/m/54QyRcsogk](https://poly.pizza/m/54QyRcsogk) |
| creatures/blue-demon.glb | [poly.pizza/m/S7jYW6Amye](https://poly.pizza/m/S7jYW6Amye) |
| creatures/mech-bee.glb | [poly.pizza/m/4UvIHxnoSR](https://poly.pizza/m/4UvIHxnoSR) |
| creatures/mech-panda.glb | [poly.pizza/m/D5wW2jDO42](https://poly.pizza/m/D5wW2jDO42) |
| creatures/mech-frog.glb | [poly.pizza/m/o3Ps8z8ByP](https://poly.pizza/m/o3Ps8z8ByP) |
| creatures/mech-flamingo.glb | [poly.pizza/m/tLs9mFVCSU](https://poly.pizza/m/tLs9mFVCSU) |
| creatures/dragon-evolved.glb | [poly.pizza/m/LlwD0QNUPj](https://poly.pizza/m/LlwD0QNUPj) |
| creatures/drone.glb | [poly.pizza/m/lF3jeRJwiH](https://poly.pizza/m/lF3jeRJwiH) |
| adventurers/horse.glb | [poly.pizza/m/qvTrSG9pZF](https://poly.pizza/m/qvTrSG9pZF) |
| adventurers/cow.glb | [poly.pizza/m/26zM1outCr](https://poly.pizza/m/26zM1outCr) |
| adventurers/alpaca.glb | [poly.pizza/m/bCVFD48i2l](https://poly.pizza/m/bCVFD48i2l) |
| adventurers/deer.glb | [poly.pizza/m/T6Cs7tmMHJ](https://poly.pizza/m/T6Cs7tmMHJ) |
| adventurers/stag.glb | [poly.pizza/m/tQdzbZ1Cmw](https://poly.pizza/m/tQdzbZ1Cmw) |
| adventurers/wolf.glb | [poly.pizza/m/P1gU3Qkr9r](https://poly.pizza/m/P1gU3Qkr9r) |
| adventurers/triceratops.glb | [poly.pizza/m/IGvrUqGrRM](https://poly.pizza/m/IGvrUqGrRM) |
| adventurers/stegosaurus.glb | [poly.pizza/m/eFcNbOlpvl](https://poly.pizza/m/eFcNbOlpvl) |
| adventurers/parasaurolophus.glb | [poly.pizza/m/KeeQrrouRK](https://poly.pizza/m/KeeQrrouRK) |
| adventurers/apatosaurus.glb | [poly.pizza/m/fvo0x8Zk3z](https://poly.pizza/m/fvo0x8Zk3z) |
| adventurers/t-rex.glb | [poly.pizza/m/UYtneO5FpF](https://poly.pizza/m/UYtneO5FpF) |
| adventurers/velociraptor.glb | [poly.pizza/m/cnlGH2UcDd](https://poly.pizza/m/cnlGH2UcDd) |
| adventurers/dragon.glb | [poly.pizza/m/VBvzjFIYws](https://poly.pizza/m/VBvzjFIYws) |
| adventurers/bat.glb | [poly.pizza/m/hNO9XvjlKa](https://poly.pizza/m/hNO9XvjlKa) |
| adventurers/bird.glb | [poly.pizza/m/gYYC0gYMnw](https://poly.pizza/m/gYYC0gYMnw) |
| adventurers/koi.glb | [poly.pizza/m/qyGtRmhgzl](https://poly.pizza/m/qyGtRmhgzl) |
| adventurers/swordfish.glb | [poly.pizza/m/7hMOlBjln0](https://poly.pizza/m/7hMOlBjln0) |

Para converter um modelo novo, mantenha só os clipes que o elenco usa e otimize:

```sh
node scripts/keep-clips.ts entrada.glb limpo.glb Idle,Walk,Run
npx gltf-transform optimize limpo.glb public/models/<pasta>/<nome>.glb --compress meshopt --texture-compress auto --texture-size 1024
```

O primeiro comando tira o prefixo da armadura dos nomes e descarta o clipe duplicado. `auto` mantém a textura no formato original. Depois, acrescente a entrada em `src/roster.ts`. Os testes conferem que o arquivo existe e que os clipes pedidos estão nele.

## Sem os arquivos

O jogo não abre sem eles. Os candidatos para substituir os modelos estáticos por versões animadas estão na conversa de desenvolvimento: elefante e Frost Predator aprovados, águia, pterodáctilo, antílope e alce em avaliação.
