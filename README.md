# 3D Boids Simulation

A real-time 3D implementation of Craig Reynolds' Boids algorithm using Three.js and TypeScript. This simulation demonstrates emergent flocking behavior with customizable parameters.

## Features

- Real-time 3D visualization
- Adjustable flocking parameters (separation, alignment, cohesion)
- Dynamic speed control
- Collision avoidance
- Spatial partitioning for performance
- Interactive camera controls

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/boids.git
cd boids
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Controls

- **Mouse Drag**: Rotate camera
- **Mouse Wheel**: Zoom in/out
- **UI Sliders**:
  - Number of Boids
  - Separation Force
  - Alignment Force
  - Cohesion Force
  - Max Speed
  - Vision Range

## Technical Details

- Built with Three.js for 3D rendering
- TypeScript for type safety
- Vite for fast development and building
- Implements spatial partitioning (Octree) for efficient neighbor calculations
- Classic Reynolds' boids algorithm with modern optimizations

## License

MIT License
