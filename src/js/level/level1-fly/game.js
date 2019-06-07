var FLY = {};

FLY.HEIGHT = window.innerHeight;
FLY.WIDTH = window.innerWidth;

FLY.mousePos = { x: 0, y: 0 }

//COLORS
FLY.Colors = {
    red: 0xfc0404,
    white: 0xd8d0d1,
    brown: 0x2c2428,
    grey: 0x8f9090,
    orange: 0xf98101,
    blue: 0x79a2f9,
    purple: 0x390376,
    green: 0x037654,
};

// GAME VARIABLES
FLY.deltaTime = 67;
FLY.antiPool = [];
FLY.particlesPool = [];

FLY.resetGame = function(){
    FLY.game = {
        // --------------- 基本变量 --------------- 
        speed: 0,
        initSpeed: 0.0002, // 初始速度
        baseSpeed: 0.0002, // 单位速度
        targetBaseSpeed: 0.0002, // 目标速度
        incrementSpeedByTime: 0.000001, // 每单位时间提多少速
        incrementSpeedByLevel: 0.000005, // 每等级提多少速
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
    
        coinDistanceTolerance: 15,
        coinValue: 3,
        coinsSpeed: 0.5,
        coinLastSpawn: 0,
        distanceForCoinsSpawn: 60,
    
        antimatterDistanceTolerance: 10,
        antimatterValue: 10,
        antimatterSpeed: 0.6,
        antimatterLastSpawn: 0,
        distanceForAntiSpawn: 20,
    
        status : "playing",
    };

    fieldLevel.innerHTML = Math.floor(FLY.game.level);
  
    // 完美的把自己画不出好看的飞船的锅甩给玩家 :)
    setTimeout(function(){
        this.poorMessage.style.display="block";
    }, 2000)
    setTimeout(function(){
        this.poorMessage.style.display="none";
    }, 8000)
}


FLY.createShip = function(){
    spaceship = new FLY.SpaceShip();
    //spaceship.mesh.scale.set(.25,.25,.25);
    spaceship.mesh.position.y = FLY.game.shipDefaultHeight;
    scene.add(spaceship.mesh);
}

FLY.createCoins = function(){
    coinsHolder = new FLY.CoinsHolder(20);
    scene.add(coinsHolder.mesh)
}

FLY.createPlanet = function(){
    planet = new FLY.Planet();
    planet.mesh.position.y = -FLY.game.planetRadius;
    scene.add(planet.mesh);
}

FLY.createSky = function(){
    sky = new FLY.Sky();
    sky.mesh.position.y = -FLY.game.planetRadius;
    scene.add(sky.mesh);
}

FLY.createAnti = function(){
    for (var i = 0; i < 10; i++){
        var antimatter = new FLY.Antimatter();
        FLY.antiPool.push(antimatter);
    }
    ennemiesHolder = new FLY.AntiHolder();
    scene.add(ennemiesHolder.mesh)
}

FLY.createParticles = function(){
    for (var i = 0; i < 10; i++){
        var particle = new FLY.Particle();
        FLY.particlesPool.push(particle);
    }
    particlesHolder = new FLY.ParticlesHolder();
    scene.add(particlesHolder.mesh)
}

FLY.updateDistance = function(){
    FLY.game.distance += FLY.game.speed * FLY.deltaTime * FLY.game.ratioSpeedDistance;
    fieldDistance.innerHTML = Math.floor(FLY.game.distance);
    var d = 502 * (1 - (FLY.game.distance % FLY.game.distanceForLevelUpdate) / FLY.game.distanceForLevelUpdate);
    levelCircle.setAttribute("stroke-dashoffset", d);
}

FLY.updateEnergy = function(){
    // 消耗的能量 = 飞船速度 * 经过的时间 * 单位速度消耗的能量
    FLY.game.energy -= FLY.game.speed * FLY.deltaTime * FLY.game.ratioSpeedEnergy;
    FLY.game.energy = Math.max(0, FLY.game.energy);
  
    // 能量条
    energyBar.style.right = (100 - FLY.game.energy) + "%";
    // 能量值 <50 时，能量条变红
    energyBar.style.backgroundColor = (FLY.game.energy < 50)? "#f25346" : "#68c3c0";
    // 能量值 <30 时，能量条闪烁
    if (FLY.game.energy < 30) energyBar.style.animationName = "blink";
    else energyBar.style.animationName = "none";
  
    // 能量值 <1 时，游戏结束
    if (FLY.game.energy < 1) FLY.game.status = "gameover";
}
  
// 飞船加能量（获得能量块)
FLY.addEnergy = function(){
    FLY.game.energy += FLY.game.coinValue;
    FLY.game.energy = Math.min(FLY.game.energy, 100);
}
  
// 飞船减能量（撞到反物质）
FLY.removeEnergy = function(){
    FLY.game.energy -= FLY.game.antimatterValue;
    FLY.game.energy = Math.max(0, FLY.game.energy);
}
  
FLY.updatePlane = function(){
  
    FLY.game.shipSpeed = FLY.normalize(FLY.mousePos.x, -0.5, 0.5, FLY.game.shipMinSpeed, FLY.game.shipMaxSpeed);
    var targetY = FLY.normalize(FLY.mousePos.y, -0.75, 0.75, FLY.game.shipDefaultHeight - FLY.game.shipAmpHeight, FLY.game.shipDefaultHeight + FLY.game.shipAmpHeight);
    var targetX = FLY.normalize(FLY.mousePos.x, -1, 1, -FLY.game.shipAmpWidth * 0.7, -FLY.game.shipAmpWidth);
  
    FLY.game.shipCollisionDisplacementX += FLY.game.shipCollisionSpeedX;
    targetX += FLY.game.shipCollisionDisplacementX;
  
  
    FLY.game.shipCollisionDisplacementY += FLY.game.shipCollisionSpeedY;
    targetY += FLY.game.shipCollisionDisplacementY;
  
    spaceship.mesh.position.y += (targetY - spaceship.mesh.position.y) * FLY.deltaTime * FLY.game.shipMoveSensivity;
    spaceship.mesh.position.x += (targetX - spaceship.mesh.position.x) * FLY.deltaTime * FLY.game.shipMoveSensivity;
  
    spaceship.mesh.rotation.z = (targetY - spaceship.mesh.position.y) * FLY.deltaTime * FLY.game.shipRotXSensivity;
    spaceship.mesh.rotation.x = (spaceship.mesh.position.y - targetY) * FLY.deltaTime * FLY.game.shipRotZSensivity;
    var targetCameraZ = FLY.normalize(FLY.game.shipSpeed, FLY.game.shipMinSpeed, FLY.game.shipMaxSpeed, FLY.game.cameraNearPos, FLY.game.cameraFarPos);
    camera.fov = FLY.normalize(FLY.mousePos.x, -1, 1, 40, 80);
    camera.updateProjectionMatrix ()
    camera.position.y += (spaceship.mesh.position.y - camera.position.y) * FLY.deltaTime * FLY.game.cameraSensivity;
  
    FLY.game.shipCollisionSpeedX += (0 - FLY.game.shipCollisionSpeedX);
    FLY.game.shipCollisionDisplacementX += (0 - FLY.game.shipCollisionDisplacementX);
    FLY.game.shipCollisionSpeedY += (0 - FLY.game.shipCollisionSpeedY);
    FLY.game.shipCollisionDisplacementY += (0 - FLY.game.shipCollisionDisplacementY);
}
  
FLY.showReplay = function(){
    replayMessage.style.display = "block";
}
  
FLY.hideReplay = function(){
    replayMessage.style.display = "none";
}
  
FLY.normalize = function(v,vmin,vmax,tmin, tmax){
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;
}