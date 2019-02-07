import $ from 'jquery';
import interact from 'interactjs';
import uuidv4 from 'uuid/v4';

export default class ScrollableTabs {
  constructor(selectorEl) {
    this.initDomElements(selectorEl);
    this.bindEvents();
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

  bindEvents() {
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
}
