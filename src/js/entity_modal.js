import $ from 'jquery';
import _ from 'underscore';
import toaster from './lib/utils/toaster';
import axios from './lib/utils/axios_utils';
import { initFormElements } from './apps/form_elements/init_form_elements';

const createModalEl = (modalName, className) => `
  <div class="modal ${className}" id="${modalName}">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-body">
          <div class="modal-spinner-container">
            <div class="modal-spinner">
              <div class="circle-spinner"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export default class EntityModal {
  constructor() {
    this.$modal = null;

    this.bindEvents();
  }

  bindEvents() {
    $(document).on('click', '.js-entity-modal', (e) => this.createAndOpen(e));
    $(document).on('click', '.js-entity-modal-template', (e) => this.createFromTemplate(e));
    $(document).on('click', '.js-entity-modal-bulk-template', (e) => this.createFromBulkTemplate(e));
  }

  createNewModal(modalName, className) {
    modalName = modalName || 'entity-modal';
    $(`#${modalName}`).remove();

    $('body').append(createModalEl(modalName, className || ''));

    this.$modal = $(`#${modalName}`);

    if (this.$modal.hasClass('is-static')) {
      this.$modal.modal({
        backdrop: 'static',
        keyboard: false
      });
    }

    this.$modal.modal('show');
  }

  loadContent(html) {
    this.$modal.find('.modal-content').html(html);
    this.$modal.find('[autofocus]').focus();

    if (this.$modal.find('.modal-form').data('size-large')) {
      this.$modal.find('.modal-dialog').addClass('modal-lg');
    }
    if (this.$modal.find('.modal-form').data('vertically-responsive')) {
      this.$modal.addClass('modal-vertically-responsive');
    }

    initFormElements(this.$modal);
  }

  createAndOpen(e) {
    let $target = $(e.target);
    if (!$target.hasClass('js-entity-modal')) {
      $target = $target.closest('.js-entity-modal');
    }

    this.createNewModal($target.data('modal-name'), $target.data('modal-class'));

    this.$modal.addClass('is-loading');

    axios.get($target.data('endpoint'))
      .then(({ data }) => {
        this.$modal.removeClass('is-loading');

        this.loadContent(data.html);

        $target.trigger('modal:shown', this.$modal);
      })
      .catch((e) => {
        this.$modal.removeClass('is-loading');
        this.$modal.modal('hide');
        this.$modal = null;

        if (e.response.data && e.response.data.error && e.response.data.error.message) {
          toaster(e.response.data.error.message, 'error');
        }
      });
  }

  createFromTemplate(e) {
    let $target = $(e.target);
    if (!$target.hasClass('js-entity-modal-template')) {
      $target = $target.closest('.js-entity-modal-template');
    }

    const template = $target.data('template');
    const args = $target.data('arguments') || {};

    this.createNewModal();
    this.loadContent(_.template($(template).html())(args));

    $target.trigger('modal:shown', this.$modal);
  }

  createFromBulkTemplate(e) {
    let $target = $(e.target);
    if (!$target.hasClass('js-entity-modal-bulk-template')) {
      $target = $target.closest('.js-entity-modal-bulk-template');
    }

    const template = $target.data('template');
    const args = $target.data('arguments') || {};
    const ids = [];

    for (let element of $('.js-bulk-select:checked')) {
      ids.push($(element).val());
    }

    if (ids.length === 0) {
      return;
    }

    this.createNewModal();
    this.loadContent(_.template($(template).html())($.extend(args, { ids: ids })));

    $target.trigger('modal:shown', this.$modal);
  }
}
