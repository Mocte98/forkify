const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { Fraction } = require('fractional');

const root = path.resolve(__dirname, '..');
const flush = () => new Promise(resolve => setImmediate(resolve));
const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});
const recipes = count => Array.from({ length: count }, (_, index) => ({
  id: `recipe-${index}`,
  title: `Recipe ${index}`,
  publisher: 'Test publisher',
  image_url: 'http://example.com/photo.jpg',
}));
const recipe = id => ({
  id,
  title: 'Pizza <special>',
  publisher: 'Chef & friends',
  image_url: 'http://example.com/photo.jpg',
  source_url: 'https://example.com/directions',
  servings: 4,
  cooking_time: 45,
  ingredients: [
    { quantity: 0.5, unit: 'cup', description: 'Tomato & basil' },
    { quantity: null, unit: '', description: 'Salt to taste' },
  ],
});

// Simula únicamente el DOM usado por el código. Las peticiones se sustituyen
// para probar errores y navegación sin consumir el límite de la API real.
const createApp = async function (fetch, { hash = '', fastTimeout = false } = {}) {
  class Element {
    innerHTML = '';
    value = '';
    listeners = new Map();
    attributes = new Map();
    insertAdjacentHTML(_, markup) { this.innerHTML += markup; }
    setAttribute(name, value) { this.attributes.set(name, value); }
    addEventListener(type, handler) {
      this.listeners.set(type, [...(this.listeners.get(type) || []), handler]);
    }
    async dispatch(type, event = {}) {
      await Promise.all((this.listeners.get(type) || []).map(handler => handler(event)));
      await flush();
    }
    querySelector() { return input; }
  }
  const input = new Element();
  const elements = Object.fromEntries(['search', 'recipe', 'results', 'pagination'].map(
    name => [name, new Element()],
  ));
  const window = new Element();
  window.location = { hash };
  const context = vm.createContext({
    console, URL, AbortController, TypeError, Error,
    setTimeout: fastTimeout ? (callback => setTimeout(callback, 10)) : setTimeout,
    clearTimeout, fetch, window,
    document: { querySelector: selector => elements[selector.slice(1)] },
  });
  const modules = new Map();
  const loading = new Map();
  async function load(filename) {
    if (loading.has(filename)) return loading.get(filename);
    const pending = linkModule(filename);
    loading.set(filename, pending);
    return pending;
  }
  async function linkModule(filename) {
    const module = new vm.SourceTextModule(await fs.readFile(filename, 'utf8'), {
      context, identifier: filename,
    });
    modules.set(filename, module);
    await module.link(async (specifier, parent) => {
      if (specifier.startsWith('url:')) {
        return new vm.SyntheticModule(['default'], function () {
          this.setExport('default', '/img/icons.svg');
        }, { context });
      }
      if (specifier === 'fractional') {
        return new vm.SyntheticModule(['Fraction'], function () {
          this.setExport('Fraction', Fraction);
        }, { context });
      }
      return load(path.resolve(path.dirname(parent.identifier), specifier));
    });
    return module;
  }
  const controller = await load(path.join(root, 'src/js/controller.js'));
  await controller.evaluate();
  return {
    ...elements, window, input,
    model: modules.get(path.join(root, 'src/js/model.js')).namespace,
    helpers: modules.get(path.join(root, 'src/js/helpers.js')).namespace,
    async searchFor(query) {
      input.value = query;
      await elements.search.dispatch('submit', { preventDefault() {} });
    },
    async goToPage(page) {
      // Representa un clic en el SVG hijo del botón (delegación de eventos).
      await elements.pagination.dispatch('click', {
        target: { closest: () => ({ dataset: { goto: String(page) } }) },
      });
    },
  };
};

test('al cargar sin hash muestra la bienvenida y no consulta la API', async () => {
  let calls = 0;
  const app = await createApp(() => { calls++; });
  await app.window.dispatch('load');
  assert.equal(calls, 0);
  assert.match(app.recipe.innerHTML, /Start by searching/);
  await app.searchFor('   ');
  assert.equal(calls, 0);
});

test('buscar usa submit, codifica la consulta, limpia el campo y pagina 10/10/3', async () => {
  let requestedUrl;
  const app = await createApp(async url => {
    requestedUrl = url;
    return response({ data: { recipes: recipes(23) } });
  });
  await app.searchFor('  pizza & cheese  ');
  assert.match(requestedUrl, /search=pizza%20%26%20cheese$/);
  assert.equal(app.input.value, '');
  assert.equal((app.results.innerHTML.match(/<li class="preview">/g) || []).length, 10);
  assert.doesNotMatch(app.pagination.innerHTML, /pagination__btn--prev/);
  assert.match(app.pagination.innerHTML, /data-goto="2"/);

  await app.goToPage(2);
  assert.equal(app.model.state.search.page, 2);
  assert.match(app.results.innerHTML, /href="#recipe-10"/);
  assert.match(app.pagination.innerHTML, /data-goto="1"/);
  assert.match(app.pagination.innerHTML, /data-goto="3"/);

  await app.goToPage(3);
  assert.equal((app.results.innerHTML.match(/<li class="preview">/g) || []).length, 3);
  assert.doesNotMatch(app.pagination.innerHTML, /pagination__btn--next/);
  await app.goToPage(2);
  assert.equal(app.model.state.search.page, 2);
});

test('otra búsqueda reinicia la página y elimina botones si hay pocos resultados', async () => {
  let count = 23;
  const app = await createApp(async () => response({ data: { recipes: recipes(count) } }));
  await app.searchFor('pizza');
  await app.goToPage(3);
  count = 3;
  await app.searchFor('avocado');
  assert.equal(app.model.state.search.page, 1);
  assert.equal(app.pagination.innerHTML, '');
  assert.equal((app.results.innerHTML.match(/<li class="preview">/g) || []).length, 3);
});

test('una búsqueda sin coincidencias muestra un mensaje y permite volver a buscar', async () => {
  let count = 0;
  const app = await createApp(async () => response({ data: { recipes: recipes(count) } }));
  await app.searchFor('zzznothing');
  assert.match(app.results.innerHTML, /No recipes found/);
  assert.equal(app.pagination.innerHTML, '');
  count = 1;
  await app.searchFor('pizza');
  assert.match(app.results.innerHTML, /class="preview"/);
  assert.doesNotMatch(app.results.innerHTML, /No recipes found/);
});

test('un enlace directo carga receta, fracciones, ingredientes y enlace al autor', async () => {
  const app = await createApp(async () => response({ data: { recipe: recipe('pizza') } }), { hash: '#pizza' });
  await app.window.dispatch('load');
  assert.equal(app.model.state.recipe.id, 'pizza');
  assert.match(app.recipe.innerHTML, /Pizza &lt;special&gt;/);
  assert.match(app.recipe.innerHTML, /Chef &amp; friends/);
  assert.match(app.recipe.innerHTML, /https:\/\/example.com\/photo.jpg/);
  assert.match(app.recipe.innerHTML, /recipe__quantity">1\/2</);
  assert.match(app.recipe.innerHTML, /recipe__quantity"><\/div>/);
  assert.match(app.recipe.innerHTML, /href="https:\/\/example.com\/directions"/);
  assert.equal(app.recipe.attributes.get('aria-busy'), 'false');
});

test('hashchange actualiza la receta y marca el resultado seleccionado', async () => {
  const app = await createApp(async url => url.includes('?search=')
    ? response({ data: { recipes: recipes(3) } })
    : response({ data: { recipe: recipe(url.split('/').pop()) } }));
  await app.searchFor('pizza');
  app.window.location.hash = '#recipe-1';
  await app.window.dispatch('hashchange');
  assert.equal(app.model.state.recipe.id, 'recipe-1');
  assert.match(app.results.innerHTML, /href="#recipe-1" aria-current="true"/);
  app.window.location.hash = '';
  await app.window.dispatch('hashchange');
  assert.match(app.recipe.innerHTML, /Start by searching/);
  assert.doesNotMatch(app.results.innerHTML, /aria-current/);
});

test('un ID inexistente muestra error y quita el spinner', async () => {
  const app = await createApp(async () => response({ message: 'Not found' }, 404), { hash: '#invalid' });
  await app.window.dispatch('load');
  assert.match(app.recipe.innerHTML, /We could not find that recipe/);
  assert.doesNotMatch(app.recipe.innerHTML, /class="spinner"/);
});

test('un fallo de conexión se muestra en los resultados', async () => {
  const app = await createApp(async () => { throw new TypeError('Failed to fetch'); });
  await app.searchFor('pizza');
  assert.match(app.results.innerHTML, /Check your internet connection/);
  assert.equal(app.results.attributes.get('aria-busy'), 'false');
});

test('el límite de peticiones de la API se informa sin dejar botones anteriores', async () => {
  const app = await createApp(async () => response({ message: 'Rate limit' }, 429));
  await app.searchFor('pizza');
  assert.match(app.results.innerHTML, /Too many requests/);
  assert.equal(app.pagination.innerHTML, '');
});

test('una petición que no responde termina con un error de tiempo de espera', async () => {
  const app = await createApp(() => new Promise(() => {}), { fastTimeout: true });
  await assert.rejects(app.helpers.getJSON('https://example.com'), /took too long/);
});

test('al cambiar rápido de receta se cancela la anterior y permanece la última', async () => {
  let firstStarted;
  const started = new Promise(resolve => { firstStarted = resolve; });
  const app = await createApp((url, { signal }) => {
    if (url.endsWith('/slow')) {
      firstStarted();
      return new Promise((_, reject) => signal.addEventListener('abort', () => {
        reject(new Error('Aborted'));
      }));
    }
    return Promise.resolve(response({ data: { recipe: recipe('fast') } }));
  }, { hash: '#slow' });
  const pending = app.window.dispatch('load');
  await started;
  app.window.location.hash = '#fast';
  await app.window.dispatch('hashchange');
  await pending;
  assert.equal(app.model.state.recipe.id, 'fast');
  assert.doesNotMatch(app.recipe.innerHTML, /Aborted/);
});

test('la paginación ignora clics fuera de sus botones', async () => {
  const app = await createApp(async () => response({ data: { recipes: recipes(20) } }));
  await app.searchFor('pizza');
  await app.pagination.dispatch('click', { target: { closest: () => null } });
  assert.equal(app.model.state.search.page, 1);
});
