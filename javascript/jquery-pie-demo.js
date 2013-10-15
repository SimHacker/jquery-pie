////////////////////////////////////////////////////////////////////////
// jquery-pie-demo.js
//
// Demo of jQuery Pies.
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


var gPies;
var gTargetOptions;
var gTarget;


////////////////////////////////////////////////////////////////////////


$(function() {

    gPies = {

        // This demonstrates a pie that is defined with DOM elements.
        DOMPie: '#DOMPie',

        DictionaryPie: {
            sliceItemLayout: 'nonOverlapping',
            sliceItemTracking: 'target',
            itemDistanceMin: 100,
	    itemGap: 5,
            slices: [
                {
                    itemDistanceMin: 30,
                    items: [
                        {
                            label: 'DOM Pie',
                            nextPie: 'DOMPie',
                        },
                        {
                            label: 'North'
                        },
                        {
                            label: 'North'
                        },
                        {
                            label: 'North'
                        },
                        {
                            label: 'North'
                        }
                    ]
                },
                {
                    items: [
                        {
                            label: 'NorthWest'
                        },
                        {
                            label: 'NorthWest'
                        }
                    ]
                },
                {
                    itemDistanceMin: 50,
                    items: [
                        {
                            label: 'West'
                        },
                        {
                            label: 'West'
                        },
                        {
                            label: 'West'
                        }
                    ]
                },
                {
                    items: [
                        {
                            label: 'SouthWest'
                        },
                        {
                            label: 'SouthWest'
                        }
                    ]
                },
                {
                    itemDistanceMin: 30,
                    items: [
                        {
                            label: 'Dynamic Pie',
                            nextPie: 'DynamicPie',
                        },
                        {
                            label: 'South'
                        },
                        {
                            label: 'South'
                        },
                        {
                            label: 'South'
                        },
                        {
                            label: 'South'
                        }
                    ]
                },
                {
                    items: [
                        {
                            label: 'SouthEast'
                        },
                        {
                            label: 'SouthEast'
                        }
                    ]
                },
                {
                    itemDistanceMin: 50,
                    items: [
                        {
                            label: 'East'
                        },
                        {
                            label: 'East'
                        },
                        {
                            label: 'East'
                        }
                    ]
                },
                {
                    items: [
                        {
                            label: 'NorthEast'
                        },
                        {
                            label: 'NorthEast'
                        }
                    ]
                }
            ]
        },

        // This demonstrates a pie that is define with dictionaries.
        DynamicPie: {

            // Customize the pie's properties.
            itemDistanceSpacing: 50,

            // Customize the pie's background css properties.
            pieBackgroundCSS: {
                width: 400,
                height: 400,
                marginLeft: -200,
                marginTop: -200,
                backgroundImage: 'url(../images/PieBackground_Pan.png)'
            },

            // This handler is called to customize the pie before it is shown,
            // and it dynamically creates the slices.
            onpieshow: function(event, pie) {

                // Dynamically create a bunch of slices and items.

                console.log("onpieshow", ["this", this, "event", event, "pie", pie]);

                // Clear out any existing slices.
                this._removePieSlices(pie);

                // Dynamically create a fixed number of slices and items.
                var itemCount = 5;
                var sliceCount = 5

                // Grab some information about the previous final pie
                // and slice that led to this pie.
                var finalPie =
                    this.finalPie;
                var finalSlice =
                    finalPie &&
                    finalPie.finalSlice;
                var finalSliceDir =
                    finalSlice
                        ? finalSlice.dir
                        : 0;

                // Make a half-circle of items in the opposite direction
                // of the previous menu slice.
                pie.initialSliceDirection =
                    finalSliceDir + 90;
                pie.turn =
                    180 / Math.max(1, (sliceCount - 1));

                for (var sliceIndex = 0;
                     sliceIndex < sliceCount;
                     sliceIndex++) {

                    // Just put the sliceIndex and itemCount into the slice.
                    // The onpiesliceshow handler will take care of the rest.
                    pie.slices.push({
                        sliceCount: sliceCount,
                        itemCount: itemCount,
                        sliceIndex: sliceIndex,
                        items: []
                    });

                }
            },

            // This handler is called to customize the slice before it is shown,
            // and it dynamically creates the items.
            onpiesliceshow: function(event, pie, slice) {

                console.log("onpiesliceshow", ["this", this, "event", event, "pie", pie, "slice", slice]);

                // Clear out any existing items.
                this._removeSliceItems(slice);

                // Grab some information about the previous final pie,
                // slice and item that led to this pie.
                var finalPie =
                    this.finalPie;
                var finalSlice =
                    finalPie &&
                    finalPie.finalSlice;
                var finalItem =
                    finalSlice &&
                    finalSlice.finalItem;
                var finalSliceDir =
                    finalSlice
                        ? finalSlice.dir
                        : 0;
                var finalItemLabel =
                    finalItem
                        ? finalItem.$itemLabel.text()
                        : '';

                for (var itemIndex = 0;
                     itemIndex < slice.itemCount;
                     itemIndex++) {

                    // Make the label for the item.
                    var label =
                        '<center>' +
                        finalItemLabel + '<br/>' +
                        'Direction ' + finalSliceDir + '<br/>' +
                        'Slice ' + (slice.sliceIndex + 1) + ' of ' + slice.sliceCount + '<br/>' +
                        'Item ' + (itemIndex + 1) + ' of ' + slice.itemCount +
                        '</center>';

                    // Make an item with the label and some nifty css styles
                    // for the label and background.
                    slice.items.push({
                        label: label,
                        pieItemLabelCSS: {
                            width: '160px'
                        },
                        pieItemBackgroundCSS: {
                            borderRadius: '10px'
                        }
                    });

                }

            },

            onpieupdate: function(event, pie, slice, item) {
                this.options.rotatePieBackground.call(this, event, pie, slice, item);
            },

            onpieitemselect: function(event, pie, slice, item) {
                this.options.debugItemSelect.call(this, event, pie, slice, item);
            }

        }

    };

    // These are the options for the jQuery pie target.
    gTargetOptions = {

        pies: gPies,

        defaultPie: 'DictionaryPie',

        // This is called by the onpieupdate handler.
        rotatePieBackground: function(event, pie, slice, item) {

            //console.log("====> onpieupdate rotatePieBackground:", ["this", this, "event", event, "pie", pie, "slice", slice, "item", item, "direction", this.direction]);

            var rot = -this.direction;
            pie.$pieBackground
                .css({
                    transform: 'rotate(' + rot + 'deg)'
                });
        },

        // This is called by the onpieitemupdate handler.
        highlightItem: function(event, pie, slice, item) {

            //console.log("====> onpieitemupdate highlightItem:", ["this", this, "event", event, "pie", pie, "slice", slice, "item", item]);

            var dx = ((this.centerX + item.centerX) - this.currentX);
            var dy = ((this.centerY + item.centerY) - this.currentY);
            var dist = this.offsetToDistance(dx, dy);

            dx *= 0.05 * Math.sqrt(dist);
            dy *= 0.05 * Math.sqrt(dist);

            var boxShadow = dx + 'px ' + dy + 'px ' + dist + 'px 10px #ffff00';

            item.$itemBackground
                .css({
                    boxShadow: boxShadow
                });
        },

        // This is called by the onpieitemstop handler.
        unhighlightItem: function(event, pie, slice, item) {

            console.log("====> onpieitemstop unhighlightItem:", ["this", this, "event", event, "pie", pie, "slice", slice, "item", item]);

            if (item == null) {
                return;
            }

            item.$itemBackground
                .css({
                    'box-shadow': 'none'
                });

        },

        // This is called by the onpieitemselect handler.
        debugItemSelect: function(event, pie, slice, item) {

            console.log('====> onpieitemselect Walk North', ['this', this, 'event', event, 'pie', pie, 'slice', slice, 'item', item]);

        }

    };

    // Make and confgure the jQuery pie target.
    gTarget =
        $('#target')
            .pie(gTargetOptions)
                // Attach some jQuery event handlers.
                .on('piedown', function(event, target, pie) {
                    console.log("====> jQuery piedown:", ["this", this, "event", event, "target", target, "pie", pie]);
                })
                .on('pieup', function(event, target, pie) {
                    console.log("====> jQuery pieup:", ["this", this, "event", event, "target", target, "pie", pie]);
                })
                .on('piestart', function(event, target, pie) {
                    console.log("====> jQuery PIESTART:", ["this", this, "event", event, "target", target, "pie", pie]);
                    // Call stopPropogation to prevent double triggering, as explained below.
                    event.stopPropagation();
                })
                .on('piestop', function(event, target, pie) {
                    console.log("====> jQuery PIESTOP:", ["this", this, "event", event, "target", target, "pie", pie]);
                })
                .on('piepin', function(event, target, pie) {
                    console.log("====> jQuery piepin:", ["this", this, "event", event, "target", target, "pie", pie]);
                })
                .on('pieunpin', function(event, target, pie) {
                    console.log("====> jQuery pieunpin:", ["this", this, "event", event, "target", target, "pie", pie]);
                })
                .on('piecancel', function(event, target, pie) {
                    console.log("====> jQuery piecancel:", ["this", this, "event", event, "target", target, "pie", pie]);
                })
                .on('pieupdate', function(event, target, pie) {
                    //console.log("====> jQuery pieupdate:", ["this", this, "event", event, "target", target, "pie", pie]);
                })
                .on('pieselect', function(event, target, pie) {
                    console.log("====> jQuery pieselect:", ["this", this, "event", event, "target", target, "pie", pie]);
                })
                .on('pieslicestart', function(event, target, pie, pieslice) {
                    console.log("====> jQuery pieslicestart:", ["this", this, "event", event, "target", target, "pie", pie, "pieslice", pieslice]);
                })
                .on('pieslicestop', function(event, target, pie, pieslice) {
                    console.log("====> jQuery pieslicestop:", ["this", this, "event", event, "target", target, "pie", pie, "pieslice", pieslice]);
                })
                .on('piesliceupdate', function(event, target, pie, pieslice) {
                    //console.log("====> jQuery piesliceupdate:", ["this", this, "event", event, "target", target, "pie", pie, "pieslice", pieslice]);
                })
                .on('piesliceselect', function(event, target, pie, pieslice) {
                    console.log("====> jQuery piesliceselect:", ["this", this, "event", event, "target", target, "pie", pie, "pieslice", pieslice]);
                })
                .on('pieitemstart', function(event, target, pie, pieslice, pieitem) {
                    console.log("====> jQuery pieitemstart:", ["this", this, "event", event, "target", target, "pie", pie, "pieslice", pieslice, "pieitem", pieitem]);
                })
                .on('pieitemstop', function(event, target, pie, pieslice, pieitem) {
                    console.log("====> jQuery pieitemstop:", ["this", this, "event", event, "target", target, "pie", pie, "pieslice", pieslice, "pieitem", pieitem]);
                })
                .on('pieitemupdate', function(event, target, pie, pieslice, pieitem) {
                    //console.log("====> jQuery pieitemupdate:", ["this", this, "event", event, "target", target, "pie", pie, "pieslice", pieslice, "pieitem", pieitem]);
                })
                .on('pieitemselect', function(event, target, pie, pieslice, pieitem) {
                    console.log("====> jQuery pieitemselect:", ["this", this, "event", event, "target", target, "pie", pie, "pieslice", pieslice, "pieitem", pieitem]);
                });

    console.log("jquery-pie-demo.js initialized:", "gPies", gPies, "gTargetOptions", gTargetOptions, "gTarget", gTarget);

    // This is to test out the weird nuance of jQuery double triggering
    // parents shared by both the pie and the target, as explained in the
    // comment in _notifyPie. This will get triggered twice, unless the 
    // target piestart handler calls event.stopPropagation().
    $('body').on('piestart', function(event, target, pie) {
        console.log("====> jQuery BODY piestart:", ["this", this, "event", event, "target", target, "pie", pie]);
    });

    $('#message').html("Loaded.");

});


////////////////////////////////////////////////////////////////////////
