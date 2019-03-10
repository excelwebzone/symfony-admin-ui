import $ from 'jquery';
import _ from 'underscore';
import { initFormElements } from './apps/form_elements/init_form_elements';

export default class EntityDrawer {
  constructor() {
    this.$drawer = null;
    this.isBulk = false;

    this.bindEvents();
  }

  bindEvents() {
    $(document).on('click', '.js-drawer-close', (e) => this.closeButton(e));
    $(document).on('click', '.js-entity-drawer-bulk-template', (e) => this.createFromBulkTemplate(e));
    $(document).on('row:selected', '.js-entity-drawer', (e) => this.loadEntityData(e));

    $('.js-bulk-select-all').on('click', (e) => this.selectAllRows(e));
    $(document).on('click', '.js-bulk-select', (e) => this.selectRow(e));
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
    this.isBulk = false;
  }

  closeButton(e) {
    $('.js-entity-drawer-bulk-template').removeClass('active');
    $('.ember-table-table-row.ember-table-selected').removeClass('ember-table-selected');

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
      title: $target.data('title'),
      subtitle: $target.data('subtitle'),
      initials: $target.data('initials'),
      icon: $target.data('icon'),
      photo: $target.data('photo'),
      isFollow: $target.data('is-follow') || false,
      isComplete: $target.data('is-complete') || false
    }));

    this.$drawer = $('.drawer-frame:not(.filter-options)');
    this.$drawer.collapse('show');
    this.$drawer.find('.js-block-request').trigger('block:load');

    $target.trigger('drawer:shown', this.$drawer);

    initFormElements(this.$drawer);
  }

  selectAllRows(e) {
    if (!this.isBulk || !this.$drawer) {
      return;
    }

    $('.js-bulk-select').prop('checked', $(e.currentTarget).is(':checked'));

    this.selectRow();
  }

  selectRow(e) {
    if (!this.isBulk || !this.$drawer) {
      return;
    }

    this.$drawer.find('[name="ids[]"]').remove();

    let checked = 0;
    for (let element of $('.js-bulk-select')) {
      if ($(element).is(':checked')) {
        this.$drawer.find('.bulk-edit-drawer-form').append(
          `<input type="hidden" name="ids[]" value="${$(element).val()}" />`
        );

        checked++;
      }
    }

    if (checked === 0) {
      this.closeButton();
      return;
    }

    this.$drawer.find('.bulk-edit-drawer-title>span:eq(0)').text(checked);

    const $span = this.$drawer.find('.bulk-edit-drawer-title>span:eq(1)');
    $span.text(checked === 1 ? $span.data('singular') : $span.data('plural'));
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

    $('.ember-table-table-row.ember-table-selected').removeClass('ember-table-selected');

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

    setTimeout(() => {
      this.$drawer.find('.bulk-edit-drawer-loading').hide();
      this.$drawer.find('.bulk-edit-drawer-fields').show();
    }, 600);

    this.isBulk = true;

    $target.trigger('drawer:shown', this.$drawer);

    initFormElements(this.$drawer);
  }
}
