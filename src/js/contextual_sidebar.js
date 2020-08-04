import $ from 'jquery';
import _ from 'underscore';
import Cookies from 'js-cookie';
import bp from './breakpoints';

export default class ContextualSidebar {
  constructor() {
    this.initDomElements();
    this.render();
  }

  initDomElements() {
    this.$page = $('.application-content');
    this.$sidebar = $('.sidebar');
    this.$overlay = $('.content-overlay');
    this.$toggleSidebar = $('.js-sidebar-toggle');
  }

  bindEvents() {
    this.$toggleSidebar.on('click', () => this.toggleSidebarNav());
    this.$overlay.on('click', () => this.toggleSidebarNav(false));

    $(window).on('resize', () => _.debounce(this.render(), 100));
  }

  static setCollapsedCookie(value) {
    if (bp.getBreakpointSize() !== 'lg') {
      return;
    }
    Cookies.set('sidebar_collapsed', value, { expires: 365 * 10 });
  }

  toggleSidebarNav(show) {
    if (show === null) {
      show = !this.$page.hasClass('sidebar-collapsed');
    }

    this.$page.toggleClass('sidebar-collapsed', show);

    ContextualSidebar.setCollapsedCookie(show);

    // hide when sidebar open
    for (let element of this.$sidebar.find('.icon-tooltip')) {
      if (!show) {
        $(element).tooltip({
          placement: 'right'
        });
      } else {
        $(element).tooltip('dispose');
      }
    }
  }

  render() {
    const breakpoint = bp.getBreakpointSize();

    if (breakpoint === 'lg') {
      const collapse = Cookies.get('sidebar_collapsed') === 'true';
      this.toggleSidebarNav(collapse);
    } else {
      this.toggleSidebarNav(false);
    }
  }
}
