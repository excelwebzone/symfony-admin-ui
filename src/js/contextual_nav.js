import _ from 'underscore';
import bp from './breakpoints';

export default class ContextualNav {
  constructor() {
    this.initDomElements();
    this.render();
  }

  initDomElements() {
    this.$page = $('.application-content');
    this.$category = $('.navigation-category');
    this.$toggleNavBtn = $('.js-navigation-toggle');
    this.$toggleNavIcon = $('.navigation-mobile-toggle-icon');
  }

  bindEvents() {
    this.$category.on('mouseover', this.mouseOver);
    this.$category.on('mouseout', this.mouseOut);
    this.$toggleNavBtn.on('click', () => this.toggleSidebarNav());

    $(window).on('resize', () => _.debounce(this.render(), 100));
  }

  mouseOver() {
    $(this).closest('.navigation-subnav').addClass('desktop-nav-is-open');
  }

  mouseOut() {
    $(this).closest('.navigation-subnav').removeClass('desktop-nav-is-open');
  }

  toggleSidebarNav() {
    this.$page.toggleClass('nav-is-open');
    this.$toggleNavIcon.toggleClass('material-icons');
    this.$toggleNavIcon.toggleClass('material-icons-extended');

    if (this.$toggleNavIcon.text() === 'menu') {
      this.$toggleNavIcon.text('close');
    } else {
      this.$toggleNavIcon.text('menu');
    }
  }

  render() {
    const breakpoint = bp.getBreakpointSize();

    this.$toggleNavIcon.removeClass('material-icons-extended');
    this.$toggleNavIcon.addClass('material-icons');
    this.$toggleNavIcon.text('menu');

    if (breakpoint === 'xs') {
      this.$page.removeClass('nav-is-open');

      _.each($('.glue-zippy-btn'), (element) => {
        const id = _.now();
        $(element).next().prop('id', id).hide();

        $(element).off('click');
        $(element).on('click', () => {
          $(element).next().toggle();
          $(element).parent().toggleClass('glue-is-expanded');
        });
      });
    } else {
      // force navigation to be hidden at all time (using sidebar and second menu)
      // this.$page.addClass('nav-is-open');
      this.$page.removeClass('nav-is-open');

      _.each($('.glue-zippy-btn'), (element) => {
        $(element).next().show();
        $(element).parent().removeClass('glue-is-expanded');
        $(element).off('click');
      });
    }
  }
}
