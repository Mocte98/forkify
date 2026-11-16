import * as model from './model.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';

let recipeRequest;
let searchRequest;

const renderSearchPage = function (page) {
  resultsView.render(model.getSearchResultsPage(page));
  paginationView.render(model.state.search);
};

const controlRecipes = async function () {
  // Cancelar la petición anterior evita mostrar una receta seleccionada antes.
  recipeRequest?.abort();
  const request = new AbortController();
  recipeRequest = request;
  const id = window.location.hash.slice(1);
  if (model.state.search.results.length) renderSearchPage();
  if (!id) {
    model.state.recipe = {};
    recipeView.renderMessage();
    return;
  }

  try {
    recipeView.renderSpinner();
    await model.loadRecipe(id, request.signal);
    if (!request.signal.aborted) recipeView.render(model.state.recipe);
  } catch (error) {
    if (!request.signal.aborted) recipeView.renderError(error.message);
  }
};

const controlSearchResults = async function () {
  const query = searchView.getQuery();
  if (!query) return;
  searchRequest?.abort();
  const request = new AbortController();
  searchRequest = request;

  try {
    resultsView.renderSpinner();
    paginationView.clear();
    await model.loadSearchResults(query, request.signal);
    if (!request.signal.aborted) renderSearchPage(1);
  } catch (error) {
    if (!request.signal.aborted) {
      resultsView.renderError(error.message);
      paginationView.clear();
    }
  }
};

const controlPagination = function (page) {
  renderSearchPage(page);
};

const init = function () {
  recipeView.addHandlerRender(controlRecipes);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
};

init();
