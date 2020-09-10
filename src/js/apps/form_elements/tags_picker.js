import $ from 'jquery';

export default class TagsPicker {
  constructor(pickerEl, options, cb) {
    // default settings for options
    this.parentEl = 'body';
    this.$picker = $(pickerEl);
    this.autoApply = false;
    this.tags = [];

    this.locale = {
      direction: 'ltr',
      applyLabel: 'Apply',
      cancelLabel: 'Cancel'
    };

    this.callback = function() {};

    // some state information
    this.isShowing = false;
    this.isApply = false;

    // custom options from user
    if (typeof options !== 'object' || options === null)
      options = {};

    // allow setting options with data attributes
    // data-api options will be overwritten with custom javascript options
    options = $.extend(this.$picker.data(), options);

    // html template for the picker UI
    if (typeof options.template !== 'string' && !(options.template instanceof $))
      options.template = `
        <div class="modal">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-body">
                <div class="range-select range-select-tags-range d-block">
                  <div class="range-select-range-field">
                    <div class="has-floating-label p-0">
                      <input type="text" name="tagpicker" class="input-text ignore-input" placeholder=" " autocomplete="off" />
                      <label>Tag</label>
                    </div>
                    <div class="tag-collection"></div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-flat-default cancel-button value-range-cancel" data-dismiss="modal"></button>
                <button type="button" class="btn btn-primary apply-button value-range-apply"></button>
              </div>
            </div>
          </div>
        </div>
      `;

    this.parentEl = (options.parentEl && $(options.parentEl).length) ? $(options.parentEl) : $(this.parentEl);
    this.$container = $(options.template).appendTo(this.parentEl);

    //
    // handle all the possible options overriding defaults
    //

    if (typeof options.locale === 'object') {
      if (typeof options.locale.direction === 'string')
        this.locale.direction = options.locale.direction;

      if (typeof options.locale.applyLabel === 'string')
        this.locale.applyLabel = options.locale.applyLabel;

      if (typeof options.locale.cancelLabel === 'string')
        this.locale.cancelLabel = options.locale.cancelLabel;
    }
    this.$container.addClass(this.locale.direction);

    if (typeof options.tags === 'object')
      this.tags = options.tags;

    if (typeof options.autoApply === 'boolean')
      this.autoApply = options.autoApply;

    if (typeof options.autoUpdateInput === 'boolean')
      this.autoUpdateInput = options.autoUpdateInput;

    if (typeof cb === 'function') {
      this.callback = cb;
    }

    if (this.autoApply) {
      this.$container.find('.apply-button').hide();
    }

    // if no tags set, check if an input element contains initial values
    if (typeof options.tags === 'undefined') {
      if ($(this.$picker).is('input[type=text]')) {
        this.setTags($(this.$picker).val());
      }
    }

    // apply labels to buttons
    this.$container.find('.value-range-apply').html(this.locale.applyLabel);
    this.$container.find('.value-range-cancel').html(this.locale.cancelLabel);

    //
    // event listeners
    //

    this.$container.find('.tag-collection')
      .on('click', '.tag-action', (e) => this.removeTag(e));

    this.$container.find('.range-select-range-field')
      .on('keypress.tagspicker', 'input', (e) => this.formInputsKeypress(e));

    this.$container
      .on('click.tagspicker', 'button.apply-button', () => this.clickApply());

    if (this.$picker.is('input') || this.$picker.is('button')) {
      this.$picker.on({
        'click.tagspicker': () => this.show(),
        'focus.tagspicker': () => this.show(),
        'keydown.tagspicker': (e) => this.keydown(e) // IE 11 compatibility
      });
    } else {
      this.$picker.on('click.tagspicker', () => this.toggle());
      this.$picker.on('keydown.tagspicker', () => this.toggle());
    }

    //
    // if attached to a text input, set the initial value
    //

    if (this.$picker.is('input') && this.autoUpdateInput) {
      this.$picker.val(this.tags.join('|'));
      this.$picker.trigger('change');
    }
  }

  setParentEl(parentEl) {
    this.parentEl = parentEl;
  }

  setTags(tags) {
    this.tags = [];

    if (typeof tags === 'string' && tags.length)
      this.tags = tags.split('|');

    if (typeof tags === 'object')
      this.tags = tags;

    if (!this.isShowing)
      this.updateElement();
  }

  removeTag(e) {
    var $currentTarget = $(e.currentTarget);
    var index = this.tags.indexOf($currentTarget.data('value').toString());
    if (index > -1) {
      this.tags.splice(index, 1);
    }

    $currentTarget.closest('.tag').remove();
    this.updateView();
    this.updateElement();

    if (this.autoApply)
      this.clickApply();
  }

  updateView() {
    this.$container.find('.tag-collection').html('');
    for (var value of this.tags) {
      this.$container.find('.tag-collection').prepend(`
        <div class="tag tag-interactive">
          <div class="tag-display-name">${value}</div>
          <span class="tag-action" data-value="${value}">
            <i class="zmdi zmdi-close-circle"></i>
          </span>
        </div>
      `);
    }
  }

  show() {
    if (this.isShowing) return;

    // Create a click proxy that is private to this instance of datepicker, for unbinding
    this._outsideClickProxy = (e) => this.outsideClick(e);

    // Bind global datepicker mousedown for hiding and
    $(document)
      .on('mousedown.tagspicker', this._outsideClickProxy)
      // also support mobile devices
      .on('touchend.tagspicker', this._outsideClickProxy)
      // also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
      .on('click.tagspicker', '[data-toggle=dropdown]', this._outsideClickProxy)
      // and also close when focus changes to outside the picker (eg. tabbing between controls)
      .on('focusin.tagspicker', this._outsideClickProxy);

    this.updateView();
    this.$container.modal('show');
    this.$picker.trigger('show.tagspicker', this);
    this.isShowing = true;
    this.isApply = false;
  }

  hide() {
    if (!this.isShowing) return;

    // if apply was clicked..
    if (this.isApply) {
      // invoke the user callback function
      this.callback(this.tags.join('|'));

      // if picker is attached to a text input, update it
      this.updateElement();
    }

    this.reset();
    $(document).off('.tagspicker');
    $(window).off('.tagspicker');
    this.$container.modal('hide');
    this.$picker.trigger('hide.tagspicker', this);
    this.isShowing = false;
    this.isApply = false;
  }

  reset() {
    this.$container.find('input').val('');
  }

  toggle() {
    if (this.isShowing) {
      this.hide();
    } else {
      this.show();
    }
  }

  outsideClick(e) {
    var target = $(e.target);
    // if the page is clicked anywhere except within the tagspicker/button
    // itself then call this.hide()
    if (
      // ie modal dialog fix
      e.type === 'focusin'
      || target.closest(this.$picker).length
      || target.closest(this.$container).length
    ) return;
    this.hide();
    this.$picker.trigger('outsideClick.tagspicker', this);
  }

  clickApply() {
    this.isApply = true;
    this.hide();
    this.$picker.trigger('apply.tagspicker', this);
  }

  formInputsChanged() {
    var value = this.$container.find('input').val();

    // add value
    this.tags.push(value);
    // remove duplicates
    this.tags = this.tags.filter((elem, pos, arr) => {
      return arr.indexOf(elem) === pos;
    });

    this.updateView();
  }

  formInputsKeypress(e) {
    // This function ensures that if the 'enter' key was pressed in the input, then
    // updated with the tags.
    // This behaviour is automatic in Chrome/Firefox/Edge but not in IE 11 hence why this exists.
    // Other browsers and versions of IE are untested and the behaviour is unknown.
    if (e.keyCode === 13) {
      // Prevent from being updated twice on Chrome/Firefox/Edge
      e.preventDefault();
      this.formInputsChanged(e);
      // Reset
      $(e.currentTarget).val('');

      if (this.autoApply)
        this.clickApply();
    }
  }

  elementChanged() {
    if (!this.$picker.is('input')) return;
    if (!this.$picker.val().length) return;

    this.setTags(this.$picker.val());
    this.updateView();
  }

  keydown(e) {
    // hide on tab or enter
    if ((e.keyCode === 9) || (e.keyCode === 13)) {
      this.hide();
    }

    // hide on esc and prevent propagation
    if (e.keyCode === 27) {
      e.preventDefault();
      e.stopPropagation();

      this.hide();
    }
  }

  updateElement() {
    if (this.$picker.is('input') && this.autoUpdateInput) {
      this.$picker.val(this.tags.join('|'));
      this.$picker.trigger('change');
    }
  }

  remove() {
    this.$container.remove();
    this.$picker.off('.tagspicker');
    this.$picker.removeData();
  }
}
