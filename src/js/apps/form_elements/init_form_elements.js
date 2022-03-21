import $ from 'jquery';
import moment from 'moment';
import TypedProperty from './typed_property';
import DropdownOptions from './dropdown_options';
import FileUpload from './file_upload';
import DateRangePicker from './date_range_picker';
import SwitchButton from './switch_button';
import Rating from './rating';
import Datagrid from '../components/datagrid';
import ScrollableTabs from '../components/scrollable_tabs';
import SortableList from '../components/sortable_list';
import { dateRanges } from '../components/filter_range';

export function initFormElements(containerEl) {
  const $container = containerEl ? $(containerEl) : $('body');

  // allow adding custom form elements
  $(document).trigger('init-form-elements', $container);

  // init form related object
  new TypedProperty($container);
  new DropdownOptions($container);

  // init switch elements
  for (let element of $container.find('.js-switch-button')) {
    new SwitchButton($(element));
  }

  // init rating elements
  for (let element of $container.find('.rating:not(.is-readonly)')) {
    new Rating($(element));
  }

  // auto resize textarea fields
  for (let textarea of $container.find('textarea:not(.ignore-auto-grow)')) {
    $(textarea).trigger('keydown');
  }

  // preload file-upload elements
  for (let element of $container.find('.js-file-chooser')) {
    new FileUpload($(element));
  }

  // init daterangepicker elements
  for (let element of $container.find('.js-daterangepicker:not([data-filter-field])')) {
    const $picker = $(element);

    const options = {
      locale: {
        format: $picker.data('format'),
        separator: ' - '
      },
      parentEl: $picker.data('parent') || $picker.closest('.form-group')
    };

    if ($picker.data('modal')) {
      options.useModal = true;
      options.ignoreMove = true;
    }

    if ($picker.data('locale-separator')) {
      options.locale.separator = $picker.data('locale-separator');
    }

    if ($picker.data('single-date')) {
      options.singleDatePicker = true;
      options.autoApply = !$picker.data('time-picker');
    } else {
      options.opens = 'left';
      options.alwaysShowCalendars = true;
      options.ranges = dateRanges;
    }

    if ($picker.data('time-picker')) {
      options.timePicker = true;
    }

    if ($picker.data('time-24hour')) {
      options.timePicker24Hour = true;
    }

    if ($picker.data('time-increment')) {
      options.timePickerIncrement = $picker.data('time-increment');
    }

    if ($picker.data('time-hours')) {
      options.timePickerHours = $picker.data('time-hours');
    }

    // create picker
    new DateRangePicker($picker, options);

    // get start and end dates
    const splitDateRange = (value) => {
      let start, end;

      if (value) {
        start = value.split(options.locale.separator)[0];
        end = value.split(options.locale.separator)[1];
      }

      return [start, end];
    };

    $picker.on('show.daterangepicker', (e, dateRangePicker) => {
      const dates = splitDateRange($picker.val());

      if (dates[0]) dateRangePicker.setStartDate(moment(dates[0]));
      if (dates[1]) dateRangePicker.setEndDate(moment(dates[1]));

      dateRangePicker.updateView();
    });

    $picker.on('clear.daterangepicker', () => {
      $picker.val('').trigger('change');
    });

    $picker.on('change', () => {
      if (!$picker.val()) {
        $picker.prev().val('').trigger('change');
        return;
      }

      const dates = splitDateRange($picker.val());
      const value = moment(dates[0]).format(options.timePicker ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD')
        + options.locale.separator
        + moment(dates[1]).format(options.timePicker ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD');

      $picker.prev().val(value).trigger('change');
    });
  }

  // activate inline required forms
  for (let element of $container.find('form.js-requires-input')) {
    $(element).requiresInput();
  }

  // init datagrid elements
  for (let element of $container.find('.js-datagrid')) {
    new Datagrid($(element));
  }

  // init scrollable-tabs elements
  for (let element of $container.find('.scrollable-tabs-drager>.tabs')) {
    new ScrollableTabs($(element));
  }

  // init sortable elements
  for (let element of $container.find('.js-sortable-list')) {
    new SortableList($(element));
  }
}
