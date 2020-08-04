import $ from 'jquery';
import _ from 'underscore';

export default class ContextualNav {
  constructor() {
    this.initDomElements();
    this.render();
  }

  initDomElements() {
    this.$category = $('.navigation-category');
  }

  bindEvents() {
    this.$category.on('mouseover', this.mouseOver);
    this.$category.on('mouseout', this.mouseOut);

    $(window).on('resize', () => _.debounce(this.render(), 100));
  }

  mouseOver() {
    $(this)
      .closest('.navigation-subnav')
      .addClass('nav-is-open');
  }

  mouseOut() {
    $(this)
      .closest('.navigation-subnav')
      .removeClass('nav-is-open');
  }

  render() {
    _.each($('.glue-zippy-btn'), element => {
      $(element)
        .next()
        .show();
      $(element)
        .parent()
        .removeClass('glue-is-expanded');
      $(element).off('click');
    });
  }
}
