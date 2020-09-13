var g = ga(160, 120, setup,
  [
    "maps/level.json",
    "images/sheet.json",
    "images/sheet.png"
  ],
  load
);
g.start();
//Set the frames per second to 30
g.fps = 30;
//Scale and center the game
g.scaleToWindow();

//Optionally re-scale the canvas if the browser window is changed
window.addEventListener("resize", function (event) {
  g.scaleToWindow();
});
g.hidePointer();

var world;
var gameScene;
var pSpawnPos = [];
var eSpawnPos = [];
var player;
var enemies = [];
var enemiesRay = [];
var enemiesHArea = [];
var walls;
var camScreen;
var cBoxs;
var keys;
var doors;
var boxes;
var speed = 1;
var bounce = 2;
var eSpeed = 0.8;
var level = 0;
var timerBar;
var instruction = {};

function load() {
  g.progressBar.create(g.canvas, g.assets);
  g.progressBar.update();
}

function setup() {
  g.backgroundColor = "black";
  setupLevel();
  //Change the game state to `play`
  g.state = play;
}

function getAnimSheet(name) {
  var animSheet = [];
  for (var key in g.assets) {
    if (key.includes(name)) {
      animSheet.push(key);
    }
  }
  return animSheet;
}

function stopPlayerMove() {
  player.isPush = false;
  player.x -= player.vx;
  player.y -= player.vy;
  player.vx = 0;
  player.vy = 0;
}

function stopBoxMove(box) {
  box.x -= box.vx;
  box.y -= box.vy;
  box.vx = 0;
  box.vy = 0;
}

function spawnPlayer(to) {
  to = to !== undefined ? to : level;
  player.x = pSpawnPos[to].x + player.width / 2;
  player.y = pSpawnPos[to].y + player.height / 4;
}

function bouncePlayer(rate) {
  rate = rate || 1;
  if (player.isKeyLeft || player.isKeyRight) {
    player.vx *= bounce * rate;
  }
  if (player.isKeyUp || player.isKeyDown) {
    player.vy *= bounce * rate;
  }
  stopPlayerMove();
}

function createHArea(x, y, w, h, color, alpha) {
  var hArea = g.rectangle(w, h, color || "blue");
  hArea.alpha = alpha || 0;
  hArea.x = x || 0;
  hArea.y = y || 0;
  return hArea;
}

function showInstructionPush() {
  if (instruction.push.isShow) {
    instruction.push.isShow = false;
    instruction.push.visible = true;
    instruction.push.isTrigger = false;
    if (instruction.push.pushTimeout) {
      clearTimeout(instruction.push.pushTimeout);
      instruction.push.pushTimeout = null;
    }
    instruction.push.pushTimeout = setTimeout(function () {
      instruction.push.visible = false;
    }, 5000);
  }
}

function showBasicInstruction() {
  instruction.move.visible = true;
  if (instruction.move.moveTimeout) {
    clearTimeout(instruction.move.moveTimeout);
    instruction.move.moveTimeout = null;
  }
  instruction.move.moveTimeout = setTimeout(function () {
    instruction.move.visible = false;
  }, 5000);
}

function showWin() {
  player.isWin = true;
  camScreen.alpha = 1;
  instruction.win.visible = true;
  updateInstructionWinProps();
}

function switchPlayerKeypress(keypress) {
  if (player.isKeyLeft) {
    player.keyActive = "isKeyLeft";
  } else
  if (player.isKeyRight) {
    player.keyActive = "isKeyRight";
  } else
  if (player.isKeyUp) {
    player.keyActive = "isKeyUp";
  } else
  if (player.isKeyDown) {
    player.keyActive = "isKeyDown";
  } else {
    player.keyActive = "";
  }
  player.isKeyLeft = false;
  player.isKeyRight = false;
  player.isKeyUp = false;
  player.isKeyDown = false;
  if (player.hasOwnProperty(keypress)) {
    player[keypress] = true;
  }
}

function keyActiveBehaveOnKeyRelease(keyrelease) {
  if (player.keyActive && player.keyActive !== keyrelease) {
    player[player.keyActive] = true;
    var activeKeyState = player.keyActiveState[player.keyActive];
    player.skin.playSequence(player.states[activeKeyState]);
  } else {
    player.keyActive = "";
  }
}

function setPlayerFound() {
  player.isFound = true;
  camScreen.reset = true;
  timerBar.reset = true;
}

function updatePlayerSkin() {
  player.skin.x = player.x - player.halfWidth;
  player.skin.y = player.y - player.halfHeight / 2;
}

function updateTimerBar() {
  timerBar.x = camScreen.x + 4;
  timerBar.y = camScreen.y + 1;
}

function updateInstructionWinProps() {
  instruction.win.x = camScreen.x + camScreen.width / 2 - instruction.win.halfWidth - 16;
  instruction.win.y = camScreen.y + camScreen.height / 2 - 32;
}

function updateEnemyBehaviour(enemy, dir) {
  var isStoreDir = enemy.directions.length <= 1 ? true : false;
  switch (dir) {
    case "eUp":
      enemy.playSequence(enemy.states.up);
      // store opposite direction
      if (isStoreDir) {
        enemy.directions.push("eDown");
      }
      break;
    case "eDown":
      enemy.playSequence(enemy.states.down);
      if (isStoreDir) {
        enemy.directions.push("eUp");
      }
      break;
    case "eLeft":
      enemy.playSequence(enemy.states.left);
      if (isStoreDir) {
        enemy.directions.push("eRight");
      }
      break;
    case "eRight":
      enemy.playSequence(enemy.states.right);
      if (isStoreDir) {
        enemy.directions.push("eLeft");
      }
      break;
  }
}

function resetWorldObjects(wObjects) {
  wObjects.forEach(function (wObj) {
    for (var prop in wObj.defaultProps) {
      wObj[prop] = wObj.defaultProps[prop];
    }
    // for enemy
    if (wObj.hasOwnProperty("eSpawn")) {
      wObj.updateRay();
      updateEnemyBehaviour(wObj, wObj.direction);
    }
  });
}

// set timerBar.reset = true before calling this function
function resetTimerBarTick(interval) {
  interval = interval || timerBar.defaultProps.interval;
  if (timerBar.reset) {
    timerBar.reset = false;
    timerBar.alpha = 0.5;
    timerBar.fg.width = timerBar.defaultProps.fg.width;
    if (timerBar.barInterval) {
      clearInterval(timerBar.barInterval);
      timerBar.barInterval = null;
    }
    timerBar.barInterval = setInterval(function () {
      if (!player.isWin) {
        timerBar.fg.width -= 1;
        if (timerBar.fg.width <= 0) {
          timerBar.fg.width = timerBar.defaultProps.fg.width;
          timerBar.reset = true;
          resetLevel();
        }
      }
    }, interval);
  }
}

function resetPlayer(level) {
  player.isWin = false;
  player.isFound = false;
  player.doorKey = null;
  spawnPlayer(level);
}

function resetBasicInstruction() {
  instruction.move.visible = false;
}

function resetInstructionPush() {
  instruction.push.isShow = false;
  instruction.push.visible = false;
  instruction.push.isTrigger = true;
}

// set camScreen.reset = true before calling this function
function resetCamScreen() {
  if (camScreen.reset) {
    camScreen.reset = false;
    camScreen.alpha = 1;
    resetBasicInstruction();
    if (camScreen.resetInterval) {
      clearInterval(camScreen.resetInterval);
      camScreen.resetInterval = null;
    }
    camScreen.resetInterval = setInterval(function () {
      camScreen.alpha -= 0.01;
      if (camScreen.alpha <= camScreen.defaultProps.alpha) {
        camScreen.alpha = camScreen.defaultProps.alpha;
        camScreen.reset = true;
        showBasicInstruction();
        clearInterval(camScreen.resetInterval);
      }
    }, 25);
  }
}

function resetLevel(level) {
  resetPlayer(level);
  resetWorldObjects(enemies);
  resetWorldObjects(keys);
  resetWorldObjects(doors);
  resetWorldObjects(boxes);
  resetCamScreen();
  resetTimerBarTick();
  resetInstructionPush();
  instruction.win.visible = false;
}

function resetGame() {
  level = 0;
  resetLevel();
}

function createText(text) {
  return g.text(text, "6px", "#fff", 0, 0);
}

function setupLevel() {
  world = g.makeTiledWorld(
    "maps/level.json",
    "images/sheet.png"
  );
  // player
  pSpawnPos = world.getObjects("spawnPos");
  player = createHArea(0, 0, 8, 12);
  player.skin = g.sprite(getAnimSheet("player_"));
  spawnPlayer();
  player.states = {
    up: [0, 3],
    left: [8, 11],
    down: [4, 7],
    right: [12, 15],
    idle: 4
  };
  player.keyActiveState = {
    isKeyLeft: "left",
    isKeyRight: "right",
    isKeyUp: "up",
    isKeyDown: "down"
  };
  updatePlayerSkin();
  player.skin.show(player.states.idle);
  player.isFound = false;
  player.doorKey = null;
  player.isWin = false;
  // enemies
  eSpawnPos = world.getObject("enemyLayer").children;
  eSpawnPos.forEach(function (eSpawn) {
    var enemy = g.sprite(getAnimSheet("cop_"));
    enemy.eSpawn = eSpawn;
    enemy.directions = [eSpawn.name];
    enemy.direction = eSpawn.name;
    // cbox
    enemy.isCBoxHitCheck = true;
    enemy.enemyVsCbox = false;
    enemy.cBoxTimeout = null;
    // box
    enemy.isBoxHitCheck = true;
    enemy.enemyVsBox = false;
    enemy.boxTimeout = null;
    enemy.x = eSpawn.x;
    enemy.y = eSpawn.y;
    enemy.states = {
      up: [0, 3],
      left: [8, 11],
      down: [4, 7],
      right: [12, 15],
      idle: 4
    };
    enemy.ray = g.sprite("uray.png");
    enemy.ray.alpha = 0.3;
    enemy.ray.x = enemy.x;
    enemy.ray.y = enemy.y;

    enemy.updateRay = function () {
      this.ray.width = 32;
      this.ray.height = 16;
      var offset = {
        left: 0,
        right: 0,
        up: 0,
        down: 0
      };
      if (!this.hArea) {
        this.hArea = createHArea(0, 0, this.ray.halfWidth, this.ray.halfHeight, "blue");
        this.hArea.hAreaVsPlayer = false;
        this.hArea.isHAreaHitCheck = true;
        this.hArea.hAreaTimeout = null;
      }

      switch (this.direction) {
        case "eUp":
          this.ray.x = this.x - this.halfWidth;
          this.ray.y = this.y - this.height;
          this.ray.scaleX = 1;
          this.ray.rotation = 1.6;
          this.hArea.x = this.ray.x + this.halfWidth + offset.up;
          break;
        case "eDown":
          this.ray.x = this.x - this.halfWidth;
          this.ray.y = this.y + this.height;
          this.ray.scaleX = 1;
          this.ray.rotation = 4.7;
          this.hArea.x = this.ray.x + this.halfWidth + offset.down;
          break;
        case "eLeft":
          this.ray.x = this.x - this.width - this.halfWidth;
          this.ray.y = this.y + 2;
          this.ray.scaleX = 1;
          this.ray.rotation = 0;
          this.hArea.x = this.ray.x + this.ray.halfWidth - offset.left;
          break;
        case "eRight":
          this.ray.x = this.x + this.halfWidth;
          this.ray.y = this.y + 2;
          this.ray.scaleX = -1;
          this.ray.rotation = 0;
          this.hArea.x = this.ray.x + offset.right;
          break;
      }

      this.hArea.y = this.ray.y + this.ray.halfHeight - this.hArea.halfHeight;
      this.hArea.rotation = this.ray.rotation;
      this.hArea.scaleX = this.ray.scaleX;
    };
    enemy.defaultProps = {
      x: enemy.x,
      y: enemy.y,
      direction: enemy.direction
    };
    enemy.updateRay();
    enemies.push(enemy);
    enemiesRay.push(enemy.ray);
    enemiesHArea.push(enemy.hArea);
    updateEnemyBehaviour(enemy, eSpawn.name);
  });
  // camScreen
  camScreen = g.rectangle(g.canvas.width, g.canvas.height, "black");
  camScreen.alpha = 0.3;
  camScreen.defaultProps = {
    alpha: camScreen.alpha
  };
  camScreen.reset = true;
  // timeBar
  var timerBarBg = g.rectangle(g.canvas.width - 8, 4, "black");
  var timerBarFg = g.rectangle(g.canvas.width - 9, 3, "pink");
  timerBarFg.x = timerBarBg.x + 0.5;
  timerBarFg.y = timerBarBg.y + 0.5;
  timerBar = g.group(timerBarBg, timerBarFg);
  // store
  timerBar.fg = timerBarFg;
  timerBar.bg = timerBarBg;
  timerBar.defaultProps = {
    interval: 500,
    fg: {
      width: timerBarFg.width
    }
  };
  timerBar.reset = true;
  updateTimerBar();
  resetTimerBarTick();

  // layers
  walls = world.getObject("wallLayer").children;
  cBoxs = world.getObject("cBoxLayer").children;
  keys = world.getObject("keyLayer").children;
  doors = world.getObject("doorLayer").children;
  boxes = world.getObject("boxLayer").children;
  // store default props
  keys.forEach(function (key) {
    key.defaultProps = {
      x: key.x,
      y: key.y,
      visible: key.visible,
      alpha: key.alpha
    };
  });
  doors.forEach(function (door) {
    door.defaultProps = {
      x: door.x,
      y: door.y,
      visible: door.visible,
      alpha: door.alpha
    };
  });
  boxes.forEach(function (box) {
    box.defaultProps = {
      x: box.x,
      y: box.y
    };
  });

  // texts
  // inst. move
  var instMove1 = createText("Arrow keys Moves");
  var instMove2 = createText("by redchilligame.com");
  instMove2.y = instMove1.y + 16;
  instruction.move = g.group(instMove1, instMove2);
  instruction.move.x = pSpawnPos[0].x;
  instruction.move.y = pSpawnPos[0].y + 16;
  showBasicInstruction();
  // inst. push
  var instPush1 = createText("Press and hold Z");
  var instPush2 = createText("with Arrow keys");
  var instPush3 = createText("to Push");
  instPush2.y = instPush1.y + instPush1.height;
  instPush3.y = instPush2.y + instPush2.height;
  instruction.push = g.group(instPush1, instPush2, instPush3);
  instruction.push.x = boxes[2].x - instruction.push.halfWidth;
  instruction.push.y = boxes[2].y - 16;
  instruction.push.visible = false;
  instruction.push.isTrigger = true;
  // text win
  var instWin1 = createText("At last... Freedom!");
  var instWin2 = createText("Press R to restart");
  instWin2.y = instWin1.y + instWin1.height * 4;
  instruction.win = g.group(instWin1, instWin2);
  instruction.win.visible = false;
  updateInstructionWinProps();

  gameScene = g.group(world, enemiesRay, enemies, enemiesHArea, player.skin, player, timerBar, camScreen, instruction.move, instruction.push, instruction.win);

  camera = g.worldCamera(gameScene, g.canvas);
  camera.centerOver(player);

  // keyboard push
  g.key.zKey.press = function () {
    player.isPush = true;
  };
  g.key.zKey.release = function () {
    player.isPush = false;
  };
  g.key.rKey.press = function () {
    resetGame();
  };

  // keyboard movement
  g.key.leftArrow.press = function () {
    switchPlayerKeypress("isKeyLeft");
    player.skin.playSequence(player.states.left);
  };
  g.key.leftArrow.release = function () {
    player.isKeyLeft = false;
    keyActiveBehaveOnKeyRelease("isKeyLeft");
  };
  g.key.rightArrow.press = function () {
    switchPlayerKeypress("isKeyRight");
    player.skin.playSequence(player.states.right);
  };
  g.key.rightArrow.release = function () {
    player.isKeyRight = false;
    keyActiveBehaveOnKeyRelease("isKeyRight");
  };
  g.key.upArrow.press = function () {
    switchPlayerKeypress("isKeyUp");
    player.skin.playSequence(player.states.up);
  };
  g.key.upArrow.release = function () {
    player.isKeyUp = false;
    keyActiveBehaveOnKeyRelease("isKeyUp");
  };
  g.key.downArrow.press = function () {
    switchPlayerKeypress("isKeyDown");
    player.skin.playSequence(player.states.down);
  };
  g.key.downArrow.release = function () {
    player.isKeyDown = false;
    keyActiveBehaveOnKeyRelease("isKeyDown");
  };
}

function play() {
  //Move the player
  if (player.isKeyRight) {
    player.vx = speed;
    player.vy = 0;
  } else
  if (player.isKeyLeft) {
    player.vx = -speed;
    player.vy = 0;
  } else
  if (player.isKeyUp) {
    player.vy = -speed;
    player.vx = 0;
  } else
  if (player.isKeyDown) {
    player.vy = speed;
    player.vx = 0;
  } else {
    player.vx = 0;
    player.vy = 0;
    player.skin.show(player.states.idle);
  }
  updatePlayerSkin();
  player.x += player.vx;
  player.y += player.vy;
  camera.follow(player);
  camScreen.x = camera.x;
  camScreen.y = camera.y;

  updateTimerBar();

  walls.forEach(function (wall) {
    var playerVsWall = g.hitTestRectangle(player, wall);
    if (playerVsWall) {
      stopPlayerMove();
    }
  });

  // enemies
  enemies.forEach(function (enemy) {
    switch (enemy.direction) {
      case "eUp":
        enemy.vy = -eSpeed;
        break;
      case "eDown":
        enemy.vy = eSpeed;
        break;
      case "eLeft":
        enemy.vx = -eSpeed;
        break;
      case "eRight":
        enemy.vx = eSpeed;
        break;
    }
    // vs cBox
    for (var h = 0, lenh = cBoxs.length; h < lenh; h++) {
      enemy.enemyVsCbox = g.hitTestRectangle(enemy, cBoxs[h]);
      if (enemy.enemyVsCbox && enemy.isCBoxHitCheck) {
        enemy.isCBoxHitCheck = false;
        // reverse direction
        for (var j = 0, lenj = enemy.directions.length; j < lenj; j++) {
          if (enemy.direction === enemy.directions[j]) {
            enemy.direction = j === lenj - 1 ? enemy.directions[0] : enemy.directions[1];
            // play reverse animation seq.
            updateEnemyBehaviour(enemy, enemy.direction);
            break;
          }
        }
        // switch on cBoxHitCheck after a sec.
        if (enemy.cBoxTimeout) {
          clearTimeout(enemy.cBoxTimeout);
          enemy.cBoxTimeout = null;
        }
        enemy.cBoxTimeout = setTimeout(function () {
          enemy.isCBoxHitCheck = true;
        }.bind(this), 1000);
        break;
      }
    }
    // vs Box
    for (var l = 0, lenl = boxes.length; l < lenl; l++) {
      var box = boxes[l];
      enemy.enemyVsBox = g.hitTestRectangle(enemy, box);
      if (enemy.enemyVsBox && enemy.isBoxHitCheck && enemy.isCBoxHitCheck) {
        enemy.isBoxHitCheck = false;
        // reverse direction
        for (var m = 0, lenm = enemy.directions.length; m < lenm; m++) {
          if (enemy.direction === enemy.directions[m]) {
            enemy.direction = m === lenm - 1 ? enemy.directions[0] : enemy.directions[1];
            // play reverse animation seq.
            updateEnemyBehaviour(enemy, enemy.direction);
            break;
          }
        }
        // switch on cBoxHitCheck after a sec.
        if (enemy.boxTimeout) {
          clearTimeout(enemy.boxTimeout);
          enemy.boxTimeout = null;
        }
        enemy.boxTimeout = setTimeout(function () {
          enemy.isBoxHitCheck = true;
        }.bind(this), 1500);
        break;
      }
    }
    // move
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    enemy.updateRay();
  });

  enemiesHArea.forEach(function (hArea) {
    hArea.hAreaVsPlayer = g.hitTestRectangle(hArea, player);
    if (hArea.hAreaVsPlayer && hArea.isHAreaHitCheck && !player.isFound) {
      hArea.isHAreaHitCheck = false;
      setPlayerFound();
      // switch on hAreaHitCheck after a sec.
      if (hArea.hAreaTimeout) {
        clearTimeout(hArea.hAreaTimeout);
        hArea.hAreaTimeout = null;
      }
      hArea.hAreaTimeout = setTimeout(function () {
        hArea.isHAreaHitCheck = true;
      }.bind(this), 1000);
    }
  });
  // on player Found
  if (player.isFound) {
    resetLevel();
  }

  // key vs
  keys.forEach(function (key) {
    var keyVsPlayer = g.hitTestRectangle(key, player);
    if (keyVsPlayer && key.alpha === 1 && key.visible) {
      key.alpha = 0.5;
      player.doorKey = key;
    }
    if (key.alpha < 1 && key.visible) {
      key.x = player.x - player.halfWidth;
      key.y = player.y - player.skin.height;
    }
  });

  // door vs
  doors.forEach(function (door, index) {
    var doorVsPlayer = g.hitTestRectangle(door, player);
    if (doorVsPlayer && level >= 4 && index === doors.length-1 && !player.isWin) {
      showWin();
    }
    if (doorVsPlayer && player.doorKey) {
      door.visible = false;
      player.doorKey.visible = false;
      player.doorKey = null;
      level +=1;
      timerBar.reset = true;
      resetTimerBarTick(level * timerBar.defaultProps.interval);
    }
    if (doorVsPlayer && !player.doorKey && door.visible) {
      stopPlayerMove();
    }
  });

  // boxes vs
  boxes.forEach(function (box, index) {
    var boxVsWall;
    var boxVsBox;
    var boxVsDoor;
    // vs player
    var boxVsPlayer = g.hitTestRectangle(box, player);
    // show push instruction
    if (boxVsPlayer && !instruction.push.isShow && index === 2 && instruction.push.isTrigger) {
      instruction.push.isShow = true;
      showInstructionPush();
    }
    if (boxVsPlayer && !player.isPush) {
      stopPlayerMove();
    }
    // vs wall
    for (var k = 0, lenk = walls.length; k < lenk; k++) {
      boxVsWall = g.rectangleCollision(box, walls[k]);
      if (boxVsWall) {
        break;
      }
    }
    // vs door
    for (var p = 0, lenp = doors.length; p < lenp; p++) {
      boxVsDoor = g.rectangleCollision(box, doors[p]);
      if (boxVsDoor) {
        break;
      }
    }
    if (boxVsPlayer && player.isPush) {
      // vs other boxes
      for (var n = 0, lenn = boxes.length; n < lenn; n++) {
        if (box !== boxes[n]) {
          boxVsBox = g.rectangleCollision(box, boxes[n]);
          if (boxVsBox) {
            break;
          }
        }
      }
    }
    if (!boxVsBox && boxVsPlayer && player.isPush) {
      if (!boxVsWall) {
        if (player.isKeyLeft) {
          box.x -= speed;
        }
        if (player.isKeyRight) {
          box.x += speed;
        }
        if (player.isKeyUp) {
          box.y -= speed;
        }
        if (player.isKeyDown) {
          box.y += speed;
        }
      } else {
        bouncePlayer();
      }
    }
    if (boxVsBox && boxVsPlayer && player.isPush) {
      bouncePlayer(2);
    }
    if (boxVsDoor && !boxVsBox && boxVsPlayer) {
      bouncePlayer();
    }
    if (boxVsBox && boxVsDoor && boxVsPlayer) {
      bouncePlayer(2);
    }
  });
}