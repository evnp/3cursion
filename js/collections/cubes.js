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

        getMeshes: function () {
            return this.pluck('mesh');
        },

        getFromMesh: function (mesh) {
            return this.find( function (cube) {
                return cube.get('mesh').id === (mesh && mesh.id);
            }) || null;
        },

        getFromIntersect: function (intersect) {
            return intersect && this.getFromMesh(intersect.object);
        },

        moveAll: function (movement) {
            this.each( function (cube) { cube.move(movement); });
        },

        deselectAll: function () {
            this.each( function (cube) { cube.selected = false; });
            this.reset();
        }
    });

    return CubeCollection;
});
