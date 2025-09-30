import $ from 'jquery';
import _ from 'underscore';
import numeral from 'numeral';

// Update the value of a field found on ether a table or a form.
export function modifiedValues($drawer, field, value, $container = $('body')) {
  // in datagrid cell (updated in drawer)
  const $datagridColumn = $container.find(`.datagrid-header-cell[data-field="${field}"]`);
  if ($drawer && $drawer.length && $datagridColumn.length) {
    const $datagridRow = $container.find(`.datagrid-body-container .js-entity-drawer[data-id="${$drawer.data('id')}"]`);
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
      $field.val(value);
    }
  }

  // update cells in page and drawer header
  const $wrappers = [];
  if ($drawer && $drawer.length) {
    const $drawerTitleBox = $drawer.find('.entity-profile-frame-title-box-text');
    if ($drawerTitleBox.length) {
      $wrappers.push($drawerTitleBox);
    }

    const $entity = $container.find(`.js-entity-drawer[data-id="${$drawer.data('id')}"]`);
    if ($entity.length) {
      $wrappers.push($entity);

      if ($entity.data('container')) {
        $wrappers.push($($entity.data('container')));
      }
    }
  } else {
    $wrappers.push($container);
  }

  for (let $wrapper of $wrappers) {
    const $elements = $wrapper.find(`[data-field="${field}"]:not(.datagrid-header-cell)`);
    for (let $element of $elements) {
      const $object = $($element);
      let displayValue = value;

      if (!_.isNull(displayValue) && $object.data('is-numeric')) {
        if ($object.data('is-integer')) {
          displayValue = numeral(displayValue).format('0,0');
        } else {
          displayValue = numeral(displayValue).format('0,0.00');
        }
      }
      if (!_.isNull(displayValue) && $object.data('starts-with')) {
        displayValue = $object.data('starts-with') + displayValue;
      }
      if (!_.isNull(displayValue) && $object.data('ends-with')) {
        displayValue = displayValue + $object.data('ends-with');
      }

      $object.html(displayValue);
    }
  }

  // update row "title" and "subtitle" value
  if ($drawer && $drawer.length) {
    const $entity = $container.find(`.js-entity-drawer[data-id="${$drawer.data('id')}"]`);
    if ($entity.length) {
      if ($entity.data('title') !== undefined) {
        const $drawerTitle = $drawer.find('.entity-profile-frame-title');
        const newTitle = $drawerTitle ? $drawerTitle.text() : $entity.data('title');
        $entity.attr('data-title', newTitle);
        $entity.data('title', newTitle);
      }

      if ($entity.data('subtitle') !== undefined) {
        const subtitle = $entity.data('subtitle');
        if (subtitle[field]) {
          subtitle[field] = value;

          $entity.attr('data-subtitle', JSON.stringify(subtitle));
          $entity.data('subtitle', subtitle);
        }
      }
    }
  }
}
