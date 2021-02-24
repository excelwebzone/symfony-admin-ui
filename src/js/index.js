import './lib/commons/';
import './apps/';

// behaviors
import './lib/behaviors/';

// everything else
import bp from './breakpoints';
import vhCheck from './vh_check';
import initLayoutNav from './layout_nav';
import { mouseenter, debouncedMouseleave, togglePopover } from './lib/utils/popover';

document.addEventListener('beforeunload', () => {
  // unbind scroll events
  $(document).off('scroll');
  // close any open tooltips
  $('.has-tooltip, [data-toggle="tooltip"]').tooltip('dispose');
  // close any open popover
  $('[data-toggle="popover"]').popover('dispose');
});

document.addEventListener('DOMContentLoaded', () => {
  const $body = $('body');
  const $document = $(document);
  const $window = $(window);
  let bootstrapBreakpoint = bp.getBreakpointSize();

  vhCheck();
  initLayoutNav();

  // hide sidebar on mobile
  if (bootstrapBreakpoint === 'xs') {
    const $rightSidebar = $('sidebar, .application-content');

    $rightSidebar.removeClass('sidebar-collapsed');
  }

  // prevent default action for disabled buttons
  $('.btn').click(function clickDisabledButtonCallback(e) {
    if ($(this).hasClass('disabled')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }

    return true;
  });

  // initialize tooltips
  if (bootstrapBreakpoint !== 'xs') {
    $body.tooltip({
      selector: '.has-tooltip, [data-toggle="tooltip"]',
      placement(tip, el) {
        return $(el).data('placement') || 'bottom';
      }
    });
  }

  // initialize dropdowns
  $('[data-toggle="dropdown"]').dropdown();

  // initialize popovers
  $body
    .popover({
      selector: '[data-toggle="popover"]',
      trigger: 'focus',
      // set the viewport to the main content, excluding the navigation bar, so
      // the navigation can't overlap the popover
      viewport: '.application-content'
    })
    .on('mouseenter', '.js-popover-link', mouseenter)
    .on('mouseleave', '.js-popover-link', debouncedMouseleave())
    .on('show.bs.popover', (e) => {
      const $popover = $(e.target);
      if ($popover && $popover.hasClass('js-popover-link')) {
        const hideOnScroll = togglePopover.bind($popover, false);

        window.addEventListener('scroll', hideOnScroll, { once: true });
      }
    });

  // disable form buttons while a form is submitting
  $body.on('ajax:complete, ajax:beforeSend, submit', 'form', function ajaxCompleteCallback(e) {
    const $buttons = $('[type="submit"], .js-disable-on-submit', this);
    switch (e.type) {
      case 'ajax:beforeSend':
      case 'submit':
        return $buttons.disable();
      default:
        return $buttons.enable();
    }
  });

  $document.on('breakpoint:change', (e, breakpoint) => {
    if (breakpoint === 'sm' || breakpoint === 'xs') {
      // do something
    }
  });

  $window.on('resize.app', function fitSidebarForSize() {
    const oldBootstrapBreakpoint = bootstrapBreakpoint;
    bootstrapBreakpoint = bp.getBreakpointSize();

    if (bootstrapBreakpoint !== oldBootstrapBreakpoint) {
      $document.trigger('breakpoint:change', [bootstrapBreakpoint]);
    }
  });
});
