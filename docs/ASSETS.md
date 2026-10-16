# Assets

Os modelos e texturas não estão no repositório. Vários vêm do Sketchfab com licença Standard, que permite usar em obra derivada mas não redistribuir o arquivo. Baixe cada um em **glTF**, otimize com `gltf-transform optimize <entrada> <saida> --compress meshopt --texture-compress webp --texture-size 1024` e salve com o nome abaixo.

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

## Sem os arquivos

O jogo não abre sem eles. Os candidatos para substituir os modelos estáticos por versões animadas estão na conversa de desenvolvimento: elefante e Frost Predator aprovados, águia, pterodáctilo, antílope e alce em avaliação.
