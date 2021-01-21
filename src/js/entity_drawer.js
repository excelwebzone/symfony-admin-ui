import $ from 'jquery';
import _ from 'underscore';
import { initFormElements } from './apps/form_elements/init_form_elements';

export default class EntityDrawer {
  constructor() {
    this.$drawer = null;

    this.bindEvents();
  }

  bindEvents() {
    $(document).on('click', '.js-drawer-close', (e) => this.closeButton(e));
    $(document).on('click', '.js-entity-drawer-bulk-template', (e) => this.createFromBulkTemplate(e));
    $(document).on('row:selected', '.js-entity-drawer', (e) => this.loadEntityData(e));
  }

  hide() {
    $('.drawer-frame.filter-options').collapse('hide');

    if (this.$drawer) {
      this.$drawer.collapse('hide');
      this.$drawer.on('hidden.bs.collapse', (e) => {
        $(e.currentTarget).remove();
      });
    }

    this.$drawer = null;
  }

  closeButton(e) {
    $('.js-entity-drawer-bulk-template').removeClass('active');
    $('.datagrid-table-row.datagrid-selected').removeClass('datagrid-selected');

    this.hide();
  }

  loadEntityData(e) {
    this.hide();

    let $target = $(e.target);
    if (!$target.hasClass('js-entity-drawer')) {
      $target = $target.closest('.js-entity-drawer');
    }

    $target.removeClass('is-unread');

    const $template = $($target.data('template') || '#entityDrawerTemplate');

    $('body').append(_.template($template.html())({
      id: $target.data('id'),
      relatedId: $target.data('related-id'),
      title: $target.data('title'),
      subtitle: $target.data('subtitle'),
      initials: $target.data('initials'),
      icon: $target.data('icon'),
      photo: $target.data('photo'),
      isFollow: $target.data('is-follow') || false,
      isComplete: $target.data('is-complete') || false,
      hideComplete: $target.data('hide-complete') || false
    }));

    this.$drawer = $('.drawer-frame:not(.filter-options)');
    this.$drawer.collapse('show');
    this.$drawer.find('.js-block-request').trigger('block:load');

    $target.trigger('drawer:shown', this.$drawer);

    initFormElements(this.$drawer);
  }

  createFromBulkTemplate(e) {
    this.hide();

    let $target = $(e.target);
    if (!$target.hasClass('js-entity-drawer-bulk-template')) {
      $target = $target.closest('.js-entity-drawer-bulk-template');
    }

    if ($target.hasClass('active')) {
      $target.removeClass('active');

      return;
    }

    $('.datagrid-table-row.datagrid-selected').removeClass('datagrid-selected');

    $target.addClass('active');

    const template = $target.data('template');
    const args = $target.data('arguments') || {};
    const ids = [];

    for (let element of $('.js-bulk-select:checked')) {
      ids.push($(element).val());
    }

    if (ids.length === 0) {
      return;
    }

    $('body').append(_.template($(template).html())($.extend(args, { ids: ids })));

    this.$drawer = $('.drawer-frame:not(.filter-options)');
    this.$drawer.collapse('show');

    $target.trigger('drawer:shown', this.$drawer);

    initFormElements(this.$drawer);
  }
}
