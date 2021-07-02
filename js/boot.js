let lives = 3;
let level = 1;

let background;
let miner;
var mouseDown;
var shapeData;



var arrows =new Array(4);
var arrowStats = [
  {
    angle: 0,
  yOffset: 0,
  xOffset: 30,
  direction:'right',
  },
  {
    angle: 90,
  yOffset: 30,
  xOffset: 0,
  direction:'down',
  }  ,
  {
    angle: 180,
  yOffset: 0,
  xOffset: -30,
  direction:'left',
  }  ,
  {
    angle: 270,
  yOffset: -30,
  xOffset: 0,
  direction:'up',
  }  
  ];
  var arrowDown=false;
