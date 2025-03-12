import * as THREE from 'three';

export class Boid {
    public mesh: THREE.Mesh;
    public velocity: THREE.Vector3;
    private acceleration: THREE.Vector3;
    private material: THREE.MeshPhongMaterial;

    // Core settings adjusted for our world scale
    private minSpeed: number = 20.0;  // Increased for our larger world
    private maxSpeed: number = 100.0;  // Increased for our larger world
    private perceptionRadius: number = 50;
    private avoidanceRadius: number = 35;  // Increased relative to perception radius
    private maxSteerForce: number = 20.0;  // Increased for more responsive steering

    // Weights adjusted for better separation
    private weights = {
        separation: 2.0,  // Increased to prevent tight clustering
        alignment: 1.0,
        cohesion: 1.0
    };

    constructor(position: THREE.Vector3) {
        // Create simple cone geometry for boid
        const geometry = new THREE.ConeGeometry(0.5, 2, 8);
        this.material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 30,
            specular: new THREE.Color(0x444444)
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.scale.set(2, 2, 2);
        this.mesh.position.copy(position);
        this.mesh.rotation.x = -Math.PI * 0.5;

        // Initialize with zero velocity - will be set by flock manager
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
    }

    // New method to set initial velocity with controlled magnitude
    public setInitialVelocity(direction: THREE.Vector3, speed: number = 30.0): void {
        this.velocity.copy(direction.normalize().multiplyScalar(speed));
    }

    public update(boids: Boid[], deltaTime: number): void {
        // Reset acceleration
        this.acceleration.set(0, 0, 0);

        // Calculate flocking behavior
        const flockData = this.calculateFlockingForces(boids);

        // Apply flocking forces
        if (flockData.numNeighbors > 0) {
            // Alignment
            const alignForce = this.steerTowards(flockData.avgVelocity)
                .multiplyScalar(this.weights.alignment);
            this.acceleration.add(alignForce);

            // Cohesion
            const cohesionForce = this.steerTowards(flockData.centerOffset)
                .multiplyScalar(this.weights.cohesion);
            this.acceleration.add(cohesionForce);

            // Separation
            const separationForce = this.steerTowards(flockData.avoidanceHeading)
                .multiplyScalar(this.weights.separation);
            this.acceleration.add(separationForce);
        }

        // Apply boundary avoidance
        const boundaryForce = this.calculateBoundaryForce();
        this.acceleration.add(boundaryForce);

        // Update velocity using acceleration
        this.velocity.add(this.acceleration.multiplyScalar(deltaTime));

        // Enforce speed limits
        const speed = this.velocity.length();
        if (speed > this.maxSpeed) {
            this.velocity.multiplyScalar(this.maxSpeed / speed);
        } else if (speed < this.minSpeed) {
            this.velocity.multiplyScalar(this.minSpeed / speed);
        }

        // Update position
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Update rotation to face velocity direction
        if (this.velocity.lengthSq() > 0.000001) {
            this.mesh.lookAt(this.mesh.position.clone().add(this.velocity));
            this.mesh.rotateX(Math.PI * 0.5);
        }
    }

    private calculateFlockingForces(boids: Boid[]): {
        avgVelocity: THREE.Vector3,
        centerOffset: THREE.Vector3,
        avoidanceHeading: THREE.Vector3,
        numNeighbors: number
    } {
        const avgVelocity = new THREE.Vector3();
        const center = new THREE.Vector3();
        const avoidanceHeading = new THREE.Vector3();
        let numNeighbors = 0;

        for (const other of boids) {
            if (other === this) continue;

            const offset = other.mesh.position.clone().sub(this.mesh.position);
            const sqrDist = offset.lengthSq();

            if (sqrDist < this.perceptionRadius * this.perceptionRadius) {
                // Weight influence by distance
                const distanceFactor = 1 - (sqrDist / (this.perceptionRadius * this.perceptionRadius));

                // Alignment and cohesion only if not too close
                if (sqrDist > this.avoidanceRadius * this.avoidanceRadius * 0.5) {
                    // Alignment
                    avgVelocity.add(other.velocity.clone().multiplyScalar(distanceFactor));

                    // Cohesion
                    center.add(other.mesh.position);
                }

                // Separation with inverse square falloff
                if (sqrDist < this.avoidanceRadius * this.avoidanceRadius) {
                    // Calculate separation force with stronger inverse square falloff
                    const pushStrength = 1 / (sqrDist + 1); // Add 1 to prevent division by zero
                    avoidanceHeading.add(
                        offset.normalize().multiplyScalar(-pushStrength * this.maxSteerForce)
                    );
                }

                numNeighbors++;
            }
        }

        if (numNeighbors > 0) {
            avgVelocity.divideScalar(numNeighbors);
            center.divideScalar(numNeighbors);
        }

        return {
            avgVelocity,
            centerOffset: center.sub(this.mesh.position),
            avoidanceHeading,
            numNeighbors
        };
    }

    private calculateBoundaryForce(): THREE.Vector3 {
        const bounds = 400;  // Half the cube size (800/2) since we're centered at origin
        const margin = 80;   // Increased margin to start turning earlier
        const position = this.mesh.position;
        const avoidanceForce = new THREE.Vector3();

        // Calculate distance from each boundary and apply stronger avoidance
        const distances = {
            x: bounds - Math.abs(position.x),
            y: bounds - Math.abs(position.y),
            z: bounds - Math.abs(position.z)
        };

        // Apply stronger avoidance force with smoother falloff
        for (const axis of ['x', 'y', 'z'] as const) {
            if (distances[axis] < margin) {
                // Exponential falloff for smoother boundary approach
                const normalizedDist = distances[axis] / margin;
                const force = Math.exp(-normalizedDist * 2) * this.maxSteerForce * 3.0;
                avoidanceForce[axis] = Math.sign(-position[axis]) * force;
            }
        }

        return avoidanceForce;
    }

    private steerTowards(vector: THREE.Vector3): THREE.Vector3 {
        if (vector.lengthSq() === 0) return new THREE.Vector3();

        // Calculate desired velocity
        const desired = vector.normalize().multiplyScalar(this.maxSpeed);

        // Reynolds steering = desired - current
        return desired.sub(this.velocity).clampLength(0, this.maxSteerForce);
    }

    // API methods for external control
    public setPerceptionRadius(radius: number): void {
        this.perceptionRadius = radius;
        this.avoidanceRadius = radius * 0.5;
    }

    public setWeight(behavior: 'separation' | 'alignment' | 'cohesion', weight: number): void {
        if (weight >= 0) {
            this.weights[behavior] = weight;
        }
    }

    public setMaxSpeed(speed: number): void {
        // Scale the input speed for our world size
        this.maxSpeed = speed * 10;  // Scale up for our larger world
        this.minSpeed = this.maxSpeed * 0.4;
    }

    public getPerceptionRadius(): number {
        return this.perceptionRadius;
    }

    public setColorMode(mode: 'proximity' | 'uniform', baseColor?: THREE.Color): void {
        if (mode === 'uniform' && baseColor) {
            this.material.color = baseColor;
        }
    }
} 