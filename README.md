# Open Duet

An open-source mobile shell for a personal agent.

Open Duet is a high-fidelity interface experiment inspired by Anthropic's Duet: a warm, quiet workspace where chat, tasks and generated artifacts live together. The difference is ownership — the UI is open, and chat can run on **your own Hermes Agent** instead of a hosted assistant.

> Independent project. Not affiliated with, endorsed by, or connected to Anthropic. "Claude" and "Duet" are trademarks of Anthropic, referenced only to describe the source of the design inspiration.

## What is inside

- **Chat** with approval cards, a morning brief, a GitHub setup thread, typing states and a voice screen.
- **Tasks**: Active / Up next, completion states, task details, an email draft flow and quick task creation.
- **Make**: recent artifacts, design cards, a create menu and an artifact reader.
- **Sidebar**: swipe from the left edge to open, swipe left or tap outside to close.
- **Progressive frosted header**: content scrolls under the three header buttons and blurs gradually toward the top.
- **Hermes Agent bridge**: when configured, chat turns are sent to your Hermes Agent. Without it, the built-in simulation runs.

The app is a light-only, gesture-driven prototype. Most task/make actions are simulated for now; chat is the first surface connected to Hermes.

## Repository layout

```
.
├── index.html / styles.css / app.js   # interactive web design prototype
├── assets/fonts/                      # local fonts used by the web prototype
└── mobile/                            # Expo app (iOS + Android)
    ├── App.js                         # the product prototype
    ├── src/hermes.js                  # Hermes Agent adapter
    ├── .env.example
    └── app.json
```

## Run the app

Requirements: Node 20+, the Expo Go app on your phone, and a phone and computer on the same network.

```bash
cd mobile
npm install
npx expo start
```

Open the project in Expo Go by scanning the QR code or entering the `exp://` URL printed by Metro.

On iOS, Expo Go requires the **same Expo account** in the app and in the CLI. If you have not done it yet:

```bash
npx expo login
```

Then reload the project. The app targets Expo SDK 58.

## Connect your Hermes Agent

Copy the example environment file:

```bash
cd mobile
cp .env.example .env
```

Fill in the address of your Hermes Agent:

```dotenv
EXPO_PUBLIC_HERMES_AGENT_URL=http://192.168.1.20:8000
EXPO_PUBLIC_HERMES_CHAT_PATH=/v1/chat/completions
EXPO_PUBLIC_HERMES_AGENT_TOKEN=
```

`192.168.1.20` must be reachable from the phone. Do not use `localhost` from the phone — use the LAN address of the machine running the agent.

The adapter in [`mobile/src/hermes.js`](mobile/src/hermes.js) sends an OpenAI-compatible request:

```json
{
  "messages": [
    { "role": "system", "content": "You are Open Duet…" },
    { "role": "user", "content": "…" }
  ],
  "stream": false
}
```

It accepts the reply from any of these response shapes:

- `choices[0].message.content` (OpenAI-compatible)
- `message.content`
- `reply`
- `output_text`
- `output`
- `text`

If your Hermes Agent exposes a different route, payload or streaming format, edit `mobile/src/hermes.js`. SSE streaming is a good next step.

If the agent is not configured or cannot be reached, Open Duet falls back to its simulated replies and shows a short toast. Tasks and Make are still UI simulations.

> ⚠️ `EXPO_PUBLIC_*` values are embedded in the client bundle. Keep this setup on a trusted local network; for anything public, put the agent behind your own authenticated proxy.

## Run the web prototype

The web prototype is a separate, earlier design exploration. From the repository root:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Status and roadmap

Prototype / design exploration:

- [x] Full mobile UI prototype (Expo, iOS + Android)
- [x] Hermes Agent chat adapter
- [x] Progressive blur header, drawer gestures, task and artifact flows
- [ ] Streaming responses (SSE)
- [ ] Real task / Make actions against the agent
- [ ] Persistence and conversation history
- [ ] Authentication and a production-safe agent proxy
- [ ] Automated tests

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgements

Design exploration inspired by the Duet interface. Built with Expo, React Native, `expo-blur`, `expo-linear-gradient`, `react-native-svg` and `@react-native-masked-view/masked-view`. Hermes Agent is the intended brain behind the chat surface.
