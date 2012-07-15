define([
    'jquery',
    'underscore',
    'backbone',
    'three'

], function($, _, Backbone) {

    var BLACK = 0x000000
      , WHITE = 0xffffff
      , RED   = 0xff0000
      , GREY  = 0xD3D3D3;

    var Cube = Backbone.Model.extend({

        initialize: function(attr){
            var size =     attr.size    || 20
              , position = attr.origPos || new THREE.Vector3( 0, 0, 0 )
              , obj = THREE.SceneUtils.createMultiMaterialObject(
                    new THREE.CubeGeometry(size, size, size),
                    [
                        new THREE.MeshLambertMaterial({
                            color: WHITE
                        }),
                        new THREE.MeshBasicMaterial({
                            color: GREY,
                            wireframe: true
                        })
                    ]
                );

            obj.position = position;

            this.set({

                // Main cube object is used for cube movement
                'object': obj,

                // Wireframe is used for mouse/cube intersection
                'wireframe': obj.children[1],

                // Shading
                'shading': obj.children[0],

                // Original position/rotation stored to be used as offset for movement
                'origPos': obj.position,
                'origRtn': obj.rotation,

                // Cube states
                'hovered': false,
                'selected': false
            });
        },

        hover: function (hoverVal) {
            this.set('hovered', hoverVal);
            if (!this.get('selected')) this.setColor( hoverVal ? BLACK : GREY );
        },

        select: function (selectVal) {
            this.set('selected', selectVal);
            if (selectVal) this.setColor(RED);
            else this.hover(this.get('hovered'));
        },

        setColor: function (color) {
            this.get('wireframe').material.color.setHex(color);
        },

        move: function (movement) {
            var origPos = this.get('origPos');

            this.get('object').position = new THREE.Vector3(
                origPos.x + movement.x,
                origPos.y + movement.y,
                origPos.z + movement.z
            );
        },

        updatePosition: function () {
            this.set('origPos', this.get('object').position);
        },

        rotate: function (movement, mouseX) {
            var origRtn = this.get('origRtn')
              , x = movement.x, y = movement.y, z = movement.z;

            // TODO: Make object rotation more intuitive
            this.get('object').rotation = new THREE.Vector3(
                origRtn.x + (Math.abs(movement.y/10) *
                            (z / (Math.abs(x) + Math.abs(z)))),
                origRtn.y + (mouseX/100),
                origRtn.z + (Math.abs(movement.y/10) *
                           -(x / (Math.abs(x) + Math.abs(z))))

            );
        },

        updateRotation: function () {
            this.set('origRtn', this.get('object').rotation);
        }
    });

    return Cube;
});
