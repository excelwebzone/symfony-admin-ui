import $ from 'jquery';
import { getParameterValues, mergeUrlParams } from '../../lib/utils/url_utility';
import Filter from './filter';
import Datagrid from './datagrid';
import Pager from './pager';

export default class DataViewer {
  constructor(containerEl, config) {
    this.initDomElements(containerEl);
    this.bindEvents();
    this.createPager();

    this.preCallback = config.preCallback;
    this.postCallback = config.postCallback;
    this.preFilterLoad = config.preFilterLoad;
    this.postFilterLoad = config.postFilterLoad;
    this.setFilterParams = config.setFilterParams;

    // load current filter
    this.filter.loadActiveFilter();
  }

  initDomElements(containerEl) {
    this.$container = containerEl ? $(containerEl) : $('body');

    this.add2History = true;

    this.filter = new Filter(this.$container);
    this.$filterForm = this.$container.find('.js-filter-form > form');

    this.$table = this.$container.find('.list-page-table');
    if (this.$table.length === 0) {
      this.$table = this.$container.find('[data-list-page-table]');
    }
    this.datagrid = new Datagrid(this.$table.find('.js-datagrid'));

    const $column = this.$table.find('.table-header-cell-sortable.sortable.js-default-sort');
    if ($column.length) {
      this.sortColumn = `${$column.data('field')}-desc`;
      if ($column.hasClass('table-header-cell-sort-ascending')) {
        this.sortColumn = this.sortColumn.replace('-desc', '-asc');
      }
    } else {
      this.sortColumn = null;
    }

    const sortParam = getParameterValues('sort');
    if (sortParam.length) {
      this.selectSortColumn(sortParam[0]);
    }
  }

  bindEvents() {
    this.$table.on('load-filters', () => this.filterData());

    this.$filterForm.on('change', ':input:not(.ignore-input)', () => this.filterData());
    this.$container.on('click', '.js-filter-item', (e) => this.selectFilter(e));

    this.$table.find('.table-header-cell-sortable.sortable').on('click', (e) => {
      if (e.target.classList.contains('ui-resizable-handle')) {
        return;
      }

      this.setSortColumn(e);

      // re-filter data
      this.filterData();
    });

    if (this.$container.is('body')) {
      window.addEventListener('popstate', (e) => {
        if (!e.state) {
          return;
        }

        this.add2History = false;

        this.selectSortColumn(e.state.sort);
        this.filter.preloadFilters(e.state.filters);
      });
    }
  }

  getDatagrid() {
    return this.datagrid;
  }

  createPager() {
    const callback = (data) => {
      if (typeof this.preCallback === 'function') {
        this.preCallback(this, data);
      }

      if (data.page === 1) {
        this.resetTableData();
      }

      if (this.$table.hasClass('activity-list')) {
        this.$table.find('.activity-log-list').append(data.html);

        this.$table.find('.js-load-more').off('click');
        this.$table.find('.js-load-more').on('click', (e) => {
          $(e.currentTarget).remove();

          this.pager.getData();
        });
      } else {
        const $html = $(`<div>${data.html}</div>`);

        this.$table.find('.datagrid-body-container .datagrid-left-table-block>div')
          .append($html.find('.left-column').html());

        this.$table.find('.datagrid-body-container .datagrid-right-table-block>div')
          .append($html.find('.right-column').html());

        this.datagrid.resizeTable();
        this.datagrid.rebindEvents();
      }

      if (typeof this.postCallback === 'function') {
        this.postCallback(this, data);
      }
    };

    this.pager = new Pager(this.$table, this.$container.find('.list-page-empty-content'), this.$container.find('.list-page-loading-popup'), false, callback);
  }

  resetTableData() {
    if (this.$table.hasClass('activity-list')) {
      this.$table.find('.activity-log-list').html('');
    } else {
      this.$table.find('.datagrid-body-container .datagrid-left-table-block>div').html('');
      this.$table.find('.datagrid-body-container .datagrid-right-table-block>div').html('');
    }
  }

  getFilter() {
    return this.filter;
  }

  selectFilter(e) {
    if (this.filter.setCurrentFilter(e)) {
      this.filterData();
    }
  }

  filterData() {
    const filters = this.filter.getData();
    if (!filters) {
      return;
    }

    if (typeof this.preFilterLoad === 'function') {
      this.preFilterLoad(this);
    }

    this.resetTableData();

    let params = {};
    if (typeof this.setFilterParams === 'function') {
      params = Object.assign(params, this.setFilterParams(this) || {});
    }

    params.filters = filters;
    if (this.sortColumn) {
      params.sort = this.sortColumn;
    }

    this.pager.setPage(1);
    this.pager.setParams(Object.assign({}, params));
    this.pager.getData();

    // manipulating the browser history
    if (this.$container.is('body')) {
      if (this.add2History) {
        window.history.pushState(params, null, mergeUrlParams(params, location.href));
      } else {
        this.add2History = true;
      }
    }

    if (typeof this.postFilterLoad === 'function') {
      this.postFilterLoad(this, filters);
    }

    if (this.$table.data('trigger')) {
      this.$table.trigger(this.$table.data('trigger'));
    }
  }

  getSortColumn() {
    return this.sortColumn;
  }

  setSortColumn(e, $column) {
    $column = $column || $(e.currentTarget);

    this.$table.find('.table-header-cell-sortable.sortable').not($column)
      .removeClass('table-header-cell-sort-ascending table-header-cell-sort-descending');

    if ($column.hasClass('table-header-cell-sort-descending')) {
      $column
        .removeClass('table-header-cell-sort-descending')
        .addClass('table-header-cell-sort-ascending');
    } else {
      $column
        .addClass('table-header-cell-sort-descending')
        .removeClass('table-header-cell-sort-ascending');
    }

    this.sortColumn = `${$column.data('field')}-desc`;
    if ($column.hasClass('table-header-cell-sort-ascending')) {
      this.sortColumn = this.sortColumn.replace('-desc', '-asc');
    }
  }

  selectSortColumn(sortParam) {
    if (!sortParam) {
      return;
    }

    const sortName = sortParam.split('-')[0];
    const sortDir = sortParam.split('-')[1];

    if (!sortName) {
      return;
    }

    const $column = this.$table.find(`.table-header-cell-sortable.sortable[data-field="${sortName}"]`);
    if ($column.length) {
      if (!sortDir || sortDir === 'asc') {
        $column.addClass('table-header-cell-sort-descending');
      } else {
        $column.addClass('table-header-cell-sort-ascending');
      }

      this.setSortColumn(null, $column);
    }
  }
}
