import $ from 'jquery';
import interact from 'interactjs';
import uuidv4 from 'uuid/v4';

export default class ScrollableTabs {
  constructor(selectorEl) {
    this.initDomElements(selectorEl);
    this.bindDraggableEvents();
    this.bindArrowsEvents();
  }

  initDomElements(selectorEl) {
    this.$selector = $(selectorEl);
    this.$drager = this.$selector.parent();

    this.$drager.scrollbar();
    this.$drager.scrollLeft();

    do {
      this.$selector.prop('id', uuidv4());
    } while (!isNaN(this.$selector.prop('id').substr(0, 1)));
  }

  bindDraggableEvents() {
    const self = this;

    interact(`#${self.$selector.prop('id')}`)
      .draggable({
        preventDefault: true,
        onstart: function() {
          self.$drager.addClass('is-dragging');
        },
        onmove: function(event) {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          self.$drager.scrollLeft(-x);
          target.setAttribute('data-x', x);
        },
        onend: function() {
          self.$drager.removeClass('is-dragging');
        }
      })
      .on('tap', function(event) {
        let $target = $(event.target);
        if (!$target.hasClass('tab')) {
          $target = $target.closest('.tab');
        }
        if ($target.length && event.pointerType === 'touch') {
          $target.click();
        }
      });
  }

  bindArrowsEvents() {
    const self = this;
    const $drager = self.$drager;

    // find the nearest ancestor container for arrows
    const $container = $drager.closest('.tabs-arrows');

    // amount to scroll per arrow click (in pixels)
    const SCROLL_AMOUNT = $container.data('scrollAmount') || 120;

    $container.find('.js-tab-left').on('click', function(e) {
      e.preventDefault();
      $drager.animate(
        { scrollLeft: $drager.scrollLeft() - SCROLL_AMOUNT },
        150
      );
    });

    $container.find('.js-tab-right').on('click', function(e) {
      e.preventDefault();
      $drager.animate(
        { scrollLeft: $drager.scrollLeft() + SCROLL_AMOUNT },
        150
      );
    });
  }
}
