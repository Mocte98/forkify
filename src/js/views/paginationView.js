import View from './View.js';
import icons from 'url:../../img/icons.svg';

class PaginationView extends View {
  _parentElement = document.querySelector('.pagination');

  addHandlerClick(handler) {
    this._parentElement.addEventListener('click', event => {
      const button = event.target.closest('.btn--inline');
      if (!button) return;
      handler(Number(button.dataset.goto));
    });
  }

  _generateMarkup() {
    const currentPage = this._data.page;
    const numPages = Math.ceil(this._data.results.length / this._data.resultsPerPage);
    if (numPages <= 1) return '';

    const previous = currentPage > 1 ? `
      <button type="button" class="btn--inline pagination__btn--prev" data-goto="${currentPage - 1}">
        <svg aria-hidden="true"><use href="${icons}#icon-arrow-left"></use></svg>
        <span>Page ${currentPage - 1}</span>
      </button>` : '';

    const next = currentPage < numPages ? `
      <button type="button" class="btn--inline pagination__btn--next" data-goto="${currentPage + 1}">
        <span>Page ${currentPage + 1}</span>
        <svg aria-hidden="true"><use href="${icons}#icon-arrow-right"></use></svg>
      </button>` : '';

    return `${previous}${next}`;
  }
}

export default new PaginationView();
