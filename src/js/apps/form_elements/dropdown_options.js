import $ from 'jquery';
import _ from 'underscore';
import axios from '../../lib/utils/axios_utils';

// Create a FILTER pseudo class. Like CONTAINS, but case insensitive
$.expr[':'].filter = $.expr.createPseudo(function(arg) {
  return function(elem) {
    return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
  };
});

export default class DropdownOptions {
  constructor(containerEl) {
    this.$container = $(containerEl);

    this.preloadData();
    this.bindEvents();
  }

  preloadData() {
    for (let dropdown of this.$container.find('[data-toggle="dropdown"]')) {
      $(dropdown).dropdown('dispose');
      $(dropdown).dropdown();
    }

    for (let dropdown of this.$container.find('.js-select-dropdown')) {
      let $item = $(dropdown).find('.option-list-item.is-selected');
      if ($item.length === 0 && $(dropdown).closest('.form-property-container').length) {
        $item = $(dropdown).find('.option-list-item:first-child');
        $item.attr('selected', true);
      }
      if ($item.length) {
        let $text = $item.find('.option-list-item-text');
        if ($text.length === 0) {
          $text = $item.find('.option-list-info-item-text');
        }

        $(dropdown)
          .addClass('has-value')
          .find('.dropdown-text')
          .removeClass('dropdown-placeholder')
          .html($text.html());
      }
    }

    for (let dropdown of this.$container.find('.js-select-dropdown-multiple')) {
      for (let item of $(dropdown).find('.option-list-item.is-selected')) {
        $(item).hide();

        $(dropdown).find('.dropdown-tags').append(`
          <div class="tag tag-interactive">
            <div class="tag-display-name">${$(item).text()}</div>
            <span class="tag-action" data-value="${$(item).data('value')}">
              <i class="ledger-icons ledger-icon-close-circle"></i>
            </span>
          </div>
        `);
      }

      if ($(dropdown).find('.dropdown-tags .tag').length) {
        $(dropdown).addClass('has-value');
      }

      const $options = $(dropdown).find('.option-list').find('>ul');
      if ($options.find('.option-list-item.is-selected').length === $options.find('.option-list-item').length
        && $options.find('.option-list-label-empty').length === 0
      ) {
        $options.append('<li class="option-list-label option-list-label-empty"><div class="option-list-label-label">No Options Found</div></li>');
      }
    }

    for (let dropdown of this.$container.find('.js-autocomplete-dropdown[data-json]')) {
      const json = $(dropdown).data('json') || {};
      let $form = $(dropdown).closest('form');

      for (let [key, value] of Object.entries(json)) {
        const $fields = $form.find(`[data-mapped="${key}"]`);
        for (let field of $fields) {
          if ($(field).is('select')) {
            $(field).find(`option[value="${value}"]`).attr('selected', true);
            $(field).closest('.js-select-dropdown').find(`.option-list-item[data-value="${value}"]`).click();
          } else {
            $(field).val(value);
            $(field).trigger('change');
          }
        }
      }
    }
  }

  bindEvents() {
    if (this.$container[0].tagName.toLowerCase() !== 'body') {
      return;
    }

    this.$container.on('mouseover', '.option-list-item', this.mouseOver);
    this.$container.on('mouseout', '.option-list-item', this.mouseOut);
    this.$container.on('click', '.option-list-item:not(.option-list-item-action-button)', this.selectItem);
    this.$container.on('click', '.dropdown-tags .tag-action', this.removeTag);
    this.$container.on('click', '.dropdown-reset', this.resetValue);
    this.$container.on('keyup', '.dropdown-filter > .input-text', _.debounce(this.filterKeyUp, 1300));

    this.$container.on('shown.bs.dropdown', '.dropdown.has-filter', (e) => {
      $(e.currentTarget).find('.dropdown-filter > .input-text').focus();
    });
  }

  mouseOver() {
    const $dropdown = $(this).closest('.dropdown');

    $dropdown.find('.option-list-item').removeClass('is-highlighted');
    $(this).addClass('is-highlighted');
  }

  mouseOut() {
    const $dropdown = $(this).closest('.dropdown');

    $(this).removeClass('is-highlighted');
    $dropdown.find('.option-list-item.is-selected').addClass('is-highlighted');
  }

  selectItem(e) {
    if ($(e.target).hasClass('js-entity-modal') || $(e.target).hasClass('js-entity-modal-template')) {
      e.preventDefault();
      return;
    }

    const $dropdown = $(this).closest('.dropdown');
    $dropdown.addClass('has-value');

    if ($dropdown.hasClass('js-select-dropdown-multiple')) {
      $(this).addClass('is-selected').hide();

      $dropdown.find('.dropdown-tags').append(`
        <div class="tag tag-interactive">
          <div class="tag-display-name">${$(this).text()}</div>
          <span class="tag-action" data-value="${$(this).data('value')}">
            <i class="ledger-icons ledger-icon-close-circle"></i>
          </span>
        </div>
      `);

      const $select = $dropdown.find('select');
      if ($select) {
        $select.find('option[value="' + $(this).data('value') + '"]').prop('selected', $(this).hasClass('is-selected'));
        $select.trigger('change');
      }

      if ($dropdown.hasClass('js-autocomplete-dropdown')) {
        const $input = $dropdown.find('input[type=hidden]');
        if ($input) {
          const values = [$(this).data('value')];
          if ($input.val()) {
            values.push($input.val());
          }
          $input.val(values.join('|'));
          $input.trigger('change');
        }
      }

      const $options = $dropdown.find('.option-list').find('>ul');
      if ($options.find('li:visible').length === 0) {
        $options.append('<li class="option-list-label option-list-label-empty"><div class="option-list-label-label">No Options Found</div></li>');
      }

      e.stopPropagation();
      return;
    }

    $dropdown.find('.option-list-item').removeClass('is-highlighted is-selected');
    $(this).addClass('is-selected is-highlighted');

    if ($dropdown.find('.dropdown-text')) {
      let $text = $(this).find('.option-list-item-text');
      if ($text.length === 0) {
        $text = $(this).find('.option-list-info-item-text');
      }

      $dropdown.find('.dropdown-text').removeClass('dropdown-placeholder').html($text.html());
    }

    if ($dropdown.hasClass('js-select-dropdown')) {
      $dropdown.find('.dropdown-reset').show();

      const $select = $dropdown.find('select');
      if ($select) {
        $select.val($(this).data('value'));
        $select.trigger('change');
      }

      const $input = $dropdown.find('input[type=hidden]');
      if ($input) {
        $input.val($(this).data('value'));
        $input.trigger('change');
      }
    }

    if ($dropdown.hasClass('js-autocomplete-dropdown')) {
      $dropdown.find('.dropdown-reset').show();

      if ($dropdown.hasClass('trigger-mapping')) {
        $dropdown.trigger('dropdown:mapping', $(this).data('json') || {});
      }

      if (!$dropdown.hasClass('ignore-mapping')) {
        const json = $(this).data('json') || {};
        let $form = $dropdown.closest('form');

        for (let [key, value] of Object.entries(json)) {
          if (typeof value === 'object') {
            continue;
          }

          if (typeof value === 'string') {
            value = value.replace('&#39;', '\'');
          }

          const $fields = $form.find(`[data-mapped="${key}"]`);
          for (let field of $fields) {
            if ($(field).is('select')) {
              $(field).find(`option[value="${value}"]`).attr('selected', true);
              $(field).closest('.js-select-dropdown').find(`.option-list-item[data-value="${value}"]`).click();
            } else {
              $(field).val(value);
              $(field).trigger('change');
            }
          }
        }
      }

      const $input = $dropdown.find('input[type=hidden]');
      if ($input) {
        $input.val($(this).data('value'));
        $input.trigger('change');
      }
    }
  }

  resetValue() {
    const $dropdown = $(this).closest('.dropdown');
    $dropdown.removeClass('has-value');

    if ($dropdown.find('.dropdown-text')) {
      $dropdown.find('.dropdown-text').addClass('dropdown-placeholder').html($dropdown.data('placeholder') || '');
    }

    $dropdown.find('.dropdown-reset').hide();
    $dropdown.find('.option-list-item').removeClass('is-highlighted is-selected');

    if ($dropdown.hasClass('js-select-dropdown')) {
      const $select = $dropdown.find('select');
      if ($select) {
        $select.val('');
        $select.trigger('change');
      }

      const $input = $dropdown.find('input[type=hidden]');
      if ($input) {
        $input.val('');
        $input.trigger('change');
      }
    }

    if ($dropdown.hasClass('js-autocomplete-dropdown')) {
      const $input = $dropdown.find('input[type=hidden]');
      if ($input) {
        $input.val('');
        $input.trigger('change');
      }
    }
  }

  filterKeyUp() {
    const $dropdown = $(this).closest('.dropdown');
    const $options = $dropdown.find('.option-list').find('>ul');

    if ($dropdown.hasClass('js-autocomplete-dropdown') && $dropdown.data('endpoint')) {
      const exclude = [];

      if ($dropdown.hasClass('js-select-dropdown-multiple')) {
        for (let tagAction of $dropdown.find('.dropdown-tags .tag-action')) {
          exclude.push($(tagAction).data('value'));
        }
      }

      $options.html('<li class="option-list-loading"><div class="option-list-loading-spinner"><div class="circle-spinner"></div></div></li>');
      axios.get($dropdown.data('endpoint'), {
        params: {
          search: this.value,
          exclude: exclude
        }
      })
        .then(({ data }) => {
          $options.html('');

          if (data.count === 0) {
            $options.append('<li class="option-list-label option-list-label-empty"><div class="option-list-label-label">No Results Found</div></li>');
          }

          for (let [key, value] of Object.entries(data.options)) {
            let json = '';
            let options = '';
            if (_.isObject(value)) {
              if (value.extra) {
                for (let v of Object.values(value.extra)) {
                  options += `<span class="option-list-info-item-abbreviation">${v}</span>`;
                }
                delete value.extra;
              }
              if (value.data) {
                json = JSON.stringify(value.data).replace('\'', '&#39;');
              }
              value = value.label;
            }

            $options.append(`<li class="option-list-item" data-value="${key}" data-json=\'${json}\'>${options}<span class="option-list-item-text">${value}</span></li>`);
          }

          $dropdown.trigger('dropdown:autocomplete');
        });

      return;
    }

    const ignore = $dropdown.hasClass('js-select-dropdown-multiple')
      ? ':not(.is-selected)'
      : '';

    $options.find('.option-list-label-empty').remove();
    $options.find(`li${ignore}`).show();
    $options.find(`li${ignore}:not(:filter("${this.value}"))`).hide();

    if ($options.find('li:visible').length === 0) {
      $options.append('<li class="option-list-label option-list-label-empty"><div class="option-list-label-label">No Options Found</div></li>');
    }
  }

  removeTag() {
    const $dropdown = $(this).closest('.dropdown');
    $dropdown.find('.option-list-label-empty').remove();

    if ($dropdown.hasClass('js-select-dropdown-multiple')) {
      $dropdown
        .find('.option-list-item[data-value="' + $(this).data('value') + '"]')
        .removeClass('is-selected')
        .removeClass('is-highlighted')
        .show();

      const $select = $dropdown.find('select');
      if ($select) {
        $select.find('option[value="' + $(this).data('value') + '"]').prop('selected', false);
        $select.trigger('change');
      }

      if ($dropdown.hasClass('js-autocomplete-dropdown')) {
        const $input = $dropdown.find('input[type=hidden]');
        if ($input) {
          const values = $input.val().split('|');
          values.splice(values.indexOf($(this).data('value')), 1);
          $input.val(values.join('|'));
          $input.trigger('change');
        }
      }
    }

    $(this).closest('.tag').remove();

    if ($dropdown.find('.dropdown-tags .tag').length === 0) {
      $dropdown.removeClass('has-value');
    }
  }
}
