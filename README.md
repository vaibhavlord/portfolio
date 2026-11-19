# Vaibhav Chaudhary — Between Logic & Imagination

A monochrome personal portfolio with bold typography, enhanced flowing ink artwork, reaching hands, scroll-driven storytelling, and a healthy inability to stop asking “what if?”

I'm pursuing **BTech in Computer Science and AI**, building for the web, learning Python, and exploring artificial intelligence. This portfolio brings together my skills, interests, learning journey, and contact details in a black-and-white design with oversized uppercase headings and open, borderless layouts.

## The Experience

- **Living ink:** the enhanced monochrome artwork curls and rises like flames on a lightweight WebGL mesh, with pointer and scroll movement layered on top. The deformation affects only the artwork; text remains crisp.
- **Reaching hands:** longer forearms extend to both screen edges as a scroll-driven sequence brings the two hands closer, keeping their image containers strictly separated. A hard minimum gap and horizontal-only movement prevent overlap at every scroll position.
- **A readable introduction:** the bio fills word by word as you scroll through it.
- **A visual toolkit:** HTML, CSS, JavaScript, Python, Git & GitHub, and AI appear in spacious cards with scalable SVG graphics, scroll reveals, pointer lighting, and hover treatments. Descriptions are always visible.
- **An offscreen gallery:** cinema, film direction, storytelling, production, and playing with AI. Normal page scrolling advances the cards horizontally while the heading and cards stay together on screen; scrolling back reverses the movement. Artwork sizes adapt to the available height so the heading stays visible throughout. Very short windows and reduced-motion mode retain native horizontal scrolling.
- **A learning journey:** milestones respond to the page position inside borderless panels.
- **Micro-interactions:** magnetic buttons, a small pointer-following dot, animated artwork, hover treatments, and email-copy feedback.
- **Accessible controls:** keyboard navigation, a skip link, focus management for the mobile menu, reduced-motion support, and a manual motion toggle.

Pinned sequences activate only when the screen has enough room. The page uses native scrolling throughout. The ink animation pauses when offscreen or when the browser tab is hidden. Reduced-motion preferences and the motion toggle restore the still image. If WebGL is unavailable, the original image remains visible.

## Built With

| Technology | Purpose |
| --- | --- |
| HTML5 | Semantic sections and accessible controls |
| CSS3 | Responsive layouts, typography, artwork, transitions, and transforms |
| Vanilla JavaScript | Scroll choreography, navigation, card lighting, and micro-interactions |
| WebGL | Lightweight, continuous flame-like deformation of the ink artwork |
| SVG | Favicon and interface graphics |
| Self-hosted fonts | Inter for heavy headings and body text; Roboto Condensed for navigation and labels |

No framework, animation library, package installation, backend, API key, or build step is required. JavaScript uses `requestAnimationFrame`, browser observers, and cached layout measurements.

## Run Locally

With Python 3 installed:

```bash
git clone https://github.com/vaibhavlord/portfolio.git
cd portfolio
python3 -m http.server 4173 --bind 127.0.0.1
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Keep the terminal running while viewing the site; press `Ctrl+C` to stop the server.

If you already have the project, run only the server command from its folder. Fonts, artwork, and icons are served locally. Font license files are included in `assets/fonts/`.

## Project Files

| File | Contents |
| --- | --- |
| `index.html` | Introduction, reaching-hands sequence, bio, skills, interests, timeline, and contact details |
| `style.css` | Monochrome design, responsive layouts, artwork, and motion styling |
| `script.js` | Scroll effects, non-overlapping hand movement, card lighting, gallery navigation, motion preferences, and email copying |
| `ink-flames.js` | GPU mesh deformation of the ink artwork, visibility-aware playback, and static-image fallback |
| `assets/references/ink-reference.jpg` | Preserved original ink reference |
| `generated_images/exec-ae0a47af-0ab9-49c4-96d6-e9f50b5d7ade.png` | Enhanced ink artwork used in the hero and contact sections: 941 × 1672 pixels |
| `generated_images/exec-928bcab1-cdfe-4b76-b39d-5590ffede0d3.png` | Extended forearm artwork used in the full-width scroll sequence: 1942 × 809 pixels |
| `assets/fonts/` | Locally served font files and their licenses |
| `assets/references/hands-reference.jpg` | Preserved original hand reference |
| `favicon.svg` | Black-and-white portfolio favicon |
| `README.md` | Overview and setup instructions |

The enhanced images are higher-resolution restorations, not native 4K exports. The original reference files are retained.

## Customization

- Update personal information, skills, interests, and social links in `index.html`.
- Change colors, fonts, and spacing through the variables in `:root` in `style.css`.
- Edit the skill cards in `index.html` to change their descriptions or SVG artwork.
- Hand travel is deliberately capped outside the stage center; preserve that bound when adjusting the animation in `script.js`.
- When changing the email address, update both its HTML links and the clipboard value in `script.js`.

## Deployment

Serve the repository root with a static hosting service. Keep the `assets` and `generated_images` directories alongside `index.html`, `style.css`, `script.js`, `ink-flames.js`, and `favicon.svg`. There is no build command to configure.

## Connect

- **Email:** [vaibhavchaudhary767@gmail.com](mailto:vaibhavchaudhary767@gmail.com)
- **GitHub:** [@vaibhavlord](https://github.com/vaibhavlord)
- **LinkedIn:** [Vaibhav Chaudhary](https://www.linkedin.com/in/vaibhav-chaudhary-9380b142b/)

---

*Curiosity. Code. A few Ctrl+Zs.*
