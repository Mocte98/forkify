import icons from 'url:../../img/icons.svg';
import { escapeHTML } from '../helpers.js';

// Métodos compartidos por las vistas de receta, resultados y paginación.
export default class View {
  _data;
  _messageTag = 'div';
  _errorMessage = 'Something went wrong. Please try again.';
  _message = '';

  render(data) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return this.renderError();
    }
    this._data = data;
    const markup = this._generateMarkup();
    this.clear();
    this._parentElement.insertAdjacentHTML('afterbegin', markup);
  }

  clear() {
    this._parentElement.innerHTML = '';
    this._parentElement.setAttribute('aria-busy', 'false');
  }

  renderSpinner() {
    this.clear();
    this._parentElement.setAttribute('aria-busy', 'true');
    this._parentElement.insertAdjacentHTML('afterbegin', `
      <${this._messageTag} class="spinner" role="status" aria-label="Loading">
        <svg aria-hidden="true"><use href="${icons}#icon-loader"></use></svg>
      </${this._messageTag}>
    `);
  }

  renderError(message = this._errorMessage) {
    this._renderNotice(message, 'error', 'alert-triangle');
  }

  renderMessage(message = this._message) {
    this._renderNotice(message, 'message', 'smile');
  }

  _renderNotice(message, className, icon) {
    this.clear();
    this._parentElement.insertAdjacentHTML('afterbegin', `
      <${this._messageTag} class="${className}" role="status">
        <div><svg aria-hidden="true"><use href="${icons}#icon-${icon}"></use></svg></div>
        <p>${escapeHTML(message)}</p>
      </${this._messageTag}>
    `);
  }
}
