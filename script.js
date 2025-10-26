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

// Game State
let gameOver = false;
let currentSection = 'Start';
let currentPage = 'web'; // 'web', 'music', 'about_us', 'contact', 'hell'
let isGameActive = true;

// Spider State
let spiderIsDescending = false;
let spiderDescentAccelerated = false;
const spiderInitialY = 30;
let spiderString;
const spiderScaleFactor = 0.6;

// Scene and Camera Management
let gameScene, musicScene, aboutUsScene, contactScene, gameOverScene;
let gameCamera; // Fixed camera for web scene
let pageCamera, gameOverCamera; // Player-attached cameras
let currentActiveScene, currentActiveCamera;

// Interactable Objects
let bandTabObjects = [];
let debutAlbumTextSprite1, debutAlbumTextSprite2;

// Custom Button Menus
let musicButtonMenu;
let siteButtonMenu; // Placeholder for future use (e.g., if you make a 2D 
menu in 3D space)

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

// Placeholder Texture URLs (Use your own URLs here)
// ... (Your texture URL declarations here)

// Data for Band Tabs on the Web (Added 'Contact')
const bandTabsData = [
    { name: 'Merch', position: new THREE.Vector3(webRadius * 0.5, 1, 
webRadius * 0.3), info: 'Visit our Merch Store!', type: 'external', url: 
'https://bedbugguru.bandcamp.com/merch/' },
    { name: 'Concerts', position: new THREE.Vector3(-webRadius * 0.4, 1, 
webRadius * 0.6), info: 'See Upcoming Concerts!', type: 'external', url: 
'https://www.songkick.com/artists/10289853-bed-bug-guru/calendar' },
    { name: 'Music', position: new THREE.Vector3(webRadius * 0.2, 1, 
-webRadius * 0.5), info: 'Stream Our Music!', type: 'page', pageName: 
'music' },
    { name: 'About Us', position: new THREE.Vector3(-webRadius * 0.6, 1, 
-webRadius * 0.2), info: 'Learn About the Band!', type: 'page', pageName: 
'about_us' },
    { name: 'Legacy Site', position: new THREE.Vector3(webRadius * 0.8, 1, 
-webRadius * 0.1), info: 'Explore our Old Site!', type: 'external', url: 
'https://www.bedbugguru.org' },
    { name: 'Contact', position: new THREE.Vector3(0, 1, -webRadius * 
0.8), info: 'Get in Touch!', type: 'page', pageName: 'contact' }, // New 
tab
];

// Data for Music Streaming Links
const musicLinksData = [
    { name: 'Bandcamp', url: 
'https://bedbugguru.bandcamp.com/album/double-scoop', offset: -12, color: 
'#ADD8E6' },
    { name: 'Spotify', url: 'https://spotify.com/artist/bedbugguru', 
offset: -4, color: '#1DB954' },
    { name: 'YouTube', url: 'https://youtube.com/@bedbugguru', offset: 4, 
color: '#FF0000' },
    { name: 'SoundCloud', url: 'https://soundcloud.com/bedbugguru', 
offset: 12, color: '#FF7700' }
];


// --- Utility Functions (Omitted for brevity, assumed from your original 
code) ---
// function createTextSprite(message, x, y, z, color, fontSize, 
scaleFactor, rotationY) { ... }
// function createSpiderWeb(scene) { ... }
// function addLighting(scene, type) { ... }
// function checkCollisions() { ... }


// --- Scene/Object Creation Functions (Refactored Logic) ---

function createRendererAndAppend() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    // Ensure the canvas starts hidden while the fallback is shown
    renderer.domElement.style.display = 'none'; 
}

function createPlayerAndCameras() {
    // Player model creation (THREE.Group)
    player = new THREE.Group();
    // ... (Your player body mesh creation and addition to the group) ...

    // Camera setup (attached to player)
    pageCamera = new THREE.PerspectiveCamera(80, window.innerWidth / 
window.innerHeight, 0.1, 100);
    pageCamera.position.set(0, pagePlayerStartY + 0.5, 0);
    player.add(pageCamera);

    gameOverCamera = new THREE.PerspectiveCamera(80, window.innerWidth / 
window.innerHeight, 0.1, 100);
    gameOverCamera.position.set(0, basementPlayerStartY + 0.5, 0);
    player.add(gameOverCamera);

    // Fixed camera for the web scene (global)
    gameCamera = new THREE.PerspectiveCamera(90, window.innerWidth / 
window.innerHeight, 0.1, 1000);
    gameCamera.position.set(0, 30, 70);
    gameCamera.lookAt(0, 0, 0);
}

function createSpiderAndString() {
    // Spider model creation (THREE.Group)
    spider = new THREE.Group();
    // ... (Your spider body/leg meshes creation and addition to the 
group) ...

    // Spider string creation
    const stringMaterial = new THREE.LineBasicMaterial({ color: 0x888888, 
linewidth: 1 });
    const stringGeometry = new THREE.BufferGeometry();
    const initialStringPoints = [
        new THREE.Vector3(0, spiderInitialY + 5, 0),
        new THREE.Vector3(0, spiderInitialY, 0)
    ];
    stringGeometry.setFromPoints(initialStringPoints);
    spiderString = new THREE.Line(stringGeometry, stringMaterial);
}

// Function to create all navigation links on the web
function createBandTabSprites(scene) {
    bandTabsData.forEach(tabData => {
        const tabSprite = createTextSprite(tabData.name, 
tabData.position.x, tabData.position.y, tabData.position.z, '#FFFFFF', 50, 
8);
        tabSprite.userData = { ...tabData };
        scene.add(tabSprite);
        bandTabObjects.push(tabSprite);
    });
}

// Function to create the main album title text
function createAlbumTitleSprites(scene) {
    debutAlbumTextSprite1 = createTextSprite('DOUBLE SCOOP OUT NOW', 0, 
50, 0, '#FFD700', 45, 10);
    debutAlbumTextSprite2 = createTextSprite("BED BUG GURU'S BRAND NEW 
DEBUT ALBUM", 0, 40, 0, '#FFD700', 30, 10);
    scene.add(debutAlbumTextSprite1);
    scene.add(debutAlbumTextSprite2);
}

// --- Main Scene Setup ---

function createGameScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a202c);
    addLighting(scene, 'web');
    createSpiderWeb(scene); // Assumes existing function
    createBandTabSprites(scene);
    createAlbumTitleSprites(scene);

    scene.add(player);
    scene.add(spider);
    scene.add(spiderString);

    return scene;
}

function createGameOverScene() {
    // ... (Your lava/basement scene creation logic) ...
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x330000);
    addLighting(scene, 'hell');
    // ... (Add basement walls and lava floor here) ...

    // Placeholder game over message
    gameOverMessageSprite = createTextSprite('GAME OVER\nYOU HAVE BEEN 
BITTEN', 0, basementWallHeight / 2, 0, '#FF0000', 100, 20);
    scene.add(gameOverMessageSprite);

    return scene;
}

// --- Page Scene Creation and Menu Integration ---

function createMusicButtonMenu(scene) {
    musicButtonMenu = new THREE.Group();
    const yPosition = pagePlayerStartY + 2;

    musicLinksData.forEach(data => {
        const button = createTextSprite(data.name, data.offset, yPosition, 
-pageRoomSize / 2 + 1, data.color, 40, 5);
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
    // ... (Your room/wall creation logic here) ...

    let wallText = "PAGE CONTENT HERE";
    if (pageName === 'music') {
        wallText = 'OUR MUSIC\nAlbum: "Web of Sound"\nSingle: "Silk & 
Fury"';
        // Add the custom streaming links menu
        createMusicButtonMenu(scene);
    } else if (pageName === 'about_us') {
        wallText = 'ABOUT THE BAND\nFormed in 2023\nGenre: Insect Rock';
    } else if (pageName === 'contact') {
        wallText = 'CONTACT US\nEmail: contact@bedbugguru.com\nBooking: 
booking@bedbugguru.com';
    }

    // Main wall text for the room
    const textSprite = createTextSprite(wallText, 0, pageWallHeight / 2, 
-pageRoomSize / 2 + 0.1, '#ffffff', 50, 15);
    scene.add(textSprite);
    
    // Add the player's camera-group so it can move in this scene
    scene.add(player); 
    
    return scene;
}

// --- Game Flow and State Management ---

function switchPage(targetPageName) {
    currentPage = targetPageName;
    
    // Hide all scenes
    gameScene.visible = false;
    musicScene.visible = false;
    aboutUsScene.visible = false;
    contactScene.visible = false; // New scene toggle
    gameOverScene.visible = false;

    // Set visibility for UI elements
    const isPageScene = ['music', 'about_us', 
'contact'].includes(targetPageName);
    restartButton.style.display = isPageScene ? 'block' : 'none';
    mouseLookInfoElement.style.display = isPageScene ? 'block' : 'none'; 
    // Mobile controls visibility can be handled here if needed (e.g., 
always visible if movement is required)

    // Set active scene and camera
    if (targetPageName === 'web') {
        currentActiveScene = gameScene;
        currentActiveCamera = gameCamera; // Fixed overhead camera
        // Player body is visible on the web
        player.children.forEach(child => child.visible = true);
        returnToWeb(); // Reset spider and player position
    } else if (targetPageName === 'hell') {
        currentActiveScene = gameOverScene;
        currentActiveCamera = gameOverCamera;
        // Player body is visible on the game over screen (for drama)
        player.children.forEach(child => child.visible = true);
    } else {
        // First-person page view (Music, About Us, Contact)
        currentActiveScene = targetPageName === 'music' ? musicScene : 
                           targetPageName === 'about_us' ? aboutUsScene : 
                           contactScene;
        currentActiveCamera = pageCamera;
        // Player body is invisible in first-person view
        player.children.forEach(child => child.visible = false);
        // Reset player position for the room
        player.position.set(0, pagePlayerStartY, pageRoomSize / 2 - 5); 
        player.rotation.y = 0;
        cameraPitch = 0;
    }
    
    currentActiveScene.visible = true;
    renderer.render(currentActiveScene, currentActiveCamera);
}

function returnToWeb() {
    // Reset player position to the web center
    player.position.set(0, 0, 0);
    player.rotation.y = 0;
    cameraPitch = 0;

    // Reset spider descent and position
    spiderIsDescending = false;
    spiderDescentAccelerated = false;
    spider.position.set(0, spiderInitialY, 0);
    
    // Switch to the web scene
    switchPage('web');
}

// ... (Your remaining functions: setupEventListeners, handleMouseMove, 
handleTouchMove, onClick, onWindowResize, animate) ...


// --- Initialization Call ---
function init() {
    createRendererAndAppend();
    
    // 2. Create Base Objects
    createPlayerAndCameras();
    createSpiderAndString();
    
    // 3. Scene Creation
    gameScene = createGameScene();
    musicScene = createPageScene('music', 0x660066);
    aboutUsScene = createPageScene('about_us', 0x006600);
    contactScene = createPageScene('contact', 0x999900); // New contact 
scene
    gameOverScene = createGameOverScene();

    // 4. Initial State: Show fallback content and load the 3D scene in 
the background
    // The renderer is hidden initially.
    
    // 5. Setup Event Listeners
    setupEventListeners();
    
    // Add event listener for the "Enter 3D" button
    enter3dButton.addEventListener('click', () => {
        fallbackContent.style.display = 'none';
        renderer.domElement.style.display = 'block';
        mouseLookInfoElement.style.display = 'block'; // Show mouse info 
on start
        returnToWeb();
        animate();
    });
}

// Start the loading process
document.addEventListener('DOMContentLoaded', init);
