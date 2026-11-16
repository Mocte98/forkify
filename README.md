# Forkify — Proyecto final de JavaScript II

Alumno: **Daniel Moctezuma**.

Aplicación frontend para buscar recetas en una API remota, navegar por los
resultados y consultar ingredientes e instrucciones. Conserva la base visual
del proyecto del curso y organiza el JavaScript con arquitectura MVC.

## Ejecutar

Requiere Node.js 22 actualizado y npm.

```bash
npm ci
npm start
```

Abre la dirección que indique Parcel, normalmente `http://localhost:1234`.
Busca `pizza`, `pasta` o `avocado` para comenzar. La API acepta una lista limitada
de términos en inglés; no funciona como un buscador de texto libre en español.

## Funcionalidades implementadas

- Consulta asíncrona de recetas con `fetch`, promesas y `async/await`.
- Búsqueda mediante el botón o Enter, sin recargar la página.
- Resultados con imagen, título, autor y enlaces con hash.
- Carga de una receta al cambiar el hash y al abrir un enlace directo.
- Ingredientes con fracciones y cantidades opcionales.
- Indicadores de carga y mensajes de error dentro de la interfaz.
- Manejo de recetas inexistentes, búsquedas sin resultados, errores de conexión,
  límite de solicitudes y tiempo de espera de cinco segundos.
- Paginación de diez resultados, con botones anterior y siguiente.
- Cancelación de consultas anteriores al cambiar rápidamente la selección.
- Adaptación de la plantilla a pantallas pequeñas y etiquetas de accesibilidad.

El alcance corresponde a los cuatro avances del PDF. Los controles de favoritos,
alta de recetas y ajuste de porciones se retiraron de la interfaz porque no se
desarrollan en los requisitos de esta entrega.

## Organización y relación con el PDF

```text
src/js/
├── config.js                 URL de la API, timeout y tamaño de página
├── helpers.js                Consulta JSON, errores y utilidades
├── model.js                  Estado, carga de recetas y resultados, paginación
├── controller.js             Coordinación de eventos, modelo y vistas
└── views/
    ├── View.js               Renderizado, limpieza, spinner y mensajes compartidos
    ├── recipeView.js         Detalle, ingredientes y eventos de hash/carga
    ├── searchView.js         Lectura del campo y evento submit
    ├── resultsView.js        Lista de resultados
    └── paginationView.js     Botones y delegación del clic
```

- **Avance 1:** entorno npm/Parcel/Sass, consumo de API y render de recetas.
- **Avance 2:** MVC, clases, `fractional`, configuración y funciones reutilizables.
- **Avance 3:** suscripción de controladores a eventos de las vistas, errores,
  búsqueda, herencia desde `View` y presentación de resultados.
- **Avance 4:** división de los resultados en páginas y navegación completa.

El flujo es: la vista escucha un evento, llama al controlador, el controlador
solicita datos al modelo y entrega el estado resultante a la vista para dibujarlo.
Los errores se propagan al controlador; el modelo no muestra alertas ni toca el DOM.

La API se configuró con la dirección actual de la
[documentación oficial](https://forkify-api.herokuapp.com/v2):
`https://forkify-api.jonas.io/api/v2/recipes`. Las lecturas no requieren una clave.

La librería `fractional` se incluye en `vendor/fractional` como dependencia local
de npm. Es una copia del código oficial de Erik Garrison bajo licencia MIT,
incluida en el archivo. Esto permitió instalarla sin acceso al registro de npm.
No elimines esa carpeta al subir el proyecto. `0.5` se presenta como `1/2`.

## Verificación

```bash
npm test
```

Las pruebas ejecutan los módulos reales en un DOM simulado y sustituyen las
peticiones de red. Cubren búsqueda, paginación, enlaces directos, fracciones,
errores y cancelación de peticiones. No son una prueba visual ni una comprobación
del servicio remoto desde tu navegador.

Comprobación manual antes de entregar:

1. Buscar `pizza` con Enter y avanzar/retroceder entre páginas.
2. Abrir una receta y comprobar imagen, ingredientes y enlace de instrucciones.
3. Recargar con la receta seleccionada y comprobar que vuelve a abrirse.
4. Buscar `zzznothing` y comprobar el mensaje de resultados vacíos.
5. Poner `#invalid` al final de la URL y comprobar el mensaje de error.

## Compilar

El comando del curso se mantiene:

```bash
npm run build
```

Parcel genera la aplicación en `dist`. En el entorno del asistente una extensión
nativa de SWC está bloqueada por la validación de permisos de su caché. Por eso
se añadió y verificó una alternativa que compila Sass con JavaScript y conserva
los módulos ES para el navegador:

```bash
npm run build:portable
```

Esta alternativa también genera `dist`, con los mismos datos, vistas y estilos.
`netlify.toml` la usa para publicar. Sass se declara como dependencia de desarrollo
directa para que el comando sea reproducible tras `npm ci`.

## Publicar en GitHub

La publicación y los enlaces finales todavía deben completarse en tus cuentas.
Puedes usar la web si no tienes Git configurado:

1. En GitHub crea un repositorio público llamado `forkify`.
2. En el repositorio vacío abre la opción para subir archivos existentes.
3. Sube **el contenido** de `artifacts/github`, conservando sus subcarpetas.
   Es una copia preparada del código: incluye `src`, `vendor`, `scripts`, `tests`,
   `index_files` y los archivos de configuración de la raíz.
4. Guarda con el mensaje `Completar proyecto Forkify con arquitectura MVC`.
5. Comprueba que `index.html` y `package.json` estén en la raíz del repositorio.

No subas `node_modules`, `.parcel-cache`, `.git`, `dist` ni la carpeta `artifacts`.
Si más adelante cambias el código, actualiza también lo que subiste a GitHub.

Si prefieres Git desde tu terminal, en una copia normal del proyecto:

```bash
git init -b main
git add .
git commit -m "Completar proyecto Forkify con arquitectura MVC"
git remote add origin https://github.com/TU_USUARIO/forkify.git
git push -u origin main
```

Reemplaza `TU_USUARIO`. Si Git solicita identidad, configura tu nombre y correo
de GitHub antes del commit. La carpeta `.git` disponible para el asistente está
vacía y es de solo lectura, por lo que aquí no se inicializó un repositorio.

## Publicar en Netlify

**Opción rápida:** inicia sesión en Netlify y abre
[Netlify Drop](https://app.netlify.com/drop). Arrastra la carpeta `dist` ya
compilada. Debe contener `index.html` directamente, junto con sus estilos y
subcarpetas de recursos. Espera a que termine y abre el enlace público.

**Opción conectada a GitHub:** importa el repositorio `forkify` desde Netlify.
El archivo `netlify.toml` ya define:

- Comando de build: `npm run build:portable`.
- Directorio publicado: `dist`.
- Node.js: 22.

La publicación con repositorio permitirá que futuros pushes actualicen el sitio.
Si publicas por arrastre, vuelve a compilar y arrastra `dist` otra vez para
publicar cambios.

Consulta oficial: [Formas de publicar en Netlify](https://docs.netlify.com/deploy/create-deploys/).

## Entrega

Reemplaza los dos valores pendientes de `entrega.txt` por las URLs reales de
GitHub y Netlify. Abre ambas en una ventana privada para comprobar que el profesor
puede acceder y entrega ese `.txt` en la plataforma del curso.

## Créditos

Plantilla visual y API: Jonas Schmedtmann. Código adaptado para fines educativos
al proyecto final de Programación con JavaScript II. Se conserva el crédito de
la plantilla en la interfaz. Librería `fractional`: Erik Garrison, licencia MIT.
