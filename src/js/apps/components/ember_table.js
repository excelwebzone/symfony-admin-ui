import $ from 'jquery';
import axios from '../../lib/utils/axios_utils';
import { objectToFormData } from '../../lib/utils/object_formdata_utils';
import 'jquery-ui/ui/widgets/resizable';
import 'jquery-ui/ui/widgets/sortable';

document.addEventListener('beforeunload', () => {
  // close any open antiscroll
  $('.js-antiscroll').antiscroll('destroy');
});

export default class EmberTable {
  constructor(tableEl) {
    if ($(tableEl).length === 0) {
      return;
    }

    this.initDomElements(tableEl);
    this.setAntiscroll();
    this.resizeTable();
    this.bindEvents();

    $(window).on('resize.embertable', () => this.resizeTable());
  }

  initDomElements(tableEl) {
    this.$table = $(tableEl);
    this.isLoaded = this.$table.is(':visible');
  }

  bindEvents() {
    this.$table.find('.ember-table-body-container .ember-table-table-row').on('mouseover', (e) => this.mouseover(e));
    this.$table.find('.ember-table-body-container .ember-table-table-row').on('mouseout', (e) => this.mouseout(e));
    this.$table.find('.ember-table-body-container .ember-table-table-row').on('click', (e) => this.selectRow(e));
    this.$table.find('.ember-table-body-container .ember-table-table-row').on('dblclick', (e) => this.openFullPage(e));

    if (this.$table.data('resizable')) {
      this.$table.find('.ember-table-header-container .ember-table-header-cell:not(.table-header-cell-empty):not(.table-header-cell-select)').resizable({
        handles: 'e',
        resize: this.onColumnResize.bind(this),
        stop: this.onColumnResize.bind(this)
      });
    }

    if (this.$table.data('sortable')) {
      this.$sortableIndicator = this.$table.find('.ember-table-column-sortable-indicator');
      if (this.$sortableIndicator.length === 0) {
        this.$table.append('<div class="ember-table-column-sortable-indicator"></div>');
        this.$sortableIndicator = this.$table.find('.ember-table-column-sortable-indicator');
      }

      this.$table.find('.ember-table-header-container .ember-table-right-table-block .ember-table-header-row>div').sortable({
        axis: 'x',
        containment: 'parent',
        cursor: 'move',
        helper: 'clone',
        items: '.ember-table-header-cell.sortable',
        opacity: 0.9,
        placeholder: 'ui-state-highlight',
        scroll: true,
        tolerance: 'pointer',
        start: this.onColumnSortStart.bind(this),
        update: this.onColumnSortDone.bind(this),
        stop: this.onColumnSortStop.bind(this),
        sort: this.onColumnSortChange.bind(this)
      });
    }
  }

  rebindEvents() {
    this.$table.find('.ember-table-body-container .ember-table-table-row').off('mouseover');
    this.$table.find('.ember-table-body-container .ember-table-table-row').off('mouseout');
    this.$table.find('.ember-table-body-container .ember-table-table-row').off('click');
    this.$table.find('.ember-table-body-container .ember-table-table-row').off('dblclick');

    if (this.$table.data('resizable')) {
      this.$table.find('.ember-table-header-container .ember-table-header-cell:not(.table-header-cell-empty):not(.table-header-cell-select)').resizable('destroy');
    }

    if (this.$table.data('sortable')) {
      this.$table.find('.ember-table-header-container .ember-table-right-table-block .ember-table-header-row>div').sortable('destroy');
    }

    this.bindEvents();
  }

  onColumnResize(e, ui) {
    // force xWidth
    ui.element.resizable('option', {
      minWidth: ui.element.find('.table-header-cell-content>span').width() + 50,
      maxWidth: null
    });
    if (ui.element.closest('.ember-table-header-block').hasClass('ember-table-left-table-block')) {
      ui.element.resizable('option', 'maxWidth', 500);
    }

    // change column width
    ui.element.attr('data-column-width', ui.size.width);
    ui.element.data('column-width', ui.size.width);

    this.resizeTable();

    if (e.type === 'resizestop') {
      this.updateUserSettings();
    }
  }

  onColumnSortStart(e, ui) {
    ui.item.startPosition = ui.item.index();
  }

  onColumnSortStop() {
    this.$sortableIndicator.hide();
  }

  onColumnSortChange(e, ui) {
    const left = ui.placeholder.offset().left - ui.placeholder.closest('.ember-table-tables-container').offset().left;
    const height = ui.placeholder.closest('.ember-table-tables-container').height();

    this.$sortableIndicator.show();
    this.$sortableIndicator.css({
      left: `${left}px`,
      height: `${height}px`
    });
  }

  onColumnSortDone(e, ui) {
    const $rows = this.$table.find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row>div');
    for (let row of $rows) {
      const $row = $(row);
      let index = $row.find('.ember-table-cell:eq(0)').data('index');

      $row.find(`.ember-table-cell[data-index="${ui.item.data('index')}"]`).insertAfter(
        $row.find(`.ember-table-cell[data-index="${ui.item.prev().data('index')}"]`)
      );

      const $columns = $row.find('.ember-table-cell');
      for (let column of $columns) {
        const $column = $(column);

        // change column index
        $column.attr('data-index', index);
        $column.data('index', index);
        index++;
      }
    }

    this.updateUserSettings();
  }

  updateUserSettings() {
    let index = 1;
    const columns = {};

    for (let key of ['left', 'right']) {
      const $columns = this.$table.find(`.ember-table-${key}-table-block .ember-table-header-cell`);
      if ($columns.length) {
        columns[key] = [];

        for (let column of $columns) {
          const $column = $(column);

          // change column index
          $column.attr('data-index', index);
          $column.data('index', index);
          index++;

          if (!$column.data('field')) {
            continue;
          }

          columns[key].push({
            field: $column.data('field'),
            name: $column.find('.table-header-cell-content').text().trim(),
            width: $column.data('column-width'),
            align: $column.hasClass('text-left')
              ? 'left'
              : $column.hasClass('text-right')
                ? 'right'
                : 'center',
            sortable: $column.hasClass('table-header-cell-sortable'),
            mobileCell: $column.hasClass('table-cell-mobile')
          });
        }
      }
    }

    axios.post(this.$table.data('settings-endpoint'), objectToFormData({ columns: columns }));
  }

  resizeTable() {
    if (this.$table.length === 0) {
      return;
    }

    const useDynamicWidth = this.$table.data('dynamic-width');
    const defaultColumnWidth = this.$table.data('default-column-width');
    const totalColumns = this.$table.find('.ember-table-header-container .ember-table-header-cell').length;
    const totalRows = this.$table.find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row').length;
    const headerHeight = this.$table.data('header-height');
    const rowHeight = this.$table.data('row-height');
    const tableWidth = this.$table.get(0).offsetWidth;
    const tableHeight = totalRows * rowHeight;
    const containerHeight = this.$table.parent().get(0).offsetHeight - headerHeight;
    const dynamicColumnWidth = Math.floor(tableWidth / totalColumns);
    const maxHeight = tableHeight > containerHeight && containerHeight > 0 ? containerHeight : tableHeight;

    // calculate row width
    let rowWidth = 0;
    let leftBlockWidth = 0;
    for (let key of ['left', 'right']) {
      const $columns = this.$table.find(`.ember-table-${key}-table-block .ember-table-header-cell:visible`);
      for (let column of $columns) {
        let columnWidth = $(column).data('column-width') || defaultColumnWidth;
        if (useDynamicWidth && dynamicColumnWidth > columnWidth) {
          columnWidth = dynamicColumnWidth;
        }

        rowWidth += columnWidth;

        if (key === 'left') {
          leftBlockWidth += columnWidth;
        }

        this.$table.find(`.js-ember-table-column-width[data-index=${$(column).data('index')}]`).css('width', columnWidth);
      }
    }

    let rightBlockWidth = rowWidth - leftBlockWidth;
    if (tableWidth > rowWidth) {
      rightBlockWidth += tableWidth - rowWidth;
    }

    this.$table.find('.js-ember-column-left-width').css('width', leftBlockWidth + 'px');
    this.$table.find('.js-ember-column-right-width').css('width', (tableWidth - leftBlockWidth) + 'px');

    this.$table.find('.js-ember-row-left-width').css('width', leftBlockWidth + 'px');
    this.$table.find('.js-ember-row-right-width').css('width', rightBlockWidth + 'px');

    this.$table.css('height', 'auto');
    this.$table.find('.js-ember-table-width').css('width', tableWidth + 'px');
    this.$table.find('.js-ember-table-height').css('height', tableHeight + 'px');
    this.$table.find('.js-ember-table-max-height').css('height', maxHeight + 'px');
    this.$table.find('.js-ember-table-header-height').css('height', headerHeight + 'px');
    this.$table.find('.js-ember-table-row-height').css('height', rowHeight + 'px');

    // if has related object that need width change
    const $relatedObject = $(this.$table.data('related-object'));
    if ($relatedObject) {
      $relatedObject.css('width', rowWidth + 'px').show();
    }

    // main scrollbar
    this.$table.find('.ember-table-body-container .antiscroll-box').css('width', tableWidth + 'px');
    this.$table.find('.ember-table-body-container .antiscroll-box').css('height', maxHeight + 'px');

    if (!this.isLoaded) {
      this.isLoaded = true;

      this.$table.show().trigger('loaded');
    }

    this.$table.find('.js-antiscroll').trigger('refresh');
  }

  mouseover(e) {
    const $currentTarget = $(e.currentTarget);

    if (this.$table.find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row').eq($currentTarget.index()).hasClass('ember-table-selected')) {
      e.stopPropagation();
      return;
    }

    this.$table.find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row').eq($currentTarget.index()).addClass('ember-table-hover');
    this.$table.find('.ember-table-body-container .ember-table-left-table-block .ember-table-table-row').eq($currentTarget.index()).addClass('ember-table-hover');
  }

  mouseout(e) {
    const $currentTarget = $(e.currentTarget);

    this.$table.find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row').eq($currentTarget.index()).removeClass('ember-table-hover');
    this.$table.find('.ember-table-body-container .ember-table-left-table-block .ember-table-table-row').eq($currentTarget.index()).removeClass('ember-table-hover');
  }

  selectRow(e) {
    const $currentTarget = $(e.currentTarget);

    if (e.target.tagName.toLowerCase() === 'a'
      || $(e.target).hasClass('checkbox')
      || $(e.target).closest('.checkbox').length
      || $(e.target).closest('.import-table-panel').length
      || this.$table.data('ignore-row-select')
    ) {
      return;
    }

    if (this.$table.find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row').eq($currentTarget.index()).hasClass('ember-table-selected')) {
      e.stopPropagation();
      return;
    }

    this.$table.find('.ember-table-table-row').removeClass('ember-table-selected').removeClass('ember-table-hover');

    this.$table.find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row').eq($currentTarget.index()).addClass('ember-table-selected');
    this.$table.find('.ember-table-body-container .ember-table-left-table-block .ember-table-table-row').eq($currentTarget.index()).addClass('ember-table-selected');
    this.$table.find('.ember-table-body-container .ember-table-left-table-block .ember-table-table-row').eq($currentTarget.index()).trigger('row:selected');
  }

  openFullPage(e) {
    const $currentTarget = $(e.currentTarget);
    const $row = this.$table.find('.ember-table-body-container .ember-table-left-table-block .ember-table-table-row').eq($currentTarget.index());
    if ($row.data('link')) {
      location.href = $row.data('link');
    }
  }

  setAntiscroll() {
    for (let element of this.$table.find('.js-antiscroll')) {
      const $element = $(element);

      const antiscroll = new $.Antiscroll($element, {
        x: $element.data('horizontal'),
        y: $element.data('vertical')
      });

      $element.data('antiscroll', antiscroll);

      $element.find('>.antiscroll-inner').on('scroll', (e) => {
        if ($element.data('vertical')) {
          if ($(e.currentTarget).scrollTop() + $(e.currentTarget).innerHeight() >= e.currentTarget.scrollHeight) {
            $(e.currentTarget).trigger('reached-bottom');
          }
        }

        if ($element.data('horizontal')) {
          $($element.data('scroll-block')).css('left', -e.currentTarget.scrollLeft);
        }
      })
        .trigger('scroll');

      $element.on('refresh', () => {
        $element.data('antiscroll').refresh();
      });
    }
  }
}
