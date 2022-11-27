var _scene;
var ground;
var letters;
var jumping = false;

function mainMenuCreate(game) {
  _scene = game;
  splash2 = game.add.image(0, 0, 'splash2');
  splash2.width = game.width*.81;
  splash2.height = game.height*.34;
  splash2.x=160;
  splash2.y=35;
  splash1 = game.add.image(0, 0, 'splash1');
  splash1.width = game.width;
  splash1.height = game.height;
  game.physics.box2d.gravity.y = 1500;
  mask = game.add.graphics(0, 0);
  mask.beginFill(0x00);
  mask.drawRect(0, 100, game.width,240);
  splash2.mask = mask;

  miner = game.add.sprite(20, 500, 'miner');
  miner.anchor.x=0.5;
  miner.anchor.y=0.5;
  game.physics.box2d.enable(miner);  
  
  ground = new Phaser.Physics.Box2D.Body(game, null, 0, 520, 0.5);
  ground.setRectangle(game.width*2, 5, 0, 0, 0);

  letters = new Phaser.Physics.Box2D.Body(game, null, 410, 505, 0.5);
  letters.setRectangle(500, 30, 0, 0, 0);
 
  maxxdaddy = game.add.image(game.width*.8, game.height * 0.93, 'maxxdaddy');
  game.input.onDown.addOnce(StartGame, this);
  game.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}


function mainMenuUpdate() {
  miner.body.x = Math.round(miner.body.x)+miner_speed;
  mask.y--;
  if(mask.y<-100)
  mask.y=startMaskY;

 if(miner.frame<7 && !jumping) miner.frame++;
  if (miner.body.x>game.width-20){
    miner.body.x = 20;
    }
  if(Math.abs(125-miner.body.x)<2 && !jumping ||
   Math.abs(625-miner.body.x)<2 && !jumping )

  {
      miner.body.velocity.y-=400;
      jumping = true;
  }
  else
    jumping = false;
  if (game.fireButton.isDown) {StartGame();}
}

function StartGame(){
game.fireButton = null;
splash1.visible = false;
splash2.visible = false;
game.world.remove(ground);
game.world.remove(letters);
startGame = true;
gameCreate(); 
}