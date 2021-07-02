function mainMenuCreate() {
  splash1 = game.add.image(0, 0, 'splash1');
  splash1.width = game.width;
  splash1.height = game.height;
  splash1.visible = false;

  splash2 = game.add.image(game.width *.307, 100, 'splash2');
  splash2.visible = false;

  splash3 = game.add.image(game.width*.300, 153, 'splash3');
  splash3.visible = false;

  splash4 = game.add.sprite(game.width*.350, 170, 'splash4');
  splash4.visible = false;

  splash5 = game.add.image(game.width*.5, 285, 'splash5');
  splash5.visible = false;
  maxxdaddy = game.add.image(0, game.height * 0.93, 'maxxdaddy');

 game.input.onDown.addOnce(StartGame, this);
 game.fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
}

function mainMenuShowSplash() {
  splash1.visible = true;
  const phase = splashPhase;
  switch (phase) {
    case 0:
      splash2.visible = true;
      splashPhase++;
      break;
    case 1:
      splash3.visible = true;
      splashPhase++;
      break;
    case 2:
      splash4.visible = true;
      splashPhase++;
      break;
    case 3:
      splash5.visible = true;
      splashPhase++;
      break;
    case 4:
      splash2.visible = false;
      splash3.visible = false;
      splash4.visible = false;
      splash5.visible = false;
      splashPhase++;
      break;
    default:
      break;
  }
  if (splashPhase > 4) splashPhase = 0;
}

function mainMenuUpdate() {
  splashTick++;
  if (splashTick > 50) {
    mainMenuShowSplash();
    splashTick = 0;
  }

  if (game.fireButton.isDown) {StartGame();}
}

function StartGame(){
game.fireButton = null;
splash1.visible = false;
splash2.visible = false;
splash3.visible = false;
splash4.visible = false;
splash5.visible = false;
gameCreate();
buildLevel();
startGame = true;
}