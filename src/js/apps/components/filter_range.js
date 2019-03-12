import $ from 'jquery';
import moment from 'moment';
import DateRangePicker from '../form_elements/date_range_picker';
import TagsPicker from '../form_elements/tags_picker';
import bp from '../../breakpoints';

export const dateRanges = {
  'Today': [moment(), moment(), 'is the current day.'],
  'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days'), 'is the previous day.'],
  'This Week': [moment().startOf('week').add(1, 'day'), moment().endOf('week').add(1, 'day'), 'is within the current week.'],
  'Last Week': [moment().subtract(1, 'weeks').startOf('week').add(1, 'day'), moment().subtract(1, 'weeks').endOf('week').add(1, 'day'), 'was in the previous week.'],
  'This Month': [moment().startOf('month'), moment().endOf('month'), 'is within the current month.'],
  'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month'), 'was in the previous month.'],
  'This Year': [moment().startOf('year'), moment().endOf('year'), 'is within the current year.'],
  'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year'), 'was in the previous year.'],
  'Last 7 Days': [moment().subtract(7, 'days'), moment().subtract(1, 'days'), 'is the previous 7 days.'],
  'Last 30 Days': [moment().subtract(30, 'days'), moment().subtract(1, 'days'), 'is the previous 30 days.'],
  'Last 60 Days': [moment().subtract(60, 'days'), moment().subtract(1, 'days'), 'is the previous 60 days.'],
  'Last 90 Days': [moment().subtract(90, 'days'), moment().subtract(1, 'days'), 'is the previous 90 days.'],
  'Last 180 Days': [moment().subtract(180, 'days'), moment().subtract(1, 'days'), 'is the previous 180 days.']
};

export function getDateRange(key) {
  const label = key.replace('_', ' ').toLowerCase().replace(/^(.)|\s(.)/g, ($1) => $1.toUpperCase());
  return dateRanges[label];
}

export function initTagsPicker(pickerEl) {
  const $picker = $(pickerEl);

  const options = {
    opens: 'left',
    autoUpdateInput: false,
    ignoreMove: true
  };

  let bootstrapBreakpoint = bp.getBreakpointSize();
  if (bootstrapBreakpoint === 'xs') {
    options.parentEl = $picker.closest('.filter-range');
  }

  const $field = $(`#${$picker.data('filter-field')}`);

  const callback = (tags) => {
    const total = tags.length ? tags.split('|').length : 0;
    $picker.find('.filter-range-label>a').html(total ? `${tags.split('|').length} Tags` : 'Select Tags');
    $field.val(tags).trigger('change');
  };

  // create picker
  new TagsPicker($picker, options, callback);

  $picker.on('show.tagspicker', (e, tagsPicker) => {
    tagsPicker.setTags($field.val());
    tagsPicker.updateView();

    repositionRangeSelect(tagsPicker, $picker[0]);
  });
}

export function initDateRangePicker(pickerEl) {
  const $picker = $(pickerEl);

  const options = {
    locale: {
      cancelLabel: 'Clear'
    },
    opens: 'left',
    autoUpdateInput: false,
    alwaysShowCalendars: true,
    ignoreMove: true,
    ranges: dateRanges
  };

  let bootstrapBreakpoint = bp.getBreakpointSize();
  if (bootstrapBreakpoint === 'xs') {
    options.parentEl = $picker.closest('.filter-range');
  }

  const $unitDate = $(`#${$picker.data('filter-field')}_unit`);
  const $startDate = $(`#${$picker.data('filter-field')}_from`);
  const $endDate = $(`#${$picker.data('filter-field')}_to`);

  const callback = (start, end, label) => {
    let foundLabel = false;
    for (let value of Object.values(dateRanges)) {
      if (value[0].isSame(start, 'day') && value[1].isSame(end, 'day')) {
        foundLabel = true;
      }
    }

    $picker.find('.filter-range-label>a').html(foundLabel ? label : `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);
    if (!foundLabel && start.isSame(end, 'day')) {
      $picker.find('.filter-range-label>a').html(start.format('YYYY-MM-DD'));
    }

    $unitDate.val(label.replace(' ', '_').toLowerCase());
    $startDate.val(foundLabel ? '' : start.format('YYYY-MM-DD'));
    $endDate.val(foundLabel ? '' : end.format('YYYY-MM-DD')).trigger('change');
  };

  // create picker
  new DateRangePicker($picker, options, callback);

  $picker.on('show.daterangepicker', (e, dateRangePicker) => {
    let start = $startDate.val();
    let end = $endDate.val();

    if ($unitDate.val()) {
      const dateRange = getDateRange($unitDate.val());
      if (dateRange) {
        start = dateRange[0].format('YYYY-MM-DD');
        end = dateRange[1].format('YYYY-MM-DD');
      }
    }

    if ($startDate.val() || start) dateRangePicker.setStartDate(moment(start));
    if ($endDate.val() || end) dateRangePicker.setEndDate(moment(end));

    dateRangePicker.updateView();

    repositionRangeSelect(dateRangePicker, $picker[0]);
  });

  $picker.on('cancel.daterangepicker', () => {
    $picker.find('.filter-range-label>a').html('Select Date Range');

    $unitDate.val('');
    $startDate.val('');
    $endDate.val('').trigger('change');
  });
}

// reposition container on the right side of the filter window
function repositionRangeSelect(picker, elementEl) {
  const $parentEl = $(elementEl).closest('.filter-range');

  const parentRect = $parentEl[0].getBoundingClientRect();

  const $container = $('.range-select-container:visible');

  const frameRect = $parentEl.closest('.filter-options-content')[0].getBoundingClientRect();

  let bootstrapBreakpoint = bp.getBreakpointSize();
  if (bootstrapBreakpoint === 'xs') {
    $container
      .removeClass('has-nub')
      .css({
        '-webkit-transform': '',
        transform: ''
      });

    if ($container.closest('.filter-range').length === 0) {
      $container.appendTo($parentEl);
    }

    picker.setParentEl($parentEl);

    return;
  }

  // move picker to body
  if ($container.closest('.filter-range').length) {
    $container.appendTo($('body'));
    picker.setParentEl($('body'));
  }

  // exit if already created
  if ($container.hasClass('has-nub')) {
    return;
  }

  if (!(parentRect.top + parentRect.height / 2 < frameRect.top || parentRect.bottom - parentRect.height / 2 > frameRect.bottom)) {
    const containerRect = $container[0].getBoundingClientRect();

    const top = parentRect.top + parentRect.height / 2 - containerRect.height / 2;

    const bottom = top + containerRect.height;

    let distance = 0;
    if (top < frameRect.top) {
      distance = frameRect.top - top;
    } else if (bottom > frameRect.bottom) {
      distance = frameRect.bottom - bottom;
    }

    let transform = `translateX(${frameRect.left - containerRect.width}px) translateY(${Math.floor(top + distance)}px)`;

    $container
      .addClass('has-nub')
      .css({
        '-webkit-transform': transform,
        transform: transform
      });

    const $nub = $container.find('.range-select-nub');
    if ($nub.length > 0) {
      transform = `translateY(${Math.min(Math.max(parentRect.height / 2, (containerRect.height - 2) / 2 - distance), containerRect.height - 2 - $nub[0].getBoundingClientRect().height / 2)}px)`;

      $nub.css({
        '-webkit-transform': transform,
        transform: transform
      });
    }
  }
}
