define([
    'jquery',
    'underscore',
    'backbone',
    'three'

], function($, _, Backbone) {

    var BLACK = 0x000000
      , WHITE = 0xffffff
      , RED   = 0xff0000
      , GREY  = 0xD3D3D3

      , RECURSION_LIMIT = 50;

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
                'selected': false,

                // Recursion
                'child': null,
                'parent': null
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

        move: function (movement, level) {
            level = level || 1;

            var origPos = this.get('origPos')
              , child   = this.get('child');

            this.setPosition(new THREE.Vector3(
                    origPos.x + (movement.x * level),
                    origPos.y + (movement.y * level),
                    origPos.z + (movement.z * level)
            ));

            if (child) child.move(movement, level + 1);
        },

        setPosition: function (position) {
            this.get('object').position = position;
        },

        updatePosition: function () {
            this.set('origPos', this.get('object').position);
        },

        rotate: function (movement, mouseX, mouseY) {
            var speed = 30
              , origRtn = this.get('origRtn')
              , x = movement.x, y = movement.y, z = movement.z;

            // TODO: Make object rotation more intuitive
            this.get('object').rotation = new THREE.Vector3(
                origRtn.x + (Math.abs(movement.y * speed * 0.001) *
                            (z / (Math.abs(x) + Math.abs(z)))),
                origRtn.y + (mouseX * speed * 0.0001),
                origRtn.z + (Math.abs(movement.y * speed * 0.001) *
                           -(x / (Math.abs(x) + Math.abs(z))))

            );
        },

        updateRotation: function () {
            this.set('origRtn', this.get('object').rotation);
        },

        recurse: function (limit) {
            limit = limit || 0;

            if (limit < RECURSION_LIMIT) {
                var child = this.clone();
                this.set('child', child);
                return [child].concat(child.recurse(limit + 1));
            }

            return [];
        }
    });

    return Cube;
});
