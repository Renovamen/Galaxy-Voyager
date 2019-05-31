//COLORS
var Colors = {
    red:0xfc0404,
    white:0xd8d0d1,
    brown:0x2c2428,
    grey:0x8f9090,
    orange:0xf98101,
    blue:0x79a2f9,
    purple:0x390376,
    green:0x037654,
};

///////////////

// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

function resetGame(){
  game = {
    // --------------- 基本变量 --------------- 
    speed: 0,
    initSpeed: 0.00015, // 初始速度
    baseSpeed: 0.00015, // 单位速度
    targetBaseSpeed: 0.00015, // 目标速度
    incrementSpeedByTime: 0.0000005, // 每单位时间提多少速
    incrementSpeedByLevel: 0.000001, // 每单位距离提多少速
    distanceForSpeedUpdate: 100, // 每过多少距离提一次速
    speedLastUpdate: 0, // 上次提速时间
    distance: 0, // 行驶距离
    ratioSpeedDistance: 50, // 每单位速度行驶的距离
    energy: 100, // 当前能量
    ratioSpeedEnergy: 3, // 每单位速度消耗的能量
    level: 1, // 当前等级
    levelLastUpdate: 0, // 上次升级时间
    distanceForLevelUpdate: 1000, // 每次升级提多少速

    // --------------- 飞船变量 --------------- 
    shipDefaultHeight: 100,
    shipAmpHeight: 80,
    shipAmpWidth: 75,
    shipMoveSensivity: 0.005,
    shipRotXSensivity: 0.0008,
    shipRotZSensivity: 0.0004,
    shipFallSpeed: 0.05,
    shipMinSpeed: 1.2,
    shipMaxSpeed: 1.6,
    shipSpeed: 0,
    shipCollisionDisplacementX: 0,
    shipCollisionSpeedX: 0,
    shipCollisionDisplacementY: 0,
    shipCollisionSpeedY: 0,

    // ------------- 星球变量 ------------- 
    planetRadius:1200, // 弧度
    planetLength:800, // 周长
    groundMinAmp : 5, // 地面最小凸起
    groundMaxAmp : 10, // 地面最大凸起

    cameraFarPos:500,
    cameraNearPos:150,
    cameraSensivity:0.002,

    coinDistanceTolerance:15,
    coinValue:3,
    coinsSpeed:.5,
    coinLastSpawn:0,
    distanceForCoinsSpawn:60,

    ennemyDistanceTolerance:10,
    ennemyValue:10,
    ennemiesSpeed:.6,
    ennemyLastSpawn:0,
    distanceForEnnemiesSpawn:30,

    status : "playing",
  };
  fieldLevel.innerHTML = Math.floor(game.level);

  // 完美的把自己画不出好看的飞船的锅甩给玩家 :)
  setTimeout(function(){
    poorMessage.style.display="block";
  }, 2000)
  setTimeout(function(){
    poorMessage.style.display="none";
  }, 8000)
}

//THREEJS RELATED VARIABLES

var scene, camera, fieldOfView, aspectRatio, nearPlane, 
    farPlane, renderer, container, controls;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH, mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = .1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  scene.fog = new THREE.Fog(0xf7d9aa, 100,950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.shipDefaultHeight;
  //camera.lookAt(new THREE.Vector3(0, 400, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);

  /*
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = -Math.PI / 2;
  controls.maxPolarAngle = Math.PI ;

  //controls.noZoom = true;
  //controls.noPan = true;
  //*/
}

// 鼠标事件
function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

function handleMouseUp(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}

function handleTouchEnd(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}

// LIGHTS
var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

  //scene.add(ch);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);
}

var SpaceShip = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "spaceShip";

  // 船舱
  var geomCabin = new THREE.BoxGeometry(80,50,50,1,1,1);
  var matCabin = new THREE.MeshPhongMaterial({color:Colors.blue, shading:THREE.FlatShading});

  geomCabin.vertices[4].y-=10;
  geomCabin.vertices[4].z+=20;
  geomCabin.vertices[5].y-=10;
  geomCabin.vertices[5].z-=20;
  geomCabin.vertices[6].y+=30;
  geomCabin.vertices[6].z+=20;
  geomCabin.vertices[7].y+=30;
  geomCabin.vertices[7].z-=20;

  var cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  this.mesh.add(cabin);

  // 引擎
  var geomEngine = new THREE.BoxGeometry(40,50,50,1,1,1);
  geomEngine.vertices[4].y+=20;
  geomEngine.vertices[4].z-=20;
  geomEngine.vertices[5].y+=20;
  geomEngine.vertices[5].z+=20;
  geomEngine.vertices[6].y-=20;
  geomEngine.vertices[6].z-=20;
  geomEngine.vertices[7].y-=20;
  geomEngine.vertices[7].z+=20;
  var matEngine = new THREE.MeshPhongMaterial({color:Colors.orange, shading:THREE.FlatShading});
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // 船尾
  var geomTailPlane = new THREE.BoxGeometry(85,10,2,1,1,1);
  var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.green, shading:THREE.FlatShading});
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-40,20,0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // 翅膀
  var geomSideWing = new THREE.BoxGeometry(40,3,250,10,1,1);
  var matSideWing = new THREE.MeshPhongMaterial({color:Colors.purple, shading:THREE.FlatShading});
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0,15,0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  var geomWindshield = new THREE.BoxGeometry(10,15,20,1,1,1);
  var matWindshield = new THREE.MeshPhongMaterial({color:Colors.white,transparent:true, opacity:.3, shading:THREE.FlatShading});;
  var windshield = new THREE.Mesh(geomWindshield, matWindshield);
  windshield.position.set(5,27,0);
  windshield.castShadow = true;
  windshield.receiveShadow = true;
  this.mesh.add(windshield);

  // 激光炮（我说这是激光炮这就是激光炮
  var geomGun = new THREE.BoxGeometry(100,8,8,1,1,1);
  geomGun.vertices[4].y+=5;
  geomGun.vertices[4].z-=5;
  geomGun.vertices[5].y+=5;
  geomGun.vertices[5].z+=5;
  geomGun.vertices[6].y-=5;
  geomGun.vertices[6].z-=5;
  geomGun.vertices[7].y-=5;
  geomGun.vertices[7].z+=5;
  var matGun = new THREE.MeshPhongMaterial({color:Colors.grey, shading:THREE.FlatShading});
  this.gun = new THREE.Mesh(geomGun, matGun);
  this.gun.castShadow = true;
  this.gun.receiveShadow = true;
  this.gun.position.set(60,0,0);
  this.mesh.add(this.gun);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
};

Sky = function(){
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI*2 / this.nClouds;
  for(var i=0; i<this.nClouds; i++){
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle*i;
    var h = game.planetRadius + 150 + Math.random()*200;
    c.mesh.position.y = Math.sin(a)*h;
    c.mesh.position.x = Math.cos(a)*h;
    c.mesh.position.z = -300-Math.random()*500;
    c.mesh.rotation.z = a + Math.PI/2;
    var s = 1+Math.random()*2;
    c.mesh.scale.set(s,s,s);
    this.mesh.add(c.mesh);
  }
}

Sky.prototype.moveClouds = function(){
  for(var i=0; i<this.nClouds; i++){
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed*deltaTime;

}

Planet = function(){
  var geom = new THREE.CylinderGeometry(game.planetRadius,game.planetRadius,game.planetLength,40,10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  geom.mergeVertices();
  var l = geom.vertices.length;

  this.ground = [];

  for (var i=0;i<l;i++){
    var v = geom.vertices[i];
    //v.y = Math.random()*30;
    this.ground.push({
      y:v.y,
      x:v.x,
      z:v.z,
      ang:Math.random() * Math.PI * 2,
      amp:game.groundMinAmp + Math.random() * (game.groundMaxAmp - game.groundMinAmp)
    });
  };
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.brown,
    transparent:true,
    opacity:.8,
    shading:THREE.FlatShading,
  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "ground";
  this.mesh.receiveShadow = true;
}

Planet.prototype.moveGround = function (){
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i=0; i<l; i++){
    var v = verts[i];
    var vprops = this.ground[i];
    v.x =  vprops.x + Math.cos(vprops.ang)*vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
    this.mesh.geometry.verticesNeedUpdate=true;
  }
}

Cloud = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.CubeGeometry(20,20,20);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.white,

  });

  //*
  var nBlocs = 3+Math.floor(Math.random()*3);
  for (var i=0; i<nBlocs; i++ ){
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i*15;
    m.position.y = Math.random()*10;
    m.position.z = Math.random()*10;
    m.rotation.z = Math.random()*Math.PI*2;
    m.rotation.y = Math.random()*Math.PI*2;
    var s = .1 + Math.random()*.9;
    m.scale.set(s,s,s);
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;

  }
  //*/
}

Cloud.prototype.rotate = function(){
  var l = this.mesh.children.length;
  for(var i=0; i<l; i++){
    var m = this.mesh.children[i];
    m.rotation.z+= Math.random()*.005*(i+1);
    m.rotation.y+= Math.random()*.002*(i+1);
  }
}

Ennemy = function(){
  var geom = new THREE.TetrahedronGeometry(8,2);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.red,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

EnnemiesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function(){
  var nEnnemies = game.level;

  for (var i=0; i<nEnnemies; i++){
    var ennemy;
    if (ennemiesPool.length) ennemy = ennemiesPool.pop();
    else ennemy = new Ennemy();

    ennemy.angle = - (i*0.1);
    ennemy.distance = game.planetRadius + game.shipDefaultHeight + (-1 + Math.random() * 2) * (game.shipAmpHeight-20);
    ennemy.mesh.position.y = -game.planetRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

EnnemiesHolder.prototype.rotateEnnemies = function(){
  for (var i=0; i<this.ennemiesInUse.length; i++){
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed*deltaTime*game.ennemiesSpeed;

    if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI * 2;

    ennemy.mesh.position.y = -game.planetRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    ennemy.mesh.rotation.z += Math.random()*.1;
    ennemy.mesh.rotation.y += Math.random()*.1;

    //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    var diffPos = spaceship.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.ennemyDistanceTolerance){
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.shipCollisionSpeedX = 100 * diffPos.x / d;
      game.shipCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;

      removeEnergy();
      i--;
    }
    else if (ennemy.angle > Math.PI){
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

Particle = function(){
  var geom = new THREE.TetrahedronGeometry(3,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  var speed = .6+Math.random()*.2;
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1,1,1);
      particlesPool.unshift(_this);
    }});
}

ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) particle = particlesPool.pop();
    else particle = new Particle();

    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos,color, scale);
  }
}

Coin = function(){
  var geom = new THREE.TetrahedronGeometry(5,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,

    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

CoinsHolder = function (nCoins){
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i=0; i<nCoins; i++){
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

CoinsHolder.prototype.spawnCoins = function(){

  var nCoins = 1 + Math.floor(Math.random()*10);
  var d = game.planetRadius + game.shipDefaultHeight + (-1 + Math.random() * 2) * (game.shipAmpHeight-20);
  var amplitude = 10 + Math.round(Math.random()*10);
  for (var i=0; i<nCoins; i++){
    var coin;
    if (this.coinsPool.length) coin = this.coinsPool.pop();
    else coin = new Coin();

    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i*0.02);
    coin.distance = d + Math.cos(i*.5)*amplitude;
    coin.mesh.position.y = -game.planetRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
  }
}

CoinsHolder.prototype.rotateCoins = function(){
  for (var i=0; i<this.coinsInUse.length; i++){
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed*deltaTime*game.coinsSpeed;
    if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
    coin.mesh.position.y = -game.planetRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    coin.mesh.rotation.z += Math.random()*.1;
    coin.mesh.rotation.y += Math.random()*.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = spaceship.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.coinDistanceTolerance){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
      addEnergy();
      i--;
    }
    else if (coin.angle > Math.PI){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
}


// 3D Models
var planet;
var spaceship;

function createShip(){
  spaceship = new SpaceShip();
  spaceship.mesh.scale.set(.25,.25,.25);
  spaceship.mesh.position.y = game.shipDefaultHeight;
  scene.add(spaceship.mesh);
}

function createPlanet(){
  planet = new Planet();
  planet.mesh.position.y = -game.planetRadius;
  scene.add(planet.mesh);
}

function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -game.planetRadius;
  scene.add(sky.mesh);
}

function createCoins(){

  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

function createEnnemies(){
  for (var i=0; i<10; i++){
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  scene.add(ennemiesHolder.mesh)
}

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  scene.add(particlesHolder.mesh)
}

function loop(){

  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;

  if (game.status=="playing"){

    // 每 100m 生成一些能量块
    if (Math.floor(game.distance) % game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn){
      game.coinLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();
    }
    
    // 每 100m 提一次速
    if (Math.floor(game.distance) % game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime * deltaTime;
    }

    // 每 50m 生成一些反物质
    if (Math.floor(game.distance) % game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn){
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    // 每 1000m 升一次级
    if (Math.floor(game.distance) % game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate){
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      fieldLevel.innerHTML = Math.floor(game.level);
      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel * game.level
    }

    updatePlane();
    updateDistance();
    updateEnergy();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.shipSpeed;
  }

  // 游戏结束
  else if(game.status=="gameover"){
    // 飞船坠落动画
    // 坠落过程中翻转
    spaceship.mesh.rotation.z += (-Math.PI / 2 - spaceship.mesh.rotation.z) * 0.002 * deltaTime;
    spaceship.mesh.rotation.x += 0.003 * deltaTime;
    // 高度
    spaceship.mesh.position.y -= game.shipFallSpeed * deltaTime;

    // 坠完机，等待重新开始
    if (spaceship.mesh.position.y <-100){
      showReplay();
      game.status = "waitingReplay";
    }
  }

  else if (game.status=="waitingReplay"){
    
  }


  spaceship.gun.rotation.x += 0.2 + game.shipSpeed * deltaTime * 0.005;
  planet.mesh.rotation.z += game.speed * deltaTime;

  if (planet.mesh.rotation.z > 2 * Math.PI) planet.mesh.rotation.z -= 2 * Math.PI;

  ambientLight.intensity += (0.5 - ambientLight.intensity) * deltaTime * 0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  planet.moveGround();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updateDistance(){
  game.distance += game.speed*deltaTime*game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  var d = 502*(1-(game.distance%game.distanceForLevelUpdate)/game.distanceForLevelUpdate);
  levelCircle.setAttribute("stroke-dashoffset", d);
}

var blinkEnergy=false;

function updateEnergy(){
  // 消耗的能量 = 飞船速度 * 经过的时间 * 单位速度消耗的能量
  game.energy -= game.speed * deltaTime * game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);

  // 能量条
  energyBar.style.right = (100 - game.energy) + "%";
  // 能量值 <50 时，能量条变红
  energyBar.style.backgroundColor = (game.energy < 50)? "#f25346" : "#68c3c0";
  // 能量值 <30 时，能量条闪烁
  if (game.energy < 30) energyBar.style.animationName = "blink";
  else energyBar.style.animationName = "none";

  // 能量值 <1 时，游戏结束
  if (game.energy < 1) game.status = "gameover";
}

// 飞船加能量（获得能量块)
function addEnergy(){
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}

// 飞船减能量（撞到反物质）
function removeEnergy(){
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}

function updatePlane(){

  game.shipSpeed = normalize(mousePos.x,-.5,.5,game.shipMinSpeed, game.shipMaxSpeed);
  var targetY = normalize(mousePos.y,-.75,.75,game.shipDefaultHeight-game.shipAmpHeight, game.shipDefaultHeight+game.shipAmpHeight);
  var targetX = normalize(mousePos.x,-1,1,-game.shipAmpWidth*.7, -game.shipAmpWidth);

  game.shipCollisionDisplacementX += game.shipCollisionSpeedX;
  targetX += game.shipCollisionDisplacementX;


  game.shipCollisionDisplacementY += game.shipCollisionSpeedY;
  targetY += game.shipCollisionDisplacementY;

  spaceship.mesh.position.y += (targetY-spaceship.mesh.position.y)*deltaTime*game.shipMoveSensivity;
  spaceship.mesh.position.x += (targetX-spaceship.mesh.position.x)*deltaTime*game.shipMoveSensivity;

  spaceship.mesh.rotation.z = (targetY-spaceship.mesh.position.y)*deltaTime*game.shipRotXSensivity;
  spaceship.mesh.rotation.x = (spaceship.mesh.position.y-targetY)*deltaTime*game.shipRotZSensivity;
  var targetCameraZ = normalize(game.shipSpeed, game.shipMinSpeed, game.shipMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  camera.fov = normalize(mousePos.x,-1,1,40, 80);
  camera.updateProjectionMatrix ()
  camera.position.y += (spaceship.mesh.position.y - camera.position.y)*deltaTime*game.cameraSensivity;

  game.shipCollisionSpeedX += (0-game.shipCollisionSpeedX);
  game.shipCollisionDisplacementX += (0-game.shipCollisionDisplacementX);
  game.shipCollisionSpeedY += (0-game.shipCollisionSpeedY);
  game.shipCollisionDisplacementY += (0-game.shipCollisionDisplacementY);
}

function showReplay(){
  replayMessage.style.display="block";
}

function hideReplay(){
  replayMessage.style.display="none";
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

function init(event){

  // UI

  fieldDistance = document.getElementById("distValue");
  energyBar = document.getElementById("energyBar");
  replayMessage = document.getElementById("replayMessage");
  fieldLevel = document.getElementById("levelValue");
  levelCircle = document.getElementById("levelCircleStroke");
  poorMessage = document.getElementById("poorMessage");

  resetGame();
  createScene();

  createLights(); // 光影
  createShip(); // 飞船
  createPlanet(); // 不断转的星球
  createSky(); // 天上飞的没啥用的物体
  createCoins(); // 能量块
  createEnnemies(); // 反物质
  createParticles();

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);

  loop();
}


window.addEventListener('load', init, false);
