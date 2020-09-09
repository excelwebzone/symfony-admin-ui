import $ from 'jquery';
import numeral from 'numeral';
import Odometer from 'odometer';
import axios from '../../lib/utils/axios_utils';
import toaster from '../../lib/utils/toaster';
import DataViewer from './data_viewer';
import { mergeUrlParams, removeParams, getParameterValues } from '../../lib/utils/url_utility';

export default class ListPage {
  constructor(containerEl, getChartCallback = null, allowDecimals = true, showSingleRowInfo = true) {
    this.getChartCallback = getChartCallback;
    this.allowDecimals = allowDecimals;
    this.showSingleRowInfo = showSingleRowInfo;

    this.initDomElements(containerEl);
    this.bindEvents();
    this.createDataViewer();
  }

  initDomElements(containerEl) {
    this.$container = containerEl ? $(containerEl) : $('body');

    this.$selectAllCheckbox = this.$container.find('.js-bulk-select-all');
    this.$chartTotals = this.$container.find('.list-chart-summary-number-item');
    this.$chartContainer = this.$container.find('.chart-container-chart');
    this.$chartLoading = this.$container.find('.chart-loading-overlay');

    this.odCurrencies = {};
    for (let currency of this.$container.find('.js-odometer-currency')) {
      this.odCurrencies[$(currency).data('currency-field')] = new Odometer({
        el: currency,
        duration: 200,
        format: '(,ddd)',
        theme: 'default'
      });
    }
  }

  bindEvents() {
    $(document).on('reload:list', '.js-list-page-activity-log-form', () => {
      this.dataViewer.getFilter().loadActiveFilter();
    });

    this.$container.on('click', 'input[name=groupingType]', () => {
      if (this.$chartContainer.length && !this.$chartContainer.data('reload-list')) {
        this.loadChartData(this.dataViewer.getFilter().getData());
        return;
      }

      this.dataViewer.filterData();
    });

    this.$selectAllCheckbox.on('click', () => this.selectAllRows());
    this.$container.on('click', '.js-bulk-select', () => this.selectRow());

    this.$container.find('.js-print-list').on('click', (e) => this.printList(e));
    this.$container.find('.js-bulk-export,.js-bulk-print,.js-bulk-action').on('click', (e) => this.bulkGeneric(e));
    this.$container.find('.js-bulk-email').on('click', (e) => this.bulkMailto(e));
    this.$container.find('.js-bulk-follow').on('click', (e) => this.bulkFollow(e));
    this.$container.find('.js-bulk-complete').on('click', (e) => this.bulkComplete(e));
    this.$container.find('.js-bulk-unread').on('click', (e) => this.bulkUnread(e));
    this.$container.find('.js-bulk-edit').on('drawer:shown', (e, drawer) => this.bulkEditDrawer(e, drawer));
    this.$container.find('.js-bulk-delete').on('modal:shown', (e, modal) => this.bulkDeleteModal(e, modal));

    // toggle between list and card view (reload page)
    this.$container.on('click', '.js-toggle-card-view', (e) => {
      const $button = $(e.currentTarget);
      if ($button.data('endpoint')) {
        window.location.href = $button.data('endpoint') + window.location.href.substring(window.location.href.indexOf('?'));
        return !1;
      }

      window.location.href = parseInt(getParameterValues('cardView'), 10)
        ? removeParams(['cardView'])
        : mergeUrlParams({ cardView: 1 }, window.location.href);
    });
  }

  createDataViewer() {
    const self = this;

    // run before append html
    const preCallback = (viewer, data) => {
      if (data.page === 1) {
        const $dropdownCount = viewer.$container.find('.dropdown-count');
        if ($dropdownCount) {
          $dropdownCount.text(data.total);
        }

        if (typeof data.totals === 'object') {
          for (let [key, value] of Object.entries(data.totals)) {
            const $cellContent = viewer.$table.find(`.table-header-cell[data-field="${key}"] .table-header-cell-content`);

            // remove decimals
            if ((!self.allowDecimals && (value.indexOf('.') !== -1))
                || (self.allowDecimals && parseInt(value.substring(value.indexOf('.') + 1)) === 0)
            ) {
              value = value.replace(/^(\W)?([0-9,]+)([0-9.]+)(\W)?$/g, '$1$2$4');
            }

            $cellContent.append(`<span class="total-value ${value.replace(/\D/g, '') < 0 ? 'is-negative' : ''}">${value}</span>`);
          }
        }
      }

      if (data.currency && self.odCurrencies) {
        for (let [key, value] of Object.entries(data.currency)) {
          self.odCurrencies[key].update(value || 0);
        }
      }

      viewer.$table.trigger('data:received', data);
    };

    // run after append html
    const postCallback = (viewer, data) => {
      // auto select all new checkboxes when select-all is checked
      if (self.$selectAllCheckbox.is(':checked')) {
        self.$selectAllCheckbox.prop('checked', false);
        self.$selectAllCheckbox.click();
      }

      // automatically open single result (ignore under for multi block)
      if (self.showSingleRowInfo && data.page === 1 && data.total === 1
        && !viewer.$container.hasClass('js-datagrid-block')
        && !viewer.$table.hasClass('activity-list')
      ) {
        viewer.$table.find('.datagrid-body-container .datagrid-left-table-block>div .js-entity-drawer:eq(0)').click();
      }

      viewer.$table.trigger('data:loaded', data);
    };

    // run before reseting html
    const preFilterLoad = (viewer) => {
      const $dropdownCount = viewer.$container.find('.dropdown-count');
      if ($dropdownCount) {
        $dropdownCount.text(0);
      }

      const $headers = viewer.$table.find('.table-header-cell[data-field]');
      for (let header of $headers) {
        $(header).find('.table-header-cell-content>span.total-value').remove();
      }

      if (self.odCurrency) {
        self.odCurrency.update(0);
      }

      if (self.$chartTotals.length) {
        for (let total of self.$chartTotals) {
          const $total = $(total).find('>div:eq(0)');

          let format = '0';
          if ($total.data('money')) format = '$0';
          if ($total.data('percent')) format = '0%';

          $total.html(numeral(0).format(format));
        }
      }
    };

    // run after setting
    const postFilterLoad = (viewer, filters) => {
      self.loadChartData(filters);
    };

    // extends the filter request params
    const setFilterParams = (viewer) => {
      const params = {};

      const groupingType = $('input[name=groupingType]:checked');
      if (groupingType.length) {
        params.groupingType = groupingType.val();
      }

      if (viewer.$table.data('totals')) {
        params.showTotals = 1;
      }

      if (viewer.$table.data('card-view')) {
        params.cardView = 1;
      }

      return params;
    };

    this.dataViewer = new DataViewer(this.$container, {
      preCallback: preCallback,
      postCallback: postCallback,
      preFilterLoad: preFilterLoad,
      postFilterLoad: postFilterLoad,
      setFilterParams: setFilterParams
    });
  }

  loadChartData(filters) {
    if (this.$chartContainer.length && this.getChartCallback) {
      this.$chartLoading.show();
      this.$chartContainer.html('');

      const params = { filters: filters };
      const groupingType = $('input[name=groupingType]:checked');
      if (groupingType.length) {
        params.groupingType = groupingType.val();
      }

      axios.get(this.$chartContainer.data('endpoint'), {
        params: params
      })
        .then(({ data }) => {
          this.$chartLoading.hide();

          for (let total of this.$chartTotals) {
            const $total = $(total).find('>div:eq(0)');
            let value = data.total[$total.data('name')];

            let format = '0,0[.]00';
            if ($total.data('money')) format = '$0,0[.]00';
            if ($total.data('percent')) {
              format = '0,0[.]00%';

              value /= 100; // @hack: value is a percent
            }

            if (!this.allowDecimals && !this.$chartContainer.data('allow-decimals')) {
              format = format.replace('[.]00', '');
            }

            $total.html(numeral(value).format(format));
          }

          const chartFunc = this.getChartCallback(this.$chartContainer.data('token'));
          if (chartFunc) {
            const colors = this.$chartContainer.data('colors') || null;
            const format = this.$chartContainer.data('format');

            chartFunc(this.$chartContainer, data.labels, data.items, colors, format);
          }
        }).catch(() => this.$chartLoading.hide());
    }
  }

  printList(e) {
    const params = {};
    if (this.dataViewer.getFilter().getData()) {
      params.filters = this.dataViewer.getFilter().getData();
    }
    if (this.dataViewer.getSortColumn()) {
      params.sort = this.dataViewer.getSortColumn();
    }

    axios.get($(e.currentTarget).data('endpoint'), {
      params: params
    })
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        }
      });
  }

  toggleBulkTools(toggle) {
    this.$container.find('.list-filter-selector').toggle(!toggle);
    this.$container.find('.bulk-buttons-container').toggle(toggle);
    this.$container.find('.bulk-buttons-container').find('.selection-count span').html(this.$container.find('.js-bulk-select:checked').length);
  }

  selectAllRows() {
    if (this.$container.find('.js-bulk-select').length === 0) {
      this.$selectAllCheckbox.prop('checked', false);
      return;
    }

    this.$container.find('.js-bulk-select').prop('checked', this.$selectAllCheckbox.is(':checked'));
    this.toggleBulkTools(this.$selectAllCheckbox.is(':checked'));
  }

  selectRow() {
    let checked = 0;
    for (let checkbox of this.$container.find('.js-bulk-select')) {
      if ($(checkbox).is(':checked')) {
        checked++;
      }
    }

    this.$selectAllCheckbox.prop('checked', checked === this.$container.find('.js-bulk-select').length);
    this.toggleBulkTools(checked > 0);
  }

  getSelectedItems() {
    let ids = [];
    for (let checkbox of this.$container.find('.js-bulk-select')) {
      if ($(checkbox).is(':checked')) {
        ids.push($(checkbox).val());
      }
    }
    return ids;
  }

  getFormData() {
    const ids = this.getSelectedItems();
    const formData = new FormData();
    for (let i = 0; i < ids.length; i++) {
      formData.set(`ids[${i}]`, ids[i]);
    }
    return formData;
  }

  bulkGeneric(e) {
    const self = this;
    const $button = $(e.currentTarget);
    axios.post($button.data('endpoint'), self.getFormData())
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        }
        if ($button.data('refresh')) {
          self.dataViewer.filterData();
          self.toggleBulkTools(false);

          const $drawer = $('.drawer-frame');
          if ($drawer.length) {
            $drawer.find('.js-drawer-close').click();
          }
        }
      });
  }

  bulkMailto(e) {
    const $button = $(e.currentTarget);
    axios.post($button.data('endpoint'), this.getFormData())
      .then(({ data }) => {
        if (data.emails.length) {
          location.href = 'mailto:' + encodeURIComponent(data.emails.join(', '));
        }
      });
  }

  bulkFollow(e) {
    const $button = $(e.currentTarget);
    const ids = this.getSelectedItems();
    axios.post($button.data('endpoint'), this.getFormData())
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        } else if (data.error) {
          toaster(data.error.message, 'error', data.actionConfig);
        }

        for (let id of ids) {
          const $datagridRow = this.$container.find(`.js-entity-drawer[data-id="${id}"]`);
          if ($datagridRow.length) {
            $datagridRow.data('is-follow', !$datagridRow.data('is-follow'));
            $datagridRow.find('.js-follow-item').prop('checked', !$datagridRow.find('.js-follow-item').prop('checked'));

            const $drawer = $(`.drawer-frame[data-id="${$datagridRow.data('id')}"]`);
            if ($drawer.length) {
              $drawer.find('.js-follow-item>i')
                .toggleClass('zmdi-star-outline')
                .toggleClass('zmdi-star');
            }
          }
        }

        $button.trigger('item:bulk-follow');
      });
  }

  bulkComplete(e) {
    const $button = $(e.currentTarget);
    const ids = this.getSelectedItems();
    axios.post($button.data('endpoint'), this.getFormData())
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        } else if (data.error) {
          toaster(data.error.message, 'error', data.actionConfig);
        }

        for (let id of ids) {
          const $datagridRowLeft = this.$container.find(`.js-entity-drawer[data-id="${id}"]`);
          if ($datagridRowLeft.length) {
            $datagridRowLeft.data('is-complete', !$datagridRowLeft.data('is-complete'));
            $datagridRowLeft.find('.task-check-box-container').toggleClass('is-completed');
            $datagridRowLeft.find('.js-complete-item').prop('checked', !$datagridRowLeft.find('.js-complete-item').prop('checked'));
            $datagridRowLeft.find('.table-cell-name').toggleClass('is-completed');

            const $datagridRowRight = $datagridRowLeft.closest('.list-page-table').find('.datagrid-body-container .datagrid-right-table-block .datagrid-table-row').eq($datagridRowLeft.index());
            $datagridRowRight.find('.table-cell-name').toggleClass('is-completed');

            const $drawer = $(`.drawer-frame[data-id="${$datagridRowLeft.data('id')}"]`);
            if ($drawer.length) {
              $drawer.toggleClass('is-complete');
              $drawer.find('.task-check-box-container').toggleClass('is-completed');
              $drawer.find('.js-complete-item').prop('checked', !$drawer.find('.js-complete-item').prop('checked'));
            }
          }
        }

        $button.trigger('item:bulk-complete');
      });
  }

  bulkUnread(e) {
    const $button = $(e.currentTarget);
    const ids = this.getSelectedItems();
    axios.post($button.data('endpoint'), this.getFormData())
      .then(({ data }) => {
        if (data.message) {
          toaster(data.message, 'default', data.actionConfig);
        } else if (data.error) {
          toaster(data.error.message, 'error', data.actionConfig);
        }

        for (let id of ids) {
          const $datagridRow = this.$container.find(`.js-entity-drawer[data-id="${id}"]`);
          if ($datagridRow.length) {
            $datagridRow.toggleClass('is-unread');
          }
        }

        $button.trigger('item:bulk-unread');
      });
  }

  bulkEditDrawer(e, drawer) {
    const self = this;
    $(drawer).on('drawer:hidden', (e, data) => {
      $(drawer).off('drawer:hidden');

      if (data.total) {
        self.dataViewer.filterData();
        self.toggleBulkTools(false);
      }
    });
  }

  bulkDeleteModal(e, modal) {
    const self = this;
    const $button = $(e.currentTarget);
    const ids = self.getSelectedItems();
    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      if (data.total) {
        self.dataViewer.filterData();
        self.toggleBulkTools(false);

        const $drawer = $('.drawer-frame');
        if ($drawer.length) {
          $drawer.find('.js-drawer-close').click();
        }
      }

      if ($button.data('trigger')) {
        $button.trigger($button.data('trigger'), { ids: ids });
      }
    });
  }
}
