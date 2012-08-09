define([
    'jquery',
    'underscore',
    'backbone',
    'jqhotkeys',
    'jqlongkeys',

    'text!templates/controls.html'

], function ($, _, Backbone, hotkeys, longkeys, template) {

    return Backbone.View.extend({

        el: '#controls',

        render: function () {

            var controls = navigator.appVersion.indexOf("Mac") != -1 ?
              [ '1-finger click - select cube'
              , '1-finger click and hold - move selected cubes | rotate camera'
              , '2-finger click and hold - rotate selected cubes'
              , '2-finger swipe (scroll) - resize selected cubes | zoom camera'
              , 'hold ctrl | command - recursively repeat selected cubes'
              ]
              :
              [ 'left mouse - select cube'
              , 'hold left mouse - move selected cubes | rotate camera'
              , 'hold right mouse - rotate selected cubes'
              , 'mouse scroll - resize selected cubes | zoom camera'
              , 'hold left + right mouse | ctrl - recursively repeat selected cubes'
              ];

            this.$el.html(_.template(template)({ controls: controls }));
        }
    });
});
