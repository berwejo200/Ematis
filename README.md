# La aventura de los números 🦊⭐

Videojuego web educativo de matemáticas para un niño de 5 años. Practica **sumas** y
**restas** sencillas mediante el juego, con refuerzo positivo y sin castigos. Funciona
**sin servidor, sin cuenta y sin conexión a Internet**: el progreso se guarda en el
navegador (LocalStorage, clave `ematis.v1`).

El juego está pensado para **Safari en iPad** (orientación horizontal y vertical), con
botones grandes (área táctil ≥ 60 × 60 px CSS), números legibles, sin scroll horizontal
y respetando las áreas seguras de la pantalla. Sigue siendo totalmente jugable con el
sonido desactivado.

## Requisitos

- Node.js 18 o superior (probado con Node 24) y npm.

## Puesta en marcha

Instala las dependencias:

```bash
npm install
```

Arranca el servidor de desarrollo (Vite) y abre la URL que aparece en la consola:

```bash
npm run dev
```

## Compilar para producción

Genera la versión optimizada en la carpeta `dist/`:

```bash
npm run build
```

El script ejecuta `tsc -b && vite build` (comprobación de tipos + empaquetado). Para
previsualizar el resultado de producción en local:

```bash
npm run preview
```

## Pruebas

La suite completa (lógica matemática pura, reducer, almacenamiento y componentes) se
ejecuta en modo single-run con:

```bash
npm test
```

Para una sola suite, por ejemplo los componentes:

```bash
npm test -- src/components/__tests__
```

Modo vigilancia durante el desarrollo:

```bash
npm run test:watch
```

## Stack de dependencias (versiones fijadas)

Todas las versiones están **fijadas exactamente** (sin `^` ni `~`) para builds
reproducibles.

### Dependencias

| Paquete | Versión | Uso |
|---|---|---|
| `react` | `18.3.1` | Interfaz y lógica del juego |
| `react-dom` | `18.3.1` | Renderizado en el DOM |
| `motion` | `11.11.17` | Animaciones (se importa **exclusivamente** desde `motion/react`) |
| `lucide-react` | `0.454.0` | Iconos |

### Dependencias de desarrollo

| Paquete | Versión | Uso |
|---|---|---|
| `vite` | `5.4.10` | Desarrollo y compilación |
| `@vitejs/plugin-react` | `4.3.3` | Plugin de React para Vite |
| `typescript` | `5.6.3` | Tipado estricto |
| `@types/react` | `18.3.12` | Tipos de React |
| `@types/react-dom` | `18.3.1` | Tipos de React DOM |
| `tailwindcss` | `3.4.14` | Estilos adaptables |
| `postcss` | `8.4.47` | Pipeline de PostCSS |
| `autoprefixer` | `10.4.20` | Prefijos CSS automáticos |
| `vitest` | `2.1.4` | Runner de pruebas (entorno jsdom) |
| `@testing-library/react` | `16.0.1` | Pruebas de componentes |
| `@testing-library/dom` | `10.4.0` | Núcleo DOM de Testing Library (peer requerido por `@testing-library/react@16`, instalado explícitamente) |
| `@testing-library/jest-dom` | `6.6.3` | Matchers para el DOM |
| `@testing-library/user-event` | `14.5.2` | Simulación de interacciones |
| `jsdom` | `25.0.1` | Entorno DOM para Vitest |

## Estructura del proyecto

```
src/
  app/        App.tsx — orquestador por pantalla; genera ejercicios FUERA del reducer
  screens/    Welcome, WorldMap, Exercise, LevelComplete (composición de pantalla)
  components/ Mascot, PrimaryButton, NumberCard, ProgressBar, Celebration, ExerciseBoard
  hooks/      useGameState (reducer puro), useGameProgress (persistencia), useSound
  game/       lógica pura: types, addition, subtraction, exerciseGenerator, validation, progression
  data/       levels.ts — configuración de niveles y constantes de UI (sin números mágicos)
  storage/    progressStorage.ts — LocalStorage con versionado y reparación de datos
  styles/     index.css — capas de Tailwind + reglas globales (áreas seguras, táctil, sin scroll horizontal)
```

La lógica matemática (`game/`) es pura y no depende de React ni del DOM, por lo que es
fácil de probar. Toda la aleatoriedad se inyecta mediante un parámetro `rng`, de modo que
los generadores son deterministas en las pruebas.

## Privacidad

No se solicita registro ni datos personales más allá del nombre del jugador, que se guarda
únicamente en el navegador del dispositivo. No hay llamadas de red.
