import $ from 'jquery';
import moment from 'moment';
import TypedProperty from './typed_property';
import DropdownOptions from './dropdown_options';
import FileUpload from './file_upload';
import DateRangePicker from './date_range_picker';
import ScrollableTabs from './scrollable_tabs';
import Rating from './rating';
import EmberTable from '../components/ember_table';

export function initFormElements(containerEl) {
  const $container = containerEl ? $(containerEl) : $('body');

  // allow adding custom form elements
  $(document).trigger('init-form-elements', $container);

  // init form related object
  new TypedProperty($container);
  new DropdownOptions($container);

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

  // init datepicker elements
  for (let element of $container.find('.js-datepicker')) {
    const $dataField = $(element).prev();
    const format = $(element).data('format');

    new DateRangePicker($(element), {
      singleDatePicker: true,
      autoUpdateInput: true,
      locale: {
        format: format
      },
      parentEl: $(element).closest('.form-group')
    });

    $(element).on('change', () => {
      $dataField.val($(element).val() ? moment($(element).val()).format('YYYY-MM-DD') : null);
      $dataField.trigger('change');
    });
  }

  // activate inline required forms
  for (let element of $container.find('form.js-requires-input')) {
    $(element).requiresInput();
  }

  // init ember-table elements
  for (let element of $container.find('.js-ember-table')) {
    new EmberTable($(element));
  }

  // init scrollable-tabs elements
  for (let element of $container.find('.scrollable-tabs-drager>.tabs')) {
    new ScrollableTabs($(element));
  }
}
