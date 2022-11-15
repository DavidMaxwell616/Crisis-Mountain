var _scene;
var ground;
var letters;
var jumped = false;
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

  miner = game.add.sprite(20, 500, 'miner');
  miner.anchor.x=0.5;
  miner.anchor.y=0.5;
  game.physics.box2d.enable(miner);  
  
  ground = new Phaser.Physics.Box2D.Body(game, null, 0, 520, 0.5);
  ground.setRectangle(game.width*2, 5, 0, 0, 0);

  letters = new Phaser.Physics.Box2D.Body(game, null, 410, 505, 0.5);
  letters.setRectangle(500, 30, 0, 0, 0);
 
  maxxdaddy = game.add.image(0, game.height * 0.93, 'maxxdaddy');
 game.input.onDown.addOnce(StartGame, this);
 game.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}


function mainMenuUpdate() {
  miner.body.x+=miner_speed;
  if(miner.frame<7) miner.frame++;
    else miner.frame=0;
  if (miner.body.x>game.width-20){
    jumped=false;
    miner.body.x = 20;
    }
  if(miner.body.x>125 && !jumped)
     {
      miner.body.velocity.y-=400;
      jumped = true;
    }
  if (game.fireButton.isDown) {StartGame();}
}

function StartGame(){
game.fireButton = null;
splash1.visible = false;
splash2.visible = false;
ground.destroy();
startGame = true;
}