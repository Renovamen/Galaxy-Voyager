FLY.Planet = function(){
    var geom = new THREE.CylinderGeometry(FLY.game.planetRadius, FLY.game.planetRadius, FLY.game.planetLength, 40, 10);
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    geom.mergeVertices();
    var l = geom.vertices.length;
  
    this.ground = [];
  
    for (var i = 0; i < l; i++){
        var v = geom.vertices[i];
        this.ground.push({
            y: v.y,
            x: v.x,
            z: v.z,
            ang: Math.random() * Math.PI * 2,
            amp: FLY.game.groundMinAmp + Math.random() * (FLY.game.groundMaxAmp - FLY.game.groundMinAmp)
        });
    };
    var mat = new THREE.MeshPhongMaterial({
        color: FLY.Colors.brown,
        transparent: true,
        opacity: 0.8,
        shading: THREE.FlatShading,
    });
  
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.name = "ground";
    this.mesh.receiveShadow = true;
}
  
FLY.Planet.prototype.moveGround = function (){
    var verts = this.mesh.geometry.vertices;
    var l = verts.length;
    for (var i = 0; i < l; i++){
        var v = verts[i];
        var vprops = this.ground[i];
        v.x =  vprops.x + Math.cos(vprops.ang) * vprops.amp;
        v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
        this.mesh.geometry.verticesNeedUpdate = true;
    }
}