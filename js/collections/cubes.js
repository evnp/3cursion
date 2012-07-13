define([
    'jquery',
    'underscore',
    'backbone',

    'models/cube'

], function($, _, Backbone, Cube){

    var CubeCollection = Backbone.Collection.extend({

        model: Cube,

        initialize: function (models, scene) {
            this.on('add', function (cube) {
                scene.add(cube.get('obj'));
            });
        },

        getMeshes: function () {
            return this.pluck('mesh');
        },

        getFromMesh: function (mesh) {
            return this.find(function (cube) {
                return cube.get('mesh').id === (mesh && mesh.id);
            }) || null;
        },

        getFromIntersect: function (intersect) {
            return intersect && this.getFromMesh(intersect.object);
        },

        deselectAll: function () {
            this.each(function (cube) { cube.selected = false; });
            this.reset();
        }
    });

    return CubeCollection;
});
