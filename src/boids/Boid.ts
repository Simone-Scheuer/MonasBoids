import * as THREE from 'three';

export class Boid {
    public mesh: THREE.Mesh;
    public velocity: THREE.Vector3;
    public acceleration: THREE.Vector3;
    private maxSpeed: number = 2.0;
    private maxForce: number = 0.05;
    private minSpeed: number = 0.5;

    // Adjusted ranges for better physical separation
    private ranges = {
        separation: 25,     // Increased for physical size consideration
        alignment: 75,      // Keep alignment range
        cohesion: 100      // Keep cohesion range
    };

    // Adjusted weights for better physical separation
    private weights = {
        separation: 2.0,    // Increased for stronger physical separation
        alignment: 1.3,     // Keep alignment weight
        cohesion: 0.8,     // Slightly reduced to prevent over-clustering
        avoidance: 2.0
    };

    constructor(position: THREE.Vector3) {
        // Create simple cone geometry
        const bodyLength = 2.0;
        const bodyWidth = 0.4;
        const geometry = new THREE.ConeGeometry(bodyWidth, bodyLength, 8);

        // Simple black material
        const material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 0
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.set(2, 2, 2);
        this.mesh.position.copy(position);
        this.mesh.rotation.x = -Math.PI * 0.5;

        // Initialize with slight randomness
        const angle = Math.random() * Math.PI * 2;
        this.velocity = new THREE.Vector3(
            Math.cos(angle),
            (Math.random() - 0.5) * 0.1,
            Math.sin(angle)
        ).normalize().multiplyScalar(this.maxSpeed * 0.9);

        this.acceleration = new THREE.Vector3();
    }

    public update(boids: Boid[], obstacles: THREE.Mesh[] = []) {
        // Reset acceleration each frame
        this.acceleration.set(0, 0, 0);

        // Calculate forces without normalization
        const separation = this.separate(boids);
        const alignment = this.align(boids);
        const cohesion = this.cohesion(boids);
        const avoidance = this.avoidObstacles(obstacles);

        // Apply weights to raw forces
        separation.multiplyScalar(this.weights.separation);
        alignment.multiplyScalar(this.weights.alignment);
        cohesion.multiplyScalar(this.weights.cohesion);
        avoidance.multiplyScalar(this.weights.avoidance);

        // Add all forces to acceleration
        this.acceleration.add(separation);
        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(avoidance);

        // Increase max force when separation is high for emergency avoidance
        const maxForce = separation.length() > 1.5 ? this.maxForce * 2.0 : this.maxForce;
        this.acceleration.clampLength(0, maxForce);

        // Update velocity with acceleration
        this.velocity.add(this.acceleration);

        // Enforce speed limits - crucial for UI speed control
        const speed = this.velocity.length();
        if (speed > 0.0001) {  // Prevent division by zero
            if (speed > this.maxSpeed) {
                this.velocity.multiplyScalar(this.maxSpeed / speed);
            } else if (speed < this.minSpeed) {
                this.velocity.multiplyScalar(this.minSpeed / speed);
            }
        }

        // Update position
        this.mesh.position.add(this.velocity);

        // Update rotation to face direction of movement
        if (this.velocity.length() > 0.01) {
            const lookAtPos = this.mesh.position.clone().add(this.velocity);
            this.mesh.lookAt(lookAtPos);
            this.mesh.rotateX(Math.PI * 0.5);
        }

        // Enforce boundaries
        this.enforceBoundaries();
    }

    private enforceBoundaries() {
        const pos = this.mesh.position;
        const bounds = 200;  // Half of the 400x400x400 space
        const margin = 40;   // Increased margin for smoother turns
        const turnFactor = 0.1;  // Reduced for gentler steering

        // Calculate distance from bounds
        const xDist = Math.abs(pos.x) - (bounds - margin);
        const yDist = Math.abs(pos.y) - (bounds - margin);
        const zDist = Math.abs(pos.z) - (bounds - margin);

        // Apply steering forces when approaching bounds
        if (xDist > 0) {
            const steer = -Math.sign(pos.x) * turnFactor * (xDist / margin);
            this.velocity.x += steer;
        }
        if (yDist > 0) {
            const steer = -Math.sign(pos.y) * turnFactor * (yDist / margin);
            this.velocity.y += steer;
        }
        if (zDist > 0) {
            const steer = -Math.sign(pos.z) * turnFactor * (zDist / margin);
            this.velocity.z += steer;
        }

        // Hard limits at the absolute bounds
        pos.x = THREE.MathUtils.clamp(pos.x, -bounds, bounds);
        pos.y = THREE.MathUtils.clamp(pos.y, -bounds, bounds);
        pos.z = THREE.MathUtils.clamp(pos.z, -bounds, bounds);
    }

    private separate(boids: Boid[]): THREE.Vector3 {
        const steering = new THREE.Vector3();
        let count = 0;
        const physicalRadius = this.mesh.scale.x * 1.0; // Use actual boid size for collision
        const lookAheadTime = 0.5; // Predict position 0.5 seconds ahead

        for (const other of boids) {
            if (other === this) continue;

            const distance = this.mesh.position.distanceTo(other.mesh.position);
            const combinedRadius = physicalRadius + (other.mesh.scale.x * 1.0);

            // Calculate future positions
            const myFuturePos = this.mesh.position.clone().add(this.velocity.clone().multiplyScalar(lookAheadTime));
            const otherFuturePos = other.mesh.position.clone().add(other.velocity.clone().multiplyScalar(lookAheadTime));
            const futureDistance = myFuturePos.distanceTo(otherFuturePos);

            // Check both current and predicted collisions
            if (distance < this.ranges.separation || futureDistance < combinedRadius * 2) {
                const diff = new THREE.Vector3().subVectors(
                    this.mesh.position,
                    other.mesh.position
                );

                // Calculate separation force based on both current and predicted positions
                let strength;
                if (distance < combinedRadius * 1.2) {
                    // Emergency separation for immediate collisions
                    strength = Math.min(20, 10.0 / (distance * distance));
                } else if (futureDistance < combinedRadius * 2) {
                    // Strong predictive avoidance
                    strength = Math.min(15, 5.0 / futureDistance);
                } else {
                    // Normal separation for comfortable spacing
                    strength = Math.min(8, 2.0 / (distance * distance));
                }

                // Add velocity difference to avoid boids moving in same direction
                const velDiff = new THREE.Vector3().subVectors(other.velocity, this.velocity);
                diff.sub(velDiff.multiplyScalar(0.1)); // Small influence from velocity difference

                diff.normalize().multiplyScalar(strength);
                steering.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steering.divideScalar(count);
            if (steering.length() > 0) {
                // Stronger response when multiple neighbors
                const desiredSpeed = Math.min(this.maxSpeed * 2.0, steering.length() * 2);
                steering.normalize().multiplyScalar(desiredSpeed);
                steering.sub(this.velocity);

                // Additional boost for multiple close neighbors
                if (count > 2) {  // Reduced threshold for earlier response
                    steering.multiplyScalar(1.5);
                }
            }
        }

        return steering;
    }

    private align(boids: Boid[]): THREE.Vector3 {
        const steering = new THREE.Vector3();
        let count = 0;
        const sum = new THREE.Vector3();
        let totalWeight = 0;

        for (const other of boids) {
            if (other === this) continue;

            const distance = this.mesh.position.distanceTo(other.mesh.position);
            if (distance < this.ranges.alignment) {
                // Weight by distance - closer boids have more influence
                const weight = 1 - (distance / this.ranges.alignment);
                sum.add(other.velocity.clone().multiplyScalar(weight));
                totalWeight += weight;
                count++;
            }
        }

        if (count > 0) {
            sum.divideScalar(totalWeight);  // Use weighted average
            sum.normalize().multiplyScalar(this.maxSpeed);
            steering.subVectors(sum, this.velocity);
        }

        return steering;
    }

    private cohesion(boids: Boid[]): THREE.Vector3 {
        const steering = new THREE.Vector3();
        let count = 0;
        const center = new THREE.Vector3();
        let totalWeight = 0;
        const physicalRadius = this.mesh.scale.x * 1.0;

        for (const other of boids) {
            if (other === this) continue;

            const distance = this.mesh.position.distanceTo(other.mesh.position);
            if (distance < this.ranges.cohesion) {
                // Reduce cohesion when physically close
                let weight = Math.max(0.2, 1 - (distance / this.ranges.cohesion));

                // Significantly reduce cohesion when near physical collision
                const combinedRadius = physicalRadius + (other.mesh.scale.x * 1.0);
                if (distance < combinedRadius * 2) {
                    weight *= (distance / (combinedRadius * 2));
                }

                center.add(other.mesh.position.clone().multiplyScalar(weight));
                totalWeight += weight;
                count++;
            }
        }

        if (count > 0) {
            center.divideScalar(totalWeight);
            const desired = new THREE.Vector3().subVectors(center, this.mesh.position);
            const distance = desired.length();

            if (distance > 0) {
                // Reduced cohesion effect at closer distances
                const speed = this.maxSpeed * Math.min(0.7, distance / (this.ranges.cohesion * 0.5));
                desired.normalize().multiplyScalar(speed);
                steering.subVectors(desired, this.velocity);
            }
        }

        return steering;
    }

    private seek(target: THREE.Vector3): THREE.Vector3 {
        const desired = new THREE.Vector3().subVectors(target, this.mesh.position);
        const distance = desired.length();

        // Classic Reynolds seek with speed scaling
        if (distance > 0) {
            desired.normalize().multiplyScalar(this.maxSpeed);
            return desired.sub(this.velocity);
        }

        return new THREE.Vector3();
    }

    private avoidObstacles(obstacles: THREE.Mesh[]): THREE.Vector3 {
        const steering = new THREE.Vector3();
        const avoidanceDistance = this.ranges.cohesion * 1.5;

        for (const obstacle of obstacles) {
            const distance = this.mesh.position.distanceTo(obstacle.position);
            if (distance < avoidanceDistance) {
                const diff = new THREE.Vector3().subVectors(
                    this.mesh.position,
                    obstacle.position
                );
                diff.normalize().divideScalar(distance);
                steering.add(diff);
            }
        }

        if (steering.length() > 0) {
            steering.normalize().multiplyScalar(this.maxSpeed);
            steering.sub(this.velocity);
            steering.clampLength(0, this.maxForce);
        }

        return steering;
    }

    public getPerceptionRadius(): number {
        return this.ranges.cohesion;
    }

    public setPerceptionRadius(radius: number): void {
        console.log('Setting perception radius:', radius);
        const scale = radius / this.ranges.cohesion;
        this.ranges.separation = 25 * scale;  // Update to match new separation range
        this.ranges.alignment = 75 * scale;
        this.ranges.cohesion = radius;
    }

    public setWeight(behavior: 'separation' | 'alignment' | 'cohesion' | 'avoidance', weight: number): void {
        console.log(`Setting ${behavior} weight to ${weight}`);
        // Ensure weight is a valid number
        if (isNaN(weight) || weight < 0) {
            console.warn(`Invalid weight value for ${behavior}: ${weight}`);
            return;
        }
        this.weights[behavior] = weight;

        // Log current weights for debugging
        console.log('Current weights:', { ...this.weights });
    }

    public getWeight(behavior: 'separation' | 'alignment' | 'cohesion' | 'avoidance'): number {
        return this.weights[behavior];
    }

    public setMaxSpeed(speed: number): void {
        console.log('Setting max speed:', speed);
        this.maxSpeed = speed;
        // Immediately adjust current velocity to respect new speed limit
        const currentSpeed = this.velocity.length();
        if (currentSpeed > speed) {
            this.velocity.normalize().multiplyScalar(speed);
        }
        // Also adjust minSpeed to maintain ratio
        this.minSpeed = speed * 0.25;  // 25% of max speed
    }

    public getMaxSpeed(): number {
        return this.maxSpeed;
    }
} 