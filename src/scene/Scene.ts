import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Flock } from '../boids/Flock';
import { UI } from '../utils/UI';

export class Scene {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private flock: Flock;
    private ui: UI;

    constructor() {
        // Create clean scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xc6e6ff);  // Light blue sky color

        // Add floor grid for visual reference
        const gridSize = 400;  // Match the boid boundary size
        const gridDivisions = 40;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x000000, 0x222222);
        gridHelper.position.y = -200;  // Position at bottom of bounding box (-bounds)
        this.scene.add(gridHelper);

        // Add bounding box visualization
        const boxGeometry = new THREE.BoxGeometry(gridSize, gridSize, gridSize);
        const boxMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
        const boundingBox = new THREE.LineSegments(
            new THREE.EdgesGeometry(boxGeometry),
            boxMaterial
        );
        this.scene.add(boundingBox);

        // Create camera with wider view
        this.camera = new THREE.PerspectiveCamera(
            60,  // Wider field of view
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(400, 200, 400);  // Position camera further back for better view
        this.camera.lookAt(0, 0, 0);

        // Create renderer with enhanced settings
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Add orbit controls with adjusted limits
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 1000;  // Allow zooming out further for larger space
        this.controls.minDistance = 50;   // Keep minimum distance larger
        this.controls.maxPolarAngle = Math.PI * 0.85; // Prevent camera going under the scene

        // Simple lighting setup
        this.setupLighting();

        // Initialize flock
        this.flock = new Flock(this.scene);

        // Initialize UI
        this.ui = new UI(this.flock);
    }

    private setupLighting() {
        // Simple ambient light for even illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Single directional light from above
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
        mainLight.position.set(0, 1, 0);
        this.scene.add(mainLight);
    }

    public update() {
        this.controls.update();
        this.flock.update();
    }

    public render() {
        this.renderer.render(this.scene, this.camera);
    }

    public onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
} 