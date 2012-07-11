define([
    'jquery',
    'underscore',
    'backbone',
    'three',
    'detector',

], function ($, _, Backbone) {

    // Constants
    var RAD = 1600
      , PI  = Math.PI
      , THT = 45 // Theta
      , PHI = 60
      , RENDERER = (Detector.webgl ? 'WebGL' : 'Canvas') + 'Renderer'
      ;

    return Backbone.View.extend({

        el: '#canvas',

        initialize: function () {
            this.w = this.$el.width();
            this.h = this.$el.height() - 4;

        // Camera
            this.camera = new THREE.PerspectiveCamera(75, this.w/this.h, 1, 10000);
            /*
            this.camera.position.x = RAD * Math.sin(THT*PI/360)
                                               * Math.cos(PHI*PI/360);
            this.camera.position.y = RAD * Math.sin(PHI*PI/360);
            this.camera.position.z = RAD * Math.cos(THT*PI/360)
                                               * Math.cos(PHI*PI/360);
            */
            this.camera.position.z = 1000;

        // Mesh
            this.getShadedMesh = function (geometry) {
                return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
                    color: 0xffffff
                }));
            };

            this.getWireframeMesh = function (geometry) {
                return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    wireframe: true
                }));
            };

            this.getWireframeShadedMesh = function (geometry) {
                return THREE.SceneUtils.createMultiMaterialObject(geometry, [
                    new THREE.MeshLambertMaterial({
                        color: 0xffffff
                    }),
                    new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        wireframe: true
                    })
                ]);
            };

            this.mesh = this.getWireframeShadedMesh(
                new THREE.CubeGeometry(200, 200, 200)
            );

        // Scene
            this.scene = new THREE.Scene();
            this.scene.add(this.camera);
            this.scene.add(this.mesh);

        // Lights
            var light1 = new THREE.DirectionalLight(0xffffff);
            light1.position.x = 1;
            light1.position.y = 1;
            light1.position.z = 0.75;
            light1.position.normalize();

            var light2 = new THREE.DirectionalLight(0x808080);
            light2.position.x = -1;
            light2.position.y = 1;
            light2.position.z = -0.75;
            light2.position.normalize();

            this.scene.add(new THREE.AmbientLight(0x404040));
            this.scene.add(light1);
            this.scene.add(light2);

        // Renderer
            this.renderer = new THREE[RENDERER]();
            this.renderer.setSize(this.w, this.h);
        },

        render: function () {
            var canvas = this;

            canvas.$el.append(canvas.renderer.domElement);

            animate();

            function animate() {
                requestAnimationFrame(animate);
                render();
            }

            function render() {
                canvas.mesh.rotation.x += 0.01;
                canvas.mesh.rotation.y += 0.02;
                canvas.renderer.render(
                    canvas.scene,
                    canvas.camera
                );
            }
        }
    });
});
