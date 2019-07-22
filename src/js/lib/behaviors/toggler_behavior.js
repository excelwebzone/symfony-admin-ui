import $ from 'jquery';
import { getLocationHash } from '../utils/url_utility';

// Toggle button. Show/hide content inside parent container.
// Button does not change visibility. If button has icon - it changes chevron style.
//
// %div.js-toggle-container
//   %button.js-toggle-button
//   %div.js-toggle-content
//

$(() => {
  function toggleContainer($container, toggleState) {
    $container
      .toggleClass('is-expanded', toggleState !== undefined ? !toggleState : undefined);
    /*
      .find('>.js-toggle-button .zmdi-chevron-up, >.js-toggle-button .zmdi-chevron-down')
      .toggleClass('zmdi-chevron-up', toggleState)
      .toggleClass('zmdi-chevron-down', toggleState !== undefined ? !toggleState : undefined);
    */

    $container
      .find('>.js-toggle-content')
      .toggle(toggleState);
  }

  $('body').on('click', '.js-toggle-button', function toggleButton(e) {
    e.currentTarget.classList.toggle(e.currentTarget.dataset.toggleOpenClass || 'open');

    if (e.target.tagName.toLowerCase() === 'a'
      || $(e.target).hasClass('js-toggle-ignore')
      || $(e.target).closest('.js-toggle-ignore').length
    ) {
      return;
    }

    const $container = $($(this).closest('.js-toggle-container'));
    toggleContainer($container);

    if ($container.hasClass('is-expanded')) {
      const $element = $(e.currentTarget.dataset.toggleFocus);
      if ($element) {
        $element.focus();
      }

      if (e.currentTarget.dataset.triggerEvent) {
        $(e.currentTarget).trigger(e.currentTarget.dataset.triggerEvent);
      }
    }

    const targetTag = e.currentTarget.tagName.toLowerCase();
    if (targetTag === 'a' || targetTag === 'button') {
      e.preventDefault();
    }
  });

  // If we're accessing a permalink, ensure it is not inside a
  // closed js-toggle-container!
  const hash = getLocationHash();
  const anchor = hash && document.getElementById(hash);
  const container = anchor && $(anchor).closest('.js-toggle-container');

  if (container) {
    toggleContainer(container, true);
    anchor.scrollIntoView();
  }
});
