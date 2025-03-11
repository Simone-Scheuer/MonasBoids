import * as THREE from 'three';
import { Boid } from '../boids/Boid';

class OctreeNode {
    private bounds: THREE.Box3;
    private children: OctreeNode[] | null = null;
    private boids: Boid[] = [];
    private maxBoids: number = 8;
    private minSize: number = 5;

    constructor(center: THREE.Vector3, size: THREE.Vector3) {
        const halfSize = size.clone().multiplyScalar(0.5);
        this.bounds = new THREE.Box3(
            center.clone().sub(halfSize),
            center.clone().add(halfSize)
        );
    }

    public insert(boid: Boid): void {
        if (!this.bounds.containsPoint(boid.mesh.position)) {
            return;
        }

        if (this.children === null) {
            this.boids.push(boid);

            if (this.boids.length > this.maxBoids &&
                this.bounds.max.clone().sub(this.bounds.min).length() > this.minSize) {
                this.subdivide();
            }
            return;
        }

        for (const child of this.children) {
            child.insert(boid);
        }
    }

    private subdivide(): void {
        const center = new THREE.Vector3();
        this.bounds.getCenter(center);
        const size = new THREE.Vector3();
        this.bounds.getSize(size).multiplyScalar(0.5);

        this.children = [];
        for (let i = 0; i < 8; i++) {
            const x = center.x + (i & 1 ? size.x : -size.x);
            const y = center.y + (i & 2 ? size.y : -size.y);
            const z = center.z + (i & 4 ? size.z : -size.z);

            this.children.push(new OctreeNode(
                new THREE.Vector3(x, y, z),
                size
            ));
        }

        // Redistribute existing boids to children
        const existingBoids = this.boids;
        this.boids = [];
        for (const boid of existingBoids) {
            for (const child of this.children) {
                child.insert(boid);
            }
        }
    }

    public queryRange(range: THREE.Sphere, found: Boid[]): void {
        if (!this.bounds.intersectsSphere(range)) {
            return;
        }

        for (const boid of this.boids) {
            if (range.containsPoint(boid.mesh.position)) {
                found.push(boid);
            }
        }

        if (this.children !== null) {
            for (const child of this.children) {
                child.queryRange(range, found);
            }
        }
    }

    public clear(): void {
        this.boids = [];
        if (this.children) {
            for (const child of this.children) {
                child.clear();
            }
            this.children = null;
        }
    }
}

export class Octree {
    private root: OctreeNode;

    constructor(center: THREE.Vector3, size: THREE.Vector3) {
        // Make sure the octree is large enough to contain all boids
        const maxDim = Math.max(size.x, size.y, size.z);
        const uniformSize = new THREE.Vector3(maxDim, maxDim, maxDim);
        // Ensure center is at origin for proper space division
        this.root = new OctreeNode(new THREE.Vector3(0, 0, 0), uniformSize);
    }

    public insert(boid: Boid): void {
        this.root.insert(boid);
    }

    public findNeighbors(boid: Boid, radius: number): Boid[] {
        const found: Boid[] = [];
        // Create a slightly larger search sphere to ensure we don't miss edge cases
        const searchSphere = new THREE.Sphere(
            boid.mesh.position.clone(),
            radius * 1.1  // Add 10% to radius to catch edge cases
        );
        this.root.queryRange(searchSphere, found);

        // Remove self from neighbors and sort by distance for better cohesion
        return found
            .filter(other => other !== boid)
            .sort((a, b) =>
                a.mesh.position.distanceTo(boid.mesh.position) -
                b.mesh.position.distanceTo(boid.mesh.position)
            );
    }

    public clear(): void {
        this.root.clear();
    }
} 