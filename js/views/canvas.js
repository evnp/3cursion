define([
    'jquery',
    'underscore',
    'backbone',
    'three'

], function ($, _, Backbone, Three) {

    return Backbone.View.extend({

        el: '#canvas',

        render: function () {
            var w = window.innerWidth
              , h = window.innerHeight
              , materialProperties = { color: 0xff0000, wireframe: true }

              , scene    = new THREE.Scene()
              , camera   = new THREE.PerspectiveCamera(75, w/h, 1, 10000)
              , geometry = new THREE.CubeGeometry(200,200,200)
              , material = new THREE.MeshBasicMaterial(materialProperties)
              , mesh     = new THREE.Mesh(geometry, material)
              , renderer
              ;

            camera.position.z = 1000;

            scene.add(camera);
            scene.add(mesh);

            renderer = new THREE.CanvasRenderer();
            renderer.setSize(w, h);

            this.$el.append(renderer.domElement);
        }
    });
});
