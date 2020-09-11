import $ from 'jquery';
import _ from 'underscore';
import Pager from './pager';
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
    $(document).on('modal:shown', '.js-activity-item-action-delete', (e, modal) => this.removeItem(e, modal));
    $(document).on('modal:shown', '.js-activity-item-action-edit', (e, modal) => this.openItem(e, modal));
    $(document).on('input keydown change', '.js-activity-log-form [id$="_body"]', (e) => this.toggleExtraField(e));

    // toggle item
    $(document).on('click', '.activity-item-note', (e) => this.toggleActivityItemNote(e));

    // on block loaded
    $(document).on('block:loaded', '.js-activity-block', (e) => {
      const $target = $(e.currentTarget);
      const $dropdown = $target.find('.activity-list .dropdown');
      if ($dropdown.length === 0) {
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

      if (checked === 1) {
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
    if ($container.length === 0) {
      if ($sourceTarget.hasClass('dropdown')) {
        $container = $sourceTarget.closest('.activity-list');
      } else {
        $container = $sourceTarget.closest('.entity-activity').find('.activity-list');
      }
    }
    if ($container.length === 0) {
      $container = $('.activity-list');
    }

    const $list = $container.find('.activity-log-list');

    const callback = (data) => {
      if (data.page > 1 && data.count === 0) {
        return;
      }

      $list.append(data.html);

      let lastLabel = null;
      let $lastGroup = null;
      for (let label of $list.find('.is-labeled>.activity-item-label')) {
        if (!lastLabel || lastLabel !== $(label).html()) {
          lastLabel = $(label).html();
          $lastGroup = $(label).closest('.activity-item-group');
        } else {
          $(label).html('').parent('.is-labeled').removeClass('is-labeled');

          $(label).closest('.activity-item-group').contents().appendTo($lastGroup);
        }
      }

      $list.trigger('data:loaded', data);
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
      params = { types: types };
    } else if ($elements.length) {
      params = $elements.serializeObject();
    }

    pager.setPage(1);
    pager.setParams(params);
    pager.getData();
  }

  reloadList(e) {
    const $target = $(e.target);
    const $container = $($target.data('target')).find('.entity-activity');

    const $dropdown = $container.find('.activity-list .dropdown');
    if ($dropdown.length === 0) {
      this.getActivityList($container);
      return;
    }
    if ($dropdown.hasClass('multi-select-dropdown')) {
      this.updateSelectTypesText($dropdown);
    } else {
      $dropdown.find('.option-list-item.is-selected').click();
    }
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

        if ($container.find('.activity-item').length === 0) {
          $container.html('<div class="activity-log-list-empty-message">No Activities in this Activity Feed.</div>');
        }
      });
    });
  }

  openItem(e, modal) {
    const $modal = $(modal);
    const $container = $(e.target).closest('.activity-item-note');

    const $textarea = $modal.find('textarea');
    $textarea.val($container.find('.activity-item-body-field').val());

    if ($textarea.hasClass('js-text-editor')) {
      $textarea.trigger('content-changed');
    }

    $modal.find('.js-activity-item-action-save').on('click', (e, data) => {
      const $button = $(e.target);
      const $formGroup = $modal.find('.form-group');
      const $error = $formGroup.find('.form-control-error');

      // wait until done..
      if ($formGroup.hasClass('is-loading')) {
        return;
      }

      // remove old error
      $error.find('.invalid-feedback').remove();

      // remove all classes
      $formGroup.removeClass('is-loading is-invalid successed');

      // ignore empty parameters
      if (_.isEmpty($textarea.val())) {
        $textarea.focus();

        return;
      }

      // add loading
      $formGroup.addClass('is-loading');

      const params = {};
      params[$textarea.data('field') || 'note'] = $textarea.val();

      axios.put($button.data('endpoint'), params)
        .then(({ data }) => {
          // remove loading
          $formGroup.removeClass('is-loading');

          if (data.ok) {
            $formGroup.addClass('successed');

            $container.click();
            $container.find('.activity-item-body').html($textarea.val());
            $container.find('.activity-item-body-field').val($textarea.val());

            $modal.modal('hide');

            toaster('Updated Note');
          } else {
            $textarea.focus();
            $formGroup.addClass('is-invalid');

            $error.append(`<div class="invalid-feedback ${data.error.message.length > 30 ? 'multiline' : ''} d-block"><ul class="list-unstyled mb-0"><li><span class="initialism form-error-icon badge badge-danger">Error</span> <span class="form-error-message">${data.error.message}</span></li></ul></div>`);
          }
        })
        .catch(() => {
          // remove loading
          $formGroup.removeClass('is-loading');
        });
    });
  }

  toggleActivityItemNote(e) {
    if ($(e.target).closest('.activity-item-content').length) {
      e.stopPropagation();
      return;
    }

    $(e.currentTarget).removeClass('is-replying');
    $(e.currentTarget).toggleClass('is-expanded');
    $(e.currentTarget).find('.activity-item-expand-arrow>i')
      .toggleClass('zmdi-chevron-down')
      .toggleClass('zmdi-chevron-up');
  }
}
