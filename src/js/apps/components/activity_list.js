import $ from 'jquery';
import _ from 'underscore';
import Pager from './pager';
import TextEditor from '../form_elements/text_editor';
import toaster from '../../lib/utils/toaster';
import axios from '../../lib/utils/axios_utils';

export default class ActivityList {
  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    // prevent from menu from closing
    $(document).on('click', '[class*="js-multi-select"], [class*="js-activity-item-action-"], .activity-item-content>div', (e) => {
      e.stopPropagation();
    });

    // filter list
    $(document).on('click', '.js-activity-list-dropdown .option-list-item', (e) => this.selectSingleType(e));
    $(document).on('click', '.activity-list-filter .js-multi-select-all .checkbox-input', (e) => this.selectAllTypes(e));
    $(document).on('click', '.activity-list-filter .js-multi-select .checkbox-input', (e) => this.selectType(e));
    $(document).on('reload:list', '.js-activity-log-form', (e) => this.reloadList(e));

    // handle actions
    $(document).on('click', '.js-activity-log-form-reset', (e) => this.resetForm(e));
    $(document).on('modal:shown', '.js-activity-item-action-delete', (e, modal) => this.removeItem(e, modal));
    $(document).on('click', '.js-activity-item-action-edit', (e) => this.openItemForm(e));
    $(document).on('click', '.js-activity-item-action-cancel', (e) => this.closeItemForm(e));
    $(document).on('click', '.js-activity-item-action-save', (e) => this.saveItemForm(e));
    $(document).on('input keydown change', '.js-activity-log-form [id$="_body"]', (e) => this.toggleExtraField(e));

    // toggle item
    $(document).on('click', '.activity-item-note', (e) => this.toggleActivityItemNote(e));

    // on block loaded
    $(document).on('block:loaded', '.js-activity-block', (e) => {
      const $target = $(e.currentTarget);
      const $dropdown = $target.find('.activity-list .dropdown');
      if (0 === $dropdown.length) {
        this.getActivityList($target);
        return;
      }
      if ($dropdown.hasClass('multi-select-dropdown')) {
        this.updateSelectTypesText($dropdown);
      } else {
        $dropdown.find('.option-list-item.is-selected').click();
      }
    });
  }

  selectSingleType(e) {
    const $target = $(e.currentTarget);
    const $dropdown = $target.closest('.dropdown');

    // update text
    $dropdown.find('.dropdown-text').text($target.text());

    this.getActivityList($dropdown, [$target.data('value')]);
  }

  selectAllTypes(e) {
    const $dropdown = $(e.target).closest('.multi-select-dropdown');
    $dropdown.find('.js-multi-select .checkbox-input').prop('checked', $(e.target).is(':checked'));

    this.updateSelectTypesText($dropdown);
  }

  selectType(e) {
    const $dropdown = $(e.target).closest('.multi-select-dropdown');

    let checked = 0;
    for (let element of $dropdown.find('.js-multi-select .checkbox-input')) {
      if ($(element).is(':checked')) {
        checked++;
      }
    }

    $dropdown.find('.js-multi-select-all .checkbox-input').prop('checked', checked === $dropdown.find('.js-multi-select').length);

    this.updateSelectTypesText($dropdown);
  }

  updateSelectTypesText($dropdown) {
    const $text = $dropdown.find('.dropdown-text');

    if ($dropdown.find('.js-multi-select-all .checkbox-input').is(':checked')) {
      $text.text('All Activities');
    } else {
      let checked = 0;
      for (let element of $dropdown.find('.js-multi-select .checkbox-input')) {
        if ($(element).is(':checked')) {
          checked++;
        }
      }

      if (1 === checked) {
        $text.text('1 Activity Type');
      } else if (checked) {
        $text.text(checked + ' Activity Types');
      } else {
        $text.text('No Activity Type Selected');
      }
    }

    this.getActivityList($dropdown);
  }

  getActivityList($sourceTarget, types = null) {
    let $container = $sourceTarget.find('.activity-list');
    if (0 === $container.length) {
      if ($sourceTarget.hasClass('dropdown')) {
        $container = $sourceTarget.closest('.activity-list');
      } else {
        $container = $sourceTarget.closest('.entity-activity').find('.activity-list');
      }
    }
    if (0 === $container.length) {
      $container = $('.activity-list')
    }

    const $list = $container.find('.activity-log-list');

    const callback = (data) => {
      if (data.page > 1 && 0 === data.count) {
        return;
      }

      $list.append(data.html);

      let lastLabel = null;
      for (let label of $list.find('.is-labeled>.activity-item-label')) {
        if (!lastLabel || lastLabel != $(label).html()) {
          lastLabel = $(label).html();
        } else {
          $(label).html('').parent('.is-labeled').removeClass('is-labeled');
        }
      }
    };

    const pager = new Pager($container, null, $('.activity-list-loading-row'), false, callback);

    $(document).off('click', '.activity-list .js-load-more');
    $(document).on('click', '.activity-list .js-load-more', (e) => {
      $(e.currentTarget).remove();

      pager.getData();
    });

    // reset data
    $list.html('');

    let params = {};
    const $elements = $container.find('.activity-list-filter :input');

    if (types) {
      params = {types: types};
    } else if ($elements.length) {
      params = $elements.serializeObject();
    }

    pager.setPage(1);
    pager.setParams(params);
    pager.getData();
  }

  reloadList(e) {
    const $target = $(e.target);
    const $container = $target.data('target')
      ? $($target.data('target')).find('.entity-activity')
      : $target.closest('.entity-activity');

    const $dropdown = $container.find('.activity-list .dropdown');
    if (0 === $dropdown.length) {
      this.getActivityList($container);
      return;
    }
    if ($dropdown.hasClass('multi-select-dropdown')) {
      this.updateSelectTypesText($dropdown);
    } else {
      $dropdown.find('.option-list-item.is-selected').click();
    }
  }

  resetForm(e) {
    const $form = $(e.currentTarget).closest('form');
    const $body = $form.find('[id$="_body"]');
    $body.val('')
      .trigger('change')
      .trigger('content-changed');
    $form.find('button[type=submit]').disable();
  }

  toggleExtraField(e) {
    const $bodyField = $(e.currentTarget);

    if ($bodyField.val().length) {
      $('.js-activity-log-form-extra').show();
    } else {
      $('.js-activity-log-form-extra').hide();
    }
  }

  removeItem(e, modal) {
    $(modal).find('form').on('remove:item', (e, data) => {
      const $item = $($(e.target).data('entity-item'));
      if ($item.hasClass('is-labeled')) {
        const $nextItem = $item.next('.activity-item');
        if (!$nextItem.hasClass('is-labeled')) {
          $nextItem.addClass('is-labeled');
          $nextItem.prepend($item.find('.activity-item-label'));
        }
      }

      $item.fadeOut('slow', () => {
        const $container = $item.closest('.activity-log-list');

        $item.remove();

        if (0 === $container.find('.activity-item').length) {
          $container.html('<div class="activity-log-list-empty-message">No Activities in this Activity Feed.</div>');
        }
      });
    });
  }

  openItemForm(e) {
    const $container = $(e.target).closest('.activity-item-note');
    $container.addClass('is-editable');

    const $textarea = $container.find('textarea');
    $textarea.trigger('keydown');

    if ($textarea.hasClass('js-froala-editor')) {
      new TextEditor($textarea);
    }
  }

  closeItemForm(e) {
    const $container = $(e.target).closest('.activity-item-note');
    $container.removeClass('is-editable');

    const $textarea = $container.find('textarea');
    $textarea
      .val($container.find('.activity-item-body').html())
      .trigger('keydown');

    if ($textarea.hasClass('js-froala-editor')) {
      $textarea.froalaEditor('html.set', $textarea.val());
    }
  }

  saveItemForm(e) {
    const $button = $(e.target);
    const $cancelButton = $(e.target).prev('.js-activity-item-action-cancel');
    const $container = $button.closest('.activity-item-note');
    const $formGroup = $container.find('.form-group');
    const $error = $formGroup.find('.form-control-error');
    const $textarea = $formGroup.find('textarea');

    // wait until done..
    if ($formGroup.hasClass('is-loading')) {
      return;
    }

    // remove old error
    $error.find('.invalid-feedback').remove();

    // remove all classes
    $formGroup.removeClass('is-loading is-invalid successed')

    // ignore empty parameters
    if (_.isEmpty($textarea.val())) {
      $textarea.focus();

      return;
    }

    // add loading
    $formGroup.addClass('is-loading');

    $button.disable();
    $cancelButton.disable();

    const params = {};
    params[$textarea.data('field') || 'note'] = $textarea.val();

    axios.put($button.data('endpoint'), params)
      .then(({ data }) => {
        $button.enable();
        $cancelButton.enable();

        // remove loading
        $formGroup.removeClass('is-loading');

        if (data.ok) {
          $formGroup.addClass('successed');

          $container.click();
          $container.find('.activity-item-body').html($textarea.val());

          toaster('Updated');
        } else {
          $textarea.focus();
          $formGroup.addClass('is-invalid');

          $error.append(`<div class="invalid-feedback ${data.error.message.length>30?'multiline':''} d-block"><ul class="list-unstyled mb-0"><li><span class="initialism form-error-icon badge badge-danger">Error</span> <span class="form-error-message">${data.error.message}</span></li></ul></div>`);
        }
      })
      .catch(() => {
        $button.enable();
        $cancelButton.enable();

        // remove loading
        $formGroup.removeClass('is-loading');
      });
  }

  toggleActivityItemNote(e) {
    if ($(e.target).closest('.activity-item-content').length
      || $(e.target).closest('.activity-item-footer').length
    ) {
      e.stopPropagation();
      return;
    }

    $(e.currentTarget).removeClass('is-editable').removeClass('is-replying');
    $(e.currentTarget).toggleClass('is-expanded');
    $(e.currentTarget).find('.activity-item-expand-arrow>i')
      .toggleClass('zmdi-chevron-down')
      .toggleClass('zmdi-chevron-up');
  }
};
