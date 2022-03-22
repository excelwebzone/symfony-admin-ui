import $ from 'jquery';
import moment from 'moment';

export default class DateRangePicker {
  constructor(pickerEl, options, cb) {
    this.parentEl = 'body';
    this.$picker = $(pickerEl);
    this.startDate = moment().startOf('day');
    this.endDate = moment().endOf('day');
    this.minDate = false;
    this.maxDate = false;
    this.maxSpan = false;
    this.autoApply = false;
    this.singleDatePicker = false;
    this.showDropdowns = false;
    this.minYear = moment().subtract(100, 'year').format('YYYY');
    this.maxYear = moment().add(100, 'year').format('YYYY');
    this.showWeekNumbers = false;
    this.showISOWeekNumbers = false;
    this.showCustomRangeLabel = true;
    this.timePicker = false;
    this.timePicker24Hour = false;
    this.timePickerIncrement = 1;
    this.timePickerHours = [];
    this.linkedCalendars = true;
    this.autoUpdateInput = true;
    this.alwaysShowCalendars = false;
    this.useModal = false;
    this.ignoreMove = false;
    this.ranges = {};

    this.opens = 'right';
    if (this.$picker.hasClass('float-right'))
      this.opens = 'left';

    this.drops = 'down';
    if (this.$picker.hasClass('drop-up'))
      this.drops = 'up';

    this.locale = {
      direction: 'ltr',
      format: moment.localeData().longDateFormat('L'),
      dateFormat: moment.localeData().longDateFormat('L'),
      separator: ' - ',
      applyLabel: 'Apply',
      clearLabel: 'Clear',
      cancelLabel: 'Cancel',
      weekLabel: 'W',
      customRangeLabel: 'Custom Range',
      daysOfWeek: moment.weekdaysShort(),
      monthNames: moment.monthsShort(),
      firstDay: moment.localeData().firstDayOfWeek()
    };

    this.callback = function() {};

    // some state information
    this.isShowing = false;
    this.isApply = false;
    this.leftCalendar = {};
    this.rightCalendar = {};

    // custom options from user
    if (typeof options !== 'object' || options === null)
      options = {};

    if (typeof options.useModal !== 'boolean')
      options.useModal = false;

    // allow setting options with data attributes
    // data-api options will be overwritten with custom javascript options
    options = $.extend(this.$picker.data(), options);

    // html template for the picker UI
    if (typeof options.template !== 'string' && !(options.template instanceof $))
      if (options.useModal)
        options.template = `
            <div class="modal modal-calendar">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-body">
                    <div class="range-select range-select-date-range">
                      <div class="range-select-content">
                        <div class="filter-calendar from-date-selector">
                          <div class="calendar left"></div>
                          <div class="range-select-range-field">
                            <div class="has-floating-label">
                              <select class="time-select"></select>
                              <input type="text" class="date-input input-text ignore-input" placeholder=" " maxlength="10" />
                              <label>From:</label>
                            </div>
                          </div>
                        </div>
                        <div class="filter-calendar to-date-selector">
                          <div class="calendar right"></div>
                          <div class="range-select-range-field">
                            <div class="has-floating-label">
                              <select class="time-select"></select>
                              <input type="text" class="date-input input-text ignore-input" placeholder=" " maxlength="10" />
                              <label>To:</label>
                            </div>
                          </div>
                        </div>
                        <div class="filter-calendar-button-panel">
                          <div class="ranges"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="modal-footer range-select-footer">
                    <div class="range-select-button-section">
                      <button type="button" class="btn btn-flat-default cancel-button" data-dismiss="modal"></button>
                      <button type="button" class="btn btn-flat-secondary clear-button"></button>
                      <button type="button" class="btn btn-primary apply-button"></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
      else
        options.template = `
            <div class="range-select-container">
              <div class="range-select range-select-date-range">
                <div class="range-select-content">
                  <div class="filter-calendar from-date-selector">
                    <div class="calendar left"></div>
                    <div class="range-select-range-field">
                      <div class="has-floating-label">
                        <select class="time-select"></select>
                        <input type="text" class="date-input input-text ignore-input" placeholder=" " maxlength="10" />
                        <label>From:</label>
                      </div>
                    </div>
                  </div>
                  <div class="filter-calendar to-date-selector">
                    <div class="calendar right"></div>
                    <div class="range-select-range-field">
                      <div class="has-floating-label">
                        <select class="time-select"></select>
                        <input type="text" class="date-input input-text ignore-input" placeholder=" " maxlength="10" />
                        <label>To:</label>
                      </div>
                    </div>
                  </div>
                  <div class="filter-calendar-button-panel">
                    <div class="ranges"></div>
                  </div>
                </div>
                <div class="range-select-footer">
                  <div class="range-select-button-section">
                    <button type="button" class="btn btn-flat-default cancel-button"></button>
                    <button type="button" class="btn btn-flat-secondary clear-button"></button>
                    <button type="button" class="btn btn-primary apply-button"></button>
                  </div>
                </div>
              </div>
              <div class="range-select-nub"></div>
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

      if (typeof options.locale.format === 'string')
        this.locale.format = options.locale.format;

      if (typeof options.locale.dateFormat === 'string')
        this.locale.format = options.locale.dateFormat;

      if (typeof options.locale.separator === 'string')
        this.locale.separator = options.locale.separator;

      if (typeof options.locale.daysOfWeek === 'object')
        this.locale.daysOfWeek = options.locale.daysOfWeek.slice();

      if (typeof options.locale.monthNames === 'object')
        this.locale.monthNames = options.locale.monthNames.slice();

      if (typeof options.locale.firstDay === 'number')
        this.locale.firstDay = options.locale.firstDay;

      if (typeof options.locale.applyLabel === 'string')
        this.locale.applyLabel = options.locale.applyLabel;

      if (typeof options.locale.clearLabel === 'string')
        this.locale.clearLabel = options.locale.clearLabel;

      if (typeof options.locale.cancelLabel === 'string')
        this.locale.cancelLabel = options.locale.cancelLabel;

      if (typeof options.locale.weekLabel === 'string')
        this.locale.weekLabel = options.locale.weekLabel;

      if (typeof options.locale.customRangeLabel === 'string') {
        // support unicode chars in the custom range name.
        let elem = document.createElement('textarea');
        elem.innerHTML = options.locale.customRangeLabel;
        let rangeHtml = elem.value;
        this.locale.customRangeLabel = rangeHtml;
      }
    }
    this.$container.addClass(this.locale.direction);

    if (typeof options.startDate === 'string')
      this.startDate = moment(options.startDate, this.locale.format);

    if (typeof options.endDate === 'string')
      this.endDate = moment(options.endDate, this.locale.format);

    if (typeof options.minDate === 'string')
      this.minDate = moment(options.minDate, this.locale.format);

    if (typeof options.maxDate === 'string')
      this.maxDate = moment(options.maxDate, this.locale.format);

    if (typeof options.startDate === 'object')
      this.startDate = moment(options.startDate);

    if (typeof options.endDate === 'object')
      this.endDate = moment(options.endDate);

    if (typeof options.minDate === 'object')
      this.minDate = moment(options.minDate);

    if (typeof options.maxDate === 'object')
      this.maxDate = moment(options.maxDate);

    // sanity check for bad options
    if (this.minDate && this.startDate.isBefore(this.minDate))
      this.startDate = this.minDate.clone();

    // sanity check for bad options
    if (this.maxDate && this.endDate.isAfter(this.maxDate))
      this.endDate = this.maxDate.clone();

    if (typeof options.maxSpan === 'object')
      this.maxSpan = options.maxSpan;

    if (typeof options.dateLimit === 'object') // backwards compat
      this.maxSpan = options.dateLimit;

    if (typeof options.opens === 'string')
      this.opens = options.opens;

    if (typeof options.drops === 'string')
      this.drops = options.drops;

    if (typeof options.showWeekNumbers === 'boolean')
      this.showWeekNumbers = options.showWeekNumbers;

    if (typeof options.showISOWeekNumbers === 'boolean')
      this.showISOWeekNumbers = options.showISOWeekNumbers;

    if (typeof options.showDropdowns === 'boolean')
      this.showDropdowns = options.showDropdowns;

    if (typeof options.minYear === 'number')
      this.minYear = options.minYear;

    if (typeof options.maxYear === 'number')
      this.maxYear = options.maxYear;

    if (typeof options.showCustomRangeLabel === 'boolean')
      this.showCustomRangeLabel = options.showCustomRangeLabel;

    if (typeof options.singleDatePicker === 'boolean') {
      this.singleDatePicker = options.singleDatePicker;
      if (this.singleDatePicker)
        this.endDate = this.startDate.clone();
    }

    if (typeof options.timePicker === 'boolean')
      this.timePicker = options.timePicker;

    if (typeof options.timePicker24Hour === 'boolean')
      this.timePicker24Hour = options.timePicker24Hour;

    if (typeof options.timePickerIncrement === 'number')
      this.timePickerIncrement = options.timePickerIncrement;

    if (typeof options.timePickerHours === 'object')
      this.timePickerHours = options.timePickerHours;

    if (typeof options.autoApply === 'boolean')
      this.autoApply = options.autoApply;

    if (typeof options.autoUpdateInput === 'boolean')
      this.autoUpdateInput = options.autoUpdateInput;

    if (typeof options.linkedCalendars === 'boolean')
      this.linkedCalendars = options.linkedCalendars;

    if (typeof options.isInvalidDate === 'function')
      this.isInvalidDate = options.isInvalidDate;

    if (typeof options.isCustomDate === 'function')
      this.isCustomDate = options.isCustomDate;

    if (typeof options.alwaysShowCalendars === 'boolean')
      this.alwaysShowCalendars = options.alwaysShowCalendars;

    if (typeof options.useModal === 'boolean')
      this.useModal = options.useModal;

    if (typeof options.ignoreMove === 'boolean')
      this.ignoreMove = options.ignoreMove;

    // update day names order to firstDay
    if (this.locale.firstDay !== 0) {
      let iterator = this.locale.firstDay;
      while (iterator > 0) {
        this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
        iterator--;
      }
    }

    let start, end, range;

    // if no start/end dates set, check if an input element contains initial values
    if (typeof options.startDate === 'undefined' && typeof options.endDate === 'undefined') {
      if ($(this.$picker).is(':text')) {
        let val = $(this.$picker).val();
        let split = val.split(this.locale.separator);

        start = end = null;

        if (split.length === 2) {
          start = moment(split[0], this.locale.format);
          end = moment(split[1], this.locale.format);
        } else if (this.singleDatePicker && val !== '') {
          start = moment(val, this.locale.format);
          end = moment(val, this.locale.format);
        }
        if (start !== null && end !== null) {
          this.setStartDate(start);
          this.setEndDate(end);
        }
      }
    }

    if (typeof options.ranges === 'object') {
      for (range in options.ranges) {
        if (typeof options.ranges[range][0] === 'string')
          start = moment(options.ranges[range][0], this.locale.format);
        else
          start = moment(options.ranges[range][0]);

        if (typeof options.ranges[range][1] === 'string')
          end = moment(options.ranges[range][1], this.locale.format);
        else
          end = moment(options.ranges[range][1]);

        if (this.timePicker) {
          // round to nearest timePickerIncrement minutes and force zero seconds
          start.minute(Math.round(start.minute() / this.timePickerIncrement) * this.timePickerIncrement).second(0);
          end.minute(Math.round(end.minute() / this.timePickerIncrement) * this.timePickerIncrement).second(0);
        }

        // if the start or end date exceed those allowed by the minDate or maxSpan
        // options, shorten the range to the allowable period.
        if (this.minDate && start.isBefore(this.minDate))
          start = this.minDate.clone();

        let maxDate = this.maxDate;
        if (this.maxSpan && maxDate && start.clone().add(this.maxSpan).isAfter(maxDate))
          maxDate = start.clone().add(this.maxSpan);
        if (maxDate && end.isAfter(maxDate))
          end = maxDate.clone();

        // if the end of the range is before the minimum or the start of the range is
        // after the maximum, don't display this range option at all.
        if ((this.minDate && end.isBefore(this.minDate, this.timepicker ? 'minute' : 'day'))
                  || (maxDate && start.isAfter(maxDate, this.timepicker ? 'minute' : 'day')))
          continue;

        // support unicode chars in the range names.
        let elem = document.createElement('textarea');
        elem.innerHTML = range;
        let rangeHtml = elem.value;

        this.ranges[rangeHtml] = [start, end];
      }

      let list = '<ul>';
      for (range in this.ranges) {
        list += `<li><button type="button" class="btn btn-flat-default" data-range-key="${range}">${range}</button></li>`;
      }
      if (this.showCustomRangeLabel) {
        list += `<li><button type="button" class="btn btn-flat-default" data-range-key="${this.locale.customRangeLabel}">${this.locale.customRangeLabel}</button></li>`;
      }
      list += '</ul>';

      this.$container.find('.ranges').prepend(list);
    }

    if (typeof cb === 'function') {
      this.callback = cb;
    }

    if (this.autoApply && typeof options.ranges !== 'object') {
      this.$container.find('.ranges').hide();
    } else if (this.autoApply) {
      this.$container.find('.apply-button, .clear-button').hide();
    }

    if (!this.timePicker) {
      this.startDate = this.startDate.startOf('day');
      this.endDate = this.endDate.endOf('day');

      this.$container.find('.time-select').hide();
    }

    // can't be used together for now
    if (this.timePicker && this.autoApply)
      this.autoApply = false;

    if (this.singleDatePicker) {
      this.$container.addClass('single');
      this.$container.find('.from-date-selector').addClass('single');
      this.$container.find('.from-date-selector').show();
      this.$container.find('.to-date-selector').hide();

      if (!this.timePicker) {
        this.$container.find('.range-select-range-field').hide();
        this.$container.find('.range-select-footer').hide();
        this.$container.find('.filter-calendar-button-panel').hide();
      }
    }

    if ((typeof options.ranges === 'undefined' && !this.singleDatePicker) || this.alwaysShowCalendars) {
      this.$container.addClass('show-calendar');
    }

    this.$container.addClass(`opens-${this.opens}`);

    // swap the position of the predefined ranges if opens right
    if (typeof options.ranges !== 'undefined' && this.opens === 'right') {
      this.$container.find('.filter-calendar-button-panel').prependTo(this.$container.find('.range-select-content'));
    }

    // apply labels to buttons
    this.$container.find('.apply-button').html(this.locale.applyLabel);
    this.$container.find('.clear-button').html(this.locale.clearLabel);
    this.$container.find('.cancel-button').html(this.locale.cancelLabel);

    //
    // event listeners
    //

    this.$container.find('.calendar')
      .on('click.daterangepicker', '.ui-datepicker-prev', (e) => this.clickPrev(e))
      .on('click.daterangepicker', '.ui-datepicker-next', (e) => this.clickNext(e))
      .on('mousedown.daterangepicker', 'td.ui-datepicker-current-day', (e) => this.clickDate(e))
      .on('mouseenter.daterangepicker', 'td.ui-datepicker-current-day', (e) => this.hoverDate(e))
      .on('mouseleave.daterangepicker', 'td.ui-datepicker-current-day', () => this.updateFormInputs())
      .on('change.daterangepicker', 'select.year-select', (e) => this.monthOrYearChanged(e))
      .on('change.daterangepicker', 'select.month-select', (e) => this.monthOrYearChanged(e));

    this.$container.find('select.time-select')
      .on('change.daterangepicker', (e) => this.timeChanged(e));

    this.$container.find('.range-select-range-field')
      .on('click.daterangepicker', 'input', () => this.showCalendars())
      .on('focus.daterangepicker', 'input', (e) => this.formInputsFocused(e))
      .on('blur.daterangepicker', 'input', () => this.formInputsBlurred())
      .on('change.daterangepicker', 'input', (e) => this.formInputsChanged(e))
      .on('keydown.daterangepicker', 'input', (e) => this.formInputsKeydown(e));

    this.$container.find('.ranges')
      .on('click.daterangepicker', 'button', (e) => this.clickRange(e))
      .on('mouseenter.daterangepicker', 'button', (e) => this.hoverRange(e))
      .on('mouseleave.daterangepicker', 'button', () => this.updateFormInputs());

    this.$container
      .on('click.daterangepicker', 'button.apply-button', () => this.clickApply())
      .on('click.daterangepicker', 'button.clear-button', () => this.clickClear())
      .on('click.daterangepicker', 'button.cancel-button', () => this.clickCancel());

    if (this.$picker.is('input') || this.$picker.is('button')) {
      this.$picker.on({
        'click.daterangepicker': () => this.show(),
        'focus.daterangepicker': () => this.show(),
        'keyup.daterangepicker': () => this.elementChanged(),
        'keydown.daterangepicker': (e) => this.keydown(e) // IE 11 compatibility
      });
    } else {
      this.$picker.on('click.daterangepicker', () => this.toggle());
      this.$picker.on('keydown.daterangepicker', () => this.toggle());
    }

    // if attached to a text input, set the initial value
    if (this.$picker.val()) {
      this.updateElement();
    }
  }

  setStartDate(startDate) {
    if (typeof startDate === 'string')
      this.startDate = moment(startDate, this.locale.format);

    if (typeof startDate === 'object')
      this.startDate = moment(startDate);

    if (!this.timePicker)
      this.startDate = this.startDate.startOf('day');

    if (this.timePicker && this.timePickerIncrement)
      this.startDate.minute(Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

    if (this.minDate && this.startDate.isBefore(this.minDate)) {
      this.startDate = this.minDate.clone();
      if (this.timePicker && this.timePickerIncrement)
        this.startDate.minute(Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
    }

    if (this.maxDate && this.startDate.isAfter(this.maxDate)) {
      this.startDate = this.maxDate.clone();
      if (this.timePicker && this.timePickerIncrement)
        this.startDate.minute(Math.floor(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
    }

    if (!this.isShowing)
      this.updateElement();

    this.updateMonthsInView();
  }

  setEndDate(endDate) {
    if (typeof endDate === 'string')
      this.endDate = moment(endDate, this.locale.format);

    if (typeof endDate === 'object')
      this.endDate = moment(endDate);

    if (!this.timePicker)
      this.endDate = this.endDate.endOf('day');

    if (this.timePicker && this.timePickerIncrement)
      this.endDate.minute(Math.round(this.endDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

    if (this.endDate.isBefore(this.startDate))
      this.endDate = this.startDate.clone();

    if (this.maxDate && this.endDate.isAfter(this.maxDate))
      this.endDate = this.maxDate.clone();

    if (this.maxSpan && this.startDate.clone().add(this.maxSpan).isBefore(this.endDate))
      this.endDate = this.startDate.clone().add(this.maxSpan);

    this.previousRightTime = this.endDate.clone();

    if (!this.isShowing)
      this.updateElement();

    this.updateMonthsInView();
  }

  isInvalidDate() {
    return false;
  }

  isCustomDate() {
    return false;
  }

  updateView() {
    if (this.timePicker) {
      this.renderTimePicker('left');
      this.renderTimePicker('right');

      if (!this.endDate) {
        this.$container.find('.to-date-selector .time-select').disable();
      } else {
        this.$container.find('.to-date-selector .time-select').enable();
      }
    }

    if (!this.endDate) {
      this.$container.find('.to-date-selector .date-input').disable();
    } else {
      this.$container.find('.to-date-selector .date-input').enable();
    }

    this.updateMonthsInView();
    this.updateCalendars();
    this.updateFormInputs();
  }

  updateMonthsInView() {
    if (this.endDate) {
      // if both dates are visible already, do nothing
      if (!this.singleDatePicker && this.leftCalendar.month && this.rightCalendar.month
        && (this.startDate.format('YYYY-MM') === this.leftCalendar.month.format('YYYY-MM') || this.startDate.format('YYYY-MM') === this.rightCalendar.month.format('YYYY-MM'))
        && (this.endDate.format('YYYY-MM') === this.leftCalendar.month.format('YYYY-MM') || this.endDate.format('YYYY-MM') === this.rightCalendar.month.format('YYYY-MM'))
      ) {
        return;
      }

      this.leftCalendar.month = this.startDate.clone().date(2);
      if (!this.linkedCalendars && (this.endDate.month() !== this.startDate.month() || this.endDate.year() !== this.startDate.year())) {
        this.rightCalendar.month = this.endDate.clone().date(2);
      } else {
        this.rightCalendar.month = this.startDate.clone().date(2).add(1, 'month');
      }
    } else {
      if (this.leftCalendar.month.format('YYYY-MM') !== this.startDate.format('YYYY-MM') && this.rightCalendar.month.format('YYYY-MM') !== this.startDate.format('YYYY-MM')) {
        this.leftCalendar.month = this.startDate.clone().date(2);
        this.rightCalendar.month = this.startDate.clone().date(2).add(1, 'month');
      }
    }
    if (this.maxDate && this.linkedCalendars && !this.singleDatePicker && this.rightCalendar.month > this.maxDate) {
      this.rightCalendar.month = this.maxDate.clone().date(2);
      this.leftCalendar.month = this.maxDate.clone().date(2).subtract(1, 'month');
    }
  }

  updateCalendars() {
    if (this.timePicker) {
      let time = this.$container.find(`.${this.endDate ? 'from' : 'to'}-date-selector .time-select`).val();
      let hour = time ? parseInt(time.split(':')[0], 10) : 0;
      let minute = time ? parseInt(time.split(':')[1], 10) : 0;

      this.leftCalendar.month.hour(hour).minute(minute).second(0);
      this.rightCalendar.month.hour(hour).minute(minute).second(0);
    }

    this.renderCalendar('left');
    this.renderCalendar('right');

    // highlight any predefined range matching the current start and end dates
    this.$container.find('.ranges button').removeClass('btn-primary').addClass('btn-flat-default');
    if (this.endDate === null) return;

    this.calculateChosenLabel();
  }

  /**
   * Build the matrix of dates that will populate the calendar
   */
  renderCalendar(side) {
    let calendar = side === 'left' ? this.leftCalendar : this.rightCalendar;
    let month = calendar.month.month();
    let year = calendar.month.year();
    let hour = calendar.month.hour();
    let minute = calendar.month.minute();
    let second = calendar.month.second();
    let daysInMonth = moment([year, month]).daysInMonth();
    let firstDay = moment([year, month, 1]);
    let lastDay = moment([year, month, daysInMonth]);
    let lastMonth = moment(firstDay).subtract(1, 'month').month();
    let lastYear = moment(firstDay).subtract(1, 'month').year();
    let daysInLastMonth = moment([lastYear, lastMonth]).daysInMonth();
    let dayOfWeek = firstDay.day();

    // initialize a 6 rows x 7 columns array for the calendar
    calendar = [];
    calendar.firstDay = firstDay;
    calendar.lastDay = lastDay;

    for (let i = 0; i < 6; i++) {
      calendar[i] = [];
    }

    // populate the calendar with date objects
    let startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
    if (startDay > daysInLastMonth)
      startDay -= 7;

    if (dayOfWeek === this.locale.firstDay)
      startDay = daysInLastMonth - 6;

    let curDate = moment([lastYear, lastMonth, startDay, 12, minute, second]);

    for (let i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = moment(curDate).add(24, 'hour')) {
      if (i > 0 && col % 7 === 0) {
        col = 0;
        row++;
      }

      calendar[row][col] = curDate.clone().hour(hour).minute(minute).second(second);
      curDate.hour(12);

      if (this.minDate && calendar[row][col].format('YYYY-MM-DD') === this.minDate.format('YYYY-MM-DD') && calendar[row][col].isBefore(this.minDate) && side === 'left') {
        calendar[row][col] = this.minDate.clone();
      }

      if (this.maxDate && calendar[row][col].format('YYYY-MM-DD') === this.maxDate.format('YYYY-MM-DD') && calendar[row][col].isAfter(this.maxDate) && side === 'right') {
        calendar[row][col] = this.maxDate.clone();
      }
    }

    // make the calendar object available to hoverDate/clickDate
    if (side === 'left') {
      this.leftCalendar.calendar = calendar;
    } else {
      this.rightCalendar.calendar = calendar;
    }

    //
    // Display the calendar
    //

    var minDate = side === 'left' ? this.minDate : this.startDate;
    var maxDate = this.maxDate;

    let html = '<div class="ui-datepicker"><div class="ui-datepicker-header">';

    if ((!minDate || minDate.isBefore(calendar.firstDay)) && (!this.linkedCalendars || side === 'left')) {
      html += '<a class="ui-datepicker-prev" title="Prev"><span class="ui-icon ui-icon-circle-triangle-w">Prev</span></a>';
    }

    let monthHtml = this.locale.monthNames[calendar[1][1].month()];
    let yearHtml = calendar[1][1].format('YYYY');

    if (this.showDropdowns) {
      let currentMonth = calendar[1][1].month();
      let currentYear = calendar[1][1].year();
      let maxYear = (maxDate && maxDate.year()) || (this.maxYear);
      let minYear = (minDate && minDate.year()) || (this.minYear);
      let inMinYear = currentYear === minYear;
      let inMaxYear = currentYear === maxYear;

      monthHtml = '<select class="month-select">';
      for (let m = 0; m < 12; m++) {
        if ((!inMinYear || (minDate && m >= minDate.month())) && (!inMaxYear || (maxDate && m <= maxDate.month()))) {
          monthHtml += `<option value="${m}" ${m === currentMonth ? 'selected="selected"' : ''}>${this.locale.monthNames[m]}</option>`;
        } else {
          monthHtml += `<option value="${m}" ${m === currentMonth ? 'selected="selected"' : ''} disabled="disabled">${this.locale.monthNames[m]}</option>`;
        }
      }
      monthHtml += '</select>';

      yearHtml = '<select class="year-select">';
      for (let y = minYear; y <= maxYear; y++) {
        yearHtml += `<option value="${y}" ${y === currentYear ? 'selected="selected"' : ''}>${y}</option>`;
      }
      yearHtml += '</select>';
    }

    html += `<div class="ui-datepicker-title">
      <span class="ui-datepicker-month">${monthHtml}</span>&nbsp;<span class="ui-datepicker-year">${yearHtml}</span>
    </div>`;

    if ((!maxDate || maxDate.isAfter(calendar.lastDay)) && (!this.linkedCalendars || side === 'right' || this.singleDatePicker)) {
      html += '<a class="ui-datepicker-next" title="Next"><span class="ui-icon ui-icon-circle-triangle-e">Next</span></a>';
    }

    html += '</div>'; // end `ui-datepicker-header`
    html += '<table class="ui-datepicker-calendar"><thead><tr>';

    // add week number label
    if (this.showWeekNumbers || this.showISOWeekNumbers)
      html += `<th class="week">${this.locale.weekLabel}</th>`;

    for (let [index, dayOfWeek] of Object.entries(this.locale.daysOfWeek)) {
      html += `<th><span title="${this.locale.monthNames[index]}">${dayOfWeek}</span></th>`;
    }

    html += '</tr></thead><tbody>';

    // adjust maxDate to reflect the maxSpan setting in order to
    // grey out end dates beyond the maxSpan
    if (this.endDate === null && this.maxSpan) {
      var maxLimit = this.startDate.clone().add(this.maxSpan).endOf('day');
      if (!maxDate || maxLimit.isBefore(maxDate)) {
        maxDate = maxLimit;
      }
    }

    for (let row = 0; row < 6; row++) {
      html += '<tr>';

      // add week number
      if (this.showWeekNumbers)
        html += `<td class="ui-datepicker-week">${calendar[row][0].week()}</td>`;
      else if (this.showISOWeekNumbers)
        html += `<td class="ui-datepicker-week">${calendar[row][0].isoWeek()}</td>`;

      for (let col = 0; col < 7; col++) {
        let classes = [];

        // mark first day of the month
        if (calendar[row][col].date() === calendar[row][col].clone().startOf('month').date())
          classes.push('is-first');

        // mark last day of the month
        if (calendar[row][col].date() === calendar[row][col].clone().endOf('month').date())
          classes.push('is-last');

        // highlight today's date
        if (calendar[row][col].isSame(new Date(), 'day'))
          classes.push('ui-datepicker-today');

        // highlight weekends
        if (calendar[row][col].isoWeekday() > 5)
          classes.push('ui-datepicker-weekend');

        // grey out the dates in other months displayed at beginning and end of this calendar
        if (calendar[row][col].month() !== calendar[1][1].month())
          classes.push('ui-datepicker-other-month', 'ui-datepicker-ends');

        // don't allow selection of dates before the minimum date
        if (this.minDate && calendar[row][col].isBefore(this.minDate, 'day'))
          classes.push('ui-state-disabled');

        // don't allow selection of dates after the maximum date
        if (maxDate && calendar[row][col].isAfter(maxDate, 'day'))
          classes.push('ui-state-disabled');

        // don't allow selection of date if a custom function decides it's invalid
        if (this.isInvalidDate(calendar[row][col]))
          classes.push('ui-state-disabled');

        // highlight the currently selected start date
        if (calendar[row][col].format('YYYY-MM-DD') === this.startDate.format('YYYY-MM-DD'))
          classes.push('is-selected', 'is-from');

        // highlight the currently selected end date
        if (this.endDate !== null && calendar[row][col].format('YYYY-MM-DD') === this.endDate.format('YYYY-MM-DD'))
          classes.push('is-selected', 'is-to');

        // highlight dates in-between the selected dates
        if (this.endDate !== null && calendar[row][col] > this.startDate && calendar[row][col] < this.endDate)
          classes.push('is-in-range');

        // apply custom classes for this date
        let isCustom = this.isCustomDate(calendar[row][col]);
        if (isCustom !== false) {
          if (typeof isCustom === 'string')
            classes.push(isCustom);
          else
            Array.prototype.push.apply(classes, isCustom);
        }

        if (classes.indexOf('ui-state-disabled') === -1)
          classes.push('ui-datepicker-current-day');

        html += `<td class="${classes.join(' ').replace(/^\s+|\s+$/g, '')}" data-title="r${row}c${col}"><span>${calendar[row][col].date()}</span></td>`;
      }

      html += '</tr>';
    }

    html += '</tbody></table></div>';

    this.$container.find(`.calendar.${side}`).html(html);
  }

  renderTimePicker(side) {
    // don't bother updating the time picker if it's currently disabled
    // because an end date hasn't been clicked yet
    if (side === 'right' && !this.endDate) return;

    let selected;
    let minDate;
    let maxDate = this.maxDate;

    if (this.maxSpan && (!this.maxDate || this.startDate.clone().add(this.maxSpan).isBefore(this.maxDate)))
      maxDate = this.startDate.clone().add(this.maxSpan);

    if (side === 'left') {
      selected = this.startDate.clone();
      minDate = this.minDate;
    } else if (side === 'right') {
      selected = this.endDate.clone();
      minDate = this.startDate;

      // preserve the time already selected
      let $timeSelector = this.$container.find('.to-date-selector .time-select');
      if ($timeSelector.html() !== '') {
        selected.hour(!isNaN(selected.hour()) ? selected.hour() : ($timeSelector.val() || '00:00').split(':')[0]);
        selected.minute(!isNaN(selected.minute()) ? selected.minute() : ($timeSelector.val() || '00:00').split(':')[1]);
        selected.second(0);
      }

      if (selected.isBefore(this.startDate))
        selected = this.startDate.clone();

      if (maxDate && selected.isAfter(maxDate))
        selected = maxDate.clone();
    }

    // force zero seconds
    selected.second(0);

    let hours = [];
    if (this.timePickerHours.length === 0) {
      for (let hour = 0; hour < 24; hour++) {
        hours.push(hour);
      }
    }

    // check and update selected option
    let found = false;
    for (let hour of hours) {
      for (let m = 0; m < Math.round(60 / this.timePickerIncrement); m++) {
        let minute = m * this.timePickerIncrement;
        let time = selected.clone().hour(hour).minute(minute);
        if (time.isSame(selected)) {
          found = true;
          break;
        }
      }
    }
    if (!found) {
      selected.hour(0).minute(0);

      if (side === 'left') {
        this.startDate.hour(0).minute(0);
      } else if (side === 'right') {
        this.endDate.hour(0).minute(0);
      }
    }

    let choices = [];
    for (let hour of hours) {
      for (let m = 0; m < Math.round(60 / this.timePickerIncrement); m++) {
        let minute = m * this.timePickerIncrement;

        let timeLabel = hour < 10 ? String(hour).padStart(2, '0') : hour;
        if (this.timePicker24Hour)
          timeLabel += `:${minute < 10 ? String(minute).padStart(2, '0') : minute}`;
        else if (hour === 0)
          timeLabel = `12:${minute < 10 ? String(minute).padStart(2, '0') : minute} AM`;
        else if (hour === 12)
          timeLabel += `:${minute < 10 ? String(minute).padStart(2, '0') : minute} PM`;
        else if (hour < 12)
          timeLabel += `:${minute < 10 ? String(minute).padStart(2, '0') : minute} AM`;
        else if (hour > 12) {
          timeLabel = (hour - 12) < 10 ? String(hour - 12).padStart(2, '0') : (hour - 12);
          timeLabel += `:${minute < 10 ? String(minute).padStart(2, '0') : minute} PM`;
        }

        if (hour === 0 && minute === 0)
          timeLabel = 'Midnight';
        else if (hour === 12 && minute === 0)
          timeLabel = 'Noon';

        let time = selected.clone().hour(hour).minute(minute);
        let isDisabled = (minDate && time.isBefore(minDate))
          || (maxDate && time.isAfter(maxDate));

        let isSelected = time.isSame(selected);

        choices.push(`<option value="${hour < 10 ? String(hour).padStart(2, '0') : hour}:${minute < 10 ? String(minute).padStart(2, '0') : minute}" ${isSelected ? 'selected="selected"' : ''} ${isDisabled ? 'disabled="disabled"' : ''}>${timeLabel}</option>`);
      }
    }

    this.$container.find(`.${side === 'left' ? 'from' : 'to'}-date-selector .time-select`).html(choices.join(''));
  }

  updateFormInputs() {
    // ignore mouse movements while an above-calendar text input has focus
    if (this.$container.find('.from-date-selector .date-input').is(':focus') || this.$container.find('.to-date-selector .date-input').is(':focus'))
      return;

    this.$container.find('.from-date-selector .date-input').val(this.startDate.format(this.locale.dateFormat));
    if (this.endDate)
      this.$container.find('.to-date-selector .date-input').val(this.endDate.format(this.locale.dateFormat));

    if (this.singleDatePicker || (this.endDate && (this.startDate.isBefore(this.endDate) || this.startDate.isSame(this.endDate)))) {
      this.$container.find('button.apply-button').enable();
    } else {
      this.$container.find('button.apply-button').disable();
    }
  }

  move() {
    if (this.ignoreMove || this.useModal) return;

    let parentOffset = { top: 0, left: 0 };
    let containerTop;
    let drops = this.drops;

    let parentRightEdge = $(window).width();
    if (!this.parentEl.is('body')) {
      parentOffset = {
        top: this.parentEl.offset().top - this.parentEl.scrollTop(),
        left: this.parentEl.offset().left - this.parentEl.scrollLeft()
      };

      parentRightEdge = this.parentEl[0].clientWidth + this.parentEl.offset().left;
    }

    switch (drops) {
      case 'auto':
        containerTop = this.$picker.offset().top + this.$picker.outerHeight() - parentOffset.top;
        if (containerTop + this.$container.outerHeight() >= this.parentEl[0].scrollHeight) {
          containerTop = this.$picker.offset().top - this.$container.outerHeight() - parentOffset.top;
          drops = 'up';
        }

        break;

      case 'up':
        containerTop = this.$picker.offset().top - this.$container.outerHeight() - parentOffset.top;
        break;

      default:
        containerTop = this.$picker.offset().top + this.$picker.outerHeight() - parentOffset.top;
        break;
    }

    // force the container to it's actual width
    this.$container.css({
      top: 0,
      left: 0,
      right: 'auto'
    });

    let containerWidth = this.$container.outerWidth();

    this.$container.toggleClass('drop-up', drops === 'up');

    if (this.opens === 'left') {
      let containerRight = parentRightEdge - this.$picker.offset().left - this.$picker.outerWidth();

      if (containerWidth + containerRight > $(window).width()) {
        this.$container.css({
          top: containerTop,
          right: 'auto',
          left: 9
        });
      } else {
        this.$container.css({
          top: containerTop,
          right: containerRight,
          left: 'auto'
        });
      }
    } else if (this.opens === 'center') {
      let containerLeft = this.$picker.offset().left - parentOffset.left + this.$picker.outerWidth() / 2 - containerWidth / 2;

      if (containerLeft < 0) {
        this.$container.css({
          top: containerTop,
          right: 'auto',
          left: 9
        });
      } else if (containerLeft + containerWidth > $(window).width()) {
        this.$container.css({
          top: containerTop,
          left: 'auto',
          right: 0
        });
      } else {
        this.$container.css({
          top: containerTop,
          left: containerLeft,
          right: 'auto'
        });
      }
    } else {
      let containerLeft = this.$picker.offset().left - parentOffset.left;

      if (containerLeft + containerWidth > $(window).width()) {
        this.$container.css({
          top: containerTop,
          left: 'auto',
          right: 0
        });
      } else {
        this.$container.css({
          top: containerTop,
          left: containerLeft,
          right: 'auto'
        });
      }
    }
  }

  show() {
    if (this.isShowing) return;

    // create a click proxy that is private to this instance of datepicker, for unbinding
    this._outsideClickProxy = (e) => this.outsideClick(e);

    // bind global datepicker mousedown for hiding and
    $(document)
      .on('mousedown.daterangepicker', this._outsideClickProxy)
      // also support mobile devices
      .on('touchend.daterangepicker', this._outsideClickProxy)
      // also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
      .on('click.daterangepicker', '[data-toggle=dropdown]', this._outsideClickProxy)
      // and also close when focus changes to outside the picker (eg. tabbing between controls)
      .on('focusin.daterangepicker', this._outsideClickProxy);

    // reposition the picker if the window is resized while it's open
    $(window).on('resize.daterangepicker', this.move());

    this.oldStartDate = this.startDate.clone();
    this.oldEndDate = this.endDate.clone();
    this.previousRightTime = this.endDate.clone();

    this.updateView();

    if (this.useModal)
      this.$container.modal('show');
    else
      this.$container.show();

    this.move();
    this.$picker.trigger('show.daterangepicker', this);
    this.isShowing = true;
    this.isApply = false;
  }

  hide() {
    if (!this.isShowing) return;

    // incomplete date selection, revert to last values
    if (!this.endDate) {
      this.startDate = this.oldStartDate.clone();
      this.endDate = this.oldEndDate.clone();
    }

    if (this.isApply) {
      // if a new date range was selected, invoke the user callback function
      this.callback(this.startDate.clone(), this.endDate.clone(), this.chosenLabel);

      // if picker is attached to a text input, update it
      this.updateElement();
    }

    $(document).off('.daterangepicker');
    $(window).off('.daterangepicker');

    if (this.useModal)
      this.$container.modal('hide');
    else
      this.$container.hide();

    this.$picker.trigger('hide.daterangepicker', this);
    this.isShowing = false;
    this.isApply = false;
  }

  toggle() {
    if (this.isShowing) {
      this.hide();
    } else {
      this.show();
    }
  }

  outsideClick(e) {
    let target = $(e.target);
    // if the page is clicked anywhere except within the daterangerpicker/button
    // itself then call this.hide()
    if (
      // ie modal dialog fix
      e.type === 'focusin'
      || target.closest(this.$picker).length
      || target.closest(this.$container).length
    ) return;

    this.hide();

    this.$picker.trigger('outsideClick.daterangepicker', this);
  }

  showCalendars() {
    this.$container.addClass('show-calendar');
    this.move();
    this.$picker.trigger('showCalendar.daterangepicker', this);
  }

  hideCalendars() {
    this.$container.removeClass('show-calendar');
    this.$picker.trigger('hideCalendar.daterangepicker', this);
  }

  hoverRange(e) {
    // ignore mouse movements while an above-calendar text input has focus
    if (this.$container.find('.from-date-selector .date-input').is(':focus') || this.$container.find('.to-date-selector .date-input').is(':focus'))
      return;

    let label = e.target.getAttribute('data-range-key');

    if (label === this.locale.customRangeLabel) {
      this.updateView();
    } else {
      let dates = this.ranges[label];
      this.$container.find('.from-date-selector .date-input').val(dates[0].format(this.locale.dateFormat));
      this.$container.find('.to-date-selector .date-input').val(dates[1].format(this.locale.dateFormat));
    }
  }

  clickRange(e) {
    e.preventDefault();

    let label = e.target.getAttribute('data-range-key');
    this.chosenLabel = label;

    if (label === this.locale.customRangeLabel) {
      this.showCalendars();
    } else {
      let dates = this.ranges[label];
      this.startDate = dates[0];
      this.endDate = dates[1];

      if (!this.timePicker) {
        this.startDate.startOf('day');
        this.endDate.endOf('day');
      }

      if (!this.alwaysShowCalendars)
        this.hideCalendars();

      if (this.autoApply)
        this.clickApply();

      this.updateView();
    }
  }

  clickPrev(e) {
    let $calendar = $(e.currentTarget).parents('.calendar');
    if ($calendar.hasClass('left')) {
      this.leftCalendar.month.subtract(1, 'month');
      if (this.linkedCalendars)
        this.rightCalendar.month.subtract(1, 'month');
    } else {
      this.rightCalendar.month.subtract(1, 'month');
    }

    this.updateCalendars();
  }

  clickNext(e) {
    let $calendar = $(e.currentTarget).parents('.calendar');
    if ($calendar.hasClass('left')) {
      this.leftCalendar.month.add(1, 'month');
    } else {
      this.rightCalendar.month.add(1, 'month');
      if (this.linkedCalendars)
        this.leftCalendar.month.add(1, 'month');
    }

    this.updateCalendars();
  }

  hoverDate(e) {
    // ignore dates that can't be selected
    if (!$(e.currentTarget).hasClass('ui-datepicker-current-day')) return;

    // have the text inputs above calendars reflect the date being hovered over
    let title = $(e.currentTarget).attr('data-title');
    let row = title.substr(1, 1);
    let col = title.substr(3, 1);
    let $calendar = $(e.currentTarget).parents('.calendar');
    let date = $calendar.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

    if (this.endDate && !this.$container.find('.from-date-selector .date-input').is(':focus')) {
      this.$container.find('.from-date-selector .date-input').val(date.format(this.locale.dateFormat));
    } else if (!this.endDate && !this.$container.find('.to-date-selector .date-input').is(':focus')) {
      this.$container.find('.to-date-selector .date-input').val(date.format(this.locale.dateFormat));
    }

    // highlight the dates between the start date and the date being hovered as a potential end date
    let leftCalendar = this.leftCalendar;
    let rightCalendar = this.rightCalendar;
    let startDate = this.startDate;

    if (!this.endDate) {
      this.$container.find('.calendar tbody td').each(function(index, el) {
        // skip week numbers, only look at dates
        if ($(el).hasClass('ui-datepicker-week')) return;

        let title = $(el).attr('data-title');
        let row = title.substr(1, 1);
        let col = title.substr(3, 1);
        let $calendar = $(el).parents('.calendar');
        let checkDate = $calendar.hasClass('left') ? leftCalendar.calendar[row][col] : rightCalendar.calendar[row][col];

        if ((checkDate.isAfter(startDate) && checkDate.isBefore(date)) || checkDate.isSame(date, 'day')) {
          $(el).addClass('is-in-range');
        } else {
          $(el).removeClass('is-in-range');
        }
      });
    }
  }

  /**
   * List of items performed:
   * - alternate between selecting a start and end date for the range,
   * - if the time picker is enabled, apply the hour/minute/second from the select boxes to the clicked date
   * - if autoapply is enabled, and an end date was chosen, apply the selection
   * - if single date picker mode, and time picker isn't enabled, apply the selection immediately
   * - if one of the inputs above the calendars was focused, cancel that manual input
   */
  clickDate(e) {
    if (!$(e.currentTarget).hasClass('ui-datepicker-current-day')) return;

    let title = $(e.currentTarget).attr('data-title');
    let row = title.substr(1, 1);
    let col = title.substr(3, 1);
    let $calendar = $(e.currentTarget).parents('.calendar');
    let date = $calendar.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

    // picking start
    if (this.endDate || date.isBefore(this.startDate, 'day')) {
      if (this.timePicker) {
        let time = this.$container.find('.from-date-selector .time-select').val();
        let hour = time ? parseInt(time.split(':')[0], 10) : 0;
        let minute = time ? parseInt(time.split(':')[1], 10) : 0;

        date = date.clone().hour(hour).minute(minute).second(0);
      }

      this.endDate = null;
      this.setStartDate(date.clone());

    // special case: clicking the same date for start/end,
    // but the time of the end date is before the start date
    } else if (!this.endDate && date.isBefore(this.startDate)) {
      this.setEndDate(this.startDate.clone());

    // picking end
    } else {
      if (this.timePicker) {
        let time = this.$container.find('.to-date-selector .time-select').val();
        let hour = time ? parseInt(time.split(':')[0], 10) : 0;
        let minute = time ? parseInt(time.split(':')[1], 10) : 0;

        date = date.clone().hour(hour).minute(minute).second(0);
      }

      this.setEndDate(date.clone());

      if (this.autoApply) {
        this.calculateChosenLabel();
        this.clickApply();
      }
    }

    if (this.singleDatePicker) {
      this.setEndDate(this.startDate);

      if (!this.timePicker && this.autoApply)
        this.clickApply();
    }

    this.updateView();

    // this is to cancel the blur event handler if the mouse was in one of the inputs
    e.stopPropagation();
  }

  calculateChosenLabel() {
    // Remove selected button
    this.$container.find('.ranges button').removeClass('btn-primary');

    let format = this.timePicker ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
    let customRange = true;
    let i = 0;
    for (let range in this.ranges) {
      if (this.startDate.format(format) === this.ranges[range][0].format(format) && this.endDate.format(format) === this.ranges[range][1].format(format)) {
        customRange = false;
        this.chosenLabel = this.$container.find('.ranges button:eq(' + i + ')').removeClass('btn-flat-default').addClass('btn-primary').html();
        break;
      }

      i++;
    }

    if (customRange) {
      if (this.showCustomRangeLabel) {
        this.chosenLabel = this.$container.find('.ranges button:last').removeClass('btn-flat-default').addClass('btn-primary').html();
      } else {
        this.chosenLabel = null;
      }

      this.showCalendars();
    }
  }

  clickApply() {
    this.isApply = true;
    this.hide();
    this.$picker.trigger('apply.daterangepicker', this);
  }

  clickClear() {
    this.clickCancel();
    this.$picker.trigger('clear.daterangepicker', this);
  }

  clickCancel() {
    this.startDate = this.oldStartDate;
    this.endDate = this.oldEndDate;
    this.hide();
  }

  monthOrYearChanged(e) {
    let isLeft = $(e.currentTarget).closest('.calendar').hasClass('left');
    let leftOrRight = isLeft ? 'left' : 'right';
    let $calendar = this.$container.find(`.calendar.${leftOrRight}`);

    // month must be Number for new moment versions
    let month = parseInt($calendar.find('.month-select').val(), 10);
    let year = $calendar.find('.year-select').val();

    if (!isLeft) {
      if (year < this.startDate.year() || (year === this.startDate.year() && month < this.startDate.month())) {
        month = this.startDate.month();
        year = this.startDate.year();
      }
    }

    if (this.minDate) {
      if (year < this.minDate.year() || (year === this.minDate.year() && month < this.minDate.month())) {
        month = this.minDate.month();
        year = this.minDate.year();
      }
    }

    if (this.maxDate) {
      if (year > this.maxDate.year() || (year === this.maxDate.year() && month > this.maxDate.month())) {
        month = this.maxDate.month();
        year = this.maxDate.year();
      }
    }

    if (isLeft) {
      this.leftCalendar.month.month(month).year(year);
      if (this.linkedCalendars)
        this.rightCalendar.month = this.leftCalendar.month.clone().add(1, 'month');
    } else {
      this.rightCalendar.month.month(month).year(year);
      if (this.linkedCalendars)
        this.leftCalendar.month = this.rightCalendar.month.clone().subtract(1, 'month');
    }

    this.updateCalendars();
  }

  timeChanged(e) {
    let $target = $(e.currentTarget);
    let $calendar = $target.closest('.filter-calendar').find('.calendar');

    let hour = parseInt(($target.val() || '00:00').split(':')[0], 10);
    let minute = parseInt(($target.val() || '00:00').split(':')[1], 10);

    if ($calendar.hasClass('left')) {
      let start = this.startDate.clone();
      start.hour(hour);
      start.minute(minute);
      start.second(0);
      this.setStartDate(start);

      if (this.singleDatePicker)
        this.endDate = this.startDate.clone();
      else if (this.endDate && this.endDate.format('YYYY-MM-DD') === start.format('YYYY-MM-DD') && this.endDate.isBefore(start))
        this.setEndDate(start.clone());
    } else if (this.endDate) {
      let end = this.endDate.clone();
      end.hour(hour);
      end.minute(minute);
      end.second(0);
      this.setEndDate(end);
    }

    // update the calendars so all clickable dates reflect the new time component
    this.updateCalendars();

    // update the form inputs above the calendars with the new time
    this.updateFormInputs();

    // re-render the time pickers because changing one selection can affect what's enabled in another
    this.renderTimePicker('left');
    this.renderTimePicker('right');
  }

  formInputsChanged(e) {
    let isRight = $(e.currentTarget).closest('.calendar').hasClass('right');
    let start = moment(this.$container.find('input[name="daterangepicker_start_date"]').val(), this.locale.format);
    let end = moment(this.$container.find('input[name="daterangepicker_end_date"]').val(), this.locale.format);

    if (start.isValid() && end.isValid()) {
      if (isRight && end.isBefore(start))
        start = end.clone();

      this.setStartDate(start);
      this.setEndDate(end);

      if (isRight) {
        this.$container.find('input[name="daterangepicker_start_date"]').val(this.startDate.format(this.locale.dateFormat));
      } else {
        this.$container.find('input[name="daterangepicker_end_date"]').val(this.endDate.format(this.locale.dateFormat));
      }
    }

    this.updateView();
  }

  formInputsFocused(e) {
    // highlight the focused input
    this.$container.find('input[name="daterangepicker_start_date"], input[name="daterangepicker_end_date"]').removeClass('is-selected');
    $(e.currentTarget).addClass('is-selected');

    // set the state such that if the user goes back to using a mouse,
    // the calendars are aware we're selecting the end of the range, not
    // the start. This allows someone to edit the end of a date range without
    // re-selecting the beginning, by clicking on the end date input then
    // using the calendar.
    let isRight = $(e.currentTarget).closest('.calendar').hasClass('right');
    if (isRight) {
      this.endDate = null;
      this.setStartDate(this.startDate.clone());
      this.updateView();
    }
  }

  formInputsBlurred() {
    // this function has one purpose right now: if you tab from the first
    // text input to the second in the UI, the endDate is nulled so that
    // you can click another, but if you tab out without clicking anything
    // or changing the input value, the old endDate should be retained

    if (!this.endDate) {
      let val = this.$container.find('input[name="daterangepicker_end_date"]').val();
      let end = moment(val, this.locale.format);
      if (end.isValid()) {
        this.setEndDate(end);
        this.updateView();
      }
    }
  }

  formInputsKeydown(e) {
    // this function ensures that if the 'enter' key was pressed in the input, then the calendars
    // are updated with the startDate and endDate.
    // this behaviour is automatic in Chrome/Firefox/Edge but not in IE 11 hence why this exists.
    // other browsers and versions of IE are untested and the behaviour is unknown.
    if (e.keyCode === 13) {
      // Prevent the calendar from being updated twice on Chrome/Firefox/Edge
      e.preventDefault();
      this.formInputsChanged(e);
    }
  }

  elementChanged() {
    if (!this.$picker.is('input')) return;
    if (!this.$picker.val().length) return;

    let dateString = this.$picker.val().split(this.locale.separator);
    let start = null;
    let end = null;

    if (dateString.length === 2) {
      start = moment(dateString[0], this.locale.format);
      end = moment(dateString[1], this.locale.format);
    }

    if (this.singleDatePicker || start === null || end === null) {
      start = moment(this.$picker.val(), this.locale.format);
      end = start;
    }

    if (!start.isValid() || !end.isValid()) return;

    this.setStartDate(start);
    this.setEndDate(end);
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
      // force zero seconds and milliseconds
      let startDate = this.startDate.clone().second(0).milliseconds(0);
      let endDate = this.endDate
        ? this.endDate.clone().second(0).milliseconds(0)
        : null;

      let newValue = startDate.format(this.locale.format);

      if (!this.singleDatePicker && endDate && !endDate.isSame(startDate))
        newValue += this.locale.separator + endDate.format(this.locale.format);

      if (newValue !== this.$picker.val())
        this.$picker.val(newValue).trigger('change');
    }
  }

  remove() {
    this.$container.remove();
    this.$picker.off('.daterangepicker');
    this.$picker.removeData();
  }
}
