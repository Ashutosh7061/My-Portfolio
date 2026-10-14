# Backend Developer Portfolio · 3D Server Room

An interactive portfolio built as a 3D datacenter. Every server in the room is a section of the portfolio (about, experience, projects, contact and more). Click a server and it slides out of its rack, while a built-in terminal prints that section as an API response.

Built with **React**, **Three.js**, **Vite** and plain **CSS**.

🌐 **Live Website:** [Visit Portfolio](https://ashutosh-two.vercel.app/)

## Features

- Full 3D server room: tiled floor, walls, ceiling lights, cable trays, and rows of racks with blinking LEDs
- 15 clickable servers across 4 racks (`/identity`, `/stack`, `/projects`, `/projects?page=2`), including 6 project slots
- Click a server to see it pull out of its rack, with a request pulse from the API gateway and a sonar ring on the floor
- A working terminal: type commands or tap the section buttons
- Drag to rotate, scroll or pinch to zoom, works on desktop and mobile
- Respects the "reduce motion" system setting
- All content lives in one file, so you never touch the 3D code to update your details

## Quick start

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. To open the browser automatically, set `server: { open: true }` in `vite.config.js`.

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload      |
| `npm run build`   | Create a production build in `dist/`      |
| `npm run preview` | Serve the production build locally        |

## Make it yours

Everything personal is in **`src/data/portfolio.js`**.

1. Replace the four constants at the top: `LINKEDIN`, `GITHUB`, `EMAIL`, `PHONE`.
2. Replace every `[bracketed]` placeholder with your real details (companies, college, project names, results).
3. Edit, add or remove entries in `SECTIONS`. Each entry looks like this:

```js
{ id: 'project-1', rack: 2, data: { name: 'My API', summary: '...', stack: ['Node.js'] } }
```

- `id` becomes the endpoint name, for example `GET /project-1`
- `rack` is the rack index, matching the `RACKS` list in the same file
- `data` is any JSON you want shown in the terminal. URLs and email addresses become clickable links automatically

Each rack holds **4 servers**. To add more servers, add a rack name to `RACKS` and give new sections that rack number.

Other things to change:

| What                         | Where                                                        |
| ---------------------------- | ------------------------------------------------------------ |
| Your name and status line    | `src/components/Header.jsx`                                  |
| Page title                   | `index.html`                                                 |
| Colours and fonts            | variables at the top of `src/styles/global.css`              |
| Back-wall sign text          | `signTexture()` in `src/three/ServerRoom.js`                 |
| Room lighting                | `buildRoom()` in `src/three/ServerRoom.js`                   |

The numbers in the header (req/s, p99, uptime) are **simulated for effect** and are labelled that way. Replace them with real facts about you, or remove the list from `Header.jsx`.

## Terminal commands

| Command           | Result                                   |
| ----------------- | ---------------------------------------- |
| `help`            | List all commands                        |
| `ls`              | List every endpoint                      |
| `open <name>`     | Open a section (also `cat`, `curl`, `get`) |
| `whoami`          | Open the about section                   |
| `contact`         | Open the contact section                 |
| `clear`           | Clear the screen                         |

Use the up and down arrow keys to move through earlier commands.

## Project structure

```
backend-portfolio/
├─ index.html              page shell and Google Fonts
├─ package.json
├─ vite.config.js
└─ src/
   ├─ main.jsx             mounts <App/>, imports CSS, cursor glow
   ├─ App.jsx              state, terminal commands, opens sections
   ├─ data/
   │  └─ portfolio.js      all your content (edit this file)
   ├─ components/
   │  ├─ Scene.jsx         React wrapper around the 3D scene
   │  ├─ Terminal.jsx      output, section buttons, command input
   │  └─ Header.jsx        name, status and simulated metrics
   ├─ three/
   │  └─ ServerRoom.js     the whole 3D room, camera, clicking
   ├─ utils/
   │  └─ formatJson.js     colour-codes the JSON shown in the terminal
   └─ styles/
      ├─ global.css        colours, fonts, page effects
      ├─ scene.css         canvas, header, rack labels
      └─ terminal.css      terminal panel
```

## How it works

- **`ServerRoom.js`** is plain Three.js with no React in it. It builds the room, runs the render loop, handles drag, zoom and clicks, and calls `onPick(id)` when a server is clicked.
- **`Scene.jsx`** creates that scene once, cleans it up when the component unmounts, and exposes `open(id, callback)` and `retract()`.
- **`App.jsx`** owns the terminal text. A server click, a section button and a typed command all go through the same `open()` function. That function asks the scene to fly to the server and prints the JSON when the pulse arrives.
- **`formatJson.js`** escapes the data and wraps keys, strings, numbers and links in coloured tags. Section data should be your own trusted content.

## Tech

React 18 · Three.js 0.160 · Vite 5 · CSS (no UI framework)

## License

Use this project however you like for your own portfolio.
