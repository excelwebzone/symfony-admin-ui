import $ from 'jquery';
import toaster from '../../lib/utils/toaster';
import axios from '../../lib/utils/axios_utils';
import 'jquery-ui/ui/widgets/sortable';

export default class SortableList {
  constructor(selectorEl) {
    this.initDomElements(selectorEl);
    this.bindEvents();
  }

  initDomElements(selectorEl) {
    this.$selector = $(selectorEl);
    this.$list = $(selectorEl).find(this.$selector.data('list') || '.sortable-list');
    this.endpoint = this.$selector.data('endpoint');
    this.dragHandleClass = this.$selector.data('drag-handle') || '.drag-handle';
    this.sortableItemClass = this.$selector.data('sortable-item') || '.sortable-item';
    this.isDraggingClass = this.$selector.data('is-dragging') || 'is-dragging';
    this.itemKey = this.$selector.data('item-key') || 'key';
    this.itemValue = this.$selector.data('item-value') || 'value';
  }

  bindEvents() {
    this.$list.sortable({
      axis: 'y',
      handle: this.dragHandleClass,
      items: this.sortableItemClass,
      start: (e, ui) => {
        ui.item.addClass(this.isDraggingClass);
      },
      stop: (e, ui) => {
        ui.item.removeClass(this.isDraggingClass);
      },
      update: (e, ui) => {
        const items = [];
        for (let item of this.$list.find(this.sortableItemClass)) {
          items.push($(item).data(this.itemKey));
        }

        const formData = new FormData();
        formData.set('items', items);

        axios.post(this.endpoint, formData)
          .then(() => {
            toaster(ui.item.data(this.itemValue) + ' reordered');
          });
      }
    });
  }
}
