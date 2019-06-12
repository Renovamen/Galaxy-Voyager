FLY.Coin = function(){
    var geom = new THREE.TetrahedronGeometry(5,0);
    var mat = new THREE.MeshPhongMaterial({
        color: 0x009999,
        shininess: 0,
        specular: 0xffffff,
        shading: THREE.FlatShading
    });
    this.mesh = new THREE.Mesh(geom,mat);
    this.mesh.castShadow = true;
    this.angle = 0;
    this.dist = 0;
}
  
FLY.CoinsHolder = function(nCoins){
    this.mesh = new THREE.Object3D();
    this.coinsInUse = [];
    this.coinsPool = [];
    for (var i = 0; i < nCoins; i++){
        var coin = new FLY.Coin();
        this.coinsPool.push(coin);
    }
}
  
FLY.CoinsHolder.prototype.spawnCoins = function(){
    var nCoins = 1 + Math.floor(Math.random() * 10);
    var d = FLY.game.planetRadius + FLY.game.shipDefaultHeight + (-1 + Math.random() * 2) * (FLY.game.shipAmpHeight - 20);
    var amplitude = 10 + Math.round(Math.random() * 10);
    for (var i = 0; i < nCoins; i++){
        var coin;
        if(this.coinsPool.length) coin = this.coinsPool.pop();
        else coin = new FLY.Coin();
    
        this.mesh.add(coin.mesh);
        this.coinsInUse.push(coin);
        coin.angle = - (i * 0.02);
        coin.distance = d + Math.cos(i * 0.5) * amplitude;
        coin.mesh.position.y = -FLY.game.planetRadius + Math.sin(coin.angle) * coin.distance;
        coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
    }
}
  
FLY.CoinsHolder.prototype.rotateCoins = function(){

    for (var i = 0; i < this.coinsInUse.length; i++){
        var coin = this.coinsInUse[i];
        if (coin.exploding) continue;
        coin.angle += FLY.game.speed * FLY.deltaTime * FLY.game.coinsSpeed;
        if (coin.angle > Math.PI * 2) coin.angle -= Math.PI * 2;
        coin.mesh.position.y = -FLY.game.planetRadius + Math.sin(coin.angle) * coin.distance;
        coin.mesh.position.x = Math.cos(coin.angle) * coin.distance;
        coin.mesh.rotation.z += Math.random() * 0.1;
        coin.mesh.rotation.y += Math.random() * 0.1;
    
        var diffPos = spaceship.mesh.position.clone().sub(coin.mesh.position.clone());
        var d = diffPos.length();
        if (d < FLY.game.coinDistanceTolerance){
            this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
            this.mesh.remove(coin.mesh);
            particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, 0.8);
            FLY.addEnergy();
            i--;
        }
        else if (coin.angle > Math.PI){
            this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
            this.mesh.remove(coin.mesh);
            i--;
        }
    }
}