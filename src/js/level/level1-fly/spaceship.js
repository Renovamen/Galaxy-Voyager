FLY.SpaceShip = function(){
    this.mesh = new THREE.Object3D();
    this.mesh.name = "spaceShip";
  
    // 船舱
    var geomCabin = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
    var matCabin = new THREE.MeshPhongMaterial({color: FLY.Colors.blue, shading: THREE.FlatShading});
  
    geomCabin.vertices[4].y -= 10;
    geomCabin.vertices[4].z += 20;
    geomCabin.vertices[5].y -= 10;
    geomCabin.vertices[5].z -= 20;
    geomCabin.vertices[6].y += 30;
    geomCabin.vertices[6].z += 20;
    geomCabin.vertices[7].y += 30;
    geomCabin.vertices[7].z -= 20;
  
    var cabin = new THREE.Mesh(geomCabin, matCabin);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    this.mesh.add(cabin);
  
    // 引擎
    var geomEngine = new THREE.BoxGeometry(40, 50, 50, 1, 1, 1);
    geomEngine.vertices[4].y += 20;
    geomEngine.vertices[4].z -= 20;
    geomEngine.vertices[5].y += 20;
    geomEngine.vertices[5].z += 20;
    geomEngine.vertices[6].y -= 20;
    geomEngine.vertices[6].z -= 20;
    geomEngine.vertices[7].y -= 20;
    geomEngine.vertices[7].z += 20;
    var matEngine = new THREE.MeshPhongMaterial({color: FLY.Colors.orange, shading: THREE.FlatShading});
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 50;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);
  
    // 船尾
    var geomTailPlane = new THREE.BoxGeometry(85, 10, 2, 1, 1, 1);
    var matTailPlane = new THREE.MeshPhongMaterial({color: FLY.Colors.green, shading: THREE.FlatShading});
    var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-40, 20, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);
  
    // 翅膀
    var geomSideWing = new THREE.BoxGeometry(40, 3, 250, 10, 1, 1);
    var matSideWing = new THREE.MeshPhongMaterial({color: FLY.Colors.purple, shading: THREE.FlatShading});
    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.position.set(0, 15, 0);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);
  
    var geomWindshield = new THREE.BoxGeometry(10, 15, 20, 1, 1, 1);
    var matWindshield = new THREE.MeshPhongMaterial({color: FLY.Colors.white, transparent: true, opacity: 0.3, shading: THREE.FlatShading});
    var windshield = new THREE.Mesh(geomWindshield, matWindshield);
    windshield.position.set(5, 27, 0);
    windshield.castShadow = true;
    windshield.receiveShadow = true;
    this.mesh.add(windshield);
  
    // 激光炮（我说这是激光炮这就是激光炮
    var geomGun = new THREE.BoxGeometry(100, 8, 8, 1, 1, 1);
    geomGun.vertices[4].y += 5;
    geomGun.vertices[4].z -= 5;
    geomGun.vertices[5].y += 5;
    geomGun.vertices[5].z += 5;
    geomGun.vertices[6].y -= 5;
    geomGun.vertices[6].z -= 5;
    geomGun.vertices[7].y -= 5;
    geomGun.vertices[7].z += 5;
    var matGun = new THREE.MeshPhongMaterial({color: FLY.Colors.grey, shading: THREE.FlatShading});
    this.gun = new THREE.Mesh(geomGun, matGun);
    this.gun.castShadow = true;
    this.gun.receiveShadow = true;
    this.gun.position.set(60, 0, 0);
    this.mesh.add(this.gun);
  
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
};