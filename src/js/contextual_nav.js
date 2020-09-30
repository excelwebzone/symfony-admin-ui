import $ from 'jquery';
import _ from 'underscore';

export default class ContextualNav {
  constructor() {
    this.initDomElements();
    this.render();
  }

  initDomElements() {
    this.$menu = $('.navigation-main');
  }

  bindEvents() {
    this.$menu.on('mouseover', '> ul > li', this.mouseOver);
    this.$menu.on('mouseout', '> ul > li', this.mouseOut);

    $(window).on('resize', () => _.debounce(this.render(), 100));
  }

  mouseOver() {
    $(this)
      .addClass('open')
      .siblings()
      .removeClass('open opening');

    if ($(this).find('ul').length === 0) {
      return;
    }

    $(this).addClass('opening');
  }

  mouseOut() {
    if ($(this).find('ul').length === 0) {
      return;
    }

    $(this)
      .addClass('closing')
      .removeClass('open opening closing');
  }

  render() {
    const extraLiHide = parseInt(this.$menu.data('hideExtraLi')) || 0;
    if (this.$menu.length === 0) {
      return;
    }

    let menuRect = this.$menu[0].getBoundingClientRect();
    let liTotalWidth = 0;
    let liCount = 0;

    this.$menu
      .children('ul')
      .children('li.is-more')
      .remove();

    this.$menu
      .children('ul')
      .children('li')
      .each(function(index) {
        $(this).removeAttr('style');
        liTotalWidth = liTotalWidth + $(this).outerWidth(true);
        liCount++;
      });

    let possibleLi = parseInt(menuRect.width / (liTotalWidth / liCount)) - 1;
    possibleLi = possibleLi - extraLiHide;

    if (liCount > possibleLi) {
      const wrapper = this.createWrapperLI();
      for (let i = possibleLi; i < liCount; i++) {
        var currentLi = this.$menu
          .children('ul')
          .children('li')
          .eq(i);

        const clone = currentLi.clone();
        clone.children('ul').addClass('sub-menu');
        wrapper.children('ul').append(clone);
        currentLi.hide();
      }
    }
  }

  createWrapperLI() {
    this.$menu.children('ul').append('<li class="is-more"><a href="javascript:void(0)"><span class="title"><i class="ledger-icons ledger-icon-more"></i></span></a><ul></ul></li>');

    return this.$menu.children('ul').children('li.is-more');
  }
}
