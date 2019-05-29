import $ from 'jquery';
import _ from 'underscore';
import '../commons/bootstrap';

// Requires Input behavior
//
// When called on a form with input fields with the `required` attribute, the
// form's submit button will be disabled until all required fields have values.
//
// ### Example Markup
//
//   <form class="js-requires-input">
//     <input type="text" required="required">
//     <input type="submit" value="Submit">
//   </form>
//

$.fn.requiresInput = function requiresInput() {
  const $form = $(this);
  const $button = $('button[type=submit], input[type=submit]', $form);
  const fieldSelector = 'input[required=required], select[required=required], textarea[required=required]';

  function requireInput() {
    // Collect the input values of *all* required fields
    const values = _.map($(fieldSelector, $form), field => {
      const pattern = field.getAttribute('pattern');

      return !pattern || new RegExp(pattern).exec(field.value)
        ? field.value
        : null;
    });

    // Disable the button if any required fields are empty
    if (values.length && _.any(values, _.isEmpty)) {
      $button.disable();
    } else {
      $button.enable();
    }
  }

  // Set initial button state
  requireInput();
  $form.on('change input', fieldSelector, requireInput);
};

$(() => {
  const $form = $('form.js-requires-input');
  if ($form) {
    $form.requiresInput();
  }
});
