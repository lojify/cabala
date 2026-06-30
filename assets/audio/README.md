# Assets de Áudio — KAOS//STUDIO

Esta pasta é o ponto de entrada para os áudios reais do template. Para manter o
pacote leve para demonstração, o `script.js` já funciona sem nenhum arquivo
aqui: ele gera os sons (drone ambiente + blips de glitch + clique artístico)
em tempo real via Web Audio API, então você pode testar o template imediatamente.

Quando for usar em produção, basta:

1. Colocar os arquivos comprimidos (MP3 + fallback OGG/WebM) nesta pasta:
   - `ambient.mp3` / `ambient.webm` — música experimental em loop (Howler `loop: true`, volume baixo, 0.15–0.25)
   - `glitch.mp3` — efeito curto de "ruído digital" disparado em transições de seção
   - `click.mp3` — clique artístico/percussivo disparado em hover de botões e cards

2. No `script.js`, dentro de `initAudio()`, trocar o bloco `SYNTH_FALLBACK = true`
   por `false` e descomentar as instâncias `new Howl({ src: [...] })` já deixadas
   prontas e comentadas logo abaixo — a API do Howler já está com os manipuladores
   de play/pause/mute corretos, então não é necessário reescrever nada além disso.

Mantenha os arquivos curtos e comprimidos (≤150kb para os efeitos, ≤1.5MB para o
loop ambiente) para não comprometer o LCP/TBT da página.
