import $ from 'jquery';
import axios from '../../lib/utils/axios_utils';
import toaster from '../../lib/utils/toaster';
import Datagrid from './datagrid';
import { modifiedValues } from '../../lib/utils/modified_values';

const EMPTY_CELL = index => `<div class="datagrid-cell is-empty text-left js-datagrid-column-width js-draggable-cell" data-index="${index}"></div>`;

export default class Cardgrid {
  /**
   * {
   *   onFieldChange: (field, value, $cell) => {..},
   *   onDragEnd: ($field, newValue) => {..}
   * }
   */
  constructor(callback, allowEmptyFields) {
    this.callback = callback || {};
    this.allowEmptyFields = allowEmptyFields || [];

    this.initDomElements();
    this.bindEvents();
  }

  initDomElements() {
    this.dragSourceEl = null;
    this.dragTargetEl = null;

    this.$table = $('.list-page-table');
    this.datagrid = new Datagrid(this.$table.find('.js-datagrid'));
  }

  bindEvents() {
    this.$table.on('data:loaded', (e, data) => this.listLoaded(e, data));

    $(document).on('click', '.js-drawer-close', (e) => this.unselectItem(e));
    $(document).on('click', '.cardgrid-component-model-cell', (e) => this.selectItem(e));
    $(document).on('modal:shown', '.js-cardgrid-delete-item', (e, modal) => this.deleteItem(e, modal));
    $(document).on('field:updated', '.js-cardgrid-form', (e, data) => this.fieldUpdated(e, data));

    $(document).on('dragstart', '.js-draggable-cell:not(.is-empty)', (e) => this.dragStart(e));
    $(document).on('dragenter', '.js-draggable-cell', (e) => this.dragEnter(e));
    $(document).on('dragend', '.js-draggable-cell', (e) => this.dragEnd(e));
  }

  listLoaded(e, data) {
    if (data.page === 1
      && typeof data.columns === 'object'
    ) {
      for (let [key, value] of Object.entries(data.columns)) {
        if (typeof value === 'object') {
          for (let [k, v] of Object.entries(value)) {
            this.$table.find(`.datagrid-header-cell[data-value="${key}"]`)
              .find(`span.${k}`)
              .text(`${v}`);
          }
        } else {
          this.$table.find(`.datagrid-header-cell[data-value="${key}"]`)
            .find('span.counter')
            .text(`${value}`);
        }
      }
    }

    for (let column of this.$table.find('.datagrid-header-container .datagrid-header-cell')) {
      const index = $(column).data('index');

      for (let row of this.$table.find('.datagrid-body-container .datagrid-table-row')) {
        const $row = $(row);
        const $rowCell = $row.find(`.datagrid-cell[data-index="${index}"]`);
        if ($rowCell.length) {
          if ($rowCell.hasClass('is-empty')) {
            for (let subRow of this.$table.find('.datagrid-body-container .datagrid-table-row')) {
              const $subRow = $(subRow);
              if ($row.index() < $subRow.index()) {
                const $subRowCell = $subRow.find(`.datagrid-cell[data-index="${index}"]:not(.is-empty)`);
                if ($subRowCell.length) {
                  $rowCell.replaceWith($subRowCell.clone(true));
                  $subRowCell.replaceWith(EMPTY_CELL(index));

                  break;
                }
              }
            }
          } else {
            const $duplicateCells = this.$table.find(`.datagrid-cell[data-index="${index}"][data-id="${$rowCell.data('id')}"]`);
            let i = 0;
            for (let dupCell of $duplicateCells) {
              if (i++ > 0) {
                $(dupCell).replaceWith(EMPTY_CELL(index));
              }
            }
          }
        }
      }

      let $preCell = null;
      for (let row of this.$table.find('.datagrid-body-container .datagrid-table-row')) {
        const $row = $(row);
        const $rowCell = $row.find(`.datagrid-cell[data-index="${index}"]`);
        if ($rowCell.length) {
          if (!$preCell) {
            $preCell = $rowCell;
          }
          if (!$rowCell.hasClass('is-empty')) {
            $preCell.removeClass('is-last');
            $preCell = $rowCell;
            $preCell.addClass('is-last');
          }
        }
      }
    }

    this.removeLastRow();
    this.datagrid.resizeTable();
    this.datagrid.rebindEvents();
  }

  removeLastRow() {
    let $lastRow, cells, emptyCells;
    do {
      $lastRow = this.$table.find('.datagrid-body-container .datagrid-table-row:last-child');

      cells = $lastRow.find('.datagrid-cell').length;
      emptyCells = $lastRow.find('.datagrid-cell.is-empty').length;

      if (cells === emptyCells) {
        $lastRow.remove();
      }
    } while ($lastRow.length && cells === emptyCells);
  }

  unselectItem(e) {
    this.$table.find('.cardgrid-component-model-cell.is-current').removeClass('is-current');
  }

  selectItem(e) {
    if ($(e.target).hasClass('checkbox')
      || $(e.target).closest('.checkbox').length
    ) {
      return;
    }

    this.$table.find('.cardgrid-component-model-cell').removeClass('is-current');

    $(e.currentTarget).addClass('is-current');
    $(e.currentTarget)
      .closest('.js-entity-drawer')
      .trigger('row:selected');
  }

  deleteItem(e, modal) {
    const $target = $(e.currentTarget);
    const $cell = this.$table.find('.cardgrid-component-model-cell.is-current').closest('.js-entity-drawer');

    $(modal).on('modal:hidden', (e, data) => {
      $(modal).off('modal:hidden');

      const $drawer = $target.closest('.drawer-frame');
      if ($drawer.length) {
        $drawer.find('.js-drawer-close').click();
      }

      this.deleteCell($cell);
    });
  }

  deleteCell($cell, cleanup = true) {
    const index = $cell.data('index');
    const $emptyCell = $(EMPTY_CELL(index));

    // set as empty
    $cell.replaceWith($emptyCell);

    let $prevRow = $emptyCell.closest('.datagrid-table-row');

    for (let row of this.$table.find('.datagrid-body-container .datagrid-table-row')) {
      const $row = $(row);

      if ($row.index() > $prevRow.index()) {
        const $prevCell = $prevRow.find(`.datagrid-cell[data-index="${index}"]`);
        const $rowCell = $row.find(`.datagrid-cell[data-index="${index}"]`);

        if (!$rowCell.hasClass('js-entity-drawer')) {
          break;
        }

        $prevCell.replaceWith($rowCell.clone(true));
        $rowCell.replaceWith($emptyCell);

        $prevRow = $row;
      }
    }

    if (cleanup) {
      this.removeLastRow();
    }

    this.datagrid.resizeTable();
    this.datagrid.rebindEvents();

    const $counter = this.$table.find(`.datagrid-header-cell[data-index="${index}"]`).find('.total>span.counter');
    $counter.text(parseInt($counter.text()) - 1);
  }

  moveCell($cell, value) {
    let $column = null;
    for (let column of this.$table.find('.datagrid-header-container .datagrid-header-cell')) {
      if (value === $(column).data('value')) {
        $column = $(column);
      }
    }

    if (!$column || $column.data('index') === $cell.data('index')) {
      return;
    }

    const index = $column.data('index');

    const $cloneCell = $cell.clone(true);
    this.deleteCell($cell, false);

    // add empty cells
    let $lastRow = this.$table.find('.datagrid-body-container .datagrid-table-row:last-child');
    if (!$lastRow.find(`.datagrid-cell[data-index="${index}"]`).hasClass('is-empty')) {
      $lastRow.after($lastRow.clone(true));
      $lastRow = this.$table.find('.datagrid-body-container .datagrid-table-row:last-child');
      for (let cell of $lastRow.find('.datagrid-cell')) {
        $(cell).replaceWith(EMPTY_CELL($(cell).data('index')));
      }
    }

    // move and replace
    for (let row of this.$table.find('.datagrid-body-container .datagrid-table-row')) {
      const $row = $(row);
      const $rowCell = $row.find(`.datagrid-cell[data-index="${index}"]`);
      if ($rowCell.hasClass('is-empty')) {
        $rowCell.replaceWith($cloneCell);
        $cloneCell.data('index', $rowCell.data('index'));
        $cloneCell.attr('data-index', $rowCell.data('index'));

        break;
      }
    }

    // mark last cell
    for (let column of this.$table.find('.datagrid-header-container .datagrid-header-cell')) {
      const index = $(column).data('index');

      let $preCell = null;
      for (let row of this.$table.find('.datagrid-body-container .datagrid-table-row')) {
        const $row = $(row);
        const $rowCell = $row.find(`.datagrid-cell[data-index="${index}"]`);
        if ($rowCell.length) {
          if (!$preCell) {
            $preCell = $rowCell;
          }
          if (!$rowCell.hasClass('is-empty')) {
            $preCell.removeClass('is-last');
            $preCell = $rowCell;
            $preCell.addClass('is-last');
          }
        }
      }
    }

    this.removeLastRow();
    this.datagrid.resizeTable();
    this.datagrid.rebindEvents();

    const $counter = this.$table.find(`.datagrid-header-cell[data-index="${index}"]`).find('.total>span.counter');
    $counter.text(parseInt($counter.text()) + 1);
  }

  fieldUpdated(e, data) {
    const $cell = this.$table.find('.cardgrid-component-model-cell.is-current').closest('.js-entity-drawer');

    if (data.fields) {
      for (let [field, value] of Object.entries(data.fields)) {
        if (value || this.allowEmptyFields.indexOf(field) !== -1) {
          if (typeof this.callback.onFieldChange === 'function') {
            this.callback.onFieldChange(field, value, $cell);
          } else if (field === $cell.data('target-field')) {
            this.moveCell($cell, value);
          } else {
            $cell.find(`[data-value="${field}"]`).html(value);
          }
        } else {
          if (field === $cell.data('target-field')) {
            this.deleteCell($cell);
          } else {
            $cell.find(`[data-value="${field}"]`).html('');
          }
        }
      }
    }
  }

  dragStart(e) {
    this.dragSourceEl = $(e.currentTarget);

    this.$table.find('.cardgrid-component').addClass('is-dragging');

    const $clone = this.dragSourceEl.clone(true);
    $clone
      .css('position', 'absolute')
      .css('border', 'none')
      .css('height', 'auto')
      .addClass('is-clone')
      .find('.cardgrid-component-model-cell')
      .addClass('drag-shadow')
      .css('width', '300px')
      .css('height', '120px');

    $('body').append($clone);

    e.originalEvent.dataTransfer.setData('text/plain', $clone.data('id'));
    e.originalEvent.dataTransfer.setDragImage($clone.get(0), 0, 0);

    this.dragSourceEl
      .find('.cardgrid-component-model-cell')
      .addClass('shadow-model');
  }

  dragEnter(e) {
    this.dragTargetEl = $(e.currentTarget);
    const index = this.dragTargetEl.data('index');
    this.$table.find('.datagrid-header-cell.active').removeClass('active');
    this.$table.find(`.datagrid-header-cell[data-index="${index}"]`).addClass('active');
  }

  dragEnd(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    this.$table.find('.cardgrid-component').removeClass('is-dragging');
    this.$table.find('.datagrid-header-cell').removeClass('active');
    this.$table.find('.cardgrid-component-model-cell').removeClass('shadow-model');
    this.$table.find('.js-draggable-cell.is-clone').remove();

    // don't do anything if we're dropping on the same column we're dragging.
    if (this.dragSourceEl !== this.dragTargetEl) {
      const index = this.dragTargetEl.data('index');
      const newValue = this.$table.find(`.datagrid-header-cell[data-index="${index}"]`).data('value');

      const params = {};
      params[this.dragSourceEl.data('target-field')] = newValue;

      axios.put(this.dragSourceEl.data('update-fields-endpoint'), params)
        .then(({ data }) => {
          if (data.error && data.error.message) {
            toaster(data.error.message, 'error');

            return;
          }

          this.moveCell(this.dragSourceEl, newValue);

          const $drawer = $(`.drawer-frame[data-id="${this.dragSourceEl.data('id')}"]`);
          if ($drawer.length) {
            const $form = $drawer.find('.entity-details');
            const $container = $form.length
              ? $($form.data('container') || 'body')
              : $('body');

            if (data.fields) {
              for (let [field, value] of Object.entries(data.fields)) {
                modifiedValues($drawer, field, value, $container);
              }
            }

            if ($form.length) {
              let $field = $form.find(`[id$="_${this.dragSourceEl.data('target-field')}"]`);
              if ($field.length === 0) {
                $field = $form.find(`[id$="_${this.dragSourceEl.data('target-field')}_date"]`);
              }
              if ($field.length) {
                if (typeof this.callback.onDragEnd === 'function') {
                  this.callback.onDragEnd($field, newValue);
                } else {
                  $field.val(newValue);
                }
              }
            }
          }
        });
    }
  }
}
