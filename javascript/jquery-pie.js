////////////////////////////////////////////////////////////////////////
// jquery-pie.js
//
// Pies for jQuery.
//
// Copyright (C) 2013 By Don Hopkins.
// All rights reserved.
//
////////////////////////////////////////////////////////////////////////
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
////////////////////////////////////////////////////////////////////////
//
// Handlers for pies, pie slices and pie items:
//
// pie(config) - pie configuration (define parameters and pies)
// piedown(event, pie) - start event (low level mouse/touch/pen tracking)
// piemove(event, pie) - move event (low level mouse/touch/pen tracking)
// pieup(event, pie) - end event (low level mouse/touch/pen tracking)
// piestart(event, pie) - pie starts tracking (popped up, either top level or sub menu)
// piestop(event, pie) - pie ends tracking (popped down, either by select or cancel)
// piepin(event, pie) - pie pinned (clicked up, stays up while button not pressed)
// pieunpin(event, pie) - pie unpinned (clicked down after being pinned)
// piecancel(event, pie) - pie canceled (clicked down without selecting, click in center inactive, press escape)
// pieupdate(event, pie) - pie real time update (between piedown and pieup)
// pieselect(event, pie) - pie menu selected (selected the menu itself, a slice or an item, but not cancel)
// pieslicestart(event, pie, slice) - entered a slice (or slice=null for the inactive center region)
// pieslicestop(event, pie, slice) - left a slice (or slice=null for the inactive center region)
// piesliceupdate(event, pie, slice) - pie slice real time update (when in a slice)
// piesliceselect(event, pie, slice) - pie slice selected (selected the current slice or current item, but not cancel)
// pieitemstart(event, pie, slice, item) - entered an item (or item=null for no item)
// pieitemstop(event, pie, slice, item) - left an item (or item=null for no item)
// pieitemupdate(event, pie, slice, item) - pie item real time update (when in an item)
// pieitemselect(event, pie, slice, item) - pie item selecte (selected the current item, but not cancel)
// pietimer(event, pie, slice, item) - pie timer tick (event is null, item and slice may be null)
//
////////////////////////////////////////////////////////////////////////


(function($) {

    // _getCallerLog returns a string with the name of the log function
    // that called it (i.e. LOG, WARNING, ERROR), followed by a string
    // specifying the file and line number of the code that called the
    // logging function, in a format that turns into a link in the
    // Chrome debugger, so you can click on it to jump to the place
    // in the code that wrote the log message.
    function _getCallerLog()
    {
        try {
            throw Error('');
        } catch (err) {
            var stackLines = err.stack.split("\n");
            var loggerLine = stackLines[4];
            var loggerIndex = loggerLine.indexOf("at ");
            var loggerName = loggerLine.slice(loggerIndex + 3, loggerLine.length).split(' ')[0];
            var callerLine = stackLines[5];
            var callerIndex = callerLine.indexOf("at ");
            var callerSource = callerLine.slice(callerIndex + 3, callerLine.length);
            var callerLog = loggerName + ': ' + callerSource;
            return callerLog;
        }
    }

    // _log is the core of the logging function, which in chrome prints
    // its arguments out as objects you can click on and browse, but
    // in other browsers concatinates them and prints them out as
    // strings.
    function _log()
    {

        var args = [_getCallerLog()];

        for (var argumentIndex = 0, argumentCount = arguments.length;
             argumentIndex < argumentCount;
             argumentIndex++) {

            args.push(
                arguments[argumentIndex]);

        }

        if (navigator.userAgent.indexOf('Chrome') != -1) {
            console.log.apply(console, args);
        } else {
            console.log(args.join(' '));
        }

    }

    // LOG writes a log message to the console.
    function LOG()
    {
        _log.apply(this, arguments);
    }

    // WARNING writes a warning message to the console.
    function WARNING()
    {
        _log.apply(this, arguments);
    }

    // ERROR writes an error message to the console.
    function ERROR()
    {
        _log.apply(this, arguments);
    }

    $.widget('donhopkins.pie', {

        // Class variabls.
        options: {},
        pies: {},

        triggerEvents: 'mousedown.pieTrigger',
        triggerSelector: null,
        triggerData: null,
        initialSliceDirection: 'North',
        defaultPie: 'defaultPie',
        clockwise: true,
        turn: null,
        sliceItemLayout: 'spacedDistance',
        sliceItemTracking: 'closestItem',
        selectItemUnderCursor: true,
        inactiveDistance: 20,
        itemDistanceMin: 120,
        itemDistanceSpacing: 80,
        itemGap: 0,
        itemShear: 30,
        rotateItems: false,
        itemRotation: null,
        stickyPin: false,
        draggyPin: true,
        dragThreshold: 5,
        pieSliced: 1.0,
        nextPie: null,

        pieAttributes: [
            ['clockwise', 'number'],
            ['turn', 'number'],
            ['sliceItemLayout', 'string'],
            ['sliceItemTracking', 'string'],
            ['selectItemUnderCursor', 'boolean'],
            ['timer', 'boolean'],
            ['timerDelay', 'number'],
            ['inactiveDistance', 'number'],
            ['itemDistanceMin', 'number'],
            ['itemDistanceSpacing', 'number'],
            ['itemGap', 'number'],
            ['itemShear', 'number'],
            ['rotateItems', 'boolean'],
            ['itemRotation', 'number'],
            ['stickyPin', 'boolean'],
            ['draggyPin', 'boolean'],
            ['dragThreshold', 'number'],
            ['nextPie', 'string'],
            ['pieSliced', 'number']
        ],

        sliceAttributes: [
            ['sliceItemLayout', 'string'],
            ['sliceItemTracking', 'string'],
            ['selectItemUnderCursor', 'boolean'],
            ['timer', 'boolean'],
            ['timerDelay', 'number'],
            ['inactiveDistance', 'number'],
            ['itemDistanceMin', 'number'],
            ['itemDistanceSpacing', 'number'],
            ['itemGap', 'number'],
            ['itemShear', 'number'],
            ['rotateItems', 'boolean'],
            ['itemRotation', 'number'],
            ['sliceDirection', 'string'],
            ['nextPie', 'string']
        ],

        itemAttributes: [
            ['selectItemUnderCursor', 'boolean'],
            ['timer', 'boolean'],
            ['timerDelay', 'number'],
            ['itemDistanceMin', 'number'],
            ['itemDistanceSpacing', 'number'],
            ['itemGap', 'number'],
            ['itemShear', 'number'],
            ['rotateItems', 'boolean'],
            ['itemRotation', 'number'],
            ['nextPie', 'string']
        ],

        directionNames: {
            'East': 0,
            'Right': 0,
            'NorthEast': 45,
            'North': 90,
            'Up': 90,
            'NorthWest': 135,
            'West': 180,
            'Left': 180,
            'SouthWest': 225,
            'South': 270,
            'Down': 270,
            'SouthEast': 315
        },

        cssClasses: {
            Pie: 'Pie',
            PieBackground: 'PieBackground',
            PieOverlay: 'PieOverlay',
            PieSlices: 'PieSlices',
            PieSlice: 'PieSlice',
            PieSliceHighlight: 'PieSliceHighlight',
            PieSliceBackground: 'PieSliceBackground',
            PieSliceOverlay: 'PieSliceOverlay',
            PieSliceItems: 'PieSliceItems',
            PieItem: 'PieItem',
            PieItemHighlight: 'PieItemHighlight',
            PieItemLink: 'PieItemLink',
            PieItemBackground: 'PieItemBackground',
            PieItemLabel: 'PieItemLabel',
            PieItemOverlay: 'PieItemOverlay',
            PieCaptureOverlay: 'PieCaptureOverlay'
        },

        _setOption: function(key, value) {

            //LOG("pie _setOption:", ["this", this, "key", key, "value", value, "arguments", arguments]);

            $.Widget.prototype._setOption.apply(
                this, arguments);

            switch (key) {

            }

        },

        destroy: function() {

            //LOG("pie destroy:", ["this", this]);

            $.Widget.prototype.destroy.call(this);

        },

        getWidget: function() {
            return this;
        },

        _init: function() {

            //LOG("pie _init:", ["this", this, "arguments", arguments]);

        },

        _create: function() {

            //LOG("pie _create:", ["this", this, "arguments", arguments, "options", this.options]);

            var options = this.options;

            this.currentPie = null;
            this.currentSlice = null;
            this.currentItem = null;
            this.lastSlice = null;
            this.lastItem = null;
            this.finalPie = null;
            this.finalSlice = null;
            this.finalItem = null;
            this.pinned = false;
            this.mouseDown = false;
            this.centerX = 0;
            this.centerY = 0;
            this.currentX = 0;
            this.currentY = 0;
            this.deltaX = 0;
            this.deltaY = 0;
            this.dragStartX = 0;
            this.dragStartY = 0;
            this.dragOffsetX = 0;
            this.dragOffsetY = 0;
            this.dragging = false;
            this.direction = 0;
            this.distance = 0;
            this.notifyDOM = true;
            this.notifyjQuery = true;
            this.notifyDictionaries = true;
            this.timer = false;
            this.timerDelay = 100;
            this.timerTimeout = null;
            this.timerTimeoutDelay = null;

            var cssClasses =
                this._findKeyDefault(
                    'cssClasses',
                    options,
                    this,
                    {});

            var triggerEvents =
                this._findKeyDefault(
                    'triggerEvents',
                    options,
                    this,
                    null);

            var triggerSelector =
                this._findKeyDefault(
                    'triggerSelector',
                    options,
                    this,
                    null);

            var triggerData =
                this._findKeyDefault(
                    'triggerData',
                    options,
                    this,
                    null);

            var widget =
                this;

            if (triggerEvents) {
                this.element
                    .on(triggerEvents,
                        triggerSelector,
                        triggerData,
                        function(event) {
                            //LOG("pie _create on mousedown:", ["this", this, "widget", widget, "handleObj", event.handleObj, "data", event.data]);
                            widget.startPie(event, null, false);
                            return false;
                        });
            }

            this.$body = $(document.body);

            this.$captureOverlay =
                $('<div/>')
                    .addClass(cssClasses.PieCaptureOverlay)
                    .on('mousedown.pieTrack',
                        $.proxy(this._trackDown, this))
                    .on('mousemove.pieTrack',
                        $.proxy(this._trackMove, this))
                    .on('mouseup.pieTrack',
                        $.proxy(this._trackUp, this))
                    .appendTo(this.$body);

        },

        // Utilities

        degToRad: function(deg) {

            return deg * Math.PI / 180;

        },

        radToDeg: function(rad) {

            return rad * 180 / Math.PI;

        },

        normalDeg: function(deg) {

            while (deg < 0) {
                deg += 360;
            }

            while (deg >= 360) {
                deg -= 360;
            }

            return deg;

        },

        offsetToDirectionDeg: function(dx, dy) {

            if ((dx == 0) &&
                (dy == 0)) {
                return 0;
            }

            return this.normalDeg(
                this.radToDeg(
                    Math.atan2(-dy, dx)));

        },

        offsetToDistance: function(dx, dy) {

            return Math.sqrt(
                (dx * dx) +
                (dy * dy));

        },

        readableRotationDeg: function(deg) {

            deg = this.normalDeg(deg);

            if ((deg == 90) || (deg == 270)) {
                deg = 0;
            } else if (deg == 0) {
                deg = 90;
            } else if (deg == 180) {
                deg = -90;
            } else {
                if ((deg > 90) &&
                    (deg < 270)) {
                    deg = this.normalDeg(deg + 180);
                }
            }

            return deg;
        },

        findDefaultPie: function(event, pie) {

            var defaultPie =
                pie ||
                this._findKeyDefault(
                    'defaultPie',
                    this.options,
                    this,
                    null);

            if ((typeof defaultPie) == 'string') {
                defaultPie =
                    this.findPie(event, defaultPie);
            }

            return defaultPie;
        },

        findPie: function(event, pieRef) {

            //LOG("pie findPie:", ["this", this, "event", event, "pieRef", pieRef]);

            var options = this.options;
            var originalPieRef = pieRef;
            var pie = null;

            var findPie =
                this._findKeyDefault(
                    'findPie',
                    options,
                    null);
            if (findPie) {
                pie = findPie.call(this, event, pieRef);

                if ((typeof pie) == 'string') {
                    pieRef = pie;
                    pie = null;
                }

            }

            if (!pie) {

                var pies =
                    this._findKeyDefault(
                        'pies',
                        options,
                        this,
                        null);

                pie = pies && pies[pieRef];

                if ((typeof pie) == 'string') {
                    pieRef = pie;
                    pie = null;
                }

                if (!pie && pieRef) {

                    pie = this.makePieFromDOM(pieRef);
                    pies[pieRef] = pie

                }

            }

            if (!pie) {
                LOG("pie findPie: pieRef not found:", ["this", this, "event", event, "origialPieRef", originalPieRef, "pieRef", pieRef]);
            }

            //LOG("pie findPie result:", ["this", this, "event", event, "originalPieRef", originalPieRef, "pieRef", pieRef, "pie", pie]);

            return pie;

        },

        makePieFromDOM: function(pieName) {

            //LOG("pie makePieFromDOM:", ["this", this, "pieName", pieName]);

            var self = this;
            var options = self.options;
            var $pie = $(pieName);
            var cssClasses =
                self._findKeyDefault(
                    'cssClasses',
                    options,
                    self,
                    {});

            if ($pie.length == 0) {
                return null;
            }

            var $pieBackground = $pie.find('.PieBackground');
            if ($pieBackground.length == 0) {
                $pieBackground = null;
            }

            var $pieSlices = $pie.find('.PieSlices');
            if ($pieSlices.length == 0) {
                $pieSlices = null;
            }

            var $pieOverlay = $pie.find('.PieOverlay');
            if ($pieOverlay.length == 0) {
                $pieOverlay = null;
            }

            // If no intermediate $pieSlices,
            // then create it and move the slices into it,
            // and the overlay after it.
            if (!$pieSlices) {

                $pieSlices =
                    $('<div/>')
                        .attr({
                            'class': cssClasses.PieSlices
                        })
                    .appendTo($pie);

                $pie.find('.PieSlice')
                    .appendTo($pieSlices);

                if ($pieOverlay) {
                    $pieSlices
                        .after($pieOverlay);
                }

            }

            var slices = [];
            var pie = {
                $pie: $pie,
                $pieBackground: $pieBackground,
                $pieSlices: $pieSlices,
                $pieOverlay: $pieOverlay,
                slices: slices
            };

            self._inheritAttributes(
                'pie',
                pie,
                $pie,
                self.pieAttributes);

            var pieDefaults =
                self._findKeyDefault(
                    'pieDefaults',
                    pie,
                    options,
                    self,
                    {});

            self._setDefaultValues(pie, pieDefaults);

            $pieSlices
                .find('.PieSlice')
                .each(function(i) {

                var $slice = $(this);
                var $sliceBackground = $slice.find('.PieSliceBackground');
                var $sliceItems = $slice.find('.PieSliceItems');
                var $sliceOverlay = $slice.find('.PieSliceOverlay');

                // If no intermediate $sliceItems,
                // then create it and move the items into it,
                // and the overlay after it.
                if (!$sliceItems) {

                    $sliceItems =
                        $('<div/>')
                            .attr({
                                'class': cssClasses.PieSliceItems
                            })
                        .appendTo($slice);

                    $slice
                        .find('.PieItem')
                        .appendTo($sliceItems);

                    if ($sliceOverlay) {
                        $sliceItems
                            .after($sliceOverlay);
                    }

                }

                var items = [];
                var slice = {
                    $slice: $slice,
                    $sliceBackground: $sliceBackground,
                    $sliceItems: $sliceItems,
                    $sliceOverlay: $sliceOverlay,
                    items: items
                };

                self._inheritAttributes(
                    'pieslice',
                    slice,
                    slice.$slice,
                    self.sliceAttributes);

                var sliceDefaults =
                    self._findKeyDefault(
                        'sliceDefaults',
                        slice,
                        pie,
                        options,
                        self,
                        {});

                self._setDefaultValues(slice, sliceDefaults);
                    
                slices.push(slice);

                slice.$sliceItems
                    .find('.PieItem')
                    .each(function(i) {

                    var $item = $(this);
                    var $itemBackground = $item.find('.PieItemBackground');
                    var $itemLabel = $item.find('.PieItemLabel');
                    var $itemOverlay = $item.find('.PieItemOverlay');
                    var nextPie = $item.data('pieitem-nextpie');

                    var item = {
                        $item: $item,
                        $itemBackground: $itemBackground,
                        $itemLabel: $itemLabel,
                        $itemOverlay: $itemOverlay,
                        nextPie: nextPie
                    };

                    self._inheritAttributes(
                        'pieitem',
                        item,
                        $item,
                        self.itemAttributes);

                    var itemDefaults =
                        self._findKeyDefault(
                            'itemDefaults',
                            item,
                            slice,
                            pie,
                            options,
                            self,
                            {});

                    self._setDefaultValues(item, itemDefaults);

                    items.push(item);

                });

            });

            return pie;

        },

        _makeDOMFromPie: function(pie) {

            //LOG("pie _makeDOMFromPie:", ["this", this, "pie", pie]);

            var options = this.options;
            var cssClasses =
                this._findKeyDefault(
                    'cssClasses',
                    options,
                    this,
                    {});

            var pieDefaults =
                this._findKeyDefault(
                    'pieDefaults',
                    pie,
                    options,
                    this,
                    {});

            this._setDefaultValues(pie, pieDefaults);

            if (!pie.$pie) {
                pie.$pie =
                    $('<div/>')
                        .attr({
                            'class': cssClasses.Pie
                        })
                        .css({
                            display: 'none'
                        })
                        .appendTo(this.$body);
            }

            var pieCSS =
                this._findKeyDefault(
                    'pieCSS',
                    pie,
                    options,
                    this,
                    null);
            if (pieCSS) {
                pie.$pie.css(pieCSS);
            }

            var pieCSSClass =
                this._findKeyDefault(
                    'pieCSSClass',
                    pie,
                    options,
                    this,
                    null);
            if (pieCSSClass) {
                pie.$pie.addClass(pieCSSClass);
            }

            if (!pie.$pieBackground) {
                pie.$pieBackground =
                    $('<div/>')
                        .attr({
                            'class': cssClasses.PieBackground
                        })
                        .appendTo(pie.$pie);
            }

            var pieBackgroundCSS =
                this._findKeyDefault(
                    'pieBackgroundCSS',
                    pie,
                    options,
                    this,
                    null);
            if (pieBackgroundCSS) {
                pie.$pieBackground.css(pieBackgroundCSS);
            }

            var pieBackgroundCSSClass =
                this._findKeyDefault(
                    'pieBackgroundCSSClass',
                    pie,
                    options,
                    this,
                    null);
            if (pieBackgroundCSSClass) {
                pie.$pieBackground.addClass(pieBackgroundCSSClass);
            }

            if (!pie.$pieSlices) {
                pie.$pieSlices =
                    $('<div/>')
                        .attr({
                            'class': cssClasses.PieSlices
                        })
                        .appendTo(pie.$pie);
            }

            var pieSlicesCSS =
                this._findKeyDefault(
                    'pieSlicesCSS',
                    pie,
                    options,
                    this,
                    null);
            if (pieSlicesCSS) {
                pie.$pieSlices
                    .css(pieSlicesCSS);
            }

            var pieSlicesCSSClass =
                this._findKeyDefault(
                    'pieSlicesCSSClass',
                    pie,
                    options,
                    this,
                    null);
            if (pieSlicesCSSClass) {
                pie.$pieSlices
                    .addClass(pieSlicesCSSClass);
            }

            if (!pie.$pieOverlay) {
                pie.$pieOverlay =
                    $('<div/>')
                        .attr({
                            'class': cssClasses.PieOverlay
                        })
                        .appendTo(pie.$pie);
            }

            var pieOverlayCSS =
                this._findKeyDefault(
                    'pieOverlayCSS',
                    pie,
                    options,
                    this,
                    null);
            if (pieOverlayCSS) {
                pie.$pieOverlay.css(pieOverlayCSS);
            }

            var pieOverlayCSSClass =
                this._findKeyDefault(
                    'pieOverlayCSSClass',
                    pie,
                    options,
                    this,
                    null);
            if (pieOverlayCSSClass) {
                pie.$pieOverlay.addClass(pieOverlayCSSClass);
            }

            var slices = pie.slices || [];

            for (var sliceIndex = 0, sliceCount = slices.length;
                 sliceIndex < sliceCount;
                 sliceIndex++) {

                var slice = slices[sliceIndex];

                var sliceDefaults =
                    this._findKeyDefault(
                        'pieDefaults',
                        slice,
                        pie,
                        options,
                        this,
                        {});

                this._setDefaultValues(slice, sliceDefaults);

                if (!slice.$slice) {
                    slice.$slice =
                        $('<div/>')
                            .attr({
                                'class': cssClasses.PieSlice
                            })
                            .appendTo(pie.$pieSlices);
                }

                var pieSliceCSS =
                    this._findKeyDefault(
                        'pieSliceCSS',
                        slice,
                        pie,
                        options,
                        this,
                        null);
               if (pieSliceCSS) {
                    slice.$slice.css(pieSliceCSS);
                }

                var pieSliceCSSClass =
                    this._findKeyDefault(
                        'pieSliceCSSClass',
                        slice,
                        pie,
                        options,
                        this,
                        null);
                if (pieSliceCSSClass) {
                    slice.$slice.addClass(pieSliceCSSClass);
                }

                if (!slice.$sliceBackground) {
                    slice.$sliceBackground =
                        $('<div/>')
                            .attr({
                                'class': cssClasses.PieSliceBackground
                            })
                            .appendTo(slice.$slice);
                }

                var pieSliceBackgroundCSS =
                    this._findKeyDefault(
                        'pieSliceBackgroundCSS',
                        slice,
                        pie,
                        options,
                        this,
                        null);
                if (pieSliceBackgroundCSS) {
                    slice.$sliceBackground.css(pieSliceBackgroundCSS);
                }

                var pieSliceBackgroundCSSClass =
                    this._findKeyDefault(
                        'pieSliceBackgroundCSSClass',
                        slice,
                        pie,
                        options,
                        this,
                        null);
                if (pieSliceBackgroundCSSClass) {
                    slice.$sliceBackground.addClass(pieSliceBackgroundCSSClass);
                }

                if (!slice.$sliceItems) {
                    slice.$sliceItems =
                        $('<div/>')
                            .attr({
                                'class': cssClasses.PieSliceItems
                            })
                            .appendTo(slice.$slice);
                }

                var pieSliceItemsCSS =
                    this._findKeyDefault(
                        'pieSliceItemsCSS',
                        slice,
                        pie,
                        options,
                        this,
                        null);
                if (pieSliceItemsCSS) {
                    slice.$sliceItems.css(pieSliceItemsCSS);
                }

                var pieSliceItemsCSSClass =
                    this._findKeyDefault(
                        'pieSliceItemsCSSClass',
                        slice,
                        pie,
                        options,
                        this,
                        null);
                if (pieSliceItemsCSSClass) {
                    slice.$sliceItems.addClass(pieSliceItemsCSSClass);
                }

                if (!slice.$sliceOverlay) {
                    slice.$sliceOverlay =
                        $('<div/>')
                            .attr({
                                'class': cssClasses.PieSliceOverlay
                            })
                            .appendTo(slice.$slice);
                }

                var pieSliceOverlayCSS =
                    this._findKeyDefault(
                        'pieSliceOverlayCSS',
                        slice,
                        pie,
                        options,
                        this,
                        null);
                if (pieSliceOverlayCSS) {
                    slice.$sliceOverlay.css(pieSliceOverlayCSS);
                }

                var pieSliceOverlayCSSClass =
                    this._findKeyDefault(
                        'pieSliceOverlayCSSClass',
                        slice,
                        pie,
                        options,
                        this,
                        null);
                if (pieSliceOverlayCSSClass) {
                    slice.$sliceOverlay.addClass(pieSliceOverlayCSSClass);
                }

                var items = slice.items || [];

                for (var itemIndex = 0, itemCount = items.length;
                     itemIndex < itemCount;
                     itemIndex++) {

                    var item = items[itemIndex];

                    var itemDefaults =
                        this._findKeyDefault(
                            'itemDefaults',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            {});

                    this._setDefaultValues(item, itemDefaults);

                    if (!item.$item) {
                        item.$item =
                            $('<div/>')
                                .attr({
                                    'class': cssClasses.PieItem
                                })
                               .appendTo(slice.$sliceItems);
                    }

                    var pieItemCSS =
                        this._findKeyDefault(
                            'pieItemCSS',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            null);
                    if (pieItemCSS) {
                        item.$item.css(pieItemCSS);
                    }

                    var pieItemCSSClass =
                        this._findKeyDefault(
                            'pieItemCSSClass',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            null);
                    if (pieItemCSSClass) {
                        item.$item.addClass(pieItemCSSClass);
                    }

                    var nextPie =
                        this._findKeyDefault(
                            'nextPie',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            null);
                    if (nextPie) {
                        item.$item.addClass(cssClasses.PieItemLink);
                    } else {
                        item.$item.removeClass(cssClasses.PieItemLink);
                    }

                    if (!item.$itemBackground) {
                        item.$itemBackground =
                            $('<div/>')
                                .attr({
                                    'class': cssClasses.PieItemBackground
                                })
                                .appendTo(item.$item);
                    }

                    var pieItemBackgroundCSS =
                        this._findKeyDefault(
                            'pieItemBackgroundCSS',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            null);
                    if (pieItemBackgroundCSS) {
                        item.$itemBackground.css(pieItemBackgroundCSS);
                    }

                    var pieItemBackgroundCSSClass =
                        this._findKeyDefault(
                            'pieItemBackgroundCSSClass',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            null);
                    if (pieItemBackgroundCSSClass) {
                        item.$itemBackground.addClass(pieItemBackgroundCSSClass);
                    }

                    if (!item.$itemLabel) {
                        item.$itemLabel =
                            $('<div/>')
                                .attr({
                                    'class': cssClasses.PieItemLabel
                                })
                                .appendTo(item.$item);
                    }

                    var pieItemLabelCSS =
                        this._findKeyDefault(
                            'pieItemLabelCSS',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            null);
                    if (pieItemLabelCSS) {
                        item.$itemLabel.css(pieItemLabelCSS);
                    }

                    var pieItemLabelCSSClass =
                        this._findKeyDefault(
                            'pieItemLabelCSSClass',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            null);
                    if (pieItemLabelCSSClass) {
                        item.$itemLabel.addClass(pieItemLabelCSSClass);
                    }

                    if (item.label) {
                        item.$itemLabel
                            .html(item.label);
                    }

                    if (!item.$itemOverlay) {
                        item.$itemOverlay =
                            $('<div/>')
                                .attr({
                                    'class': cssClasses.PieItemOverlay
                                })
                                .appendTo(item.$item);
                    }

                    var pieItemOverlayCSS =
                        this._findKeyDefault(
                            'pieItemOverlayCSS',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            null);
                    if (pieItemOverlayCSS) {
                        item.$itemOverlay.css(pieItemOverlayCSS);
                    }

                    var pieItemOverlayCSSClass =
                        this._findKeyDefault(
                            'pieItemOverlayCSSClass',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            null);
                    if (pieItemOverlayCSSClass) {
                        item.$itemOverlay.addClass(pieItemOverlayCSSClass);
                    }

                }

            }

        },

        _removePieSlices: function(pie) {

            if (pie.slices) {

                for (var sliceIndex = 0, sliceCount = pie.slices.length;
                     sliceIndex < sliceCount;
                     sliceIndex++) {

                    var slice = pie.slices[sliceIndex];

                    this._destroySliceDOM(slice, true);

                }

            }

            pie.slices = [];

        },

        _removeSliceItems: function(slice) {

            if (slice.items) {

                for (var itemIndex = 0, itemCount = slice.items.length;
                     itemIndex < itemCount;
                     itemIndex++) {

                    var item = slice.items[itemIndex];

                    this._destroyItemDOM(item, true);

                }

            }

            slice.items = [];

        },

        _destroyPieDOM: function(pie, removeDOM) {

            if (removeDOM && pie.$pie) {
                pie.$pie.remove();
            }

            pie.$pie = pie.$pieBackground = pie.$pieSlices = pie.$pieOverlay = null;

            if (pie.slices) {

                for (var sliceIndex = 0, sliceCount = pie.slices.length;
                     sliceIndex < sliceCount;
                     sliceIndex++) {

                    var slice = pie.slices[sliceIndex];

                    this._destroySliceDOM(slice, false);

                }

            }

        },

        _destroySliceDOM: function(slice, removeDOM) {

            if (removeDOM && slice.$slice) {
                slice.$slice.remove();
            }

            slice.$slice = slice.$sliceBackground = slice.$sliceItems = slice.$sliceOverlay =
                null;

            if (slice.items) {

                for (var itemIndex = 0, itemCount = slice.items.length;
                     itemIndex < itemCount;
                     itemIndex++) {

                    var item = slice.items[itemIndex];

                    this._destroyItemDOM(item, false);

                }

            }

        },

        _destroyItemDOM: function(item, removeDOM) {

            if (removeDOM && item.$item) {
                item.$item.remove();
            }

            item.$item = item.$itemBackground = item.$itemLabel = item.$itemOverlay = null;

        },

        _setDefaultValues: function(dict, defaults) {

            //LOG("pie _setDefaultValues:", ["this", this, "dict", dict, "defaults", defaults]);

            for (var key in defaults) {

                var defaultValue = defaults[key];

                if ((defaultValue !== undefined) &&
                    (dict[key] === undefined)) {

                    dict[key] = defaultValue;

                }

            }

        },

        // _findKeyDefault searches a list of dictionaries for
        // a key, the its value in the first dictionary that
        // contains it, or returns a default value if it's
        // not found. The first argument is the key, the next
        // zero or more arguments are the dictionaries to search,
        // and the last argument is the default value.
        _findKeyDefault: function() {

            //LOG("pie _findKeyDefault:", ["this", this, "arguments", arguments]);

            var argumentCount = arguments.length;

            if (argumentCount < 2) {
                LOG("pie _findKeyDefault: Called with nonsensically too few arguments!", arguments);
                return null;
            }

            // The first argument is the key to search for.
            var key = arguments[0];

            // The last argumnt is the default value so don't search that one.
            argumentCount--;

            for (var argumentIndex = 1;
                 argumentIndex < argumentCount;
                 argumentIndex++) {

                var dict = arguments[argumentIndex];

                // Skip null dicts, for convenience.
                if (!dict) {
                    continue;
                }

                var value = dict[key];

                if (value !== undefined) {
                    // Found it!
                    return value;
                }

            }

            // Didn't find it, so return the default.
            return arguments[argumentCount];

        },

        _inheritAttributes: function(prefix, dict, $el, attributes) {

            //LOG("pie _inheritAttributes:", ["this", this, "prefix", prefix, "dict", dict, "$el", $el, "attributes", attributes]);

            for (var attributeIndex = 0, attributeCount = attributes.length;
                 attributeIndex < attributeCount;
                 attributeIndex++) {

                var attributeDesc = attributes[attributeIndex];
                var attributeKey = attributeDesc[0];
                var attributeType = attributeDesc[1];
                var attributeName = 'data-' + prefix + '-' + attributeKey.toLowerCase();
                var attributeValue = $el.attr(attributeName);

                //LOG("pie _inheritAttributes:", ["this", this, "attributeDesc", attributeDesc, "attributeKey", attributeKey, "attributeType", attributeType, "attributeName", attributeName, "attributeValue", attributeValue]);

                if (attributeValue !== undefined) {

                    switch (attributeType) {

                        case 'string':
                            break;

                        case 'number':
                            attributeValue = parseInt(attributeValue);
                            break;

                        case 'boolean':
                            if (attributeValue == 'true') {
                                attributeValue = true;
                            } else if (attributeValue == 'false') {
                                attributeValue = false;
                            } else {
                                ERROR("pie _inheritAttributes: got unknown boolean:", ["this", this, "attributeValue", typeof attributeValue, attributeValue, "attributeName", attributeName, "$el", $el]);
                            }
                            break;

                        case 'eval':
                            try {
                                attributeValue = eval(attributeValue);
                            } catch (e) {
                                ERROR("pie _inheritAttributes: got error evaluating:", ["this", this, "attributeValue", attributeValue, "attributeName", attributeName, "$el", $el]);
                            }
                            break;

                        default:
                            ERROR("pie _inheritAttributes: got unknown type:", ["this", this, "attributeValue", attributeValue, "attributeName", attributeName, "prefix", prefix, "$el", $el]);
                            break;

                    }

                    dict[attributeKey] = attributeValue;

                    //LOG("pie _inheritAttributes: set:", ["this". this, "dict", dict, "attributeKey", attributeKey, "attributeType", attributeType, "attributeValue", typeof attributeValue, attributeValue, "$el", $el]);

                }

            }

        },

        _layoutPie: function(pie) {

            //LOG("pie _layoutPie:", ["this", this, "pie", pie]);

            var slices = pie.slices;
            var sliceCount = slices.length;

            if (sliceCount == 0) {
                // Nothing to do!
                return;
            }

            var options = this.options;
            var usedDirections = {};
            var sliceIndex;

            // Display the pie so we can measure it, but make it invisible.
            var displaySave = pie.$pie.css('display');

            pie.$pie
                .css({
                    visibility: 'none',
                    display: 'block'
                });

            // First lay out the slices that know what direction they want to go in.
            for (sliceIndex = 0;
                 sliceIndex < sliceCount;
                 sliceIndex++) {

                var slice = slices[sliceIndex];
                var sliceDirection = slice.sliceDirection;
                var dir = this._parseDirection(sliceDirection);

                if (dir == null) {
                    slice.dir = null;
                    continue;
                }

                var dirInt = Math.floor(dir);

                if (usedDirections[dirInt]) {

                    ERROR("pie _layoutPie: got two slices with same direction so ignoring second slice direction:", ["this", this, "sliceDirection", sliceDirection, "dirInt", dirInt, "usedDirections[dirInt]", usedDirections[dirInt], "slice", slice]);

                    slice.sliecDirection = null;
                    slice.dir = null;

                } else {

                    usedDirections[dirInt] = slice;

                    slice.dir = dir;
                    slice.dx = Math.cos(this.degToRad(dir));
                    slice.dy = -Math.sin(this.degToRad(dir));

                }

            }

            // Now lay out the rest of the slices, starting at "initialSliceDirection", 
            // and turning "clockwise" or not, by an angle "turn". 
            // If turn is 0, then calculate the amount to turn so that the number of
            // slices fill up a proportion of the pie defined by pieSlice (i.e. if 
            // pieSlice is one, then fill the whole pie, if pieSlice is 0.5, then fill
            // half the pie, etc. Assign the remaining slices to those directions, 
            // skipping directions that already have slices assigned to them.

            var currentDir =
                this._parseDirection(
                    this._findKeyDefault(
                        'initialSliceDirection',
                        pie,
                        options,
                        this,
                        'North'));
            var clockwise =
                this._findKeyDefault(
                    'clockwise',
                    pie,
                    options,
                    this,
                    true);
            var pieSliced =
                this._findKeyDefault(
                    'pieSliced',
                    pie,
                    options,
                    this,
                    1.0);
            var turn =
                this._findKeyDefault(
                    'turn',
                    pie,
                    options,
                    this,
                    0) ||
                ((clockwise ? -360 : 360) * pieSliced / sliceCount);

            for (sliceIndex = 0;
                 sliceIndex < sliceCount;
                 sliceIndex++) {

                var slice = slices[sliceIndex];
                var sliceDirection = slice.sliceDirection;
                var dir = slice.dir;

                if (dir != null) {
                    continue;
                }

                var currentDirStart = currentDir;

                // Skip used directions, until we find a free direction.
                while (usedDirections[Math.floor(currentDir)]) {

                    //LOG("pie _layoutPie: skipping used dir:", ["this", this, "currentDir", currentDir, "turn", turn]);

                    currentDir = this.normalDeg(currentDir + turn);

                    // If we go full circle and out of free directions, then divide turn
                    // by two, and start filling in the directions between the used slices.
                    if (currentDir == currentDirStart) {

                        //LOG("pie _layoutPie: wrapped around so halving turn and continuing:", ["this", this, "currentDir", currentDir, "turn", turn]);

                        turn /= 2;
                        currentDir = this.normalDeg(dir + turn);
                        currentDirStart = currentDir;

                    }

                }

                // We found a free direction, so point this slice in that direction,
                // and remember we've used it.

                dir = currentDir;
                slice.dir = dir;
                slice.dx = Math.cos(this.degToRad(dir));
                slice.dy = -Math.sin(this.degToRad(dir));
                usedDirections[Math.floor(currentDir)] = slice;

                // Turn to the next direction.
                currentDir = this.normalDeg(currentDir + turn);

                //LOG("pie _layoutPie:", ["this", this, "asliceIndex", sliceIndex, "dir", dir, "dx", dx, "dy", dy, "slices", slice);

            }

            // Now lay out all the items in all the slices, and measure their bounding box.

            var minX = 0;
            var minY = 0;
            var maxX = 0;
            var maxY = 0;

            for (sliceIndex = 0;
                 sliceIndex < sliceCount;
                 sliceIndex++) {

                var slice = slices[sliceIndex];
                var items = slice.items;

                if (!items ||
                    !items.length) {
                    // No items in the slice, so nothing to do here.
                    continue;
                }

                // Find out how the slice wants its item layed out.
                var sliceItemLayout =
                    this._findKeyDefault(
                        'sliceItemLayout',
                        slice,
                        pie,
                        options,
                        this,
                        'equalDistance');

                // Load any generic slice specific parameters, that might be overridden by the item.
                // We load the slice values in param_slice, and them for each item load the item
                // value into param_item, and use it if it's not undefined, else we use param_slice.
                // This saves us from having to repeat the full search for each item.

                var rotateItems_slice =
                    this._findKeyDefault(
                        'rotateItems',
                        slice,
                        pie,
                        options,
                        this,
                        false);
                var itemRotation_slice =
                    this._findKeyDefault(
                        'itemRotation',
                        slice,
                        pie,
                        options,
                        this,
                        null);
                var itemDistanceMin_slice =
                    this._findKeyDefault(
                        'itemDistanceMin',
                        slice,
                        pie,
                        options,
                        this,
                        120);
                var itemDistanceSpacing_slice =
                    this._findKeyDefault(
                        'itemDistanceSpacing',
                        slice,
                        pie,
                        options,
                        this,
                        80);
                var itemGap_slice =
                    this._findKeyDefault(
                        'itemGap',
                        slice,
                        pie,
                        options,
                        this,
                        80);
                var itemShear_slice =
                    this._findKeyDefault(
                        'itemShear',
                        slice,
                        pie,
                        options,
                        this,
                        30);

                // Load any slice parameters specific to the particular item layout policy.
                var sliceLayers = null;
                switch (sliceItemLayout) {

                    case sliceLayers:
                        var sliceLayers =
                            this._findKeyDefault(
                                'sliceLayers',
                                slice,
                                pie,
                                options,
                                this,
                                null);
                        break;
                    
                }

                //LOG("pie _layoutPie:", ["this", this, "sliceIndex", sliceIndex, "dir", dir, "dx", dx, "dy", dy, "slice", slice]);

                var dir = slice.dir;
                var dx = slice.dx;
                var dy = slice.dy;
                var itemDistance = 0;
                var previousItem = null;
                var previousItemCenterX = 0;
                var previousItemCenterY = 0;
                var previousItemLeft = 0;
                var previousItemTop = 0;
                var previousItemRight = 0;
                var previousItemBottom = 0;

                for (var itemIndex = 0, itemCount = items.length;
                     itemIndex < itemCount;
                     itemIndex++,
                     // Set the previous values for the next loop.
                     previousItem = item,
                     previousItemCenterX = itemCenterX,
                     previousItemCenterY = itemCenterY,
                     previousItemLeft = itemLeft,
                     previousItemRight = itemRight,
                     previousItemTop = itemTop,
                     previousItemBottom = itemBottom) {

                    var item = items[itemIndex];

                    // Rotate the item if rotateItems requests
                    // automatic readable rotation by the slice
                    // direction, or if itemRotation specifies an
                    // explicit rotation (which overrides 
                    // rotateItems for this slcie). 

                    var rotateItems_item = item['rotateItems'];
                    var rotateItems =
                        (rotateItems_item === undefined) ? rotateItems_slice : rotateItems_item;

                    var itemRotation_item = item['rotateItems'];
                    var itemRotation =
                        (itemRotation_item === undefined) ? itemRotation_slice : itemRotation_item;

                    var rot =
                        (itemRotation !== null)
                            ? itemRotation
                            : (rotateItems
                                ? this.readableRotationDeg(dir)
                                : 0);

                    item.$item
                        .css({
                            transform: (rot == 0) ? '' : ('rotate(' + rot + 'deg)')
                        });

                    // Now that it's rotated, measure the item's size.
                    var itemCenterX;
                    var itemCenterY;
                    var itemWidth = Math.ceil(item.$itemLabel.outerWidth());
                    var itemHeight = Math.ceil(item.$itemLabel.outerHeight());

                    // Figure out how far out to place and space the items.

                    // NOTE: We could speed these up by caching the value
                    // inherited by the slice, and just checking to see
                    // if the item dict overrides it.

                    var itemDistanceMin =
                        this._findKeyDefault(
                            'itemDistanceMin',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            120);
                    var itemDistanceSpacing =
                        this._findKeyDefault(
                            'itemDistanceSpacing',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            80);
                    var itemGap =
                        this._findKeyDefault(
                            'itemGap',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            80);
                    var itemShear =
                        this._findKeyDefault(
                            'itemShear',
                            item,
                            slice,
                            pie,
                            options,
                            this,
                            30);

                    var itemExtraGap = 0;

                    // Place the items according to the slice's layout policy.

                    switch (sliceItemLayout) {

                        case 'spacedDistance':
                            if (!previousItem) {
                                itemDistance = itemDistanceMin;
                            } else {
                                itemDistance += itemDistanceSpacing;
                            }
                            itemCenterX = dx * itemDistance;
                            itemCenterY = dy * itemDistance;
                            break;

                        case 'minDistance':
                            itemDistance = itemDistanceMin;
                            itemCenterX = dx * itemDistance;
                            itemCenterY = dy * itemDistance;
                            break;

                        case 'nonOverlapping':
                            if (!previousItem) {
                                itemDistance = itemDistanceMin;
                                itemCenterX = dx * itemDistance;
                                itemCenterY = dy * itemDistance;
                                if ((Math.abs(dx) + 0.01) < Math.abs(dy)) {
                                    // vertical
                                    if (dy < 0) {
                                        itemCenterY -= itemHeight / 2;
                                    } else {
                                        itemCenterY += itemHeight / 2;
                                    }
                                    if (Math.abs(dx) > 0.01) {
                                        if (dx > 0) {
                                            itemCenterX += itemWidth / 2;
                                        } else {
                                            itemCenterX -= itemWidth / 2;
                                        }
                                    }
                                } else {
                                    // horizontal
                                    if (dx < 0) {
                                        itemCenterX -= itemWidth / 2;
                                    } else {
                                        itemCenterX += itemWidth / 2;
                                    }
                                    if (Math.abs(dy) > 0.01) {
                                        if (dy < 0) {
                                            itemCenterY += itemHeight / 2;
                                        } else {
                                            itemCenterY -= itemHeight / 2;
                                        }
                                    }
                                }
                            } else {
                                if ((Math.abs(dx) + 0.1) < Math.abs(dy)) {
                                    // vertical
                                    if (dy < 0) {
                                        itemCenterX = previousItemCenterX;
                                        itemCenterY = previousItemTop - (itemHeight / 2) - itemGap - itemExtraGap;
                                    } else {
                                        itemCenterX = previousItemCenterX;
                                        itemCenterY = previousItemBottom + (itemHeight / 2) + itemGap + itemExtraGap;
                                    }
                                    itemCenterX += dx * itemShear;
                                } else {
                                    // horizontal
                                    if (dx < 0) {
                                        itemCenterX = previousItemLeft - (itemWidth / 2) - itemGap - itemExtraGap;
                                        itemCenterY = previousItemCenterY;
                                    } else {
                                        itemCenterX = previousItemRight + (itemWidth / 2) + itemGap + itemExtraGap;
                                        itemCenterY = previousItemCenterY;
                                    }
                                    itemCenterY += dy * itemShear;
                                }
                            }
                            itemCenterX = Math.floor(itemCenterX + 0.5);
                            itemCenterY = Math.floor(itemCenterY + 0.5);
                            break;

                        case 'layered':
                            // The layers parameter is an array describing some number of layers.
                            break;

                        default:
                            ERROR('pie _layoutPie: got invalid sliceItemLayout:', ["sliceItemLayout", sliceItemLayout, "pie", pie, "slice", slice, "item", item]);
                            break;

                    }

                    // Now move the item into place.
                    // TODO: Does this do the right thing with rotated items?

                    var itemMarginLeft =
                         Math.round(itemWidth / -2);
                    var itemMarginTop =
                        Math.round(itemHeight / -2);

                    var itemLeft =
                        itemCenterX + itemMarginLeft;
                    var itemTop =
                        itemCenterY + itemMarginTop;
                    var itemRight =
                        itemLeft + itemWidth;
                    var itemBottom =
                        itemTop + itemHeight;

                    item.x = itemLeft;
                    item.y = itemTop;
                    item.width = itemWidth;
                    item.height = itemHeight;
                    item.centerX = itemCenterX;
                    item.centerY = itemCenterY;

                    item.$item
                        .css({
                            left:   itemLeft,
                            top:    itemTop,
                            width:  itemWidth,
                            height: itemHeight
                        });

                    item.$itemOverlay
                        .css({
                            left:   0,
                            top:    0,
                            width:  itemWidth,
                            height: itemHeight
                        });

                    item.$itemBackground
                        .css({
                            left:   0,
                            top:    0,
                            width:  itemWidth,
                            height: itemHeight
                        });

                    // Update the bounding box of all the items.
                    minX = Math.min(minX, itemLeft);
                    minY = Math.min(minY, itemTop);
                    maxX = Math.max(maxX, itemRight);
                    maxY = Math.max(maxY, itemBottom);

                    //LOG("pie _layoutPie:", ["this", this, "itemIndex", itemIndex, "itemDistance", itemDistance, "itemCenterX", itemCenterX, "itemCenterY", itemCenterY, "itemLeft", itemLeft, "itemTop", itemTop, "itemWidth", itemWidth, "itemHeight", itemHeight, "item", item, "html", item.$item.html()]);

                }

            }

            var pieWidth =
                Math.ceil(maxX - minX);
            var pieHeight =
                Math.ceil(maxY - minY);

            var pieMarginLeft =
                Math.round(minX);
            var pieMarginTop =
                Math.round(minY);

            pie.$pieBackground
                .css({
                    left: -pieMarginLeft,
                    top:  -pieMarginTop
                });

            pie.$pieSlices
                .css({
                    left: -pieMarginLeft,
                    top:  -pieMarginTop
                });

            pie.$pieOverlay
                .css({
                    left: -pieMarginLeft,
                    top:  -pieMarginTop
                });

            pie.$pie
                .css({
                    width:      pieWidth,
                    height:     pieHeight,
                    marginLeft: pieMarginLeft,
                    marginTop:  pieMarginTop,
                    visibility: 'visible',
                    display:    displaySave
                });

        },

        _highlightSlice: function(event, pie, slice, highlight) {

            if (!slice) {
                return;
            }

            var options = this.options;
            var cssClasses =
                this._findKeyDefault(
                    'cssClasses',
                    options,
                    this,
                    {});

            if (highlight) {

                slice.$slice
                    .addClass(
                        cssClasses.PieSliceHighlight);

                slice.$slice
                    .appendTo(
                        slice.$slice
                            .parent());

            } else {

                slice.$slice
                    .removeClass(
                        cssClasses.PieSliceHighlight);

            }

        },

        _highlightItem: function(event, pie, slice, item, highlight) {

            if (!item) {
                return;
            }

            var options = this.options;
            var cssClasses =
                this._findKeyDefault(
                    'cssClasses',
                    options,
                    this,
                    {});

            if (highlight) {

                item.$item
                    .addClass(
                        cssClasses.PieItemHighlight);

                item.$item
                    .appendTo(
                        item.$item
                            .parent());

            } else {

                item.$item
                    .removeClass(
                        cssClasses.PieItemHighlight);

            }

        },

        startPie: function(event, pie, pinned) {

            //LOG("pie startPie:", ["this", this, "event", event, "pie", pie, "pinned", pinned]);

            var options = this.options;

            this._captureInput();

            this.currentPie = this.findDefaultPie(event, pie)

            // Hoist these notifier flags into this for efficiency,
            // since they are not allowed to change dynamicallty.
            this.notifyDOM =
                this._findKeyDefault(
                    'notifyDOM',
                    this.currentPie,
                    options,
                    this,
                    true);
            this.notifyjQuery =
                this._findKeyDefault(
                    'notifyjQuery',
                    this.currentPie,
                    options,
                    this,
                    true);
            this.notifyDictionaries =
                this._findKeyDefault(
                    'notifyDictionaries',
                    this.currentPie,
                    options,
                    this,
                    true);

            this.pinned = pinned;
            this.currentSlice = null;
            this.currentItem = null;

            this._showPie(
                event,
                this.currentPie);

            this._notifyPieStart(
                event,
                this.currentPie);

            this._notifyPieSliceStart(
                event,
                this.currentPie,
                null);

            this._notifyPieItemStart(
                event,
                this.currentPie,
                null,
                null);

            this._trackDown(event, pinned);

            this._updateTimer(true);

        },

        _captureInput: function() {

            //LOG("pie _captureInput:", ["this", this]);

            this.$captureOverlay
                .show();

        },

        _releaseInput: function() {

            this.$captureOverlay
                .hide();

        },

        _trackDown: function(event) {

            //LOG("pie _trackDown:", ["this", this, "event", event, "currentPie", this.currentPie, "currentSlice", this.currentSlice, "currentItem", this.currentItem, "pinned", this.pinned, "deltaX", this.deltaX, "deltaY", this.deltaY, "direction", this.direction, "distance", this.distance]);

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            this.mouseDown = true;
            this.dragging = false;

            if (this.currentPie == null) {
                // No pie active, so do nothing.

                ERROR("pie _trackDown: called with no currentPie:", ["this", this]);

                this._trackDone();

                return;
            }

            var options = this.options;

            this._notifyPieDown(
                event,
                this.currentPie);

            if (this.pinned &&
                this._findKeyDefault(
                    'draggyPin',
                    this.currentPie,
                    this.options,
                    this,
                    false)) {

                this.dragStartX = this.currentX;
                this.dragStartY = this.currentY;
                this.dragOffsetX = this.currentX - this.centerX;
                this.dragOffsetY = this.currentY - this.centerY;

            }

            //LOG("pie _trackDown:", ["this", this, "currentPie", this.currentPie]);

            this._trackCurrentPie(
                event);

            return false;
        },

        _trackMove: function(event) {

            //LOG("pie _trackMove:", ["this", this, "event", event, "currentPie", this.currentPie, "currentSlice", this.currentSlice, "currentItem", this.currentItem, "pinned", this.pinned]);

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            if (this.currentPie == null) {
                // No pie active, so do nothing.
                return;
            }

            if (!this.mouseDown &&
                this._findKeyDefault(
                    'stickyPin',
                    this.currentPie,
                    this.options,
                    this,
                    false)) {

                this._centerPie(
                    event,
                    this.currentPie,
                    0,
                    0);

            }

            if (this.mouseDown &&
                this.pinned &&
                this._findKeyDefault(
                    'draggyPin',
                    this.currentPie,
                    this.options,
                    this,
                    false)) {

                if (!this.dragging) {

                    var dist =
                        this.offsetToDistance(
                            this.currentX - this.dragStartX,
                            this.currentY - this.dragStartY);
                    var dragThreshold =
                        this._findKeyDefault(
                            'dragThreshold',
                            this.currentPie,
                            this.options,
                            this,
                            5);

                    if (dist > dragThreshold) {
                        this.dragging = true;
                    }

                }

                if (this.dragging) {

                    this._centerPie(
                        event,
                        this.currentPie,
                        this.dragOffsetX,
                        this.dragOffsetY);

                }

            }

            this._trackCurrentPie(
                event);

            this._notifyPieMove(
                event,
                this.currentPie);

            return false;
        },

        _trackUp: function(event) {

            //LOG("pie _trackUp:", ["this", this, "event", event, "currentPie", this.currentPie, "currentSlice", this.currentSlice, "currentItem", this.currentItem, "pinned", this.pinned, "deltaX", this.deltaX, "deltaY", this.deltaY, "direction", this.direction, "distance", this.distance]);

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            this.mouseDown = false;

            if (this.currentPie == null) {
                // No pie active, so do nothing.
                return;
            }

            this._trackCurrentPie(
                event);

            this._notifyPieUp(
                event,
                this.currentPie);

            if (this.dragging) {
                return;
            }

            this.finalPie = this.currentPie;
            this.finalSlice = this.currentSlice;
            this.finalItem = this.currentItem;

            this.currentPie.finalSlice = this.currentSlice;
            if (this.currentSlice) {
                this.currentSlice.finalItem = this.currentItem;
            }

            var nextPie = null;

            if (this.currentSlice != null) {

                // In a slice.

                if (this.currentItem != null) {

                    // In an item.

                    //LOG("pie _trackUp: select pie item:", ["this", tis, "currentPie", this.currentPie, "currentSlice", this.currentSlice, "currentItem", this.currentItem]);

                    this._notifyPieItemSelect(
                        event,
                        this.currentPie,
                        this.currentSlice,
                        this.currentItem);

                    nextPie =
                        this._findKeyDefault(
                            'nextPie',
                            this.currentItem,
                            this.currentSlice,
                            this.currentPie,
                            this.options,
                            null);

                    if (nextPie) {
                        nextPie =
                            this.findPie(
                                event,
                                nextPie);
                    }

                    this.currentItem = null;

                    this._highlightItem(
                        event,
                        this.currentPie,
                        this.currentSlice,
                        this.finalItem,
                        false);

                    this._notifyPieItemStop(
                        event,
                        this.currentPie,
                        this.currentSlice,
                        this.finalItem);

                    this._notifyPieItemStart(
                        event,
                        this.currentPie,
                        this.currentSlice,
                        null);

                }

                this._notifyPieSliceSelect(
                    event,
                    this.currentPie,
                    this.currentSlice);

                this.currentSlice = null;

                this._highlightSlice(
                    event,
                    this.currentPie,
                    this.finalSlice,
                    false);

                this._notifyPieSliceStop(
                    event,
                    this.currentPie,
                    this.finalSlice);

                this._notifyPieSliceStart(
                    event,
                    this.currentPie,
                    null);

            }

            this._notifyPieSelect(
                event,
                this.currentPie);

            if (this.finalSlice == null) {

                // No slice selected.

                if (!this.pinned) {

                    // Pin up if not already pinned.

                    this.pinned = true;

                    this._notifyPiePin(
                        event,
                        this.currentPie);

                    // Return without ending pie tracking.

                    return;

                } else {

                    // Cancel if pinned.

                    this._notifyPieCancel(
                        event,
                        this.currentPie);

                    this._trackDone();

                }

            }

            this._hidePie(
                event,
                this.currentPie);

            if (this.pinned) {

                this._notifyPieUnpin(
                    event,
                    this.currentPie);

            }

            this.pinned = false;

            this._notifyPieStop(
                event,
                this.currentPie);

            this.currentPie = null;

            this._updateTimer(false)

            if (nextPie != null) {

                // Keep tracking, and go on to the next pie, starting with it already pinned.

                this.currentPie = nextPie;

                this._notifyPieStart(
                    event,
                    this.currentPie);

                this.pinned = true;

                this._notifyPiePin(
                    event,
                    this.currentPie);

                this._showPie(
                    event,
                    this.currentPie);

                this._trackCurrentPie(
                    event);

            } else {

                // Finished tracking.

                this._trackDone();

            }

            return false;
        },

        _trackDone: function() {

            this.mouseDown = false;

            this._releaseInput();

        },

        _trackTimer: function() {
            if (this._timerTimeout) {
                cancelTimeout(this._timerTimeout);
                this._timerTimeout = null;
                this._timerTimeoutDelay = null;
            }

            this._notifyPieTimer(
                null,
                this.currentPie,
                this.currentSlice,
                this.currentItem);

            this._updateTimer(this.currentPie != null);
        },

        _updateTimer: function(enabled) {

            var timer =
                enabled &&
                this._findKeyDefault(
                    'timer',
                    this.currentItem,
                    this.currentSlice,
                    this.currentPie,
                    this.options,
                    this);

            if (timer) {

                var timerDelay =
                    this._findKeyDefault(
                        'timerDelay',
                        this.currentItem,
                        this.currentSlice,
                        this.currentPie,
                        this.options,
                        this);

                if (!this.timerTimeout ||
                    timerDelay != this.timerTimeoutDelay) {

                    if (this.timerTimeout) {
                        clearTimeout(this.timerTimeout);
                    }

                    this.timerTimeout =
                        setTimeout(
                            $.proxy(this._trackTimer, this),
                            timerDelay);
                    this.timerDelay = timerDelay;

                }

            } else {

                if (this.timerTimeout) {

                    clearTimeout(this.timerTimeout);
                    this.timerTimeout = null;
                    this.timerTimeoutDelay = null;

                }

            }

        },

        _trackCurrentPie: function(event) {

            //LOG("pie _trackCurrentPie: BEGIN:", ["this", this, "event", event, "currentPie", this.currentPie, "slices", this.currentPie.slices]);

            this.currentX = event.pageX;
            this.currentY = event.pageY;

            this.deltaX = this.currentX - this.centerX;
            this.deltaY = this.currentY - this.centerY;

            this.distance =
                this.offsetToDistance(
                    this.deltaX,
                    this.deltaY);

            this.direction =
                this.offsetToDirectionDeg(
                    this.deltaX,
                    this.deltaY);

            this.lastSlice = this.currentSlice;
            this.lastItem = this.currentItem;

            var currentPie = this.currentPie;
            var slices = currentPie && currentPie.slices;

            if (!slices ||
                !slices.length) {
                this.currentSlice = null;
                this.currentItem = null;
                return;
            }

            var options = this.options;
            var foundItem = false;

            var currentSlice =
                this._findSlice(
                    event,
                    this.currentPie);
            this.currentSlice = currentSlice;
            this.currentItem = null;

            // The options or the current slice may inhibit selecting
            // the item under the cursor. Also the item can inhibit it,
            // but we haven't found the item yet! 
            var selectItemUnderCursor =
                this._findKeyDefault(
                    'selectItemUnderCursor',
                    this.currentSlice,
                    currentPie,
                    options,
                    this,
                    {});

            if (selectItemUnderCursor) {

                // Look to see if the cursor is pointing at an item,
                // and select that item no matter what slice it's in.

                var cssClasses =
                    this._findKeyDefault(
                        'cssClasses',
                        options,
                        this,
                        {});

                // Make it so elementFromPoint can see the PieItem class elements in this pie.
                var $items =
                    currentPie.$pie
                        .find('.PieItem');

                $items
                    .css('pointer-events', 'auto');

                var el =
                    document.elementFromPoint(
                        this.currentX,
                        this.currentY);
                var $el = $(el);

                // Make the PieItems invisible to elementFromPoint again.
                $items
                    .css('pointer-events', 'none');

                // Search for that element's item in the slices.

                for (var sliceIndex = 0, sliceCount = slices.length;
                     !foundItem && (sliceIndex < sliceCount);
                     sliceIndex++) {

                    var slice = slices[sliceIndex];
                    var items = slice.items;

                    if (!items || !items.length) {
                        continue;
                    }

                    for (var itemIndex = 0, itemCount = items.length;
                         itemIndex < itemCount;
                         itemIndex++) {

                        var item = items[itemIndex];
                        var $item = item.$item;

                        // The item can also inhibit selecting itself when
                        // when it's under the cursor. (But of course
                        // it can still be selected by the slice in _findItem.)
                        if ($item &&
                            (item.selectItemUnderCursor !== false) &&
                            (($item[0] == el) ||
                             ($.contains($item, $el)))) {

                            foundItem = true;
                            this.currentItem = item;
                            this.currentSlice = slice;
                            break;

                        }

                    }

                }

            }

            // If we didn't find the item under the cursor,
            // and we're currently in a slice, then find the
            // item selected in that slice,
            if (!foundItem &&
                (this.currentSlice != null)) {

                this.currentItem =
                    this._findItem(
                        event,
                        currentPie,
                        this.currentSlice);

            }

            if (this.currentSlice != this.lastSlice) {

                this._highlightSlice(
                    event,
                    this.currentPie,
                    this.lastSlice,
                    false);

                this._notifyPieSliceStop(
                    event,
                    this.currentPie,
                    this.lastSlice);

                this._highlightSlice(
                    event,
                    this.currentPie,
                    this.currentSlice,
                    true);

                this._notifyPieSliceStart(
                    event,
                    this.currentPie,
                    this.currentSlice);

            }

            if (this.currentItem != this.lastItem) {

                this._highlightItem(
                    event,
                    this.currentPie,
                    this.lastSlice,
                    this.lastItem,
                    false);

                this._notifyPieItemStop(
                    event,
                    this.currentPie,
                    this.lastSlice,
                    this.lastItem);

                this._highlightItem(
                    event,
                    this.currentPie,
                    this.currentSlice,
                    this.currentItem,
                    true);

                this._notifyPieItemStart(
                    event,
                    this.currentPie,
                    this.currentSlice,
                    this.currentItem);

            }

            this._notifyPieUpdate(
                event,
                this.currentPie);

            if (this.currentSlice != null) {

                this._notifyPieSliceUpdate(
                    event,
                    this.currentPie,
                    this.currentSlice);

                if (this.currentItem != null) {

                    this._notifyPieItemUpdate(
                        event,
                        this.currentPie,
                        this.currentSlice,
                        this.currentItem);

                }

            }

            this._updateTimer(this.currentPie != null);

            //LOG("pie trackCurrentPie: END:", ["currentPie", this.currentPie, "currentSlice", this.currentSlice, "currentItem", this.currentItem, "slices", this.currentPie.slices]);

        },

        _parseDirection: function(directionSpec) {
            var options = this.options;
            var dir = null;
            var directionNames =
                this._findKeyDefault(
                    'directionNames',
                    options,
                    this,
                    {});

            if ((directionSpec === null) ||
                (directionSpec === undefined)) {

                dir =
                    undefined;

            } else if ((typeof directionSpec) == "number") {

                dir =
                    this.normalDeg(
                        directionSpec);

            } else if ((typeof directionSpec) == "string") {

                dir = directionNames[directionSpec];

                if (dir === undefined) {

                    try {

                        dir =
                            parseFloat(
                                directionSpec);

                    } catch (e) {

                        ERROR("pie _parseDirection: got invalid string direction name:", ["this", this, "directionSpec", directionSpec, "not in directionNames", directionNames, "or convertable to number of degrees"]);

                    }

                }

            } else if ($.isArray(directionSpec)) {

                if (directionSpec.length != 2) {

                    ERROR("pie _parseDirection: got invalid direction spec:", ["this", this, "directionSpec", directionSpec, "not array of two numbers [dx, dy]"]);

                } else {

                    var dx =
                        directionSpec[0];
                    var dy =
                        directionSpec[1];

                    dir =
                        this.offsetToDirectionDeg(
                            dx, dy);

                }

            } else {

                ERROR("pie _parseDirection: got invalid direction spec:", ["directionSpec", directionSpec, "not number of degrees, array of two numbers [dx, dy], or direction name string from", directionNames]);

            }

            return dir;

        },

        _findSlice: function(event, pie) {

            //LOG("pie _findSlice:", ["this", this, "event", event, "pie", pie]);

            var slices = pie.slices;
            var sliceCount = slices.length;

            if (sliceCount == 0) {
                //LOG("pie trackSlice: no slices, returning null:", ["this", this]);
                return null;
            }

            var inactiveDistance =
                this._findKeyDefault(
                    'inactiveDistance',
                    pie,
                    this.options,
                    this,
                    10);

            if (this.distance <= inactiveDistance) {
                //LOG("pie trackSlice: inside inactiveDistance, returning null:", ["this", this, "distance", this.distance, "inactiveDistance", inactiveDistance]);
                return null;
            }

            if (sliceCount == 1) {
                //LOG("pie trackSlice: returning the only slice:", ["this", this, "slice", slices[0]]);
                return slices[0];
            }

            var maxDot = 0;
            var maxDotIndex = null;

            for (var sliceIndex = 0;
                 sliceIndex < sliceCount;
                 sliceIndex++) {

                var slice = slices[sliceIndex];

                var sliceDx = slice.dx;
                var sliceDy = slice.dy;

                var dot =
                    (this.deltaX * sliceDx) +
                    (this.deltaY * sliceDy);

                if (dot > maxDot) {
                    maxDot = dot;
                    maxDotIndex = sliceIndex;
                }

            }

            //LOG("pie trackSlice: returning max dot slice:", ["this", this, "slice", slices[maxDotIndex], "maxDotIndex", maxDotIndex, "deltaX", this.deltaX, "deltaY", this.deltaY, "direction", this.direction, "distance", this.distance]);

            return slices[maxDotIndex];

        },

        _findItem: function(event, pie, slice) {

            //LOG("pie _findItem", ["this", this, "event", event, "pie", pie, "slice", slice]);

            var items = slice.items;
            var itemCount = items && items.length;
            if (!itemCount) {
                return null;
            }

            var options = this.options;
            var sliceItemTracking =
                this._findKeyDefault(
                    'sliceItemTracking',
                    slice,
                    pie,
                    options,
                    this,
                    'target');

            if (sliceItemTracking == 'target') {
                return null;
            }

            if (itemCount == 1) {
                return items[0];
            }

            var minDistanceSquared = 1.0e+6;
            var minDistanceSquaredIndex = null;

            for (var itemIndex = 0;
                 itemIndex < itemCount;
                 itemIndex++) {

                var item = items[itemIndex];

                var itemCenterX =
                    item.centerX;
                var itemCenterY =
                    item.centerY;

                var distanceX =
                    itemCenterX - this.deltaX;
                var distanceY =
                    itemCenterY - this.deltaY;

                var distanceSquared =
                    (distanceX * distanceX) +
                    (distanceY * distanceY);

                if (distanceSquared < minDistanceSquared) {

                    minDistanceSquared =
                        distanceSquared;
                    minDistanceSquaredIndex =
                        itemIndex;

                }

            }

            return items[minDistanceSquaredIndex];

        },

        _showPie: function(event, pie) {

            this._onShowPie(event, pie);

            this._makeDOMFromPie(pie);

            this._layoutPie(pie);

            this._centerPie(
                event,
                pie,
                0,
                0);

        },

        _hidePie: function(event, pie) {

            pie.$pie
                .css({
                    display: 'none'
                });

        },

        _centerPie: function(event, pie, offsetX, offsetY) {

            var x = event.pageX - offsetX;
            var y = event.pageY - offsetY;

            this.centerX = this.currentX = x;
            this.centerY = this.currentY = y;
            this.deltaX = 0;
            this.deltaY = 0;
            this.distance = 0;
            this.direction = 0;

            pie.$pie
                .css({
                    left: x,
                    top: y,
                    display: 'block'
                });

        },

        _onShowPie: function(event, pie) {

            var options = this.options;

            this._notifyPieShow(event, pie);

            var slices = pie.slices;
            var sliceCount = slices ? slices.length : 0;
            if (!sliceCount) {
                return;
            }

            for (var sliceIndex = 0;
                 sliceIndex < sliceCount;
                 sliceIndex++) {

                var slice = slices[sliceIndex];

                this._notifyPieSliceShow(event, pie, slice);

                var items = slice.items;
                var itemCount = items ? items.length : 0;
                if (!itemCount) {
                    continue;
                }

                for (var itemIndex = 0;
                    itemIndex < itemCount;
                    itemIndex++) {

                    var item = items[itemIndex];

                    this._notifyPieItemShow(event, pie, slice, item);
                }

            }

        },

        // These notifiers support three different notification techniques,
        // as well as bubbling from the item, to the slice, to the pie, then
        // to the target.
        //
        // 1) Evaluate on<handle> attributes on DOM elements containing
        //    JavaScript text like:
        //
        //    <element onclick="handleClick(event, pie, slice, item)"/>
        //
        //    The handlers are evaluated in a scope where "this" is
        //    the pie target, and event, slice, and item are defined.
        //
        //    The DOM elements that support handler attributes also have
        //    jQuery wrappers, including item.$item (the root item element), 
        //    slice.$slice (the root slice element), pie.$pie (the root pie 
        //    element) and target.element (the element with the jQuery .pie() 
        //    widget attached).
        //
        //    The JavaScript dictionary handlers can be disabled by
        //    setting options.notifyDOM = false.
        //
        // 2) Trigger jQuery event handlers defined by jQuery on the
        //    pie, slice, item and and target DOM objects, defined like:
        //
        //    $el.on('<handler>", handleEvent(event, pie, slice, item) {...});
        //
        //    Since jQuery event distribution performs its own event bubbling,
        //    we only have to trigger on the leaf element, so the
        //    _notify<pie,slice,item> methods take a "noTrigger" parameter
        //    that we pass as false on the lowest level call, to cause
        //    jQuery to trigger and bubble the event, and we then passed
        //    noTrigger as true to higher level calls, to suppress duplicate
        //    triggering.
        //
        //    The JavaScript dictionary handlers can be disabled by
        //    setting options.notifyjQuery = false.
        //
        // 3) Call JavaScript dictionary handler functions defined in the
        //    item, slice, pie and options dictionaries, defined like:
        //    pie.on<handler> = function(event, pie, slice, item) { ... };
        //
        //    We bubble the events from item dictionary to slice dictionary
        //    to pie dictionary to options dictionary, but bubbling can be
        //    supressed by passing true as the noBubble parameter.
        //
        //    The JavaScript dictionary handlers can be disabled by
        //    setting options.notifyDictionaries = false.
        //

        _notifyPieItemShow: function(event, pie, slice, item, noBubble, noTrigger) {
            this._notifyPieItem('pieitemshow', event, pie, slice, item, noBubble, noTrigger);
        },

        _notifyPieItemStart: function(event, pie, slice, item, noBubble, noTrigger) {
            this._notifyPieItem('pieitemstart', event, pie, slice, item, noBubble, noTrigger);
        },

        _notifyPieItemStop: function(event, pie, slice, item, noBubble, noTrigger) {
            this._notifyPieItem('pieitemstop', event, pie, slice, item, noBubble, noTrigger);
        },

        _notifyPieItemUpdate: function(event, pie, slice, item, noBubble, noTrigger) {
            this._notifyPieItem('pieitemupdate', event, pie, slice, item, noBubble, noTrigger);
        },

        _notifyPieItemSelect: function(event, pie, slice, item, noBubble, noTrigger) {
            this._notifyPieItem('pieitemselect', event, pie, slice, item, noBubble, noTrigger);
        },

        _notifyPieTimer: function(event, pie, slice, item, noBubble, noTrigger) {
            this._notifyPieItem('pietimer', event, pie, slice, item, noBubble, noTrigger);
        },

        _notifyPieSliceShow: function(event, pie, slice, noBubble, noTrigger) {
            this._notifyPieSlice('piesliceshow', event, pie, slice, null, noBubble, noTrigger);
        },

        _notifyPieSliceStart: function(event, pie, slice, noBubble, noTrigger) {
            this._notifyPieSlice('pieslicestart', event, pie, slice, null, noBubble, noTrigger);
        },

        _notifyPieSliceStop: function(event, pie, slice, noBubble, noTrigger) {
            this._notifyPieSlice('pieslicestop', event, pie, slice, null, noBubble, noTrigger);
        },

        _notifyPieSliceUpdate: function(event, pie, slice, noBubble, noTrigger) {
            this._notifyPieSlice('piesliceupdate', event, pie, slice, null, noBubble, noTrigger);
        },

        _notifyPieSliceSelect: function(event, pie, slice, noBubble, noTrigger) {
            this._notifyPieSlice('piesliceselect', event, pie, slice, null, noBubble, noTrigger);
        },

        _notifyPieDown: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('piedown', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieMove: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('piemove', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieUp: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('pieup', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieShow: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('pieshow', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieStart: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('piestart', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieStop: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('piestop', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPiePin: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('piepin', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieUnpin: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('pieunpin', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieCancel: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('piecancel', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieUpdate: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('pieupdate', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieSelect: function(event, pie, noBubble, noTrigger) {
            this._notifyPie('pieselect', event, pie, null, null, noBubble, noTrigger);
        },

        _notifyPieItem: function(name, event, pie, slice, item, noBubble, noTrigger) {

            //LOG("_notifyPieItem", ["this", this, "name", name, "event", event, "pie", pie, "slice", slice, "item", item, "noBubble", noBubble, "noTrigger", noTrigger]);

            if (item) {

                var options = this.options;
                var $item = item.$item;
                var handler;

                if ($item) {

                    if (this.notifyDOM &&
                        (handler = $item.attr('on' + name))) {
                        eval(handler);
                    }

                    if (!noTrigger &&
                        this.notifyjQuery) {
                        $item.trigger(name, [this, pie, slice, item]);
                    }

                }

                if ((this.notifyDictionaries) &&
                    (handler = item['on' + name])) {
                    handler.call(this, event, pie, slice, item);
                }

            }

            if (!noBubble) {
                this._notifyPieSlice(name, event, pie, slice, item, noBubble, true);
            }

        },

        _notifyPieSlice: function(name, event, pie, slice, item, noBubble, noTrigger) {

            //LOG("_notifyPieSlice", ["this", this, "name", name, "event", event, "pie", pie, "slice", slice, "item", item, "noBubble", noBubble, "noTrigger", noTrigger]);

            if (slice) {

                var options = this.options;
                var $slice = slice.$slice;
                var handler;

                if ($slice) {

                    if (this.notifyDOM &&
                        (handler = $slice.attr('on' + name))) {
                        eval(handler);
                    }

                    if (!noTrigger &&
                        this.notifyjQuery) {
                        $slice.trigger(name, [this, pie, slice, item]);
                    }

                }

                if ((this.notifyDictionaries) &&
                    (handler = slice['on' + name])) {
                    handler.call(this, event, pie, slice, item);
                }

            }

            if (!noBubble) {
                this._notifyPie(name, event, pie, slice, item, noBubble, true);
            }

        },

        _notifyPie: function(name, event, pie, slice, item, noBubble, noTrigger) {

            //LOG("_notifyPie", ["this", this, "name", name, "event", event, "pie", pie, "slice", slice, "item", item, "noBubble", noBubble, "noTrigger", noTrigger]);

            if (pie) {

                var options = this.options;
                var $pie = pie.$pie;
                var handle;

                if ($pie) {

                    if (this.notifyDOM &&
                        (handler = $pie.attr('on' + name))) {
                        eval(handler);
                    }

                    if (!noTrigger &&
                        this.notifyjQuery) {
                        $pie.trigger(name, [this, pie, slice, item]);
                    }

                }

                if (this.notifyDictionaries &&
                    (handler = pie['on' + name])) {
                    handler.call(this, event, pie, slice, item);
                }

            }

            if (!noBubble) {
                // We want to delegate to the jQuery trigger handler AFTER
                // trying the item/slice/pie. But that element is not in
                // the ancestors list of those, so jQuery does not know to 
                // try to delegate to it. We passed noTrigger=true after 
                // the leaf element so we don't tell jQuery to re-trigger  
                // the elements between the leaf and the target, but now we 
                // want to force triggering the target since jQuery won't
                // do that for us, so we now pass noTrigger=false.
                // One unpleasant side-effect might be that shared parents
                // of both the target and the pie (i.e. the body) might
                // get triggered more than once, but there isn't any good
                // reason to put handler on the body, so this probably
                // won't be a problem. But if it is, then your target
                // handler can call event.stopPropogation() to prevent
                // it from triggering its parents' notifiers a second time.
                this._notifyTarget(name, event, pie, slice, item, noBubble, false);
            }

        },

        _notifyTarget: function(name, event, pie, slice, item, noBubble, noTrigger) {

            //LOG("_notifyTarget", ["this", this, "name", name, "event", event, "pie", pie, "slice", slice, "item", item, "noBubble", noBubble, "noTrigger", noTrigger]);

            var options = this.options;
            var handler;

            if (this.notifyDOM &&
                (handler = this.element.attr('on' + name))) {
                eval(handler);
            }

            if (!noTrigger &&
                this.notifyjQuery) {
                this.element.trigger(name, [this, pie, slice, item]);
            }

            if (this.notifyDictionaries &&
                (handler = options['on' + name])) {
                handler.call(this, event, pie, slice, item);
            }

        }

    });

})(jQuery);


////////////////////////////////////////////////////////////////////////
