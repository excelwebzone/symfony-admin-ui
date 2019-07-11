import $ from 'jquery';
import _ from 'underscore';
import numeral from 'numeral';

// Update the value of a field found on ether a table or a form.
export function modifiedValues($drawer, field, value, $container = $('body')) {
  // in ember-table cell (updated in drawer)
  const $emberColumn = $container.find(`.ember-table-header-cell[data-field="${field}"]`);
  if ($drawer && $drawer.length && $emberColumn.length) {
    const $emberRow = $container.find(`.js-entity-drawer[data-id="${$drawer.data('id')}"]`);
    if ($emberRow.length) {
      let $emberCell = $emberRow.find(`.ember-table-cell[data-index="${$emberColumn.data('index')}"]`);
      if (!$emberCell.length) {
        $emberCell = $container.find('.ember-table-body-container .ember-table-right-table-block .ember-table-table-row')
          .eq($emberRow.index())
          .find(`.ember-table-cell[data-index="${$emberColumn.data('index')}"]`);
      }
      if ($emberCell.length) {
        if (value && $emberCell.hasClass('table-cell-email')) {
          $emberCell.html(`<a href="mailto:${value}">${value}</a>`);
        } else if (value && $emberCell.hasClass('table-cell-phone')) {
          $emberCell.html(`<a href="tel:${value}">${value}</a>`);
        } else if ($emberCell.find('a').length) {
          $emberCell.find('a').html(value || '--');
        } else if ($emberCell.hasClass('table-cell-name')) {
          $emberCell.html(`<div>${value || '--'}</div>`);
        } else if ($emberCell.hasClass('table-cell-integer')) {
          $emberCell.html(`<div>${value ? numeral(value).format('0,0') : '--'}</div>`);
        } else if ($emberCell.hasClass('table-cell-number')) {
          $emberCell.html(`<div>${value ? numeral(value).format('0,0[.]00') : '--'}</div>`);
        } else if ($emberCell.hasClass('table-cell-money')) {
          $emberCell.html(`<div>${value ? numeral(value).format('$0,0[.]00') : '--'}</div>`);
        } else if ($emberCell.hasClass('table-cell-percent')) {
          // @hack: value is a percent
          $emberCell.html(`<div>${value ? numeral(value / 100).format('0,0[.]00%') : '--'}</div>`);
        } else {
          $emberCell.html(value || '--');
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
      $field.val(value);
    }
  }

  // in page or drawer header
  for (let $wrapper of [$container, $('.header-title')]) {
    const $object = $wrapper.find(`[data-field="${field}"]:not(.ember-table-header-cell)`);
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
    const $emberRow = $container.find(`.js-entity-drawer[data-id="${$drawer.data('id')}"][data-subtitle]`);
    if ($emberRow.length) {
      const subtitle = $emberRow.data('subtitle');
      if (subtitle[field]) {
        subtitle[field] = value;

        $emberRow.attr('data-subtitle', JSON.stringify(subtitle));
        $emberRow.data('subtitle', subtitle);
      }
    }
  }
}
