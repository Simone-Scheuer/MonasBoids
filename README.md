# 3D Boids Simulation

A real-time 3D implementation of Craig Reynolds' Boids algorithm using Three.js and TypeScript. This simulation demonstrates emergent flocking behavior with customizable parameters.

## Features

- Real-time 3D visualization with smooth animations
- Adjustable flocking parameters:
  - Separation force
  - Alignment force
  - Cohesion force
  - Vision range
  - Movement speed
- Dynamic color modes:
  - Uniform color for all boids
  - Proximity-based coloring (red to green)
- Interactive camera controls with orbit, pan, and zoom
- Responsive design that works on all screen sizes
- Collision avoidance and boundary awareness
- Spatial partitioning for performance optimization
- Settings persistence between sessions
- Loading screen and instructions overlay
- Keyboard shortcuts for UI control

## Live Demo

Visit the live demo at: [Your Netlify URL]

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

### Camera Controls
- **Left Click + Drag**: Rotate camera
- **Right Click + Drag**: Pan camera
- **Scroll Wheel**: Zoom in/out

### Keyboard Shortcuts
- **H**: Hide/Show control panel
- **I**: Hide/Show instructions

### UI Controls
- Number of Boids (50-1000)
- Boid Size (0.5-5.0)
- Separation Force (0-3)
- Alignment Force (0-3)
- Cohesion Force (0-3)
- Max Speed (0.5-5)
- Vision Range (20-100)
- Color Mode (Uniform/Proximity)
- Reset to Defaults

## Deployment

This project is configured for easy deployment to Netlify:

1. Fork or clone this repository
2. Create a new site in Netlify
3. Connect to your repository
4. Deploy! (build settings are pre-configured in netlify.toml)

## Technical Details

- Built with Three.js for 3D rendering
- TypeScript for type safety and better development experience
- Vite for fast development and optimized builds
- Implements spatial partitioning (Octree) for efficient neighbor calculations
- Classic Reynolds' boids algorithm with modern optimizations
- Local storage for settings persistence
- Responsive design principles
- Security headers pre-configured

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
