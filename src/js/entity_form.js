import $ from 'jquery';
import _ from 'underscore';
import toaster from './lib/utils/toaster';
import axios from './lib/utils/axios_utils';
import { objectToFormData } from './lib/utils/object_formdata_utils';
import { modifiedValues } from './lib/utils/modified_values';

export default class EntityForm {
  constructor(form) {
    this.bindEvents();
  }

  bindEvents() {
    $(document).on('change', '.form-group :input:not(.ignore-input)', this.resetField);

    $(document).on('submit', '.js-entity-form[data-submit]', (e) => this.submitForm(e));
    $(document).on('change', '.js-entity-form:not([data-submit]) :input:not(.ignore-input)', (e) => this.updateFieldData(e));

    $(document).on('click', '.checkbox-input.js-toggle-field', this.toggleField);
    $(document).on('click', '.js-entity-field', this.toggleEntityField);
  }

  resetField(e) {
    const $fieldGroup = $(e.currentTarget).closest('.form-group');

    $fieldGroup.removeClass('is-invalid');
    $fieldGroup.find('.form-control-error').html('');
  }

  toggleField(e) {
    const $field = $(e.currentTarget);
    const isChecked = $field.is(':checked');
    const targets = $field.data('targets');

    for (let target of targets) {
      $(target).prop('disabled', !isChecked);

      const $dropdown = $(target).closest('.dropdown');
      if ($dropdown) {
        $dropdown.toggleClass('is-disabled', !isChecked);
        $dropdown.find('.dropdown-selected').toggleClass('disabled', !isChecked);
      }
    }
  }

  toggleEntityField(e) {
    const $entityField = $(e.currentTarget).closest('.entity-field');
    $entityField.toggleClass('is-active');

    const $field = $entityField.find(':input:not(.ignore-input)');
    $field.prop('disabled', !$field.prop('disabled'));

    const $drawerContent = $entityField.closest('.bulk-edit-drawer-content');
    const $submit = $drawerContent.find('button[type="submit"]');

    $submit.addClass('disabled-light').disable();
    if ($drawerContent.find('.entity-field.is-active').length) {
      $submit.removeClass('disabled-light').enable();
    }
  }

  submitForm(e) {
    const $form = $(e.currentTarget);

    // set FormData object
    let params = $form.serializeObject();
    let formData = objectToFormData(params);
    const method = (formData.get('_method') || 'post').toLowerCase();
    if (method === 'delete') {
      delete params['_method']; // not needed

      formData = { data: params };
    }

    // remove for later usage
    params = params[$form.prop('name')];

    // reset errors
    const $formError = $form.find('.form-errors');
    $formError.html('');
    $form.find('.form-group').removeClass('is-invalid');
    $form.find('.form-control-error').html('');

    axios[method]($form.data('endpoint'), formData)
      .then(({ data }) => {
        if (data.ok) {
          if (_.isUndefined(data.label)) {
            data.label = '';
          }

          const $modal = $form.closest('.modal');
          if ($modal) {
            $modal.modal('hide');
            $modal.trigger('modal:hidden', data);
          }

          const $drawer = $form.closest('.drawer-frame');
          if ($drawer.length && $form.data('close-drawer')) {
            $drawer.find('.js-drawer-close').click();
            $drawer.trigger('drawer:hidden', data);
          }

          if (data.message) {
            toaster(data.message, 'default', data.actionConfig);
          }

          if ($form.data('reload')) {
            location.reload();
            return;
          }
          if ($form.data('reset')) {
            $form[0].reset();

            _.each($('textarea', $form), (textarea) => {
              $(textarea).trigger('keydown');
            });
          }
          if ($form.data('trigger')) {
            $form.trigger($form.data('trigger'));
          }
          if ($form.data('show-target')) {
            $($form.data('show-target')).show();
          }
          if ($form.data('hide-target')) {
            $($form.data('hide-target')).hide();
          }
          if ($form.data('toggle-target') && $form.data('toggle-class')) {
            $($form.data('toggle-target')).toggleClass($form.data('toggle-class'));
          }
          if ($form.data('move-target') && $form.data('move-id')) {
            $($form.data('move-target')).appendTo($form.data('move-id'));
          }

          if (data.fields) {
            for (let [field, value] of Object.entries(data.fields)) {
              modifiedValues($drawer, field, value, $($form.data('container') || 'body'));
            }
          }

          if (method === 'delete') {
            const removeRow = $form.data('remove-row');
            if (removeRow) {
              $(removeRow).fadeOut('slow', () => {
                $(removeRow).remove();
              });
            }

            if (!data.message) {
              toaster(data.label + ' deleted');
            }
          } else if (!data.message) {
            toaster(data.label + ' updated');
          }
        } else if (data.error && data.error.message) {
          const $modal = $form.closest('.modal');
          if ($modal) {
            $modal.modal('hide');
            $modal.trigger('modal:hidden', $.extend(params, data));
          }

          toaster(data.error.message, 'error', data.actionConfig);
        } else {
          $formError.html($(`
            <div class="banner-block banner-block-is-urgent">
              <div class="banner-block-row media">
                <div class="media-left">
                  <i class="zmdi zmdi-info banner-block-icon"></i>
                </div>
                <div class="media-body">
                  <div class="banner-block-title"></div>
                  <ul class="banner-block-content">
                    <li>${data.errors[0] || 'Oops, you\'ve got an error'}</li>
                  </ul>
                </div>
              </div>
            </div>
          `));

          _.each(data.errors, (message, field) => {
            if (field !== 0) {
              $form.find('#' + $form.prop('name') + '_' + field)
                .closest('.form-group')
                .addClass('is-invalid')
                .find('.form-control-error')
                .append(`<div class="invalid-feedback ${message[0].length > 30 ? 'multiline' : ''} d-block"><ul class="list-unstyled mb-0"><li><span class="initialism form-error-icon badge badge-danger">Error</span> <span class="form-error-message">${message[0]}</span></li></ul></div>`);
            }
          });
        }

        // $form.trigger('ajax:complete');
        $('[type="submit"], .js-disable-on-submit', $form).enable();
      });

    e && e.preventDefault();
  }

  updateFieldData(e) {
    let $target = $(e.currentTarget);

    // reset $target when value is not empty, otherwise exit
    if ($target.hasClass('typed-property-key-field')) {
      $target = $target.closest('.typed-property-item').find('.typed-property-value-field');
      if (_.isEmpty($target.val())) {
        return;
      }
    }

    const $form = $target.closest('form');
    const $formGroup = $target.closest('.form-group');
    let $element = $formGroup.find(':input');

    if ($target.data('related-fields')) {
      for (let e of $target.data('related-fields')) {
        $element = $.merge(
          $element,
          $(e)
            .closest('.form-group')
            .find(':input')
        );
      }
    }

    if ($target.is(':hidden') && !$target.hasClass('checkbox-input')) {
      $element = $target;
    }

    // hack: delete dynamic errors
    $formGroup.find('.form-control-error-dynamic').remove();

    let $error = $formGroup.find('.form-control-error');

    // wait until done..
    if ($formGroup.hasClass('is-loading')) {
      return;
    }

    // remove old error
    $error.find('.invalid-feedback').remove();

    // remove all classes
    $formGroup.removeClass('is-loading is-invalid successed');
    $formGroup.find('.typed-property-item').removeClass('is-invalid');

    // enabled all disabled fields
    const $disabledElement = $element.is(':disabled') ? $element : $element.find('[disabled]');
    if ($disabledElement) {
      $disabledElement.enable();
    }

    // set parameters to post
    let params = $element.serializeObject();
    if ($form.prop('name')) {
      params = params[$form.prop('name')];
    }

    // redisabled
    if ($disabledElement) {
      $disabledElement.disable();
    }

    // handle dropdown multi-select
    const $dropdown = $target.closest('.dropdown');
    if (_.isEmpty(params)
      && $dropdown.length
      && $dropdown.hasClass('js-select-dropdown-multiple')) {
      const matches = $target.prop('name').match(/(\w+)\[(\w+)\]/);

      params = {};
      params[matches[2]] = [];
    }

    // ignore empty parameters
    if (_.isEmpty(params)) {
      return;
    }

    // disabled all other values
    if ($target.hasClass('typed-property-value-field')) {
      $formGroup.find('.typed-property-key-dropdown').not($target.prev('.typed-property-key-dropdown')).addClass('is-disabled');
      $formGroup.find('.dropdown-selected').not($target.prev('.typed-property-key-dropdown').find('.dropdown-selected')).addClass('disabled');
      $formGroup.find('.typed-property-value-field').not($target).disable();

      // remove when value is empty
      $target.closest('.typed-property-item').trigger('blur');
    }

    // add loading
    $formGroup.addClass('is-loading');

    axios.put($form.data('endpoint'), params)
      .then(({ data }) => {
        // remove loading
        $formGroup.removeClass('is-loading');

        if (data.ok) {
          $formGroup.addClass('successed');

          // enabled all values
          if ($target.hasClass('typed-property-value-field')) {
            $formGroup.find('.typed-property-key-dropdown').removeClass('is-disabled');
            $formGroup.find('.dropdown-selected').removeClass('disabled');
            $formGroup.find('.typed-property-value-field').enable();
          }

          // update string for textarea or input fields
          for (let e of $element) {
            const $e = $(e);
            if (($e.is('textarea') || $e.is('input') || $e.hasClass('typed-property-key-field')) && data.fields) {
              for (let [field, value] of Object.entries(data.fields)) {
                const name = $e.prop('name');
                if (name.indexOf(`[${field}]`) > -1 || name === field) {
                  if ($element.prop('type') === 'color') {
                    value = `#${data.updatedValue}`;
                  }

                  if (value && typeof value === 'object') {
                    const regex = /([\w_]+)(\[([\w\d_]+)\])(\[([\w\d_]+)\])(\[([\w\d_]+)\])?/;
                    const m = regex.exec(name);

                    // invalid pattern
                    if (m === null) {
                      break;
                    }

                    // The result can be accessed through the `m`-variable.
                    m.forEach((match, groupIndex) => {
                      if (groupIndex > 0 && match && m[groupIndex - 1] === `[${match}]` && match !== field) {
                        value = value[match];
                      }
                    });
                  }

                  $e.val(value);

                  break;
                }
              }
            }
          }

          // update other location the field is found (on-the-fly)
          if ($form.prop('name')) {
            let $found;
            for (let e of $element) {
              if (!$(e).hasClass('ignore-input')
                && !$(e).hasClass('typed-property-key-field')
              ) {
                $found = $(e);
                break;
              }
            }
            if ($found.length) {
              let value = $found.val();
              if (value.length && $found.closest('.js-select-dropdown').length) {
                value = $found.closest('.js-select-dropdown').find('.dropdown-text').text();
              }

              let field = $found.prop('id').substring($form.prop('name').length + 1);
              const $fieldReference = $found.closest('[data-field-reference]');
              if ($fieldReference.length) {
                field = $fieldReference.data('field-reference');

                if (data.fields && data.fields[field]) {
                  value = data.fields[field];
                }
              }

              const $drawer = $found.closest('.drawer-frame');
              const $container = $($form.data('container') || 'body');

              // single field
              modifiedValues($drawer, field, value, $container);

              // any other fields
              if (data.fields) {
                for (let [field, value] of Object.entries(data.fields)) {
                  modifiedValues($drawer, field, value, $container);
                }
              }
            }
          }

          if ($form.data('trigger')) {
            $form.trigger($form.data('trigger'), data);
          }

          toaster(data.label + ' updated');
        } else {
          $element.focus();

          if ($target.hasClass('typed-property-value-field')) {
            $target.closest('.typed-property-item').addClass('is-invalid');
            $target.focus();

            $('<div class="form-control-error form-control-error-dynamic"></div>').insertAfter($target);
            $error = $formGroup.find('.form-control-error-dynamic');
          } else {
            $formGroup.addClass('is-invalid');
          }

          $error.append(`<div class="invalid-feedback ${data.error.message.length > 30 ? 'multiline' : ''} d-block"><ul class="list-unstyled mb-0"><li><span class="initialism form-error-icon badge badge-danger">Error</span> <span class="form-error-message">${data.error.message}</span></li></ul></div>`);
        }
      })
      .catch(() => $formGroup.removeClass('is-loading'));
  }
}
