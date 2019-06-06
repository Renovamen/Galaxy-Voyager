FLY.loop = function(){

    if (FLY.game.status=="playing"){
  
        // 每 100m 生成一些能量块
        if (Math.floor(FLY.game.distance) % FLY.game.distanceForCoinsSpawn == 0 && Math.floor(FLY.game.distance) > FLY.game.coinLastSpawn){
            FLY.game.coinLastSpawn = Math.floor(FLY.game.distance);
            coinsHolder.spawnCoins();
        }
        
        // 每 100m 提一次速
        if (Math.floor(FLY.game.distance) % FLY.game.distanceForSpeedUpdate == 0 && Math.floor(FLY.game.distance) > FLY.game.speedLastUpdate){
            FLY.game.speedLastUpdate = Math.floor(FLY.game.distance);
            FLY.game.targetBaseSpeed += FLY.game.incrementSpeedByTime * FLY.deltaTime;
        }
    
        // 每 50m 生成一些反物质
        if (Math.floor(FLY.game.distance) % FLY.game.distanceForEnnemiesSpawn == 0 && Math.floor(FLY.game.distance) > FLY.game.antimatterLastSpawn){
            FLY.game.antimatterLastSpawn = Math.floor(FLY.game.distance);
            ennemiesHolder.spawnAnti();
        }
    
        // 每 1000m 升一次级
        if (Math.floor(FLY.game.distance) % FLY.game.distanceForLevelUpdate == 0 && Math.floor(FLY.game.distance) > FLY.game.levelLastUpdate){
            FLY.game.levelLastUpdate = Math.floor(FLY.game.distance);
            FLY.game.level++;
            this.fieldLevel.innerHTML = Math.floor(FLY.game.level);
            FLY.game.targetBaseSpeed = FLY.game.initSpeed + FLY.game.incrementSpeedByLevel * FLY.game.level
        }
    
        FLY.updatePlane();
        FLY.updateDistance();
        FLY.updateEnergy();
        FLY.game.baseSpeed += (FLY.game.targetBaseSpeed - FLY.game.baseSpeed) * FLY.deltaTime * 0.02;
        FLY.game.speed = FLY.game.baseSpeed;
    }
  
    // 游戏结束
    else if(FLY.game.status=="gameover"){
        // 飞船坠落动画
        // 坠落过程中翻转
        spaceship.mesh.rotation.z += (-Math.PI / 2 - spaceship.mesh.rotation.z) * 0.002 * FLY.deltaTime;
        spaceship.mesh.rotation.x += 0.003 * FLY.deltaTime;
        // 高度
        spaceship.mesh.position.y -= FLY.game.shipFallSpeed * FLY.deltaTime;
    
        // 坠完机，等待重新开始
        if (spaceship.mesh.position.y < -100){
            FLY.showReplay();
            FLY.game.status = "waitingReplay";
        }
    }
  
    else if (FLY.game.status=="waitingReplay"){
      
    }
  
  
    //spaceship.gun.rotation.x += 0.2 + FLY.game.shipSpeed * FLY.deltaTime * 0.005;
    planet.mesh.rotation.z += FLY.game.speed * FLY.deltaTime;
  
    if (planet.mesh.rotation.z > 2 * Math.PI) planet.mesh.rotation.z -= 2 * Math.PI;
  
    ambientLight.intensity += (0.5 - ambientLight.intensity) * FLY.deltaTime * 0.005;
  
    coinsHolder.rotateCoins();
    ennemiesHolder.rotateAnti();
  
    sky.moveClouds();
    planet.moveGround();
  
    renderer.render(scene, camera);
    requestAnimationFrame(FLY.loop);
}
  

FLY.init = function(event){

    // UI
    fieldDistance = document.getElementById("distValue");
    energyBar = document.getElementById("energyBar");
    replayMessage = document.getElementById("replayMessage");
    fieldLevel = document.getElementById("levelValue");
    levelCircle = document.getElementById("levelCircleStroke");
    poorMessage = document.getElementById("poorMessage");
  
    FLY.resetGame();
    FLY.createScene();
  
    FLY.createLights(); // 光影
    FLY.createShip(); // 飞船
    FLY.createPlanet(); // 不断转的星球
    FLY.createSky(); // 天上飞的没啥用的物体
    FLY.createCoins(); // 能量块
    FLY.createAnti(); // 反物质
    FLY.createParticles();
  
    document.addEventListener('mousemove', FLY.handleMouseMove, false);
    document.addEventListener('touchmove', FLY.handleTouchMove, false);
    document.addEventListener('mouseup', FLY.handleMouseUp, false);
    document.addEventListener('touchend', FLY.handleTouchEnd, false);
  
    FLY.loop();
}
  
window.addEventListener('load', FLY.init, false);