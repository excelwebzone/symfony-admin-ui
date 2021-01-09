import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import toaster from '../../lib/utils/toaster';
import axios from '../../lib/utils/axios_utils';
import { withoutEmpty } from '../../lib/utils/form_parsing';
import { getParameterValues } from '../../lib/utils/url_utility';
import { dateRanges, getDateRange, initTagsPicker, initDateRangePicker } from './filter_range';

const filterItemLI = (id, title, filters) => `
  <li class="option-list-item option-list-item-filter option-list-item-has-overflow js-filter-item" data-id="${id}" data-filter='${filters}'>
    <div class="option-list-item-right-content">
      <div class="option-list-item-hover-content">
        <i class="ledger-icons ledger-icon ledger-icon-lock"></i>
      </div>
    </div>
    <div class="option-list-item-text">${title}</div>
  </li>
`;

export default class Filter {
  constructor(containerEl) {
    this.currentFilter = {};
    this.filters = '{}';
    this.isLoading = false;
    this.compareCheck = true;

    this.initDomElements(containerEl);
    this.bindEvents();

    for (let picker of this.$form.find('.js-daterangepicker')) {
      initDateRangePicker(picker);
    }

    for (let picker of this.$form.find('.js-tagspicker')) {
      initTagsPicker(picker);
    }

    // @hack: remove "empty" unselected values
    for (let checkbox of this.$form.find('input.checkbox-input')) {
      $(checkbox).prev().remove();
    }
  }

  initDomElements(containerEl) {
    this.$container = containerEl ? $(containerEl) : $('body');

    this.$form = this.$container.find('.js-filter-form > form');
    this.$searchField = this.$container.find('.list-search .input-text');
    this.$clearButton = this.$container.find('.js-filter-clear-button');
    this.$saveButton = this.$container.find('.js-filter-save-button');
    this.$updateButton = this.$container.find('.js-filter-update-button');
    this.$counter = this.$container.find('.js-filter-counter');
    this.$noPrivateFilters = this.$container.find('.js-no-private-filters');
    this.$noPublicFilters = this.$container.find('.js-no-public-filters');
  }

  bindEvents() {
    this.$clearButton.on('click', () => this.clearFilter());
    this.$updateButton.on('click', (e) => this.updateActiveFilter(e));
    this.$saveButton.on('modal:shown', (e, modal) => this.createNew(e, modal));
    this.$searchField.on('keydown', _.debounce(() => this.setSearchKeyword(), 1300));

    this.$container.on('click', '.js-filter-item .js-filter-item-default', (e) => this.setDefaultFilter(e));
    this.$container.on('modal:shown', '.js-filter-item .js-filter-item-update', (e, modal) => this.editFilter(e, modal));
    this.$container.on('modal:shown', '.js-filter-item .js-filter-item-delete', (e, modal) => this.deleteFilter(e, modal));
  }

  getActiveFilter() {
    return this.$container.find('.js-filter-active .js-filter-item');
  }

  preloadFilters(filters) {
    if (this.getActiveFilter().data('id') === 'preload') {
      this.getActiveFilter().attr('data-filter', filters);
      this.getActiveFilter().data('filter', JSON.parse(filters));
      this.getActiveFilter().click();
      return;
    }

    // show all options
    for (let element of this.$container.find('.js-filter-list .js-filter-item')) {
      $(element).show();
    }

    this.$container.find('.js-filter-active .js-filter-item').replaceWith(
      filterItemLI(
        'preload',
        'Preload Search',
        filters
      )
    );

    this.getActiveFilter().click();
  }

  clearFilter() {
    if (this.getActiveFilter().data('id') === 'preload') {
      this.loadDefaultFilter();
    } else {
      this.loadActiveFilter();
    }
  }

  loadActiveFilter() {
    this.getActiveFilter().click();

    this.$container.find(`.js-filter-list .js-filter-item[data-id="${this.getActiveFilter().data('id')}"]`).hide();
  }

  loadDefaultFilter() {
    this.$container.find('.js-filter-list .js-filter-item.is-default').click();
  }

  toggleNoPrivateFilters() {
    let $nextFilter = this.$noPrivateFilters.nextAll('.js-filter-item:not(.is-locked):not(.is-hidden)');
    if ($nextFilter.length === 0) {
      this.$noPrivateFilters.show();
    } else {
      this.$noPrivateFilters.hide();
    }

    $nextFilter = this.$noPublicFilters.nextAll('.js-filter-item.is-locked:not(.is-hidden)');
    if ($nextFilter.length === 0) {
      this.$noPublicFilters.show();
    } else {
      this.$noPublicFilters.hide();
    }
  }

  setDefaultFilter(e) {
    const $currentTarget = $(e.currentTarget);
    const $filterItem = $currentTarget.closest('.js-filter-item');
    const url = $currentTarget.data('endpoint');

    axios.post(url)
      .then(({ data }) => {
        this.$container.find('.js-filter-item .js-filter-item-default')
          .removeClass('ledger-icon-star')
          .addClass('ledger-icon-star-outline')
          .parent()
          .show();

        this.$container.find('.js-filter-item.is-default').removeClass('is-default');
        this.$container.find('.js-filter-item .js-default-item-icon').remove();

        for (let item of this.$container.find(`.js-filter-item[data-id="${$filterItem.data('id')}"]`)) {
          $(item).addClass('is-default');

          $(item).find('.js-filter-item-default')
            .addClass('ledger-icon-star')
            .removeClass('ledger-icon-star-outline')
            .parent()
            .hide();

          $(item).find('.option-list-item-right-content').prepend('<i class="ledger-icons ledger-icon-star js-default-item-icon"></i>');
        }

        toaster('Default Filter changed to ' + $filterItem.find('.option-list-item-text').text());
      });

    e.stopPropagation();
  }

  cleanFilterJSON(filters) {
    filters = JSON.parse(filters);

    for (let field of this.$form.data('ignore-fields') || []) {
      delete filters[field];
    }

    return JSON.stringify(filters);
  }

  createNew(e, modal) {
    $(modal).find('[id$="_params"]').val(this.cleanFilterJSON(this.filters));
    $(modal).find('[id$="_report"]').val(this.$saveButton.data('report'));
    $(modal).find('[id$="_section"]').val(this.$saveButton.data('section'));

    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      this.$noPrivateFilters.hide();

      $(filterItemLI(
        data.id,
        data.label,
        data.params
      ))
        .insertAfter(this.$noPrivateFilters);

      this.$container.find(`.js-filter-item[data-id="${data.id}"]`).click();
    });
  }

  updateActiveFilter(e) {
    const $currentTarget = $(e.currentTarget);
    const id = this.getActiveFilter().data('id');
    const url = $currentTarget.data('endpoint').replace('__ID__', id);

    const filters = this.cleanFilterJSON(this.filters);

    axios.put(url, { params: filters })
      .then(({ data }) => {
        this.$clearButton.hide();
        this.$saveButton.hide();
        this.$updateButton.hide();

        this.currentFilter = JSON.parse(filters);

        for (let item of this.$container.find(`.js-filter-item[data-id="${id}"]`)) {
          $(item).attr('data-filter', filters);
          $(item).data('filter', this.currentFilter);
        }

        toaster(data.label + ' updated');
      });
  }

  editFilter(e, modal) {
    const $currentTarget = $(e.currentTarget);
    const $filterItem = $currentTarget.closest('.js-filter-item');

    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      $filterItem.attr('data-filter', JSON.stringify(data.params));
      $filterItem.data('filter', data.params);
      $filterItem.find('.option-list-item-text').html(data.label);
    });
  }

  deleteFilter(e, modal) {
    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      // delete all items
      this.$container.find(`.js-filter-item[data-id="${data.id}"]`).remove();

      // mark "public" default as default
      if (this.$container.find('.js-filter-item.is-default').length === 0) {
        for (let item of this.$container.find('.js-filter-item.is-public-default')) {
          $(item).addClass('is-default');

          $(item).find('.js-filter-item-default')
            .addClass('ledger-icon-star')
            .removeClass('ledger-icon-star-outline')
            .parent()
            .hide();

          $(item).find('.option-list-item-right-content').prepend('<i class="ledger-icons ledger-icon-star js-default-item-icon"></i>');
        }
      }

      this.toggleNoPrivateFilters();

      if (this.getActiveFilter().length === 0) {
        this.$container.find('.js-filter-active>ul').replaceWith('<li class="js-filter-item"></li>');

        this.loadDefaultFilter();
      }
    });
  }

  setSearchKeyword() {
    this.$form.find(this.$searchField.data('filter-field')).val(this.$searchField.val()).trigger('change');
  }

  setCurrentFilter(e) {
    if ($(e.target).hasClass('js-entity-modal')
      || $(e.target).hasClass('js-entity-modal-template')
    ) {
      return false;
    }

    const $filterItem = $(e.currentTarget);
    const $activeItem = this.getActiveFilter();
    const $hiddenItem = this.$container.find(`.js-filter-list .js-filter-item[data-id="${$activeItem.data('id')}"]`);

    // @hack: show before moving
    $filterItem.show().removeClass('is-hidden');
    $activeItem.replaceWith($filterItem.clone());
    $hiddenItem.show().removeClass('is-hidden');
    $filterItem.hide().addClass('is-hidden');

    if ($filterItem.data('id') === $hiddenItem.data('id')) {
      $hiddenItem.hide().addClass('is-hidden');
    }

    // style as active
    this.getActiveFilter().addClass('option-list-item-active');

    this.currentFilter = $filterItem.data('filter') || {};

    // get url filters
    const values = JSON.parse(getParameterValues('filters'));

    // override fields
    for (let field of this.$form.data('ignore-fields') || []) {
      this.currentFilter[field] = values[field];
    }

    this.loadFilters();
    this.toggleNoPrivateFilters();

    return true;
  }

  loadFilters() {
    this.isLoading = true;

    this.$form[0].reset();

    // force resetting special fields
    this.$searchField.val('');
    this.$container.find(`input[name="${this.$form.prop('name')}[search]"]`, this.$form).val('');
    for (let element of this.$form.find('input[type="hidden"]:not([id$="_token"])')) {
      $(element).val('');
    }
    for (let element of this.$form.find('input.checkbox-input')) {
      $(element).prop('checked', false);
    }

    // convert selected filter into this.$form.serializeArray()
    let params = {};
    for (let [key, value] of Object.entries(this.currentFilter)) {
      let fieldName = `${this.$form.prop('name')}[${key}]`;
      if (_.isArray(value)) {
        params[`${fieldName}[]`] = value;
      } else if (_.isObject(value)) {
        for (let [k, v] of Object.entries(value)) {
          params[`${fieldName}[${k}]`] = v;
        }
      } else {
        params[fieldName] = value;
      }
    }

    // populate form
    this.$form.deserialize(params);

    // mark dropdown as empty
    this.$form.find('.dropdown').removeClass('has-value');

    // reset regular dropdown
    for (let element of this.$container.find('.dropdown.js-select-dropdown', this.$form)) {
      $(element).find('.dropdown-reset').hide();

      if ($(element).find('.dropdown-text')) {
        $(element).find('.dropdown-text').addClass('dropdown-placeholder').html($(element).data('placeholder') || '');
      }
    }

    // show and unselect all options
    this.$form.find('.dropdown.js-select-dropdown,.dropdown.js-select-dropdown-multiple')
      .find('.option-list-item')
      .removeClass('is-selected is-highlighted')
      .show();

    // remove all preselected tags
    this.$form.find('.dropdown-tags').html('');

    // force "onload" event (update sync dropdown)
    this.$form.find('.dropdown').find('input[type=hidden],select').trigger('onload');

    // auto select option items
    for (let option of this.$container.find('select option:selected', this.$form)) {
      $(option).closest('.dropdown').find(`.option-list-item[data-value="${$(option).val()}"]`).click();
    }

    // populate search keyword
    if (params[`${this.$form.prop('name')}[search]`]) {
      this.$searchField.val(params[`${this.$form.prop('name')}[search]`]);
    }

    // update data range selections
    for (let element of this.$container.find('.js-autocomplete-dropdown', this.$form)) {
      const selectedVal = $(element).find('input[type=hidden]').val();
      if (selectedVal.length) {
        axios.get($(element).data('endpoint'), {
          params: {
            id: selectedVal.split('|')
          }
        })
          .then(({ data }) => {
            for (let [key, value] of Object.entries(data.options)) {
              if ($(element).hasClass('js-select-dropdown-multiple')) {
                $(element).find('.dropdown-tags').append(`
                  <div class="tag tag-interactive">
                    <div class="tag-display-name">${value.label ? value.label : value}</div>
                    <span class="tag-action" data-value="${key}">
                      <i class="ledger-icons ledger-icon-close-circle"></i>
                    </span>
                  </div>
                `);

                if ($(element).find('.dropdown-tags .tag').length) {
                  $(element).addClass('has-value');
                }
              } else if (key === selectedVal) {
                $(element).addClass('has-value');
                $(element).find('.dropdown-reset').show();
                $(element).find('.dropdown-text').removeClass('dropdown-placeholder').html(value.label ? value.label : value);
              }
            }
          });
      } else {
        $(element).find('.dropdown-reset').click();
      }
    }

    // update data range selections
    for (let element of this.$container.find('.js-daterangepicker', this.$form)) {
      $(element).find('.filter-range-label>a').html('Select Date Range');

      const unitVal = this.$container.find('#' + $(element).data('filter-field') + '_unit').val();
      let fromVal = this.$container.find('#' + $(element).data('filter-field') + '_from').val();
      let toVal = this.$container.find('#' + $(element).data('filter-field') + '_to').val();

      if (_.isEmpty(unitVal) && _.isEmpty(fromVal) && _.isEmpty(toVal)) {
        continue;
      }

      if (!_.isEmpty(unitVal)) {
        const dateRange = getDateRange(unitVal);
        if (dateRange) {
          fromVal = dateRange[0].format('YYYY-MM-DD');
          toVal = dateRange[1].format('YYYY-MM-DD');
        }
      }

      const start = moment(fromVal);
      const end = moment(toVal);

      let label = null;
      for (let [key, value] of Object.entries(dateRanges)) {
        if (value[0].isSame(start, 'day') && value[1].isSame(end, 'day')) {
          label = key;
        }
      }

      $(element).find('.filter-range-label>a').html(label || start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
      if (!label && start.isSame(end, 'day')) {
        $(element).find('.filter-range-label>a').html(start.format('YYYY-MM-DD'));
      }
    }

    // update tags selections
    for (let element of this.$container.find('.js-tagspicker', this.$form)) {
      $(element).find('.filter-range-label>a').html('Select Tags');

      const val = this.$container.find('#' + $(element).data('filter-field')).val();
      if (_.isEmpty(val)) {
        continue;
      }

      $(element).find('.filter-range-label>a').html(val.split('|').length + ' Tags');
    }

    this.isLoading = false;
  }

  getData() {
    // exit while loading filters
    if (this.isLoading) {
      return;
    }

    // set parameters to post
    let params = this.$form.serializeObject();
    params = params[this.$form.prop('name')];
    params = withoutEmpty(params);

    // get multi autocomplete field names
    const acFields = [];
    for (let element of this.$container.find('.js-autocomplete-dropdown.js-select-dropdown-multiple', this.$form)) {
      acFields.push($(element).find('input[type=hidden]').prop('id').substring(this.$form.prop('name').length + 1));
    }

    // @hack: remove _token (not required)
    delete params._token;

    this.filters = JSON.stringify(params);

    params = JSON.parse(this.cleanFilterJSON(this.filters));

    if (this.compareCheck) {
      for (let element of this.$container.find('.js-filter-list .js-filter-item:not(.option-list-item-active):not(.is-hidden)')) {
        if (_.isEqual(params, $(element).data('filter'))) {
          this.compareCheck = false;

          $(element).click();

          return;
        }
      }
    }

    this.compareCheck = true;

    const isSameFilter = _.isEqual(params, this.currentFilter) && this.getActiveFilter().data('id') !== 'preload';

    // reset all label counts
    this.$container.find('.filter-label>span').text('');

    // show total filter selected
    let counter = 0;
    for (let [key, value] of Object.entries(params)) {
      let total = _.isArray(value) ? value.length : 1;
      if (acFields.indexOf(key) !== -1) {
        total = value.split('|').length;
      }

      counter += total;

      const $label = this.$container.find(`[name^="${this.$form.prop('name')}[${key}]"]`).closest('.filter').find('.filter-label>span');
      if ($label) {
        if (total) {
          $label.text(`(${total})`);
        } else {
          $label.text('');
        }
      }
    }
    this.$counter.text(counter).show();
    if (counter === 0) {
      this.$counter.hide();
    }

    // toggle buttons
    this.$clearButton.toggle(!isSameFilter);
    this.$saveButton.toggle(!isSameFilter);
    this.$updateButton.toggle(!isSameFilter && !this.getActiveFilter().hasClass('is-locked'));

    if (this.$updateButton.is(':visible')) {
      this.$saveButton
        .removeClass('btn-primary w-100')
        .addClass('btn-flat-primary')
        .text('Save New Filter');
    } else {
      this.$saveButton
        .removeClass('btn-flat-primary')
        .addClass('btn-primary w-100')
        .text('Save Filter');
    }

    return this.filters;
  }
}
