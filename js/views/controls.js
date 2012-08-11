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
              [ '1-finger double click - create cube'
              , '1-finger double click on cube - delete cube'
              , '1-finger click on cube - select cube'
              , '1-finger click and hold - move selected cubes | rotate camera'
              , '2-finger click and hold - rotate selected cubes'
              , '2-finger swipe (scroll) - resize selected cubes | zoom camera'
              , 'hold ctrl | command - recursively repeat selected cubes' ]
              :
              [ 'double click - create cube'
              , 'double click on cube - delete cube'
              , 'left click on cube - select cube'
              , 'hold left click - move selected cubes | rotate camera'
              , 'hold right click - rotate selected cubes'
              , 'hold left + right - recursively repeat selected cubes'
              , 'scroll wheel - resize selected cubes | zoom camera' ];

            this.$el.html(_.template(template)({ controls: controls }));
        }
    });
});
