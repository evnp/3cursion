define([
    'jquery',
    'underscore',
    'backbone',

    'models/cube'

], function($, _, Backbone, Cube){

    var CubeCollection = Backbone.Collection.extend({

        model: Cube,

        initialize: function (models, scene) {
            if (scene) {
                this.on('add', function (cube) {
                    scene.add(cube.get('object'));
                });
            }
        },

        wireframes: function () {
            return this.pluck('wireframe');
        },

        getFromWireframe: function (wf) {
            return this.find( function (cube) {
                return cube.get('wireframe').id === (wf && wf.id);
            }) || null;
        },

        getFromIntersect: function (intersect) {
            return intersect && this.getFromWireframe(intersect.object);
        },

        moveAll: function (movement) {
            this.each( function (cube) { cube.move(movement); });
        },

        updatePositions: function () {
            this.each( function (cube) { cube.updatePosition(); });
        },

        rotateAll: function (x, y) {
            this.each( function (cube) { cube.rotate(x, y); });
        },

        updateRotations: function () {
            this.each( function (cube) { cube.updateRotation(); });
        },

        deselectAll: function () {
            this.each( function (cube) { cube.select(false); });
            this.reset();
        }
    });

    return CubeCollection;
});
