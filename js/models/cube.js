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
              , position = attr.position || new THREE.Vector3( 0, 0, 0 )
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
                'position': obj.position,
                'rotation': obj.rotation,

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

            var prnt = this.get('parent')

            if (prnt && prnt.get('parent')) {
                this.selectRecursion();
            }
        },

        selectRecursion: function (type) {
            var cube = this;

            if (!type || type === 'parent') nextRelative('parent');
            if (!type || type === 'child' ) nextRelative('child');

            function nextRelative(type) {
                var relative = cube.get(type);
                if (relative) {
                    relative.select();
                    relative.selectRecursion(type);
                }
            }
        },

        setColor: function (color) {
            this.get('wireframe').material.color.setHex(color);
        },

        move: function (movement, level) {
            level = level || 1;

            var position = this.get('position')
              , child    = this.get('child');

            this.get('object').position = new THREE.Vector3(
                    position.x + (movement.x * level),
                    position.y + (movement.y * level),
                    position.z + (movement.z * level)
            );

            // If the move needs to be recursive...
            if (child) child.move(movement, level + 1);
        },

        rotate: function (movement, mouseX, mouseY) {
            var speed = 30
              , rotation = this.get('rotation')
              , x = movement.x, y = movement.y, z = movement.z;

            // TODO: Make object rotation more intuitive
            this.get('object').rotation = new THREE.Vector3(
                rotation.x + (Math.abs(movement.y * speed * 0.001) *
                            (z / (Math.abs(x) + Math.abs(z)))),
                rotation.y + (mouseX * speed * 0.0001),
                rotation.z + (Math.abs(movement.y * speed * 0.001) *
                           -(x / (Math.abs(x) + Math.abs(z))))

            );
        },

        // move/rotate run constantly during a move operation.
        // update(Move/Position) used after a move operation is
        // completed so that the correct position/rotation will
        // be used as a starting offset for the next move operation.
        updatePosition: function () { this.update('position'); },
        updateRotation: function () { this.update('rotation'); },

        update: function (property) {
            this.set( property, this.get('object')[property] );
        },

        scale: function (factor, level) {
            level = level || 1;

            var scale = this.get('object').scale
              , child = this.get('child');

            scale.x += factor * 0.01 * level;
            scale.y += factor * 0.01 * level;
            scale.z += factor * 0.01 * level;

            // If the scale needs to be recursive...
            if (child) child.scale(factor, level + 1);
        },

        getScale: function () {
            return this.get('object').boundRadiusScale;
        },

        recurse: function (limit) {
            limit = limit || 0;

            if (limit < RECURSION_LIMIT) {
                var child = this.clone();
                this.set('child', child);
                child.set('parent', this);
                return [child].concat(child.recurse(limit + 1));
            }

            return [];
        }
    });

    return Cube;
});
