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
        width: 400,
        height: 400,
        depth: 400
    };

    constructor(scene: THREE.Scene, numBoids: number = 200) {
        this.scene = scene;
        // Initialize octree with space matching grid
        this.octree = new Octree(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(this.bounds.width, this.bounds.height, this.bounds.depth)
        );

        this.createBoids(numBoids);
    }

    private createBoids(count: number) {
        // Remove existing boids from scene
        for (const boid of this.boids) {
            this.scene.remove(boid.mesh);
        }
        this.boids = [];

        // Create new boids with more spread out initial positions
        for (let i = 0; i < count; i++) {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * this.bounds.width * 0.8,
                (Math.random() - 0.5) * this.bounds.height * 0.8,
                (Math.random() - 0.5) * this.bounds.depth * 0.8
            );

            const boid = new Boid(position);
            boid.mesh.scale.setScalar(this.boidSize); // Apply current boid size
            this.boids.push(boid);
            this.scene.add(boid.mesh);
        }
    }

    public update() {
        // Clear and rebuild octree
        this.octree.clear();
        for (const boid of this.boids) {
            this.octree.insert(boid);
        }

        // Debug neighbor counts
        let totalNeighbors = 0;
        let boidsWithNeighbors = 0;

        // Update each boid with nearby neighbors
        for (const boid of this.boids) {
            // Get neighbors within the largest perception radius (cohesion)
            const neighbors = this.octree.findNeighbors(boid, boid.getPerceptionRadius());

            // Debug neighbor information
            if (neighbors.length > 0) {
                totalNeighbors += neighbors.length;
                boidsWithNeighbors++;
            }

            // Update boid with its neighbors
            boid.update(neighbors, this.obstacles);
        }

        // Log debug information
        console.log('Flock stats:', {
            totalBoids: this.boids.length,
            boidsWithNeighbors,
            averageNeighbors: boidsWithNeighbors > 0 ? totalNeighbors / boidsWithNeighbors : 0
        });
    }

    public setBoidCount(count: number) {
        this.createBoids(count);
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
    }

    public getBoid(index: number): Boid | undefined {
        return this.boids[index];
    }

    public setWeight(behavior: 'separation' | 'alignment' | 'cohesion' | 'avoidance', weight: number): void {
        console.log(`Flock: Setting ${behavior} weight to ${weight}`);
        // Validate weight
        if (isNaN(weight) || weight < 0) {
            console.warn(`Invalid weight value for ${behavior}: ${weight}`);
            return;
        }

        // Apply to all boids
        let appliedCount = 0;
        for (const boid of this.boids) {
            boid.setWeight(behavior, weight);
            appliedCount++;
        }

        // Verify application
        console.log(`Applied ${behavior} weight ${weight} to ${appliedCount} boids`);
    }

    public setMaxSpeed(speed: number): void {
        console.log(`Flock: Setting max speed to ${speed}`);
        if (isNaN(speed) || speed <= 0) {
            console.warn(`Invalid speed value: ${speed}`);
            return;
        }

        let appliedCount = 0;
        for (const boid of this.boids) {
            boid.setMaxSpeed(speed);
            appliedCount++;
        }
        console.log(`Applied max speed ${speed} to ${appliedCount} boids`);
    }

    public setPerceptionRadius(radius: number): void {
        console.log(`Flock: Setting perception radius to ${radius}`);
        if (isNaN(radius) || radius <= 0) {
            console.warn(`Invalid radius value: ${radius}`);
            return;
        }

        let appliedCount = 0;
        for (const boid of this.boids) {
            boid.setPerceptionRadius(radius);
            appliedCount++;
        }
        console.log(`Applied perception radius ${radius} to ${appliedCount} boids`);
    }

    public setBoidSize(size: number) {
        console.log(`Setting boid size to ${size}`);
        this.boidSize = size;
        // Update all existing boids
        for (const boid of this.boids) {
            boid.mesh.scale.setScalar(size);
        }
    }

    public getBoidSize(): number {
        return this.boidSize;
    }
} 