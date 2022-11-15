var loadText;
var progress=0;
function preload() {
   game.load.crossOrigin = 'anonymous';
  game.scale.refresh();
  
  game.load.onLoadStart.add(loadStart, this);
  game.load.onLoadComplete.add(loadComplete, this);
  game.load.onFileComplete.add(fileComplete, this);
   loadText = game.add.text(32, 32, '', {
    fill: '#ffffff',
  });
 
  this.load.image('splash1', 'assets/images/Crisis_Mountain_Title.png');
  this.load.image('splash2', 'assets/images/Crisis_Mountain_Mountain.png');
  this.load.image('maxxdaddy', 'assets/images/maxxdaddy.gif');

  game.load.image(
    'background',
    'assets/images/background.png',
  );
  game.load.spritesheet('miner', 'assets/images/miner.png', 30, 36);
  game.load.physics('shapeData', 'assets/json/objects.json');
 // game.load.json('shapeData', 'assets/json/objects.json');
  // game.load.json('shapeData', 'assets/json/objects.json');
  //game.load.physics('shapeData', 'assets/json/test.json');
}

function loadStart() {
  loadText.setText('Loading ...');
}
function fileComplete(progress, cacheKey, success, totalLoaded, totalFiles) {
  loadText.setText('Loading ...'+ progress + "%");
}

function loadComplete() {
  loadText.setText('Load Complete');
  loadText.destroy();
}
