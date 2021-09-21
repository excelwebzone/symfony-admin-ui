import $ from 'jquery';
import DropdownOptions from './dropdown_options';

const ADD_ANOTHER_LINK = '<a href="#" class="typed-property-add">__TEXT__</a>';

export default class TypedProperty {
  constructor(containerEl) {
    this.$container = $(containerEl);

    this.preloadData();
    this.bindEvents();
  }

  preloadData() {
    // add at least 1 row
    for (let collectionEl of this.$container.find('.typed-property-layout')) {
      if ($(collectionEl).find('.typed-property-item').length === 0) {
        this.addRow(null, collectionEl);
      }
    }
  }

  bindEvents() {
    if (this.$container[0].tagName.toLowerCase() !== 'body') {
      return;
    }

    this.$container.on('click', '.typed-property-add', this.addRow);
    this.$container.on('blur', '.typed-property-item', this.removeRow);
    this.$container.on('keyup', '.typed-property-value-field', this.removeRow);
  }

  addRow(e, collectionEl) {
    // prevent the link from creating a "#" on the URL
    e && e.preventDefault();

    // get the object that holds the collection
    const $collectionHolder = collectionEl ? $(collectionEl) : $(this).closest('.typed-property-layout');

    // ignore if not allow adding
    if (!$collectionHolder.data('allow-add')) {
      return;
    }

    // ignore if invalid
    if ($collectionHolder.closest('.form-group').hasClass('is-loading')
      || $collectionHolder.find('.is-invalid').length
    ) {
      return;
    }

    // ignore adding new row when last row value is empty
    const $lastRow = $collectionHolder.find('.typed-property-item').last();
    if ($lastRow.length && $lastRow.find('.typed-property-value-field').val().length === 0) {
      return;
    }

    // get the data-prototype explained earlier
    const prototype = $collectionHolder.data('prototype');

    // get the new index
    const index = $collectionHolder.data('index') || 0;

    let newForm = prototype;
    // You need this only if you didn't set 'label' => false in your field
    // Replace '__name__label__' in the prototype's HTML to
    // instead be a number based on how many items we have
    // newForm = newForm.replace(/__name__label__/g, index);

    // Replace '__name__' in the prototype's HTML to
    // instead be a number based on how many items we have
    newForm = newForm.replace(/__name__/g, index);

    // increase the index with one for the next item
    $collectionHolder.data('index', index + 1);

    // display the form in the page in an li
    $collectionHolder.find('.typed-property-list').append(newForm);

    // initialized all option list
    new DropdownOptions($collectionHolder.find('.typed-property-list').find('.typed-property-item:last'));
  }

  removeRow(e) {
    // prevent the link from creating a "#" on the URL
    e && e.preventDefault();

    // get the object item
    const $currentRow = $(this).hasClass('typed-property-item')
      ? $(this)
      : $(this).closest('.typed-property-item');

    // get the object that holds the collection
    const $collectionHolder = $currentRow.closest('.typed-property-layout');

    // get last row
    const $lastRow = $collectionHolder.find('.typed-property-item').last();

    // get total rows
    let totalRows = $collectionHolder.find('.typed-property-item').length;

    // get the row value length
    const valueLength = $currentRow.find('.typed-property-value-field').val().length;

    // remove the row for the form when more then 1 rows exists
    if (totalRows > 1
      && valueLength === 0
      && !$currentRow.is($lastRow)
      && $collectionHolder.data('allow-remove')
    ) {
      $currentRow.remove();
      totalRows--;
    }

    // add `add another` link
    if (totalRows
      && valueLength
      && $collectionHolder.find('.typed-property-add').length === 0
      && $collectionHolder.data('allow-add')
    ) {
      $collectionHolder.append(ADD_ANOTHER_LINK.replace('__TEXT__', $collectionHolder.data('add-more')));
    }

    // remove `add another` link
    let found = false;
    for (let row of $collectionHolder.find('.typed-property-item')) {
      if ($(row).find('.typed-property-value-field').val().length) {
        found = true;
        break;
      }
    }
    if (!found) {
      $collectionHolder.find('.typed-property-add').remove();
    }
  }
}
