import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import toaster from '../../lib/utils/toaster';
import axios from '../../lib/utils/axios_utils';
import { withoutEmpty} from '../../lib/utils/form_parsing';
import { dateRanges, getDateRange, initTagsPicker, initDateRangePicker } from './filter_range';

const filterItemLI = (id, title, filters) => `
  <li class="option-list-item option-list-item-filter option-list-item-has-overflow js-saved-filter" data-id="${id}" data-filter='${filters}'>
    <div class="option-list-item-right-content">
      <div class="option-list-item-hover-content">
        <i class="zmdi zmdi-icon zmdi-lock"></i>
      </div>
    </div>
    <div class="option-list-item-text">${title}</div>
  </li>
`;

export default class Filter {
  constructor(containerEl) {
    this.currentFilter = {};
    this.filters = '{}';
    this.isLoadingFilters = false;

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
  }

  bindEvents() {
    this.$clearButton.on('click', () => this.clearFilter());
    this.$updateButton.on('click', (e) => this.updateActiveFilter(e));
    this.$saveButton.on('modal:shown', (e, modal) => this.createNew(e, modal));
    this.$searchField.on('keydown', _.debounce(() => this.setSearchKeyword(), 1300));

    this.$container.on('modal:shown', '.js-saved-filter .js-entity-modal', (e, modal) => this.editFilter(e, modal));
    this.$container.on('modal:shown', '.js-saved-filter .js-entity-modal-template', (e, modal) => this.deleteFilter(e, modal));
  }

  getActiveFilter() {
    return this.$container.find('.js-filter-active .option-list-item-filter');
  }

  preloadFilters(filters) {
    if ('preload' === this.getActiveFilter().data('id')) {
      this.getActiveFilter().attr('data-filter', filters);
      this.getActiveFilter().data('filter', JSON.parse(filters));
      this.getActiveFilter().click();
      return;
    }

    // show all options
    for (let element of this.$container.find('.js-filter-list .option-list-item-filter')) {
      $(element).show();
    }

    this.$container.find('.js-filter-active .option-list-item-filter').replaceWith(
      filterItemLI(
        'preload',
        'Preload Search',
        filters
      )
    );

    this.getActiveFilter().click();
  }

  clearFilter() {
    if ('preload' === this.getActiveFilter().data('id')) {
      this.loadDefaultFilter();
    } else {
      this.loadActiveFilter();
    }
  }

  loadActiveFilter() {
    this.getActiveFilter().click();

    this.$container.find(`.js-filter-list .option-list-item-filter[data-id="${this.getActiveFilter().data('id')}"]`).hide();
  }

  loadDefaultFilter() {
    this.$container.find('.js-filter-list .option-list-item-filter.is-default').click();
  }

  createNew(e, modal) {
    $(modal).find('[id$="_params"]').val(this.filters);
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

      this.$container.find(`.js-saved-filter[data-id="${data.id}"]`).click();
    });
  }

  updateActiveFilter(e) {
    const $currentTarget = $(e.currentTarget);
    const id = this.getActiveFilter().data('id');
    const url = $currentTarget.data('endpoint').replace('__ID__', id);

    axios.put(url, {params:  this.filters})
      .then(({ data }) => {
        this.$clearButton.hide();
        this.$saveButton.hide();
        this.$updateButton.hide();

        this.currentFilter = JSON.parse(this.filters);

        for (let item of this.$container.find(`.option-list-item-filter[data-id="${id}"]`)) {
          $(item).attr('data-filter', this.filters);
          $(item).data('filter', this.currentFilter);
        }

        toaster(data.label + ' updated');
      });
  }

  editFilter(e, modal) {
    const $currentTarget = $(e.currentTarget);
    const $filterItem = $currentTarget.closest('.js-saved-filter');

    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      $filterItem.data('filter', data.params);
      $filterItem.find('.option-list-item-text').html(data.label);
    });
  }

  deleteFilter(e, modal) {
    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      this.loadDefaultFilter();
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
    const $hiddenItem = this.$container.find(`.js-filter-list .option-list-item-filter[data-id="${$activeItem.data('id')}"]`);

    if (_.isEqual($hiddenItem, $activeItem.data('id'))) {
      return false;
    }

    $filterItem.show(); // @hack: show before moving
    $activeItem.replaceWith($filterItem.clone());
    $hiddenItem.show();
    $filterItem.hide();

    const $nextFilter = this.$noPrivateFilters.nextAll('li:visible:eq(0)');
    if (0 === $nextFilter.length || $nextFilter.hasClass('js-public-filters')) {
      this.$noPrivateFilters.show();
    } else {
      this.$noPrivateFilters.hide();
    }

    this.currentFilter = $filterItem.data('filter') || {};

    this.loadFilters();

    return true
  }

  loadFilters() {
    this.isLoadingFilters = true;

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

    // remove all preselected tags
    this.$form.find('.dropdown-tags').html('');

    // show all options
    this.$form.find('.dropdown.js-select-dropdown-multiple').find('.option-list-item').show();

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
                      <i class="zmdi zmdi-close-circle"></i>
                    </span>
                  </div>
                `);
              } else if (key == selectedVal) {
                $(element).find('.dropdown-reset').show();
                $(element).find('.dropdown-text').removeClass('dropdown-placeholder').html(value.label ? value.label : value);
              }
            }
          });
      } else {
        this.$form.find('.dropdown-reset').click();
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

      $(element).find('.filter-range-label>a').html(label ? label : start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
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

    this.isLoadingFilters = false;
  }

  getData() {
    // exit while loading filters
    if (this.isLoadingFilters) {
      return;
    }

    // set parameters to post
    let params = this.$form.serializeObject();
    params = params[this.$form.prop('name')];
    params = withoutEmpty(params);

    // get multi autocomplete field names
    const acFields = [];
    for (let element of this.$container.find('.js-autocomplete-dropdown.js-select-dropdown-multiple', this.$form)) {
      acFields.push($(element).find('input[type=hidden]').prop('id').substring(this.$form.prop('name').length+1));
    }

    // @hack: remove _token (not required)
    delete params._token;

    this.filters = JSON.stringify(params);

    const isSameFilter = _.isEqual(params, this.currentFilter) && 'preload' !== this.getActiveFilter().data('id');

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
    if (0 === counter) {
      this.$counter.hide();
    }

    // toggle buttons
    this.$clearButton.toggle(!isSameFilter);
    this.$saveButton.toggle(!isSameFilter);
    this.$updateButton.toggle(!isSameFilter && !this.getActiveFilter().hasClass('is-locked'));

    return this.filters;
  }
}
