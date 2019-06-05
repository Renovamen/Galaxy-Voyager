FLY.Antimatter = function(){
    var geom = new THREE.TetrahedronGeometry(8,2);
    var mat = new THREE.MeshPhongMaterial({
        color: FLY.Colors.red,
        shininess: 0,
        specular: 0xffffff,
        shading: THREE.FlatShading
    });
    this.mesh = new THREE.Mesh(geom,mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.dist = 0;
}
  
FLY.AntiHolder = function (){
    this.mesh = new THREE.Object3D();
    this.ennemiesInUse = [];
}
  
FLY.AntiHolder.prototype.spawnAnti = function(){
    var nAnti = FLY.game.level;
  
    for (var i = 0; i < nAnti; i++){
        var antimatter;
        if (FLY.antiPool.length) antimatter = FLY.antiPool.pop();
        else antimatter = new FLY.Antimatter();
    
        antimatter.angle = - (i * 0.1);
        antimatter.distance = FLY.game.planetRadius + FLY.game.shipDefaultHeight + (-1 + Math.random() * 2) * (FLY.game.shipAmpHeight - 20);
        antimatter.mesh.position.y = -FLY.game.planetRadius + Math.sin(antimatter.angle) * antimatter.distance;
        antimatter.mesh.position.x = Math.cos(antimatter.angle) * antimatter.distance;
    
        this.mesh.add(antimatter.mesh);
        this.ennemiesInUse.push(antimatter);
    }
}

FLY.AntiHolder.prototype.rotateAnti = function(){
    for (var i=0; i<this.ennemiesInUse.length; i++){
        var antimatter = this.ennemiesInUse[i];
        antimatter.angle += FLY.game.speed * FLY.deltaTime * FLY.game.ennemiesSpeed;
    
        if (antimatter.angle > Math.PI*2) antimatter.angle -= Math.PI * 2;
    
        antimatter.mesh.position.y = -FLY.game.planetRadius + Math.sin(antimatter.angle) * antimatter.distance;
        antimatter.mesh.position.x = Math.cos(antimatter.angle) * antimatter.distance;
        antimatter.mesh.rotation.z += Math.random()*.1;
        antimatter.mesh.rotation.y += Math.random()*.1;
    
        var diffPos = spaceship.mesh.position.clone().sub(antimatter.mesh.position.clone());
        var d = diffPos.length();
        if (d < FLY.game.antimatterDistanceTolerance){
            particlesHolder.spawnParticles(antimatter.mesh.position.clone(), 15, FLY.Colors.red, 3);
    
            FLY.antiPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
            this.mesh.remove(antimatter.mesh);
            FLY.game.shipCollisionSpeedX = 100 * diffPos.x / d;
            FLY.game.shipCollisionSpeedY = 100 * diffPos.y / d;
            ambientLight.intensity = 2;
    
            FLY.removeEnergy();
            i--;
        }

        else if (antimatter.angle > Math.PI){
            FLY.antiPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
            this.mesh.remove(antimatter.mesh);
            i--;
        }
    }
}