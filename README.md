# Sumit Singh · Portfolio

Software engineer at **Tata 1MG**, building Android apps with Kotlin and Jetpack Compose. Open to software engineer roles and freelance work.

**[hiisumit.com](https://hiisumit.com)**

![Portfolio preview](assets/og-image.png)

## Highlights

- **Loader:** a progress ring with a counter, then the page slides up into the hero
- **Hero:** WebGL silk background and a flickering name intro
- **Bot cursor:** its eyes follow where you move, and a trail of ten bots follows behind (desktop only)
- **Themes:** dark and light, with an animated switch. Dark by default; your choice is remembered.
- **Experience:** Tata 1MG, AnkiDroid, OTPLESS, VITTO and MOLOG, each with its headline result
- **Projects:** two screens per app, built in HTML/CSS
  - ResQSync: family map + SOS screen
  - Neer: live water tracker (tap to log) + reminder
  - NewsHub: news feed + read-aloud reader
- **Skills:** an orbit of tools plus skill trees with travelling pulses
- **Contact:** particle "Let's talk", velocity marquee and copy-to-clipboard links
- **Phone-friendly:** works from 320px wide

## Tech

- Plain HTML, CSS and JavaScript, with no build step
- [GSAP](https://gsap.com/) (ScrollTrigger, SplitText) and [Lenis](https://lenis.darkroom.engineering/) smooth scrolling
- Fonts: Unbounded, Space Grotesk and JetBrains Mono
- Hosted on GitHub Pages

## Run locally

```bash
git clone https://github.com/Giyutomioka-SS/giyutomiokaSS-portfolio.git
cd giyutomiokaSS-portfolio
python3 -m http.server 8080   # open http://localhost:8080
```

## Structure

```
index.html   markup, SEO and social meta
style.css    design tokens and styles for both themes
app.js       loader, cursor, animations and interactions
assets/      photo, avatar, app and skill icons, social preview
DESIGN.md    design system notes
CNAME        custom domain (hiisumit.com)
```

## Deploy

Push to `main` and GitHub Pages publishes it to [hiisumit.com](https://hiisumit.com). When you change `style.css` or `app.js`, bump the `?v=` number on both links in `index.html` so browsers fetch the new files.

## License

[Apache 2.0](LICENSE)
