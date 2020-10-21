import $ from 'jquery';
import _ from 'underscore';
import bp from './breakpoints';

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
    if (this.$menu.length === 0) {
      return;
    }

    const extraLiHide = parseInt(this.$menu.data('hideExtraLi')) || 0;

    let menuRect = this.$menu[0].getBoundingClientRect();
    let liTotalWidth = 0;
    let liCount = 0;

    this.$menu
      .children('ul')
      .children('li.navigation-morenav')
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

    // force at least one item
    if (possibleLi <= 0) {
      possibleLi = 1;
    }

    if (liCount > possibleLi) {
      const wrapper = this.createWrapperLI();
      for (let i = possibleLi; i < liCount; i++) {
        var currentLi = this.$menu
          .children('ul')
          .children('li')
          .eq(i);

        const clone = currentLi.clone();
        clone.children('ul').addClass('navigation-subnav');
        wrapper.children('ul').append(clone);
        currentLi.hide();
      }
    }

    const breakpoint = bp.getBreakpointSize();

    if (breakpoint !== 'lg') {
      _.each(this.$menu.find('.navigation-item-button'), (element) => {
        const id = _.now();
        $(element).next().prop('id', id).hide();

        $(element).off('click');
        $(element).on('click', () => {
          $(element).next().toggle();
          $(element).parent().toggleClass('is-expanded');
        });
      });
    } else {
      _.each(this.$menu.find('.navigation-item-button'), (element) => {
        $(element).next().css('display', '');
        $(element).parent().removeClass('is-expanded');
        $(element).off('click');
      });
    }
  }

  createWrapperLI() {
    this.$menu.children('ul').append('<li class="navigation-morenav"><a href="javascript:void(0)"><span class="title"><i class="ledger-icons ledger-icon-more"></i></span></a><ul></ul></li>');

    return this.$menu.children('ul').children('li.navigation-morenav');
  }
}
