import View from './View.js';
import { escapeHTML } from '../helpers.js';

class ResultsView extends View {
  _parentElement = document.querySelector('.results');
  _messageTag = 'li';
  _errorMessage = 'No recipes found for your query. Try pizza, pasta or avocado.';

  _generateMarkup() {
    return this._data.map(this._generateMarkupPreview).join('');
  }

  _generateMarkupPreview(result) {
    const active = result.id === window.location.hash.slice(1);
    return `
      <li class="preview">
        <a class="preview__link ${active ? 'preview__link--active' : ''}"
          href="#${escapeHTML(result.id)}" ${active ? 'aria-current="true"' : ''}>
          <figure class="preview__fig">
            <img src="${escapeHTML(result.image)}" alt="${escapeHTML(result.title)}" loading="lazy" />
          </figure>
          <div class="preview__data">
            <h4 class="preview__title">${escapeHTML(result.title)}</h4>
            <p class="preview__publisher">${escapeHTML(result.publisher)}</p>
          </div>
        </a>
      </li>
    `;
  }
}

export default new ResultsView();
