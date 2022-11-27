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
  var shapeData = game.cache.getPhysicsData('shapeData');
  console.log(game.cache);
  background.body.loadPolygon(shapeData,'mine', background);
  //background.body.SetPosition(100,100);
  console.log(background.body);
  // var newData = resizeShapes(shapeData, worldScale,'mine');
  // background.body.loadPolygon(newData,'mine', background);
  // //background.anchor.x=0.5;
  //background.anchor.y=0.5;
  background.scale.x=worldScale;
  background.scale.y=worldScale;
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
  const x = data[key];
  for (var i = 0; i < x.length; i++) {
    var vertices = [];
    for (var j = 0; j < x[i].shape.length; j += 2) {
      vertices[j] = x[i].shape[j] * scale;
      vertices[j + 1] = x[i].shape[j + 1] * scale;
    }
    
    newData.push({
      filter : x[i].filter,
      shape : vertices
    });
  }
  var item = {};
item[key] = [];
item[key]=newData;
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
