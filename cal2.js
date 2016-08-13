/* global TweenMax */
/* global getStorage */
/* global getMessage */
/* global di */
/* global chrome */
/* global $ */
var Cal2 = function () {
  var _yearShown = null;
  var _specialDays = {};
  var _scrollToMonth = -1;
  var _page = $('#pageCal2');
  var _calendarDiv = _page.find('.calendar');
  var _initialScrollDone = false;

  function preparePage() {
    attachHandlers();
  }

  function attachHandlers() {
    _calendarDiv.on('click', '.dayCell', function (ev) {
      var cell = $(ev.target).closest('.dayCell');
      var gDate = cell.data('gdate');

      var target = new Date(gDate);
      setFocusTime(target);
      refreshDateInfo();
      showInfo(_di);
    });
    _page.on('change', '#cbShowTimes', function () {
      _calendarDiv.toggleClass('showTimes', !!_page.find('#cbShowTimes').prop('checked'));
      // _calendarDiv.find('#cbShowTimes').blur();
    });
    _page.on('change', '#cbCal2Darker', function () {
      _page.toggleClass('darkerColors', !!_page.find('#cbCal2Darker').prop('checked'));
      // _calendarDiv.find('#cbCal2Darker').blur();
    });
    //    _page.find('#btnShowYear').click(function () {
    //      zoomTo('Y');
    //    });
    //    _page.find('#btnShowMonth').click(function () {
    //      zoomTo('M');
    //    });
    $(document).on('click', 'body[data-pageid=pageCal2] .btnChangeMonth', changeMonth);
  }

  function changeMonth(ev) {
    var delta = +$(ev.target).closest('button').data('delta') || 0;
    var currentYear = _di.bYear;
    if (currentYear < 1) return;
    if (currentYear > 1000) return;

    var currentMonth = _di.bMonth;
    currentMonth += delta;

    // ignore ayyam-i-ha

    if (currentMonth < 1) {
      currentMonth = 19;
      currentYear--;
    } else if (currentMonth > 19) {
      currentMonth = 1;
      currentYear++;
    }

    try {
      var gDate = holyDays.getGDate(currentYear, currentMonth, _di.bDay, true);

      setFocusTime(gDate);
      refreshDateInfo();

      showInfo(_di);
    } catch (error) {
      log(error);
    }


  }

  //  function zoomTo(level) {
  //    // default is month
  //    // also have: zoomY, zoomV, zoomK
  //    _calendarDiv.removeClass('zoomM zoomY zoomV zoomK').addClass('zoom' + level);
  //    var wholeYear = _calendarDiv;
  //
  //    switch (level) {
  //      case 'Y':
  //        var otherMonths = _calendarDiv.find('.month:not(:visible)');
  //        otherMonths.css('opacity', 0);
  //        otherMonths.show();
  //        TweenMax.to(wholeYear, .2,
  //        {
  //          scaleX: 0.165,
  //          scaleY: 0.165,
  //          width: 440,
  //          height: 360
  //        });
  //        TweenMax.to(otherMonths, .2, { opacity: 1 });
  //        break;
  //      case 'M':
  //        highlightTargetDay(_di);
  //        TweenMax.to(wholeYear, 2,
  //        {
  //          scale: 1,
  //          width: 773,
  //          height: 427
  //        });
  //        break;
  //    }
  //  }

  function showCalendar(newDi) {
    _di = newDi;

    var newYear = newDi.bYear;
    if (newYear !== _yearShown) {
      buildCalendar();
    }
    highlightTargetDay(newDi);
  }

  function highlightTargetDay(di) {
    _calendarDiv.find('.selected').removeClass('selected');

    var sel = ('#cal2_igd{bMonth}_{bDay}').filledWith(di);

    _calendarDiv.find(sel).addClass('selected');

    setTimeout(function () {
      scrollToMonth(di.bMonth);
    }, 0);
  }

  function buildCalendar() {
    var bYear = _di.bYear;
    _yearShown = bYear;
    _scrollToMonth = -1;

    var bMonth = _di.bMonth;

    _calendarDiv.html('');

    var newRow = '<div class="monthRow elementNum{0}">';
    var newRowEnd = '</div>';
    var html = [newRow.filledWith(1)];

    for (var m = 1; m <= 19; m++) {
      if (m === 19) {
        // add ayyam-i-ha with Loftiness
        Array.prototype.push.apply(html, buildMonth(bYear, 0));
      }

      var elementNum = getElementNum(m);
      switch (m) {
        case 4:
        case 8:
        case 14:
          html.push(newRowEnd);
          html.push(newRow.filledWith(elementNum));
          break;
      }


      Array.prototype.push.apply(html, buildMonth(bYear, m));
    }

    _calendarDiv.html(html.join('') + newRowEnd);

    scrollToMonth(bMonth);
  }

  function scrollToMonth(bMonth) {
    _scrollToMonth = bMonth;
    var month = _calendarDiv.find('#cal2_m{0}'.filledWith(bMonth));
    if (month.length === 0) {
      log("no month " + bMonth);
      return;
    }
    _calendarDiv.find('.month').hide();
    month.show();
    return;

    //    // do the animate, then directly set it...
    //    // animate doesn't work if not visible, and sometimes even when visible
    //    var monthTop = month.position().top - 50; // move a bit higher
    //    var top;
    //    if (_inTab) {
    //      top = monthTop + _calendarDiv.position().top;
    //      $("html, body").stop().animate({
    //        scrollTop: top + "px"
    //      }, {
    //        always: function () {
    //          $("html, body").stop().scrollTop(top);
    //        }
    //      });
    //    } else {
    //      top = _calendarDiv.scrollTop() + monthTop;
    //      _calendarDiv.stop().animate({
    //        scrollTop: top + "px"
    //      }, {
    //        always: function () {
    //          _calendarDiv.stop().scrollTop(top);
    //        }
    //      });
    //    }
  }

  function buildMonth(bYear, bMonth) {
    var focusMonth = bMonth;
    var newRow = '<div class="dayRow elementNum{0}">';
    var newRowEnd = '</div>';

    var dayCellTemplate = [
        '<div class="dayCell bDay{bDay} {classesOuter} wd{frag2Weekday}" id=cal2_i{cellId} data-gdate="{frag2Year}/{frag2Month00}/{frag2Day00}">',
            '<div class=top><span class=dayNum>{bDay}{^holyDayAftStar}</span> <span class=sunsetStart>{frag1WeekdayShort}<span> {startingSunsetDesc}</span></span></div>',
                '<div class=night>',
                    '<div class=gStart><span class=wd>{frag2WeekdayShort}</span>, {frag2MonthShort} {frag2Day}',
                    '<div class=bWeekDay>{bWeekdayNamePri}</div>',
                '</div>',
                '{^sunriseDiv}',
            '</div>',
            '<div class=day>{^holyDayAftName}</div>',
            '<div class=dayName>{bDayNamePri}</div>',
            '{^sunsetDesc}',
            '{^todayTime}',
        '</div>'
    ].join('');

    var dayCells = [newRow.filledWith(bMonth === 0 ? 0 : 1)];
    var day1Di;
    var gMonths = [];
    var lastGMonth = '';
    var gYear = 0;

    for (var bDay = 1; bDay <= 19; bDay++) {
      var bDateCode = bMonth + '.' + bDay;
      var gDate;
      try {
        gDate = holyDays.getGDate(bYear, bMonth, bDay, false);
        gDate.setHours(12, 0, 0, 0); // set to noon to avoid DST issues
      }
      catch (e) {
        if (bMonth === 0 && e === 'invalid Badi date') {
          break;
        }
        else {
          throw e;
        }
      }
      var dayGroup;
      var di = getDateInfo(gDate);
      if (bDay === 1) {
        day1Di = di;
        dayGroup = bMonth === 0 ? 0 : 1;
      }

      var gMonth = di.frag2MonthLong;
      if (lastGMonth !== gMonth) {
        gMonths.push(gMonth);
        lastGMonth = gMonth;
        gYear = di.frag2Year; // remember last year used
      }

      if (bMonth === 0) {
      } else {
        switch (bDay) {
          case 4:
          case 8:
          case 14:
            dayCells.push(newRowEnd);
            dayGroup++;
            dayCells.push(newRow.filledWith(dayGroup));
            break;
        }
      }

      var startSunset = di.frag1SunTimes.sunset;
      var startSunsetHr = (startSunset.getHours() + startSunset.getMinutes() / 60);

      var sunrise = di.frag2SunTimes.sunrise;
      var sunriseHr = (sunrise.getHours() + sunrise.getMinutes() / 60);

      //var hourFactor = 88 / 24;
      //var total = hourFactor * 24;
      //var minHeightTopRow = 14; // for font in use

      //var eveSize = Math.max(0, +((24 - startSunsetHr) * hourFactor).toFixed(3));
      //var eveExtra = minHeightTopRow - eveSize;
      //eveSize = Math.max(eveSize, minHeightTopRow);
      //var mornSize = +(sunriseHr * hourFactor - (eveExtra > 0 ? eveExtra : 0)).toFixed(3);
      //var aftSize = total - eveSize - mornSize; //  +((sunsetHr - sunriseHr) * hourFactor).toFixed(3);

      $.extend(di, {
        classesOuter: [
          'gd'
        ],
        cellId: 'gd' + bMonth + '_' + bDay,
        //mornSize: mornSize,
        //aftSize: aftSize,
        //eveSize: eveSize,
      });

      $.extend(di, {
        sunsetDesc: '<span class=sunsetEnd>{0}</span>'.filledWith(showTime(di.frag2SunTimes.sunset))
      });

      if (di.bMonth === 19) {
        $.extend(di, {
          sunriseDiv: '<div class=sunrise>{0}</div>'.filledWith(showTime(sunrise))
        });
      }

      if (bDay === bMonth) {
        di.classesOuter.push('monthNameDay');
      }

      if (di.stampDay === _initialDiStamp.stampDay) {
        var start = moment(di.frag1SunTimes.sunset);
        var end = moment(di.frag2SunTimes.sunset);
        var now = moment();
        log(start.format());
        log(end.format());
        log(now.format());
        log(end.diff(start));
        log(now.diff(start));
        var pct = now.diff(start) / end.diff(start) * 100;
        // redraw every minute? No - will be redrawn if day changes, and on every display. Not critical to be absolutely correct.
        di.todayTime = '<div class=todayTime title="{1} {2}" style="top:{0}%"></div>'.filledWith(~~pct, getMessage("Now"), now.format('HH:mm'));
        di.classesOuter.push('today');
      } else {
        di.todayTime = '';
      }

      // add holy days
      if (!_specialDays[bYear]) {
        _specialDays[bYear] = holyDays.prepareDateInfos(bYear);
      }

      var holyDayInfo = $.grep(_specialDays[bYear], function (el, i) {
        return el.Type.substring(0, 1) === 'H' && el.BDateCode === bDateCode;
      });

      if (holyDayInfo.length) {
        di.holyDayAftStar = '<span class="hd{0}"></span>'.filledWith(holyDayInfo[0].Type);
        di.holyDayAftName = '<div class="hdName">{0}</div>'.filledWith(getMessage(holyDayInfo[0].NameEn));
        di.classesOuter.push('hdDay' + holyDayInfo[0].Type);
      }

      di.classesOuter = di.classesOuter.join(' ');

      dayCells.push(dayCellTemplate.filledWith(di));
    }

    dayCells.push(newRowEnd);

    var elementNum = getElementNum(bMonth);
    var monthTitleInfo = {
      bMonthName: day1Di.bMonthNamePri,
      bYear: bYear
    };

    var monthElement = (bMonth === 0 ? '' : '<div class=monthElement>{element}</div>'.filledWith(day1Di));
    var bMonthInfo = (bMonth === 0 ? '{bMonthNameSec}' : '{bMonth} &#8230; {bMonthNameSec}').filledWith(day1Di) +
      monthElement;
    var gMonthInfo = gMonths.join(', ') + ' ' + gYear;

    var html = [
      '<div class="month elementNum{1}" id=cal2_m{0}>'.filledWith(focusMonth, elementNum),
      '<div class=caption>',
        '<div class=monthNames>{bMonthName}<span class=year> {bYear}</span></div>'.filledWith(monthTitleInfo),
        '<div class=bMonthInfo>{0}</div>'.filledWith(bMonthInfo),
        '<div class=gMonthInfo>{0}</div>'.filledWith(gMonthInfo),
        '<div class=placeName>{0}</div>'.filledWith(localStorage.locationName),
      '</div>',
      '<div class=monthDays>',
      '{^0}'.filledWith(dayCells.join('')),
      '</div>',
      '</div>'
    ];

    return html;
  }

  preparePage();

  return {
    showCalendar: showCalendar,
    resetPageForLanguageChange: function () {
      _yearShown = -1;
    },
    di: _di,
    scrollToMonth: scrollToMonth
  };
}
