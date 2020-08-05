import $ from 'jquery';

export default class SwitchButton {
  constructor(containerEl) {
    this.$container = $(containerEl);

    this.bindEvents();
  }

  bindEvents() {
    this.$container.on('click', '.switch', (e) => this.toggle(e));
  }

  toggle(e) {
    const $checkbox = $(e.currentTarget).parent();

    $checkbox.toggleClass('checked');
    $checkbox
      .parent('.checkbox')
      .next('.switch-button-text')
      .toggleClass(' is-active');

    $checkbox
      .find('input[type="hidden"]')
      .val($checkbox.hasClass('checked') ? 1 : 0)
      .trigger('change');
  }
}
