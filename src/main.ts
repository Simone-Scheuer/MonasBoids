import { Scene } from './scene/Scene';

// Initialize the scene
const scene = new Scene();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    scene.update();
    scene.render();
}

// Start the animation loop
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    scene.onWindowResize();
}); 