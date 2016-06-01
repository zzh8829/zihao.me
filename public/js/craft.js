if (!Detector.webgl) Detector.addGetWebGLMessage();

var width, height;
var scene, camera, renderer;

var rollOverMesh, rollOverMaterial;
var cubeGeo, cubeMaterial;

var plane, cube;
var mouse, raycaster, isShiftDown = false;

var blocks = {};
var objects = [];

var stats;

var clock = new THREE.Clock();

var autoRotate = true;
var keysdown = {};

var angle = 0;
var zoom = 1;

THREE.ImageUtils.crossOrigin = '';

init();

var socket = io();
socket.on('init', function (data) {
  for (var pos in blocks) {
    serverDeleteBlock.apply(null, pos.split(',').map(Number));
  }
  for (var pos in data) {
    serverInsertBlock.apply(null, pos.split(',').map(Number));
  }
});
socket.on('insert', function (data) {
  serverInsertBlock.apply(null, data);
});
socket.on('delete', function (data) {
  serverDeleteBlock.apply(null, data);
});
socket.on('clear', function (data) {
  serverClearBlocks.apply(null, data);
});

animate();

function init() {
  width = window.innerWidth;
  height = window.innerHeight;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    // camera.position.set( 200, 320, 640 );
  camera.lookAt(new THREE.Vector3());

  rollOverGeo = new THREE.BoxGeometry(50, 50, 50);
  rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0x1B5C5A, opacity: 0.5, transparent: true });
  rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMaterial);
  rollOverMesh.visible = false;
  scene.add(rollOverMesh);

    // cubes

  cubeGeo = new THREE.BoxGeometry(50, 50, 50);
  cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xfeb74c, shading: THREE.FlatShading });

    // grid

  var size = 2000, step = 50;

  var geometry = new THREE.Geometry();

  for (var i = - size; i <= size; i += step) {

    geometry.vertices.push(new THREE.Vector3(- size, 0, i));
    geometry.vertices.push(new THREE.Vector3(size, 0, i));

    geometry.vertices.push(new THREE.Vector3(i, 0, - size));
    geometry.vertices.push(new THREE.Vector3(i, 0, size));

  }

  var material = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.2, transparent: true });

  var line = new THREE.LineSegments(geometry, material);
  scene.add(line);

    //

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2(-1, -1);

  var geometry = new THREE.PlaneBufferGeometry(4000, 4000);
  geometry.rotateX(- Math.PI / 2);

  plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ visible: false }));
  scene.add(plane);

  objects.push(plane);

    // Lights

  var ambientLight = new THREE.AmbientLight(0x606060);
  scene.add(ambientLight);

  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(1, 0.75, 0.5).normalize();
  scene.add(directionalLight);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0px';

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.zIndex = 100;
  stats.domElement.style.visibility = 'hidden';

  window.addEventListener('resize', onWindowResize, false);

  document.addEventListener('mousemove', onDocumentMouseMove, false);
  renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    // renderer.domElement.addEventListener( 'touchstart', onDocumentTouchStart, false );
    // renderer.domElement.addEventListener( 'touchend', onDocumentTouchEnd, false);
  document.addEventListener('keydown', onDocumentKeyDown, false);
  document.addEventListener('keyup', onDocumentKeyUp, false);

  document.body.appendChild(stats.domElement);
  $('#content').append(renderer.domElement);
}

function onDocumentMouseMove(event) {

  mouse.set((event.clientX / width) * 2 - 1, - (event.clientY / height) * 2 + 1);

}

function onDocumentMouseDown(event) {

  mouse.set((event.clientX / width) * 2 - 1, - (event.clientY / height) * 2 + 1);

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    var intersect = intersects[0];
        // delete cube
    if (event.ctrlKey || event.metaKey) {
      if (intersect.object != plane) {
        var position = new THREE.Vector3().copy(intersect.object.position).divideScalar(50).floor();
        deleteBlock(position.x, position.y, position.z);
      }
        // create cube
    } else {
      var position = new THREE.Vector3().copy(intersect.point).add(intersect.face.normal).divideScalar(50).floor();
      insertBlock(position.x, position.y, position.z);
    }
  }
}

var clickTimer = null;
var lastTap = 0;

function onDocumentTouchStart(event) {
    // event.preventDefault()
  return; // Does not work!
  var pointer = getPointerEvent(event);
  var currX = pointer.pageX;
  var currY = pointer.pageY;

  mouse.set((currX / width) * 2 - 1, - (currY / height) * 2 + 1);

  raycaster.setFromCamera(mouse, camera);

  var intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    var intersect = intersects[0];
    if (clickTimer == null) {
      clickTimer = setTimeout(function () {
        clickTimer = null;
        var position = new THREE.Vector3().copy(intersect.point).add(intersect.face.normal).divideScalar(50).floor();
        insertBlock(position.x, position.y, position.z);
      }, 300);
    } else {
      clearTimeout(clickTimer);
      clickTimer = null;

      if (intersect.object != plane) {
        var position = new THREE.Vector3().copy(intersect.object.position).divideScalar(50).floor();
        deleteBlock(position.x, position.y, position.z);
      }
    }
  }
}

function onDocumentTouchEnd(event) {
    // event.preventDefault();
}

function onDocumentKeyDown(event) {
  const code = event.which || event.keyCode;
  const char = String.fromCharCode(code);

  keysdown[code] = true;

  switch (char) {
    case 'A':
      autoRotate = false;
      break;
    case 'D':
      autoRotate = false;
      break;
    case 'Q':
      if (stats.domElement.style.visibility == 'hidden') {
        stats.domElement.style.visibility = 'visible';
      } else {
        stats.domElement.style.visibility = 'hidden';
      }
      break;
    case 'C':
      clearBlocks();
      break;
  }

}

function onDocumentKeyUp(event) {
  const code = event.which || event.keyCode;
  const char = String.fromCharCode(code);

  keysdown[code] = true;

  switch (char) {
    case ' ':
      autoRotate = !autoRotate;
      break;
  }
}

function animate() {
  requestAnimationFrame(animate);

  var delta = clock.getDelta();

  if (mouse.x != -1 && mouse.y != -1)
    {
    rollOverMesh.visible = true;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {

      var intersect = intersects[0];

      rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
      rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);

    }
  }

  if (autoRotate) {
    angle += delta * 0.1;
  }

  if (keysdown[65]) { // a
    angle += delta;
  }

  if (keysdown[68]) { // d
    angle -= delta;
  }

  if (keysdown[83]) { // s
    zoom = Math.min(2, zoom * 1.01);
  }

  if (keysdown[87]) { // w
    zoom = Math.max(1, zoom / 1.01);
  }

  camera.position.x = Math.cos(angle) * 700 * zoom;
  camera.position.y = 800 * zoom;
  camera.position.z = Math.sin(angle) * 700 * zoom;
  camera.lookAt(new THREE.Vector3());

  renderer.render(scene, camera);

  stats.update();
}

function onWindowResize() {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function insertBlock(x, y, z) {
  serverInsertBlock(x, y, z);
  socket.emit('insert', [x, y, z]);
}

function serverInsertBlock(x, y, z) {
  if (!([x, y, z] in blocks))
    {
    var voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
    voxel.position.set(x, y, z).multiplyScalar(50).addScalar(25);
    scene.add(voxel);
    objects.push(voxel);
    blocks[[x, y, z]] = voxel;
  }
}

function deleteBlock(x, y, z) {
  serverDeleteBlock(x, y, z);
  socket.emit('delete', [x, y, z]);
}

function serverDeleteBlock(x, y, z) {
  if ([x, y, z] in blocks)
    {
    scene.remove(blocks[[x, y, z]]);
    objects.splice(objects.indexOf(blocks[[x, y, z]]), 1);
    delete blocks[[x, y, z]];
  }
}

function clearBlocks() {
  serverClearBlocks();
  socket.emit('clear');
}

function serverClearBlocks() {
  for (var pos in blocks) {
    serverDeleteBlock.apply(null, pos.split(',').map(Number));
  }
}
