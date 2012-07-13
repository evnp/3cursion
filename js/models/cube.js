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

                // Wireframe is used to represent the cube's mesh.
                'mesh':    obj.children[1],

                // Related meshes
                'shading': obj.children[0],
                'obj':     obj,

                // Original position stored to be used as offset for movement
                'origPos': obj.position,

                // Cube states
                'hovered': false,
                'selected': false
            });
        },

        hover: function (hoverVal) {
            this.setColor( hoverVal ? BLACK : GREY );
            this.set('hovered', hoverVal);
        },

        select: function (selectVal) {
            if (selectVal) this.setColor(RED);
            else this.hover(this.get('hovered'));
            this.set('selected', selectVal);
        },

        setColor: function (color) {
            this.get('mesh').material.color.setHex(color);
        }
    });

    return Cube;
});
