const game = new Phaser.Game(560, 400, Phaser.BOX2D, 'game', {
  preload,
  create,
  update,
  render,
});

function create() {
 // if (!startGame) mainMenuCreate();
 // else gameCreate();

 game.physics.startSystem(Phaser.Physics.BOX2D);
 game.physics.box2d.gravity.y = 500;
 game.physics.box2d.setBoundsToWorld();
 game.physics.box2d.friction = 1;
 game.physics.box2d.restitution = 0.1;
 game.physics.box2d.debugDraw.joints = true;
 var size = 1.5;
// var shape = game.cache.getJSON('shapeData');
// console.log(shape);

background = game.add.sprite(0, 0, 'background');
 //  shapeData = game.cache.getJSON('shapeData');
   game.physics.box2d.enable(background);
   background.body.static = true;
   background.body.clearFixtures();
 //  shapeData.mine.forEach(element => {
 //    element.shape = element.shape.map(x => x * size);
 //  });
 //console.log(shapeData.mine[1]);
background.body.loadPolygon('shapeData','mine', background);
background.anchor.x=0.5;
background.anchor.y=0.5;
// Reset box2d world bounds     
this.game.physics.box2d.setBoundsToWorld();
background.body.x+=background.width/2;
background.body.y+=background.height/2;

game.input.onDown.add(function(){mouseDown=true;}, this);
  game.input.onUp.add(function(){arrowDown=false;mouseDown=false;}, this);
  game.cursors = game.input.keyboard.createCursorKeys();
  game.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}



function collisionTest(object1, object2) {
  const rect1 = {
    x: object1.x - object1.width / 2,
    y: object1.y + object1.height / 2,
    width: object1.width,
    height: object1.height,
  };
  const rect2 = {
    x: object2.x - object2.width / 2,
    y: object2.y + object2.height / 2,
    width: object2.width,
    height: object2.height,
  };

  if (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y > rect2.y - rect1.height
  ) {
    return true;
    // collision detected!
  }
  return false;
} // end collisionTest

function update() {
}


function render() {
  game.debug.body(background);
  //     game.debug.box2dWorld(); 
 }
