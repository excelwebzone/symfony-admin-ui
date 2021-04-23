import $ from 'jquery';
import _ from 'underscore';
import numeral from 'numeral';

// Update the value of a field found on ether a table or a form.
export function modifiedValues($drawer, field, value, $container = $('body')) {
  // in datagrid cell (updated in drawer)
  const $datagridColumn = $container.find(`.datagrid-header-cell[data-field="${field}"]`);
  if ($drawer && $drawer.length && $datagridColumn.length) {
    const $datagridRow = $container.find(`.js-entity-drawer[data-id="${$drawer.data('id')}"]`);
    if ($datagridRow.length) {
      let $datagridCell = $datagridRow.find(`.datagrid-cell[data-index="${$datagridColumn.data('index')}"]`);
      if (!$datagridCell.length) {
        $datagridCell = $container.find('.datagrid-body-container .datagrid-right-table-block .datagrid-table-row')
          .eq($datagridRow.index())
          .find(`.datagrid-cell[data-index="${$datagridColumn.data('index')}"]`);
      }
      if ($datagridCell.length) {
        if (value && $datagridCell.hasClass('table-cell-email')) {
          $datagridCell.html(`<a href="mailto:${value}">${value}</a>`);
        } else if (value && $datagridCell.hasClass('table-cell-phone')) {
          $datagridCell.html(`<a href="tel:${value}">${value}</a>`);
        } else if ($datagridCell.find('a').length) {
          $datagridCell.find('a').html(value || '--');
        } else if ($datagridCell.hasClass('table-cell-name')) {
          $datagridCell.html(`<div>${value || '--'}</div>`);
        } else if ($datagridCell.hasClass('table-cell-integer')) {
          $datagridCell.html(`<div>${value ? numeral(value).format('0,0') : '--'}</div>`);
        } else if ($datagridCell.hasClass('table-cell-number')) {
          $datagridCell.html(`<div>${value ? numeral(value).format('0,0[.]00') : '--'}</div>`);
        } else if ($datagridCell.hasClass('table-cell-money')) {
          $datagridCell.html(`<div>${value ? numeral(value).format('$0,0[.]00') : '--'}</div>`);
        } else if ($datagridCell.hasClass('table-cell-percent')) {
          // @hack: value is a percent
          $datagridCell.html(`<div>${value ? numeral(value / 100).format('0,0[.]00%') : '--'}</div>`);
        } else {
          $datagridCell.html(value || '--');
        }
      }
    }
  }

  // update form fields (ignore dropdown fields)
  const $form = $drawer && $drawer.length
    ? $drawer.find('.entity-details')
    : $container.find('.entity-details');

  if ($form.length) {
    const $field = $form.find(`[id$="_${field}"]`);
    if ($field.length && $field.closest('.dropdown').length === 0) {
      if ($field.is(':checkbox')) {
        $field.prop('checked', value);
      } else {
        $field.val(value);
      }
    }
  }

  // in page or drawer header
  for (let $wrapper of [$container, $('.header-title')]) {
    const $object = $wrapper.find(`[data-field="${field}"]:not(.datagrid-header-cell)`);
    if (!_.isNull(value) && $object.data('is-numeric')) {
      if ($object.data('is-integer')) {
        value = numeral(value).format('0,0');
      } else {
        value = numeral(value).format('0,0.00');
      }
    }
    if (!_.isNull(value) && $object.data('starts-with')) {
      value = $object.data('starts-with') + value;
    }
    if (!_.isNull(value) && $object.data('ends-with')) {
      value = value + $object.data('ends-with');
    }
    $object.html(value);
  }

  // update row "subtitle" value
  if ($drawer && $drawer.length) {
    const $datagridRow = $container.find(`.js-entity-drawer[data-id="${$drawer.data('id')}"][data-subtitle]`);
    if ($datagridRow.length) {
      const subtitle = $datagridRow.data('subtitle');
      if (subtitle[field]) {
        subtitle[field] = value;

        $datagridRow.attr('data-subtitle', JSON.stringify(subtitle));
        $datagridRow.data('subtitle', subtitle);
      }
    }
  }
}
