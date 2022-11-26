const game = new Phaser.Game(800, 600, Phaser.BOX2D, 'game', {
  preload,
  create,
  update,
  render,
});

function create() {
  game.physics.startSystem(Phaser.Physics.BOX2D);
  game.physics.box2d.gravity.y = 500;
  game.physics.box2d.setBoundsToWorld();
  game.physics.box2d.restitution = 0.1;
  game.physics.box2d.friction = 1;
  
 mainMenuCreate(game);
}

function gameCreate(){
  background = game.add.sprite(0, 0, 'background');
  game.physics.box2d.enable(background);
  background.body.static = true;
  background.body.clearFixtures();
  //background.body.loadPolygon('shapeData','mine', background);
  var shapeData = game.cache.getPhysicsData('shapeData');
  var newData = resizeShapes(shapeData, 1.43,'mine');
  background.body.loadPolygon(newData,'mine', background);
  //background.anchor.x=0.5;
  //background.anchor.y=0.5;
  background.scale.x=1.43;
  background.scale.y=1.43;
  game.physics.box2d.setBoundsToWorld();
  background.body.x+=background.width/2;
  background.body.y+=background.height/2;

  game.input.onDown.add(function(){mouseDown=true;}, this);
  game.input.onUp.add(function(){arrowDown=false;mouseDown=false;}, this);
  game.cursors = game.input.keyboard.createCursorKeys();
  game.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function resizeShapes(data, scale, key)
{
  newData = [];
  for (var i = 0; i < data.length; i++) {
    var vertices = [];
    for (var j = 0; j < data[i].shape.length; j += 2) {
      vertices[j] = data[i].shape[j] * scale;
      vertices[j + 1] = data[i].shape[j + 1] * scale;
    }
  
    newData.push({
      bounce : data[i].bounce,
      density : data[i].density,
      friction : data[i].friction,
      filter : data[i].filter,
      shape : vertices
    });
  }
  var item = {};
item[key] = newData;
  return item;
}
function update() {
  if(!startGame){
    mainMenuUpdate();
    return;
  }
  if (game.cursors.left.isDown && !isFalling && !isJumping) {
    miner.body.x-=miner_speed;
    if(miner.frame<7) miner.frame++;
    else miner.frame=0;
      }
  if (game.cursors.right.isDown && !isFalling && !isJumping) {
    miner.body.x+=miner_speed;
  if(miner.frame<7) miner.frame++;
    else miner.frame=0;
      }
  if(game.fireButton.isDown)
  {
    miner.body.velocity.y-=50;
  }
}


function render() {
game.debug.box2dWorld(); 
  if(!startGame)
return;
  game.debug.body(background);
 game.debug.body(miner);
 }
