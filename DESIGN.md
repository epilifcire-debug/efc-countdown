# DESIGN — EFC Countdown

Segue o padrão global EFCSYS (`efcsys-skills/shared/DESIGN.md`), com a identidade própria do produto.

## Identidade
- Logo EFC Tecnologia (preto, dourado metálico, prata, branco). Marca: **EFC COUNTDOWN** + "by EFC Tecnologia".
- Assinatura no rodapé: "desenvolvido por EFC Tecnologia · by: efcsys".

## Paleta (tema escuro, único)
| Token | Valor |
|---|---|
| `ink` (fundo) | #000000 · 900 #0A0A0A · 800 #111111 · 700 #141414 |
| `gold` (destaque/primário) | #D4AF37 · light #F5C542 |
| `gold-dim` (bordas) | rgba(212,175,55,0.25) |
| `silver` | #C0C0C0 |
| `muted` (texto secundário) | #A1A1A1 |
| `danger` | #E5484D |

Sem gradientes coloridos; dourado só como destaque. Botão primário dourado com texto preto.

## Tipografia
- Interface: **Inter**; títulos: **Montserrat** bold.
- GIFs: JetBrains Mono (padrão), Inter, Montserrat, Poppins, Roboto, Oswald, Orbitron — as mesmas fontes vetoriais no preview e no servidor.

## Componentes
Cards com cantos de 12 px, borda fina e sombra discreta; foco visível dourado; estados loading (skeleton), vazio, erro e sucesso (toast).

## Movimento
- Microinterações de 150–200 ms; desligadas em `prefers-reduced-motion`.
- ColorBends (preset dourado EFCSYS: speed 0.18, frequency 1.25, noise 0.08, bandWidth 0.32, rotation 55, fadeTop 0.88, iterations 2, intensity 1.2) **apenas** na landing e no login, com carregamento sob demanda e versão reduzida no mobile.

## Layout
- Desktop: sidebar fixa à esquerda.
- Mobile: menu hambúrguer (drawer); no editor, o preview fica fixo no topo e o formulário abaixo.
