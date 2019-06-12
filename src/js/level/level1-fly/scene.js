// three.js 场景

FLY.createScene = function() {
    
    scene = new THREE.Scene();
    aspectRatio = FLY.WIDTH / FLY.HEIGHT;
    fieldOfView = 50;
    nearPlane = 0.1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = FLY.game.shipDefaultHeight;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(FLY.WIDTH, FLY.HEIGHT);
    renderer.shadowMap.enabled = true;
  
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);
  
    window.addEventListener('resize', FLY.handleWindowResize, false);
}