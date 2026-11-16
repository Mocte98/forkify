import { API_URL, RES_PER_PAGE } from './config.js';
import { getJSON, getImageUrl } from './helpers.js';

// El modelo guarda los datos; no conoce el DOM ni las vistas.
export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: RES_PER_PAGE,
  },
};

export const loadRecipe = async function (id, signal) {
  const data = await getJSON(`${API_URL}/${encodeURIComponent(id)}`, signal);
  signal?.throwIfAborted();
  const { recipe } = data.data;
  state.recipe = {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: getImageUrl(recipe.image_url),
    servings: recipe.servings,
    cookTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
  };
};

export const loadSearchResults = async function (query, signal) {
  state.search.query = query;
  state.search.results = [];
  state.search.page = 1;
  const data = await getJSON(`${API_URL}?search=${encodeURIComponent(query)}`, signal);
  signal?.throwIfAborted();
  state.search.results = data.data.recipes.map(recipe => ({
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    image: getImageUrl(recipe.image_url),
  }));
};

export const getSearchResultsPage = function (page = state.search.page) {
  const numPages = Math.max(1, Math.ceil(state.search.results.length / state.search.resultsPerPage));
  state.search.page = Math.min(Math.max(1, page), numPages);
  const start = (state.search.page - 1) * state.search.resultsPerPage;
  return state.search.results.slice(start, start + state.search.resultsPerPage);
};
