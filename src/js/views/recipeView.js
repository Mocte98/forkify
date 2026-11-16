import View from './View.js';
import icons from 'url:../../img/icons.svg';
import { Fraction } from 'fractional';
import { escapeHTML, getSafeUrl } from '../helpers.js';

class RecipeView extends View {
  _parentElement = document.querySelector('.recipe');
  _errorMessage = 'We could not find that recipe. Please try another one!';
  _message = 'Start by searching for a recipe or an ingredient. Try pizza, pasta or avocado!';

  addHandlerRender(handler) {
    ['hashchange', 'load'].forEach(event => window.addEventListener(event, handler));
  }

  _generateMarkupIngredient(ingredient) {
    const quantity = ingredient.quantity ? new Fraction(ingredient.quantity).toString() : '';
    return `
      <li class="recipe__ingredient">
        <svg class="recipe__icon" aria-hidden="true"><use href="${icons}#icon-check"></use></svg>
        <div class="recipe__quantity">${escapeHTML(quantity)}</div>
        <div class="recipe__description">
          <span class="recipe__unit">${escapeHTML(ingredient.unit)}</span>
          ${escapeHTML(ingredient.description)}
        </div>
      </li>
    `;
  }

  _generateMarkup() {
    const recipe = this._data;
    return `
      <figure class="recipe__fig">
        <img src="${escapeHTML(recipe.image)}" alt="${escapeHTML(recipe.title)}" class="recipe__img" />
        <h1 class="recipe__title"><span>${escapeHTML(recipe.title)}</span></h1>
      </figure>

      <div class="recipe__details">
        <div class="recipe__info">
          <svg class="recipe__info-icon" aria-hidden="true"><use href="${icons}#icon-clock"></use></svg>
          <span class="recipe__info-data recipe__info-data--minutes">${escapeHTML(recipe.cookTime)}</span>
          <span class="recipe__info-text">minutes</span>
        </div>
        <div class="recipe__info">
          <svg class="recipe__info-icon" aria-hidden="true"><use href="${icons}#icon-users"></use></svg>
          <span class="recipe__info-data recipe__info-data--people">${escapeHTML(recipe.servings)}</span>
          <span class="recipe__info-text">servings</span>
        </div>
      </div>

      <div class="recipe__ingredients">
        <h2 class="heading--2">Recipe ingredients</h2>
        <ul class="recipe__ingredient-list">
          ${recipe.ingredients.map(ingredient => this._generateMarkupIngredient(ingredient)).join('')}
        </ul>
      </div>

      <div class="recipe__directions">
        <h2 class="heading--2">How to cook it</h2>
        <p class="recipe__directions-text">
          This recipe was carefully designed and tested by
          <span class="recipe__publisher">${escapeHTML(recipe.publisher)}</span>.
          Please check out directions at their website.
        </p>
        <a class="btn--small recipe__btn" href="${escapeHTML(getSafeUrl(recipe.sourceUrl))}"
          target="_blank" rel="noopener noreferrer">
          <span>Directions</span>
          <svg class="search__icon" aria-hidden="true"><use href="${icons}#icon-arrow-right"></use></svg>
        </a>
      </div>
    `;
  }
}

export default new RecipeView();
