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
        preventDefault: 'auto',
        onmove: function(event) {
          const target = event.target;

          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;

          // translate the element

          const inverseX = -(x);

          self.$drager.scrollLeft(inverseX);
          target.setAttribute('data-x', x);
        }
      })
      .on('tap', function(event) {
        // because draggable blocks click event on touch, do manual trigger
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

    // find the arrows within the tabs
    const $tabs = self.$selector;
    const $drager = self.$drager;

    // amount to scroll per click (you can adjust this)
    const SCROLL_AMOUNT = 120;

    // left arrow click
    $drager.prev('.js-tab-left').on('click', function(e) {
      e.preventDefault();
      $drager.animate(
        { scrollLeft: $drager.scrollLeft() - SCROLL_AMOUNT },
        150
      );
    });

    // right arrow click
    $drager.next('.js-tab-right').on('click', function(e) {
      e.preventDefault();
      $drager.animate(
        { scrollLeft: $drager.scrollLeft() + SCROLL_AMOUNT },
        150
      );
    });
  }
}
