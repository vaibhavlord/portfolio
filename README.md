# Vaibhav Chaudhary — Curious by Default

A personal portfolio built with HTML, CSS, JavaScript, and a healthy inability to stop asking “what if?”

This website introduces me as a first-year BTech student at **NST-RU**, learning Python and exploring artificial intelligence. It brings together my skills, interests, learning journey, and contact details in a scroll-driven experience with warm-white backgrounds, cobalt accents, and playful interactions.

## Features

- **Scroll-driven storytelling:** an opening that moves apart as you scroll, a moving word ribbon, and a bio that highlights word by word.
- **Interactive curiosity key:** a CSS-built 3D key with pointer tilt, a press animation, and a rotating collection of humorous thoughts.
- **Skills showcase:** Python and Git & GitHub cards with subtle tilt effects, hoverable tags, and an animated branching graphic.
- **Interests gallery:** cinema, film direction, storytelling, production, and experimenting with AI. Vertical scrolling moves the gallery horizontally on suitable desktop screens; smaller screens use native horizontal scrolling.
- **Learning timeline:** a progress line and highlighted milestones that follow your position on the page.
- **Micro-interactions:** magnetic buttons, animated arrows, interactive artwork, and email copying with confirmation feedback.
- **Responsive navigation:** desktop links, a mobile menu, active-section indicators, and page progress tracking.
- **Motion controls:** support for reduced-motion preferences and a manual animation toggle, with the choice remembered for the browser session.
- **Keyboard support:** visible focus states, a skip link, and mobile-menu focus management.

## Built With

| Technology | Purpose |
| --- | --- |
| HTML5 | Semantic content and page structure |
| CSS3 | Responsive layouts, artwork, 3D transforms, and animations |
| Vanilla JavaScript | Scroll effects and interactive controls |
| SVG | Favicon and small interface graphics |
| Google Fonts | DM Sans and IBM Plex Mono typography |

No framework, animation library, package installation, or build step is required. Scroll effects use native browser scrolling, `requestAnimationFrame`, and browser observers.

## Run Locally

With Python 3 installed, run these commands:

```bash
git clone https://github.com/vaibhavlord/portfolio.git
cd portfolio
python3 -m http.server 4173 --bind 127.0.0.1
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173) in a modern browser. Keep the terminal running while viewing the site; press `Ctrl+C` to stop the server.

If you already have the project, run only the server command from its folder. An internet connection loads the Google Fonts; system fonts provide a fallback.

## Project Files

| File | Contents |
| --- | --- |
| `index.html` | Introduction, bio, skills, interests, learning timeline, and contact links |
| `style.css` | Design tokens, layouts, responsive rules, artwork, and animation styling |
| `script.js` | Scroll choreography, pointer interactions, navigation, motion preferences, and email copying |
| `favicon.svg` | Portfolio favicon |
| `README.md` | Project overview and setup instructions |

## Customization

- Edit `index.html` to update the bio, skills, interests, learning plans, and social links.
- Adjust the variables in `:root` in `style.css` to change the colors, typography, and page spacing.
- Update the `thoughts` array in `script.js` to change the curiosity key's messages.
- If changing the email address, update both the links in `index.html` and the clipboard value in `script.js`.

## Deployment

The project is a static website. Serve the repository root with a static hosting service, keeping `index.html`, `style.css`, `script.js`, and `favicon.svg` together. There is no build command, backend, or API key to configure.

## Connect

- **Email:** [vaibhavchaudhary767@gmail.com](mailto:vaibhavchaudhary767@gmail.com)
- **GitHub:** [@vaibhavlord](https://github.com/vaibhavlord)
- **LinkedIn:** [Vaibhav Chaudhary](https://www.linkedin.com/in/vaibhav-chaudhary-9380b142b/)

---

*Made of curiosity. And a few Ctrl+Zs.*
