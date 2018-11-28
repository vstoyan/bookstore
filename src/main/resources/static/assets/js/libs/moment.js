//! moment.js
//! version : 2.9.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {
    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = '2.9.0',
        // the global-scope this is NOT the global object in Node.js
        globalScope = (typeof global !== 'undefined' && (typeof window === 'undefined' || window === global.window)) ? global : this,
        oldGlobalMoment,
        round = Math.round,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for locale config files
        locales = {},

        // extra moment internal properties (plugins register props here)
        momentProperties = [],

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenOffsetMs = /[\+\-]?\d+/, // 1234567890123
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-', '15', '30']
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // default relative time thresholds
        relativeTimeThresholds = {
            s: 45,  // seconds to minute
            m: 45,  // minutes to hour
            h: 22,  // hours to day
            d: 26,  // days to month
            M: 11   // months to year
        },

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.localeData().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.localeData().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.localeData().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.localeData().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.localeData().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            x    : function () {
                return this.valueOf();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        deprecations = {},

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'],

        updateInProgress = false;

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error('Implement me');
        }
    }

    function hasOwnProp(a, b) {
        return hasOwnProperty.call(a, b);
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function printMsg(msg) {
        if (moment.suppressDeprecationWarnings === false &&
                typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        return extend(function () {
            if (firstTime) {
                printMsg(msg);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            printMsg(msg);
            deprecations[name] = true;
        }
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.localeData().ordinal(func.call(this, a), period);
        };
    }

    function monthDiff(a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // thie is not supposed to happen
            return hour;
        }
    }

    /************************************
        Constructors
    ************************************/

    function Locale() {
    }

    // Moment prototype object
    function Moment(config, skipOverflow) {
        if (skipOverflow !== false) {
            checkOverflow(config);
        }
        copyConfig(this, config);
        this._d = new Date(+config._d);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            moment.updateOffset(this);
            updateInProgress = false;
        }
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = moment.localeData();

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = from._pf;
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = makeAs(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = moment.duration(val, period);
            addOrSubtractDurationFromMoment(this, dur, direction);
            return this;
        };
    }

    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment._locale[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment._locale, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 24 ||
                    (m._a[HOUR] === 24 && (m._a[MINUTE] !== 0 ||
                                           m._a[SECOND] !== 0 ||
                                           m._a[MILLISECOND] !== 0)) ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0 &&
                    m._pf.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        if (!locales[name] && hasModule) {
            try {
                oldLocale = moment.locale();
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
                moment.locale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // Return a moment from input, that is local/utc/utcOffset equivalent to
    // model.
    function makeAs(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (moment.isMoment(input) || isDate(input) ?
                    +input : +moment(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            moment.updateOffset(res, false);
            return res;
        } else {
            return moment(input).local();
        }
    }

    /************************************
        Locale
    ************************************/


    extend(Locale.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
            // Lenient ordinal parsing accepts just a number in addition to
            // number + (possibly) stuff coming from _ordinalParseLenient.
            this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + /\d{1,2}/.source);
        },

        _months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName, format, strict) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = moment.utc([2000, i]);
                if (strict && !this._longMonthsParse[i]) {
                    this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                    this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
                }
                if (!strict && !this._monthsParse[i]) {
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                    return i;
                } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                    return i;
                } else if (!strict && this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LTS : 'h:mm:ss A',
            LT : 'h:mm A',
            L : 'MM/DD/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM D, YYYY LT'
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },


        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom, now) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom, [now]) : output;
        },

        _relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },

        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },

        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace('%d', number);
        },
        _ordinal : '%d',
        _ordinalParse : /\d{1,2}/,

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        firstDayOfWeek : function () {
            return this._week.dow;
        },

        firstDayOfYear : function () {
            return this._week.doy;
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) {
                return parseTokenOneDigit;
            }
            /* falls through */
        case 'SS':
            if (strict) {
                return parseTokenTwoDigits;
            }
            /* falls through */
        case 'SSS':
            if (strict) {
                return parseTokenThreeDigits;
            }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return config._locale._meridiemParse;
        case 'x':
            return parseTokenOffsetMs;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return strict ? config._locale._ordinalParse : config._locale._ordinalParseLenient;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
            return a;
        }
    }

    function utcOffsetFromString(string) {
        string = string || '';
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = config._locale.monthsParse(input, token, config._strict);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(
                            input.match(/\d{1,2}/)[0], 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._meridiem = input;
            // config._isPm = config._locale.isPM(input);
            break;
        // HOUR
        case 'h' : // fall through to hh
        case 'hh' :
            config._pf.bigHour = true;
            /* falls through */
        case 'H' : // fall through to HH
        case 'HH' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX OFFSET (MILLISECONDS)
        case 'x':
            config._d = new Date(toInt(input));
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = utcOffsetFromString(input);
            break;
        // WEEKDAY - human
        case 'dd':
        case 'ddd':
        case 'dddd':
            a = config._locale.weekdaysParse(input);
            // if we didn't get a weekday name, mark the date as invalid
            if (a != null) {
                config._w = config._w || {};
                config._w['d'] = a;
            } else {
                config._pf.invalidWeekday = input;
            }
            break;
        // WEEK, WEEK DAY - numeric
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gggg':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = toInt(input);
            }
            break;
        case 'gg':
        case 'GG':
            config._w = config._w || {};
            config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day || normalizedInput.date,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._pf.bigHour === true && config._a[HOUR] <= 12) {
            config._pf.bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR],
                config._meridiem);
        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be 'T' or undefined
                    config._f = isoDates[i][0] + (match[6] || ' ');
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += 'Z';
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function makeDateFromInput(config) {
        var input = config._i, matched;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            dateFromConfig(config);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, locale) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = locale.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(posNegDuration, withoutSuffix, locale) {
        var duration = moment.duration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            years = round(duration.as('y')),

            args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days < relativeTimeThresholds.d && ['dd', days] ||
                months === 1 && ['M'] ||
                months < relativeTimeThresholds.M && ['MM', months] ||
                years === 1 && ['y'] || ['yy', years];

        args[2] = withoutSuffix;
        args[3] = +posNegDuration > 0;
        args[4] = locale;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f,
            res;

        config._locale = config._locale || moment.localeData(config._l);

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (moment.isMoment(input)) {
            return new Moment(input, true);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        res = new Moment(config);
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    moment = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = locale;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso,
            diffRes;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' &&
                ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(moment(duration.from), moment(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function (threshold, limit) {
        if (relativeTimeThresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return relativeTimeThresholds[threshold];
        }
        relativeTimeThresholds[threshold] = limit;
        return true;
    };

    moment.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        function (key, value) {
            return moment.locale(key, value);
        }
    );

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    moment.locale = function (key, values) {
        var data;
        if (key) {
            if (typeof(values) !== 'undefined') {
                data = moment.defineLocale(key, values);
            }
            else {
                data = moment.localeData(key);
            }

            if (data) {
                moment.duration._locale = moment._locale = data;
            }
        }

        return moment._locale._abbr;
    };

    moment.defineLocale = function (name, values) {
        if (values !== null) {
            values.abbr = name;
            if (!locales[name]) {
                locales[name] = new Locale();
            }
            locales[name].set(values);

            // backwards compat for now: also set the locale
            moment.locale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    };

    moment.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        function (key) {
            return moment.localeData(key);
        }
    );

    // returns locale data
    moment.localeData = function (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return moment._locale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    moment.isDate = isDate;

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d - ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                if ('function' === typeof Date.prototype.toISOString) {
                    // native implementation is ~50x faster, use it when we can
                    return this.toDate().toISOString();
                } else {
                    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                }
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {
            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function (keepLocalTime) {
            return this.utcOffset(0, keepLocalTime);
        },

        local : function (keepLocalTime) {
            if (this._isUTC) {
                this.utcOffset(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.subtract(this._dateUtcOffset(), 'm');
                }
            }
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.localeData().postformat(output);
        },

        add : createAdder(1, 'add'),

        subtract : createAdder(-1, 'subtract'),

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (that.utcOffset() - this.utcOffset()) * 6e4,
                anchor, diff, output, daysAdjust;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month' || units === 'quarter') {
                output = monthDiff(this, that);
                if (units === 'quarter') {
                    output = output / 3;
                } else if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = this - that;
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're locat/utc/offset
            // or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.localeData().calendar(format, this, moment(now)));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.utcOffset() > this.clone().month(0).utcOffset() ||
                this.utcOffset() > this.clone().month(5).utcOffset());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf : function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond') {
                return this;
            }
            return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
        },

        isAfter: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this > +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return inputMs < +this.clone().startOf(units);
            }
        },

        isBefore: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this < +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return +this.clone().endOf(units) < inputMs;
            }
        },

        isBetween: function (from, to, units) {
            return this.isAfter(from, units) && this.isBefore(to, units);
        },

        isSame: function (input, units) {
            var inputMs;
            units = normalizeUnits(units || 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this === +input;
            } else {
                inputMs = +moment(input);
                return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
            }
        },

        min: deprecate(
                 'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
                 function (other) {
                     other = moment.apply(null, arguments);
                     return other < this ? this : other;
                 }
         ),

        max: deprecate(
                'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
                function (other) {
                    other = moment.apply(null, arguments);
                    return other > this ? this : other;
                }
        ),

        zone : deprecate(
                'moment().zone is deprecated, use moment().utcOffset instead. ' +
                'https://github.com/moment/moment/issues/1779',
                function (input, keepLocalTime) {
                    if (input != null) {
                        if (typeof input !== 'string') {
                            input = -input;
                        }

                        this.utcOffset(input, keepLocalTime);

                        return this;
                    } else {
                        return -this.utcOffset();
                    }
                }
        ),

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        utcOffset : function (input, keepLocalTime) {
            var offset = this._offset || 0,
                localAdjust;
            if (input != null) {
                if (typeof input === 'string') {
                    input = utcOffsetFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = this._dateUtcOffset();
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.add(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(input - offset, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }

                return this;
            } else {
                return this._isUTC ? offset : this._dateUtcOffset();
            }
        },

        isLocal : function () {
            return !this._isUTC;
        },

        isUtcOffset : function () {
            return this._isUTC;
        },

        isUtc : function () {
            return this._isUTC && this._offset === 0;
        },

        zoneAbbr : function () {
            return this._isUTC ? 'UTC' : '';
        },

        zoneName : function () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        },

        parseZone : function () {
            if (this._tzm) {
                this.utcOffset(this._tzm);
            } else if (typeof this._i === 'string') {
                this.utcOffset(utcOffsetFromString(this._i));
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).utcOffset();
            }

            return (this.utcOffset() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        week : function (input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            var unit;
            if (typeof units === 'object') {
                for (unit in units) {
                    this.set(unit, units[unit]);
                }
            }
            else {
                units = normalizeUnits(units);
                if (typeof this[units] === 'function') {
                    this[units](value);
                }
            }
            return this;
        },

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        locale : function (key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = moment.localeData(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        },

        lang : deprecate(
            'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        ),

        localeData : function () {
            return this._locale;
        },

        _dateUtcOffset : function () {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return -Math.round(this._d.getTimezoneOffset() / 15) * 15;
        }

    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    // alias isUtc for dev-friendliness
    moment.fn.isUTC = moment.fn.isUtc;

    /************************************
        Duration Prototype
    ************************************/


    function daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    function yearsToDays (years) {
        // years * 365 + absRound(years / 4) -
        //     absRound(years / 100) + absRound(years / 400);
        return years * 146097 / 400;
    }

    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years = 0;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);

            // Accurately convert days to years, assume start from year 0.
            years = absRound(daysToYears(days));
            days -= absRound(yearsToDays(years));

            // 30 days to a month
            // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
            months += absRound(days / 30);
            days %= 30;

            // 12 months -> 1 year
            years += absRound(months / 12);
            months %= 12;

            data.days = days;
            data.months = months;
            data.years = years;
        },

        abs : function () {
            this._milliseconds = Math.abs(this._milliseconds);
            this._days = Math.abs(this._days);
            this._months = Math.abs(this._months);

            this._data.milliseconds = Math.abs(this._data.milliseconds);
            this._data.seconds = Math.abs(this._data.seconds);
            this._data.minutes = Math.abs(this._data.minutes);
            this._data.hours = Math.abs(this._data.hours);
            this._data.months = Math.abs(this._data.months);
            this._data.years = Math.abs(this._data.years);

            return this;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var output = relativeTime(this, !withSuffix, this.localeData());

            if (withSuffix) {
                output = this.localeData().pastFuture(+this, output);
            }

            return this.localeData().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            var days, months;
            units = normalizeUnits(units);

            if (units === 'month' || units === 'year') {
                days = this._days + this._milliseconds / 864e5;
                months = this._months + daysToYears(days) * 12;
                return units === 'month' ? months : months / 12;
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + Math.round(yearsToDays(this._months / 12));
                switch (units) {
                    case 'week': return days / 7 + this._milliseconds / 6048e5;
                    case 'day': return days + this._milliseconds / 864e5;
                    case 'hour': return days * 24 + this._milliseconds / 36e5;
                    case 'minute': return days * 24 * 60 + this._milliseconds / 6e4;
                    case 'second': return days * 24 * 60 * 60 + this._milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
                    default: throw new Error('Unknown unit ' + units);
                }
            }
        },

        lang : moment.fn.lang,
        locale : moment.fn.locale,

        toIsoString : deprecate(
            'toIsoString() is deprecated. Please use toISOString() instead ' +
            '(notice the capitals)',
            function () {
                return this.toISOString();
            }
        ),

        toISOString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        },

        localeData : function () {
            return this._locale;
        },

        toJSON : function () {
            return this.toISOString();
        }
    });

    moment.duration.fn.toString = moment.duration.fn.toISOString;

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    for (i in unitMillisecondFactors) {
        if (hasOwnProp(unitMillisecondFactors, i)) {
            makeDurationGetter(i.toLowerCase());
        }
    }

    moment.duration.fn.asMilliseconds = function () {
        return this.as('ms');
    };
    moment.duration.fn.asSeconds = function () {
        return this.as('s');
    };
    moment.duration.fn.asMinutes = function () {
        return this.as('m');
    };
    moment.duration.fn.asHours = function () {
        return this.as('h');
    };
    moment.duration.fn.asDays = function () {
        return this.as('d');
    };
    moment.duration.fn.asWeeks = function () {
        return this.as('weeks');
    };
    moment.duration.fn.asMonths = function () {
        return this.as('M');
    };
    moment.duration.fn.asYears = function () {
        return this.as('y');
    };

    /************************************
        Default Locale
    ************************************/


    // Set default locale, other locale will inherit from English.
    moment.locale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // moment.js locale configuration
// locale : afrikaans (af)
// author : Werner Mollentze : https://github.com/wernerm

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('af', {
        months : 'Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des'.split('_'),
        weekdays : 'Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag'.split('_'),
        weekdaysShort : 'Son_Maa_Din_Woe_Don_Vry_Sat'.split('_'),
        weekdaysMin : 'So_Ma_Di_Wo_Do_Vr_Sa'.split('_'),
        meridiemParse: /vm|nm/i,
        isPM : function (input) {
            return /^nm$/i.test(input);
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower ? 'vm' : 'VM';
            } else {
                return isLower ? 'nm' : 'NM';
            }
        },
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Vandag om] LT',
            nextDay : '[MΓ΄re om] LT',
            nextWeek : 'dddd [om] LT',
            lastDay : '[Gister om] LT',
            lastWeek : '[Laas] dddd [om] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'oor %s',
            past : '%s gelede',
            s : '\'n paar sekondes',
            m : '\'n minuut',
            mm : '%d minute',
            h : '\'n uur',
            hh : '%d ure',
            d : '\'n dag',
            dd : '%d dae',
            M : '\'n maand',
            MM : '%d maande',
            y : '\'n jaar',
            yy : '%d jaar'
        },
        ordinalParse: /\d{1,2}(ste|de)/,
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de'); // Thanks to Joris RΓΆling : https://github.com/jjupiter
        },
        week : {
            dow : 1, // Maandag is die eerste dag van die week.
            doy : 4  // Die week wat die 4de Januarie bevat is die eerste week van die jaar.
        }
    });
}));
// moment.js locale configuration
// locale : Moroccan Arabic (ar-ma)
// author : ElFadili Yassine : https://github.com/ElFadiliY
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ar-ma', {
        months : 'ΩΩΨ§ΩΨ±_ΩΨ¨Ψ±Ψ§ΩΨ±_ΩΨ§Ψ±Ψ³_Ψ£Ψ¨Ψ±ΩΩ_ΩΨ§Ω_ΩΩΩΩΩ_ΩΩΩΩΩΨ²_ΨΊΨ΄Ψͺ_Ψ΄ΨͺΩΨ¨Ψ±_Ψ£ΩΨͺΩΨ¨Ψ±_ΩΩΩΨ¨Ψ±_Ψ―Ψ¬ΩΨ¨Ψ±'.split('_'),
        monthsShort : 'ΩΩΨ§ΩΨ±_ΩΨ¨Ψ±Ψ§ΩΨ±_ΩΨ§Ψ±Ψ³_Ψ£Ψ¨Ψ±ΩΩ_ΩΨ§Ω_ΩΩΩΩΩ_ΩΩΩΩΩΨ²_ΨΊΨ΄Ψͺ_Ψ΄ΨͺΩΨ¨Ψ±_Ψ£ΩΨͺΩΨ¨Ψ±_ΩΩΩΨ¨Ψ±_Ψ―Ψ¬ΩΨ¨Ψ±'.split('_'),
        weekdays : 'Ψ§ΩΨ£Ψ­Ψ―_Ψ§ΩΨ₯ΨͺΩΩΩ_Ψ§ΩΨ«ΩΨ§Ψ«Ψ§Ψ‘_Ψ§ΩΨ£Ψ±Ψ¨ΨΉΨ§Ψ‘_Ψ§ΩΨ�ΩΩΨ³_Ψ§ΩΨ¬ΩΨΉΨ©_Ψ§ΩΨ³Ψ¨Ψͺ'.split('_'),
        weekdaysShort : 'Ψ§Ψ­Ψ―_Ψ§ΨͺΩΩΩ_Ψ«ΩΨ§Ψ«Ψ§Ψ‘_Ψ§Ψ±Ψ¨ΨΉΨ§Ψ‘_Ψ�ΩΩΨ³_Ψ¬ΩΨΉΨ©_Ψ³Ψ¨Ψͺ'.split('_'),
        weekdaysMin : 'Ψ­_Ω_Ψ«_Ψ±_Ψ�_Ψ¬_Ψ³'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Ψ§ΩΩΩΩ ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            nextDay: '[ΨΊΨ―Ψ§ ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            nextWeek: 'dddd [ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            lastDay: '[Ψ£ΩΨ³ ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            lastWeek: 'dddd [ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'ΩΩ %s',
            past : 'ΩΩΨ° %s',
            s : 'Ψ«ΩΨ§Ω',
            m : 'Ψ―ΩΩΩΨ©',
            mm : '%d Ψ―ΩΨ§Ψ¦Ω',
            h : 'Ψ³Ψ§ΨΉΨ©',
            hh : '%d Ψ³Ψ§ΨΉΨ§Ψͺ',
            d : 'ΩΩΩ',
            dd : '%d Ψ£ΩΨ§Ω',
            M : 'Ψ΄ΩΨ±',
            MM : '%d Ψ£Ψ΄ΩΨ±',
            y : 'Ψ³ΩΨ©',
            yy : '%d Ψ³ΩΩΨ§Ψͺ'
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Arabic Saudi Arabia (ar-sa)
// author : Suhail Alkowaileet : https://github.com/xsoh

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ω‘',
        '2': 'Ω’',
        '3': 'Ω£',
        '4': 'Ω€',
        '5': 'Ω₯',
        '6': 'Ω¦',
        '7': 'Ω§',
        '8': 'Ω¨',
        '9': 'Ω©',
        '0': 'Ω '
    }, numberMap = {
        'Ω‘': '1',
        'Ω’': '2',
        'Ω£': '3',
        'Ω€': '4',
        'Ω₯': '5',
        'Ω¦': '6',
        'Ω§': '7',
        'Ω¨': '8',
        'Ω©': '9',
        'Ω ': '0'
    };

    return moment.defineLocale('ar-sa', {
        months : 'ΩΩΨ§ΩΨ±_ΩΨ¨Ψ±Ψ§ΩΨ±_ΩΨ§Ψ±Ψ³_Ψ£Ψ¨Ψ±ΩΩ_ΩΨ§ΩΩ_ΩΩΩΩΩ_ΩΩΩΩΩ_Ψ£ΨΊΨ³Ψ·Ψ³_Ψ³Ψ¨ΨͺΩΨ¨Ψ±_Ψ£ΩΨͺΩΨ¨Ψ±_ΩΩΩΩΨ¨Ψ±_Ψ―ΩΨ³ΩΨ¨Ψ±'.split('_'),
        monthsShort : 'ΩΩΨ§ΩΨ±_ΩΨ¨Ψ±Ψ§ΩΨ±_ΩΨ§Ψ±Ψ³_Ψ£Ψ¨Ψ±ΩΩ_ΩΨ§ΩΩ_ΩΩΩΩΩ_ΩΩΩΩΩ_Ψ£ΨΊΨ³Ψ·Ψ³_Ψ³Ψ¨ΨͺΩΨ¨Ψ±_Ψ£ΩΨͺΩΨ¨Ψ±_ΩΩΩΩΨ¨Ψ±_Ψ―ΩΨ³ΩΨ¨Ψ±'.split('_'),
        weekdays : 'Ψ§ΩΨ£Ψ­Ψ―_Ψ§ΩΨ₯Ψ«ΩΩΩ_Ψ§ΩΨ«ΩΨ§Ψ«Ψ§Ψ‘_Ψ§ΩΨ£Ψ±Ψ¨ΨΉΨ§Ψ‘_Ψ§ΩΨ�ΩΩΨ³_Ψ§ΩΨ¬ΩΨΉΨ©_Ψ§ΩΨ³Ψ¨Ψͺ'.split('_'),
        weekdaysShort : 'Ψ£Ψ­Ψ―_Ψ₯Ψ«ΩΩΩ_Ψ«ΩΨ§Ψ«Ψ§Ψ‘_Ψ£Ψ±Ψ¨ΨΉΨ§Ψ‘_Ψ�ΩΩΨ³_Ψ¬ΩΨΉΨ©_Ψ³Ψ¨Ψͺ'.split('_'),
        weekdaysMin : 'Ψ­_Ω_Ψ«_Ψ±_Ψ�_Ψ¬_Ψ³'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        meridiemParse: /Ψ΅|Ω/,
        isPM : function (input) {
            return 'Ω' === input;
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'Ψ΅';
            } else {
                return 'Ω';
            }
        },
        calendar : {
            sameDay: '[Ψ§ΩΩΩΩ ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            nextDay: '[ΨΊΨ―Ψ§ ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            nextWeek: 'dddd [ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            lastDay: '[Ψ£ΩΨ³ ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            lastWeek: 'dddd [ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'ΩΩ %s',
            past : 'ΩΩΨ° %s',
            s : 'Ψ«ΩΨ§Ω',
            m : 'Ψ―ΩΩΩΨ©',
            mm : '%d Ψ―ΩΨ§Ψ¦Ω',
            h : 'Ψ³Ψ§ΨΉΨ©',
            hh : '%d Ψ³Ψ§ΨΉΨ§Ψͺ',
            d : 'ΩΩΩ',
            dd : '%d Ψ£ΩΨ§Ω',
            M : 'Ψ΄ΩΨ±',
            MM : '%d Ψ£Ψ΄ΩΨ±',
            y : 'Ψ³ΩΨ©',
            yy : '%d Ψ³ΩΩΨ§Ψͺ'
        },
        preparse: function (string) {
            return string.replace(/[Ω‘Ω’Ω£Ω€Ω₯Ω¦Ω§Ω¨Ω©Ω ]/g, function (match) {
                return numberMap[match];
            }).replace(/Ψ/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'Ψ');
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale  : Tunisian Arabic (ar-tn)

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ar-tn', {
        months: 'Ψ¬Ψ§ΩΩΩ_ΩΩΩΨ±Ω_ΩΨ§Ψ±Ψ³_Ψ£ΩΨ±ΩΩ_ΩΨ§Ω_Ψ¬ΩΨ§Ω_Ψ¬ΩΩΩΩΨ©_Ψ£ΩΨͺ_Ψ³Ψ¨ΨͺΩΨ¨Ψ±_Ψ£ΩΨͺΩΨ¨Ψ±_ΩΩΩΩΨ¨Ψ±_Ψ―ΩΨ³ΩΨ¨Ψ±'.split('_'),
        monthsShort: 'Ψ¬Ψ§ΩΩΩ_ΩΩΩΨ±Ω_ΩΨ§Ψ±Ψ³_Ψ£ΩΨ±ΩΩ_ΩΨ§Ω_Ψ¬ΩΨ§Ω_Ψ¬ΩΩΩΩΨ©_Ψ£ΩΨͺ_Ψ³Ψ¨ΨͺΩΨ¨Ψ±_Ψ£ΩΨͺΩΨ¨Ψ±_ΩΩΩΩΨ¨Ψ±_Ψ―ΩΨ³ΩΨ¨Ψ±'.split('_'),
        weekdays: 'Ψ§ΩΨ£Ψ­Ψ―_Ψ§ΩΨ₯Ψ«ΩΩΩ_Ψ§ΩΨ«ΩΨ§Ψ«Ψ§Ψ‘_Ψ§ΩΨ£Ψ±Ψ¨ΨΉΨ§Ψ‘_Ψ§ΩΨ�ΩΩΨ³_Ψ§ΩΨ¬ΩΨΉΨ©_Ψ§ΩΨ³Ψ¨Ψͺ'.split('_'),
        weekdaysShort: 'Ψ£Ψ­Ψ―_Ψ₯Ψ«ΩΩΩ_Ψ«ΩΨ§Ψ«Ψ§Ψ‘_Ψ£Ψ±Ψ¨ΨΉΨ§Ψ‘_Ψ�ΩΩΨ³_Ψ¬ΩΨΉΨ©_Ψ³Ψ¨Ψͺ'.split('_'),
        weekdaysMin: 'Ψ­_Ω_Ψ«_Ψ±_Ψ�_Ψ¬_Ψ³'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'LT:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Ψ§ΩΩΩΩ ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            nextDay: '[ΨΊΨ―Ψ§ ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            nextWeek: 'dddd [ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            lastDay: '[Ψ£ΩΨ³ ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            lastWeek: 'dddd [ΨΉΩΩ Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: 'ΩΩ %s',
            past: 'ΩΩΨ° %s',
            s: 'Ψ«ΩΨ§Ω',
            m: 'Ψ―ΩΩΩΨ©',
            mm: '%d Ψ―ΩΨ§Ψ¦Ω',
            h: 'Ψ³Ψ§ΨΉΨ©',
            hh: '%d Ψ³Ψ§ΨΉΨ§Ψͺ',
            d: 'ΩΩΩ',
            dd: '%d Ψ£ΩΨ§Ω',
            M: 'Ψ΄ΩΨ±',
            MM: '%d Ψ£Ψ΄ΩΨ±',
            y: 'Ψ³ΩΨ©',
            yy: '%d Ψ³ΩΩΨ§Ψͺ'
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4 // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// Locale: Arabic (ar)
// Author: Abdel Said: https://github.com/abdelsaid
// Changes in months, weekdays: Ahmed Elkhatib
// Native plural forms: forabi https://github.com/forabi

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ω‘',
        '2': 'Ω’',
        '3': 'Ω£',
        '4': 'Ω€',
        '5': 'Ω₯',
        '6': 'Ω¦',
        '7': 'Ω§',
        '8': 'Ω¨',
        '9': 'Ω©',
        '0': 'Ω '
    }, numberMap = {
        'Ω‘': '1',
        'Ω’': '2',
        'Ω£': '3',
        'Ω€': '4',
        'Ω₯': '5',
        'Ω¦': '6',
        'Ω§': '7',
        'Ω¨': '8',
        'Ω©': '9',
        'Ω ': '0'
    }, pluralForm = function (n) {
        return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
    }, plurals = {
        s : ['Ψ£ΩΩ ΩΩ Ψ«Ψ§ΩΩΨ©', 'Ψ«Ψ§ΩΩΨ© ΩΨ§Ψ­Ψ―Ψ©', ['Ψ«Ψ§ΩΩΨͺΨ§Ω', 'Ψ«Ψ§ΩΩΨͺΩΩ'], '%d Ψ«ΩΨ§Ω', '%d Ψ«Ψ§ΩΩΨ©', '%d Ψ«Ψ§ΩΩΨ©'],
        m : ['Ψ£ΩΩ ΩΩ Ψ―ΩΩΩΨ©', 'Ψ―ΩΩΩΨ© ΩΨ§Ψ­Ψ―Ψ©', ['Ψ―ΩΩΩΨͺΨ§Ω', 'Ψ―ΩΩΩΨͺΩΩ'], '%d Ψ―ΩΨ§Ψ¦Ω', '%d Ψ―ΩΩΩΨ©', '%d Ψ―ΩΩΩΨ©'],
        h : ['Ψ£ΩΩ ΩΩ Ψ³Ψ§ΨΉΨ©', 'Ψ³Ψ§ΨΉΨ© ΩΨ§Ψ­Ψ―Ψ©', ['Ψ³Ψ§ΨΉΨͺΨ§Ω', 'Ψ³Ψ§ΨΉΨͺΩΩ'], '%d Ψ³Ψ§ΨΉΨ§Ψͺ', '%d Ψ³Ψ§ΨΉΨ©', '%d Ψ³Ψ§ΨΉΨ©'],
        d : ['Ψ£ΩΩ ΩΩ ΩΩΩ', 'ΩΩΩ ΩΨ§Ψ­Ψ―', ['ΩΩΩΨ§Ω', 'ΩΩΩΩΩ'], '%d Ψ£ΩΨ§Ω', '%d ΩΩΩΩΨ§', '%d ΩΩΩ'],
        M : ['Ψ£ΩΩ ΩΩ Ψ΄ΩΨ±', 'Ψ΄ΩΨ± ΩΨ§Ψ­Ψ―', ['Ψ΄ΩΨ±Ψ§Ω', 'Ψ΄ΩΨ±ΩΩ'], '%d Ψ£Ψ΄ΩΨ±', '%d Ψ΄ΩΨ±Ψ§', '%d Ψ΄ΩΨ±'],
        y : ['Ψ£ΩΩ ΩΩ ΨΉΨ§Ω', 'ΨΉΨ§Ω ΩΨ§Ψ­Ψ―', ['ΨΉΨ§ΩΨ§Ω', 'ΨΉΨ§ΩΩΩ'], '%d Ψ£ΨΉΩΨ§Ω', '%d ΨΉΨ§ΩΩΨ§', '%d ΨΉΨ§Ω']
    }, pluralize = function (u) {
        return function (number, withoutSuffix, string, isFuture) {
            var f = pluralForm(number),
                str = plurals[u][pluralForm(number)];
            if (f === 2) {
                str = str[withoutSuffix ? 0 : 1];
            }
            return str.replace(/%d/i, number);
        };
    }, months = [
        'ΩΨ§ΩΩΩ Ψ§ΩΨ«Ψ§ΩΩ ΩΩΨ§ΩΨ±',
        'Ψ΄Ψ¨Ψ§Ψ· ΩΨ¨Ψ±Ψ§ΩΨ±',
        'Ψ’Ψ°Ψ§Ψ± ΩΨ§Ψ±Ψ³',
        'ΩΩΨ³Ψ§Ω Ψ£Ψ¨Ψ±ΩΩ',
        'Ψ£ΩΨ§Ψ± ΩΨ§ΩΩ',
        'Ψ­Ψ²ΩΨ±Ψ§Ω ΩΩΩΩΩ',
        'ΨͺΩΩΨ² ΩΩΩΩΩ',
        'Ψ’Ψ¨ Ψ£ΨΊΨ³Ψ·Ψ³',
        'Ψ£ΩΩΩΩ Ψ³Ψ¨ΨͺΩΨ¨Ψ±',
        'ΨͺΨ΄Ψ±ΩΩ Ψ§ΩΨ£ΩΩ Ψ£ΩΨͺΩΨ¨Ψ±',
        'ΨͺΨ΄Ψ±ΩΩ Ψ§ΩΨ«Ψ§ΩΩ ΩΩΩΩΨ¨Ψ±',
        'ΩΨ§ΩΩΩ Ψ§ΩΨ£ΩΩ Ψ―ΩΨ³ΩΨ¨Ψ±'
    ];

    return moment.defineLocale('ar', {
        months : months,
        monthsShort : months,
        weekdays : 'Ψ§ΩΨ£Ψ­Ψ―_Ψ§ΩΨ₯Ψ«ΩΩΩ_Ψ§ΩΨ«ΩΨ§Ψ«Ψ§Ψ‘_Ψ§ΩΨ£Ψ±Ψ¨ΨΉΨ§Ψ‘_Ψ§ΩΨ�ΩΩΨ³_Ψ§ΩΨ¬ΩΨΉΨ©_Ψ§ΩΨ³Ψ¨Ψͺ'.split('_'),
        weekdaysShort : 'Ψ£Ψ­Ψ―_Ψ₯Ψ«ΩΩΩ_Ψ«ΩΨ§Ψ«Ψ§Ψ‘_Ψ£Ψ±Ψ¨ΨΉΨ§Ψ‘_Ψ�ΩΩΨ³_Ψ¬ΩΨΉΨ©_Ψ³Ψ¨Ψͺ'.split('_'),
        weekdaysMin : 'Ψ­_Ω_Ψ«_Ψ±_Ψ�_Ψ¬_Ψ³'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        meridiemParse: /Ψ΅|Ω/,
        isPM : function (input) {
            return 'Ω' === input;
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'Ψ΅';
            } else {
                return 'Ω';
            }
        },
        calendar : {
            sameDay: '[Ψ§ΩΩΩΩ ΨΉΩΨ― Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            nextDay: '[ΨΊΨ―ΩΨ§ ΨΉΩΨ― Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            nextWeek: 'dddd [ΨΉΩΨ― Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            lastDay: '[Ψ£ΩΨ³ ΨΉΩΨ― Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            lastWeek: 'dddd [ΨΉΩΨ― Ψ§ΩΨ³Ψ§ΨΉΨ©] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'Ψ¨ΨΉΨ― %s',
            past : 'ΩΩΨ° %s',
            s : pluralize('s'),
            m : pluralize('m'),
            mm : pluralize('m'),
            h : pluralize('h'),
            hh : pluralize('h'),
            d : pluralize('d'),
            dd : pluralize('d'),
            M : pluralize('M'),
            MM : pluralize('M'),
            y : pluralize('y'),
            yy : pluralize('y')
        },
        preparse: function (string) {
            return string.replace(/[Ω‘Ω’Ω£Ω€Ω₯Ω¦Ω§Ω¨Ω©Ω ]/g, function (match) {
                return numberMap[match];
            }).replace(/Ψ/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'Ψ');
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : azerbaijani (az)
// author : topchiyev : https://github.com/topchiyev

(function (factory) {
    factory(moment);
}(function (moment) {
    var suffixes = {
        1: '-inci',
        5: '-inci',
        8: '-inci',
        70: '-inci',
        80: '-inci',

        2: '-nci',
        7: '-nci',
        20: '-nci',
        50: '-nci',

        3: '-ΓΌncΓΌ',
        4: '-ΓΌncΓΌ',
        100: '-ΓΌncΓΌ',

        6: '-ncΔ±',

        9: '-uncu',
        10: '-uncu',
        30: '-uncu',

        60: '-Δ±ncΔ±',
        90: '-Δ±ncΔ±'
    };
    return moment.defineLocale('az', {
        months : 'yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr'.split('_'),
        monthsShort : 'yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek'.split('_'),
        weekdays : 'Bazar_Bazar ertΙsi_ΓΙrΕΙnbΙ axΕamΔ±_ΓΙrΕΙnbΙ_CΓΌmΙ axΕamΔ±_CΓΌmΙ_ΕΙnbΙ'.split('_'),
        weekdaysShort : 'Baz_BzE_ΓAx_ΓΙr_CAx_CΓΌm_ΕΙn'.split('_'),
        weekdaysMin : 'Bz_BE_ΓA_ΓΙ_CA_CΓΌ_ΕΙ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[bugΓΌn saat] LT',
            nextDay : '[sabah saat] LT',
            nextWeek : '[gΙlΙn hΙftΙ] dddd [saat] LT',
            lastDay : '[dΓΌnΙn] LT',
            lastWeek : '[keΓ§Ιn hΙftΙ] dddd [saat] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s sonra',
            past : '%s ΙvvΙl',
            s : 'birneΓ§Ι saniyyΙ',
            m : 'bir dΙqiqΙ',
            mm : '%d dΙqiqΙ',
            h : 'bir saat',
            hh : '%d saat',
            d : 'bir gΓΌn',
            dd : '%d gΓΌn',
            M : 'bir ay',
            MM : '%d ay',
            y : 'bir il',
            yy : '%d il'
        },
        meridiemParse: /gecΙ|sΙhΙr|gΓΌndΓΌz|axΕam/,
        isPM : function (input) {
            return /^(gΓΌndΓΌz|axΕam)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'gecΙ';
            } else if (hour < 12) {
                return 'sΙhΙr';
            } else if (hour < 17) {
                return 'gΓΌndΓΌz';
            } else {
                return 'axΕam';
            }
        },
        ordinalParse: /\d{1,2}-(Δ±ncΔ±|inci|nci|ΓΌncΓΌ|ncΔ±|uncu)/,
        ordinal : function (number) {
            if (number === 0) {  // special case for zero
                return number + '-Δ±ncΔ±';
            }
            var a = number % 10,
                b = number % 100 - a,
                c = number >= 100 ? 100 : null;

            return number + (suffixes[a] || suffixes[b] || suffixes[c]);
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : belarusian (be)
// author : Dmitry Demidov : https://github.com/demidov91
// author: Praleska: http://praleska.pro/
// Author : Menelion ElensΓΊle : https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': withoutSuffix ? 'ΡΠ²ΡΠ»ΡΠ½Π°_ΡΠ²ΡΠ»ΡΠ½Ρ_ΡΠ²ΡΠ»ΡΠ½' : 'ΡΠ²ΡΠ»ΡΠ½Ρ_ΡΠ²ΡΠ»ΡΠ½Ρ_ΡΠ²ΡΠ»ΡΠ½',
            'hh': withoutSuffix ? 'Π³Π°Π΄Π·ΡΠ½Π°_Π³Π°Π΄Π·ΡΠ½Ρ_Π³Π°Π΄Π·ΡΠ½' : 'Π³Π°Π΄Π·ΡΠ½Ρ_Π³Π°Π΄Π·ΡΠ½Ρ_Π³Π°Π΄Π·ΡΠ½',
            'dd': 'Π΄Π·Π΅Π½Ρ_Π΄Π½Ρ_Π΄Π·ΡΠ½',
            'MM': 'ΠΌΠ΅ΡΡΡ_ΠΌΠ΅ΡΡΡΡ_ΠΌΠ΅ΡΡΡΠ°Ρ',
            'yy': 'Π³ΠΎΠ΄_Π³Π°Π΄Ρ_Π³Π°Π΄ΠΎΡ'
        };
        if (key === 'm') {
            return withoutSuffix ? 'ΡΠ²ΡΠ»ΡΠ½Π°' : 'ΡΠ²ΡΠ»ΡΠ½Ρ';
        }
        else if (key === 'h') {
            return withoutSuffix ? 'Π³Π°Π΄Π·ΡΠ½Π°' : 'Π³Π°Π΄Π·ΡΠ½Ρ';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'ΡΡΡΠ΄Π·Π΅Π½Ρ_Π»ΡΡΡ_ΡΠ°ΠΊΠ°Π²ΡΠΊ_ΠΊΡΠ°ΡΠ°Π²ΡΠΊ_ΡΡΠ°Π²Π΅Π½Ρ_ΡΡΡΠ²Π΅Π½Ρ_Π»ΡΠΏΠ΅Π½Ρ_ΠΆΠ½ΡΠ²Π΅Π½Ρ_Π²Π΅ΡΠ°ΡΠ΅Π½Ρ_ΠΊΠ°ΡΡΡΡΡΠ½ΡΠΊ_Π»ΡΡΡΠ°ΠΏΠ°Π΄_ΡΠ½Π΅ΠΆΠ°Π½Ρ'.split('_'),
            'accusative': 'ΡΡΡΠ΄Π·Π΅Π½Ρ_Π»ΡΡΠ°Π³Π°_ΡΠ°ΠΊΠ°Π²ΡΠΊΠ°_ΠΊΡΠ°ΡΠ°Π²ΡΠΊΠ°_ΡΡΠ°ΡΠ½Ρ_ΡΡΡΠ²Π΅Π½Ρ_Π»ΡΠΏΠ΅Π½Ρ_ΠΆΠ½ΡΡΠ½Ρ_Π²Π΅ΡΠ°ΡΠ½Ρ_ΠΊΠ°ΡΡΡΡΡΠ½ΡΠΊΠ°_Π»ΡΡΡΠ°ΠΏΠ°Π΄Π°_ΡΠ½Π΅ΠΆΠ½Ρ'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'Π½ΡΠ΄Π·Π΅Π»Ρ_ΠΏΠ°Π½ΡΠ΄Π·Π΅Π»Π°ΠΊ_Π°ΡΡΠΎΡΠ°ΠΊ_ΡΠ΅ΡΠ°Π΄Π°_ΡΠ°ΡΠ²Π΅Ρ_ΠΏΡΡΠ½ΡΡΠ°_ΡΡΠ±ΠΎΡΠ°'.split('_'),
            'accusative': 'Π½ΡΠ΄Π·Π΅Π»Ρ_ΠΏΠ°Π½ΡΠ΄Π·Π΅Π»Π°ΠΊ_Π°ΡΡΠΎΡΠ°ΠΊ_ΡΠ΅ΡΠ°Π΄Ρ_ΡΠ°ΡΠ²Π΅Ρ_ΠΏΡΡΠ½ΡΡΡ_ΡΡΠ±ΠΎΡΡ'.split('_')
        },

        nounCase = (/\[ ?[ΠΠ²] ?(?:ΠΌΡΠ½ΡΠ»ΡΡ|Π½Π°ΡΡΡΠΏΠ½ΡΡ)? ?\] ?dddd/).test(format) ?
            'accusative' :
            'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.defineLocale('be', {
        months : monthsCaseReplace,
        monthsShort : 'ΡΡΡΠ΄_Π»ΡΡ_ΡΠ°ΠΊ_ΠΊΡΠ°Ρ_ΡΡΠ°Π²_ΡΡΡΠ²_Π»ΡΠΏ_ΠΆΠ½ΡΠ²_Π²Π΅Ρ_ΠΊΠ°ΡΡ_Π»ΡΡΡ_ΡΠ½Π΅ΠΆ'.split('_'),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'Π½Π΄_ΠΏΠ½_Π°Ρ_ΡΡ_ΡΡ_ΠΏΡ_ΡΠ±'.split('_'),
        weekdaysMin : 'Π½Π΄_ΠΏΠ½_Π°Ρ_ΡΡ_ΡΡ_ΠΏΡ_ΡΠ±'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY Π³.',
            LLL : 'D MMMM YYYY Π³., LT',
            LLLL : 'dddd, D MMMM YYYY Π³., LT'
        },
        calendar : {
            sameDay: '[Π‘ΡΠ½Π½Ρ Ρ] LT',
            nextDay: '[ΠΠ°ΡΡΡΠ° Ρ] LT',
            lastDay: '[Π£ΡΠΎΡΠ° Ρ] LT',
            nextWeek: function () {
                return '[Π£] dddd [Ρ] LT';
            },
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 5:
                case 6:
                    return '[Π£ ΠΌΡΠ½ΡΠ»ΡΡ] dddd [Ρ] LT';
                case 1:
                case 2:
                case 4:
                    return '[Π£ ΠΌΡΠ½ΡΠ»Ρ] dddd [Ρ] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'ΠΏΡΠ°Π· %s',
            past : '%s ΡΠ°ΠΌΡ',
            s : 'Π½Π΅ΠΊΠ°Π»ΡΠΊΡ ΡΠ΅ΠΊΡΠ½Π΄',
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : relativeTimeWithPlural,
            hh : relativeTimeWithPlural,
            d : 'Π΄Π·Π΅Π½Ρ',
            dd : relativeTimeWithPlural,
            M : 'ΠΌΠ΅ΡΡΡ',
            MM : relativeTimeWithPlural,
            y : 'Π³ΠΎΠ΄',
            yy : relativeTimeWithPlural
        },
        meridiemParse: /Π½ΠΎΡΡ|ΡΠ°Π½ΡΡΡ|Π΄Π½Ρ|Π²Π΅ΡΠ°ΡΠ°/,
        isPM : function (input) {
            return /^(Π΄Π½Ρ|Π²Π΅ΡΠ°ΡΠ°)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'Π½ΠΎΡΡ';
            } else if (hour < 12) {
                return 'ΡΠ°Π½ΡΡΡ';
            } else if (hour < 17) {
                return 'Π΄Π½Ρ';
            } else {
                return 'Π²Π΅ΡΠ°ΡΠ°';
            }
        },

        ordinalParse: /\d{1,2}-(Ρ|Ρ|Π³Π°)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
            case 'w':
            case 'W':
                return (number % 10 === 2 || number % 10 === 3) && (number % 100 !== 12 && number % 100 !== 13) ? number + '-Ρ' : number + '-Ρ';
            case 'D':
                return number + '-Π³Π°';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : bulgarian (bg)
// author : Krasen Borisov : https://github.com/kraz

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('bg', {
        months : 'ΡΠ½ΡΠ°ΡΠΈ_ΡΠ΅Π²ΡΡΠ°ΡΠΈ_ΠΌΠ°ΡΡ_Π°ΠΏΡΠΈΠ»_ΠΌΠ°ΠΉ_ΡΠ½ΠΈ_ΡΠ»ΠΈ_Π°Π²Π³ΡΡΡ_ΡΠ΅ΠΏΡΠ΅ΠΌΠ²ΡΠΈ_ΠΎΠΊΡΠΎΠΌΠ²ΡΠΈ_Π½ΠΎΠ΅ΠΌΠ²ΡΠΈ_Π΄Π΅ΠΊΠ΅ΠΌΠ²ΡΠΈ'.split('_'),
        monthsShort : 'ΡΠ½Ρ_ΡΠ΅Π²_ΠΌΠ°Ρ_Π°ΠΏΡ_ΠΌΠ°ΠΉ_ΡΠ½ΠΈ_ΡΠ»ΠΈ_Π°Π²Π³_ΡΠ΅ΠΏ_ΠΎΠΊΡ_Π½ΠΎΠ΅_Π΄Π΅ΠΊ'.split('_'),
        weekdays : 'Π½Π΅Π΄Π΅Π»Ρ_ΠΏΠΎΠ½Π΅Π΄Π΅Π»Π½ΠΈΠΊ_Π²ΡΠΎΡΠ½ΠΈΠΊ_ΡΡΡΠ΄Π°_ΡΠ΅ΡΠ²ΡΡΡΡΠΊ_ΠΏΠ΅ΡΡΠΊ_ΡΡΠ±ΠΎΡΠ°'.split('_'),
        weekdaysShort : 'Π½Π΅Π΄_ΠΏΠΎΠ½_Π²ΡΠΎ_ΡΡΡ_ΡΠ΅Ρ_ΠΏΠ΅Ρ_ΡΡΠ±'.split('_'),
        weekdaysMin : 'Π½Π΄_ΠΏΠ½_Π²Ρ_ΡΡ_ΡΡ_ΠΏΡ_ΡΠ±'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'D.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[ΠΠ½Π΅Ρ Π²] LT',
            nextDay : '[Π£ΡΡΠ΅ Π²] LT',
            nextWeek : 'dddd [Π²] LT',
            lastDay : '[ΠΡΠ΅ΡΠ° Π²] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[Π ΠΈΠ·ΠΌΠΈΠ½Π°Π»Π°ΡΠ°] dddd [Π²] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[Π ΠΈΠ·ΠΌΠΈΠ½Π°Π»ΠΈΡ] dddd [Π²] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'ΡΠ»Π΅Π΄ %s',
            past : 'ΠΏΡΠ΅Π΄ΠΈ %s',
            s : 'Π½ΡΠΊΠΎΠ»ΠΊΠΎ ΡΠ΅ΠΊΡΠ½Π΄ΠΈ',
            m : 'ΠΌΠΈΠ½ΡΡΠ°',
            mm : '%d ΠΌΠΈΠ½ΡΡΠΈ',
            h : 'ΡΠ°Ρ',
            hh : '%d ΡΠ°ΡΠ°',
            d : 'Π΄Π΅Π½',
            dd : '%d Π΄Π½ΠΈ',
            M : 'ΠΌΠ΅ΡΠ΅Ρ',
            MM : '%d ΠΌΠ΅ΡΠ΅ΡΠ°',
            y : 'Π³ΠΎΠ΄ΠΈΠ½Π°',
            yy : '%d Π³ΠΎΠ΄ΠΈΠ½ΠΈ'
        },
        ordinalParse: /\d{1,2}-(Π΅Π²|Π΅Π½|ΡΠΈ|Π²ΠΈ|ΡΠΈ|ΠΌΠΈ)/,
        ordinal : function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-Π΅Π²';
            } else if (last2Digits === 0) {
                return number + '-Π΅Π½';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-ΡΠΈ';
            } else if (lastDigit === 1) {
                return number + '-Π²ΠΈ';
            } else if (lastDigit === 2) {
                return number + '-ΡΠΈ';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-ΠΌΠΈ';
            } else {
                return number + '-ΡΠΈ';
            }
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Bengali (bn)
// author : Kaushik Gandhi : https://github.com/kaushikgandhi

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'ΰ§§',
        '2': 'ΰ§¨',
        '3': 'ΰ§©',
        '4': 'ΰ§ͺ',
        '5': 'ΰ§«',
        '6': 'ΰ§¬',
        '7': 'ΰ§­',
        '8': 'ΰ§�',
        '9': 'ΰ§―',
        '0': 'ΰ§¦'
    },
    numberMap = {
        'ΰ§§': '1',
        'ΰ§¨': '2',
        'ΰ§©': '3',
        'ΰ§ͺ': '4',
        'ΰ§«': '5',
        'ΰ§¬': '6',
        'ΰ§­': '7',
        'ΰ§�': '8',
        'ΰ§―': '9',
        'ΰ§¦': '0'
    };

    return moment.defineLocale('bn', {
        months : 'ΰ¦ΰ¦Ύΰ¦¨ΰ§ΰ§ΰ¦Ύΰ¦°ΰ§_ΰ¦«ΰ§ΰ¦¬ΰ§ΰ§ΰ¦Ύΰ¦°ΰ§_ΰ¦�ΰ¦Ύΰ¦°ΰ§ΰ¦_ΰ¦ΰ¦ͺΰ§ΰ¦°ΰ¦Ώΰ¦²_ΰ¦�ΰ§_ΰ¦ΰ§ΰ¦¨_ΰ¦ΰ§ΰ¦²ΰ¦Ύΰ¦_ΰ¦ΰ¦ΰ¦Ύΰ¦Έΰ§ΰ¦_ΰ¦Έΰ§ΰ¦ͺΰ§ΰ¦ΰ§ΰ¦�ΰ§ΰ¦¬ΰ¦°_ΰ¦ΰ¦ΰ§ΰ¦ΰ§ΰ¦¬ΰ¦°_ΰ¦¨ΰ¦­ΰ§ΰ¦�ΰ§ΰ¦¬ΰ¦°_ΰ¦‘ΰ¦Ώΰ¦Έΰ§ΰ¦�ΰ§ΰ¦¬ΰ¦°'.split('_'),
        monthsShort : 'ΰ¦ΰ¦Ύΰ¦¨ΰ§_ΰ¦«ΰ§ΰ¦¬_ΰ¦�ΰ¦Ύΰ¦°ΰ§ΰ¦_ΰ¦ΰ¦ͺΰ¦°_ΰ¦�ΰ§_ΰ¦ΰ§ΰ¦¨_ΰ¦ΰ§ΰ¦²_ΰ¦ΰ¦_ΰ¦Έΰ§ΰ¦ͺΰ§ΰ¦_ΰ¦ΰ¦ΰ§ΰ¦ΰ§_ΰ¦¨ΰ¦­_ΰ¦‘ΰ¦Ώΰ¦Έΰ§ΰ¦�ΰ§'.split('_'),
        weekdays : 'ΰ¦°ΰ¦¬ΰ¦Ώΰ¦¬ΰ¦Ύΰ¦°_ΰ¦Έΰ§ΰ¦�ΰ¦¬ΰ¦Ύΰ¦°_ΰ¦�ΰ¦ΰ§ΰ¦ΰ¦²ΰ¦¬ΰ¦Ύΰ¦°_ΰ¦¬ΰ§ΰ¦§ΰ¦¬ΰ¦Ύΰ¦°_ΰ¦¬ΰ§ΰ¦Ήΰ¦Έΰ§ΰ¦ͺΰ¦€ΰ§ΰ¦€ΰ¦Ώΰ¦¬ΰ¦Ύΰ¦°_ΰ¦Άΰ§ΰ¦ΰ§ΰ¦°ΰ§ΰ¦¬ΰ¦Ύΰ¦°_ΰ¦Άΰ¦¨ΰ¦Ώΰ¦¬ΰ¦Ύΰ¦°'.split('_'),
        weekdaysShort : 'ΰ¦°ΰ¦¬ΰ¦Ώ_ΰ¦Έΰ§ΰ¦�_ΰ¦�ΰ¦ΰ§ΰ¦ΰ¦²_ΰ¦¬ΰ§ΰ¦§_ΰ¦¬ΰ§ΰ¦Ήΰ¦Έΰ§ΰ¦ͺΰ¦€ΰ§ΰ¦€ΰ¦Ώ_ΰ¦Άΰ§ΰ¦ΰ§ΰ¦°ΰ§_ΰ¦Άΰ¦¨ΰ¦Ώ'.split('_'),
        weekdaysMin : 'ΰ¦°ΰ¦¬_ΰ¦Έΰ¦�_ΰ¦�ΰ¦ΰ§ΰ¦_ΰ¦¬ΰ§_ΰ¦¬ΰ§ΰ¦°ΰ¦Ώΰ¦Ή_ΰ¦Άΰ§_ΰ¦Άΰ¦¨ΰ¦Ώ'.split('_'),
        longDateFormat : {
            LT : 'A h:mm ΰ¦Έΰ¦�ΰ§',
            LTS : 'A h:mm:ss ΰ¦Έΰ¦�ΰ§',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[ΰ¦ΰ¦] LT',
            nextDay : '[ΰ¦ΰ¦ΰ¦Ύΰ¦�ΰ§ΰ¦ΰ¦Ύΰ¦²] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[ΰ¦ΰ¦€ΰ¦ΰ¦Ύΰ¦²] LT',
            lastWeek : '[ΰ¦ΰ¦€] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s ΰ¦ͺΰ¦°ΰ§',
            past : '%s ΰ¦ΰ¦ΰ§',
            s : 'ΰ¦ΰ¦ΰ¦ ΰ¦Έΰ§ΰ¦ΰ§ΰ¦¨ΰ§ΰ¦‘',
            m : 'ΰ¦ΰ¦ ΰ¦�ΰ¦Ώΰ¦¨ΰ¦Ώΰ¦',
            mm : '%d ΰ¦�ΰ¦Ώΰ¦¨ΰ¦Ώΰ¦',
            h : 'ΰ¦ΰ¦ ΰ¦ΰ¦¨ΰ§ΰ¦ΰ¦Ύ',
            hh : '%d ΰ¦ΰ¦¨ΰ§ΰ¦ΰ¦Ύ',
            d : 'ΰ¦ΰ¦ ΰ¦¦ΰ¦Ώΰ¦¨',
            dd : '%d ΰ¦¦ΰ¦Ώΰ¦¨',
            M : 'ΰ¦ΰ¦ ΰ¦�ΰ¦Ύΰ¦Έ',
            MM : '%d ΰ¦�ΰ¦Ύΰ¦Έ',
            y : 'ΰ¦ΰ¦ ΰ¦¬ΰ¦ΰ¦°',
            yy : '%d ΰ¦¬ΰ¦ΰ¦°'
        },
        preparse: function (string) {
            return string.replace(/[ΰ§§ΰ§¨ΰ§©ΰ§ͺΰ§«ΰ§¬ΰ§­ΰ§�ΰ§―ΰ§¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /ΰ¦°ΰ¦Ύΰ¦€|ΰ¦Άΰ¦ΰ¦Ύΰ¦²|ΰ¦¦ΰ§ΰ¦ͺΰ§ΰ¦°|ΰ¦¬ΰ¦Ώΰ¦ΰ§ΰ¦²|ΰ¦°ΰ¦Ύΰ¦€/,
        isPM: function (input) {
            return /^(ΰ¦¦ΰ§ΰ¦ͺΰ§ΰ¦°|ΰ¦¬ΰ¦Ώΰ¦ΰ§ΰ¦²|ΰ¦°ΰ¦Ύΰ¦€)$/.test(input);
        },
        //Bengali is a vast language its spoken
        //in different forms in various parts of the world.
        //I have just generalized with most common one used
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'ΰ¦°ΰ¦Ύΰ¦€';
            } else if (hour < 10) {
                return 'ΰ¦Άΰ¦ΰ¦Ύΰ¦²';
            } else if (hour < 17) {
                return 'ΰ¦¦ΰ§ΰ¦ͺΰ§ΰ¦°';
            } else if (hour < 20) {
                return 'ΰ¦¬ΰ¦Ώΰ¦ΰ§ΰ¦²';
            } else {
                return 'ΰ¦°ΰ¦Ύΰ¦€';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : tibetan (bo)
// author : Thupten N. Chakrishar : https://github.com/vajradog

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'ΰΌ‘',
        '2': 'ΰΌ’',
        '3': 'ΰΌ£',
        '4': 'ΰΌ€',
        '5': 'ΰΌ₯',
        '6': 'ΰΌ¦',
        '7': 'ΰΌ§',
        '8': 'ΰΌ¨',
        '9': 'ΰΌ©',
        '0': 'ΰΌ '
    },
    numberMap = {
        'ΰΌ‘': '1',
        'ΰΌ’': '2',
        'ΰΌ£': '3',
        'ΰΌ€': '4',
        'ΰΌ₯': '5',
        'ΰΌ¦': '6',
        'ΰΌ§': '7',
        'ΰΌ¨': '8',
        'ΰΌ©': '9',
        'ΰΌ ': '0'
    };

    return moment.defineLocale('bo', {
        months : 'ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰΌΰ½ΰ½Ό_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½²ΰ½¦ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½¦ΰ½΄ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½²ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½£ΰΎΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰΎ²ΰ½΄ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½’ΰΎΰΎ±ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰΌΰ½ΰ½ΰ½²ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰΌΰ½ΰ½ΰ½²ΰ½¦ΰΌΰ½'.split('_'),
        monthsShort : 'ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰΌΰ½ΰ½Ό_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½²ΰ½¦ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½¦ΰ½΄ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½²ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½£ΰΎΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰΎ²ΰ½΄ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½’ΰΎΰΎ±ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰΌΰ½ΰ½ΰ½²ΰ½ΰΌΰ½_ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½΄ΰΌΰ½ΰ½ΰ½²ΰ½¦ΰΌΰ½'.split('_'),
        weekdays : 'ΰ½ΰ½ΰ½ ΰΌΰ½ΰ½²ΰΌΰ½ΰΌ_ΰ½ΰ½ΰ½ ΰΌΰ½ΰΎ³ΰΌΰ½ΰΌ_ΰ½ΰ½ΰ½ ΰΌΰ½ΰ½²ΰ½ΰΌΰ½ΰ½ΰ½’ΰΌ_ΰ½ΰ½ΰ½ ΰΌΰ½£ΰΎ·ΰ½ΰΌΰ½ΰΌ_ΰ½ΰ½ΰ½ ΰΌΰ½ΰ½΄ΰ½’ΰΌΰ½ΰ½΄_ΰ½ΰ½ΰ½ ΰΌΰ½ΰΌΰ½¦ΰ½ΰ½¦ΰΌ_ΰ½ΰ½ΰ½ ΰΌΰ½¦ΰΎ€ΰ½Ίΰ½ΰΌΰ½ΰΌ'.split('_'),
        weekdaysShort : 'ΰ½ΰ½²ΰΌΰ½ΰΌ_ΰ½ΰΎ³ΰΌΰ½ΰΌ_ΰ½ΰ½²ΰ½ΰΌΰ½ΰ½ΰ½’ΰΌ_ΰ½£ΰΎ·ΰ½ΰΌΰ½ΰΌ_ΰ½ΰ½΄ΰ½’ΰΌΰ½ΰ½΄_ΰ½ΰΌΰ½¦ΰ½ΰ½¦ΰΌ_ΰ½¦ΰΎ€ΰ½Ίΰ½ΰΌΰ½ΰΌ'.split('_'),
        weekdaysMin : 'ΰ½ΰ½²ΰΌΰ½ΰΌ_ΰ½ΰΎ³ΰΌΰ½ΰΌ_ΰ½ΰ½²ΰ½ΰΌΰ½ΰ½ΰ½’ΰΌ_ΰ½£ΰΎ·ΰ½ΰΌΰ½ΰΌ_ΰ½ΰ½΄ΰ½’ΰΌΰ½ΰ½΄_ΰ½ΰΌΰ½¦ΰ½ΰ½¦ΰΌ_ΰ½¦ΰΎ€ΰ½Ίΰ½ΰΌΰ½ΰΌ'.split('_'),
        longDateFormat : {
            LT : 'A h:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[ΰ½ΰ½²ΰΌΰ½’ΰ½²ΰ½] LT',
            nextDay : '[ΰ½¦ΰ½ΰΌΰ½ΰ½²ΰ½] LT',
            nextWeek : '[ΰ½ΰ½ΰ½΄ΰ½ΰΌΰ½ΰΎ²ΰ½ΰΌΰ½’ΰΎΰ½Ίΰ½¦ΰΌΰ½], LT',
            lastDay : '[ΰ½ΰΌΰ½¦ΰ½] LT',
            lastWeek : '[ΰ½ΰ½ΰ½΄ΰ½ΰΌΰ½ΰΎ²ΰ½ΰΌΰ½ΰ½ΰ½ ΰΌΰ½] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s ΰ½£ΰΌ',
            past : '%s ΰ½¦ΰΎΰ½ΰΌΰ½£',
            s : 'ΰ½£ΰ½ΰΌΰ½¦ΰ½',
            m : 'ΰ½¦ΰΎΰ½’ΰΌΰ½ΰΌΰ½ΰ½ΰ½²ΰ½',
            mm : '%d ΰ½¦ΰΎΰ½’ΰΌΰ½',
            h : 'ΰ½ΰ½΄ΰΌΰ½ΰ½Όΰ½ΰΌΰ½ΰ½ΰ½²ΰ½',
            hh : '%d ΰ½ΰ½΄ΰΌΰ½ΰ½Όΰ½',
            d : 'ΰ½ΰ½²ΰ½ΰΌΰ½ΰ½ΰ½²ΰ½',
            dd : '%d ΰ½ΰ½²ΰ½ΰΌ',
            M : 'ΰ½ΰΎ³ΰΌΰ½ΰΌΰ½ΰ½ΰ½²ΰ½',
            MM : '%d ΰ½ΰΎ³ΰΌΰ½',
            y : 'ΰ½£ΰ½ΌΰΌΰ½ΰ½ΰ½²ΰ½',
            yy : '%d ΰ½£ΰ½Ό'
        },
        preparse: function (string) {
            return string.replace(/[ΰΌ‘ΰΌ’ΰΌ£ΰΌ€ΰΌ₯ΰΌ¦ΰΌ§ΰΌ¨ΰΌ©ΰΌ ]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /ΰ½ΰ½ΰ½ΰΌΰ½ΰ½Ό|ΰ½ΰ½Όΰ½ΰ½¦ΰΌΰ½ΰ½¦|ΰ½ΰ½²ΰ½ΰΌΰ½ΰ½΄ΰ½|ΰ½ΰ½ΰ½Όΰ½ΰΌΰ½ΰ½|ΰ½ΰ½ΰ½ΰΌΰ½ΰ½Ό/,
        isPM: function (input) {
            return /^(ΰ½ΰ½²ΰ½ΰΌΰ½ΰ½΄ΰ½|ΰ½ΰ½ΰ½Όΰ½ΰΌΰ½ΰ½|ΰ½ΰ½ΰ½ΰΌΰ½ΰ½Ό)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'ΰ½ΰ½ΰ½ΰΌΰ½ΰ½Ό';
            } else if (hour < 10) {
                return 'ΰ½ΰ½Όΰ½ΰ½¦ΰΌΰ½ΰ½¦';
            } else if (hour < 17) {
                return 'ΰ½ΰ½²ΰ½ΰΌΰ½ΰ½΄ΰ½';
            } else if (hour < 20) {
                return 'ΰ½ΰ½ΰ½Όΰ½ΰΌΰ½ΰ½';
            } else {
                return 'ΰ½ΰ½ΰ½ΰΌΰ½ΰ½Ό';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : breton (br)
// author : Jean-Baptiste Le Duigou : https://github.com/jbleduigou

(function (factory) {
    factory(moment);
}(function (moment) {
    function relativeTimeWithMutation(number, withoutSuffix, key) {
        var format = {
            'mm': 'munutenn',
            'MM': 'miz',
            'dd': 'devezh'
        };
        return number + ' ' + mutation(format[key], number);
    }

    function specialMutationForYears(number) {
        switch (lastNumber(number)) {
        case 1:
        case 3:
        case 4:
        case 5:
        case 9:
            return number + ' bloaz';
        default:
            return number + ' vloaz';
        }
    }

    function lastNumber(number) {
        if (number > 9) {
            return lastNumber(number % 10);
        }
        return number;
    }

    function mutation(text, number) {
        if (number === 2) {
            return softMutation(text);
        }
        return text;
    }

    function softMutation(text) {
        var mutationTable = {
            'm': 'v',
            'b': 'v',
            'd': 'z'
        };
        if (mutationTable[text.charAt(0)] === undefined) {
            return text;
        }
        return mutationTable[text.charAt(0)] + text.substring(1);
    }

    return moment.defineLocale('br', {
        months : 'Genver_C\'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu'.split('_'),
        monthsShort : 'Gen_C\'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker'.split('_'),
        weekdays : 'Sul_Lun_Meurzh_Merc\'her_Yaou_Gwener_Sadorn'.split('_'),
        weekdaysShort : 'Sul_Lun_Meu_Mer_Yao_Gwe_Sad'.split('_'),
        weekdaysMin : 'Su_Lu_Me_Mer_Ya_Gw_Sa'.split('_'),
        longDateFormat : {
            LT : 'h[e]mm A',
            LTS : 'h[e]mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D [a viz] MMMM YYYY',
            LLL : 'D [a viz] MMMM YYYY LT',
            LLLL : 'dddd, D [a viz] MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Hiziv da] LT',
            nextDay : '[Warc\'hoazh da] LT',
            nextWeek : 'dddd [da] LT',
            lastDay : '[Dec\'h da] LT',
            lastWeek : 'dddd [paset da] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'a-benn %s',
            past : '%s \'zo',
            s : 'un nebeud segondennoΓΉ',
            m : 'ur vunutenn',
            mm : relativeTimeWithMutation,
            h : 'un eur',
            hh : '%d eur',
            d : 'un devezh',
            dd : relativeTimeWithMutation,
            M : 'ur miz',
            MM : relativeTimeWithMutation,
            y : 'ur bloaz',
            yy : specialMutationForYears
        },
        ordinalParse: /\d{1,2}(aΓ±|vet)/,
        ordinal : function (number) {
            var output = (number === 1) ? 'aΓ±' : 'vet';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : bosnian (bs)
// author : Nedim Cholich : https://github.com/frontyard
// based on (hr) translation by Bojan MarkoviΔ

(function (factory) {
    factory(moment);
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minuta';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'jedan sat' : 'jednog sata';
        case 'hh':
            if (number === 1) {
                result += 'sat';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'sata';
            } else {
                result += 'sati';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dana';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mjesec';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'mjeseca';
            } else {
                result += 'mjeseci';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'godina';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'godine';
            } else {
                result += 'godina';
            }
            return result;
        }
    }

    return moment.defineLocale('bs', {
        months : 'januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar'.split('_'),
        monthsShort : 'jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.'.split('_'),
        weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_Δetvrtak_petak_subota'.split('_'),
        weekdaysShort : 'ned._pon._uto._sri._Δet._pet._sub.'.split('_'),
        weekdaysMin : 'ne_po_ut_sr_Δe_pe_su'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD. MM. YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[danas u] LT',
            nextDay  : '[sutra u] LT',

            nextWeek : function () {
                switch (this.day()) {
                case 0:
                    return '[u] [nedjelju] [u] LT';
                case 3:
                    return '[u] [srijedu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juΔer u] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                    return '[proΕ‘lu] dddd [u] LT';
                case 6:
                    return '[proΕ‘le] [subote] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[proΕ‘li] dddd [u] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'za %s',
            past   : 'prije %s',
            s      : 'par sekundi',
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : 'dan',
            dd     : translate,
            M      : 'mjesec',
            MM     : translate,
            y      : 'godinu',
            yy     : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : catalan (ca)
// author : Juan G. Hurtado : https://github.com/juanghurtado

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ca', {
        months : 'gener_febrer_marΓ§_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre'.split('_'),
        monthsShort : 'gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.'.split('_'),
        weekdays : 'diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte'.split('_'),
        weekdaysShort : 'dg._dl._dt._dc._dj._dv._ds.'.split('_'),
        weekdaysMin : 'Dg_Dl_Dt_Dc_Dj_Dv_Ds'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay : function () {
                return '[avui a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            nextDay : function () {
                return '[demΓ  a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            lastDay : function () {
                return '[ahir a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            lastWeek : function () {
                return '[el] dddd [passat a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'en %s',
            past : 'fa %s',
            s : 'uns segons',
            m : 'un minut',
            mm : '%d minuts',
            h : 'una hora',
            hh : '%d hores',
            d : 'un dia',
            dd : '%d dies',
            M : 'un mes',
            MM : '%d mesos',
            y : 'un any',
            yy : '%d anys'
        },
        ordinalParse: /\d{1,2}(r|n|t|Γ¨|a)/,
        ordinal : function (number, period) {
            var output = (number === 1) ? 'r' :
                (number === 2) ? 'n' :
                (number === 3) ? 'r' :
                (number === 4) ? 't' : 'Γ¨';
            if (period === 'w' || period === 'W') {
                output = 'a';
            }
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : czech (cs)
// author : petrbela : https://github.com/petrbela

(function (factory) {
    factory(moment);
}(function (moment) {
    var months = 'leden_ΓΊnor_bΕezen_duben_kvΔten_Δerven_Δervenec_srpen_zΓ‘ΕΓ­_ΕΓ­jen_listopad_prosinec'.split('_'),
        monthsShort = 'led_ΓΊno_bΕe_dub_kvΔ_Δvn_Δvc_srp_zΓ‘Ε_ΕΓ­j_lis_pro'.split('_');

    function plural(n) {
        return (n > 1) && (n < 5) && (~~(n / 10) !== 1);
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'pΓ‘r sekund' : 'pΓ‘r sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'minuta' : (isFuture ? 'minutu' : 'minutou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'minuty' : 'minut');
            } else {
                return result + 'minutami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'hodiny' : 'hodin');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'den' : 'dnem';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'dny' : 'dnΓ­');
            } else {
                return result + 'dny';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'mΔsΓ­c' : 'mΔsΓ­cem';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'mΔsΓ­ce' : 'mΔsΓ­cΕ―');
            } else {
                return result + 'mΔsΓ­ci';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokem';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'roky' : 'let');
            } else {
                return result + 'lety';
            }
            break;
        }
    }

    return moment.defineLocale('cs', {
        months : months,
        monthsShort : monthsShort,
        monthsParse : (function (months, monthsShort) {
            var i, _monthsParse = [];
            for (i = 0; i < 12; i++) {
                // use custom parser to solve problem with July (Δervenec)
                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
            }
            return _monthsParse;
        }(months, monthsShort)),
        weekdays : 'nedΔle_pondΔlΓ­_ΓΊterΓ½_stΕeda_Δtvrtek_pΓ‘tek_sobota'.split('_'),
        weekdaysShort : 'ne_po_ΓΊt_st_Δt_pΓ‘_so'.split('_'),
        weekdaysMin : 'ne_po_ΓΊt_st_Δt_pΓ‘_so'.split('_'),
        longDateFormat : {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[dnes v] LT',
            nextDay: '[zΓ­tra v] LT',
            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[v nedΔli v] LT';
                case 1:
                case 2:
                    return '[v] dddd [v] LT';
                case 3:
                    return '[ve stΕedu v] LT';
                case 4:
                    return '[ve Δtvrtek v] LT';
                case 5:
                    return '[v pΓ‘tek v] LT';
                case 6:
                    return '[v sobotu v] LT';
                }
            },
            lastDay: '[vΔera v] LT',
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[minulou nedΔli v] LT';
                case 1:
                case 2:
                    return '[minulΓ©] dddd [v] LT';
                case 3:
                    return '[minulou stΕedu v] LT';
                case 4:
                case 5:
                    return '[minulΓ½] dddd [v] LT';
                case 6:
                    return '[minulou sobotu v] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'za %s',
            past : 'pΕed %s',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse : /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : chuvash (cv)
// author : Anatoly Mironov : https://github.com/mirontoli

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('cv', {
        months : 'ΠΊΔΡΠ»Π°Ρ_Π½Π°ΡΔΡ_ΠΏΡΡ_Π°ΠΊΠ°_ΠΌΠ°ΠΉ_Γ§ΔΡΡΠΌΠ΅_ΡΡΔ_Γ§ΡΡΠ»Π°_Π°Π²ΔΠ½_ΡΠΏΠ°_ΡΣ³ΠΊ_ΡΠ°ΡΡΠ°Π²'.split('_'),
        monthsShort : 'ΠΊΔΡ_Π½Π°Ρ_ΠΏΡΡ_Π°ΠΊΠ°_ΠΌΠ°ΠΉ_Γ§ΔΡ_ΡΡΔ_Γ§ΡΡ_Π°Π²_ΡΠΏΠ°_ΡΣ³ΠΊ_ΡΠ°Ρ'.split('_'),
        weekdays : 'Π²ΡΡΡΠ°ΡΠ½ΠΈΠΊΡΠ½_ΡΡΠ½ΡΠΈΠΊΡΠ½_ΡΡΠ»Π°ΡΠΈΠΊΡΠ½_ΡΠ½ΠΊΡΠ½_ΠΊΔΓ§Π½Π΅ΡΠ½ΠΈΠΊΡΠ½_ΡΡΠ½Π΅ΠΊΡΠ½_ΡΔΠΌΠ°ΡΠΊΡΠ½'.split('_'),
        weekdaysShort : 'Π²ΡΡ_ΡΡΠ½_ΡΡΠ»_ΡΠ½_ΠΊΔΓ§_ΡΡΠ½_ΡΔΠΌ'.split('_'),
        weekdaysMin : 'Π²Ρ_ΡΠ½_ΡΡ_ΡΠ½_ΠΊΓ§_ΡΡ_ΡΠΌ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD-MM-YYYY',
            LL : 'YYYY [Γ§ΡΠ»ΡΠΈ] MMMM [ΡΠΉΔΡΔΠ½] D[-ΠΌΔΡΔ]',
            LLL : 'YYYY [Γ§ΡΠ»ΡΠΈ] MMMM [ΡΠΉΔΡΔΠ½] D[-ΠΌΔΡΔ], LT',
            LLLL : 'dddd, YYYY [Γ§ΡΠ»ΡΠΈ] MMMM [ΡΠΉΔΡΔΠ½] D[-ΠΌΔΡΔ], LT'
        },
        calendar : {
            sameDay: '[ΠΠ°ΡΠ½] LT [ΡΠ΅ΡΠ΅ΡΡΠ΅]',
            nextDay: '[Π«ΡΠ°Π½] LT [ΡΠ΅ΡΠ΅ΡΡΠ΅]',
            lastDay: '[ΔΠ½Π΅Ρ] LT [ΡΠ΅ΡΠ΅ΡΡΠ΅]',
            nextWeek: '[ΓΠΈΡΠ΅Ρ] dddd LT [ΡΠ΅ΡΠ΅ΡΡΠ΅]',
            lastWeek: '[ΠΡΡΠ½Δ] dddd LT [ΡΠ΅ΡΠ΅ΡΡΠ΅]',
            sameElse: 'L'
        },
        relativeTime : {
            future : function (output) {
                var affix = /ΡΠ΅ΡΠ΅Ρ$/i.exec(output) ? 'ΡΠ΅Π½' : /Γ§ΡΠ»$/i.exec(output) ? 'ΡΠ°Π½' : 'ΡΠ°Π½';
                return output + affix;
            },
            past : '%s ΠΊΠ°ΡΠ»Π»Π°',
            s : 'ΠΏΔΡ-ΠΈΠΊ Γ§Π΅ΠΊΠΊΡΠ½Ρ',
            m : 'ΠΏΔΡ ΠΌΠΈΠ½ΡΡ',
            mm : '%d ΠΌΠΈΠ½ΡΡ',
            h : 'ΠΏΔΡ ΡΠ΅ΡΠ΅Ρ',
            hh : '%d ΡΠ΅ΡΠ΅Ρ',
            d : 'ΠΏΔΡ ΠΊΡΠ½',
            dd : '%d ΠΊΡΠ½',
            M : 'ΠΏΔΡ ΡΠΉΔΡ',
            MM : '%d ΡΠΉΔΡ',
            y : 'ΠΏΔΡ Γ§ΡΠ»',
            yy : '%d Γ§ΡΠ»'
        },
        ordinalParse: /\d{1,2}-ΠΌΔΡ/,
        ordinal : '%d-ΠΌΔΡ',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Welsh (cy)
// author : Robert Allen

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('cy', {
        months: 'Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr'.split('_'),
        monthsShort: 'Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag'.split('_'),
        weekdays: 'Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn'.split('_'),
        weekdaysShort: 'Sul_Llun_Maw_Mer_Iau_Gwe_Sad'.split('_'),
        weekdaysMin: 'Su_Ll_Ma_Me_Ia_Gw_Sa'.split('_'),
        // time formats are the same as en-gb
        longDateFormat: {
            LT: 'HH:mm',
            LTS : 'LT:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd, D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Heddiw am] LT',
            nextDay: '[Yfory am] LT',
            nextWeek: 'dddd [am] LT',
            lastDay: '[Ddoe am] LT',
            lastWeek: 'dddd [diwethaf am] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: 'mewn %s',
            past: '%s yn Γ΄l',
            s: 'ychydig eiliadau',
            m: 'munud',
            mm: '%d munud',
            h: 'awr',
            hh: '%d awr',
            d: 'diwrnod',
            dd: '%d diwrnod',
            M: 'mis',
            MM: '%d mis',
            y: 'blwyddyn',
            yy: '%d flynedd'
        },
        ordinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
        // traditional ordinal numbers above 31 are not commonly used in colloquial Welsh
        ordinal: function (number) {
            var b = number,
                output = '',
                lookup = [
                    '', 'af', 'il', 'ydd', 'ydd', 'ed', 'ed', 'ed', 'fed', 'fed', 'fed', // 1af to 10fed
                    'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'fed' // 11eg to 20fed
                ];

            if (b > 20) {
                if (b === 40 || b === 50 || b === 60 || b === 80 || b === 100) {
                    output = 'fed'; // not 30ain, 70ain or 90ain
                } else {
                    output = 'ain';
                }
            } else if (b > 0) {
                output = lookup[b];
            }

            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : danish (da)
// author : Ulrik Nielsen : https://github.com/mrbase

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('da', {
        months : 'januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
        weekdays : 'sΓΈndag_mandag_tirsdag_onsdag_torsdag_fredag_lΓΈrdag'.split('_'),
        weekdaysShort : 'sΓΈn_man_tir_ons_tor_fre_lΓΈr'.split('_'),
        weekdaysMin : 'sΓΈ_ma_ti_on_to_fr_lΓΈ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd [d.] D. MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[I dag kl.] LT',
            nextDay : '[I morgen kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[I gΓ₯r kl.] LT',
            lastWeek : '[sidste] dddd [kl] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : '%s siden',
            s : 'fΓ₯ sekunder',
            m : 'et minut',
            mm : '%d minutter',
            h : 'en time',
            hh : '%d timer',
            d : 'en dag',
            dd : '%d dage',
            M : 'en mΓ₯ned',
            MM : '%d mΓ₯neder',
            y : 'et Γ₯r',
            yy : '%d Γ₯r'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : austrian german (de-at)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensΓΊle: https://github.com/Oire
// author : Martin Groller : https://github.com/MadMG

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eine Minute', 'einer Minute'],
            'h': ['eine Stunde', 'einer Stunde'],
            'd': ['ein Tag', 'einem Tag'],
            'dd': [number + ' Tage', number + ' Tagen'],
            'M': ['ein Monat', 'einem Monat'],
            'MM': [number + ' Monate', number + ' Monaten'],
            'y': ['ein Jahr', 'einem Jahr'],
            'yy': [number + ' Jahre', number + ' Jahren']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    return moment.defineLocale('de-at', {
        months : 'JΓ€nner_Februar_MΓ€rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
        monthsShort : 'JΓ€n._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
        weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
        weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
        weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        longDateFormat : {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Heute um] LT [Uhr]',
            sameElse: 'L',
            nextDay: '[Morgen um] LT [Uhr]',
            nextWeek: 'dddd [um] LT [Uhr]',
            lastDay: '[Gestern um] LT [Uhr]',
            lastWeek: '[letzten] dddd [um] LT [Uhr]'
        },
        relativeTime : {
            future : 'in %s',
            past : 'vor %s',
            s : 'ein paar Sekunden',
            m : processRelativeTime,
            mm : '%d Minuten',
            h : processRelativeTime,
            hh : '%d Stunden',
            d : processRelativeTime,
            dd : processRelativeTime,
            M : processRelativeTime,
            MM : processRelativeTime,
            y : processRelativeTime,
            yy : processRelativeTime
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : german (de)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensΓΊle: https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eine Minute', 'einer Minute'],
            'h': ['eine Stunde', 'einer Stunde'],
            'd': ['ein Tag', 'einem Tag'],
            'dd': [number + ' Tage', number + ' Tagen'],
            'M': ['ein Monat', 'einem Monat'],
            'MM': [number + ' Monate', number + ' Monaten'],
            'y': ['ein Jahr', 'einem Jahr'],
            'yy': [number + ' Jahre', number + ' Jahren']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    return moment.defineLocale('de', {
        months : 'Januar_Februar_MΓ€rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
        monthsShort : 'Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
        weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
        weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
        weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
        longDateFormat : {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Heute um] LT [Uhr]',
            sameElse: 'L',
            nextDay: '[Morgen um] LT [Uhr]',
            nextWeek: 'dddd [um] LT [Uhr]',
            lastDay: '[Gestern um] LT [Uhr]',
            lastWeek: '[letzten] dddd [um] LT [Uhr]'
        },
        relativeTime : {
            future : 'in %s',
            past : 'vor %s',
            s : 'ein paar Sekunden',
            m : processRelativeTime,
            mm : '%d Minuten',
            h : processRelativeTime,
            hh : '%d Stunden',
            d : processRelativeTime,
            dd : processRelativeTime,
            M : processRelativeTime,
            MM : processRelativeTime,
            y : processRelativeTime,
            yy : processRelativeTime
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : modern greek (el)
// author : Aggelos Karalias : https://github.com/mehiel

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('el', {
        monthsNominativeEl : 'ΞΞ±Ξ½ΞΏΟΞ¬ΟΞΉΞΏΟ_Ξ¦Ξ΅Ξ²ΟΞΏΟΞ¬ΟΞΉΞΏΟ_ΞΞ¬ΟΟΞΉΞΏΟ_ΞΟΟΞ―Ξ»ΞΉΞΏΟ_ΞΞ¬ΞΉΞΏΟ_ΞΞΏΟΞ½ΞΉΞΏΟ_ΞΞΏΟΞ»ΞΉΞΏΟ_ΞΟΞ³ΞΏΟΟΟΞΏΟ_Ξ£Ξ΅ΟΟΞ­ΞΌΞ²ΟΞΉΞΏΟ_ΞΞΊΟΟΞ²ΟΞΉΞΏΟ_ΞΞΏΞ­ΞΌΞ²ΟΞΉΞΏΟ_ΞΞ΅ΞΊΞ­ΞΌΞ²ΟΞΉΞΏΟ'.split('_'),
        monthsGenitiveEl : 'ΞΞ±Ξ½ΞΏΟΞ±ΟΞ―ΞΏΟ_Ξ¦Ξ΅Ξ²ΟΞΏΟΞ±ΟΞ―ΞΏΟ_ΞΞ±ΟΟΞ―ΞΏΟ_ΞΟΟΞΉΞ»Ξ―ΞΏΟ_ΞΞ±ΞΞΏΟ_ΞΞΏΟΞ½Ξ―ΞΏΟ_ΞΞΏΟΞ»Ξ―ΞΏΟ_ΞΟΞ³ΞΏΟΟΟΞΏΟ_Ξ£Ξ΅ΟΟΞ΅ΞΌΞ²ΟΞ―ΞΏΟ_ΞΞΊΟΟΞ²ΟΞ―ΞΏΟ_ΞΞΏΞ΅ΞΌΞ²ΟΞ―ΞΏΟ_ΞΞ΅ΞΊΞ΅ΞΌΞ²ΟΞ―ΞΏΟ'.split('_'),
        months : function (momentToFormat, format) {
            if (/D/.test(format.substring(0, format.indexOf('MMMM')))) { // if there is a day number before 'MMMM'
                return this._monthsGenitiveEl[momentToFormat.month()];
            } else {
                return this._monthsNominativeEl[momentToFormat.month()];
            }
        },
        monthsShort : 'ΞΞ±Ξ½_Ξ¦Ξ΅Ξ²_ΞΞ±Ο_ΞΟΟ_ΞΞ±Ο_ΞΞΏΟΞ½_ΞΞΏΟΞ»_ΞΟΞ³_Ξ£Ξ΅Ο_ΞΞΊΟ_ΞΞΏΞ΅_ΞΞ΅ΞΊ'.split('_'),
        weekdays : 'ΞΟΟΞΉΞ±ΞΊΞ�_ΞΞ΅ΟΟΞ­ΟΞ±_Ξ€ΟΞ―ΟΞ·_Ξ€Ξ΅ΟΞ¬ΟΟΞ·_Ξ Ξ­ΞΌΟΟΞ·_Ξ Ξ±ΟΞ±ΟΞΊΞ΅ΟΞ�_Ξ£Ξ¬Ξ²Ξ²Ξ±ΟΞΏ'.split('_'),
        weekdaysShort : 'ΞΟΟ_ΞΞ΅Ο_Ξ€ΟΞΉ_Ξ€Ξ΅Ο_Ξ Ξ΅ΞΌ_Ξ Ξ±Ο_Ξ£Ξ±Ξ²'.split('_'),
        weekdaysMin : 'ΞΟ_ΞΞ΅_Ξ€Ο_Ξ€Ξ΅_Ξ Ξ΅_Ξ Ξ±_Ξ£Ξ±'.split('_'),
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'ΞΌΞΌ' : 'ΞΞ';
            } else {
                return isLower ? 'ΟΞΌ' : 'Ξ Ξ';
            }
        },
        isPM : function (input) {
            return ((input + '').toLowerCase()[0] === 'ΞΌ');
        },
        meridiemParse : /[Ξ Ξ]\.?Ξ?\.?/i,
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendarEl : {
            sameDay : '[Ξ£Ξ�ΞΌΞ΅ΟΞ± {}] LT',
            nextDay : '[ΞΟΟΞΉΞΏ {}] LT',
            nextWeek : 'dddd [{}] LT',
            lastDay : '[Ξ§ΞΈΞ΅Ο {}] LT',
            lastWeek : function () {
                switch (this.day()) {
                    case 6:
                        return '[ΟΞΏ ΟΟΞΏΞ·Ξ³ΞΏΟΞΌΞ΅Ξ½ΞΏ] dddd [{}] LT';
                    default:
                        return '[ΟΞ·Ξ½ ΟΟΞΏΞ·Ξ³ΞΏΟΞΌΞ΅Ξ½Ξ·] dddd [{}] LT';
                }
            },
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendarEl[key],
                hours = mom && mom.hours();

            if (typeof output === 'function') {
                output = output.apply(mom);
            }

            return output.replace('{}', (hours % 12 === 1 ? 'ΟΟΞ·' : 'ΟΟΞΉΟ'));
        },
        relativeTime : {
            future : 'ΟΞ΅ %s',
            past : '%s ΟΟΞΉΞ½',
            s : 'Ξ»Ξ―Ξ³Ξ± Ξ΄Ξ΅ΟΟΞ΅ΟΟΞ»Ξ΅ΟΟΞ±',
            m : 'Ξ­Ξ½Ξ± Ξ»Ξ΅ΟΟΟ',
            mm : '%d Ξ»Ξ΅ΟΟΞ¬',
            h : 'ΞΌΞ―Ξ± ΟΟΞ±',
            hh : '%d ΟΟΞ΅Ο',
            d : 'ΞΌΞ―Ξ± ΞΌΞ­ΟΞ±',
            dd : '%d ΞΌΞ­ΟΞ΅Ο',
            M : 'Ξ­Ξ½Ξ±Ο ΞΌΞ�Ξ½Ξ±Ο',
            MM : '%d ΞΌΞ�Ξ½Ξ΅Ο',
            y : 'Ξ­Ξ½Ξ±Ο ΟΟΟΞ½ΞΏΟ',
            yy : '%d ΟΟΟΞ½ΞΉΞ±'
        },
        ordinalParse: /\d{1,2}Ξ·/,
        ordinal: '%dΞ·',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : australian english (en-au)

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('en-au', {
        months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },
        ordinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : canadian english (en-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('en-ca', {
        months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'YYYY-MM-DD',
            LL : 'D MMMM, YYYY',
            LLL : 'D MMMM, YYYY LT',
            LLLL : 'dddd, D MMMM, YYYY LT'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },
        ordinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });
}));
// moment.js locale configuration
// locale : great britain english (en-gb)
// author : Chris Gedrim : https://github.com/chrisgedrim

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('en-gb', {
        months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'HH:mm:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },
        ordinalParse: /\d{1,2}(st|nd|rd|th)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : esperanto (eo)
// author : Colin Dean : https://github.com/colindean
// komento: Mi estas malcerta se mi korekte traktis akuzativojn en tiu traduko.
//          Se ne, bonvolu korekti kaj avizi min por ke mi povas lerni!

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('eo', {
        months : 'januaro_februaro_marto_aprilo_majo_junio_julio_aΕ­gusto_septembro_oktobro_novembro_decembro'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aΕ­g_sep_okt_nov_dec'.split('_'),
        weekdays : 'DimanΔo_Lundo_Mardo_Merkredo_Δ΄aΕ­do_Vendredo_Sabato'.split('_'),
        weekdaysShort : 'Dim_Lun_Mard_Merk_Δ΄aΕ­_Ven_Sab'.split('_'),
        weekdaysMin : 'Di_Lu_Ma_Me_Δ΄a_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'D[-an de] MMMM, YYYY',
            LLL : 'D[-an de] MMMM, YYYY LT',
            LLLL : 'dddd, [la] D[-an de] MMMM, YYYY LT'
        },
        meridiemParse: /[ap]\.t\.m/i,
        isPM: function (input) {
            return input.charAt(0).toLowerCase() === 'p';
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'p.t.m.' : 'P.T.M.';
            } else {
                return isLower ? 'a.t.m.' : 'A.T.M.';
            }
        },
        calendar : {
            sameDay : '[HodiaΕ­ je] LT',
            nextDay : '[MorgaΕ­ je] LT',
            nextWeek : 'dddd [je] LT',
            lastDay : '[HieraΕ­ je] LT',
            lastWeek : '[pasinta] dddd [je] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'je %s',
            past : 'antaΕ­ %s',
            s : 'sekundoj',
            m : 'minuto',
            mm : '%d minutoj',
            h : 'horo',
            hh : '%d horoj',
            d : 'tago',//ne 'diurno', Δar estas uzita por proksimumo
            dd : '%d tagoj',
            M : 'monato',
            MM : '%d monatoj',
            y : 'jaro',
            yy : '%d jaroj'
        },
        ordinalParse: /\d{1,2}a/,
        ordinal : '%da',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : spanish (es)
// author : Julio NapurΓ­ : https://github.com/julionc

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsShortDot = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_'),
        monthsShort = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_');

    return moment.defineLocale('es', {
        months : 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShort[m.month()];
            } else {
                return monthsShortDot[m.month()];
            }
        },
        weekdays : 'domingo_lunes_martes_miΓ©rcoles_jueves_viernes_sΓ‘bado'.split('_'),
        weekdaysShort : 'dom._lun._mar._miΓ©._jue._vie._sΓ‘b.'.split('_'),
        weekdaysMin : 'Do_Lu_Ma_Mi_Ju_Vi_SΓ‘'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [de] MMMM [de] YYYY',
            LLL : 'D [de] MMMM [de] YYYY LT',
            LLLL : 'dddd, D [de] MMMM [de] YYYY LT'
        },
        calendar : {
            sameDay : function () {
                return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            nextDay : function () {
                return '[maΓ±ana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            lastDay : function () {
                return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            lastWeek : function () {
                return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'en %s',
            past : 'hace %s',
            s : 'unos segundos',
            m : 'un minuto',
            mm : '%d minutos',
            h : 'una hora',
            hh : '%d horas',
            d : 'un dΓ­a',
            dd : '%d dΓ­as',
            M : 'un mes',
            MM : '%d meses',
            y : 'un aΓ±o',
            yy : '%d aΓ±os'
        },
        ordinalParse : /\d{1,2}ΒΊ/,
        ordinal : '%dΒΊ',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : estonian (et)
// author : Henry Kehlmann : https://github.com/madhenry
// improvements : Illimar Tambek : https://github.com/ragulka

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            's' : ['mΓ΅ne sekundi', 'mΓ΅ni sekund', 'paar sekundit'],
            'm' : ['ΓΌhe minuti', 'ΓΌks minut'],
            'mm': [number + ' minuti', number + ' minutit'],
            'h' : ['ΓΌhe tunni', 'tund aega', 'ΓΌks tund'],
            'hh': [number + ' tunni', number + ' tundi'],
            'd' : ['ΓΌhe pΓ€eva', 'ΓΌks pΓ€ev'],
            'M' : ['kuu aja', 'kuu aega', 'ΓΌks kuu'],
            'MM': [number + ' kuu', number + ' kuud'],
            'y' : ['ΓΌhe aasta', 'aasta', 'ΓΌks aasta'],
            'yy': [number + ' aasta', number + ' aastat']
        };
        if (withoutSuffix) {
            return format[key][2] ? format[key][2] : format[key][1];
        }
        return isFuture ? format[key][0] : format[key][1];
    }

    return moment.defineLocale('et', {
        months        : 'jaanuar_veebruar_mΓ€rts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember'.split('_'),
        monthsShort   : 'jaan_veebr_mΓ€rts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets'.split('_'),
        weekdays      : 'pΓΌhapΓ€ev_esmaspΓ€ev_teisipΓ€ev_kolmapΓ€ev_neljapΓ€ev_reede_laupΓ€ev'.split('_'),
        weekdaysShort : 'P_E_T_K_N_R_L'.split('_'),
        weekdaysMin   : 'P_E_T_K_N_R_L'.split('_'),
        longDateFormat : {
            LT   : 'H:mm',
            LTS : 'LT:ss',
            L    : 'DD.MM.YYYY',
            LL   : 'D. MMMM YYYY',
            LLL  : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[TΓ€na,] LT',
            nextDay  : '[Homme,] LT',
            nextWeek : '[JΓ€rgmine] dddd LT',
            lastDay  : '[Eile,] LT',
            lastWeek : '[Eelmine] dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s pΓ€rast',
            past   : '%s tagasi',
            s      : processRelativeTime,
            m      : processRelativeTime,
            mm     : processRelativeTime,
            h      : processRelativeTime,
            hh     : processRelativeTime,
            d      : processRelativeTime,
            dd     : '%d pΓ€eva',
            M      : processRelativeTime,
            MM     : processRelativeTime,
            y      : processRelativeTime,
            yy     : processRelativeTime
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : euskara (eu)
// author : Eneko Illarramendi : https://github.com/eillarra

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('eu', {
        months : 'urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua'.split('_'),
        monthsShort : 'urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.'.split('_'),
        weekdays : 'igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata'.split('_'),
        weekdaysShort : 'ig._al._ar._az._og._ol._lr.'.split('_'),
        weekdaysMin : 'ig_al_ar_az_og_ol_lr'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'YYYY[ko] MMMM[ren] D[a]',
            LLL : 'YYYY[ko] MMMM[ren] D[a] LT',
            LLLL : 'dddd, YYYY[ko] MMMM[ren] D[a] LT',
            l : 'YYYY-M-D',
            ll : 'YYYY[ko] MMM D[a]',
            lll : 'YYYY[ko] MMM D[a] LT',
            llll : 'ddd, YYYY[ko] MMM D[a] LT'
        },
        calendar : {
            sameDay : '[gaur] LT[etan]',
            nextDay : '[bihar] LT[etan]',
            nextWeek : 'dddd LT[etan]',
            lastDay : '[atzo] LT[etan]',
            lastWeek : '[aurreko] dddd LT[etan]',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s barru',
            past : 'duela %s',
            s : 'segundo batzuk',
            m : 'minutu bat',
            mm : '%d minutu',
            h : 'ordu bat',
            hh : '%d ordu',
            d : 'egun bat',
            dd : '%d egun',
            M : 'hilabete bat',
            MM : '%d hilabete',
            y : 'urte bat',
            yy : '%d urte'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Persian (fa)
// author : Ebrahim Byagowi : https://github.com/ebraminio

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'Ϋ±',
        '2': 'Ϋ²',
        '3': 'Ϋ³',
        '4': 'Ϋ΄',
        '5': 'Ϋ΅',
        '6': 'ΫΆ',
        '7': 'Ϋ·',
        '8': 'ΫΈ',
        '9': 'ΫΉ',
        '0': 'Ϋ°'
    }, numberMap = {
        'Ϋ±': '1',
        'Ϋ²': '2',
        'Ϋ³': '3',
        'Ϋ΄': '4',
        'Ϋ΅': '5',
        'ΫΆ': '6',
        'Ϋ·': '7',
        'ΫΈ': '8',
        'ΫΉ': '9',
        'Ϋ°': '0'
    };

    return moment.defineLocale('fa', {
        months : 'ΪΨ§ΩΩΫΩ_ΩΩΨ±ΫΩ_ΩΨ§Ψ±Ψ³_Ψ’ΩΨ±ΫΩ_ΩΩ_ΪΩΨ¦Ω_ΪΩΨ¦ΫΩ_Ψ§ΩΨͺ_Ψ³ΩΎΨͺΨ§ΩΨ¨Ψ±_Ψ§Ϊ©ΨͺΨ¨Ψ±_ΩΩΨ§ΩΨ¨Ψ±_Ψ―Ψ³Ψ§ΩΨ¨Ψ±'.split('_'),
        monthsShort : 'ΪΨ§ΩΩΫΩ_ΩΩΨ±ΫΩ_ΩΨ§Ψ±Ψ³_Ψ’ΩΨ±ΫΩ_ΩΩ_ΪΩΨ¦Ω_ΪΩΨ¦ΫΩ_Ψ§ΩΨͺ_Ψ³ΩΎΨͺΨ§ΩΨ¨Ψ±_Ψ§Ϊ©ΨͺΨ¨Ψ±_ΩΩΨ§ΩΨ¨Ψ±_Ψ―Ψ³Ψ§ΩΨ¨Ψ±'.split('_'),
        weekdays : 'ΫΪ©\u200cΨ΄ΩΨ¨Ω_Ψ―ΩΨ΄ΩΨ¨Ω_Ψ³Ω\u200cΨ΄ΩΨ¨Ω_ΪΩΨ§Ψ±Ψ΄ΩΨ¨Ω_ΩΎΩΨ¬\u200cΨ΄ΩΨ¨Ω_Ψ¬ΩΨΉΩ_Ψ΄ΩΨ¨Ω'.split('_'),
        weekdaysShort : 'ΫΪ©\u200cΨ΄ΩΨ¨Ω_Ψ―ΩΨ΄ΩΨ¨Ω_Ψ³Ω\u200cΨ΄ΩΨ¨Ω_ΪΩΨ§Ψ±Ψ΄ΩΨ¨Ω_ΩΎΩΨ¬\u200cΨ΄ΩΨ¨Ω_Ψ¬ΩΨΉΩ_Ψ΄ΩΨ¨Ω'.split('_'),
        weekdaysMin : 'Ϋ_Ψ―_Ψ³_Ϊ_ΩΎ_Ψ¬_Ψ΄'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        meridiemParse: /ΩΨ¨Ω Ψ§Ψ² ΨΈΩΨ±|Ψ¨ΨΉΨ― Ψ§Ψ² ΨΈΩΨ±/,
        isPM: function (input) {
            return /Ψ¨ΨΉΨ― Ψ§Ψ² ΨΈΩΨ±/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'ΩΨ¨Ω Ψ§Ψ² ΨΈΩΨ±';
            } else {
                return 'Ψ¨ΨΉΨ― Ψ§Ψ² ΨΈΩΨ±';
            }
        },
        calendar : {
            sameDay : '[Ψ§ΩΨ±ΩΨ² Ψ³Ψ§ΨΉΨͺ] LT',
            nextDay : '[ΩΨ±Ψ―Ψ§ Ψ³Ψ§ΨΉΨͺ] LT',
            nextWeek : 'dddd [Ψ³Ψ§ΨΉΨͺ] LT',
            lastDay : '[Ψ―ΫΨ±ΩΨ² Ψ³Ψ§ΨΉΨͺ] LT',
            lastWeek : 'dddd [ΩΎΫΨ΄] [Ψ³Ψ§ΨΉΨͺ] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Ψ―Ψ± %s',
            past : '%s ΩΎΫΨ΄',
            s : 'ΪΩΨ―ΫΩ Ψ«Ψ§ΩΫΩ',
            m : 'ΫΪ© Ψ―ΩΫΩΩ',
            mm : '%d Ψ―ΩΫΩΩ',
            h : 'ΫΪ© Ψ³Ψ§ΨΉΨͺ',
            hh : '%d Ψ³Ψ§ΨΉΨͺ',
            d : 'ΫΪ© Ψ±ΩΨ²',
            dd : '%d Ψ±ΩΨ²',
            M : 'ΫΪ© ΩΨ§Ω',
            MM : '%d ΩΨ§Ω',
            y : 'ΫΪ© Ψ³Ψ§Ω',
            yy : '%d Ψ³Ψ§Ω'
        },
        preparse: function (string) {
            return string.replace(/[Ϋ°-ΫΉ]/g, function (match) {
                return numberMap[match];
            }).replace(/Ψ/g, ',');
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            }).replace(/,/g, 'Ψ');
        },
        ordinalParse: /\d{1,2}Ω/,
        ordinal : '%dΩ',
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12 // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : finnish (fi)
// author : Tarmo Aidantausta : https://github.com/bleadof

(function (factory) {
    factory(moment);
}(function (moment) {
    var numbersPast = 'nolla yksi kaksi kolme neljΓ€ viisi kuusi seitsemΓ€n kahdeksan yhdeksΓ€n'.split(' '),
        numbersFuture = [
            'nolla', 'yhden', 'kahden', 'kolmen', 'neljΓ€n', 'viiden', 'kuuden',
            numbersPast[7], numbersPast[8], numbersPast[9]
        ];

    function translate(number, withoutSuffix, key, isFuture) {
        var result = '';
        switch (key) {
        case 's':
            return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
        case 'm':
            return isFuture ? 'minuutin' : 'minuutti';
        case 'mm':
            result = isFuture ? 'minuutin' : 'minuuttia';
            break;
        case 'h':
            return isFuture ? 'tunnin' : 'tunti';
        case 'hh':
            result = isFuture ? 'tunnin' : 'tuntia';
            break;
        case 'd':
            return isFuture ? 'pΓ€ivΓ€n' : 'pΓ€ivΓ€';
        case 'dd':
            result = isFuture ? 'pΓ€ivΓ€n' : 'pΓ€ivΓ€Γ€';
            break;
        case 'M':
            return isFuture ? 'kuukauden' : 'kuukausi';
        case 'MM':
            result = isFuture ? 'kuukauden' : 'kuukautta';
            break;
        case 'y':
            return isFuture ? 'vuoden' : 'vuosi';
        case 'yy':
            result = isFuture ? 'vuoden' : 'vuotta';
            break;
        }
        result = verbalNumber(number, isFuture) + ' ' + result;
        return result;
    }

    function verbalNumber(number, isFuture) {
        return number < 10 ? (isFuture ? numbersFuture[number] : numbersPast[number]) : number;
    }

    return moment.defineLocale('fi', {
        months : 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesΓ€kuu_heinΓ€kuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split('_'),
        monthsShort : 'tammi_helmi_maalis_huhti_touko_kesΓ€_heinΓ€_elo_syys_loka_marras_joulu'.split('_'),
        weekdays : 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split('_'),
        weekdaysShort : 'su_ma_ti_ke_to_pe_la'.split('_'),
        weekdaysMin : 'su_ma_ti_ke_to_pe_la'.split('_'),
        longDateFormat : {
            LT : 'HH.mm',
            LTS : 'HH.mm.ss',
            L : 'DD.MM.YYYY',
            LL : 'Do MMMM[ta] YYYY',
            LLL : 'Do MMMM[ta] YYYY, [klo] LT',
            LLLL : 'dddd, Do MMMM[ta] YYYY, [klo] LT',
            l : 'D.M.YYYY',
            ll : 'Do MMM YYYY',
            lll : 'Do MMM YYYY, [klo] LT',
            llll : 'ddd, Do MMM YYYY, [klo] LT'
        },
        calendar : {
            sameDay : '[tΓ€nΓ€Γ€n] [klo] LT',
            nextDay : '[huomenna] [klo] LT',
            nextWeek : 'dddd [klo] LT',
            lastDay : '[eilen] [klo] LT',
            lastWeek : '[viime] dddd[na] [klo] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s pΓ€Γ€stΓ€',
            past : '%s sitten',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : faroese (fo)
// author : Ragnar Johannesen : https://github.com/ragnar123

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('fo', {
        months : 'januar_februar_mars_aprΓ­l_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays : 'sunnudagur_mΓ‘nadagur_tΓ½sdagur_mikudagur_hΓ³sdagur_frΓ­ggjadagur_leygardagur'.split('_'),
        weekdaysShort : 'sun_mΓ‘n_tΓ½s_mik_hΓ³s_frΓ­_ley'.split('_'),
        weekdaysMin : 'su_mΓ‘_tΓ½_mi_hΓ³_fr_le'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D. MMMM, YYYY LT'
        },
        calendar : {
            sameDay : '[Γ dag kl.] LT',
            nextDay : '[Γ morgin kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[Γ gjΓ‘r kl.] LT',
            lastWeek : '[sΓ­Γ°stu] dddd [kl] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'um %s',
            past : '%s sΓ­Γ°ani',
            s : 'fΓ‘ sekund',
            m : 'ein minutt',
            mm : '%d minuttir',
            h : 'ein tΓ­mi',
            hh : '%d tΓ­mar',
            d : 'ein dagur',
            dd : '%d dagar',
            M : 'ein mΓ‘naΓ°i',
            MM : '%d mΓ‘naΓ°ir',
            y : 'eitt Γ‘r',
            yy : '%d Γ‘r'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : canadian french (fr-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('fr-ca', {
        months : 'janvier_fΓ©vrier_mars_avril_mai_juin_juillet_aoΓ»t_septembre_octobre_novembre_dΓ©cembre'.split('_'),
        monthsShort : 'janv._fΓ©vr._mars_avr._mai_juin_juil._aoΓ»t_sept._oct._nov._dΓ©c.'.split('_'),
        weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
        weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
        weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Aujourd\'hui Γ ] LT',
            nextDay: '[Demain Γ ] LT',
            nextWeek: 'dddd [Γ ] LT',
            lastDay: '[Hier Γ ] LT',
            lastWeek: 'dddd [dernier Γ ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'dans %s',
            past : 'il y a %s',
            s : 'quelques secondes',
            m : 'une minute',
            mm : '%d minutes',
            h : 'une heure',
            hh : '%d heures',
            d : 'un jour',
            dd : '%d jours',
            M : 'un mois',
            MM : '%d mois',
            y : 'un an',
            yy : '%d ans'
        },
        ordinalParse: /\d{1,2}(er|)/,
        ordinal : function (number) {
            return number + (number === 1 ? 'er' : '');
        }
    });
}));
// moment.js locale configuration
// locale : french (fr)
// author : John Fischer : https://github.com/jfroffice

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('fr', {
        months : 'janvier_fΓ©vrier_mars_avril_mai_juin_juillet_aoΓ»t_septembre_octobre_novembre_dΓ©cembre'.split('_'),
        monthsShort : 'janv._fΓ©vr._mars_avr._mai_juin_juil._aoΓ»t_sept._oct._nov._dΓ©c.'.split('_'),
        weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
        weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
        weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Aujourd\'hui Γ ] LT',
            nextDay: '[Demain Γ ] LT',
            nextWeek: 'dddd [Γ ] LT',
            lastDay: '[Hier Γ ] LT',
            lastWeek: 'dddd [dernier Γ ] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'dans %s',
            past : 'il y a %s',
            s : 'quelques secondes',
            m : 'une minute',
            mm : '%d minutes',
            h : 'une heure',
            hh : '%d heures',
            d : 'un jour',
            dd : '%d jours',
            M : 'un mois',
            MM : '%d mois',
            y : 'un an',
            yy : '%d ans'
        },
        ordinalParse: /\d{1,2}(er|)/,
        ordinal : function (number) {
            return number + (number === 1 ? 'er' : '');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : frisian (fy)
// author : Robin van der Vliet : https://github.com/robin0van0der0v

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsShortWithDots = 'jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.'.split('_'),
        monthsShortWithoutDots = 'jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_');

    return moment.defineLocale('fy', {
        months : 'jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber'.split('_'),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots[m.month()];
            } else {
                return monthsShortWithDots[m.month()];
            }
        },
        weekdays : 'snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon'.split('_'),
        weekdaysShort : 'si._mo._ti._wo._to._fr._so.'.split('_'),
        weekdaysMin : 'Si_Mo_Ti_Wo_To_Fr_So'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD-MM-YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[hjoed om] LT',
            nextDay: '[moarn om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[juster om] LT',
            lastWeek: '[Γ΄frΓ»ne] dddd [om] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'oer %s',
            past : '%s lyn',
            s : 'in pear sekonden',
            m : 'ien minΓΊt',
            mm : '%d minuten',
            h : 'ien oere',
            hh : '%d oeren',
            d : 'ien dei',
            dd : '%d dagen',
            M : 'ien moanne',
            MM : '%d moannen',
            y : 'ien jier',
            yy : '%d jierren'
        },
        ordinalParse: /\d{1,2}(ste|de)/,
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : galician (gl)
// author : Juan G. Hurtado : https://github.com/juanghurtado

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('gl', {
        months : 'Xaneiro_Febreiro_Marzo_Abril_Maio_XuΓ±o_Xullo_Agosto_Setembro_Outubro_Novembro_Decembro'.split('_'),
        monthsShort : 'Xan._Feb._Mar._Abr._Mai._XuΓ±._Xul._Ago._Set._Out._Nov._Dec.'.split('_'),
        weekdays : 'Domingo_Luns_Martes_MΓ©rcores_Xoves_Venres_SΓ‘bado'.split('_'),
        weekdaysShort : 'Dom._Lun._Mar._MΓ©r._Xov._Ven._SΓ‘b.'.split('_'),
        weekdaysMin : 'Do_Lu_Ma_MΓ©_Xo_Ve_SΓ‘'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay : function () {
                return '[hoxe ' + ((this.hours() !== 1) ? 'Γ‘s' : 'Γ‘') + '] LT';
            },
            nextDay : function () {
                return '[maΓ±Γ‘ ' + ((this.hours() !== 1) ? 'Γ‘s' : 'Γ‘') + '] LT';
            },
            nextWeek : function () {
                return 'dddd [' + ((this.hours() !== 1) ? 'Γ‘s' : 'a') + '] LT';
            },
            lastDay : function () {
                return '[onte ' + ((this.hours() !== 1) ? 'Γ‘' : 'a') + '] LT';
            },
            lastWeek : function () {
                return '[o] dddd [pasado ' + ((this.hours() !== 1) ? 'Γ‘s' : 'a') + '] LT';
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : function (str) {
                if (str === 'uns segundos') {
                    return 'nuns segundos';
                }
                return 'en ' + str;
            },
            past : 'hai %s',
            s : 'uns segundos',
            m : 'un minuto',
            mm : '%d minutos',
            h : 'unha hora',
            hh : '%d horas',
            d : 'un dΓ­a',
            dd : '%d dΓ­as',
            M : 'un mes',
            MM : '%d meses',
            y : 'un ano',
            yy : '%d anos'
        },
        ordinalParse : /\d{1,2}ΒΊ/,
        ordinal : '%dΒΊ',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Hebrew (he)
// author : Tomer Cohen : https://github.com/tomer
// author : Moshe Simantov : https://github.com/DevelopmentIL
// author : Tal Ater : https://github.com/TalAter

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('he', {
        months : 'ΧΧ ΧΧΧ¨_Χ€ΧΧ¨ΧΧΧ¨_ΧΧ¨Χ₯_ΧΧ€Χ¨ΧΧ_ΧΧΧ_ΧΧΧ Χ_ΧΧΧΧ_ΧΧΧΧΧ‘Χ_Χ‘Χ€ΧΧΧΧ¨_ΧΧΧ§ΧΧΧΧ¨_Χ ΧΧΧΧΧ¨_ΧΧ¦ΧΧΧ¨'.split('_'),
        monthsShort : 'ΧΧ ΧΧ³_Χ€ΧΧ¨Χ³_ΧΧ¨Χ₯_ΧΧ€Χ¨Χ³_ΧΧΧ_ΧΧΧ Χ_ΧΧΧΧ_ΧΧΧΧ³_Χ‘Χ€ΧΧ³_ΧΧΧ§Χ³_Χ ΧΧΧ³_ΧΧ¦ΧΧ³'.split('_'),
        weekdays : 'Χ¨ΧΧ©ΧΧ_Χ©Χ Χ_Χ©ΧΧΧ©Χ_Χ¨ΧΧΧ’Χ_ΧΧΧΧ©Χ_Χ©ΧΧ©Χ_Χ©ΧΧͺ'.split('_'),
        weekdaysShort : 'ΧΧ³_ΧΧ³_ΧΧ³_ΧΧ³_ΧΧ³_ΧΧ³_Χ©Χ³'.split('_'),
        weekdaysMin : 'Χ_Χ_Χ_Χ_Χ_Χ_Χ©'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [Χ]MMMM YYYY',
            LLL : 'D [Χ]MMMM YYYY LT',
            LLLL : 'dddd, D [Χ]MMMM YYYY LT',
            l : 'D/M/YYYY',
            ll : 'D MMM YYYY',
            lll : 'D MMM YYYY LT',
            llll : 'ddd, D MMM YYYY LT'
        },
        calendar : {
            sameDay : '[ΧΧΧΧ ΧΦΎ]LT',
            nextDay : '[ΧΧΧ¨ ΧΦΎ]LT',
            nextWeek : 'dddd [ΧΧ©Χ’Χ] LT',
            lastDay : '[ΧΧͺΧΧΧ ΧΦΎ]LT',
            lastWeek : '[ΧΧΧΧ] dddd [ΧΧΧΧ¨ΧΧ ΧΧ©Χ’Χ] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'ΧΧ’ΧΧ %s',
            past : 'ΧΧ€Χ Χ %s',
            s : 'ΧΧ‘Χ€Χ¨ Χ©Χ ΧΧΧͺ',
            m : 'ΧΧ§Χ',
            mm : '%d ΧΧ§ΧΧͺ',
            h : 'Χ©Χ’Χ',
            hh : function (number) {
                if (number === 2) {
                    return 'Χ©Χ’ΧͺΧΧΧ';
                }
                return number + ' Χ©Χ’ΧΧͺ';
            },
            d : 'ΧΧΧ',
            dd : function (number) {
                if (number === 2) {
                    return 'ΧΧΧΧΧΧ';
                }
                return number + ' ΧΧΧΧ';
            },
            M : 'ΧΧΧΧ©',
            MM : function (number) {
                if (number === 2) {
                    return 'ΧΧΧΧ©ΧΧΧ';
                }
                return number + ' ΧΧΧΧ©ΧΧ';
            },
            y : 'Χ©Χ Χ',
            yy : function (number) {
                if (number === 2) {
                    return 'Χ©Χ ΧͺΧΧΧ';
                } else if (number % 10 === 0 && number !== 10) {
                    return number + ' Χ©Χ Χ';
                }
                return number + ' Χ©Χ ΧΧ';
            }
        }
    });
}));
// moment.js locale configuration
// locale : hindi (hi)
// author : Mayank Singhal : https://github.com/mayanksinghal

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'ΰ₯§',
        '2': 'ΰ₯¨',
        '3': 'ΰ₯©',
        '4': 'ΰ₯ͺ',
        '5': 'ΰ₯«',
        '6': 'ΰ₯¬',
        '7': 'ΰ₯­',
        '8': 'ΰ₯�',
        '9': 'ΰ₯―',
        '0': 'ΰ₯¦'
    },
    numberMap = {
        'ΰ₯§': '1',
        'ΰ₯¨': '2',
        'ΰ₯©': '3',
        'ΰ₯ͺ': '4',
        'ΰ₯«': '5',
        'ΰ₯¬': '6',
        'ΰ₯­': '7',
        'ΰ₯�': '8',
        'ΰ₯―': '9',
        'ΰ₯¦': '0'
    };

    return moment.defineLocale('hi', {
        months : 'ΰ€ΰ€¨ΰ€΅ΰ€°ΰ₯_ΰ€«ΰ€Όΰ€°ΰ€΅ΰ€°ΰ₯_ΰ€�ΰ€Ύΰ€°ΰ₯ΰ€_ΰ€ΰ€ͺΰ₯ΰ€°ΰ₯ΰ€²_ΰ€�ΰ€_ΰ€ΰ₯ΰ€¨_ΰ€ΰ₯ΰ€²ΰ€Ύΰ€_ΰ€ΰ€ΰ€Έΰ₯ΰ€€_ΰ€Έΰ€Ώΰ€€ΰ€�ΰ₯ΰ€¬ΰ€°_ΰ€ΰ€ΰ₯ΰ€ΰ₯ΰ€¬ΰ€°_ΰ€¨ΰ€΅ΰ€�ΰ₯ΰ€¬ΰ€°_ΰ€¦ΰ€Ώΰ€Έΰ€�ΰ₯ΰ€¬ΰ€°'.split('_'),
        monthsShort : 'ΰ€ΰ€¨._ΰ€«ΰ€Όΰ€°._ΰ€�ΰ€Ύΰ€°ΰ₯ΰ€_ΰ€ΰ€ͺΰ₯ΰ€°ΰ₯._ΰ€�ΰ€_ΰ€ΰ₯ΰ€¨_ΰ€ΰ₯ΰ€²._ΰ€ΰ€._ΰ€Έΰ€Ώΰ€€._ΰ€ΰ€ΰ₯ΰ€ΰ₯._ΰ€¨ΰ€΅._ΰ€¦ΰ€Ώΰ€Έ.'.split('_'),
        weekdays : 'ΰ€°ΰ€΅ΰ€Ώΰ€΅ΰ€Ύΰ€°_ΰ€Έΰ₯ΰ€�ΰ€΅ΰ€Ύΰ€°_ΰ€�ΰ€ΰ€ΰ€²ΰ€΅ΰ€Ύΰ€°_ΰ€¬ΰ₯ΰ€§ΰ€΅ΰ€Ύΰ€°_ΰ€ΰ₯ΰ€°ΰ₯ΰ€΅ΰ€Ύΰ€°_ΰ€Άΰ₯ΰ€ΰ₯ΰ€°ΰ€΅ΰ€Ύΰ€°_ΰ€Άΰ€¨ΰ€Ώΰ€΅ΰ€Ύΰ€°'.split('_'),
        weekdaysShort : 'ΰ€°ΰ€΅ΰ€Ώ_ΰ€Έΰ₯ΰ€�_ΰ€�ΰ€ΰ€ΰ€²_ΰ€¬ΰ₯ΰ€§_ΰ€ΰ₯ΰ€°ΰ₯_ΰ€Άΰ₯ΰ€ΰ₯ΰ€°_ΰ€Άΰ€¨ΰ€Ώ'.split('_'),
        weekdaysMin : 'ΰ€°_ΰ€Έΰ₯_ΰ€�ΰ€_ΰ€¬ΰ₯_ΰ€ΰ₯_ΰ€Άΰ₯_ΰ€Ά'.split('_'),
        longDateFormat : {
            LT : 'A h:mm ΰ€¬ΰ€ΰ₯',
            LTS : 'A h:mm:ss ΰ€¬ΰ€ΰ₯',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[ΰ€ΰ€] LT',
            nextDay : '[ΰ€ΰ€²] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[ΰ€ΰ€²] LT',
            lastWeek : '[ΰ€ͺΰ€Ώΰ€ΰ€²ΰ₯] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s ΰ€�ΰ₯ΰ€',
            past : '%s ΰ€ͺΰ€Ήΰ€²ΰ₯',
            s : 'ΰ€ΰ₯ΰ€ ΰ€Ήΰ₯ ΰ€ΰ₯ΰ€·ΰ€£',
            m : 'ΰ€ΰ€ ΰ€�ΰ€Ώΰ€¨ΰ€',
            mm : '%d ΰ€�ΰ€Ώΰ€¨ΰ€',
            h : 'ΰ€ΰ€ ΰ€ΰ€ΰ€ΰ€Ύ',
            hh : '%d ΰ€ΰ€ΰ€ΰ₯',
            d : 'ΰ€ΰ€ ΰ€¦ΰ€Ώΰ€¨',
            dd : '%d ΰ€¦ΰ€Ώΰ€¨',
            M : 'ΰ€ΰ€ ΰ€�ΰ€Ήΰ₯ΰ€¨ΰ₯',
            MM : '%d ΰ€�ΰ€Ήΰ₯ΰ€¨ΰ₯',
            y : 'ΰ€ΰ€ ΰ€΅ΰ€°ΰ₯ΰ€·',
            yy : '%d ΰ€΅ΰ€°ΰ₯ΰ€·'
        },
        preparse: function (string) {
            return string.replace(/[ΰ₯§ΰ₯¨ΰ₯©ΰ₯ͺΰ₯«ΰ₯¬ΰ₯­ΰ₯�ΰ₯―ΰ₯¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        // Hindi notation for meridiems are quite fuzzy in practice. While there exists
        // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
        meridiemParse: /ΰ€°ΰ€Ύΰ€€|ΰ€Έΰ₯ΰ€¬ΰ€Ή|ΰ€¦ΰ₯ΰ€ͺΰ€Ήΰ€°|ΰ€Άΰ€Ύΰ€�/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'ΰ€°ΰ€Ύΰ€€') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === 'ΰ€Έΰ₯ΰ€¬ΰ€Ή') {
                return hour;
            } else if (meridiem === 'ΰ€¦ΰ₯ΰ€ͺΰ€Ήΰ€°') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === 'ΰ€Άΰ€Ύΰ€�') {
                return hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'ΰ€°ΰ€Ύΰ€€';
            } else if (hour < 10) {
                return 'ΰ€Έΰ₯ΰ€¬ΰ€Ή';
            } else if (hour < 17) {
                return 'ΰ€¦ΰ₯ΰ€ͺΰ€Ήΰ€°';
            } else if (hour < 20) {
                return 'ΰ€Άΰ€Ύΰ€�';
            } else {
                return 'ΰ€°ΰ€Ύΰ€€';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : hrvatski (hr)
// author : Bojan MarkoviΔ : https://github.com/bmarkovic

// based on (sl) translation by Robert SedovΕ‘ek

(function (factory) {
    factory(moment);
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'jedna minuta' : 'jedne minute';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minuta';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'jedan sat' : 'jednog sata';
        case 'hh':
            if (number === 1) {
                result += 'sat';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'sata';
            } else {
                result += 'sati';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dana';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mjesec';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'mjeseca';
            } else {
                result += 'mjeseci';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'godina';
            } else if (number === 2 || number === 3 || number === 4) {
                result += 'godine';
            } else {
                result += 'godina';
            }
            return result;
        }
    }

    return moment.defineLocale('hr', {
        months : 'sjeΔanj_veljaΔa_oΕΎujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac'.split('_'),
        monthsShort : 'sje._vel._oΕΎu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.'.split('_'),
        weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_Δetvrtak_petak_subota'.split('_'),
        weekdaysShort : 'ned._pon._uto._sri._Δet._pet._sub.'.split('_'),
        weekdaysMin : 'ne_po_ut_sr_Δe_pe_su'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD. MM. YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[danas u] LT',
            nextDay  : '[sutra u] LT',

            nextWeek : function () {
                switch (this.day()) {
                case 0:
                    return '[u] [nedjelju] [u] LT';
                case 3:
                    return '[u] [srijedu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juΔer u] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                    return '[proΕ‘lu] dddd [u] LT';
                case 6:
                    return '[proΕ‘le] [subote] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[proΕ‘li] dddd [u] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'za %s',
            past   : 'prije %s',
            s      : 'par sekundi',
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : 'dan',
            dd     : translate,
            M      : 'mjesec',
            MM     : translate,
            y      : 'godinu',
            yy     : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : hungarian (hu)
// author : Adam Brunner : https://github.com/adambrunner

(function (factory) {
    factory(moment);
}(function (moment) {
    var weekEndings = 'vasΓ‘rnap hΓ©tfΕn kedden szerdΓ‘n csΓΌtΓΆrtΓΆkΓΆn pΓ©nteken szombaton'.split(' ');

    function translate(number, withoutSuffix, key, isFuture) {
        var num = number,
            suffix;

        switch (key) {
        case 's':
            return (isFuture || withoutSuffix) ? 'nΓ©hΓ‘ny mΓ‘sodperc' : 'nΓ©hΓ‘ny mΓ‘sodperce';
        case 'm':
            return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'mm':
            return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
        case 'h':
            return 'egy' + (isFuture || withoutSuffix ? ' Γ³ra' : ' Γ³rΓ‘ja');
        case 'hh':
            return num + (isFuture || withoutSuffix ? ' Γ³ra' : ' Γ³rΓ‘ja');
        case 'd':
            return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'dd':
            return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
        case 'M':
            return 'egy' + (isFuture || withoutSuffix ? ' hΓ³nap' : ' hΓ³napja');
        case 'MM':
            return num + (isFuture || withoutSuffix ? ' hΓ³nap' : ' hΓ³napja');
        case 'y':
            return 'egy' + (isFuture || withoutSuffix ? ' Γ©v' : ' Γ©ve');
        case 'yy':
            return num + (isFuture || withoutSuffix ? ' Γ©v' : ' Γ©ve');
        }

        return '';
    }

    function week(isFuture) {
        return (isFuture ? '' : '[mΓΊlt] ') + '[' + weekEndings[this.day()] + '] LT[-kor]';
    }

    return moment.defineLocale('hu', {
        months : 'januΓ‘r_februΓ‘r_mΓ‘rcius_Γ‘prilis_mΓ‘jus_jΓΊnius_jΓΊlius_augusztus_szeptember_oktΓ³ber_november_december'.split('_'),
        monthsShort : 'jan_feb_mΓ‘rc_Γ‘pr_mΓ‘j_jΓΊn_jΓΊl_aug_szept_okt_nov_dec'.split('_'),
        weekdays : 'vasΓ‘rnap_hΓ©tfΕ_kedd_szerda_csΓΌtΓΆrtΓΆk_pΓ©ntek_szombat'.split('_'),
        weekdaysShort : 'vas_hΓ©t_kedd_sze_csΓΌt_pΓ©n_szo'.split('_'),
        weekdaysMin : 'v_h_k_sze_cs_p_szo'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'YYYY.MM.DD.',
            LL : 'YYYY. MMMM D.',
            LLL : 'YYYY. MMMM D., LT',
            LLLL : 'YYYY. MMMM D., dddd LT'
        },
        meridiemParse: /de|du/i,
        isPM: function (input) {
            return input.charAt(1).toLowerCase() === 'u';
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 12) {
                return isLower === true ? 'de' : 'DE';
            } else {
                return isLower === true ? 'du' : 'DU';
            }
        },
        calendar : {
            sameDay : '[ma] LT[-kor]',
            nextDay : '[holnap] LT[-kor]',
            nextWeek : function () {
                return week.call(this, true);
            },
            lastDay : '[tegnap] LT[-kor]',
            lastWeek : function () {
                return week.call(this, false);
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s mΓΊlva',
            past : '%s',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Armenian (hy-am)
// author : Armendarabyan : https://github.com/armendarabyan

(function (factory) {
    factory(moment);
}(function (moment) {
    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'Υ°ΥΈΦΥΆΥΎΥ‘Φ_ΦΥ₯ΥΏΦΥΎΥ‘Φ_Υ΄Υ‘ΦΥΏ_Υ‘ΥΊΦΥ«Υ¬_Υ΄Υ‘Υ΅Υ«Υ½_Υ°ΥΈΦΥΆΥ«Υ½_Υ°ΥΈΦΥ¬Υ«Υ½_ΦΥ£ΥΈΥ½ΥΏΥΈΥ½_Υ½Υ₯ΥΊΥΏΥ₯Υ΄Υ’Υ₯Φ_Υ°ΥΈΥ―ΥΏΥ₯Υ΄Υ’Υ₯Φ_ΥΆΥΈΥ΅Υ₯Υ΄Υ’Υ₯Φ_Υ€Υ₯Υ―ΥΏΥ₯Υ΄Υ’Υ₯Φ'.split('_'),
            'accusative': 'Υ°ΥΈΦΥΆΥΎΥ‘ΦΥ«_ΦΥ₯ΥΏΦΥΎΥ‘ΦΥ«_Υ΄Υ‘ΦΥΏΥ«_Υ‘ΥΊΦΥ«Υ¬Υ«_Υ΄Υ‘Υ΅Υ«Υ½Υ«_Υ°ΥΈΦΥΆΥ«Υ½Υ«_Υ°ΥΈΦΥ¬Υ«Υ½Υ«_ΦΥ£ΥΈΥ½ΥΏΥΈΥ½Υ«_Υ½Υ₯ΥΊΥΏΥ₯Υ΄Υ’Υ₯ΦΥ«_Υ°ΥΈΥ―ΥΏΥ₯Υ΄Υ’Υ₯ΦΥ«_ΥΆΥΈΥ΅Υ₯Υ΄Υ’Υ₯ΦΥ«_Υ€Υ₯Υ―ΥΏΥ₯Υ΄Υ’Υ₯ΦΥ«'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function monthsShortCaseReplace(m, format) {
        var monthsShort = 'Υ°ΥΆΥΎ_ΦΥΏΦ_Υ΄ΦΥΏ_Υ‘ΥΊΦ_Υ΄Υ΅Υ½_Υ°ΥΆΥ½_Υ°Υ¬Υ½_ΦΥ£Υ½_Υ½ΥΊΥΏ_Υ°Υ―ΥΏ_ΥΆΥ΄Υ’_Υ€Υ―ΥΏ'.split('_');

        return monthsShort[m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = 'Υ―Υ«ΦΥ‘Υ―Υ«_Υ₯ΦΥ―ΥΈΦΥ·Υ‘Υ’Υ©Υ«_Υ₯ΦΥ₯ΦΥ·Υ‘Υ’Υ©Υ«_ΥΉΥΈΦΥ₯ΦΥ·Υ‘Υ’Υ©Υ«_Υ°Υ«ΥΆΥ£Υ·Υ‘Υ’Υ©Υ«_ΥΈΦΦΥ’Υ‘Υ©_Υ·Υ‘Υ’Υ‘Υ©'.split('_');

        return weekdays[m.day()];
    }

    return moment.defineLocale('hy-am', {
        months : monthsCaseReplace,
        monthsShort : monthsShortCaseReplace,
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'Υ―ΦΥ―_Υ₯ΦΥ―_Υ₯ΦΦ_ΥΉΦΦ_Υ°ΥΆΥ£_ΥΈΦΦΥ’_Υ·Υ’Υ©'.split('_'),
        weekdaysMin : 'Υ―ΦΥ―_Υ₯ΦΥ―_Υ₯ΦΦ_ΥΉΦΦ_Υ°ΥΆΥ£_ΥΈΦΦΥ’_Υ·Υ’Υ©'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY Υ©.',
            LLL : 'D MMMM YYYY Υ©., LT',
            LLLL : 'dddd, D MMMM YYYY Υ©., LT'
        },
        calendar : {
            sameDay: '[Υ‘Υ΅Υ½ΦΦ] LT',
            nextDay: '[ΥΎΥ‘Υ²Υ¨] LT',
            lastDay: '[Υ₯ΦΥ₯Υ―] LT',
            nextWeek: function () {
                return 'dddd [ΦΦΥ¨ ΥͺΥ‘Υ΄Υ¨] LT';
            },
            lastWeek: function () {
                return '[Υ‘ΥΆΦΥ‘Υ�] dddd [ΦΦΥ¨ ΥͺΥ‘Υ΄Υ¨] LT';
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : '%s Υ°Υ₯ΥΏΥΈ',
            past : '%s Υ‘ΥΌΥ‘Υ»',
            s : 'Υ΄Υ« ΦΥ‘ΥΆΥ« ΥΎΥ‘Υ΅ΦΥ―Υ΅Υ‘ΥΆ',
            m : 'ΦΥΈΥΊΥ₯',
            mm : '%d ΦΥΈΥΊΥ₯',
            h : 'ΥͺΥ‘Υ΄',
            hh : '%d ΥͺΥ‘Υ΄',
            d : 'ΦΦ',
            dd : '%d ΦΦ',
            M : 'Υ‘Υ΄Υ«Υ½',
            MM : '%d Υ‘Υ΄Υ«Υ½',
            y : 'ΥΏΥ‘ΦΥ«',
            yy : '%d ΥΏΥ‘ΦΥ«'
        },

        meridiemParse: /Υ£Υ«Υ·Υ₯ΦΥΎΥ‘|Υ‘ΥΌΥ‘ΥΎΥΈΥΏΥΎΥ‘|ΦΥ₯ΦΥ₯Υ―ΥΎΥ‘|Υ₯ΦΥ₯Υ―ΥΈΥ΅Υ‘ΥΆ/,
        isPM: function (input) {
            return /^(ΦΥ₯ΦΥ₯Υ―ΥΎΥ‘|Υ₯ΦΥ₯Υ―ΥΈΥ΅Υ‘ΥΆ)$/.test(input);
        },
        meridiem : function (hour) {
            if (hour < 4) {
                return 'Υ£Υ«Υ·Υ₯ΦΥΎΥ‘';
            } else if (hour < 12) {
                return 'Υ‘ΥΌΥ‘ΥΎΥΈΥΏΥΎΥ‘';
            } else if (hour < 17) {
                return 'ΦΥ₯ΦΥ₯Υ―ΥΎΥ‘';
            } else {
                return 'Υ₯ΦΥ₯Υ―ΥΈΥ΅Υ‘ΥΆ';
            }
        },

        ordinalParse: /\d{1,2}|\d{1,2}-(Υ«ΥΆ|ΦΥ€)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'DDD':
            case 'w':
            case 'W':
            case 'DDDo':
                if (number === 1) {
                    return number + '-Υ«ΥΆ';
                }
                return number + '-ΦΥ€';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Bahasa Indonesia (id)
// author : Mohammad Satrio Utomo : https://github.com/tyok
// reference: http://id.wikisource.org/wiki/Pedoman_Umum_Ejaan_Bahasa_Indonesia_yang_Disempurnakan

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('id', {
        months : 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember'.split('_'),
        monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des'.split('_'),
        weekdays : 'Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu'.split('_'),
        weekdaysShort : 'Min_Sen_Sel_Rab_Kam_Jum_Sab'.split('_'),
        weekdaysMin : 'Mg_Sn_Sl_Rb_Km_Jm_Sb'.split('_'),
        longDateFormat : {
            LT : 'HH.mm',
            LTS : 'LT.ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY [pukul] LT',
            LLLL : 'dddd, D MMMM YYYY [pukul] LT'
        },
        meridiemParse: /pagi|siang|sore|malam/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'pagi') {
                return hour;
            } else if (meridiem === 'siang') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'sore' || meridiem === 'malam') {
                return hour + 12;
            }
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'siang';
            } else if (hours < 19) {
                return 'sore';
            } else {
                return 'malam';
            }
        },
        calendar : {
            sameDay : '[Hari ini pukul] LT',
            nextDay : '[Besok pukul] LT',
            nextWeek : 'dddd [pukul] LT',
            lastDay : '[Kemarin pukul] LT',
            lastWeek : 'dddd [lalu pukul] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'dalam %s',
            past : '%s yang lalu',
            s : 'beberapa detik',
            m : 'semenit',
            mm : '%d menit',
            h : 'sejam',
            hh : '%d jam',
            d : 'sehari',
            dd : '%d hari',
            M : 'sebulan',
            MM : '%d bulan',
            y : 'setahun',
            yy : '%d tahun'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : icelandic (is)
// author : Hinrik Γrn SigurΓ°sson : https://github.com/hinrik

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(n) {
        if (n % 100 === 11) {
            return true;
        } else if (n % 10 === 1) {
            return false;
        }
        return true;
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
        case 's':
            return withoutSuffix || isFuture ? 'nokkrar sekΓΊndur' : 'nokkrum sekΓΊndum';
        case 'm':
            return withoutSuffix ? 'mΓ­nΓΊta' : 'mΓ­nΓΊtu';
        case 'mm':
            if (plural(number)) {
                return result + (withoutSuffix || isFuture ? 'mΓ­nΓΊtur' : 'mΓ­nΓΊtum');
            } else if (withoutSuffix) {
                return result + 'mΓ­nΓΊta';
            }
            return result + 'mΓ­nΓΊtu';
        case 'hh':
            if (plural(number)) {
                return result + (withoutSuffix || isFuture ? 'klukkustundir' : 'klukkustundum');
            }
            return result + 'klukkustund';
        case 'd':
            if (withoutSuffix) {
                return 'dagur';
            }
            return isFuture ? 'dag' : 'degi';
        case 'dd':
            if (plural(number)) {
                if (withoutSuffix) {
                    return result + 'dagar';
                }
                return result + (isFuture ? 'daga' : 'dΓΆgum');
            } else if (withoutSuffix) {
                return result + 'dagur';
            }
            return result + (isFuture ? 'dag' : 'degi');
        case 'M':
            if (withoutSuffix) {
                return 'mΓ‘nuΓ°ur';
            }
            return isFuture ? 'mΓ‘nuΓ°' : 'mΓ‘nuΓ°i';
        case 'MM':
            if (plural(number)) {
                if (withoutSuffix) {
                    return result + 'mΓ‘nuΓ°ir';
                }
                return result + (isFuture ? 'mΓ‘nuΓ°i' : 'mΓ‘nuΓ°um');
            } else if (withoutSuffix) {
                return result + 'mΓ‘nuΓ°ur';
            }
            return result + (isFuture ? 'mΓ‘nuΓ°' : 'mΓ‘nuΓ°i');
        case 'y':
            return withoutSuffix || isFuture ? 'Γ‘r' : 'Γ‘ri';
        case 'yy':
            if (plural(number)) {
                return result + (withoutSuffix || isFuture ? 'Γ‘r' : 'Γ‘rum');
            }
            return result + (withoutSuffix || isFuture ? 'Γ‘r' : 'Γ‘ri');
        }
    }

    return moment.defineLocale('is', {
        months : 'janΓΊar_febrΓΊar_mars_aprΓ­l_maΓ­_jΓΊnΓ­_jΓΊlΓ­_Γ‘gΓΊst_september_oktΓ³ber_nΓ³vember_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maΓ­_jΓΊn_jΓΊl_Γ‘gΓΊ_sep_okt_nΓ³v_des'.split('_'),
        weekdays : 'sunnudagur_mΓ‘nudagur_ΓΎriΓ°judagur_miΓ°vikudagur_fimmtudagur_fΓΆstudagur_laugardagur'.split('_'),
        weekdaysShort : 'sun_mΓ‘n_ΓΎri_miΓ°_fim_fΓΆs_lau'.split('_'),
        weekdaysMin : 'Su_MΓ‘_Γr_Mi_Fi_FΓΆ_La'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY [kl.] LT',
            LLLL : 'dddd, D. MMMM YYYY [kl.] LT'
        },
        calendar : {
            sameDay : '[Γ­ dag kl.] LT',
            nextDay : '[Γ‘ morgun kl.] LT',
            nextWeek : 'dddd [kl.] LT',
            lastDay : '[Γ­ gΓ¦r kl.] LT',
            lastWeek : '[sΓ­Γ°asta] dddd [kl.] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'eftir %s',
            past : 'fyrir %s sΓ­Γ°an',
            s : translate,
            m : translate,
            mm : translate,
            h : 'klukkustund',
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : italian (it)
// author : Lorenzo : https://github.com/aliem
// author: Mattia Larentis: https://github.com/nostalgiaz

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('it', {
        months : 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split('_'),
        monthsShort : 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
        weekdays : 'Domenica_LunedΓ¬_MartedΓ¬_MercoledΓ¬_GiovedΓ¬_VenerdΓ¬_Sabato'.split('_'),
        weekdaysShort : 'Dom_Lun_Mar_Mer_Gio_Ven_Sab'.split('_'),
        weekdaysMin : 'D_L_Ma_Me_G_V_S'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Oggi alle] LT',
            nextDay: '[Domani alle] LT',
            nextWeek: 'dddd [alle] LT',
            lastDay: '[Ieri alle] LT',
            lastWeek: function () {
                switch (this.day()) {
                    case 0:
                        return '[la scorsa] dddd [alle] LT';
                    default:
                        return '[lo scorso] dddd [alle] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : function (s) {
                return ((/^[0-9].+$/).test(s) ? 'tra' : 'in') + ' ' + s;
            },
            past : '%s fa',
            s : 'alcuni secondi',
            m : 'un minuto',
            mm : '%d minuti',
            h : 'un\'ora',
            hh : '%d ore',
            d : 'un giorno',
            dd : '%d giorni',
            M : 'un mese',
            MM : '%d mesi',
            y : 'un anno',
            yy : '%d anni'
        },
        ordinalParse : /\d{1,2}ΒΊ/,
        ordinal: '%dΒΊ',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : japanese (ja)
// author : LI Long : https://github.com/baryon

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ja', {
        months : '1ζ_2ζ_3ζ_4ζ_5ζ_6ζ_7ζ_8ζ_9ζ_10ζ_11ζ_12ζ'.split('_'),
        monthsShort : '1ζ_2ζ_3ζ_4ζ_5ζ_6ζ_7ζ_8ζ_9ζ_10ζ_11ζ_12ζ'.split('_'),
        weekdays : 'ζ₯ζζ₯_ζζζ₯_η«ζζ₯_ζ°΄ζζ₯_ζ¨ζζ₯_ιζζ₯_εζζ₯'.split('_'),
        weekdaysShort : 'ζ₯_ζ_η«_ζ°΄_ζ¨_ι_ε'.split('_'),
        weekdaysMin : 'ζ₯_ζ_η«_ζ°΄_ζ¨_ι_ε'.split('_'),
        longDateFormat : {
            LT : 'Ahζmε',
            LTS : 'LTsη§',
            L : 'YYYY/MM/DD',
            LL : 'YYYYεΉ΄MζDζ₯',
            LLL : 'YYYYεΉ΄MζDζ₯LT',
            LLLL : 'YYYYεΉ΄MζDζ₯LT dddd'
        },
        meridiemParse: /εε|εεΎ/i,
        isPM : function (input) {
            return input === 'εεΎ';
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'εε';
            } else {
                return 'εεΎ';
            }
        },
        calendar : {
            sameDay : '[δ»ζ₯] LT',
            nextDay : '[ζζ₯] LT',
            nextWeek : '[ζ₯ι±]dddd LT',
            lastDay : '[ζ¨ζ₯] LT',
            lastWeek : '[ει±]dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%sεΎ',
            past : '%sε',
            s : 'ζ°η§',
            m : '1ε',
            mm : '%dε',
            h : '1ζι',
            hh : '%dζι',
            d : '1ζ₯',
            dd : '%dζ₯',
            M : '1γΆζ',
            MM : '%dγΆζ',
            y : '1εΉ΄',
            yy : '%dεΉ΄'
        }
    });
}));
// moment.js locale configuration
// locale : Georgian (ka)
// author : Irakli Janiashvili : https://github.com/irakli-janiashvili

(function (factory) {
    factory(moment);
}(function (moment) {
    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'αααααα α_ααααα αααα_ααα α’α_ααα ααα_αααα‘α_ααααα‘α_ααααα‘α_ααααα‘α’α_α‘αα₯α’ααααα α_αα₯α’ααααα α_ααααααα α_αααααααα α'.split('_'),
            'accusative': 'αααααα α‘_ααααα αααα‘_ααα α’α‘_ααα αααα‘_αααα‘α‘_ααααα‘α‘_ααααα‘α‘_ααααα‘α’α‘_α‘αα₯α’ααααα α‘_αα₯α’ααααα α‘_ααααααα α‘_αααααααα α‘'.split('_')
        },

        nounCase = (/D[oD] *MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'αααα α_αα α¨ααααα_α‘ααα¨ααααα_ααα�α¨ααααα_α�α£αα¨ααααα_ααα αα‘αααα_α¨ααααα'.split('_'),
            'accusative': 'αααα αα‘_αα α¨ααααα‘_α‘ααα¨ααααα‘_ααα�α¨ααααα‘_α�α£αα¨ααααα‘_ααα αα‘αααα‘_α¨ααααα‘'.split('_')
        },

        nounCase = (/(α¬ααα|α¨ααααα)/).test(format) ?
            'accusative' :
            'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.defineLocale('ka', {
        months : monthsCaseReplace,
        monthsShort : 'ααα_ααα_ααα _ααα _ααα_ααα_ααα_ααα_α‘αα₯_αα₯α’_ααα_ααα'.split('_'),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'ααα_αα α¨_α‘αα_ααα�_α�α£α_ααα _α¨αα'.split('_'),
        weekdaysMin : 'αα_αα _α‘α_αα_α�α£_αα_α¨α'.split('_'),
        longDateFormat : {
            LT : 'h:mm A',
            LTS : 'h:mm:ss A',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[αα¦αα‘] LT[-αα]',
            nextDay : '[α�ααα] LT[-αα]',
            lastDay : '[αα£α¨αα] LT[-αα]',
            nextWeek : '[α¨ααααα] dddd LT[-αα]',
            lastWeek : '[α¬ααα] dddd LT-αα',
            sameElse : 'L'
        },
        relativeTime : {
            future : function (s) {
                return (/(α¬ααα|α¬α£αα|α‘αααα|α¬ααα)/).test(s) ?
                    s.replace(/α$/, 'α¨α') :
                    s + 'α¨α';
            },
            past : function (s) {
                if ((/(α¬ααα|α¬α£αα|α‘αααα|αα¦α|ααα)/).test(s)) {
                    return s.replace(/(α|α)$/, 'αα‘ α¬αα');
                }
                if ((/α¬ααα/).test(s)) {
                    return s.replace(/α¬ααα$/, 'α¬ααα‘ α¬αα');
                }
            },
            s : 'α αααααααα α¬ααα',
            m : 'α¬α£αα',
            mm : '%d α¬α£αα',
            h : 'α‘αααα',
            hh : '%d α‘αααα',
            d : 'αα¦α',
            dd : '%d αα¦α',
            M : 'ααα',
            MM : '%d ααα',
            y : 'α¬ααα',
            yy : '%d α¬ααα'
        },
        ordinalParse: /0|1-αα|αα-\d{1,2}|\d{1,2}-α/,
        ordinal : function (number) {
            if (number === 0) {
                return number;
            }

            if (number === 1) {
                return number + '-αα';
            }

            if ((number < 20) || (number <= 100 && (number % 20 === 0)) || (number % 100 === 0)) {
                return 'αα-' + number;
            }

            return number + '-α';
        },
        week : {
            dow : 1,
            doy : 7
        }
    });
}));
// moment.js locale configuration
// locale : khmer (km)
// author : Kruy Vanna : https://github.com/kruyvanna

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('km', {
        months: 'ααααΆ_αα»αααα_αα·ααΆ_ααααΆ_α§αααΆ_αα·αα»ααΆ_ααααααΆ_ααΈα αΆ_αααααΆ_αα»ααΆ_αα·αααα·ααΆ_ααααΌ'.split('_'),
        monthsShort: 'ααααΆ_αα»αααα_αα·ααΆ_ααααΆ_α§αααΆ_αα·αα»ααΆ_ααααααΆ_ααΈα αΆ_αααααΆ_αα»ααΆ_αα·αααα·ααΆ_ααααΌ'.split('_'),
        weekdays: 'α’αΆαα·ααα_ααααα_α’ααααΆα_αα»α_αααα ααααα·α_αα»ααα_αααα'.split('_'),
        weekdaysShort: 'α’αΆαα·ααα_ααααα_α’ααααΆα_αα»α_αααα ααααα·α_αα»ααα_αααα'.split('_'),
        weekdaysMin: 'α’αΆαα·ααα_ααααα_α’ααααΆα_αα»α_αααα ααααα·α_αα»ααα_αααα'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS : 'LT:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd, D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[αααααα αααα] LT',
            nextDay: '[ααα’αα αααα] LT',
            nextWeek: 'dddd [αααα] LT',
            lastDay: '[αααα·ααα·α αααα] LT',
            lastWeek: 'dddd [αααααΆα ααα»α] [αααα] LT',
            sameElse: 'L'
        },
        relativeTime: {
            future: '%sααα',
            past: '%sαα»α',
            s: 'ααα»ααααΆααα·ααΆααΈ',
            m: 'αα½αααΆααΈ',
            mm: '%d ααΆααΈ',
            h: 'αα½ααααα',
            hh: '%d αααα',
            d: 'αα½ααααα',
            dd: '%d αααα',
            M: 'αα½ααα',
            MM: '%d αα',
            y: 'αα½αααααΆα',
            yy: '%d ααααΆα'
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4 // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : korean (ko)
//
// authors
//
// - Kyungwook, Park : https://github.com/kyungw00k
// - Jeeeyul Lee <jeeeyul@gmail.com>
(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ko', {
        months : '1μ_2μ_3μ_4μ_5μ_6μ_7μ_8μ_9μ_10μ_11μ_12μ'.split('_'),
        monthsShort : '1μ_2μ_3μ_4μ_5μ_6μ_7μ_8μ_9μ_10μ_11μ_12μ'.split('_'),
        weekdays : 'μΌμμΌ_μμμΌ_νμμΌ_μμμΌ_λͺ©μμΌ_κΈμμΌ_ν μμΌ'.split('_'),
        weekdaysShort : 'μΌ_μ_ν_μ_λͺ©_κΈ_ν '.split('_'),
        weekdaysMin : 'μΌ_μ_ν_μ_λͺ©_κΈ_ν '.split('_'),
        longDateFormat : {
            LT : 'A hμ mλΆ',
            LTS : 'A hμ mλΆ sμ΄',
            L : 'YYYY.MM.DD',
            LL : 'YYYYλ MMMM DμΌ',
            LLL : 'YYYYλ MMMM DμΌ LT',
            LLLL : 'YYYYλ MMMM DμΌ dddd LT'
        },
        calendar : {
            sameDay : 'μ€λ LT',
            nextDay : 'λ΄μΌ LT',
            nextWeek : 'dddd LT',
            lastDay : 'μ΄μ  LT',
            lastWeek : 'μ§λμ£Ό dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s ν',
            past : '%s μ ',
            s : 'λͺμ΄',
            ss : '%dμ΄',
            m : 'μΌλΆ',
            mm : '%dλΆ',
            h : 'νμκ°',
            hh : '%dμκ°',
            d : 'νλ£¨',
            dd : '%dμΌ',
            M : 'νλ¬',
            MM : '%dλ¬',
            y : 'μΌλ',
            yy : '%dλ'
        },
        ordinalParse : /\d{1,2}μΌ/,
        ordinal : '%dμΌ',
        meridiemParse : /μ€μ |μ€ν/,
        isPM : function (token) {
            return token === 'μ€ν';
        },
        meridiem : function (hour, minute, isUpper) {
            return hour < 12 ? 'μ€μ ' : 'μ€ν';
        }
    });
}));
// moment.js locale configuration
// locale : Luxembourgish (lb)
// author : mweimerskirch : https://github.com/mweimerskirch, David Raison : https://github.com/kwisatz

// Note: Luxembourgish has a very particular phonological rule ('Eifeler Regel') that causes the
// deletion of the final 'n' in certain contexts. That's what the 'eifelerRegelAppliesToWeekday'
// and 'eifelerRegelAppliesToNumber' methods are meant for

(function (factory) {
    factory(moment);
}(function (moment) {
    function processRelativeTime(number, withoutSuffix, key, isFuture) {
        var format = {
            'm': ['eng Minutt', 'enger Minutt'],
            'h': ['eng Stonn', 'enger Stonn'],
            'd': ['een Dag', 'engem Dag'],
            'M': ['ee Mount', 'engem Mount'],
            'y': ['ee Joer', 'engem Joer']
        };
        return withoutSuffix ? format[key][0] : format[key][1];
    }

    function processFutureTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return 'a ' + string;
        }
        return 'an ' + string;
    }

    function processPastTime(string) {
        var number = string.substr(0, string.indexOf(' '));
        if (eifelerRegelAppliesToNumber(number)) {
            return 'viru ' + string;
        }
        return 'virun ' + string;
    }

    /**
     * Returns true if the word before the given number loses the '-n' ending.
     * e.g. 'an 10 Deeg' but 'a 5 Deeg'
     *
     * @param number {integer}
     * @returns {boolean}
     */
    function eifelerRegelAppliesToNumber(number) {
        number = parseInt(number, 10);
        if (isNaN(number)) {
            return false;
        }
        if (number < 0) {
            // Negative Number --> always true
            return true;
        } else if (number < 10) {
            // Only 1 digit
            if (4 <= number && number <= 7) {
                return true;
            }
            return false;
        } else if (number < 100) {
            // 2 digits
            var lastDigit = number % 10, firstDigit = number / 10;
            if (lastDigit === 0) {
                return eifelerRegelAppliesToNumber(firstDigit);
            }
            return eifelerRegelAppliesToNumber(lastDigit);
        } else if (number < 10000) {
            // 3 or 4 digits --> recursively check first digit
            while (number >= 10) {
                number = number / 10;
            }
            return eifelerRegelAppliesToNumber(number);
        } else {
            // Anything larger than 4 digits: recursively check first n-3 digits
            number = number / 1000;
            return eifelerRegelAppliesToNumber(number);
        }
    }

    return moment.defineLocale('lb', {
        months: 'Januar_Februar_MΓ€erz_AbrΓ«ll_Mee_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
        monthsShort: 'Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
        weekdays: 'Sonndeg_MΓ©indeg_DΓ«nschdeg_MΓ«ttwoch_Donneschdeg_Freideg_Samschdeg'.split('_'),
        weekdaysShort: 'So._MΓ©._DΓ«._MΓ«._Do._Fr._Sa.'.split('_'),
        weekdaysMin: 'So_MΓ©_DΓ«_MΓ«_Do_Fr_Sa'.split('_'),
        longDateFormat: {
            LT: 'H:mm [Auer]',
            LTS: 'H:mm:ss [Auer]',
            L: 'DD.MM.YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY LT',
            LLLL: 'dddd, D. MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Haut um] LT',
            sameElse: 'L',
            nextDay: '[Muer um] LT',
            nextWeek: 'dddd [um] LT',
            lastDay: '[GΓ«schter um] LT',
            lastWeek: function () {
                // Different date string for 'DΓ«nschdeg' (Tuesday) and 'Donneschdeg' (Thursday) due to phonological rule
                switch (this.day()) {
                    case 2:
                    case 4:
                        return '[Leschten] dddd [um] LT';
                    default:
                        return '[Leschte] dddd [um] LT';
                }
            }
        },
        relativeTime : {
            future : processFutureTime,
            past : processPastTime,
            s : 'e puer Sekonnen',
            m : processRelativeTime,
            mm : '%d Minutten',
            h : processRelativeTime,
            hh : '%d Stonnen',
            d : processRelativeTime,
            dd : '%d Deeg',
            M : processRelativeTime,
            MM : '%d MΓ©int',
            y : processRelativeTime,
            yy : '%d Joer'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal: '%d.',
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Lithuanian (lt)
// author : Mindaugas MozΕ«ras : https://github.com/mmozuras

(function (factory) {
    factory(moment);
}(function (moment) {
    var units = {
        'm' : 'minutΔ_minutΔs_minutΔ',
        'mm': 'minutΔs_minuΔiΕ³_minutes',
        'h' : 'valanda_valandos_valandΔ',
        'hh': 'valandos_valandΕ³_valandas',
        'd' : 'diena_dienos_dienΔ',
        'dd': 'dienos_dienΕ³_dienas',
        'M' : 'mΔnuo_mΔnesio_mΔnesΔ―',
        'MM': 'mΔnesiai_mΔnesiΕ³_mΔnesius',
        'y' : 'metai_metΕ³_metus',
        'yy': 'metai_metΕ³_metus'
    },
    weekDays = 'sekmadienis_pirmadienis_antradienis_treΔiadienis_ketvirtadienis_penktadienis_Ε‘eΕ‘tadienis'.split('_');

    function translateSeconds(number, withoutSuffix, key, isFuture) {
        if (withoutSuffix) {
            return 'kelios sekundΔs';
        } else {
            return isFuture ? 'keliΕ³ sekundΕΎiΕ³' : 'kelias sekundes';
        }
    }

    function translateSingular(number, withoutSuffix, key, isFuture) {
        return withoutSuffix ? forms(key)[0] : (isFuture ? forms(key)[1] : forms(key)[2]);
    }

    function special(number) {
        return number % 10 === 0 || (number > 10 && number < 20);
    }

    function forms(key) {
        return units[key].split('_');
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        if (number === 1) {
            return result + translateSingular(number, withoutSuffix, key[0], isFuture);
        } else if (withoutSuffix) {
            return result + (special(number) ? forms(key)[1] : forms(key)[0]);
        } else {
            if (isFuture) {
                return result + forms(key)[1];
            } else {
                return result + (special(number) ? forms(key)[1] : forms(key)[2]);
            }
        }
    }

    function relativeWeekDay(moment, format) {
        var nominative = format.indexOf('dddd HH:mm') === -1,
            weekDay = weekDays[moment.day()];

        return nominative ? weekDay : weekDay.substring(0, weekDay.length - 2) + 'Δ―';
    }

    return moment.defineLocale('lt', {
        months : 'sausio_vasario_kovo_balandΕΎio_geguΕΎΔs_birΕΎelio_liepos_rugpjΕ«Δio_rugsΔjo_spalio_lapkriΔio_gruodΕΎio'.split('_'),
        monthsShort : 'sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd'.split('_'),
        weekdays : relativeWeekDay,
        weekdaysShort : 'Sek_Pir_Ant_Tre_Ket_Pen_Ε eΕ‘'.split('_'),
        weekdaysMin : 'S_P_A_T_K_Pn_Ε '.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'YYYY [m.] MMMM D [d.]',
            LLL : 'YYYY [m.] MMMM D [d.], LT [val.]',
            LLLL : 'YYYY [m.] MMMM D [d.], dddd, LT [val.]',
            l : 'YYYY-MM-DD',
            ll : 'YYYY [m.] MMMM D [d.]',
            lll : 'YYYY [m.] MMMM D [d.], LT [val.]',
            llll : 'YYYY [m.] MMMM D [d.], ddd, LT [val.]'
        },
        calendar : {
            sameDay : '[Ε iandien] LT',
            nextDay : '[Rytoj] LT',
            nextWeek : 'dddd LT',
            lastDay : '[Vakar] LT',
            lastWeek : '[PraΔjusΔ―] dddd LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'po %s',
            past : 'prieΕ‘ %s',
            s : translateSeconds,
            m : translateSingular,
            mm : translate,
            h : translateSingular,
            hh : translate,
            d : translateSingular,
            dd : translate,
            M : translateSingular,
            MM : translate,
            y : translateSingular,
            yy : translate
        },
        ordinalParse: /\d{1,2}-oji/,
        ordinal : function (number) {
            return number + '-oji';
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : latvian (lv)
// author : Kristaps Karlsons : https://github.com/skakri

(function (factory) {
    factory(moment);
}(function (moment) {
    var units = {
        'mm': 'minΕ«ti_minΕ«tes_minΕ«te_minΕ«tes',
        'hh': 'stundu_stundas_stunda_stundas',
        'dd': 'dienu_dienas_diena_dienas',
        'MM': 'mΔnesi_mΔneΕ‘us_mΔnesis_mΔneΕ‘i',
        'yy': 'gadu_gadus_gads_gadi'
    };

    function format(word, number, withoutSuffix) {
        var forms = word.split('_');
        if (withoutSuffix) {
            return number % 10 === 1 && number !== 11 ? forms[2] : forms[3];
        } else {
            return number % 10 === 1 && number !== 11 ? forms[0] : forms[1];
        }
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        return number + ' ' + format(units[key], number, withoutSuffix);
    }

    return moment.defineLocale('lv', {
        months : 'janvΔris_februΔris_marts_aprΔ«lis_maijs_jΕ«nijs_jΕ«lijs_augusts_septembris_oktobris_novembris_decembris'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jΕ«n_jΕ«l_aug_sep_okt_nov_dec'.split('_'),
        weekdays : 'svΔtdiena_pirmdiena_otrdiena_treΕ‘diena_ceturtdiena_piektdiena_sestdiena'.split('_'),
        weekdaysShort : 'Sv_P_O_T_C_Pk_S'.split('_'),
        weekdaysMin : 'Sv_P_O_T_C_Pk_S'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'YYYY. [gada] D. MMMM',
            LLL : 'YYYY. [gada] D. MMMM, LT',
            LLLL : 'YYYY. [gada] D. MMMM, dddd, LT'
        },
        calendar : {
            sameDay : '[Ε odien pulksten] LT',
            nextDay : '[RΔ«t pulksten] LT',
            nextWeek : 'dddd [pulksten] LT',
            lastDay : '[Vakar pulksten] LT',
            lastWeek : '[PagΔjuΕ‘Δ] dddd [pulksten] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s vΔlΔk',
            past : '%s agrΔk',
            s : 'daΕΎas sekundes',
            m : 'minΕ«ti',
            mm : relativeTimeWithPlural,
            h : 'stundu',
            hh : relativeTimeWithPlural,
            d : 'dienu',
            dd : relativeTimeWithPlural,
            M : 'mΔnesi',
            MM : relativeTimeWithPlural,
            y : 'gadu',
            yy : relativeTimeWithPlural
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : macedonian (mk)
// author : Borislav Mickov : https://github.com/B0k0

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('mk', {
        months : 'ΡΠ°Π½ΡΠ°ΡΠΈ_ΡΠ΅Π²ΡΡΠ°ΡΠΈ_ΠΌΠ°ΡΡ_Π°ΠΏΡΠΈΠ»_ΠΌΠ°Ρ_ΡΡΠ½ΠΈ_ΡΡΠ»ΠΈ_Π°Π²Π³ΡΡΡ_ΡΠ΅ΠΏΡΠ΅ΠΌΠ²ΡΠΈ_ΠΎΠΊΡΠΎΠΌΠ²ΡΠΈ_Π½ΠΎΠ΅ΠΌΠ²ΡΠΈ_Π΄Π΅ΠΊΠ΅ΠΌΠ²ΡΠΈ'.split('_'),
        monthsShort : 'ΡΠ°Π½_ΡΠ΅Π²_ΠΌΠ°Ρ_Π°ΠΏΡ_ΠΌΠ°Ρ_ΡΡΠ½_ΡΡΠ»_Π°Π²Π³_ΡΠ΅ΠΏ_ΠΎΠΊΡ_Π½ΠΎΠ΅_Π΄Π΅ΠΊ'.split('_'),
        weekdays : 'Π½Π΅Π΄Π΅Π»Π°_ΠΏΠΎΠ½Π΅Π΄Π΅Π»Π½ΠΈΠΊ_Π²ΡΠΎΡΠ½ΠΈΠΊ_ΡΡΠ΅Π΄Π°_ΡΠ΅ΡΠ²ΡΡΠΎΠΊ_ΠΏΠ΅ΡΠΎΠΊ_ΡΠ°Π±ΠΎΡΠ°'.split('_'),
        weekdaysShort : 'Π½Π΅Π΄_ΠΏΠΎΠ½_Π²ΡΠΎ_ΡΡΠ΅_ΡΠ΅Ρ_ΠΏΠ΅Ρ_ΡΠ°Π±'.split('_'),
        weekdaysMin : 'Π½e_ΠΏo_Π²Ρ_ΡΡ_ΡΠ΅_ΠΏΠ΅_Ρa'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'D.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[ΠΠ΅Π½Π΅Ρ Π²ΠΎ] LT',
            nextDay : '[Π£ΡΡΠ΅ Π²ΠΎ] LT',
            nextWeek : 'dddd [Π²ΠΎ] LT',
            lastDay : '[ΠΡΠ΅ΡΠ° Π²ΠΎ] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[ΠΠΎ ΠΈΠ·ΠΌΠΈΠ½Π°ΡΠ°ΡΠ°] dddd [Π²ΠΎ] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[ΠΠΎ ΠΈΠ·ΠΌΠΈΠ½Π°ΡΠΈΠΎΡ] dddd [Π²ΠΎ] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'ΠΏΠΎΡΠ»Π΅ %s',
            past : 'ΠΏΡΠ΅Π΄ %s',
            s : 'Π½Π΅ΠΊΠΎΠ»ΠΊΡ ΡΠ΅ΠΊΡΠ½Π΄ΠΈ',
            m : 'ΠΌΠΈΠ½ΡΡΠ°',
            mm : '%d ΠΌΠΈΠ½ΡΡΠΈ',
            h : 'ΡΠ°Ρ',
            hh : '%d ΡΠ°ΡΠ°',
            d : 'Π΄Π΅Π½',
            dd : '%d Π΄Π΅Π½Π°',
            M : 'ΠΌΠ΅ΡΠ΅Ρ',
            MM : '%d ΠΌΠ΅ΡΠ΅ΡΠΈ',
            y : 'Π³ΠΎΠ΄ΠΈΠ½Π°',
            yy : '%d Π³ΠΎΠ΄ΠΈΠ½ΠΈ'
        },
        ordinalParse: /\d{1,2}-(Π΅Π²|Π΅Π½|ΡΠΈ|Π²ΠΈ|ΡΠΈ|ΠΌΠΈ)/,
        ordinal : function (number) {
            var lastDigit = number % 10,
                last2Digits = number % 100;
            if (number === 0) {
                return number + '-Π΅Π²';
            } else if (last2Digits === 0) {
                return number + '-Π΅Π½';
            } else if (last2Digits > 10 && last2Digits < 20) {
                return number + '-ΡΠΈ';
            } else if (lastDigit === 1) {
                return number + '-Π²ΠΈ';
            } else if (lastDigit === 2) {
                return number + '-ΡΠΈ';
            } else if (lastDigit === 7 || lastDigit === 8) {
                return number + '-ΠΌΠΈ';
            } else {
                return number + '-ΡΠΈ';
            }
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : malayalam (ml)
// author : Floyd Pink : https://github.com/floydpink

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ml', {
        months : 'ΰ΄ΰ΄¨ΰ΅ΰ΄΅ΰ΄°ΰ΄Ώ_ΰ΄«ΰ΅ΰ΄¬ΰ΅ΰ΄°ΰ΅ΰ΄΅ΰ΄°ΰ΄Ώ_ΰ΄�ΰ΄Ύΰ΅Όΰ΄ΰ΅ΰ΄ΰ΅_ΰ΄ΰ΄ͺΰ΅ΰ΄°ΰ΄Ώΰ΅½_ΰ΄�ΰ΅ΰ΄―ΰ΅_ΰ΄ΰ΅ΰ΅Ί_ΰ΄ΰ΅ΰ΄²ΰ΅_ΰ΄ΰ΄ΰ΄Έΰ΅ΰ΄±ΰ΅ΰ΄±ΰ΅_ΰ΄Έΰ΅ΰ΄ͺΰ΅ΰ΄±ΰ΅ΰ΄±ΰ΄ΰ΄¬ΰ΅Ό_ΰ΄ΰ΄ΰ΅ΰ΄ΰ΅ΰ΄¬ΰ΅Ό_ΰ΄¨ΰ΄΅ΰ΄ΰ΄¬ΰ΅Ό_ΰ΄‘ΰ΄Ώΰ΄Έΰ΄ΰ΄¬ΰ΅Ό'.split('_'),
        monthsShort : 'ΰ΄ΰ΄¨ΰ΅._ΰ΄«ΰ΅ΰ΄¬ΰ΅ΰ΄°ΰ΅._ΰ΄�ΰ΄Ύΰ΅Ό._ΰ΄ΰ΄ͺΰ΅ΰ΄°ΰ΄Ώ._ΰ΄�ΰ΅ΰ΄―ΰ΅_ΰ΄ΰ΅ΰ΅Ί_ΰ΄ΰ΅ΰ΄²ΰ΅._ΰ΄ΰ΄._ΰ΄Έΰ΅ΰ΄ͺΰ΅ΰ΄±ΰ΅ΰ΄±._ΰ΄ΰ΄ΰ΅ΰ΄ΰ΅._ΰ΄¨ΰ΄΅ΰ΄._ΰ΄‘ΰ΄Ώΰ΄Έΰ΄.'.split('_'),
        weekdays : 'ΰ΄ΰ΄Ύΰ΄―ΰ΄±ΰ΄Ύΰ΄΄ΰ΅ΰ΄_ΰ΄€ΰ΄Ώΰ΄ΰ΅ΰ΄ΰ΄³ΰ΄Ύΰ΄΄ΰ΅ΰ΄_ΰ΄ΰ΅ΰ΄΅ΰ΅ΰ΄΅ΰ΄Ύΰ΄΄ΰ΅ΰ΄_ΰ΄¬ΰ΅ΰ΄§ΰ΄¨ΰ΄Ύΰ΄΄ΰ΅ΰ΄_ΰ΄΅ΰ΅ΰ΄―ΰ΄Ύΰ΄΄ΰ΄Ύΰ΄΄ΰ΅ΰ΄_ΰ΄΅ΰ΅ΰ΄³ΰ΅ΰ΄³ΰ΄Ώΰ΄―ΰ΄Ύΰ΄΄ΰ΅ΰ΄_ΰ΄Άΰ΄¨ΰ΄Ώΰ΄―ΰ΄Ύΰ΄΄ΰ΅ΰ΄'.split('_'),
        weekdaysShort : 'ΰ΄ΰ΄Ύΰ΄―ΰ΅Ό_ΰ΄€ΰ΄Ώΰ΄ΰ΅ΰ΄ΰ΅Ύ_ΰ΄ΰ΅ΰ΄΅ΰ΅ΰ΄΅_ΰ΄¬ΰ΅ΰ΄§ΰ΅»_ΰ΄΅ΰ΅ΰ΄―ΰ΄Ύΰ΄΄ΰ΄_ΰ΄΅ΰ΅ΰ΄³ΰ΅ΰ΄³ΰ΄Ώ_ΰ΄Άΰ΄¨ΰ΄Ώ'.split('_'),
        weekdaysMin : 'ΰ΄ΰ΄Ύ_ΰ΄€ΰ΄Ώ_ΰ΄ΰ΅_ΰ΄¬ΰ΅_ΰ΄΅ΰ΅ΰ΄―ΰ΄Ύ_ΰ΄΅ΰ΅_ΰ΄Ά'.split('_'),
        longDateFormat : {
            LT : 'A h:mm -ΰ΄¨ΰ΅',
            LTS : 'A h:mm:ss -ΰ΄¨ΰ΅',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[ΰ΄ΰ΄¨ΰ΅ΰ΄¨ΰ΅] LT',
            nextDay : '[ΰ΄¨ΰ΄Ύΰ΄³ΰ΅] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[ΰ΄ΰ΄¨ΰ΅ΰ΄¨ΰ΄²ΰ΅] LT',
            lastWeek : '[ΰ΄ΰ΄΄ΰ΄Ώΰ΄ΰ΅ΰ΄] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s ΰ΄ΰ΄΄ΰ΄Ώΰ΄ΰ΅ΰ΄ΰ΅',
            past : '%s ΰ΄�ΰ΅ΰ΅»ΰ΄ͺΰ΅',
            s : 'ΰ΄ΰ΅½ΰ΄ͺ ΰ΄¨ΰ΄Ώΰ΄�ΰ΄Ώΰ΄·ΰ΄ΰ΅ΰ΄ΰ΅Ύ',
            m : 'ΰ΄ΰ΄°ΰ΅ ΰ΄�ΰ΄Ώΰ΄¨ΰ΄Ώΰ΄±ΰ΅ΰ΄±ΰ΅',
            mm : '%d ΰ΄�ΰ΄Ώΰ΄¨ΰ΄Ώΰ΄±ΰ΅ΰ΄±ΰ΅',
            h : 'ΰ΄ΰ΄°ΰ΅ ΰ΄�ΰ΄£ΰ΄Ώΰ΄ΰ΅ΰ΄ΰ΅ΰ΅Ό',
            hh : '%d ΰ΄�ΰ΄£ΰ΄Ώΰ΄ΰ΅ΰ΄ΰ΅ΰ΅Ό',
            d : 'ΰ΄ΰ΄°ΰ΅ ΰ΄¦ΰ΄Ώΰ΄΅ΰ΄Έΰ΄',
            dd : '%d ΰ΄¦ΰ΄Ώΰ΄΅ΰ΄Έΰ΄',
            M : 'ΰ΄ΰ΄°ΰ΅ ΰ΄�ΰ΄Ύΰ΄Έΰ΄',
            MM : '%d ΰ΄�ΰ΄Ύΰ΄Έΰ΄',
            y : 'ΰ΄ΰ΄°ΰ΅ ΰ΄΅ΰ΅Όΰ΄·ΰ΄',
            yy : '%d ΰ΄΅ΰ΅Όΰ΄·ΰ΄'
        },
        meridiemParse: /ΰ΄°ΰ΄Ύΰ΄€ΰ΅ΰ΄°ΰ΄Ώ|ΰ΄°ΰ΄Ύΰ΄΅ΰ΄Ώΰ΄²ΰ΅|ΰ΄ΰ΄ΰ΅ΰ΄ ΰ΄ΰ΄΄ΰ΄Ώΰ΄ΰ΅ΰ΄ΰ΅|ΰ΄΅ΰ΅ΰ΄ΰ΅ΰ΄¨ΰ΅ΰ΄¨ΰ΅ΰ΄°ΰ΄|ΰ΄°ΰ΄Ύΰ΄€ΰ΅ΰ΄°ΰ΄Ώ/i,
        isPM : function (input) {
            return /^(ΰ΄ΰ΄ΰ΅ΰ΄ ΰ΄ΰ΄΄ΰ΄Ώΰ΄ΰ΅ΰ΄ΰ΅|ΰ΄΅ΰ΅ΰ΄ΰ΅ΰ΄¨ΰ΅ΰ΄¨ΰ΅ΰ΄°ΰ΄|ΰ΄°ΰ΄Ύΰ΄€ΰ΅ΰ΄°ΰ΄Ώ)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'ΰ΄°ΰ΄Ύΰ΄€ΰ΅ΰ΄°ΰ΄Ώ';
            } else if (hour < 12) {
                return 'ΰ΄°ΰ΄Ύΰ΄΅ΰ΄Ώΰ΄²ΰ΅';
            } else if (hour < 17) {
                return 'ΰ΄ΰ΄ΰ΅ΰ΄ ΰ΄ΰ΄΄ΰ΄Ώΰ΄ΰ΅ΰ΄ΰ΅';
            } else if (hour < 20) {
                return 'ΰ΄΅ΰ΅ΰ΄ΰ΅ΰ΄¨ΰ΅ΰ΄¨ΰ΅ΰ΄°ΰ΄';
            } else {
                return 'ΰ΄°ΰ΄Ύΰ΄€ΰ΅ΰ΄°ΰ΄Ώ';
            }
        }
    });
}));
// moment.js locale configuration
// locale : Marathi (mr)
// author : Harshad Kale : https://github.com/kalehv

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'ΰ₯§',
        '2': 'ΰ₯¨',
        '3': 'ΰ₯©',
        '4': 'ΰ₯ͺ',
        '5': 'ΰ₯«',
        '6': 'ΰ₯¬',
        '7': 'ΰ₯­',
        '8': 'ΰ₯�',
        '9': 'ΰ₯―',
        '0': 'ΰ₯¦'
    },
    numberMap = {
        'ΰ₯§': '1',
        'ΰ₯¨': '2',
        'ΰ₯©': '3',
        'ΰ₯ͺ': '4',
        'ΰ₯«': '5',
        'ΰ₯¬': '6',
        'ΰ₯­': '7',
        'ΰ₯�': '8',
        'ΰ₯―': '9',
        'ΰ₯¦': '0'
    };

    return moment.defineLocale('mr', {
        months : 'ΰ€ΰ€Ύΰ€¨ΰ₯ΰ€΅ΰ€Ύΰ€°ΰ₯_ΰ€«ΰ₯ΰ€¬ΰ₯ΰ€°ΰ₯ΰ€΅ΰ€Ύΰ€°ΰ₯_ΰ€�ΰ€Ύΰ€°ΰ₯ΰ€_ΰ€ΰ€ͺΰ₯ΰ€°ΰ€Ώΰ€²_ΰ€�ΰ₯_ΰ€ΰ₯ΰ€¨_ΰ€ΰ₯ΰ€²ΰ₯_ΰ€ΰ€ΰ€Έΰ₯ΰ€_ΰ€Έΰ€ͺΰ₯ΰ€ΰ₯ΰ€ΰ€¬ΰ€°_ΰ€ΰ€ΰ₯ΰ€ΰ₯ΰ€¬ΰ€°_ΰ€¨ΰ₯ΰ€΅ΰ₯ΰ€Ήΰ₯ΰ€ΰ€¬ΰ€°_ΰ€‘ΰ€Ώΰ€Έΰ₯ΰ€ΰ€¬ΰ€°'.split('_'),
        monthsShort: 'ΰ€ΰ€Ύΰ€¨ΰ₯._ΰ€«ΰ₯ΰ€¬ΰ₯ΰ€°ΰ₯._ΰ€�ΰ€Ύΰ€°ΰ₯ΰ€._ΰ€ΰ€ͺΰ₯ΰ€°ΰ€Ώ._ΰ€�ΰ₯._ΰ€ΰ₯ΰ€¨._ΰ€ΰ₯ΰ€²ΰ₯._ΰ€ΰ€._ΰ€Έΰ€ͺΰ₯ΰ€ΰ₯ΰ€._ΰ€ΰ€ΰ₯ΰ€ΰ₯._ΰ€¨ΰ₯ΰ€΅ΰ₯ΰ€Ήΰ₯ΰ€._ΰ€‘ΰ€Ώΰ€Έΰ₯ΰ€.'.split('_'),
        weekdays : 'ΰ€°ΰ€΅ΰ€Ώΰ€΅ΰ€Ύΰ€°_ΰ€Έΰ₯ΰ€�ΰ€΅ΰ€Ύΰ€°_ΰ€�ΰ€ΰ€ΰ€³ΰ€΅ΰ€Ύΰ€°_ΰ€¬ΰ₯ΰ€§ΰ€΅ΰ€Ύΰ€°_ΰ€ΰ₯ΰ€°ΰ₯ΰ€΅ΰ€Ύΰ€°_ΰ€Άΰ₯ΰ€ΰ₯ΰ€°ΰ€΅ΰ€Ύΰ€°_ΰ€Άΰ€¨ΰ€Ώΰ€΅ΰ€Ύΰ€°'.split('_'),
        weekdaysShort : 'ΰ€°ΰ€΅ΰ€Ώ_ΰ€Έΰ₯ΰ€�_ΰ€�ΰ€ΰ€ΰ€³_ΰ€¬ΰ₯ΰ€§_ΰ€ΰ₯ΰ€°ΰ₯_ΰ€Άΰ₯ΰ€ΰ₯ΰ€°_ΰ€Άΰ€¨ΰ€Ώ'.split('_'),
        weekdaysMin : 'ΰ€°_ΰ€Έΰ₯_ΰ€�ΰ€_ΰ€¬ΰ₯_ΰ€ΰ₯_ΰ€Άΰ₯_ΰ€Ά'.split('_'),
        longDateFormat : {
            LT : 'A h:mm ΰ€΅ΰ€Ύΰ€ΰ€€ΰ€Ύ',
            LTS : 'A h:mm:ss ΰ€΅ΰ€Ύΰ€ΰ€€ΰ€Ύ',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[ΰ€ΰ€] LT',
            nextDay : '[ΰ€ΰ€¦ΰ₯ΰ€―ΰ€Ύ] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[ΰ€ΰ€Ύΰ€²] LT',
            lastWeek: '[ΰ€�ΰ€Ύΰ€ΰ₯ΰ€²] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s ΰ€¨ΰ€ΰ€€ΰ€°',
            past : '%s ΰ€ͺΰ₯ΰ€°ΰ₯ΰ€΅ΰ₯',
            s : 'ΰ€Έΰ₯ΰ€ΰ€ΰ€¦',
            m: 'ΰ€ΰ€ ΰ€�ΰ€Ώΰ€¨ΰ€Ώΰ€',
            mm: '%d ΰ€�ΰ€Ώΰ€¨ΰ€Ώΰ€ΰ₯',
            h : 'ΰ€ΰ€ ΰ€€ΰ€Ύΰ€Έ',
            hh : '%d ΰ€€ΰ€Ύΰ€Έ',
            d : 'ΰ€ΰ€ ΰ€¦ΰ€Ώΰ€΅ΰ€Έ',
            dd : '%d ΰ€¦ΰ€Ώΰ€΅ΰ€Έ',
            M : 'ΰ€ΰ€ ΰ€�ΰ€Ήΰ€Ώΰ€¨ΰ€Ύ',
            MM : '%d ΰ€�ΰ€Ήΰ€Ώΰ€¨ΰ₯',
            y : 'ΰ€ΰ€ ΰ€΅ΰ€°ΰ₯ΰ€·',
            yy : '%d ΰ€΅ΰ€°ΰ₯ΰ€·ΰ₯'
        },
        preparse: function (string) {
            return string.replace(/[ΰ₯§ΰ₯¨ΰ₯©ΰ₯ͺΰ₯«ΰ₯¬ΰ₯­ΰ₯�ΰ₯―ΰ₯¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /ΰ€°ΰ€Ύΰ€€ΰ₯ΰ€°ΰ₯|ΰ€Έΰ€ΰ€Ύΰ€³ΰ₯|ΰ€¦ΰ₯ΰ€ͺΰ€Ύΰ€°ΰ₯|ΰ€Έΰ€Ύΰ€―ΰ€ΰ€ΰ€Ύΰ€³ΰ₯/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'ΰ€°ΰ€Ύΰ€€ΰ₯ΰ€°ΰ₯') {
                return hour < 4 ? hour : hour + 12;
            } else if (meridiem === 'ΰ€Έΰ€ΰ€Ύΰ€³ΰ₯') {
                return hour;
            } else if (meridiem === 'ΰ€¦ΰ₯ΰ€ͺΰ€Ύΰ€°ΰ₯') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === 'ΰ€Έΰ€Ύΰ€―ΰ€ΰ€ΰ€Ύΰ€³ΰ₯') {
                return hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower)
        {
            if (hour < 4) {
                return 'ΰ€°ΰ€Ύΰ€€ΰ₯ΰ€°ΰ₯';
            } else if (hour < 10) {
                return 'ΰ€Έΰ€ΰ€Ύΰ€³ΰ₯';
            } else if (hour < 17) {
                return 'ΰ€¦ΰ₯ΰ€ͺΰ€Ύΰ€°ΰ₯';
            } else if (hour < 20) {
                return 'ΰ€Έΰ€Ύΰ€―ΰ€ΰ€ΰ€Ύΰ€³ΰ₯';
            } else {
                return 'ΰ€°ΰ€Ύΰ€€ΰ₯ΰ€°ΰ₯';
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Bahasa Malaysia (ms-MY)
// author : Weldan Jamili : https://github.com/weldan

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('ms-my', {
        months : 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split('_'),
        monthsShort : 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
        weekdays : 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
        weekdaysShort : 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
        weekdaysMin : 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
        longDateFormat : {
            LT : 'HH.mm',
            LTS : 'LT.ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY [pukul] LT',
            LLLL : 'dddd, D MMMM YYYY [pukul] LT'
        },
        meridiemParse: /pagi|tengahari|petang|malam/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'pagi') {
                return hour;
            } else if (meridiem === 'tengahari') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'petang' || meridiem === 'malam') {
                return hour + 12;
            }
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours < 11) {
                return 'pagi';
            } else if (hours < 15) {
                return 'tengahari';
            } else if (hours < 19) {
                return 'petang';
            } else {
                return 'malam';
            }
        },
        calendar : {
            sameDay : '[Hari ini pukul] LT',
            nextDay : '[Esok pukul] LT',
            nextWeek : 'dddd [pukul] LT',
            lastDay : '[Kelmarin pukul] LT',
            lastWeek : 'dddd [lepas pukul] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'dalam %s',
            past : '%s yang lepas',
            s : 'beberapa saat',
            m : 'seminit',
            mm : '%d minit',
            h : 'sejam',
            hh : '%d jam',
            d : 'sehari',
            dd : '%d hari',
            M : 'sebulan',
            MM : '%d bulan',
            y : 'setahun',
            yy : '%d tahun'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Burmese (my)
// author : Squar team, mysquar.com

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'α',
        '2': 'α',
        '3': 'α',
        '4': 'α',
        '5': 'α',
        '6': 'α',
        '7': 'α',
        '8': 'α',
        '9': 'α',
        '0': 'α'
    }, numberMap = {
        'α': '1',
        'α': '2',
        'α': '3',
        'α': '4',
        'α': '5',
        'α': '6',
        'α': '7',
        'α': '8',
        'α': '9',
        'α': '0'
    };
    return moment.defineLocale('my', {
        months: 'αααΊααα«αα�_αα±αα±α¬αΊαα«αα�_αααΊ_α§ααΌα�_αα±_αα½ααΊ_αα°αα­α―ααΊ_ααΌαα―ααΊ_αααΊαααΊαα¬_α‘α±α¬ααΊαα­α―αα¬_αα­α―αααΊαα¬_αα�αααΊαα¬'.split('_'),
        monthsShort: 'αααΊ_αα±_αααΊ_ααΌα�_αα±_αα½ααΊ_αα­α―ααΊ_ααΌ_αααΊ_α‘α±α¬ααΊ_αα­α―_αα�'.split('_'),
        weekdays: 'ααααΊαΉααα½α±_ααααΊαΉαα¬_α‘ααΊαΉαα«_αα―ααΉααα°αΈ_ααΌα¬αααα±αΈ_αα±α¬ααΌα¬_ααα±'.split('_'),
        weekdaysShort: 'αα½α±_αα¬_ααΊαΉαα«_αα°αΈ_ααΌα¬_αα±α¬_αα±'.split('_'),
        weekdaysMin: 'αα½α±_αα¬_ααΊαΉαα«_αα°αΈ_ααΌα¬_αα±α¬_αα±'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'DD/MM/YYYY',
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY LT',
            LLLL: 'dddd D MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[ααα±.] LT [ααΎα¬]',
            nextDay: '[ααααΊααΌααΊ] LT [ααΎα¬]',
            nextWeek: 'dddd LT [ααΎα¬]',
            lastDay: '[ααα±.α] LT [ααΎα¬]',
            lastWeek: '[ααΌα�αΈαα²α·αα±α¬] dddd LT [ααΎα¬]',
            sameElse: 'L'
        },
        relativeTime: {
            future: 'αα¬αααΊα· %s ααΎα¬',
            past: 'αα½ααΊαα²α·αα±α¬ %s α',
            s: 'αααΉαααΊ.α‘αααΊαΈαααΊ',
            m: 'αααΊαα­αααΊ',
            mm: '%d αα­αααΊ',
            h: 'αααΊαα¬αα�',
            hh: '%d αα¬αα�',
            d: 'αααΊαααΊ',
            dd: '%d αααΊ',
            M: 'αααΊα',
            MM: '%d α',
            y: 'αααΊααΎααΊ',
            yy: '%d ααΎααΊ'
        },
        preparse: function (string) {
            return string.replace(/[αααααααααα]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        week: {
            dow: 1, // Monday is the first day of the week.
            doy: 4 // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : norwegian bokmΓ₯l (nb)
// authors : Espen Hovlandsdal : https://github.com/rexxars
//           Sigurd Gartmann : https://github.com/sigurdga

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('nb', {
        months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays : 'sΓΈndag_mandag_tirsdag_onsdag_torsdag_fredag_lΓΈrdag'.split('_'),
        weekdaysShort : 'sΓΈn_man_tirs_ons_tors_fre_lΓΈr'.split('_'),
        weekdaysMin : 'sΓΈ_ma_ti_on_to_fr_lΓΈ'.split('_'),
        longDateFormat : {
            LT : 'H.mm',
            LTS : 'LT.ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY [kl.] LT',
            LLLL : 'dddd D. MMMM YYYY [kl.] LT'
        },
        calendar : {
            sameDay: '[i dag kl.] LT',
            nextDay: '[i morgen kl.] LT',
            nextWeek: 'dddd [kl.] LT',
            lastDay: '[i gΓ₯r kl.] LT',
            lastWeek: '[forrige] dddd [kl.] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : 'for %s siden',
            s : 'noen sekunder',
            m : 'ett minutt',
            mm : '%d minutter',
            h : 'en time',
            hh : '%d timer',
            d : 'en dag',
            dd : '%d dager',
            M : 'en mΓ₯ned',
            MM : '%d mΓ₯neder',
            y : 'ett Γ₯r',
            yy : '%d Γ₯r'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : nepali/nepalese
// author : suvash : https://github.com/suvash

(function (factory) {
    factory(moment);
}(function (moment) {
    var symbolMap = {
        '1': 'ΰ₯§',
        '2': 'ΰ₯¨',
        '3': 'ΰ₯©',
        '4': 'ΰ₯ͺ',
        '5': 'ΰ₯«',
        '6': 'ΰ₯¬',
        '7': 'ΰ₯­',
        '8': 'ΰ₯�',
        '9': 'ΰ₯―',
        '0': 'ΰ₯¦'
    },
    numberMap = {
        'ΰ₯§': '1',
        'ΰ₯¨': '2',
        'ΰ₯©': '3',
        'ΰ₯ͺ': '4',
        'ΰ₯«': '5',
        'ΰ₯¬': '6',
        'ΰ₯­': '7',
        'ΰ₯�': '8',
        'ΰ₯―': '9',
        'ΰ₯¦': '0'
    };

    return moment.defineLocale('ne', {
        months : 'ΰ€ΰ€¨ΰ€΅ΰ€°ΰ₯_ΰ€«ΰ₯ΰ€¬ΰ₯ΰ€°ΰ₯ΰ€΅ΰ€°ΰ₯_ΰ€�ΰ€Ύΰ€°ΰ₯ΰ€_ΰ€ΰ€ͺΰ₯ΰ€°ΰ€Ώΰ€²_ΰ€�ΰ€_ΰ€ΰ₯ΰ€¨_ΰ€ΰ₯ΰ€²ΰ€Ύΰ€_ΰ€ΰ€ΰ€·ΰ₯ΰ€_ΰ€Έΰ₯ΰ€ͺΰ₯ΰ€ΰ₯ΰ€�ΰ₯ΰ€¬ΰ€°_ΰ€ΰ€ΰ₯ΰ€ΰ₯ΰ€¬ΰ€°_ΰ€¨ΰ₯ΰ€­ΰ₯ΰ€�ΰ₯ΰ€¬ΰ€°_ΰ€‘ΰ€Ώΰ€Έΰ₯ΰ€�ΰ₯ΰ€¬ΰ€°'.split('_'),
        monthsShort : 'ΰ€ΰ€¨._ΰ€«ΰ₯ΰ€¬ΰ₯ΰ€°ΰ₯._ΰ€�ΰ€Ύΰ€°ΰ₯ΰ€_ΰ€ΰ€ͺΰ₯ΰ€°ΰ€Ώ._ΰ€�ΰ€_ΰ€ΰ₯ΰ€¨_ΰ€ΰ₯ΰ€²ΰ€Ύΰ€._ΰ€ΰ€._ΰ€Έΰ₯ΰ€ͺΰ₯ΰ€._ΰ€ΰ€ΰ₯ΰ€ΰ₯._ΰ€¨ΰ₯ΰ€­ΰ₯._ΰ€‘ΰ€Ώΰ€Έΰ₯.'.split('_'),
        weekdays : 'ΰ€ΰ€ΰ€€ΰ€¬ΰ€Ύΰ€°_ΰ€Έΰ₯ΰ€�ΰ€¬ΰ€Ύΰ€°_ΰ€�ΰ€ΰ₯ΰ€ΰ€²ΰ€¬ΰ€Ύΰ€°_ΰ€¬ΰ₯ΰ€§ΰ€¬ΰ€Ύΰ€°_ΰ€¬ΰ€Ώΰ€Ήΰ€Ώΰ€¬ΰ€Ύΰ€°_ΰ€Άΰ₯ΰ€ΰ₯ΰ€°ΰ€¬ΰ€Ύΰ€°_ΰ€Άΰ€¨ΰ€Ώΰ€¬ΰ€Ύΰ€°'.split('_'),
        weekdaysShort : 'ΰ€ΰ€ΰ€€._ΰ€Έΰ₯ΰ€�._ΰ€�ΰ€ΰ₯ΰ€ΰ€²._ΰ€¬ΰ₯ΰ€§._ΰ€¬ΰ€Ώΰ€Ήΰ€Ώ._ΰ€Άΰ₯ΰ€ΰ₯ΰ€°._ΰ€Άΰ€¨ΰ€Ώ.'.split('_'),
        weekdaysMin : 'ΰ€ΰ€._ΰ€Έΰ₯._ΰ€�ΰ€ΰ₯_ΰ€¬ΰ₯._ΰ€¬ΰ€Ώ._ΰ€Άΰ₯._ΰ€Ά.'.split('_'),
        longDateFormat : {
            LT : 'Aΰ€ΰ₯ h:mm ΰ€¬ΰ€ΰ₯',
            LTS : 'Aΰ€ΰ₯ h:mm:ss ΰ€¬ΰ€ΰ₯',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        preparse: function (string) {
            return string.replace(/[ΰ₯§ΰ₯¨ΰ₯©ΰ₯ͺΰ₯«ΰ₯¬ΰ₯­ΰ₯�ΰ₯―ΰ₯¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },
        meridiemParse: /ΰ€°ΰ€Ύΰ€€ΰ₯|ΰ€¬ΰ€Ώΰ€Ήΰ€Ύΰ€¨|ΰ€¦ΰ€Ώΰ€ΰ€ΰ€Έΰ₯|ΰ€¬ΰ₯ΰ€²ΰ₯ΰ€ΰ€Ύ|ΰ€Έΰ€Ύΰ€ΰ€|ΰ€°ΰ€Ύΰ€€ΰ₯/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'ΰ€°ΰ€Ύΰ€€ΰ₯') {
                return hour < 3 ? hour : hour + 12;
            } else if (meridiem === 'ΰ€¬ΰ€Ώΰ€Ήΰ€Ύΰ€¨') {
                return hour;
            } else if (meridiem === 'ΰ€¦ΰ€Ώΰ€ΰ€ΰ€Έΰ₯') {
                return hour >= 10 ? hour : hour + 12;
            } else if (meridiem === 'ΰ€¬ΰ₯ΰ€²ΰ₯ΰ€ΰ€Ύ' || meridiem === 'ΰ€Έΰ€Ύΰ€ΰ€') {
                return hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 3) {
                return 'ΰ€°ΰ€Ύΰ€€ΰ₯';
            } else if (hour < 10) {
                return 'ΰ€¬ΰ€Ώΰ€Ήΰ€Ύΰ€¨';
            } else if (hour < 15) {
                return 'ΰ€¦ΰ€Ώΰ€ΰ€ΰ€Έΰ₯';
            } else if (hour < 18) {
                return 'ΰ€¬ΰ₯ΰ€²ΰ₯ΰ€ΰ€Ύ';
            } else if (hour < 20) {
                return 'ΰ€Έΰ€Ύΰ€ΰ€';
            } else {
                return 'ΰ€°ΰ€Ύΰ€€ΰ₯';
            }
        },
        calendar : {
            sameDay : '[ΰ€ΰ€] LT',
            nextDay : '[ΰ€­ΰ₯ΰ€²ΰ₯] LT',
            nextWeek : '[ΰ€ΰ€ΰ€ΰ€¦ΰ₯] dddd[,] LT',
            lastDay : '[ΰ€Ήΰ€Ώΰ€ΰ₯] LT',
            lastWeek : '[ΰ€ΰ€ΰ€ΰ₯] dddd[,] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%sΰ€�ΰ€Ύ',
            past : '%s ΰ€ΰ€ΰ€Ύΰ€‘ΰ₯',
            s : 'ΰ€ΰ₯ΰ€Ήΰ₯ ΰ€Έΰ€�ΰ€―',
            m : 'ΰ€ΰ€ ΰ€�ΰ€Ώΰ€¨ΰ₯ΰ€',
            mm : '%d ΰ€�ΰ€Ώΰ€¨ΰ₯ΰ€',
            h : 'ΰ€ΰ€ ΰ€ΰ€£ΰ₯ΰ€ΰ€Ύ',
            hh : '%d ΰ€ΰ€£ΰ₯ΰ€ΰ€Ύ',
            d : 'ΰ€ΰ€ ΰ€¦ΰ€Ώΰ€¨',
            dd : '%d ΰ€¦ΰ€Ώΰ€¨',
            M : 'ΰ€ΰ€ ΰ€�ΰ€Ήΰ€Ώΰ€¨ΰ€Ύ',
            MM : '%d ΰ€�ΰ€Ήΰ€Ώΰ€¨ΰ€Ύ',
            y : 'ΰ€ΰ€ ΰ€¬ΰ€°ΰ₯ΰ€·',
            yy : '%d ΰ€¬ΰ€°ΰ₯ΰ€·'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : dutch (nl)
// author : Joris RΓΆling : https://github.com/jjupiter

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsShortWithDots = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split('_'),
        monthsShortWithoutDots = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split('_');

    return moment.defineLocale('nl', {
        months : 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split('_'),
        monthsShort : function (m, format) {
            if (/-MMM-/.test(format)) {
                return monthsShortWithoutDots[m.month()];
            } else {
                return monthsShortWithDots[m.month()];
            }
        },
        weekdays : 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split('_'),
        weekdaysShort : 'zo._ma._di._wo._do._vr._za.'.split('_'),
        weekdaysMin : 'Zo_Ma_Di_Wo_Do_Vr_Za'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD-MM-YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[vandaag om] LT',
            nextDay: '[morgen om] LT',
            nextWeek: 'dddd [om] LT',
            lastDay: '[gisteren om] LT',
            lastWeek: '[afgelopen] dddd [om] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'over %s',
            past : '%s geleden',
            s : 'een paar seconden',
            m : 'Γ©Γ©n minuut',
            mm : '%d minuten',
            h : 'Γ©Γ©n uur',
            hh : '%d uur',
            d : 'Γ©Γ©n dag',
            dd : '%d dagen',
            M : 'Γ©Γ©n maand',
            MM : '%d maanden',
            y : 'Γ©Γ©n jaar',
            yy : '%d jaar'
        },
        ordinalParse: /\d{1,2}(ste|de)/,
        ordinal : function (number) {
            return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : norwegian nynorsk (nn)
// author : https://github.com/mechuwind

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('nn', {
        months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
        monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
        weekdays : 'sundag_mΓ₯ndag_tysdag_onsdag_torsdag_fredag_laurdag'.split('_'),
        weekdaysShort : 'sun_mΓ₯n_tys_ons_tor_fre_lau'.split('_'),
        weekdaysMin : 'su_mΓ₯_ty_on_to_fr_lΓΈ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[I dag klokka] LT',
            nextDay: '[I morgon klokka] LT',
            nextWeek: 'dddd [klokka] LT',
            lastDay: '[I gΓ₯r klokka] LT',
            lastWeek: '[FΓΈregΓ₯ande] dddd [klokka] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : 'for %s sidan',
            s : 'nokre sekund',
            m : 'eit minutt',
            mm : '%d minutt',
            h : 'ein time',
            hh : '%d timar',
            d : 'ein dag',
            dd : '%d dagar',
            M : 'ein mΓ₯nad',
            MM : '%d mΓ₯nader',
            y : 'eit Γ₯r',
            yy : '%d Γ₯r'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : polish (pl)
// author : Rafal Hirsz : https://github.com/evoL

(function (factory) {
    factory(moment);
}(function (moment) {
    var monthsNominative = 'styczeΕ_luty_marzec_kwiecieΕ_maj_czerwiec_lipiec_sierpieΕ_wrzesieΕ_paΕΊdziernik_listopad_grudzieΕ'.split('_'),
        monthsSubjective = 'stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrzeΕnia_paΕΊdziernika_listopada_grudnia'.split('_');

    function plural(n) {
        return (n % 10 < 5) && (n % 10 > 1) && ((~~(n / 10) % 10) !== 1);
    }

    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'minuta' : 'minutΔ';
        case 'mm':
            return result + (plural(number) ? 'minuty' : 'minut');
        case 'h':
            return withoutSuffix  ? 'godzina'  : 'godzinΔ';
        case 'hh':
            return result + (plural(number) ? 'godziny' : 'godzin');
        case 'MM':
            return result + (plural(number) ? 'miesiΔce' : 'miesiΔcy');
        case 'yy':
            return result + (plural(number) ? 'lata' : 'lat');
        }
    }

    return moment.defineLocale('pl', {
        months : function (momentToFormat, format) {
            if (/D MMMM/.test(format)) {
                return monthsSubjective[momentToFormat.month()];
            } else {
                return monthsNominative[momentToFormat.month()];
            }
        },
        monthsShort : 'sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paΕΊ_lis_gru'.split('_'),
        weekdays : 'niedziela_poniedziaΕek_wtorek_Εroda_czwartek_piΔtek_sobota'.split('_'),
        weekdaysShort : 'nie_pon_wt_Εr_czw_pt_sb'.split('_'),
        weekdaysMin : 'N_Pn_Wt_Εr_Cz_Pt_So'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[DziΕ o] LT',
            nextDay: '[Jutro o] LT',
            nextWeek: '[W] dddd [o] LT',
            lastDay: '[Wczoraj o] LT',
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[W zeszΕΔ niedzielΔ o] LT';
                case 3:
                    return '[W zeszΕΔ ΕrodΔ o] LT';
                case 6:
                    return '[W zeszΕΔ sobotΔ o] LT';
                default:
                    return '[W zeszΕy] dddd [o] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'za %s',
            past : '%s temu',
            s : 'kilka sekund',
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : '1 dzieΕ',
            dd : '%d dni',
            M : 'miesiΔc',
            MM : translate,
            y : 'rok',
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : brazilian portuguese (pt-br)
// author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('pt-br', {
        months : 'janeiro_fevereiro_marΓ§o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
        monthsShort : 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
        weekdays : 'domingo_segunda-feira_terΓ§a-feira_quarta-feira_quinta-feira_sexta-feira_sΓ‘bado'.split('_'),
        weekdaysShort : 'dom_seg_ter_qua_qui_sex_sΓ‘b'.split('_'),
        weekdaysMin : 'dom_2Βͺ_3Βͺ_4Βͺ_5Βͺ_6Βͺ_sΓ‘b'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [de] MMMM [de] YYYY',
            LLL : 'D [de] MMMM [de] YYYY [Γ s] LT',
            LLLL : 'dddd, D [de] MMMM [de] YYYY [Γ s] LT'
        },
        calendar : {
            sameDay: '[Hoje Γ s] LT',
            nextDay: '[AmanhΓ£ Γ s] LT',
            nextWeek: 'dddd [Γ s] LT',
            lastDay: '[Ontem Γ s] LT',
            lastWeek: function () {
                return (this.day() === 0 || this.day() === 6) ?
                    '[Γltimo] dddd [Γ s] LT' : // Saturday + Sunday
                    '[Γltima] dddd [Γ s] LT'; // Monday - Friday
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'em %s',
            past : '%s atrΓ‘s',
            s : 'segundos',
            m : 'um minuto',
            mm : '%d minutos',
            h : 'uma hora',
            hh : '%d horas',
            d : 'um dia',
            dd : '%d dias',
            M : 'um mΓͺs',
            MM : '%d meses',
            y : 'um ano',
            yy : '%d anos'
        },
        ordinalParse: /\d{1,2}ΒΊ/,
        ordinal : '%dΒΊ'
    });
}));
// moment.js locale configuration
// locale : portuguese (pt)
// author : Jefferson : https://github.com/jalex79

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('pt', {
        months : 'janeiro_fevereiro_marΓ§o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
        monthsShort : 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
        weekdays : 'domingo_segunda-feira_terΓ§a-feira_quarta-feira_quinta-feira_sexta-feira_sΓ‘bado'.split('_'),
        weekdaysShort : 'dom_seg_ter_qua_qui_sex_sΓ‘b'.split('_'),
        weekdaysMin : 'dom_2Βͺ_3Βͺ_4Βͺ_5Βͺ_6Βͺ_sΓ‘b'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D [de] MMMM [de] YYYY',
            LLL : 'D [de] MMMM [de] YYYY LT',
            LLLL : 'dddd, D [de] MMMM [de] YYYY LT'
        },
        calendar : {
            sameDay: '[Hoje Γ s] LT',
            nextDay: '[AmanhΓ£ Γ s] LT',
            nextWeek: 'dddd [Γ s] LT',
            lastDay: '[Ontem Γ s] LT',
            lastWeek: function () {
                return (this.day() === 0 || this.day() === 6) ?
                    '[Γltimo] dddd [Γ s] LT' : // Saturday + Sunday
                    '[Γltima] dddd [Γ s] LT'; // Monday - Friday
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'em %s',
            past : 'hΓ‘ %s',
            s : 'segundos',
            m : 'um minuto',
            mm : '%d minutos',
            h : 'uma hora',
            hh : '%d horas',
            d : 'um dia',
            dd : '%d dias',
            M : 'um mΓͺs',
            MM : '%d meses',
            y : 'um ano',
            yy : '%d anos'
        },
        ordinalParse: /\d{1,2}ΒΊ/,
        ordinal : '%dΒΊ',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : romanian (ro)
// author : Vlad Gurdiga : https://github.com/gurdiga
// author : Valentin Agachi : https://github.com/avaly

(function (factory) {
    factory(moment);
}(function (moment) {
    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
                'mm': 'minute',
                'hh': 'ore',
                'dd': 'zile',
                'MM': 'luni',
                'yy': 'ani'
            },
            separator = ' ';
        if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
            separator = ' de ';
        }

        return number + separator + format[key];
    }

    return moment.defineLocale('ro', {
        months : 'ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie'.split('_'),
        monthsShort : 'ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.'.split('_'),
        weekdays : 'duminicΔ_luni_marΘi_miercuri_joi_vineri_sΓ’mbΔtΔ'.split('_'),
        weekdaysShort : 'Dum_Lun_Mar_Mie_Joi_Vin_SΓ’m'.split('_'),
        weekdaysMin : 'Du_Lu_Ma_Mi_Jo_Vi_SΓ’'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY H:mm',
            LLLL : 'dddd, D MMMM YYYY H:mm'
        },
        calendar : {
            sameDay: '[azi la] LT',
            nextDay: '[mΓ’ine la] LT',
            nextWeek: 'dddd [la] LT',
            lastDay: '[ieri la] LT',
            lastWeek: '[fosta] dddd [la] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'peste %s',
            past : '%s Γ�n urmΔ',
            s : 'cΓ’teva secunde',
            m : 'un minut',
            mm : relativeTimeWithPlural,
            h : 'o orΔ',
            hh : relativeTimeWithPlural,
            d : 'o zi',
            dd : relativeTimeWithPlural,
            M : 'o lunΔ',
            MM : relativeTimeWithPlural,
            y : 'un an',
            yy : relativeTimeWithPlural
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : russian (ru)
// author : Viktorminator : https://github.com/Viktorminator
// Author : Menelion ElensΓΊle : https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': withoutSuffix ? 'ΠΌΠΈΠ½ΡΡΠ°_ΠΌΠΈΠ½ΡΡΡ_ΠΌΠΈΠ½ΡΡ' : 'ΠΌΠΈΠ½ΡΡΡ_ΠΌΠΈΠ½ΡΡΡ_ΠΌΠΈΠ½ΡΡ',
            'hh': 'ΡΠ°Ρ_ΡΠ°ΡΠ°_ΡΠ°ΡΠΎΠ²',
            'dd': 'Π΄Π΅Π½Ρ_Π΄Π½Ρ_Π΄Π½Π΅ΠΉ',
            'MM': 'ΠΌΠ΅ΡΡΡ_ΠΌΠ΅ΡΡΡΠ°_ΠΌΠ΅ΡΡΡΠ΅Π²',
            'yy': 'Π³ΠΎΠ΄_Π³ΠΎΠ΄Π°_Π»Π΅Ρ'
        };
        if (key === 'm') {
            return withoutSuffix ? 'ΠΌΠΈΠ½ΡΡΠ°' : 'ΠΌΠΈΠ½ΡΡΡ';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'ΡΠ½Π²Π°ΡΡ_ΡΠ΅Π²ΡΠ°Π»Ρ_ΠΌΠ°ΡΡ_Π°ΠΏΡΠ΅Π»Ρ_ΠΌΠ°ΠΉ_ΠΈΡΠ½Ρ_ΠΈΡΠ»Ρ_Π°Π²Π³ΡΡΡ_ΡΠ΅Π½ΡΡΠ±ΡΡ_ΠΎΠΊΡΡΠ±ΡΡ_Π½ΠΎΡΠ±ΡΡ_Π΄Π΅ΠΊΠ°Π±ΡΡ'.split('_'),
            'accusative': 'ΡΠ½Π²Π°ΡΡ_ΡΠ΅Π²ΡΠ°Π»Ρ_ΠΌΠ°ΡΡΠ°_Π°ΠΏΡΠ΅Π»Ρ_ΠΌΠ°Ρ_ΠΈΡΠ½Ρ_ΠΈΡΠ»Ρ_Π°Π²Π³ΡΡΡΠ°_ΡΠ΅Π½ΡΡΠ±ΡΡ_ΠΎΠΊΡΡΠ±ΡΡ_Π½ΠΎΡΠ±ΡΡ_Π΄Π΅ΠΊΠ°Π±ΡΡ'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function monthsShortCaseReplace(m, format) {
        var monthsShort = {
            'nominative': 'ΡΠ½Π²_ΡΠ΅Π²_ΠΌΠ°ΡΡ_Π°ΠΏΡ_ΠΌΠ°ΠΉ_ΠΈΡΠ½Ρ_ΠΈΡΠ»Ρ_Π°Π²Π³_ΡΠ΅Π½_ΠΎΠΊΡ_Π½ΠΎΡ_Π΄Π΅ΠΊ'.split('_'),
            'accusative': 'ΡΠ½Π²_ΡΠ΅Π²_ΠΌΠ°Ρ_Π°ΠΏΡ_ΠΌΠ°Ρ_ΠΈΡΠ½Ρ_ΠΈΡΠ»Ρ_Π°Π²Π³_ΡΠ΅Π½_ΠΎΠΊΡ_Π½ΠΎΡ_Π΄Π΅ΠΊ'.split('_')
        },

        nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return monthsShort[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'Π²ΠΎΡΠΊΡΠ΅ΡΠ΅Π½ΡΠ΅_ΠΏΠΎΠ½Π΅Π΄Π΅Π»ΡΠ½ΠΈΠΊ_Π²ΡΠΎΡΠ½ΠΈΠΊ_ΡΡΠ΅Π΄Π°_ΡΠ΅ΡΠ²Π΅ΡΠ³_ΠΏΡΡΠ½ΠΈΡΠ°_ΡΡΠ±Π±ΠΎΡΠ°'.split('_'),
            'accusative': 'Π²ΠΎΡΠΊΡΠ΅ΡΠ΅Π½ΡΠ΅_ΠΏΠΎΠ½Π΅Π΄Π΅Π»ΡΠ½ΠΈΠΊ_Π²ΡΠΎΡΠ½ΠΈΠΊ_ΡΡΠ΅Π΄Ρ_ΡΠ΅ΡΠ²Π΅ΡΠ³_ΠΏΡΡΠ½ΠΈΡΡ_ΡΡΠ±Π±ΠΎΡΡ'.split('_')
        },

        nounCase = (/\[ ?[ΠΠ²] ?(?:ΠΏΡΠΎΡΠ»ΡΡ|ΡΠ»Π΅Π΄ΡΡΡΡΡ|ΡΡΡ)? ?\] ?dddd/).test(format) ?
            'accusative' :
            'nominative';

        return weekdays[nounCase][m.day()];
    }

    return moment.defineLocale('ru', {
        months : monthsCaseReplace,
        monthsShort : monthsShortCaseReplace,
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'Π²Ρ_ΠΏΠ½_Π²Ρ_ΡΡ_ΡΡ_ΠΏΡ_ΡΠ±'.split('_'),
        weekdaysMin : 'Π²Ρ_ΠΏΠ½_Π²Ρ_ΡΡ_ΡΡ_ΠΏΡ_ΡΠ±'.split('_'),
        monthsParse : [/^ΡΠ½Π²/i, /^ΡΠ΅Π²/i, /^ΠΌΠ°Ρ/i, /^Π°ΠΏΡ/i, /^ΠΌΠ°[ΠΉ|Ρ]/i, /^ΠΈΡΠ½/i, /^ΠΈΡΠ»/i, /^Π°Π²Π³/i, /^ΡΠ΅Π½/i, /^ΠΎΠΊΡ/i, /^Π½ΠΎΡ/i, /^Π΄Π΅ΠΊ/i],
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY Π³.',
            LLL : 'D MMMM YYYY Π³., LT',
            LLLL : 'dddd, D MMMM YYYY Π³., LT'
        },
        calendar : {
            sameDay: '[Π‘Π΅Π³ΠΎΠ΄Π½Ρ Π²] LT',
            nextDay: '[ΠΠ°Π²ΡΡΠ° Π²] LT',
            lastDay: '[ΠΡΠ΅ΡΠ° Π²] LT',
            nextWeek: function () {
                return this.day() === 2 ? '[ΠΠΎ] dddd [Π²] LT' : '[Π] dddd [Π²] LT';
            },
            lastWeek: function (now) {
                if (now.week() !== this.week()) {
                    switch (this.day()) {
                    case 0:
                        return '[Π ΠΏΡΠΎΡΠ»ΠΎΠ΅] dddd [Π²] LT';
                    case 1:
                    case 2:
                    case 4:
                        return '[Π ΠΏΡΠΎΡΠ»ΡΠΉ] dddd [Π²] LT';
                    case 3:
                    case 5:
                    case 6:
                        return '[Π ΠΏΡΠΎΡΠ»ΡΡ] dddd [Π²] LT';
                    }
                } else {
                    if (this.day() === 2) {
                        return '[ΠΠΎ] dddd [Π²] LT';
                    } else {
                        return '[Π] dddd [Π²] LT';
                    }
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'ΡΠ΅ΡΠ΅Π· %s',
            past : '%s Π½Π°Π·Π°Π΄',
            s : 'Π½Π΅ΡΠΊΠΎΠ»ΡΠΊΠΎ ΡΠ΅ΠΊΡΠ½Π΄',
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : 'ΡΠ°Ρ',
            hh : relativeTimeWithPlural,
            d : 'Π΄Π΅Π½Ρ',
            dd : relativeTimeWithPlural,
            M : 'ΠΌΠ΅ΡΡΡ',
            MM : relativeTimeWithPlural,
            y : 'Π³ΠΎΠ΄',
            yy : relativeTimeWithPlural
        },

        meridiemParse: /Π½ΠΎΡΠΈ|ΡΡΡΠ°|Π΄Π½Ρ|Π²Π΅ΡΠ΅ΡΠ°/i,
        isPM : function (input) {
            return /^(Π΄Π½Ρ|Π²Π΅ΡΠ΅ΡΠ°)$/.test(input);
        },

        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'Π½ΠΎΡΠΈ';
            } else if (hour < 12) {
                return 'ΡΡΡΠ°';
            } else if (hour < 17) {
                return 'Π΄Π½Ρ';
            } else {
                return 'Π²Π΅ΡΠ΅ΡΠ°';
            }
        },

        ordinalParse: /\d{1,2}-(ΠΉ|Π³ΠΎ|Ρ)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
                return number + '-ΠΉ';
            case 'D':
                return number + '-Π³ΠΎ';
            case 'w':
            case 'W':
                return number + '-Ρ';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : slovak (sk)
// author : Martin Minka : https://github.com/k2s
// based on work of petrbela : https://github.com/petrbela

(function (factory) {
    factory(moment);
}(function (moment) {
    var months = 'januΓ‘r_februΓ‘r_marec_aprΓ­l_mΓ‘j_jΓΊn_jΓΊl_august_september_oktΓ³ber_november_december'.split('_'),
        monthsShort = 'jan_feb_mar_apr_mΓ‘j_jΓΊn_jΓΊl_aug_sep_okt_nov_dec'.split('_');

    function plural(n) {
        return (n > 1) && (n < 5);
    }

    function translate(number, withoutSuffix, key, isFuture) {
        var result = number + ' ';
        switch (key) {
        case 's':  // a few seconds / in a few seconds / a few seconds ago
            return (withoutSuffix || isFuture) ? 'pΓ‘r sekΓΊnd' : 'pΓ‘r sekundami';
        case 'm':  // a minute / in a minute / a minute ago
            return withoutSuffix ? 'minΓΊta' : (isFuture ? 'minΓΊtu' : 'minΓΊtou');
        case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'minΓΊty' : 'minΓΊt');
            } else {
                return result + 'minΓΊtami';
            }
            break;
        case 'h':  // an hour / in an hour / an hour ago
            return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
        case 'hh': // 9 hours / in 9 hours / 9 hours ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'hodiny' : 'hodΓ­n');
            } else {
                return result + 'hodinami';
            }
            break;
        case 'd':  // a day / in a day / a day ago
            return (withoutSuffix || isFuture) ? 'deΕ' : 'dΕom';
        case 'dd': // 9 days / in 9 days / 9 days ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'dni' : 'dnΓ­');
            } else {
                return result + 'dΕami';
            }
            break;
        case 'M':  // a month / in a month / a month ago
            return (withoutSuffix || isFuture) ? 'mesiac' : 'mesiacom';
        case 'MM': // 9 months / in 9 months / 9 months ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'mesiace' : 'mesiacov');
            } else {
                return result + 'mesiacmi';
            }
            break;
        case 'y':  // a year / in a year / a year ago
            return (withoutSuffix || isFuture) ? 'rok' : 'rokom';
        case 'yy': // 9 years / in 9 years / 9 years ago
            if (withoutSuffix || isFuture) {
                return result + (plural(number) ? 'roky' : 'rokov');
            } else {
                return result + 'rokmi';
            }
            break;
        }
    }

    return moment.defineLocale('sk', {
        months : months,
        monthsShort : monthsShort,
        monthsParse : (function (months, monthsShort) {
            var i, _monthsParse = [];
            for (i = 0; i < 12; i++) {
                // use custom parser to solve problem with July (Δervenec)
                _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
            }
            return _monthsParse;
        }(months, monthsShort)),
        weekdays : 'nedeΔΎa_pondelok_utorok_streda_Ε‘tvrtok_piatok_sobota'.split('_'),
        weekdaysShort : 'ne_po_ut_st_Ε‘t_pi_so'.split('_'),
        weekdaysMin : 'ne_po_ut_st_Ε‘t_pi_so'.split('_'),
        longDateFormat : {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd D. MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[dnes o] LT',
            nextDay: '[zajtra o] LT',
            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[v nedeΔΎu o] LT';
                case 1:
                case 2:
                    return '[v] dddd [o] LT';
                case 3:
                    return '[v stredu o] LT';
                case 4:
                    return '[vo Ε‘tvrtok o] LT';
                case 5:
                    return '[v piatok o] LT';
                case 6:
                    return '[v sobotu o] LT';
                }
            },
            lastDay: '[vΔera o] LT',
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[minulΓΊ nedeΔΎu o] LT';
                case 1:
                case 2:
                    return '[minulΓ½] dddd [o] LT';
                case 3:
                    return '[minulΓΊ stredu o] LT';
                case 4:
                case 5:
                    return '[minulΓ½] dddd [o] LT';
                case 6:
                    return '[minulΓΊ sobotu o] LT';
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'za %s',
            past : 'pred %s',
            s : translate,
            m : translate,
            mm : translate,
            h : translate,
            hh : translate,
            d : translate,
            dd : translate,
            M : translate,
            MM : translate,
            y : translate,
            yy : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : slovenian (sl)
// author : Robert SedovΕ‘ek : https://github.com/sedovsek

(function (factory) {
    factory(moment);
}(function (moment) {
    function translate(number, withoutSuffix, key) {
        var result = number + ' ';
        switch (key) {
        case 'm':
            return withoutSuffix ? 'ena minuta' : 'eno minuto';
        case 'mm':
            if (number === 1) {
                result += 'minuta';
            } else if (number === 2) {
                result += 'minuti';
            } else if (number === 3 || number === 4) {
                result += 'minute';
            } else {
                result += 'minut';
            }
            return result;
        case 'h':
            return withoutSuffix ? 'ena ura' : 'eno uro';
        case 'hh':
            if (number === 1) {
                result += 'ura';
            } else if (number === 2) {
                result += 'uri';
            } else if (number === 3 || number === 4) {
                result += 'ure';
            } else {
                result += 'ur';
            }
            return result;
        case 'dd':
            if (number === 1) {
                result += 'dan';
            } else {
                result += 'dni';
            }
            return result;
        case 'MM':
            if (number === 1) {
                result += 'mesec';
            } else if (number === 2) {
                result += 'meseca';
            } else if (number === 3 || number === 4) {
                result += 'mesece';
            } else {
                result += 'mesecev';
            }
            return result;
        case 'yy':
            if (number === 1) {
                result += 'leto';
            } else if (number === 2) {
                result += 'leti';
            } else if (number === 3 || number === 4) {
                result += 'leta';
            } else {
                result += 'let';
            }
            return result;
        }
    }

    return moment.defineLocale('sl', {
        months : 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split('_'),
        monthsShort : 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split('_'),
        weekdays : 'nedelja_ponedeljek_torek_sreda_Δetrtek_petek_sobota'.split('_'),
        weekdaysShort : 'ned._pon._tor._sre._Δet._pet._sob.'.split('_'),
        weekdaysMin : 'ne_po_to_sr_Δe_pe_so'.split('_'),
        longDateFormat : {
            LT : 'H:mm',
            LTS : 'LT:ss',
            L : 'DD. MM. YYYY',
            LL : 'D. MMMM YYYY',
            LLL : 'D. MMMM YYYY LT',
            LLLL : 'dddd, D. MMMM YYYY LT'
        },
        calendar : {
            sameDay  : '[danes ob] LT',
            nextDay  : '[jutri ob] LT',

            nextWeek : function () {
                switch (this.day()) {
                case 0:
                    return '[v] [nedeljo] [ob] LT';
                case 3:
                    return '[v] [sredo] [ob] LT';
                case 6:
                    return '[v] [soboto] [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[v] dddd [ob] LT';
                }
            },
            lastDay  : '[vΔeraj ob] LT',
            lastWeek : function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 6:
                    return '[prejΕ‘nja] dddd [ob] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[prejΕ‘nji] dddd [ob] LT';
                }
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Δez %s',
            past   : '%s nazaj',
            s      : 'nekaj sekund',
            m      : translate,
            mm     : translate,
            h      : translate,
            hh     : translate,
            d      : 'en dan',
            dd     : translate,
            M      : 'en mesec',
            MM     : translate,
            y      : 'eno leto',
            yy     : translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Albanian (sq)
// author : FlakΓ«rim Ismani : https://github.com/flakerimi
// author: Menelion ElensΓΊle: https://github.com/Oire (tests)
// author : Oerd Cukalla : https://github.com/oerd (fixes)

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('sq', {
        months : 'Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_NΓ«ntor_Dhjetor'.split('_'),
        monthsShort : 'Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_NΓ«n_Dhj'.split('_'),
        weekdays : 'E Diel_E HΓ«nΓ«_E MartΓ«_E MΓ«rkurΓ«_E Enjte_E Premte_E ShtunΓ«'.split('_'),
        weekdaysShort : 'Die_HΓ«n_Mar_MΓ«r_Enj_Pre_Sht'.split('_'),
        weekdaysMin : 'D_H_Ma_MΓ«_E_P_Sh'.split('_'),
        meridiemParse: /PD|MD/,
        isPM: function (input) {
            return input.charAt(0) === 'M';
        },
        meridiem : function (hours, minutes, isLower) {
            return hours < 12 ? 'PD' : 'MD';
        },
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[Sot nΓ«] LT',
            nextDay : '[NesΓ«r nΓ«] LT',
            nextWeek : 'dddd [nΓ«] LT',
            lastDay : '[Dje nΓ«] LT',
            lastWeek : 'dddd [e kaluar nΓ«] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'nΓ« %s',
            past : '%s mΓ« parΓ«',
            s : 'disa sekonda',
            m : 'njΓ« minutΓ«',
            mm : '%d minuta',
            h : 'njΓ« orΓ«',
            hh : '%d orΓ«',
            d : 'njΓ« ditΓ«',
            dd : '%d ditΓ«',
            M : 'njΓ« muaj',
            MM : '%d muaj',
            y : 'njΓ« vit',
            yy : '%d vite'
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Serbian-cyrillic (sr-cyrl)
// author : Milan JanaΔkoviΔ<milanjanackovic@gmail.com> : https://github.com/milan-j

(function (factory) {
    factory(moment);
}(function (moment) {
    var translator = {
        words: { //Different grammatical cases
            m: ['ΡΠ΅Π΄Π°Π½ ΠΌΠΈΠ½ΡΡ', 'ΡΠ΅Π΄Π½Π΅ ΠΌΠΈΠ½ΡΡΠ΅'],
            mm: ['ΠΌΠΈΠ½ΡΡ', 'ΠΌΠΈΠ½ΡΡΠ΅', 'ΠΌΠΈΠ½ΡΡΠ°'],
            h: ['ΡΠ΅Π΄Π°Π½ ΡΠ°Ρ', 'ΡΠ΅Π΄Π½ΠΎΠ³ ΡΠ°ΡΠ°'],
            hh: ['ΡΠ°Ρ', 'ΡΠ°ΡΠ°', 'ΡΠ°ΡΠΈ'],
            dd: ['Π΄Π°Π½', 'Π΄Π°Π½Π°', 'Π΄Π°Π½Π°'],
            MM: ['ΠΌΠ΅ΡΠ΅Ρ', 'ΠΌΠ΅ΡΠ΅ΡΠ°', 'ΠΌΠ΅ΡΠ΅ΡΠΈ'],
            yy: ['Π³ΠΎΠ΄ΠΈΠ½Π°', 'Π³ΠΎΠ΄ΠΈΠ½Π΅', 'Π³ΠΎΠ΄ΠΈΠ½Π°']
        },
        correctGrammaticalCase: function (number, wordKey) {
            return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
        },
        translate: function (number, withoutSuffix, key) {
            var wordKey = translator.words[key];
            if (key.length === 1) {
                return withoutSuffix ? wordKey[0] : wordKey[1];
            } else {
                return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
            }
        }
    };

    return moment.defineLocale('sr-cyrl', {
        months: ['ΡΠ°Π½ΡΠ°Ρ', 'ΡΠ΅Π±ΡΡΠ°Ρ', 'ΠΌΠ°ΡΡ', 'Π°ΠΏΡΠΈΠ»', 'ΠΌΠ°Ρ', 'ΡΡΠ½', 'ΡΡΠ»', 'Π°Π²Π³ΡΡΡ', 'ΡΠ΅ΠΏΡΠ΅ΠΌΠ±Π°Ρ', 'ΠΎΠΊΡΠΎΠ±Π°Ρ', 'Π½ΠΎΠ²Π΅ΠΌΠ±Π°Ρ', 'Π΄Π΅ΡΠ΅ΠΌΠ±Π°Ρ'],
        monthsShort: ['ΡΠ°Π½.', 'ΡΠ΅Π±.', 'ΠΌΠ°Ρ.', 'Π°ΠΏΡ.', 'ΠΌΠ°Ρ', 'ΡΡΠ½', 'ΡΡΠ»', 'Π°Π²Π³.', 'ΡΠ΅ΠΏ.', 'ΠΎΠΊΡ.', 'Π½ΠΎΠ².', 'Π΄Π΅Ρ.'],
        weekdays: ['Π½Π΅Π΄Π΅ΡΠ°', 'ΠΏΠΎΠ½Π΅Π΄Π΅ΡΠ°ΠΊ', 'ΡΡΠΎΡΠ°ΠΊ', 'ΡΡΠ΅Π΄Π°', 'ΡΠ΅ΡΠ²ΡΡΠ°ΠΊ', 'ΠΏΠ΅ΡΠ°ΠΊ', 'ΡΡΠ±ΠΎΡΠ°'],
        weekdaysShort: ['Π½Π΅Π΄.', 'ΠΏΠΎΠ½.', 'ΡΡΠΎ.', 'ΡΡΠ΅.', 'ΡΠ΅Ρ.', 'ΠΏΠ΅Ρ.', 'ΡΡΠ±.'],
        weekdaysMin: ['Π½Π΅', 'ΠΏΠΎ', 'ΡΡ', 'ΡΡ', 'ΡΠ΅', 'ΠΏΠ΅', 'ΡΡ'],
        longDateFormat: {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L: 'DD. MM. YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY LT',
            LLLL: 'dddd, D. MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[Π΄Π°Π½Π°Ρ Ρ] LT',
            nextDay: '[ΡΡΡΡΠ° Ρ] LT',

            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[Ρ] [Π½Π΅Π΄Π΅ΡΡ] [Ρ] LT';
                case 3:
                    return '[Ρ] [ΡΡΠ΅Π΄Ρ] [Ρ] LT';
                case 6:
                    return '[Ρ] [ΡΡΠ±ΠΎΡΡ] [Ρ] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[Ρ] dddd [Ρ] LT';
                }
            },
            lastDay  : '[ΡΡΡΠ΅ Ρ] LT',
            lastWeek : function () {
                var lastWeekDays = [
                    '[ΠΏΡΠΎΡΠ»Π΅] [Π½Π΅Π΄Π΅ΡΠ΅] [Ρ] LT',
                    '[ΠΏΡΠΎΡΠ»ΠΎΠ³] [ΠΏΠΎΠ½Π΅Π΄Π΅ΡΠΊΠ°] [Ρ] LT',
                    '[ΠΏΡΠΎΡΠ»ΠΎΠ³] [ΡΡΠΎΡΠΊΠ°] [Ρ] LT',
                    '[ΠΏΡΠΎΡΠ»Π΅] [ΡΡΠ΅Π΄Π΅] [Ρ] LT',
                    '[ΠΏΡΠΎΡΠ»ΠΎΠ³] [ΡΠ΅ΡΠ²ΡΡΠΊΠ°] [Ρ] LT',
                    '[ΠΏΡΠΎΡΠ»ΠΎΠ³] [ΠΏΠ΅ΡΠΊΠ°] [Ρ] LT',
                    '[ΠΏΡΠΎΡΠ»Π΅] [ΡΡΠ±ΠΎΡΠ΅] [Ρ] LT'
                ];
                return lastWeekDays[this.day()];
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Π·Π° %s',
            past   : 'ΠΏΡΠ΅ %s',
            s      : 'Π½Π΅ΠΊΠΎΠ»ΠΈΠΊΠΎ ΡΠ΅ΠΊΡΠ½Π΄ΠΈ',
            m      : translator.translate,
            mm     : translator.translate,
            h      : translator.translate,
            hh     : translator.translate,
            d      : 'Π΄Π°Π½',
            dd     : translator.translate,
            M      : 'ΠΌΠ΅ΡΠ΅Ρ',
            MM     : translator.translate,
            y      : 'Π³ΠΎΠ΄ΠΈΠ½Ρ',
            yy     : translator.translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Serbian-latin (sr)
// author : Milan JanaΔkoviΔ<milanjanackovic@gmail.com> : https://github.com/milan-j

(function (factory) {
    factory(moment);
}(function (moment) {
    var translator = {
        words: { //Different grammatical cases
            m: ['jedan minut', 'jedne minute'],
            mm: ['minut', 'minute', 'minuta'],
            h: ['jedan sat', 'jednog sata'],
            hh: ['sat', 'sata', 'sati'],
            dd: ['dan', 'dana', 'dana'],
            MM: ['mesec', 'meseca', 'meseci'],
            yy: ['godina', 'godine', 'godina']
        },
        correctGrammaticalCase: function (number, wordKey) {
            return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
        },
        translate: function (number, withoutSuffix, key) {
            var wordKey = translator.words[key];
            if (key.length === 1) {
                return withoutSuffix ? wordKey[0] : wordKey[1];
            } else {
                return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
            }
        }
    };

    return moment.defineLocale('sr', {
        months: ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'],
        monthsShort: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun', 'jul', 'avg.', 'sep.', 'okt.', 'nov.', 'dec.'],
        weekdays: ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'Δetvrtak', 'petak', 'subota'],
        weekdaysShort: ['ned.', 'pon.', 'uto.', 'sre.', 'Δet.', 'pet.', 'sub.'],
        weekdaysMin: ['ne', 'po', 'ut', 'sr', 'Δe', 'pe', 'su'],
        longDateFormat: {
            LT: 'H:mm',
            LTS : 'LT:ss',
            L: 'DD. MM. YYYY',
            LL: 'D. MMMM YYYY',
            LLL: 'D. MMMM YYYY LT',
            LLLL: 'dddd, D. MMMM YYYY LT'
        },
        calendar: {
            sameDay: '[danas u] LT',
            nextDay: '[sutra u] LT',

            nextWeek: function () {
                switch (this.day()) {
                case 0:
                    return '[u] [nedelju] [u] LT';
                case 3:
                    return '[u] [sredu] [u] LT';
                case 6:
                    return '[u] [subotu] [u] LT';
                case 1:
                case 2:
                case 4:
                case 5:
                    return '[u] dddd [u] LT';
                }
            },
            lastDay  : '[juΔe u] LT',
            lastWeek : function () {
                var lastWeekDays = [
                    '[proΕ‘le] [nedelje] [u] LT',
                    '[proΕ‘log] [ponedeljka] [u] LT',
                    '[proΕ‘log] [utorka] [u] LT',
                    '[proΕ‘le] [srede] [u] LT',
                    '[proΕ‘log] [Δetvrtka] [u] LT',
                    '[proΕ‘log] [petka] [u] LT',
                    '[proΕ‘le] [subote] [u] LT'
                ];
                return lastWeekDays[this.day()];
            },
            sameElse : 'L'
        },
        relativeTime : {
            future : 'za %s',
            past   : 'pre %s',
            s      : 'nekoliko sekundi',
            m      : translator.translate,
            mm     : translator.translate,
            h      : translator.translate,
            hh     : translator.translate,
            d      : 'dan',
            dd     : translator.translate,
            M      : 'mesec',
            MM     : translator.translate,
            y      : 'godinu',
            yy     : translator.translate
        },
        ordinalParse: /\d{1,2}\./,
        ordinal : '%d.',
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : swedish (sv)
// author : Jens Alm : https://github.com/ulmus

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('sv', {
        months : 'januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december'.split('_'),
        monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
        weekdays : 'sΓΆndag_mΓ₯ndag_tisdag_onsdag_torsdag_fredag_lΓΆrdag'.split('_'),
        weekdaysShort : 'sΓΆn_mΓ₯n_tis_ons_tor_fre_lΓΆr'.split('_'),
        weekdaysMin : 'sΓΆ_mΓ₯_ti_on_to_fr_lΓΆ'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'YYYY-MM-DD',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[Idag] LT',
            nextDay: '[Imorgon] LT',
            lastDay: '[IgΓ₯r] LT',
            nextWeek: 'dddd LT',
            lastWeek: '[FΓΆrra] dddd[en] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'om %s',
            past : 'fΓΆr %s sedan',
            s : 'nΓ₯gra sekunder',
            m : 'en minut',
            mm : '%d minuter',
            h : 'en timme',
            hh : '%d timmar',
            d : 'en dag',
            dd : '%d dagar',
            M : 'en mΓ₯nad',
            MM : '%d mΓ₯nader',
            y : 'ett Γ₯r',
            yy : '%d Γ₯r'
        },
        ordinalParse: /\d{1,2}(e|a)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (~~(number % 100 / 10) === 1) ? 'e' :
                (b === 1) ? 'a' :
                (b === 2) ? 'a' :
                (b === 3) ? 'e' : 'e';
            return number + output;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : tamil (ta)
// author : Arjunkumar Krishnamoorthy : https://github.com/tk120404

(function (factory) {
    factory(moment);
}(function (moment) {
    /*var symbolMap = {
            '1': 'ΰ―§',
            '2': 'ΰ―¨',
            '3': 'ΰ―©',
            '4': 'ΰ―ͺ',
            '5': 'ΰ―«',
            '6': 'ΰ―¬',
            '7': 'ΰ―­',
            '8': 'ΰ―�',
            '9': 'ΰ――',
            '0': 'ΰ―¦'
        },
        numberMap = {
            'ΰ―§': '1',
            'ΰ―¨': '2',
            'ΰ―©': '3',
            'ΰ―ͺ': '4',
            'ΰ―«': '5',
            'ΰ―¬': '6',
            'ΰ―­': '7',
            'ΰ―�': '8',
            'ΰ――': '9',
            'ΰ―¦': '0'
        }; */

    return moment.defineLocale('ta', {
        months : 'ΰ�ΰ�©ΰ�΅ΰ�°ΰ�Ώ_ΰ�ͺΰ�Ώΰ�ͺΰ―ΰ�°ΰ�΅ΰ�°ΰ�Ώ_ΰ��ΰ�Ύΰ�°ΰ―ΰ�ΰ―_ΰ�ΰ�ͺΰ―ΰ�°ΰ�²ΰ―_ΰ��ΰ―_ΰ�ΰ―ΰ�©ΰ―_ΰ�ΰ―ΰ�²ΰ―_ΰ�ΰ�ΰ�Έΰ―ΰ�ΰ―_ΰ�ΰ―ΰ�ͺΰ―ΰ�ΰ―ΰ��ΰ―ΰ�ͺΰ�°ΰ―_ΰ�ΰ�ΰ―ΰ�ΰ―ΰ�Ύΰ�ͺΰ�°ΰ―_ΰ�¨ΰ�΅ΰ��ΰ―ΰ�ͺΰ�°ΰ―_ΰ�ΰ�Ώΰ�ΰ��ΰ―ΰ�ͺΰ�°ΰ―'.split('_'),
        monthsShort : 'ΰ�ΰ�©ΰ�΅ΰ�°ΰ�Ώ_ΰ�ͺΰ�Ώΰ�ͺΰ―ΰ�°ΰ�΅ΰ�°ΰ�Ώ_ΰ��ΰ�Ύΰ�°ΰ―ΰ�ΰ―_ΰ�ΰ�ͺΰ―ΰ�°ΰ�²ΰ―_ΰ��ΰ―_ΰ�ΰ―ΰ�©ΰ―_ΰ�ΰ―ΰ�²ΰ―_ΰ�ΰ�ΰ�Έΰ―ΰ�ΰ―_ΰ�ΰ―ΰ�ͺΰ―ΰ�ΰ―ΰ��ΰ―ΰ�ͺΰ�°ΰ―_ΰ�ΰ�ΰ―ΰ�ΰ―ΰ�Ύΰ�ͺΰ�°ΰ―_ΰ�¨ΰ�΅ΰ��ΰ―ΰ�ͺΰ�°ΰ―_ΰ�ΰ�Ώΰ�ΰ��ΰ―ΰ�ͺΰ�°ΰ―'.split('_'),
        weekdays : 'ΰ�ΰ�Ύΰ�―ΰ�Ώΰ�±ΰ―ΰ�±ΰ―ΰ�ΰ―ΰ�ΰ�Ώΰ�΄ΰ��ΰ―_ΰ�€ΰ�Ώΰ�ΰ―ΰ�ΰ�ΰ―ΰ�ΰ�Ώΰ�΄ΰ��ΰ―_ΰ�ΰ―ΰ�΅ΰ―ΰ�΅ΰ�Ύΰ�―ΰ―ΰ�ΰ�Ώΰ�΄ΰ��ΰ―_ΰ�ͺΰ―ΰ�€ΰ�©ΰ―ΰ�ΰ�Ώΰ�΄ΰ��ΰ―_ΰ�΅ΰ�Ώΰ�―ΰ�Ύΰ�΄ΰ�ΰ―ΰ�ΰ�Ώΰ�΄ΰ��ΰ―_ΰ�΅ΰ―ΰ�³ΰ―ΰ�³ΰ�Ώΰ�ΰ―ΰ�ΰ�Ώΰ�΄ΰ��ΰ―_ΰ�ΰ�©ΰ�Ώΰ�ΰ―ΰ�ΰ�Ώΰ�΄ΰ��ΰ―'.split('_'),
        weekdaysShort : 'ΰ�ΰ�Ύΰ�―ΰ�Ώΰ�±ΰ―_ΰ�€ΰ�Ώΰ�ΰ―ΰ�ΰ�³ΰ―_ΰ�ΰ―ΰ�΅ΰ―ΰ�΅ΰ�Ύΰ�―ΰ―_ΰ�ͺΰ―ΰ�€ΰ�©ΰ―_ΰ�΅ΰ�Ώΰ�―ΰ�Ύΰ�΄ΰ�©ΰ―_ΰ�΅ΰ―ΰ�³ΰ―ΰ�³ΰ�Ώ_ΰ�ΰ�©ΰ�Ώ'.split('_'),
        weekdaysMin : 'ΰ�ΰ�Ύ_ΰ�€ΰ�Ώ_ΰ�ΰ―_ΰ�ͺΰ―_ΰ�΅ΰ�Ώ_ΰ�΅ΰ―_ΰ�'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY, LT',
            LLLL : 'dddd, D MMMM YYYY, LT'
        },
        calendar : {
            sameDay : '[ΰ�ΰ�©ΰ―ΰ�±ΰ―] LT',
            nextDay : '[ΰ�¨ΰ�Ύΰ�³ΰ―] LT',
            nextWeek : 'dddd, LT',
            lastDay : '[ΰ�¨ΰ―ΰ�±ΰ―ΰ�±ΰ―] LT',
            lastWeek : '[ΰ�ΰ�ΰ�¨ΰ―ΰ�€ ΰ�΅ΰ�Ύΰ�°ΰ��ΰ―] dddd, LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s ΰ�ΰ�²ΰ―',
            past : '%s ΰ��ΰ―ΰ�©ΰ―',
            s : 'ΰ�ΰ�°ΰ― ΰ�ΰ�Ώΰ�² ΰ�΅ΰ�Ώΰ�¨ΰ�Ύΰ�ΰ�Ώΰ�ΰ�³ΰ―',
            m : 'ΰ�ΰ�°ΰ― ΰ�¨ΰ�Ώΰ��ΰ�Ώΰ�ΰ��ΰ―',
            mm : '%d ΰ�¨ΰ�Ώΰ��ΰ�Ώΰ�ΰ�ΰ―ΰ�ΰ�³ΰ―',
            h : 'ΰ�ΰ�°ΰ― ΰ��ΰ�£ΰ�Ώ ΰ�¨ΰ―ΰ�°ΰ��ΰ―',
            hh : '%d ΰ��ΰ�£ΰ�Ώ ΰ�¨ΰ―ΰ�°ΰ��ΰ―',
            d : 'ΰ�ΰ�°ΰ― ΰ�¨ΰ�Ύΰ�³ΰ―',
            dd : '%d ΰ�¨ΰ�Ύΰ�ΰ―ΰ�ΰ�³ΰ―',
            M : 'ΰ�ΰ�°ΰ― ΰ��ΰ�Ύΰ�€ΰ��ΰ―',
            MM : '%d ΰ��ΰ�Ύΰ�€ΰ�ΰ―ΰ�ΰ�³ΰ―',
            y : 'ΰ�ΰ�°ΰ― ΰ�΅ΰ�°ΰ―ΰ�ΰ��ΰ―',
            yy : '%d ΰ�ΰ�£ΰ―ΰ�ΰ―ΰ�ΰ�³ΰ―'
        },
/*        preparse: function (string) {
            return string.replace(/[ΰ―§ΰ―¨ΰ―©ΰ―ͺΰ―«ΰ―¬ΰ―­ΰ―�ΰ――ΰ―¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },*/
        ordinalParse: /\d{1,2}ΰ�΅ΰ�€ΰ―/,
        ordinal : function (number) {
            return number + 'ΰ�΅ΰ�€ΰ―';
        },


        // refer http://ta.wikipedia.org/s/1er1
        meridiemParse: /ΰ�―ΰ�Ύΰ��ΰ��ΰ―|ΰ�΅ΰ―ΰ�ΰ�±ΰ―|ΰ�ΰ�Ύΰ�²ΰ―|ΰ�¨ΰ�£ΰ―ΰ�ͺΰ�ΰ�²ΰ―|ΰ�ΰ�±ΰ―ΰ�ͺΰ�Ύΰ�ΰ―|ΰ��ΰ�Ύΰ�²ΰ―/,
        meridiem : function (hour, minute, isLower) {
            if (hour < 2) {
                return ' ΰ�―ΰ�Ύΰ��ΰ��ΰ―';
            } else if (hour < 6) {
                return ' ΰ�΅ΰ―ΰ�ΰ�±ΰ―';  // ΰ�΅ΰ―ΰ�ΰ�±ΰ―
            } else if (hour < 10) {
                return ' ΰ�ΰ�Ύΰ�²ΰ―'; // ΰ�ΰ�Ύΰ�²ΰ―
            } else if (hour < 14) {
                return ' ΰ�¨ΰ�£ΰ―ΰ�ͺΰ�ΰ�²ΰ―'; // ΰ�¨ΰ�£ΰ―ΰ�ͺΰ�ΰ�²ΰ―
            } else if (hour < 18) {
                return ' ΰ�ΰ�±ΰ―ΰ�ͺΰ�Ύΰ�ΰ―'; // ΰ�ΰ�±ΰ―ΰ�ͺΰ�Ύΰ�ΰ―
            } else if (hour < 22) {
                return ' ΰ��ΰ�Ύΰ�²ΰ―'; // ΰ��ΰ�Ύΰ�²ΰ―
            } else {
                return ' ΰ�―ΰ�Ύΰ��ΰ��ΰ―';
            }
        },
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'ΰ�―ΰ�Ύΰ��ΰ��ΰ―') {
                return hour < 2 ? hour : hour + 12;
            } else if (meridiem === 'ΰ�΅ΰ―ΰ�ΰ�±ΰ―' || meridiem === 'ΰ�ΰ�Ύΰ�²ΰ―') {
                return hour;
            } else if (meridiem === 'ΰ�¨ΰ�£ΰ―ΰ�ͺΰ�ΰ�²ΰ―') {
                return hour >= 10 ? hour : hour + 12;
            } else {
                return hour + 12;
            }
        },
        week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : thai (th)
// author : Kridsada Thanabulpong : https://github.com/sirn

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('th', {
        months : 'ΰΈ‘ΰΈΰΈ£ΰΈ²ΰΈΰΈ‘_ΰΈΰΈΈΰΈ‘ΰΈ ΰΈ²ΰΈΰΈ±ΰΈΰΈΰΉ_ΰΈ‘ΰΈ΅ΰΈΰΈ²ΰΈΰΈ‘_ΰΉΰΈ‘ΰΈ©ΰΈ²ΰΈ’ΰΈ_ΰΈΰΈ€ΰΈ©ΰΈ ΰΈ²ΰΈΰΈ‘_ΰΈ‘ΰΈ΄ΰΈΰΈΈΰΈΰΈ²ΰΈ’ΰΈ_ΰΈΰΈ£ΰΈΰΈΰΈ²ΰΈΰΈ‘_ΰΈͺΰΈ΄ΰΈΰΈ«ΰΈ²ΰΈΰΈ‘_ΰΈΰΈ±ΰΈΰΈ’ΰΈ²ΰΈ’ΰΈ_ΰΈΰΈΈΰΈ₯ΰΈ²ΰΈΰΈ‘_ΰΈΰΈ€ΰΈ¨ΰΈΰΈ΄ΰΈΰΈ²ΰΈ’ΰΈ_ΰΈΰΈ±ΰΈΰΈ§ΰΈ²ΰΈΰΈ‘'.split('_'),
        monthsShort : 'ΰΈ‘ΰΈΰΈ£ΰΈ²_ΰΈΰΈΈΰΈ‘ΰΈ ΰΈ²_ΰΈ‘ΰΈ΅ΰΈΰΈ²_ΰΉΰΈ‘ΰΈ©ΰΈ²_ΰΈΰΈ€ΰΈ©ΰΈ ΰΈ²_ΰΈ‘ΰΈ΄ΰΈΰΈΈΰΈΰΈ²_ΰΈΰΈ£ΰΈΰΈΰΈ²_ΰΈͺΰΈ΄ΰΈΰΈ«ΰΈ²_ΰΈΰΈ±ΰΈΰΈ’ΰΈ²_ΰΈΰΈΈΰΈ₯ΰΈ²_ΰΈΰΈ€ΰΈ¨ΰΈΰΈ΄ΰΈΰΈ²_ΰΈΰΈ±ΰΈΰΈ§ΰΈ²'.split('_'),
        weekdays : 'ΰΈ­ΰΈ²ΰΈΰΈ΄ΰΈΰΈ’ΰΉ_ΰΈΰΈ±ΰΈΰΈΰΈ£ΰΉ_ΰΈ­ΰΈ±ΰΈΰΈΰΈ²ΰΈ£_ΰΈΰΈΈΰΈ_ΰΈΰΈ€ΰΈ«ΰΈ±ΰΈͺΰΈΰΈΰΈ΅_ΰΈ¨ΰΈΈΰΈΰΈ£ΰΉ_ΰΉΰΈͺΰΈ²ΰΈ£ΰΉ'.split('_'),
        weekdaysShort : 'ΰΈ­ΰΈ²ΰΈΰΈ΄ΰΈΰΈ’ΰΉ_ΰΈΰΈ±ΰΈΰΈΰΈ£ΰΉ_ΰΈ­ΰΈ±ΰΈΰΈΰΈ²ΰΈ£_ΰΈΰΈΈΰΈ_ΰΈΰΈ€ΰΈ«ΰΈ±ΰΈͺ_ΰΈ¨ΰΈΈΰΈΰΈ£ΰΉ_ΰΉΰΈͺΰΈ²ΰΈ£ΰΉ'.split('_'), // yes, three characters difference
        weekdaysMin : 'ΰΈ­ΰΈ²._ΰΈ._ΰΈ­._ΰΈ._ΰΈΰΈ€._ΰΈ¨._ΰΈͺ.'.split('_'),
        longDateFormat : {
            LT : 'H ΰΈΰΈ²ΰΈ¬ΰΈ΄ΰΈΰΈ² m ΰΈΰΈ²ΰΈΰΈ΅',
            LTS : 'LT s ΰΈ§ΰΈ΄ΰΈΰΈ²ΰΈΰΈ΅',
            L : 'YYYY/MM/DD',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY ΰΉΰΈ§ΰΈ₯ΰΈ² LT',
            LLLL : 'ΰΈ§ΰΈ±ΰΈddddΰΈΰΈ΅ΰΉ D MMMM YYYY ΰΉΰΈ§ΰΈ₯ΰΈ² LT'
        },
        meridiemParse: /ΰΈΰΉΰΈ­ΰΈΰΉΰΈΰΈ΅ΰΉΰΈ’ΰΈ|ΰΈ«ΰΈ₯ΰΈ±ΰΈΰΉΰΈΰΈ΅ΰΉΰΈ’ΰΈ/,
        isPM: function (input) {
            return input === 'ΰΈ«ΰΈ₯ΰΈ±ΰΈΰΉΰΈΰΈ΅ΰΉΰΈ’ΰΈ';
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 12) {
                return 'ΰΈΰΉΰΈ­ΰΈΰΉΰΈΰΈ΅ΰΉΰΈ’ΰΈ';
            } else {
                return 'ΰΈ«ΰΈ₯ΰΈ±ΰΈΰΉΰΈΰΈ΅ΰΉΰΈ’ΰΈ';
            }
        },
        calendar : {
            sameDay : '[ΰΈ§ΰΈ±ΰΈΰΈΰΈ΅ΰΉ ΰΉΰΈ§ΰΈ₯ΰΈ²] LT',
            nextDay : '[ΰΈΰΈ£ΰΈΈΰΉΰΈΰΈΰΈ΅ΰΉ ΰΉΰΈ§ΰΈ₯ΰΈ²] LT',
            nextWeek : 'dddd[ΰΈ«ΰΈΰΉΰΈ² ΰΉΰΈ§ΰΈ₯ΰΈ²] LT',
            lastDay : '[ΰΉΰΈ‘ΰΈ·ΰΉΰΈ­ΰΈ§ΰΈ²ΰΈΰΈΰΈ΅ΰΉ ΰΉΰΈ§ΰΈ₯ΰΈ²] LT',
            lastWeek : '[ΰΈ§ΰΈ±ΰΈ]dddd[ΰΈΰΈ΅ΰΉΰΉΰΈ₯ΰΉΰΈ§ ΰΉΰΈ§ΰΈ₯ΰΈ²] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'ΰΈ­ΰΈ΅ΰΈ %s',
            past : '%sΰΈΰΈ΅ΰΉΰΉΰΈ₯ΰΉΰΈ§',
            s : 'ΰΉΰΈ‘ΰΉΰΈΰΈ΅ΰΉΰΈ§ΰΈ΄ΰΈΰΈ²ΰΈΰΈ΅',
            m : '1 ΰΈΰΈ²ΰΈΰΈ΅',
            mm : '%d ΰΈΰΈ²ΰΈΰΈ΅',
            h : '1 ΰΈΰΈ±ΰΉΰΈ§ΰΉΰΈ‘ΰΈ',
            hh : '%d ΰΈΰΈ±ΰΉΰΈ§ΰΉΰΈ‘ΰΈ',
            d : '1 ΰΈ§ΰΈ±ΰΈ',
            dd : '%d ΰΈ§ΰΈ±ΰΈ',
            M : '1 ΰΉΰΈΰΈ·ΰΈ­ΰΈ',
            MM : '%d ΰΉΰΈΰΈ·ΰΈ­ΰΈ',
            y : '1 ΰΈΰΈ΅',
            yy : '%d ΰΈΰΈ΅'
        }
    });
}));
// moment.js locale configuration
// locale : Tagalog/Filipino (tl-ph)
// author : Dan Hagman

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('tl-ph', {
        months : 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split('_'),
        monthsShort : 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
        weekdays : 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split('_'),
        weekdaysShort : 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
        weekdaysMin : 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'MM/D/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM DD, YYYY LT'
        },
        calendar : {
            sameDay: '[Ngayon sa] LT',
            nextDay: '[Bukas sa] LT',
            nextWeek: 'dddd [sa] LT',
            lastDay: '[Kahapon sa] LT',
            lastWeek: 'dddd [huling linggo] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'sa loob ng %s',
            past : '%s ang nakalipas',
            s : 'ilang segundo',
            m : 'isang minuto',
            mm : '%d minuto',
            h : 'isang oras',
            hh : '%d oras',
            d : 'isang araw',
            dd : '%d araw',
            M : 'isang buwan',
            MM : '%d buwan',
            y : 'isang taon',
            yy : '%d taon'
        },
        ordinalParse: /\d{1,2}/,
        ordinal : function (number) {
            return number;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : turkish (tr)
// authors : Erhan Gundogan : https://github.com/erhangundogan,
//           Burak YiΔit Kaya: https://github.com/BYK

(function (factory) {
    factory(moment);
}(function (moment) {
    var suffixes = {
        1: '\'inci',
        5: '\'inci',
        8: '\'inci',
        70: '\'inci',
        80: '\'inci',

        2: '\'nci',
        7: '\'nci',
        20: '\'nci',
        50: '\'nci',

        3: '\'ΓΌncΓΌ',
        4: '\'ΓΌncΓΌ',
        100: '\'ΓΌncΓΌ',

        6: '\'ncΔ±',

        9: '\'uncu',
        10: '\'uncu',
        30: '\'uncu',

        60: '\'Δ±ncΔ±',
        90: '\'Δ±ncΔ±'
    };

    return moment.defineLocale('tr', {
        months : 'Ocak_Εubat_Mart_Nisan_MayΔ±s_Haziran_Temmuz_AΔustos_EylΓΌl_Ekim_KasΔ±m_AralΔ±k'.split('_'),
        monthsShort : 'Oca_Εub_Mar_Nis_May_Haz_Tem_AΔu_Eyl_Eki_Kas_Ara'.split('_'),
        weekdays : 'Pazar_Pazartesi_SalΔ±_ΓarΕamba_PerΕembe_Cuma_Cumartesi'.split('_'),
        weekdaysShort : 'Paz_Pts_Sal_Γar_Per_Cum_Cts'.split('_'),
        weekdaysMin : 'Pz_Pt_Sa_Γa_Pe_Cu_Ct'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd, D MMMM YYYY LT'
        },
        calendar : {
            sameDay : '[bugΓΌn saat] LT',
            nextDay : '[yarΔ±n saat] LT',
            nextWeek : '[haftaya] dddd [saat] LT',
            lastDay : '[dΓΌn] LT',
            lastWeek : '[geΓ§en hafta] dddd [saat] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : '%s sonra',
            past : '%s ΓΆnce',
            s : 'birkaΓ§ saniye',
            m : 'bir dakika',
            mm : '%d dakika',
            h : 'bir saat',
            hh : '%d saat',
            d : 'bir gΓΌn',
            dd : '%d gΓΌn',
            M : 'bir ay',
            MM : '%d ay',
            y : 'bir yΔ±l',
            yy : '%d yΔ±l'
        },
        ordinalParse: /\d{1,2}'(inci|nci|ΓΌncΓΌ|ncΔ±|uncu|Δ±ncΔ±)/,
        ordinal : function (number) {
            if (number === 0) {  // special case for zero
                return number + '\'Δ±ncΔ±';
            }
            var a = number % 10,
                b = number % 100 - a,
                c = number >= 100 ? 100 : null;

            return number + (suffixes[a] || suffixes[b] || suffixes[c]);
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Morocco Central Atlas TamaziΙ£t in Latin (tzm-latn)
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('tzm-latn', {
        months : 'innayr_brΛ€ayrΛ€_marΛ€sΛ€_ibrir_mayyw_ywnyw_ywlywz_Ι£wΕ‘t_Ε‘wtanbir_ktΛ€wbrΛ€_nwwanbir_dwjnbir'.split('_'),
        monthsShort : 'innayr_brΛ€ayrΛ€_marΛ€sΛ€_ibrir_mayyw_ywnyw_ywlywz_Ι£wΕ‘t_Ε‘wtanbir_ktΛ€wbrΛ€_nwwanbir_dwjnbir'.split('_'),
        weekdays : 'asamas_aynas_asinas_akras_akwas_asimwas_asiαΈyas'.split('_'),
        weekdaysShort : 'asamas_aynas_asinas_akras_akwas_asimwas_asiαΈyas'.split('_'),
        weekdaysMin : 'asamas_aynas_asinas_akras_akwas_asimwas_asiαΈyas'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[asdkh g] LT',
            nextDay: '[aska g] LT',
            nextWeek: 'dddd [g] LT',
            lastDay: '[assant g] LT',
            lastWeek: 'dddd [g] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'dadkh s yan %s',
            past : 'yan %s',
            s : 'imik',
            m : 'minuαΈ',
            mm : '%d minuαΈ',
            h : 'saΙa',
            hh : '%d tassaΙin',
            d : 'ass',
            dd : '%d ossan',
            M : 'ayowr',
            MM : '%d iyyirn',
            y : 'asgas',
            yy : '%d isgasn'
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : Morocco Central Atlas TamaziΙ£t (tzm)
// author : Abdel Said : https://github.com/abdelsaid

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('tzm', {
        months : 'β΅β΅β΅β΄°β΅’β΅_β΄±β΅β΄°β΅’β΅_β΅β΄°β΅β΅_β΅β΄±β΅β΅β΅_β΅β΄°β΅’β΅’β΅_β΅’β΅β΅β΅’β΅_β΅’β΅β΅β΅’β΅β΅£_β΅β΅β΅β΅_β΅β΅β΅β΄°β΅β΄±β΅β΅_β΄½β΅β΅β΄±β΅_β΅β΅β΅‘β΄°β΅β΄±β΅β΅_β΄·β΅β΅β΅β΄±β΅β΅'.split('_'),
        monthsShort : 'β΅β΅β΅β΄°β΅’β΅_β΄±β΅β΄°β΅’β΅_β΅β΄°β΅β΅_β΅β΄±β΅β΅β΅_β΅β΄°β΅’β΅’β΅_β΅’β΅β΅β΅’β΅_β΅’β΅β΅β΅’β΅β΅£_β΅β΅β΅β΅_β΅β΅β΅β΄°β΅β΄±β΅β΅_β΄½β΅β΅β΄±β΅_β΅β΅β΅‘β΄°β΅β΄±β΅β΅_β΄·β΅β΅β΅β΄±β΅β΅'.split('_'),
        weekdays : 'β΄°β΅β΄°β΅β΄°β΅_β΄°β΅’β΅β΄°β΅_β΄°β΅β΅β΅β΄°β΅_β΄°β΄½β΅β΄°β΅_β΄°β΄½β΅‘β΄°β΅_β΄°β΅β΅β΅β΅‘β΄°β΅_β΄°β΅β΅β΄Ήβ΅’β΄°β΅'.split('_'),
        weekdaysShort : 'β΄°β΅β΄°β΅β΄°β΅_β΄°β΅’β΅β΄°β΅_β΄°β΅β΅β΅β΄°β΅_β΄°β΄½β΅β΄°β΅_β΄°β΄½β΅‘β΄°β΅_β΄°β΅β΅β΅β΅‘β΄°β΅_β΄°β΅β΅β΄Ήβ΅’β΄°β΅'.split('_'),
        weekdaysMin : 'β΄°β΅β΄°β΅β΄°β΅_β΄°β΅’β΅β΄°β΅_β΄°β΅β΅β΅β΄°β΅_β΄°β΄½β΅β΄°β΅_β΄°β΄½β΅‘β΄°β΅_β΄°β΅β΅β΅β΅‘β΄°β΅_β΄°β΅β΅β΄Ήβ΅’β΄°β΅'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS: 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'dddd D MMMM YYYY LT'
        },
        calendar : {
            sameDay: '[β΄°β΅β΄·β΅ β΄΄] LT',
            nextDay: '[β΄°β΅β΄½β΄° β΄΄] LT',
            nextWeek: 'dddd [β΄΄] LT',
            lastDay: '[β΄°β΅β΄°β΅β΅ β΄΄] LT',
            lastWeek: 'dddd [β΄΄] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : 'β΄·β΄°β΄·β΅ β΅ β΅’β΄°β΅ %s',
            past : 'β΅’β΄°β΅ %s',
            s : 'β΅β΅β΅β΄½',
            m : 'β΅β΅β΅β΅β΄Ί',
            mm : '%d β΅β΅β΅β΅β΄Ί',
            h : 'β΅β΄°β΅β΄°',
            hh : '%d β΅β΄°β΅β΅β΄°β΅β΅β΅',
            d : 'β΄°β΅β΅',
            dd : '%d oβ΅β΅β΄°β΅',
            M : 'β΄°β΅’oβ΅β΅',
            MM : '%d β΅β΅’β΅’β΅β΅β΅',
            y : 'β΄°β΅β΄³β΄°β΅',
            yy : '%d β΅β΅β΄³β΄°β΅β΅'
        },
        week : {
            dow : 6, // Saturday is the first day of the week.
            doy : 12  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : ukrainian (uk)
// author : zemlanin : https://github.com/zemlanin
// Author : Menelion ElensΓΊle : https://github.com/Oire

(function (factory) {
    factory(moment);
}(function (moment) {
    function plural(word, num) {
        var forms = word.split('_');
        return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
    }

    function relativeTimeWithPlural(number, withoutSuffix, key) {
        var format = {
            'mm': 'ΡΠ²ΠΈΠ»ΠΈΠ½Π°_ΡΠ²ΠΈΠ»ΠΈΠ½ΠΈ_ΡΠ²ΠΈΠ»ΠΈΠ½',
            'hh': 'Π³ΠΎΠ΄ΠΈΠ½Π°_Π³ΠΎΠ΄ΠΈΠ½ΠΈ_Π³ΠΎΠ΄ΠΈΠ½',
            'dd': 'Π΄Π΅Π½Ρ_Π΄Π½Ρ_Π΄Π½ΡΠ²',
            'MM': 'ΠΌΡΡΡΡΡ_ΠΌΡΡΡΡΡ_ΠΌΡΡΡΡΡΠ²',
            'yy': 'ΡΡΠΊ_ΡΠΎΠΊΠΈ_ΡΠΎΠΊΡΠ²'
        };
        if (key === 'm') {
            return withoutSuffix ? 'ΡΠ²ΠΈΠ»ΠΈΠ½Π°' : 'ΡΠ²ΠΈΠ»ΠΈΠ½Ρ';
        }
        else if (key === 'h') {
            return withoutSuffix ? 'Π³ΠΎΠ΄ΠΈΠ½Π°' : 'Π³ΠΎΠ΄ΠΈΠ½Ρ';
        }
        else {
            return number + ' ' + plural(format[key], +number);
        }
    }

    function monthsCaseReplace(m, format) {
        var months = {
            'nominative': 'ΡΡΡΠ΅Π½Ρ_Π»ΡΡΠΈΠΉ_Π±Π΅ΡΠ΅Π·Π΅Π½Ρ_ΠΊΠ²ΡΡΠ΅Π½Ρ_ΡΡΠ°Π²Π΅Π½Ρ_ΡΠ΅ΡΠ²Π΅Π½Ρ_Π»ΠΈΠΏΠ΅Π½Ρ_ΡΠ΅ΡΠΏΠ΅Π½Ρ_Π²Π΅ΡΠ΅ΡΠ΅Π½Ρ_ΠΆΠΎΠ²ΡΠ΅Π½Ρ_Π»ΠΈΡΡΠΎΠΏΠ°Π΄_Π³ΡΡΠ΄Π΅Π½Ρ'.split('_'),
            'accusative': 'ΡΡΡΠ½Ρ_Π»ΡΡΠΎΠ³ΠΎ_Π±Π΅ΡΠ΅Π·Π½Ρ_ΠΊΠ²ΡΡΠ½Ρ_ΡΡΠ°Π²Π½Ρ_ΡΠ΅ΡΠ²Π½Ρ_Π»ΠΈΠΏΠ½Ρ_ΡΠ΅ΡΠΏΠ½Ρ_Π²Π΅ΡΠ΅ΡΠ½Ρ_ΠΆΠΎΠ²ΡΠ½Ρ_Π»ΠΈΡΡΠΎΠΏΠ°Π΄Π°_Π³ΡΡΠ΄Π½Ρ'.split('_')
        },

        nounCase = (/D[oD]? *MMMM?/).test(format) ?
            'accusative' :
            'nominative';

        return months[nounCase][m.month()];
    }

    function weekdaysCaseReplace(m, format) {
        var weekdays = {
            'nominative': 'Π½Π΅Π΄ΡΠ»Ρ_ΠΏΠΎΠ½Π΅Π΄ΡΠ»ΠΎΠΊ_Π²ΡΠ²ΡΠΎΡΠΎΠΊ_ΡΠ΅ΡΠ΅Π΄Π°_ΡΠ΅ΡΠ²Π΅Ρ_ΠΏβΡΡΠ½ΠΈΡΡ_ΡΡΠ±ΠΎΡΠ°'.split('_'),
            'accusative': 'Π½Π΅Π΄ΡΠ»Ρ_ΠΏΠΎΠ½Π΅Π΄ΡΠ»ΠΎΠΊ_Π²ΡΠ²ΡΠΎΡΠΎΠΊ_ΡΠ΅ΡΠ΅Π΄Ρ_ΡΠ΅ΡΠ²Π΅Ρ_ΠΏβΡΡΠ½ΠΈΡΡ_ΡΡΠ±ΠΎΡΡ'.split('_'),
            'genitive': 'Π½Π΅Π΄ΡΠ»Ρ_ΠΏΠΎΠ½Π΅Π΄ΡΠ»ΠΊΠ°_Π²ΡΠ²ΡΠΎΡΠΊΠ°_ΡΠ΅ΡΠ΅Π΄ΠΈ_ΡΠ΅ΡΠ²Π΅ΡΠ³Π°_ΠΏβΡΡΠ½ΠΈΡΡ_ΡΡΠ±ΠΎΡΠΈ'.split('_')
        },

        nounCase = (/(\[[ΠΠ²Π£Ρ]\]) ?dddd/).test(format) ?
            'accusative' :
            ((/\[?(?:ΠΌΠΈΠ½ΡΠ»ΠΎΡ|Π½Π°ΡΡΡΠΏΠ½ΠΎΡ)? ?\] ?dddd/).test(format) ?
                'genitive' :
                'nominative');

        return weekdays[nounCase][m.day()];
    }

    function processHoursFunction(str) {
        return function () {
            return str + 'ΠΎ' + (this.hours() === 11 ? 'Π±' : '') + '] LT';
        };
    }

    return moment.defineLocale('uk', {
        months : monthsCaseReplace,
        monthsShort : 'ΡΡΡ_Π»ΡΡ_Π±Π΅Ρ_ΠΊΠ²ΡΡ_ΡΡΠ°Π²_ΡΠ΅ΡΠ²_Π»ΠΈΠΏ_ΡΠ΅ΡΠΏ_Π²Π΅Ρ_ΠΆΠΎΠ²Ρ_Π»ΠΈΡΡ_Π³ΡΡΠ΄'.split('_'),
        weekdays : weekdaysCaseReplace,
        weekdaysShort : 'Π½Π΄_ΠΏΠ½_Π²Ρ_ΡΡ_ΡΡ_ΠΏΡ_ΡΠ±'.split('_'),
        weekdaysMin : 'Π½Π΄_ΠΏΠ½_Π²Ρ_ΡΡ_ΡΡ_ΠΏΡ_ΡΠ±'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD.MM.YYYY',
            LL : 'D MMMM YYYY Ρ.',
            LLL : 'D MMMM YYYY Ρ., LT',
            LLLL : 'dddd, D MMMM YYYY Ρ., LT'
        },
        calendar : {
            sameDay: processHoursFunction('[Π‘ΡΠΎΠ³ΠΎΠ΄Π½Ρ '),
            nextDay: processHoursFunction('[ΠΠ°Π²ΡΡΠ° '),
            lastDay: processHoursFunction('[ΠΡΠΎΡΠ° '),
            nextWeek: processHoursFunction('[Π£] dddd ['),
            lastWeek: function () {
                switch (this.day()) {
                case 0:
                case 3:
                case 5:
                case 6:
                    return processHoursFunction('[ΠΠΈΠ½ΡΠ»ΠΎΡ] dddd [').call(this);
                case 1:
                case 2:
                case 4:
                    return processHoursFunction('[ΠΠΈΠ½ΡΠ»ΠΎΠ³ΠΎ] dddd [').call(this);
                }
            },
            sameElse: 'L'
        },
        relativeTime : {
            future : 'Π·Π° %s',
            past : '%s ΡΠΎΠΌΡ',
            s : 'Π΄Π΅ΠΊΡΠ»ΡΠΊΠ° ΡΠ΅ΠΊΡΠ½Π΄',
            m : relativeTimeWithPlural,
            mm : relativeTimeWithPlural,
            h : 'Π³ΠΎΠ΄ΠΈΠ½Ρ',
            hh : relativeTimeWithPlural,
            d : 'Π΄Π΅Π½Ρ',
            dd : relativeTimeWithPlural,
            M : 'ΠΌΡΡΡΡΡ',
            MM : relativeTimeWithPlural,
            y : 'ΡΡΠΊ',
            yy : relativeTimeWithPlural
        },

        // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason

        meridiemParse: /Π½ΠΎΡΡ|ΡΠ°Π½ΠΊΡ|Π΄Π½Ρ|Π²Π΅ΡΠΎΡΠ°/,
        isPM: function (input) {
            return /^(Π΄Π½Ρ|Π²Π΅ΡΠΎΡΠ°)$/.test(input);
        },
        meridiem : function (hour, minute, isLower) {
            if (hour < 4) {
                return 'Π½ΠΎΡΡ';
            } else if (hour < 12) {
                return 'ΡΠ°Π½ΠΊΡ';
            } else if (hour < 17) {
                return 'Π΄Π½Ρ';
            } else {
                return 'Π²Π΅ΡΠΎΡΠ°';
            }
        },

        ordinalParse: /\d{1,2}-(ΠΉ|Π³ΠΎ)/,
        ordinal: function (number, period) {
            switch (period) {
            case 'M':
            case 'd':
            case 'DDD':
            case 'w':
            case 'W':
                return number + '-ΠΉ';
            case 'D':
                return number + '-Π³ΠΎ';
            default:
                return number;
            }
        },

        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 1st is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : uzbek (uz)
// author : Sardor Muminov : https://github.com/muminoff

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('uz', {
        months : 'ΡΠ½Π²Π°ΡΡ_ΡΠ΅Π²ΡΠ°Π»Ρ_ΠΌΠ°ΡΡ_Π°ΠΏΡΠ΅Π»Ρ_ΠΌΠ°ΠΉ_ΠΈΡΠ½Ρ_ΠΈΡΠ»Ρ_Π°Π²Π³ΡΡΡ_ΡΠ΅Π½ΡΡΠ±ΡΡ_ΠΎΠΊΡΡΠ±ΡΡ_Π½ΠΎΡΠ±ΡΡ_Π΄Π΅ΠΊΠ°Π±ΡΡ'.split('_'),
        monthsShort : 'ΡΠ½Π²_ΡΠ΅Π²_ΠΌΠ°Ρ_Π°ΠΏΡ_ΠΌΠ°ΠΉ_ΠΈΡΠ½_ΠΈΡΠ»_Π°Π²Π³_ΡΠ΅Π½_ΠΎΠΊΡ_Π½ΠΎΡ_Π΄Π΅ΠΊ'.split('_'),
        weekdays : 'Π―ΠΊΡΠ°Π½Π±Π°_ΠΡΡΠ°Π½Π±Π°_Π‘Π΅ΡΠ°Π½Π±Π°_Π§ΠΎΡΡΠ°Π½Π±Π°_ΠΠ°ΠΉΡΠ°Π½Π±Π°_ΠΡΠΌΠ°_Π¨Π°Π½Π±Π°'.split('_'),
        weekdaysShort : 'Π―ΠΊΡ_ΠΡΡ_Π‘Π΅Ρ_Π§ΠΎΡ_ΠΠ°ΠΉ_ΠΡΠΌ_Π¨Π°Π½'.split('_'),
        weekdaysMin : 'Π―ΠΊ_ΠΡ_Π‘Π΅_Π§ΠΎ_ΠΠ°_ΠΡ_Π¨Π°'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM YYYY',
            LLL : 'D MMMM YYYY LT',
            LLLL : 'D MMMM YYYY, dddd LT'
        },
        calendar : {
            sameDay : '[ΠΡΠ³ΡΠ½ ΡΠΎΠ°Ρ] LT [Π΄Π°]',
            nextDay : '[Π­ΡΡΠ°Π³Π°] LT [Π΄Π°]',
            nextWeek : 'dddd [ΠΊΡΠ½ΠΈ ΡΠΎΠ°Ρ] LT [Π΄Π°]',
            lastDay : '[ΠΠ΅ΡΠ° ΡΠΎΠ°Ρ] LT [Π΄Π°]',
            lastWeek : '[Π£ΡΠ³Π°Π½] dddd [ΠΊΡΠ½ΠΈ ΡΠΎΠ°Ρ] LT [Π΄Π°]',
            sameElse : 'L'
        },
        relativeTime : {
            future : 'Π―ΠΊΠΈΠ½ %s ΠΈΡΠΈΠ΄Π°',
            past : 'ΠΠΈΡ Π½Π΅ΡΠ° %s ΠΎΠ»Π΄ΠΈΠ½',
            s : 'ΡΡΡΡΠ°Ρ',
            m : 'Π±ΠΈΡ Π΄Π°ΠΊΠΈΠΊΠ°',
            mm : '%d Π΄Π°ΠΊΠΈΠΊΠ°',
            h : 'Π±ΠΈΡ ΡΠΎΠ°Ρ',
            hh : '%d ΡΠΎΠ°Ρ',
            d : 'Π±ΠΈΡ ΠΊΡΠ½',
            dd : '%d ΠΊΡΠ½',
            M : 'Π±ΠΈΡ ΠΎΠΉ',
            MM : '%d ΠΎΠΉ',
            y : 'Π±ΠΈΡ ΠΉΠΈΠ»',
            yy : '%d ΠΉΠΈΠ»'
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 7  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : vietnamese (vi)
// author : Bang Nguyen : https://github.com/bangnk

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('vi', {
        months : 'thΓ‘ng 1_thΓ‘ng 2_thΓ‘ng 3_thΓ‘ng 4_thΓ‘ng 5_thΓ‘ng 6_thΓ‘ng 7_thΓ‘ng 8_thΓ‘ng 9_thΓ‘ng 10_thΓ‘ng 11_thΓ‘ng 12'.split('_'),
        monthsShort : 'Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12'.split('_'),
        weekdays : 'chα»§ nhαΊ­t_thα»© hai_thα»© ba_thα»© tΖ°_thα»© nΔm_thα»© sΓ‘u_thα»© bαΊ£y'.split('_'),
        weekdaysShort : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
        weekdaysMin : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
        longDateFormat : {
            LT : 'HH:mm',
            LTS : 'LT:ss',
            L : 'DD/MM/YYYY',
            LL : 'D MMMM [nΔm] YYYY',
            LLL : 'D MMMM [nΔm] YYYY LT',
            LLLL : 'dddd, D MMMM [nΔm] YYYY LT',
            l : 'DD/M/YYYY',
            ll : 'D MMM YYYY',
            lll : 'D MMM YYYY LT',
            llll : 'ddd, D MMM YYYY LT'
        },
        calendar : {
            sameDay: '[HΓ΄m nay lΓΊc] LT',
            nextDay: '[NgΓ y mai lΓΊc] LT',
            nextWeek: 'dddd [tuαΊ§n tα»i lΓΊc] LT',
            lastDay: '[HΓ΄m qua lΓΊc] LT',
            lastWeek: 'dddd [tuαΊ§n rα»i lΓΊc] LT',
            sameElse: 'L'
        },
        relativeTime : {
            future : '%s tα»i',
            past : '%s trΖ°α»c',
            s : 'vΓ i giΓ’y',
            m : 'mα»t phΓΊt',
            mm : '%d phΓΊt',
            h : 'mα»t giα»',
            hh : '%d giα»',
            d : 'mα»t ngΓ y',
            dd : '%d ngΓ y',
            M : 'mα»t thΓ‘ng',
            MM : '%d thΓ‘ng',
            y : 'mα»t nΔm',
            yy : '%d nΔm'
        },
        ordinalParse: /\d{1,2}/,
        ordinal : function (number) {
            return number;
        },
        week : {
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : chinese (zh-cn)
// author : suupic : https://github.com/suupic
// author : Zeno Zeng : https://github.com/zenozeng

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('zh-cn', {
        months : 'δΈζ_δΊζ_δΈζ_εζ_δΊζ_ε­ζ_δΈζ_ε«ζ_δΉζ_εζ_εδΈζ_εδΊζ'.split('_'),
        monthsShort : '1ζ_2ζ_3ζ_4ζ_5ζ_6ζ_7ζ_8ζ_9ζ_10ζ_11ζ_12ζ'.split('_'),
        weekdays : 'ζζζ₯_ζζδΈ_ζζδΊ_ζζδΈ_ζζε_ζζδΊ_ζζε­'.split('_'),
        weekdaysShort : 'ε¨ζ₯_ε¨δΈ_ε¨δΊ_ε¨δΈ_ε¨ε_ε¨δΊ_ε¨ε­'.split('_'),
        weekdaysMin : 'ζ₯_δΈ_δΊ_δΈ_ε_δΊ_ε­'.split('_'),
        longDateFormat : {
            LT : 'AhηΉmm',
            LTS : 'AhηΉmεsη§',
            L : 'YYYY-MM-DD',
            LL : 'YYYYεΉ΄MMMDζ₯',
            LLL : 'YYYYεΉ΄MMMDζ₯LT',
            LLLL : 'YYYYεΉ΄MMMDζ₯ddddLT',
            l : 'YYYY-MM-DD',
            ll : 'YYYYεΉ΄MMMDζ₯',
            lll : 'YYYYεΉ΄MMMDζ₯LT',
            llll : 'YYYYεΉ΄MMMDζ₯ddddLT'
        },
        meridiemParse: /εζ¨|ζ©δΈ|δΈε|δΈ­ε|δΈε|ζδΈ/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'εζ¨' || meridiem === 'ζ©δΈ' ||
                    meridiem === 'δΈε') {
                return hour;
            } else if (meridiem === 'δΈε' || meridiem === 'ζδΈ') {
                return hour + 12;
            } else {
                // 'δΈ­ε'
                return hour >= 11 ? hour : hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return 'εζ¨';
            } else if (hm < 900) {
                return 'ζ©δΈ';
            } else if (hm < 1130) {
                return 'δΈε';
            } else if (hm < 1230) {
                return 'δΈ­ε';
            } else if (hm < 1800) {
                return 'δΈε';
            } else {
                return 'ζδΈ';
            }
        },
        calendar : {
            sameDay : function () {
                return this.minutes() === 0 ? '[δ»ε€©]Ah[ηΉζ΄]' : '[δ»ε€©]LT';
            },
            nextDay : function () {
                return this.minutes() === 0 ? '[ζε€©]Ah[ηΉζ΄]' : '[ζε€©]LT';
            },
            lastDay : function () {
                return this.minutes() === 0 ? '[ζ¨ε€©]Ah[ηΉζ΄]' : '[ζ¨ε€©]LT';
            },
            nextWeek : function () {
                var startOfWeek, prefix;
                startOfWeek = moment().startOf('week');
                prefix = this.unix() - startOfWeek.unix() >= 7 * 24 * 3600 ? '[δΈ]' : '[ζ¬]';
                return this.minutes() === 0 ? prefix + 'dddAhηΉζ΄' : prefix + 'dddAhηΉmm';
            },
            lastWeek : function () {
                var startOfWeek, prefix;
                startOfWeek = moment().startOf('week');
                prefix = this.unix() < startOfWeek.unix()  ? '[δΈ]' : '[ζ¬]';
                return this.minutes() === 0 ? prefix + 'dddAhηΉζ΄' : prefix + 'dddAhηΉmm';
            },
            sameElse : 'LL'
        },
        ordinalParse: /\d{1,2}(ζ₯|ζ|ε¨)/,
        ordinal : function (number, period) {
            switch (period) {
            case 'd':
            case 'D':
            case 'DDD':
                return number + 'ζ₯';
            case 'M':
                return number + 'ζ';
            case 'w':
            case 'W':
                return number + 'ε¨';
            default:
                return number;
            }
        },
        relativeTime : {
            future : '%sε',
            past : '%sε',
            s : 'ε η§',
            m : '1ει',
            mm : '%dει',
            h : '1ε°ζΆ',
            hh : '%dε°ζΆ',
            d : '1ε€©',
            dd : '%dε€©',
            M : '1δΈͺζ',
            MM : '%dδΈͺζ',
            y : '1εΉ΄',
            yy : '%dεΉ΄'
        },
        week : {
            // GB/T 7408-1994γζ°ζ�εεδΊ€ζ’ζ ΌεΌΒ·δΏ‘ζ―δΊ€ζ’Β·ζ₯ζεζΆι΄θ‘¨η€Ίζ³γδΈISO 8601:1988η­ζ
            dow : 1, // Monday is the first day of the week.
            doy : 4  // The week that contains Jan 4th is the first week of the year.
        }
    });
}));
// moment.js locale configuration
// locale : traditional chinese (zh-tw)
// author : Ben : https://github.com/ben-lin

(function (factory) {
    factory(moment);
}(function (moment) {
    return moment.defineLocale('zh-tw', {
        months : 'δΈζ_δΊζ_δΈζ_εζ_δΊζ_ε­ζ_δΈζ_ε«ζ_δΉζ_εζ_εδΈζ_εδΊζ'.split('_'),
        monthsShort : '1ζ_2ζ_3ζ_4ζ_5ζ_6ζ_7ζ_8ζ_9ζ_10ζ_11ζ_12ζ'.split('_'),
        weekdays : 'ζζζ₯_ζζδΈ_ζζδΊ_ζζδΈ_ζζε_ζζδΊ_ζζε­'.split('_'),
        weekdaysShort : 'ι±ζ₯_ι±δΈ_ι±δΊ_ι±δΈ_ι±ε_ι±δΊ_ι±ε­'.split('_'),
        weekdaysMin : 'ζ₯_δΈ_δΊ_δΈ_ε_δΊ_ε­'.split('_'),
        longDateFormat : {
            LT : 'Ahι»mm',
            LTS : 'Ahι»mεsη§',
            L : 'YYYYεΉ΄MMMDζ₯',
            LL : 'YYYYεΉ΄MMMDζ₯',
            LLL : 'YYYYεΉ΄MMMDζ₯LT',
            LLLL : 'YYYYεΉ΄MMMDζ₯ddddLT',
            l : 'YYYYεΉ΄MMMDζ₯',
            ll : 'YYYYεΉ΄MMMDζ₯',
            lll : 'YYYYεΉ΄MMMDζ₯LT',
            llll : 'YYYYεΉ΄MMMDζ₯ddddLT'
        },
        meridiemParse: /ζ©δΈ|δΈε|δΈ­ε|δΈε|ζδΈ/,
        meridiemHour : function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === 'ζ©δΈ' || meridiem === 'δΈε') {
                return hour;
            } else if (meridiem === 'δΈ­ε') {
                return hour >= 11 ? hour : hour + 12;
            } else if (meridiem === 'δΈε' || meridiem === 'ζδΈ') {
                return hour + 12;
            }
        },
        meridiem : function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 900) {
                return 'ζ©δΈ';
            } else if (hm < 1130) {
                return 'δΈε';
            } else if (hm < 1230) {
                return 'δΈ­ε';
            } else if (hm < 1800) {
                return 'δΈε';
            } else {
                return 'ζδΈ';
            }
        },
        calendar : {
            sameDay : '[δ»ε€©]LT',
            nextDay : '[ζε€©]LT',
            nextWeek : '[δΈ]ddddLT',
            lastDay : '[ζ¨ε€©]LT',
            lastWeek : '[δΈ]ddddLT',
            sameElse : 'L'
        },
        ordinalParse: /\d{1,2}(ζ₯|ζ|ι±)/,
        ordinal : function (number, period) {
            switch (period) {
            case 'd' :
            case 'D' :
            case 'DDD' :
                return number + 'ζ₯';
            case 'M' :
                return number + 'ζ';
            case 'w' :
            case 'W' :
                return number + 'ι±';
            default :
                return number;
            }
        },
        relativeTime : {
            future : '%sε§',
            past : '%sε',
            s : 'εΉΎη§',
            m : 'δΈει',
            mm : '%dει',
            h : 'δΈε°ζ',
            hh : '%dε°ζ',
            d : 'δΈε€©',
            dd : '%dε€©',
            M : 'δΈεζ',
            MM : '%dεζ',
            y : 'δΈεΉ΄',
            yy : '%dεΉ΄'
        }
    });
}));

    moment.locale('en');


    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    'Accessing Moment through the global scope is ' +
                    'deprecated, and will be removed in an upcoming ' +
                    'release.',
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === 'function' && define.amd) {
        define(function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);