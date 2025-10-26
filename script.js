// --- Global Variables (Essential Three.js objects and State) ---
let renderer;
let player, spider;
let keys = {};
const playerSpeed = 0.5;
const webRadius = 50;
const pageRoomSize = 50;
const pageWallHeight = 15;
const pagePlayerStartY = 2;
const basementSize = 150;
const basementPlayerStartY = 2;
const doorWidth = 8;
const doorHeight = 12;
const sectionRadius = 5;
const basementWallHeight = 75;

// Game State
let gameOver = false;
let currentSection = 'Start';
let currentPage = 'web'; // 'web', 'music', 'contact', 'hell'
let isGameActive = true;

// Spider State
let spiderIsDescending = false;
let spiderDescentAccelerated = false;
const spiderInitialY = 30;
let spiderString;
const spiderScaleFactor = 0.6;

// Scene and Camera Management
let gameScene, musicScene, contactScene, gameOverScene;
let gameCamera; // Fixed camera for web scene
let pageCamera, gameOverCamera; // Player-attached cameras
let currentActiveScene, currentActiveCamera;

// Interactable Objects
let bandTabObjects = [];
let debutAlbumTextSprite1, debutAlbumTextSprite2;
let gameOverMessageSprite;

// Custom Button Menus
let musicButtonMenu;
let siteButtonMenu;

// Elements
const restartButton = document.getElementById('restart-button');
const mouseLookInfoElement = document.getElementById('mouse-look-info');
const fallbackContent = document.getElementById('fallback-content');
const enter3dButton = document.getElementById('enter-3d');

// Mouse Look Variables
let isDragging = false;
const mouseSensitivity = 0.002;
let cameraPitch = 0;
let lastTouchX = 0;
let lastTouchY = 0;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Placeholder Texture URLs (For demonstration, using simple colors below)
const pageWallColor = 0x333333; // Dark grey for walls


// Data for Band Tabs on the Web (The likely source of the Syntax Error was here)
const bandTabsData = [
    { name: 'Merch', position: new THREE.Vector3(webRadius * 0.5, 1, webRadius * 0.3), info: 'buy our merch', type: 'external', url: 'https://bedbugguru.bandcamp.com/merch/' },
    { name: 'Shows', position: new THREE.Vector3(-webRadius * 0.4, 1, webRadius * 0.6), info: 'see us play', type: 'external', url: 'https://www.songkick.com/artists/10289853-bed-bug-guru/calendar' },
    { name: 'Music', position: new THREE.Vector3(webRadius * 0.2, 1, -webRadius * 0.5), info: 'Stream Our Music!', type: 'page', pageName: 'music' },
    { name: 'Contact', position: new THREE.Vector3(0, 1, -webRadius * 0.8), info: 'Get in Touch!', type: 'page', pageName: 'contact' }
];

// Data for Music Streaming Links
const musicLinksData = [
    { name: 'Bandcamp', url: 'https://bedbugguru.bandcamp.com/album/double-scoop', offset: -12, color: '#ADD8E6' },
    { name: 'Spotify', url: 'https://spotify.com/artist/bedbugguru', offset: -4, color: '#1DB954' },
    { name: 'YouTube', url: 'https://youtube.com/@bedbugguru', offset: 4, color: '#FF0000' },
    { name: 'SoundCloud', url: 'https://soundcloud.com/bedbugguru', offset: 12, color: '#FF7700' }
];


// ----------------------------------------------------------------------
// --- Utility Functions ---
// ----------------------------------------------------------------------

function createTextSprite(message, x, y, z, color = '#FFFFFF', fontSize = 60, scaleFactor = 10, rotationY = 0) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const font = `${fontSize}px Inter, sans-serif`;

    context.font = font;
    const metrics = context.measureText(message);
    
    // Set canvas dimensions
    canvas.width = metrics.width + 20;
    canvas.height = fontSize * 1.5;

    context.font = font;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text (centering based on new canvas size)
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);

    // Scaling the sprite based on text size and desired scale factor
    sprite.scale.set(canvas.width / fontSize * scaleFactor, canvas.height / fontSize * scaleFactor, 1);
    sprite.position.set(x, y, z);
    
    // Custom property to make raycasting easier
    sprite.userData.isInteractable = true; 

    return sprite;
}

function addLighting(scene, type) {
    // Clear existing lights to prevent duplicates on scene switch (if run multiple times)
    scene.children = scene.children.filter(c => c.type !== 'AmbientLight' && c.type !== 'PointLight' && c.type !== 'DirectionalLight');

    if (type === 'web') {
        const ambient = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambient);

        const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
        pointLight.position.set(0, webRadius * 0.8, 0);
        scene.add(pointLight);
    } else if (type === 'page') {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, pageWallHeight, pageRoomSize / 2);
        scene.add(directionalLight);
    } else if (type === 'hell') {
        const ambient = new THREE.AmbientLight(0x330000, 1);
        scene.add(ambient);
        
        const lavaGlow = new THREE.PointLight(0xff4500, 5, basementSize);
        lavaGlow.position.set(0, basementPlayerStartY - 1, 0);
        scene.add(lavaGlow);
    }
}

function createSpiderWeb(scene) {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    
    // Horizontal circles
    for (let r = 5; r <= webRadius; r += 5) {
        const points = [];
        for (let i = 0; i <= 360; i += 10) {
            const angle = i * Math.PI / 180;
            points.push(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        scene.add(new THREE.Line(geometry, lineMaterial));
    }

    // Radial lines
    for (let i = 0; i < 360; i += 45) {
        const angle = i * Math.PI / 180;
        const startPoint = new THREE.Vector3(0, 0, 0);
        const endPoint = new THREE.Vector3(webRadius * Math.cos(angle), 0, webRadius * Math.sin(angle));
        const geometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
        scene.add(new THREE.Line(geometry, lineMaterial));
    }
}

// ----------------------------------------------------------------------
// --- Scene/Object Creation Functions (Refactored Logic) ---
// ----------------------------------------------------------------------

function createRendererAndAppend() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'none'; 
}

function createPlayerAndCameras() {
    player = new THREE.Group();
    // Placeholder for player body (visible in web/gameover scenes)
    const playerBody = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    playerBody.position.y = 1;
    player.add(playerBody);

    pageCamera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100);
    pageCamera.position.set(0, pagePlayerStartY + 0.5, 0);
    player.add(pageCamera);

    gameOverCamera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 100);
    gameOverCamera.position.set(0, basementPlayerStartY + 0.5, 0);
    player.add(gameOverCamera);

    gameCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    gameCamera.position.set(0, 30, 70);
    gameCamera.lookAt(0, 0, 0);
}

function createSpiderAndString() {
    spider = new THREE.Group();
    // Placeholder for spider body
    const spiderBody = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 * spiderScaleFactor, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x4a2a0a })
    );
    spider.add(spiderBody);
    spider.position.y = spiderInitialY;

    // Spider string creation
    const stringMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
    const stringGeometry = new THREE.BufferGeometry();
    const initialStringPoints = [
        new THREE.Vector3(0, spiderInitialY + 5, 0),
        new THREE.Vector3(0, spiderInitialY, 0)
    ];
    stringGeometry.setFromPoints(initialStringPoints);
    spiderString = new THREE.Line(stringGeometry, stringMaterial);
}

function createBandTabSprites(scene) {
    bandTabsData.forEach(tabData => {
        const tabSprite = createTextSprite(tabData.name, tabData.position.x, tabData.position.y, tabData.position.z, '#FFFFFF', 50, 8);
        tabSprite.userData = { ...tabData };
        scene.add(tabSprite);
        bandTabObjects.push(tabSprite);
    });
}

function createAlbumTitleSprites(scene) {
    debutAlbumTextSprite1 = createTextSprite('DOUBLE SCOOP OUT NOW', 0, 50, 0, '#FFD700', 45, 10);
    debutAlbumTextSprite2 = createTextSprite("BED BUG GURU'S BRAND NEW DEBUT ALBUM", 0, 40, 0, '#FFD700', 30, 10);
    scene.add(debutAlbumTextSprite1);
    scene.add(debutAlbumTextSprite2);
}

function createGameScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);
    addLighting(scene, 'web');
    createSpiderWeb(scene);
    createBandTabSprites(scene);
    createAlbumTitleSprites(scene);

    scene.add(player);
    scene.add(spider);
    scene.add(spiderString);

    return scene;
}

function createGameOverScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x330000);
    addLighting(scene, 'hell');
    
    // Lava floor (basic color for non-texture loading)
    const lavaMaterial = new THREE.MeshBasicMaterial({ color: 0xFF4500, emissive: 0xcc3300, emissiveIntensity: 0.8 });
    const lavaFloor = new THREE.Mesh(new THREE.PlaneGeometry(basementSize, basementSize), lavaMaterial);
    lavaFloor.rotation.x = -Math.PI / 2;
    lavaFloor.position.y = basementPlayerStartY - 2;
    scene.add(lavaFloor);

    // Placeholder game over message
    gameOverMessageSprite = createTextSprite('GAME OVER\nYOU HAVE BEEN BITTEN', 0, basementWallHeight / 2, 0, '#FF0000', 100, 20);
    scene.add(gameOverMessageSprite);

    return scene;
}

function createMusicButtonMenu(scene) {
    musicButtonMenu = new THREE.Group();
    const yPosition = pagePlayerStartY + 2;

    musicLinksData.forEach(data => {
        const button = createTextSprite(data.name, data.offset, yPosition, -pageRoomSize / 2 + 1, data.color, 40, 5);
        button.userData = { type: 'external', url: data.url };
        musicButtonMenu.add(button);
    });

    musicButtonMenu.position.set(0, pageWallHeight / 2 - 2, 0); 
    scene.add(musicButtonMenu);
}


function createPageScene(pageName, backgroundColor) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    addLighting(scene, 'page');
    
    // Create the room geometry (walls, floor, ceiling)
    const wallMaterial = new THREE.MeshStandardMaterial({ color: pageWallColor, side: THREE.BackSide });
    const roomGeometry = new THREE.BoxGeometry(pageRoomSize, pageWallHeight, pageRoomSize);
    const roomMesh = new THREE.Mesh(roomGeometry, wallMaterial);
    roomMesh.position.y = pageWallHeight / 2;
    scene.add(roomMesh);


    let wallText = "PAGE CONTENT HERE";
    if (pageName === 'music') {
        wallText = 'OUR MUSIC\nAlbum: "Web of Sound"\nSingle: "Silk & Fury"';
        // Add the custom streaming links menu
        createMusicButtonMenu(scene);
    } else if (pageName === 'contact') {
        wallText = 'CONTACT US\nEmail: contact@bedbugguru.com\nBooking: booking@bedbugguru.com';
    }

    // Main wall text for the room
    const textSprite = createTextSprite(wallText, 0, pageWallHeight / 2, -pageRoomSize / 2 + 0.1, '#ffffff', 50, 15);
    scene.add(textSprite);
    
    scene.add(player); 
    
    return scene;
}

// ----------------------------------------------------------------------
// --- Game Flow and State Management ---
// ----------------------------------------------------------------------

function switchPage(targetPageName) {
    currentPage = targetPageName;
    
    gameScene.visible = false;
    musicScene.visible = false;
    contactScene.visible = false; 
    gameOverScene.visible = false;

    const isPageScene = ['music', 'contact'].includes(targetPageName);
    restartButton.style.display = isPageScene ? 'block' : 'none';
    mouseLookInfoElement.style.display = isPageScene ? 'block' : 'none'; 

    if (targetPageName === 'web') {
        currentActiveScene = gameScene;
        currentActiveCamera = gameCamera; 
        player.children.forEach(child => child.visible = true);
        animate();
    } else if (targetPageName === 'hell') {
        currentActiveScene = gameOverScene;
        currentActiveCamera = gameOverCamera;
        player.children.forEach(child => child.visible = true);
    } else {
        currentActiveScene = targetPageName === 'music' ? musicScene :  
                           contactScene;
        currentActiveCamera = pageCamera;
        player.children.forEach(child => child.visible = false);
        player.position.set(0, pagePlayerStartY, pageRoomSize / 2 - 5); 
        player.rotation.y = 0;
        cameraPitch = 0;
    }
    
    currentActiveScene.visible = true;
}

function returnToWeb() {
    player.position.set(0, 0, 0);
    player.rotation.y = 0;
    cameraPitch = 0;

    spiderIsDescending = false;
    spiderDescentAccelerated = false;
    spider.position.set(0, spiderInitialY, 0);
    
    switchPage('web');
}

// ----------------------------------------------------------------------
// --- Input and Event Handling ---
// ----------------------------------------------------------------------

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
    document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    
    // Mouse Look (Desktop)
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    
    // Touch Controls (Mobile)
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd);
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });

    // Click/Tap Interaction
    renderer.domElement.addEventListener('click', onClick);

    // UI Buttons
    restartButton.addEventListener('click', returnToWeb);

    // Initial 3D Entry Button (Fix included here)
    enter3dButton.addEventListener('click', (e) => {
        e.preventDefault(); // <-- FIX for the # in URL issue
        fallbackContent.style.display = 'none';
        renderer.domElement.style.display = 'block';
        mouseLookInfoElement.style.display = 'block';
        returnToWeb();
    });

    // Mobile Control Buttons
    document.getElementById('mobile-up').addEventListener('touchstart', (e) => { keys['w'] = true; e.preventDefault(); }, { passive: false });
    document.getElementById('mobile-up').addEventListener('touchend', () => { keys['w'] = false; });
    document.getElementById('mobile-down').addEventListener('touchstart', (e) => { keys['s'] = true; e.preventDefault(); }, { passive: false });
    document.getElementById('mobile-down').addEventListener('touchend', () => { keys['s'] = false; });
    document.getElementById('mobile-left').addEventListener('touchstart', (e) => { keys['a'] = true; e.preventDefault(); }, { passive: false });
    document.getElementById('mobile-left').addEventListener('touchend', () => { keys['a'] = false; });
    document.getElementById('mobile-right').addEventListener('touchstart', (e) => { keys['d'] = true; e.preventDefault(); }, { passive: false });
    document.getElementById('mobile-right').addEventListener('touchend', () => { keys['d'] = false; });
}

function onWindowResize() {
    if (gameCamera) {
        gameCamera.aspect = window.innerWidth / window.innerHeight;
        gameCamera.updateProjectionMatrix();
    }
    if (pageCamera) {
        pageCamera.aspect = window.innerWidth / window.innerHeight;
        pageCamera.updateProjectionMatrix();
    }
    if (gameOverCamera) {
        gameOverCamera.aspect = window.innerWidth / window.innerHeight;
        gameOverCamera.updateProjectionMatrix();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(e) {
    if (currentPage !== 'web') {
        isDragging = true;
    }
}

function onMouseUp() {
    isDragging = false;
}

function onMouseMove(e) {
    if (isDragging && currentPage !== 'web') {
        const deltaX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        const deltaY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        player.rotation.y -= deltaX * mouseSensitivity;

        cameraPitch -= deltaY * mouseSensitivity;
        cameraPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraPitch));
        pageCamera.rotation.x = cameraPitch;
        gameOverCamera.rotation.x = cameraPitch;
    }
}

function onTouchStart(e) {
    if (e.touches.length === 1 && currentPage !== 'web') {
        e.preventDefault(); // Prevent scrolling
        lastTouchX = e.touches[0].pageX;
        lastTouchY = e.touches[0].pageY;
        isDragging = true;
    }
}

function onTouchEnd() {
    isDragging = false;
}

function onTouchMove(e) {
    if (isDragging && e.touches.length === 1 && currentPage !== 'web') {
        e.preventDefault(); // Prevent scrolling
        const touchX = e.touches[0].pageX;
        const touchY = e.touches[0].pageY;

        const deltaX = touchX - lastTouchX;
        const deltaY = touchY - lastTouchY;

        player.rotation.y -= deltaX * mouseSensitivity * 5; // Increased sensitivity for touch

        cameraPitch -= deltaY * mouseSensitivity * 5;
        cameraPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraPitch));
        pageCamera.rotation.x = cameraPitch;
        gameOverCamera.rotation.x = cameraPitch;

        lastTouchX = touchX;
        lastTouchY = touchY;
    }
}

function onClick(e) {
    // Convert mouse/touch position to normalized device coordinates
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Set raycaster to shoot from camera
    raycaster.setFromCamera(mouse, currentActiveCamera);

    // Check for intersections
    let interactableObjects = [];
    if (currentPage === 'web') {
        interactableObjects = bandTabObjects;
    } else if (currentPage === 'music' && musicButtonMenu) {
        // Collect all sprites in the music button group
        musicButtonMenu.children.forEach(child => {
            if (child.type === 'Sprite') {
                interactableObjects.push(child);
            }
        });
    }

    const intersects = raycaster.intersectObjects(interactableObjects);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        const userData = object.userData;

        if (userData.type === 'external') {
            window.open(userData.url, '_blank');
        } else if (userData.type === 'page') {
            switchPage(userData.pageName);
        }
    }
}

function updateMovement() {
    let forward = 0;
    let sideways = 0;

    if (keys['w']) forward += 1;
    if (keys['s']) forward -= 1;
    if (keys['a']) sideways -= 1;
    if (keys['d']) sideways += 1;
    
    if (forward !== 0 || sideways !== 0) {
        const angle = player.rotation.y + Math.atan2(sideways, forward);
        player.position.x += Math.sin(angle) * playerSpeed;
        player.position.z += Math.cos(angle) * playerSpeed;
    }

    // Boundary check for page scenes
    if (currentPage !== 'web' && currentPage !== 'hell') {
        const halfSize = pageRoomSize / 2;
        player.position.x = Math.max(-halfSize + 1, Math.min(halfSize - 1, player.position.x));
        player.position.z = Math.max(-halfSize + 1, Math.min(halfSize - 1, player.position.z));
    }
    
    // Boundary check for web scene (clamping to the web area)
    if (currentPage === 'web') {
        const distance = player.position.distanceTo(new THREE.Vector3(0, player.position.y, 0));
        if (distance > webRadius - 2) {
            player.position.normalize().multiplyScalar(webRadius - 2);
            player.position.y = 0;
        }
    }
}

function updateSpider() {
    if (spiderIsDescending) {
        const descentSpeed = spiderDescentAccelerated ? 0.2 : 0.05;
        
        spider.position.y -= descentSpeed;
        
        // Update spider string
        const posArray = spiderString.geometry.attributes.position.array;
        posArray[4] = spider.position.y;
        spiderString.geometry.attributes.position.needsUpdate = true;
    }
}

// ----------------------------------------------------------------------
// --- Main Loop ---
// ----------------------------------------------------------------------

function animate() {
    requestAnimationFrame(animate);

    if (currentPage !== 'web' && currentPage !== 'hell') {
        updateMovement();
    } else if (currentPage === 'web') {
        // Only run spider logic on the web
        updateSpider();
        // checkCollisions(); // Assuming you have collision logic
    }
    
    // Use the currently active scene and camera for rendering
    if (currentActiveScene && currentActiveCamera) {
        renderer.render(currentActiveScene, currentActiveCamera);
    }
}

// ----------------------------------------------------------------------
// --- Initialization ---
// ----------------------------------------------------------------------

function init() {
    createRendererAndAppend();
    
    createPlayerAndCameras();
    createSpiderAndString();
    
    // Scene Creation
    gameScene = createGameScene();
    musicScene = createPageScene('music', 0x660066);
    contactScene = createPageScene('contact', 0x999900); // New contact scene
    gameOverScene = createGameOverScene();

    // Initial State: Show fallback content and load the 3D scene in the background
    // We call animate() only after the user clicks 'Enter 3D'
    
    setupEventListeners();
}

// Start the loading process
document.addEventListener('DOMContentLoaded', init);
