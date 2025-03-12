import * as THREE from 'three';
import { Boid } from './Boid';
import { Octree } from '../utils/Octree';

export class Flock {
    private boids: Boid[] = [];
    private octree: Octree;
    private obstacles: THREE.Mesh[] = [];
    private scene: THREE.Scene;
    private boidSize: number = 2.0;
    private bounds = {
        width: 1000,
        height: 1000,
        depth: 1000
    };
    private colorMode: 'proximity' | 'uniform' = 'uniform';
    private isPlacingObstacles: boolean = false;
    private lastUpdateTime: number = 0;
    private needsSettling: boolean = true;

    constructor(scene: THREE.Scene, numBoids: number = 1000) {
        this.scene = scene;
        this.octree = new Octree(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(this.bounds.width, this.bounds.height, this.bounds.depth)
        );

        this.createBoids(numBoids);
    }

    private createBoids(count: number) {
        // Force a huge initial deltaTime by setting to 0, just like on page load
        this.lastUpdateTime = 0;

        this.needsSettling = true;
        this.boids.forEach(boid => {
            this.scene.remove(boid.mesh);
        });
        this.boids = [];

        // Calculate optimal cluster parameters
        const maxBoidsPerCluster = 50;
        const numClusters = Math.max(2, Math.ceil(count / maxBoidsPerCluster));
        const boidsPerCluster = Math.floor(count / numClusters);
        const remainingBoids = count - (boidsPerCluster * numClusters);

        // Create a tighter initial formation
        const globalCenter = new THREE.Vector3(0, 0, 0);
        const formationRadius = this.bounds.width * 0.15;  // Reduced from 0.3 for tighter formation

        // Create clusters in a more compact arrangement
        for (let c = 0; c < numClusters; c++) {
            const clusterAngle = (c / numClusters) * Math.PI * 2;
            const clusterRadius = formationRadius * (0.5 + Math.random() * 0.5); // Vary cluster distances
            const clusterCenter = new THREE.Vector3(
                Math.cos(clusterAngle) * clusterRadius,
                (Math.random() - 0.5) * formationRadius * 0.4,  // Reduced vertical spread
                Math.sin(clusterAngle) * clusterRadius
            );

            // Create boids in a disc formation around cluster center
            for (let i = 0; i < boidsPerCluster; i++) {
                const golden_ratio = 1.618033988749895;
                const theta = 2 * Math.PI * golden_ratio * i;
                // Tighter initial spacing
                const radius = Math.sqrt(i / boidsPerCluster) * 30;  // Reduced from 60

                const position = new THREE.Vector3(
                    clusterCenter.x + Math.cos(theta) * radius,
                    clusterCenter.y + (Math.random() - 0.5) * 20,  // Reduced vertical variation
                    clusterCenter.z + Math.sin(theta) * radius
                );

                const boid = new Boid(position);

                // Calculate velocities relative to global center for more cohesive movement
                const toGlobalCenter = globalCenter.clone().sub(position).normalize();
                const perpendicular = new THREE.Vector3(-toGlobalCenter.z, 0, toGlobalCenter.x);

                // More emphasis on moving towards global center
                const initialDir = toGlobalCenter.clone()
                    .multiplyScalar(0.8)  // 80% towards global center
                    .add(perpendicular.multiplyScalar(0.2));  // 20% circular

                // Set initial velocity with controlled speed
                boid.setInitialVelocity(initialDir, 30.0);  // Fixed initial speed

                this.boids.push(boid);
                this.scene.add(boid.mesh);
            }
        }

        // Add remaining boids with stronger bias towards global center
        for (let i = 0; i < remainingBoids; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = formationRadius * 0.5 * Math.random();  // Keep remaining boids closer to center
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * formationRadius * 0.2,
                Math.sin(angle) * radius
            );

            const boid = new Boid(position);

            // Direct remaining boids more strongly towards center
            const toCenter = globalCenter.clone().sub(position).normalize();
            // Set initial velocity with same controlled speed
            boid.setInitialVelocity(toCenter, 30.0);

            this.boids.push(boid);
            this.scene.add(boid.mesh);
        }
    }

    public update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
        this.lastUpdateTime = currentTime;

        // Skip update if we need settling time or if delta is too large
        if (this.needsSettling || deltaTime > 0.1) {
            this.needsSettling = false;  // Clear flag after one frame
            return;
        }

        // Update each boid
        for (const boid of this.boids) {
            boid.update(this.boids, deltaTime);
        }
    }

    public setBoidCount(count: number) {
        this.createBoids(count);
        this.needsSettling = true;  // Ensure settling time after changing count
    }

    public getBoidCount(): number {
        return this.boids.length;
    }

    public addObstacle(position: THREE.Vector3, radius: number = 5): void {
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.6
        });
        const obstacle = new THREE.Mesh(geometry, material);
        obstacle.position.copy(position);
        this.obstacles.push(obstacle);
        this.scene.add(obstacle);
    }

    public removeAllObstacles(): void {
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle);
        }
        this.obstacles = [];
    }

    public setObstaclePlacementMode(enabled: boolean): void {
        this.isPlacingObstacles = enabled;
    }

    public isInObstaclePlacementMode(): boolean {
        return this.isPlacingObstacles;
    }

    public createWallOfObstacles(start: THREE.Vector3, end: THREE.Vector3, spacing: number = 20): void {
        const direction = end.clone().sub(start);
        const length = direction.length();
        const numObstacles = Math.floor(length / spacing);
        direction.normalize();

        for (let i = 0; i <= numObstacles; i++) {
            const position = start.clone().add(direction.clone().multiplyScalar(i * spacing));
            this.addObstacle(position);
        }
    }

    public createCircleOfObstacles(center: THREE.Vector3, radius: number, numObstacles: number = 12): void {
        for (let i = 0; i < numObstacles; i++) {
            const angle = (i / numObstacles) * Math.PI * 2;
            const position = new THREE.Vector3(
                center.x + Math.cos(angle) * radius,
                center.y,
                center.z + Math.sin(angle) * radius
            );
            this.addObstacle(position);
        }
    }

    public getBoid(index: number): Boid | undefined {
        return this.boids[index];
    }

    public setWeight(behavior: 'separation' | 'alignment' | 'cohesion', weight: number): void {
        for (const boid of this.boids) {
            boid.setWeight(behavior, weight);
        }
    }

    public setMaxSpeed(speed: number): void {
        for (const boid of this.boids) {
            boid.setMaxSpeed(speed);
        }
    }

    public setPerceptionRadius(radius: number): void {
        for (const boid of this.boids) {
            boid.setPerceptionRadius(radius);
        }
    }

    public setBoidSize(size: number) {
        this.boidSize = size;
        for (const boid of this.boids) {
            boid.mesh.scale.setScalar(size);
        }
    }

    public getBoidSize(): number {
        return this.boidSize;
    }

    public setColorMode(mode: 'proximity' | 'uniform'): void {
        this.colorMode = mode;
        for (const boid of this.boids) {
            boid.setColorMode(mode);
        }
    }

    public getColorMode(): 'proximity' | 'uniform' {
        return this.colorMode;
    }

    public setBoidColor(color: THREE.Color): void {
        for (const boid of this.boids) {
            boid.setColorMode('uniform', color);
        }
    }
} 