import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Flock } from '../boids/Flock';
import { UI } from '../utils/UI';

export class Scene {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private flock: Flock;
    private ui: UI;
    private skyMesh!: THREE.Mesh;  // Use definite assignment assertion

    constructor() {
        // Create clean scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0xffffff, 2000, 4000);  // Adjusted fog for larger space

        // Create and add sky background
        this.createSkyBackground();

        // Add floor grid for visual reference
        const gridSize = 800;  // Match the boid boundary size
        const gridDivisions = 40;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x000000, 0x222222);
        gridHelper.position.y = -400;  // Half the grid size
        this.scene.add(gridHelper);

        // Add bounding box visualization with more transparent material
        const boxGeometry = new THREE.BoxGeometry(800, 800, 800);  // Match the boid boundary size
        const boxMaterial = new THREE.LineBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.3
        });
        const boundingBox = new THREE.LineSegments(
            new THREE.EdgesGeometry(boxGeometry),
            boxMaterial
        );
        this.scene.add(boundingBox);

        // Create camera with wider view
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            10000  // Increased for larger viewing distance
        );
        this.camera.position.set(800, 400, 800);
        this.camera.lookAt(0, 0, 0);

        // Create renderer with enhanced settings
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            logarithmicDepthBuffer: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Add orbit controls with adjusted limits
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 3000;  // Increased for larger space
        this.controls.minDistance = 100;   // Increased minimum distance
        this.controls.maxPolarAngle = Math.PI * 0.85;
        this.controls.target.set(0, 0, 0);

        // Enhanced lighting setup
        this.setupLighting();

        // Initialize flock with larger bounds
        this.flock = new Flock(this.scene);

        // Initialize UI
        this.ui = new UI(this.flock);
    }

    private createSkyBackground() {
        // Create a much larger sphere for the sky to prevent the dark orb effect
        const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);

        // Create shader material for gradient sky with adjusted colors
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 500 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false
        });

        this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skyMesh);
    }

    private setupLighting() {
        // Enhanced ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(1, 1, 1);
        this.scene.add(mainLight);

        // Secondary fill light
        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);  // Slight blue tint
        fillLight.position.set(-1, 0.5, -1);
        this.scene.add(fillLight);
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