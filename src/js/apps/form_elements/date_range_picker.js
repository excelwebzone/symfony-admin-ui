import $ from 'jquery';
import moment from 'moment';

export default class DateRangePicker {
  constructor(pickerEl, options, cb) {
    // default settings for options
    this.parentEl = 'body';
    this.$picker = $(pickerEl);
    this.startDate = moment().startOf('day');
    this.endDate = moment().endOf('day');
    this.minDate = false;
    this.maxDate = false;
    this.dateLimit = false;
    this.autoApply = false;
    this.singleDatePicker = false;
    this.showDropdowns = false;
    this.showCustomRangeLabel = true;
    this.linkedCalendars = true;
    this.autoUpdateInput = true;
    this.alwaysShowCalendars = false;
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
      separator: ' - ',
      applyLabel: 'Apply',
      cancelLabel: 'Cancel',
      customRangeLabel: 'Custom Range',
      daysOfWeek: moment.weekdaysMin(),
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

    // allow setting options with data attributes
    // data-api options will be overwritten with custom javascript options
    options = $.extend(this.$picker.data(), options);

    // html template for the picker UI
    if (typeof options.template !== 'string' && !(options.template instanceof $))
      options.template = `
        <div class="range-select-container">
          <div class="range-select range-select-date-range">
            <div class="range-select-content">
              <div class="filter-calendar from-date-selector">
                <div class="calendar left"></div>
                <div class="range-select-range-field">
                  <div class="filter">
                    <span>From:</span>
                    <input type="text" name="daterangepicker_start" class="input-text" placeholder="mm/dd/yyyy" autocomplete="off" />
                  </div>
                </div>
              </div>
              <div class="filter-calendar to-date-selector">
                <div class="calendar right"></div>
                <div class="range-select-range-field">
                  <div class="filter">
                    <span>To:</span>
                    <input type="text" name="daterangepicker_end" class="input-text" placeholder="mm/dd/yyyy" autocomplete="off" />
                  </div>
                </div>
              </div>
              <div class="filter-calendar-button-panel">
                <div class="ranges"></div>
              </div>
            </div>

            <div class="range-select-footer">
              <div class="range-select-display-range">
                <b>Date Picked</b>&nbsp;<span>is any date.</span>
              </div>
              <div class="range-select-button-section">
                <button type="button" class="apply-button calendar-action-button button-flat-primary button button-flat"></button>
                <button type="button" class="cancel-button calendar-action-button button-flat-default button button-flat"></button>
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

      if (typeof options.locale.cancelLabel === 'string')
        this.locale.cancelLabel = options.locale.cancelLabel;

      if (typeof options.locale.customRangeLabel === 'string') {
        // Support unicode chars in the custom range name.
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

    if (typeof options.dateLimit === 'object')
      this.dateLimit = options.dateLimit;

    if (typeof options.opens === 'string')
      this.opens = options.opens;

    if (typeof options.drops === 'string')
      this.drops = options.drops;

    if (typeof options.showDropdowns === 'boolean')
      this.showDropdowns = options.showDropdowns;

    if (typeof options.showCustomRangeLabel === 'boolean')
      this.showCustomRangeLabel = options.showCustomRangeLabel;

    if (typeof options.singleDatePicker === 'boolean') {
      this.singleDatePicker = options.singleDatePicker;
      if (this.singleDatePicker)
        this.endDate = this.startDate.clone();
    }

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
      if ($(this.$picker).is('input[type=text]')) {
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

        // If the start or end date exceed those allowed by the minDate or dateLimit
        // options, shorten the range to the allowable period.
        if (this.minDate && start.isBefore(this.minDate))
          start = this.minDate.clone();

        let maxDate = this.maxDate;
        if (this.dateLimit && maxDate && start.clone().add(this.dateLimit).isAfter(maxDate))
          maxDate = start.clone().add(this.dateLimit);
        if (maxDate && end.isAfter(maxDate))
          end = maxDate.clone();

        // If the end of the range is before the minimum or the start of the range is
        // after the maximum, don't display this range option at all.
        if ((this.minDate && end.isBefore(this.minDate, 'day'))
          || (maxDate && start.isAfter(maxDate, 'day')))
          continue;

        // Support unicode chars in the range names.
        let elem = document.createElement('textarea');
        elem.innerHTML = range;
        let rangeHtml = elem.value;

        this.ranges[rangeHtml] = [start, end, options.ranges[range][2] || 'is from ' + start.format('MM/DD/YYYY') + ' to ' + end.format('MM/DD/YYYY') + '.'];
      }

      let list = '<ul>';
      for (range in this.ranges) {
        list += '<li><button type="button" class="button-raised-default button button-raised w-100" data-range-key="' + range + '">' + range + '</button></li>';
      }
      if (this.showCustomRangeLabel) {
        list += '<li><button type="button" class="button-raised-default button button-raised w-100" data-range-key="' + this.locale.customRangeLabel + '">' + this.locale.customRangeLabel + '</button></li>';
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
      this.$container.find('.apply-button, .cancel-button').addClass('hide');
    }

    if (this.singleDatePicker) {
      this.$container.addClass('single');
      this.$container.find('.calendar.left').addClass('single');
      this.$container.find('.calendar.left').show();
      this.$container.find('.calendar.right').hide();
      this.$container.find('.range-select-range-field input').hide();
      this.$container.find('.ranges').hide();
    }

    if ((typeof options.ranges === 'undefined' && !this.singleDatePicker) || this.alwaysShowCalendars) {
      this.$container.addClass('show-calendar');
    }

    this.$container.addClass('opens-' + this.opens);

    // swap the position of the predefined ranges if opens right
    if (typeof options.ranges !== 'undefined' && this.opens === 'right') {
      this.$container.find('.ranges').prependTo(this.$container.find('.calendar.left').parent());
    }

    // apply labels to buttons
    this.$container.find('.apply-button').html(this.locale.applyLabel);
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

    this.$container.find('.range-select-button-section')
      .on('click.daterangepicker', 'button.apply-button', () => this.clickApply())
      .on('click.daterangepicker', 'button.cancel-button', () => this.clickCancel());

    if (this.$picker.is('input') || this.$picker.is('button')) {
      this.$picker.on({
        'click.daterangepicker': () => this.show(),
        'focus.daterangepicker': () => this.show(),
        'keyup.daterangepicker': () => this.valueChanged(),
        'keydown.daterangepicker': (e) => this.keydown(e) // IE 11 compatibility
      });
    } else {
      this.$picker.on('click.daterangepicker', () => this.toggle());
      this.$picker.on('keydown.daterangepicker', () => this.toggle());
    }

    //
    // if attached to a text input, set the initial value
    //

    /* if (this.$picker.is('input') && !this.singleDatePicker && this.autoUpdateInput) {
      this.$picker.val(this.startDate.format(this.locale.format) + this.locale.separator + this.endDate.format(this.locale.format));
      this.$picker.trigger('change');
    } else if (this.$picker.is('input') && this.autoUpdateInput) {
      this.$picker.val(this.startDate.format(this.locale.format));
      this.$picker.trigger('change');
    } */
  }

  setParentEl(parentEl) {
    this.parentEl = parentEl;
  }

  setStartDate(startDate) {
    if (typeof startDate === 'string')
      this.startDate = moment(startDate, this.locale.format);

    if (typeof startDate === 'object')
      this.startDate = moment(startDate);

    if (this.minDate && this.startDate.isBefore(this.minDate)) {
      this.startDate = this.minDate.clone();
    }

    if (this.maxDate && this.startDate.isAfter(this.maxDate)) {
      this.startDate = this.maxDate.clone();
    }

    /* if (!this.isShowing)
      this.updateElement(); */

    this.updateMonthsInView();
  }

  setEndDate(endDate) {
    if (typeof endDate === 'string')
      this.endDate = moment(endDate, this.locale.format);

    if (typeof endDate === 'object')
      this.endDate = moment(endDate);

    if (this.endDate.isBefore(this.startDate))
      this.endDate = this.startDate.clone();

    if (this.maxDate && this.endDate.isAfter(this.maxDate))
      this.endDate = this.maxDate.clone();

    if (this.dateLimit && this.startDate.clone().add(this.dateLimit).isBefore(this.endDate))
      this.endDate = this.startDate.clone().add(this.dateLimit);

    /* if (!this.isShowing)
      this.updateElement(); */

    this.updateMonthsInView();
  }

  isInvalidDate() {
    return false;
  }

  isCustomDate() {
    return false;
  }

  updateView() {
    if (this.endDate) {
      this.$container.find('input[name="daterangepicker_end"]').removeClass('is-active');
      this.$container.find('input[name="daterangepicker_start"]').addClass('is-active');
    } else {
      this.$container.find('input[name="daterangepicker_end"]').addClass('is-active');
      this.$container.find('input[name="daterangepicker_start"]').removeClass('is-active');
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
    this.renderCalendar('left');
    this.renderCalendar('right');

    // highlight any predefined range matching the current start and end dates
    this.$container.find('.ranges button').removeClass('button-raised-default').addClass('button-raised-default');
    if (this.endDate === null) return;

    this.calculateChosenLabel();
  }

  renderCalendar(side) {
    //
    // Build the matrix of dates that will populate the calendar
    //

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

    let minDate = side === 'left' ? this.minDate : this.startDate;
    let maxDate = this.maxDate;

    let html = '<div class="ui-datepicker">';
    html += '<div class="ui-datepicker-header">';

    if ((!minDate || minDate.isBefore(calendar.firstDay)) && (!this.linkedCalendars || side === 'left')) {
      html += '<a class="ui-datepicker-prev" title="Prev">';
      html += '<span class="ui-icon ui-icon-circle-triangle-w">Prev</span>';
      html += '</a>';
    }

    let monthHtml = this.locale.monthNames[calendar[1][1].month()];
    let yearHtml = calendar[1][1].format('YYYY');

    if (this.showDropdowns) {
      let currentMonth = calendar[1][1].month();
      let currentYear = calendar[1][1].year();
      let maxYear = (maxDate && maxDate.year()) || (currentYear + 5);
      let minYear = (minDate && minDate.year()) || (currentYear - 50);
      let inMinYear = currentYear === minYear;
      let inMaxYear = currentYear === maxYear;

      monthHtml = '<select class="month-select">';
      for (let m = 0; m < 12; m++) {
        if ((!inMinYear || m >= minDate.month()) && (!inMaxYear || m <= maxDate.month())) {
          monthHtml += '<option value="' + m + '"'
            + (m === currentMonth ? ' selected="selected"' : '')
            + '>' + this.locale.monthNames[m] + '</option>';
        } else {
          monthHtml += '<option value="' + m + '"'
            + (m === currentMonth ? ' selected="selected"' : '')
            + ' disabled="disabled">' + this.locale.monthNames[m] + '</option>';
        }
      }
      monthHtml += '</select>';

      yearHtml = '<select class="year-select">';
      for (let y = minYear; y <= maxYear; y++) {
        yearHtml += '<option value="' + y + '"'
          + (y === currentYear ? ' selected="selected"' : '')
          + '>' + y + '</option>';
      }
      yearHtml += '</select>';
    }

    html += '<div class="ui-datepicker-title">';
    html += '<span class="ui-datepicker-month">' + monthHtml + '</span>&nbsp;<span class="ui-datepicker-year">' + yearHtml + '</span>';
    html += '</div>';

    if ((!maxDate || maxDate.isAfter(calendar.lastDay)) && (!this.linkedCalendars || side === 'right' || this.singleDatePicker)) {
      html += '<a class="ui-datepicker-next" title="Next">';
      html += '<span class="ui-icon ui-icon-circle-triangle-e">Next</span>';
      html += '</a>';
    }

    html += '</div>'; // end `ui-datepicker-header`
    html += '<table class="ui-datepicker-calendar">';
    html += '<thead>';
    html += '<tr>';

    let self = this;
    $.each(this.locale.daysOfWeek, function(index, dayOfWeek) {
      html += '<th><span title="' + self.locale.monthNames[index] + '">' + dayOfWeek + '</span></th>';
    });

    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    // adjust maxDate to reflect the dateLimit setting in order to
    // grey out end dates beyond the dateLimit
    if (this.endDate === null && this.dateLimit) {
      let maxLimit = this.startDate.clone().add(this.dateLimit).endOf('day');
      if (!maxDate || maxLimit.isBefore(maxDate)) {
        maxDate = maxLimit;
      }
    }

    for (let row = 0; row < 6; row++) {
      html += '<tr>';

      for (let col = 0; col < 7; col++) {
        let classes = [];
        let isDisabled = false;

        // mark first day of the month
        if (calendar[row][col].date() === calendar[row][col].clone().startOf('month').date())
          classes.push('is-first');

        // mark last day of the month
        if (calendar[row][col].date() === calendar[row][col].clone().endOf('month').date())
          classes.push('is-last');

        // highlight today's date
        if (calendar[row][col].isSame(new Date(), 'day'))
          classes.push('ui-datepicker-today');

        // grey out the dates in other months displayed at beginning and end of this calendar
        if (calendar[row][col].month() !== calendar[1][1].month()) {
          classes.push('ui-datepicker-other-month', 'ui-state-disabled');
          isDisabled = true;
        }

        // don't allow selection of dates before the minimum date
        if (this.minDate && calendar[row][col].isBefore(this.minDate, 'day')) {
          classes.push('ui-state-disabled');
          isDisabled = true;
        }

        // don't allow selection of dates after the maximum date
        if (maxDate && calendar[row][col].isAfter(maxDate, 'day')) {
          classes.push('ui-state-disabled');
          isDisabled = true;
        }

        // don't allow selection of date if a custom function decides it's invalid
        if (this.isInvalidDate(calendar[row][col])) {
          classes.push('ui-state-disabled');
          isDisabled = true;
        }

        // highlight the currently selected start date
        if (!isDisabled && calendar[row][col].format('YYYY-MM-DD') === this.startDate.format('YYYY-MM-DD')) {
          classes.push('is-from', 'is-selected');

          if (this.endDate)
            classes.push('is-in-range');
        }

        // highlight the currently selected end date
        if (!isDisabled && this.endDate !== null && calendar[row][col].format('YYYY-MM-DD') === this.endDate.format('YYYY-MM-DD')) {
          classes.push('is-to', 'is-selected');

          if (this.startDate)
            classes.push('is-in-range');
        }

        // highlight dates in-between the selected dates
        if (!isDisabled && this.endDate !== null && calendar[row][col] > this.startDate && calendar[row][col] < this.endDate)
          classes.push('is-in-range');

        // apply custom classes for this date
        let isCustom = this.isCustomDate(calendar[row][col]);
        if (isCustom !== false) {
          if (typeof isCustom === 'string')
            classes.push(isCustom);
          else
            Array.prototype.push.apply(classes, isCustom);
        }

        let cname = '';
        let disabled = false;

        for (let i = 0; i < classes.length; i++) {
          cname += classes[i] + ' ';
          if (classes[i] === 'ui-state-disabled')
            disabled = true;
        }
        if (!disabled)
          cname += 'ui-datepicker-current-day';

        html += '<td class="' + cname.replace(/^\s+|\s+$/g, '') + '" data-title="' + 'r' + row + 'c' + col + '"><span>' + calendar[row][col].date() + '</span></td>';
      }
      html += '</tr>';
    }

    html += '</tbody>';
    html += '</table>';
    html += '</div>';

    this.$container.find('.calendar.' + side).html(html);
  }

  updateFormInputs() {
    // ignore mouse movements while an above-calendar text input has focus
    if (this.$container.find('input[name=daterangepicker_start]').is(':focus') || this.$container.find('input[name=daterangepicker_end]').is(':focus'))
      return;

    this.$container.find('input[name=daterangepicker_start]').val(this.startDate.format(this.locale.format));
    if (this.endDate)
      this.$container.find('input[name=daterangepicker_end]').val(this.endDate.format(this.locale.format));

    if (this.singleDatePicker || (this.endDate && (this.startDate.isBefore(this.endDate) || this.startDate.isSame(this.endDate)))) {
      this.$container.find('button.apply-button').removeAttr('disabled');
    } else {
      this.$container.find('button.apply-button').attr('disabled', 'disabled');
    }

    let label = this.$container.find('.ranges button.button-raised-primary').data('range-key');
    if (label === this.locale.customRangeLabel) {
      this.$container.find('.range-select-display-range>span').html('is from ' + this.startDate.format('MM/DD/YYYY') + ' to ' + this.endDate.format('MM/DD/YYYY') + '.');
    } else if (this.ranges[label]) {
      this.$container.find('.range-select-display-range>span').html(this.ranges[label][2]);
    }
  }

  move() {
    if (this.ignoreMove) return;

    let parentOffset = {
      top: 0,
      left: 0
    };
    let containerTop;
    let parentRightEdge = $(window).width();

    if (!this.parentEl.is('body')) {
      parentOffset = {
        top: this.parentEl.offset().top - this.parentEl.scrollTop(),
        left: this.parentEl.offset().left - this.parentEl.scrollLeft()
      };
      parentRightEdge = this.parentEl[0].clientWidth + this.parentEl.offset().left;
    }

    if (this.drops === 'up')
      containerTop = this.$picker.offset().top - this.$container.outerHeight() - parentOffset.top;
    else
      containerTop = this.$picker.offset().top + this.$picker.outerHeight() - parentOffset.top;
    this.$container[this.drops === 'up' ? 'addClass' : 'removeClass']('drop-up');

    if (this.opens === 'left') {
      this.$container.css({
        top: containerTop,
        right: parentRightEdge - this.$picker.offset().left - this.$picker.outerWidth(),
        left: 'auto'
      });
      if (this.$container.offset().left < 0) {
        this.$container.css({
          right: 'auto',
          left: 9
        });
      }
    } else if (this.opens === 'center') {
      this.$container.css({
        top: containerTop,
        left: this.$picker.offset().left - parentOffset.left + this.$picker.outerWidth() / 2
          - this.$container.outerWidth() / 2,
        right: 'auto'
      });
      if (this.$container.offset().left < 0) {
        this.$container.css({
          right: 'auto',
          left: 9
        });
      }
    } else {
      this.$container.css({
        top: containerTop,
        left: this.$picker.offset().left - parentOffset.left,
        right: 'auto'
      });
      if (this.$container.offset().left + this.$container.outerWidth() > $(window).width()) {
        this.$container.css({
          left: 'auto',
          right: 0
        });
      }
    }
  }

  show() {
    if (this.isShowing) return;

    // Create a click proxy that is private to this instance of datepicker, for unbinding
    this._outsideClickProxy = (e) => this.outsideClick(e);

    // Bind global datepicker mousedown for hiding and
    $(document)
      .on('mousedown.daterangepicker', this._outsideClickProxy)
      // also support mobile devices
      .on('touchend.daterangepicker', this._outsideClickProxy)
      // also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
      .on('click.daterangepicker', '[data-toggle=dropdown]', this._outsideClickProxy)
      // and also close when focus changes to outside the picker (eg. tabbing between controls)
      .on('focusin.daterangepicker', this._outsideClickProxy);

    // Reposition the picker if the window is resized while it's open
    $(window).on('resize.daterangepicker', this.move());

    this.oldStartDate = this.startDate.clone();
    this.oldEndDate = this.endDate.clone();

    this.updateView();
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

    if (!this.singleDatePicker)
      this.reset();

    $(document).off('.daterangepicker');
    $(window).off('.daterangepicker');
    this.$container.hide();
    this.$picker.trigger('hide.daterangepicker', this);
    this.isShowing = false;
    this.isApply = false;
  }

  reset() {
    this.setStartDate(moment().startOf('day'));
    this.setEndDate(moment().endOf('day'));
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
    if (this.$container.find('input[name=daterangepicker_start]').is(':focus') || this.$container.find('input[name=daterangepicker_end]').is(':focus'))
      return;

    let label = e.target.getAttribute('data-range-key');

    if (label === this.locale.customRangeLabel) {
      this.updateView();
    } else {
      let dates = this.ranges[label];
      this.$container.find('input[name=daterangepicker_start]').val(dates[0].format(this.locale.format));
      this.$container.find('input[name=daterangepicker_end]').val(dates[1].format(this.locale.format));
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

      this.startDate.startOf('day');
      this.endDate.endOf('day');

      if (!this.alwaysShowCalendars)
        this.hideCalendars();

      if (this.autoApply)
        this.clickApply();

      this.updateView();
    }
  }

  clickPrev(e) {
    let cal = $(e.currentTarget).parents('.calendar');
    if (cal.hasClass('left')) {
      this.leftCalendar.month.subtract(1, 'month');
      if (this.linkedCalendars)
        this.rightCalendar.month.subtract(1, 'month');
    } else {
      this.rightCalendar.month.subtract(1, 'month');
    }
    this.updateCalendars();
  }

  clickNext(e) {
    let cal = $(e.currentTarget).parents('.calendar');
    if (cal.hasClass('left')) {
      this.leftCalendar.month.add(1, 'month');
    } else {
      this.rightCalendar.month.add(1, 'month');
      if (this.linkedCalendars)
        this.leftCalendar.month.add(1, 'month');
    }
    this.updateCalendars();
  }

  hoverDate(e) {
    // ignore mouse movements while an above-calendar text input has focus
    // if (this.$container.find('input[name=daterangepicker_start]').is(':focus') || this.$container.find('input[name=daterangepicker_end]').is(':focus'))
    //    return;

    // ignore dates that can't be selected
    if (!$(e.currentTarget).hasClass('ui-datepicker-current-day')) return;

    // have the text inputs above calendars reflect the date being hovered over
    let title = $(e.currentTarget).attr('data-title');
    let row = title.substr(1, 1);
    let col = title.substr(3, 1);
    let cal = $(e.currentTarget).parents('.calendar');
    let date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

    if (this.endDate && !this.$container.find('input[name=daterangepicker_start]').is(':focus')) {
      this.$container.find('input[name=daterangepicker_start]').val(date.format(this.locale.format));
    } else if (!this.endDate && !this.$container.find('input[name=daterangepicker_end]').is(':focus')) {
      this.$container.find('input[name=daterangepicker_end]').val(date.format(this.locale.format));
    }

    // highlight the dates between the start date and the date being hovered as a potential end date
    /* let leftCalendar = this.leftCalendar;
    let rightCalendar = this.rightCalendar;
    let startDate = this.startDate;
    if (!this.endDate) {
      this.$container.find('.calendar tbody td').each(function(index, el) {
        let title = $(el).attr('data-title');
        let row = title.substr(1, 1);
        let col = title.substr(3, 1);
        let cal = $(el).parents('.calendar');
        let dt = cal.hasClass('left') ? leftCalendar.calendar[row][col] : rightCalendar.calendar[row][col];

        if ((dt.isAfter(startDate) && dt.isBefore(date)) || dt.isSame(date, 'day')) {
          $(el).addClass('is-in-range');
        } else {
          $(el).removeClass('is-in-range');
        }
      });
    } */
  }

  clickDate(e) {
    if (!$(e.currentTarget).hasClass('ui-datepicker-current-day')) return;

    let title = $(e.currentTarget).attr('data-title');
    let row = title.substr(1, 1);
    let col = title.substr(3, 1);
    let cal = $(e.currentTarget).parents('.calendar');
    let date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

    //
    // this function needs to do a few things:
    // * alternate between selecting a start and end date for the range,
    // * if autoapply is enabled, and an end date was chosen, apply the selection
    // * if single date picker mode, apply the selection immediately
    // * if one of the inputs above the calendars was focused, cancel that manual input
    //

    if (this.singleDatePicker || date.isBefore(this.startDate, 'day')) { // picking start
      this.setStartDate(date.clone());
    } else { // picking end
      this.setEndDate(date.clone());
      if (this.autoApply) {
        this.calculateChosenLabel();
        this.clickApply();
      }
    }

    if (this.singleDatePicker) {
      this.setEndDate(this.startDate);
      this.clickApply();
    }

    this.updateView();

    // This is to cancel the blur event handler if the mouse was in one of the inputs
    e.stopPropagation();
  }

  calculateChosenLabel() {
    // Remove selected button
    this.$container.find('.ranges button').removeClass('button-raised-primary');

    let customRange = true;
    let i = 0;
    for (let range in this.ranges) {
      if (this.startDate.format('YYYY-MM-DD') === this.ranges[range][0].format('YYYY-MM-DD') && this.endDate.format('YYYY-MM-DD') === this.ranges[range][1].format('YYYY-MM-DD')) {
        customRange = false;
        this.chosenLabel = this.$container.find('.ranges button:eq(' + i + ')').removeClass('button-raised-default').addClass('button-raised-primary').html();
        break;
      }

      i++;
    }
    if (customRange) {
      if (this.showCustomRangeLabel) {
        this.chosenLabel = this.$container.find('.ranges button:last').removeClass('button-raised-default').addClass('button-raised-primary').html();
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

  clickCancel() {
    this.startDate = this.oldStartDate;
    this.endDate = this.oldEndDate;
    this.hide();
    this.$picker.trigger('cancel.daterangepicker', this);
  }

  monthOrYearChanged(e) {
    let isLeft = $(e.currentTarget).closest('.calendar').hasClass('left');
    let leftOrRight = isLeft ? 'left' : 'right';
    let cal = this.$container.find('.calendar.' + leftOrRight);

    // Month must be Number for new moment versions
    let month = parseInt(cal.find('.month-select').val(), 10);
    let year = cal.find('.year-select').val();

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

  formInputsChanged(e) {
    let isRight = $(e.currentTarget).closest('.calendar').hasClass('right');
    let start = moment(this.$container.find('input[name="daterangepicker_start"]').val(), this.locale.format);
    let end = moment(this.$container.find('input[name="daterangepicker_end"]').val(), this.locale.format);

    if (start.isValid() && end.isValid()) {
      if (isRight && end.isBefore(start))
        start = end.clone();

      this.setStartDate(start);
      this.setEndDate(end);

      if (isRight) {
        this.$container.find('input[name="daterangepicker_start"]').val(this.startDate.format(this.locale.format));
      } else {
        this.$container.find('input[name="daterangepicker_end"]').val(this.endDate.format(this.locale.format));
      }
    }

    this.updateView();
  }

  formInputsFocused(e) {
    // Highlight the focused input
    this.$container.find('input[name="daterangepicker_start"], input[name="daterangepicker_end"]').removeClass('is-selected');
    $(e.currentTarget).addClass('is-selected');

    // Set the state such that if the user goes back to using a mouse,
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
      let val = this.$container.find('input[name="daterangepicker_end"]').val();
      let end = moment(val, this.locale.format);
      if (end.isValid()) {
        this.setEndDate(end);
        this.updateView();
      }
    }
  }

  formInputsKeydown(e) {
    // This function ensures that if the 'enter' key was pressed in the input, then the calendars
    // are updated with the startDate and endDate.
    // This behaviour is automatic in Chrome/Firefox/Edge but not in IE 11 hence why this exists.
    // Other browsers and versions of IE are untested and the behaviour is unknown.
    if (e.keyCode === 13) {
      // Prevent the calendar from being updated twice on Chrome/Firefox/Edge
      e.preventDefault();
      this.formInputsChanged(e);
    }
  }

  valueChanged() {
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
    if (this.$picker.is('input') && !this.singleDatePicker && this.autoUpdateInput) {
      this.$picker.val(this.startDate.format(this.locale.format) + this.locale.separator + this.endDate.format(this.locale.format));
      this.$picker.trigger('change');
    } else if (this.$picker.is('input') && this.autoUpdateInput) {
      this.$picker.val(this.startDate.format(this.locale.format));
      this.$picker.trigger('change');
    }
  }

  remove() {
    this.$container.remove();
    this.$picker.off('.daterangepicker');
    this.$picker.removeData();
  }
}
