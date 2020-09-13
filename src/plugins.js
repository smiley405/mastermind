// player.vy = 0;
// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language ECMASCRIPT5
// @fileoverview
// @suppress {checkTypes | globalThis | checkVars}
// ==/ClosureCompiler==

/*
Ga plugins
==========
Weclome to the `plugins.js` file!
This file contains lots of extra tools that are really useful for making games,
but which are more specialized that than the universal tools in `ga.js` file.

How can use these plugins? The easiest way is just to link this entire file
with a `<script>` tag. Then you have immediate access to all this code
and you can decide later what you really need.

Your own custom plugins
-----------------------

If you wan to keep you game file size small, create
your own custom plugins file. Here's how:

1. Make a new JS file called `custom.js` (or an other name you want to give it.)
2. Add this:

    GA.custom = function(ga) {
      //Your own collection of plugins will go here
    };

3. Link `custom.js` to your game's main HTML document with a `<script>` tag.

4. Then just copy/paste any plugin functions from this
file (`plugins.js`) into your own `custom.js` file. Like this:

    GA.custom = function(ga) {
      //Create a random number within a specific range
      ga.randomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };
    };

The `GA.custom` function is called by Ga as soon as the engine has
finished initializing, but before the game runs. This means you
can use it to run any other custom setup task that you want to
perform before any of the game code runs. You could also use the
`GA.custom` function to overwrite any of Ga's default properties
with your own. Go wild!

The plugins in this file
------------------------

The code in this `plugins.js` file is organized into chapters.
Use your text editor's search features to find what you're looking for.
Here's the table of contents to get you started:

### Utilities

`wait`: Wait for a certain number of milliseconds and then execute a callback function.
`worldCamera`: A method that creates and returns a camera for a scrolling game world.
`scaleToWindow`: Automatically scales and centers the game to the maximum browser window area.

### Sprite creation tools

`progressBar`: A loading progress bar you can use to display while game assets are loading.`

#### Shape collisions

`hitTestRectangle`: Returns `true` if any two rectangular sprites overlap.
`rectangleCollision`: Prevents two colliding rectangles from overlapping and tells you the collision side

### Tiled editor importers

`makeTiledWorld`: Creates a game world using Tiled Editor's JSON export data.

*/

GA = GA || {};
GA.plugins = function (ga) {

  //### wait
  ga.wait = function (duration, callBack) {
    return setTimeout(callBack, duration);
  };

  //### worldCamera
  /*
  The `worldCamera` method returns a `camera` object
  with `x` and `y` properties. It has
  two useful methods: `centerOver`, to center the camera over
  a sprite, and `follow` to make it follow a sprite.
  `worldCamera` arguments: worldObject, theCanvas
  The worldObject needs to have a `width` and `height` property.
  */

  ga.worldCamera = function (world, canvas) {
    var camera = {
      width: canvas.width,
      height: canvas.height,
      _x: 0,
      _y: 0,

      //`x` and `y` getters/setters
      //When you change the camera's position,
      //they acutally reposition the world
      get x() {
        return this._x;
      },
      set x(value) {
        this._x = value;
        world.x = -this._x;
        world._previousX = world.x;
      },
      get y() {
        return this._y;
      },
      set y(value) {
        this._y = value;
        world.y = -this._y;
        world._previousY = world.y;
      },
      get centerX() {
        return this.x + (this.width / 2);
      },
      get centerY() {
        return this.y + (this.height / 2);
      },
      get rightInnerBoundary() {
        return this.x + (this.width / 2) + (this.width / 4);
      },
      get leftInnerBoundary() {
        return this.x + (this.width / 2) - (this.width / 4);
      },
      get topInnerBoundary() {
        return this.y + (this.height / 2) - (this.height / 4);
      },
      get bottomInnerBoundary() {
        return this.y + (this.height / 2) + (this.height / 4);
      },
      follow: function (sprite) {

        //Check the sprites position in relation to the inner boundary
        if (sprite.x < this.leftInnerBoundary) {
          //Move the camera to follow the sprite if the sprite strays outside
          //this.x = Math.floor(sprite.x - (this.width / 4));
          this.x = sprite.x - (this.width / 4);
        }
        if (sprite.y < this.topInnerBoundary) {

          //this.y = Math.floor(sprite.y - (this.height / 4));
          this.y = sprite.y - (this.height / 4);
        }
        if (sprite.x + sprite.width > this.rightInnerBoundary) {

          //this.x = Math.floor(sprite.x + sprite.width - (this.width / 4 * 3));
          this.x = sprite.x + sprite.width - (this.width / 4 * 3);
        }
        if (sprite.y + sprite.height > this.bottomInnerBoundary) {

          //this.y = Math.floor(sprite.y + sprite.height - (this.height / 4 * 3));
          this.y = sprite.y + sprite.height - (this.height / 4 * 3);
        }
        //If the camera reaches the edge of the map, stop it from moving
        if (this.x < 0) {
          this.x = 0;
        }
        if (this.y < 0) {
          this.y = 0;
        }
        if (this.x + this.width > world.width) {
          this.x = world.width - this.width;
        }
        if (this.y + this.height > world.height) {
          this.y = world.height - this.height;
        }
      },
      centerOver: function (sprite) {

        //Center the camera over a sprite
        this.x = (sprite.x + sprite.halfWidth) - (this.width / 2);
        this.y = (sprite.y + sprite.halfHeight) - (this.height / 2);
      }
    };

    return camera;
  };

  /*
  ga.worldCamera = function(world, canvas) {
    var camera = ga.group();
    camera.width = canvas.width;
    camera.height = canvas.height;
    camera._x = 0;
    camera._y = 0;
    Object.defineProperties(camera, {
      x: {
        get: function() {
          return this._x; 
        },
        set: function(value) {
          this._x = value;
          world.x = -this._x;
          //world._previousX = world.x;
        },
        enumerable: true, configurable: true
      },
      y: {
        get: function() {
          return this._y; 
        },
        set: function(value) {
          this._y = value;
          world.y = -this._y;
          //world._previousY = world.y;
        },
        enumerable: true, configurable: true
      },
      rightInnerBoundary: {
        get: function() {
          return this.x + (this.width / 2) + (this.width / 4);
        },
        enumerable: true, configurable: true
      },
      leftInnerBoundary: {
        get: function() {
          return this.x + (this.width / 2) - (this.width / 4);
        },
        enumerable: true, configurable: true
      },
      topInnerBoundary: {
        get: function() {
          return this.y + (this.height / 2) - (this.height / 4);
        },
        enumerable: true, configurable: true
      },
      bottomInnerBoundary: {
        get: function() {
          return this.y + (this.height / 2) + (this.height / 4);
        },
        enumerable: true, configurable: true
      }
    });
    camera.follow = function(sprite) {
      //Check the sprites position in relation to the inner boundary
      if(sprite.x < this.leftInnerBoundary) {
        //Move the camera to follow the sprite if the sprite strays outside
        this.x = Math.floor(sprite.x - (this.width / 4));
      }
      if(sprite.y < this.topInnerBoundary) {
        this.y = Math.floor(sprite.y - (this.height / 4));
      }
      if(sprite.x + sprite.width > this.rightInnerBoundary) {
        this.x = Math.floor(sprite.x + sprite.width - (this.width / 4 * 3));
      }
      if(sprite.y + sprite.height > this.bottomInnerBoundary) {
        this.y = Math.floor(sprite.y + sprite.height - (this.height / 4 * 3));
      }
      //If the camera reaches the edge of the map, stop it from moving
      if(this.x < 0) {
        this.x = 0;
      }
      if(this.y < 0) {
        this.y = 0;
      }
      if(this.x + this.width > world.width) {
        this.x = world.width - this.width;
      }
      if(this.y + this.height > world.height) {
        this.y = world.height - this.height;
      }
    };
    camera.centerOver = function(sprite) {
      //Center the camera over a sprite
      this.x = (sprite.x + sprite.halfWidth) - (this.width / 2);
      this.y = (sprite.y + sprite.halfHeight) - (this.height / 2);
      console.log(world)
    };

    return camera;
  };
  */
  //### scaleToWindow
  //Center and scale the game engine inside the HTML page 
  ga.scaleToWindow = function (backgroundColor) {

    backgroundColor = backgroundColor || "#2C3539";
    var scaleX, scaleY, scale, center;

    //1. Scale the canvas to the correct size
    //Figure out the scale amount on each axis
    scaleX = window.innerWidth / ga.canvas.width;
    scaleY = window.innerHeight / ga.canvas.height;

    //Scale the canvas based on whichever value is less: `scaleX` or `scaleY`
    scale = Math.min(scaleX, scaleY);
    ga.canvas.style.transformOrigin = "0 0";
    ga.canvas.style.transform = "scale(" + scale + ")";

    //2. Center the canvas.
    //Decide whether to center the canvas vertically or horizontally.
    //Wide canvases should be centered vertically, and 
    //square or tall canvases should be centered horizontally
    if (ga.canvas.width > ga.canvas.height) {
      if (ga.canvas.width * scale < window.innerWidth) {
        center = "horizontally";
      } else {
        center = "vertically";
      }
    } else {
      if (ga.canvas.height * scale < window.innerHeight) {
        center = "vertically";
      } else {
        center = "horizontally";
      }
    }

    //Center horizontally (for square or tall canvases)
    var margin;
    if (center === "horizontally") {
      margin = (window.innerWidth - ga.canvas.width * scale) / 2;
      ga.canvas.style.marginLeft = margin + "px";
      ga.canvas.style.marginRight = margin + "px";
    }

    //Center vertically (for wide canvases) 
    if (center === "vertically") {
      margin = (window.innerHeight - ga.canvas.height * scale) / 2;
      ga.canvas.style.marginTop = margin + "px";
      ga.canvas.style.marginBottom = margin + "px";
    }

    //3. Remove any padding from the canvas  and body and set the canvas
    //display style to "block"
    ga.canvas.style.paddingLeft = 0;
    ga.canvas.style.paddingRight = 0;
    ga.canvas.style.paddingTop = 0;
    ga.canvas.style.paddingBottom = 0;
    ga.canvas.style.display = "block";

    //4. Set the color of the HTML body background
    document.body.style.backgroundColor = backgroundColor;

    //It's important to set `canvasHasBeenScaled` to `true` so that
    //the scale values aren't overridden by Ga's check for fullscreen
    //mode in the `update` function (in the `ga.js` file.)
    ga.canvas.scaled = true;

    //Fix some quirkiness in scaling for Safari
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf("safari") != -1) {
      if (ua.indexOf("chrome") > -1) {
        // Chrome
      } else {
        // Safari
        ga.canvas.style.maxHeight = "100%";
        ga.canvas.style.minHeight = "100%";
      }
    }
  };

  /*
  ### progressBar
  Use the `progressBar` to display the percentage of assetes being loaded.
  To use it, first make sure you define a `load` state when you intialize Ga.
  Here's an example of a Ga instance that's intialized with 5 assets. The last
  argument, `load`, tells Ga that it should apply the `load` state as soon as
  Ga starts.

      var g = ga(
        512, 512, setup,
        [
          "images/blixyiiUI.png",
          "images/blixyiiTileset.png",
          "fonts/puzzler.otf",
          "sounds/music.wav",
          "sounds/bounce.wav"
        ],
        load
      );
      g.start();

  Next, create a `load` function. It will run in a loop while the assets are loading
  and before the `setup` state is run. Here's how to create and update the progress
  bar in the load state

      function load() {
        g.progressBar.create(g.canvas, g.assets);
        g.progressBar.update();
      }

  When the assets have finished loading the `setup` state will automatically be run.
  Remove the progress bar in the `setup` function state like this:

      function setup() {
        g.progressBar.remove();
        //...
      }

  This is just a basic example of a progress bar to help you get started. You can use the
  same format to create your own custom preloading animation.

  */
  ga.progressBar = {
    maxWidth: 0,
    height: 0,
    backgroundColor: "gray",
    foregroundColor: "white",
    backBar: null,
    frontBar: null,
    percentage: null,
    assets: null,
    initialized: false,
    create: function (canvas, assets) {
      if (!this.initialized) {

        //Store a reference to the `assets` object
        this.assets = assets;

        //Set the maximum width to half the width of the canvas
        this.maxWidth = ga.canvas.width / 2;

        //Build the progress bar using two Rectangle sprites and
        //one Message Sprite
        //1. Create the bar's gray background
        this.backBar = ga.rectangle(this.maxWidth, 32, this.backgroundColor);
        this.backBar.x = (ga.canvas.width / 2) - (this.maxWidth / 2);
        this.backBar.y = (ga.canvas.height / 2) - 16;

        //2. Create the blue foreground. This is the element of the
        //progress bar that will increase in width as assets load
        this.frontBar = ga.rectangle(this.maxWidth, 32, this.foregroundColor);
        this.frontBar.x = (ga.canvas.width / 2) - (this.maxWidth / 2);
        this.frontBar.y = (ga.canvas.height / 2) - 16;

        //3. A text sprite that will display the percentage
        //of assets that have loaded
        this.percentage = ga.text("0%", "28px sans-serif", "black");
        this.percentage.x = (ga.canvas.width / 2) - (this.maxWidth / 2) + 12;
        this.percentage.y = (ga.canvas.height / 2) - 12;

        //Flag the progressBar as having been initialized
        this.initialized = true;
      }
    },
    update: function () {

      //Change the width of the blue `frontBar` to match the
      //ratio of assets that have loaded. Adding `+1` to
      //`assets.loaded` means that the loading bar will appear at 100%
      //when the last asset is being loaded, which is reassuring for the
      //player observing the load progress
      var ratio = (ga.assets.loaded + 1) / ga.assets.toLoad;
      this.frontBar.width = this.maxWidth * ratio;


      //Display the percentage
      this.percentage.content = Math.floor((ratio) * 100) + "%";
    },
    remove: function () {

      //Remove the progress bar
      ga.remove(this.frontBar);
      ga.remove(this.backBar);
      ga.remove(this.percentage);
    }
  };

  /*
  #### hitTestRectangle

  Use it to find out if two rectangular sprites are touching.
  Parameters:
  a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
  b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.

  */

  ga.hitTestRectangle = function (r1, r2, global) {
    var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    //Set `global` to a default value of `false`
    if (global === undefined) global = false;

    //A variable to determine whether there's a collision
    hit = false;

    //Calculate the distance vector
    if (global) {
      vx = (r1.gx + r1.halfWidth) - (r2.gx + r2.halfWidth);
      vy = (r1.gy + r1.halfHeight) - (r2.gy + r2.halfHeight);
    } else {
      vx = r1.centerX - r2.centerX;
      vy = r1.centerY - r2.centerY;
    }

    //Figure out the combined half-widths and half-heights
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //Check for a collision on the x axis
    if (Math.abs(vx) < combinedHalfWidths) {

      //A collision might be occuring. Check for a collision on the y axis
      if (Math.abs(vy) < combinedHalfHeights) {

        //There's definitely a collision happening
        hit = true;
      } else {

        //There's no collision on the y axis
        hit = false;
      }
    } else {

      //There's no collision on the x axis
      hit = false;
    }

    //`hit` will be either `true` or `false`
    return hit;
  };

  /*
  #### rectangleCollision

  Use it to prevent two rectangular sprites from overlapping.
  Optionally, make the first retangle bounceoff the second rectangle.
  Parameters:
  a. A sprite object with `x`, `y` `center.x`, `center.y`, `halfWidth` and `halfHeight` properties.
  b. A sprite object with `x`, `y` `center.x`, `center.y`, `halfWidth` and `halfHeight` properties.
  c. Optional: true or false to indicate whether or not the first sprite
  should bounce off the second sprite.
  */

  ga.rectangleCollision = function (r1, r2, bounce, global) {
    var collision, combinedHalfWidths, combinedHalfHeights,
      overlapX, overlapY, vx, vy;

    //Set `bounce` to a default value of `true`
    if (bounce === undefined) bounce = false;

    //Set `global` to a default value of `false`
    if (global === undefined) global = false;

    //Calculate the distance vector
    if (global) {
      vx = (r1.gx + r1.halfWidth) - (r2.gx + r2.halfWidth);
      vy = (r1.gy + r1.halfHeight) - (r2.gy + r2.halfHeight);
    } else {
      vx = r1.centerX - r2.centerX;
      vy = r1.centerY - r2.centerY;
    }

    //Figure out the combined half-widths and half-heights
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //Check whether vx is less than the combined half widths
    if (Math.abs(vx) < combinedHalfWidths) {

      //A collision might be occurring!
      //Check whether vy is less than the combined half heights
      if (Math.abs(vy) < combinedHalfHeights) {

        //A collision has occurred! This is good!
        //Find out the size of the overlap on both the X and Y axes
        overlapX = combinedHalfWidths - Math.abs(vx);
        overlapY = combinedHalfHeights - Math.abs(vy);

        //The collision has occurred on the axis with the
        //*smallest* amount of overlap. Let's figure out which
        //axis that is

        if (overlapX >= overlapY) {

          //The collision is happening on the X axis
          //But on which side? vy can tell us
          if (vy > 0) {
            collision = "top";

            //Move the rectangle out of the collision
            r1.y = r1.y + overlapY;
          } else {
            collision = "bottom";

            //Move the rectangle out of the collision
            r1.y = r1.y - overlapY;
          }
          //Bounce
          if (bounce) {
            r1.vy *= -1;

            /*Alternative
            //Find the bounce surface's vx and vy properties
            var s = {};
            s.vx = r2.x - r2.x + r2.width;
            s.vy = 0;

            //Bounce r1 off the surface
            //bounceOffSurface(r1, s);
            */
          }
        } else {

          //The collision is happening on the Y axis
          //But on which side? vx can tell us
          if (vx > 0) {
            collision = "left";

            //Move the rectangle out of the collision
            r1.x = r1.x + overlapX;
          } else {
            collision = "right";

            //Move the rectangle out of the collision
            r1.x = r1.x - overlapX;
          }

          //Bounce
          if (bounce) {
            r1.vx *= -1;

            /*Alternative
            //Find the bounce surface's vx and vy properties
            var s = {};
            s.vx = 0;
            s.vy = r2.y - r2.y + r2.height;

            //Bounce r1 off the surface
            bounceOffSurface(r1, s);
            */
          }
        }
      } else {

        //No collision
      }
    } else {

      //No collision
    }

    //Return the collision string. it will be either "top", "right",
    //"bottom", or "left" depening on which side of r1 is touching r2.
    return collision;
  };

  /*
  Tiled editor importers
  ---------------------------------
  Ga lets you import JSON files created by the popular Tiled Editor game map and level editor.

  www.mapeditor.org

  Two functions called `makeTiledWorld` and `makeIsoTiledWorld` (for isometric maps, coming soon!) use this data to
  automatically build your game world for you.

  To prepare your Tiled Editor game world for use in Ga, give any significant thing a
  `name` property. Anything with a `name` property in Tiled Editor can
  be accessed in your code by its string name. Tiled Editor layers have a
  `name` property by default, and you can assign custom `name`
  properties to tiles and objects. Not everything needs a `name` property, just
  things that you want to specifically access in the world after its created.
  */

  /*
  ### makeTiledWorld
  */

  ga.makeTiledWorld = function (tiledMap, tileset) {

    //Create a group called `world` to contain all the layers, sprites
    //and objects from the `tiledMap`. The `world` object is going to be
    //returned to the main game program
    tiledMap = ga.json(tiledMap);
    var world = ga.group();
    world.tileheight = tiledMap.tileheight;
    world.tilewidth = tiledMap.tilewidth;

    //Calculate the `width` and `height` of the world, in pixels
    world.width = tiledMap.width * tiledMap.tilewidth;
    world.height = tiledMap.height * tiledMap.tileheight;

    //Get a reference to the world's height and width in
    //tiles, in case you need to know this later (you will!)
    world.widthInTiles = tiledMap.width;
    world.heightInTiles = tiledMap.height;

    //Create an `objects` array to store references to any
    //named objects in the map. Named objects all have
    //a `name` property that was assigned in Tiled Editor
    world.objects = [];

    //The optional spacing (padding) around each tile
    //This is to account for spacing around tiles
    //that's commonly used with texture atlas tilesets. Set the
    //`spacing` property when you create a new map in Tiled Editor
    var spacing = tiledMap.tilesets[0].spacing;

    //Figure out how many columns there are on the tileset.
    //This is the width of the image, divided by the width
    //of each tile, plus any optional spacing thats around each tile
    var numberOfTilesetColumns =
      Math.floor(
        tiledMap.tilesets[0].imagewidth /
        (tiledMap.tilewidth + spacing)
      );

    //Loop through all the map layers
    tiledMap.layers.forEach(function (tiledLayer) {

      //Make a group for this layer and copy
      //all of the layer properties onto it.
      var layerGroup = ga.group();

      Object.keys(tiledLayer).forEach(function (key) {
        //Add all the layer's properties to the group, except the
        //width and height (because the group will work those our for
        //itself based on its content).
        if (key !== "width" && key !== "height") {
          layerGroup[key] = tiledLayer[key];
        }
      });

      //Set the width and height of the layer to
      //the `world`'s width and height
      //layerGroup.width = world.width;
      //layerGroup.height = world.height;

      //Translate `opacity` to `alpha`
      layerGroup.alpha = tiledLayer.opacity;

      //Add the group to the `world`
      world.addChild(layerGroup);

      //Push the group into the world's `objects` array
      //So you can access it later
      world.objects.push(layerGroup);

      //Is this current layer a `tilelayer`?
      if (tiledLayer.type === "tilelayer") {

        //Loop through the `data` array of this layer
        tiledLayer.data.forEach(function (gid, index) {
          var tileSprite, texture, mapX, mapY, tilesetX, tilesetY,
            mapColumn, mapRow, tilesetColumn, tilesetRow;
          //If the grid id number (`gid`) isn't zero, create a sprite
          if (gid !== 0) {
            //Figure out the map column and row number that we're on, and then
            //calculate the grid cell's x and y pixel position.
            mapColumn = index % world.widthInTiles;
            mapRow = Math.floor(index / world.widthInTiles);
            mapX = mapColumn * world.tilewidth;
            mapY = mapRow * world.tileheight;

            //Figure out the column and row number that the tileset
            //image is on, and then use those values to calculate
            //the x and y pixel position of the image on the tileset
            tilesetColumn = ((gid - 1) % numberOfTilesetColumns);
            tilesetRow = Math.floor((gid - 1) / numberOfTilesetColumns);
            tilesetX = tilesetColumn * world.tilewidth;
            tilesetY = tilesetRow * world.tileheight;

            //Compensate for any optional spacing (padding) around the tiles if
            //there is any. This bit of code accumlates the spacing offsets from the
            //left side of the tileset and adds them to the current tile's position
            if (spacing > 0) {
              tilesetX
                += spacing +
                (spacing * ((gid - 1) % numberOfTilesetColumns));
              tilesetY
                += spacing +
                (spacing * Math.floor((gid - 1) / numberOfTilesetColumns));
            }

            //Use the above values to create the sprite's image from
            //the tileset image
            texture = ga.frame(
              tileset, tilesetX, tilesetY,
              world.tilewidth, world.tileheight
            );

            //I've dedcided that any tiles that have a `name` property are important
            //and should be accessible in the `world.objects` array.

            var tileproperties = tiledMap.tilesets[0].tileproperties,
              key = String(gid - 1);

            //If the JSON `tileproperties` object has a sub-object that
            //matches the current tile, and that sub-object has a `name` property,
            //then create a sprite and assign the tile properties onto
            //the sprite
            if (tileproperties[key] && tileproperties[key].name) {

              //Make a sprite
              tileSprite = ga.sprite(texture);

              //Copy all of the tile's properties onto the sprite
              //(This includes the `name` property)
              Object.keys(tileproperties[key]).forEach(function (property) {

                //console.log(tileproperties[key][property])
                tileSprite[property] = tileproperties[key][property];
              });

              //Push the sprite into the world's `objects` array
              //so that you can access it by `name` later
              world.objects.push(tileSprite);
            }

            //If the tile doesn't have a `name` property, just use it to
            //create an ordinary sprite (it will only need one texture)
            else {
              tileSprite = ga.sprite(texture);
            }

            //Position the sprite on the map
            tileSprite.x = mapX;
            tileSprite.y = mapY;

            //Make a record of the sprite's index number in the array
            //(We'll use this for collision detection later)
            tileSprite.index = index;

            //Make a record of the sprite's `gid` on the tileset.
            //This will also be useful for collision detection later
            tileSprite.gid = gid;

            //Add the sprite to the current layer group
            layerGroup.addChild(tileSprite);
          }
        });
      }

      //Is this layer an `objectgroup`?
      if (tiledLayer.type === "objectgroup") {
        tiledLayer.objects.forEach(function (object) {
          //We're just going to capture the object's properties
          //so that we can decide what to do with it later

          //Get a reference to the layer group the object is in
          object.group = layerGroup;

          //Because this is an object layer, it doesn't contain any
          //sprites, just data object. That means it won't be able to
          //calucalte its own height and width. To help it out, give
          //the `layerGroup` the same `width` and `height` as the `world`
          layerGroup.width = world.width;
          layerGroup.height = world.height;

          //Push the object into the world's `objects` array
          world.objects.push(object);
        });
      }
    });

    //Search functions
    //`world.getObject` and `world.getObjects`  search for and return
    //any sprites or objects in the `world.objects` array.
    //Any object that has a `name` propery in
    //Tiled Editor will show up in a search.
    //`getObject` gives you a single object, `getObjects` gives you an array
    //of objects.
    //`getObject` returns the actual search function, so you
    //can use the following format to directly access a single object:
    //sprite.x = world.getObject("anySprite").x;
    //sprite.y = world.getObject("anySprite").y;

    world.getObject = function (objectName) {
      this.searchForObject = function () {
        var foundObject;
        world.objects.some(function (object) {
          if (object.name && object.name === objectName) {
            foundObject = object;
            return true;
          }
        });
        if (foundObject) {
          return foundObject;
        } else {
          console.log("There is no object with the property name: " + objectName);
        }
      };

      //Return the search function
      return this.searchForObject();
    };

    world.getObjects = function (namesOfObjects) {
      var objectNames = Array.prototype.slice.call(arguments);
      var foundObjects = [];
      world.objects.forEach(function (object) {
        if (object.name && objectNames.indexOf(object.name) !== -1) {
          foundObjects.push(object);
        }
      });
      if (foundObjects.length > 0) {
        return foundObjects;
      } else {
        console.log("I could not find those objects");
      }
      return foundObjects;
    };

    //That's it, we're done!
    //Finally, return the `world` object back to the game program
    return world;
  };

  //plugins ends
};