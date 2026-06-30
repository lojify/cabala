# KAOS//STUDIO — Template "Portfólio Criativo"
Caos controlado · vanguarda · 60fps

## Estrutura
```
index.html        → marcação semântica, trilha horizontal com 5 painéis
style.css          → tokens de design, layout, glitch, cursor, responsivo, reduced-motion
script.js          → Lenis + GSAP/ScrollTrigger + cursor + glitch + áudio sintetizado
assets/img/        → grain.svg (textura), cursor-brush.svg, cursor-pixel.svg, imagens de demo via picsum.photos
assets/audio/      → README.md explicando como plugar Howler.js com arquivos reais
```

## Como rodar
Basta abrir `index.html` num navegador (ou servir a pasta com qualquer
servidor estático). As imagens de demonstração vêm de `picsum.photos` —
troque os `src` em `index.html` pelas fotos reais do portfólio quando for
para produção.

## Pontos de customização rápida
- **Paleta:** variáveis `--bg`, `--acc-pink`, `--acc-cyan`, `--acc-yellow` no topo do `style.css`.
- **Fontes:** trocar os links `Unbounded` / `Space Grotesk` / `JetBrains Mono` no `<head>`.
- **Número de seções da trilha horizontal:** adicionar/remover `<section class="panel">` dentro de `#track` — o JS recalcula a distância de scroll automaticamente (`invalidateOnRefresh: true`).
- **Áudio real:** ver `assets/audio/README.md`.
- **Cursor:** os SVGs em `assets/img/` são referência visual; o cursor ativo em tela é desenhado via canvas/CSS no `script.js` (mais performático que trocar a imagem do cursor do SO).

## Performance / acessibilidade já implementadas
- Todas as animações usam apenas `transform` e `opacity` (GPU).
- `prefers-reduced-motion`: desativa scroll horizontal, cursor customizado, glitch, distorção e marquee — a página vira uma rolagem vertical simples com fade básico.
- Mobile (`<768px`): mesma lógica de fallback + sem cursor customizado + animações mais curtas.
- `loading="lazy"` + `decoding="async"` nas imagens de trabalho.
- `ScrollTrigger` com `invalidateOnRefresh: true` e `pinType: "transform"`.
- Scripts de terceiros com `defer`.
