import * as THREE from 'three';

export class Boid {
    public mesh: THREE.Mesh;
    public velocity: THREE.Vector3;
    public acceleration: THREE.Vector3;
    private maxSpeed: number = 2.0;
    private maxForce: number = 0.05;  // Reduced for smoother steering
    private minSpeed: number = 0.5;

    // Classic Reynolds ranges
    private ranges = {
        separation: 15,    // Reduced separation range but will use stronger force
        alignment: 50,     // Good range for velocity matching
        cohesion: 50      // Same as alignment for better group formation
    };

    // Classic Reynolds weights
    private weights = {
        separation: 2.0,   // Increased separation weight
        alignment: 1.0,    // Base alignment
        cohesion: 1.0,    // Equal to alignment for proper flocking
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

        // Only clamp the final combined acceleration
        this.acceleration.clampLength(0, this.maxForce);

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

        for (const other of boids) {
            if (other === this) continue;

            const distance = this.mesh.position.distanceTo(other.mesh.position);
            if (distance > 0 && distance < this.ranges.separation) {
                const diff = new THREE.Vector3().subVectors(
                    this.mesh.position,
                    other.mesh.position
                );
                // Enhanced separation force
                // Use cubic inverse for very strong close-range separation
                const strength = Math.min(10, 8.0 / Math.pow(distance, 3));
                diff.normalize().multiplyScalar(strength);
                steering.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steering.divideScalar(count);
            if (steering.length() > 0) {
                // Apply stronger steering for separation
                const desiredSpeed = Math.min(this.maxSpeed * 1.5, steering.length() * 2);
                steering.normalize().multiplyScalar(desiredSpeed);
                steering.sub(this.velocity);
            }
        }

        return steering;
    }

    private align(boids: Boid[]): THREE.Vector3 {
        const steering = new THREE.Vector3();
        let count = 0;
        const sum = new THREE.Vector3();

        for (const other of boids) {
            if (other === this) continue;

            const distance = this.mesh.position.distanceTo(other.mesh.position);
            if (distance < this.ranges.alignment) {
                // Use full velocity for proper speed matching
                sum.add(other.velocity);
                count++;
            }
        }

        if (count > 0) {
            sum.divideScalar(count);
            // Classic Reynolds steering
            sum.normalize().multiplyScalar(this.maxSpeed);
            steering.subVectors(sum, this.velocity);
        }

        return steering;
    }

    private cohesion(boids: Boid[]): THREE.Vector3 {
        const steering = new THREE.Vector3();
        let count = 0;
        const center = new THREE.Vector3();

        for (const other of boids) {
            if (other === this) continue;

            const distance = this.mesh.position.distanceTo(other.mesh.position);
            if (distance < this.ranges.cohesion) {
                // Simple position averaging for center of mass
                center.add(other.mesh.position);
                count++;
            }
        }

        if (count > 0) {
            center.divideScalar(count);
            // Classic Reynolds seek behavior
            return this.seek(center);
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
        console.log('Setting perception radius:', radius); // Debug
        const scale = radius / this.ranges.cohesion;
        this.ranges.separation = 15 * scale;
        this.ranges.alignment = 50 * scale;
        this.ranges.cohesion = radius;
    }

    public setWeight(behavior: 'separation' | 'alignment' | 'cohesion' | 'avoidance', weight: number): void {
        console.log(`Setting ${behavior} weight to ${weight}`); // Debug
        this.weights[behavior] = weight;
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