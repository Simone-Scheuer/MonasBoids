import * as THREE from 'three';
import { Flock } from '../boids/Flock';
import { Boid } from '../boids/Boid';

interface BoidSettings {
    numBoids: number;
    boidSize: number;
    separation: number;
    alignment: number;
    cohesion: number;
    maxSpeed: number;
    visionRange: number;
    colorMode: 'proximity' | 'uniform';
    boidColor: string;
    uiVisible: boolean;
}

const DEFAULT_SETTINGS: BoidSettings = {
    numBoids: 1000,
    boidSize: 3.0,
    separation: 2.0,
    alignment: 3.0,
    cohesion: 3.0,
    maxSpeed: 8.0,
    visionRange: 50,
    colorMode: 'uniform',
    boidColor: '#000000',
    uiVisible: true
};

// Updated presets with optimized behaviors
const PRESETS = {
    default: DEFAULT_SETTINGS,
    explosive: {
        ...DEFAULT_SETTINGS,
        numBoids: 800,
        separation: 4.0,
        alignment: 1.0,
        cohesion: 1.0,
        visionRange: 70,
        maxSpeed: 8.0
    },
    dense: {
        ...DEFAULT_SETTINGS,
        numBoids: 1200,
        separation: 2.5,
        alignment: 3.0,
        cohesion: 3.0,
        visionRange: 40,
        maxSpeed: 4.0
    },
    sparse: {
        ...DEFAULT_SETTINGS,
        numBoids: 500,
        separation: 1.8,
        alignment: 2.5,
        cohesion: 2.5,
        visionRange: 60,
        maxSpeed: 5.0
    }
};

export class UI {
    private container: HTMLDivElement;
    private flock: Flock;
    private isVisible: boolean = true;
    private settings: BoidSettings;
    private instructionsVisible: boolean = true;
    private toggleButton!: HTMLButtonElement;  // Use definite assignment assertion

    constructor(flock: Flock) {
        this.flock = flock;
        this.settings = { ...DEFAULT_SETTINGS };  // Just use default settings directly

        // Show loading screen
        this.showLoadingScreen();

        // Create main container
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.padding = '20px';
        this.container.style.borderRadius = '10px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        this.container.style.transform = this.settings.uiVisible ? 'translateX(0)' : 'translateX(calc(100% + 20px))';
        document.body.appendChild(this.container);

        // Create instructions overlay
        this.createInstructionsOverlay();

        // Create toggle button
        this.createToggleButton();

        // Create controls
        this.createControls();

        // Apply initial settings
        this.applySettings(this.settings);

        // Remove loading screen after a short delay
        setTimeout(() => this.hideLoadingScreen(), 1500);
    }

    private loadSettings(): BoidSettings {
        return { ...DEFAULT_SETTINGS };  // Always return default settings
    }

    private saveSettings() {
        // Remove storage functionality
        return;
    }

    private createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.style.position = 'fixed';
        this.toggleButton.style.top = '20px';
        this.toggleButton.style.right = '20px';
        this.toggleButton.style.zIndex = '1000';
        this.toggleButton.style.padding = '8px 12px';
        this.toggleButton.style.borderRadius = '5px';
        this.toggleButton.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        this.toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.toggleButton.style.color = 'white';
        this.toggleButton.style.cursor = 'pointer';
        this.toggleButton.style.transition = 'all 0.3s ease';
        this.toggleButton.style.fontFamily = 'Arial, sans-serif';
        this.toggleButton.style.fontSize = '14px';
        this.updateToggleButton();

        this.toggleButton.addEventListener('click', () => {
            this.settings.uiVisible = !this.settings.uiVisible;
            this.container.style.transform = this.settings.uiVisible ? 'translateX(0)' : 'translateX(calc(100% + 20px))';
            this.updateToggleButton();
        });

        // Add hover effect
        this.toggleButton.addEventListener('mouseenter', () => {
            this.toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            this.toggleButton.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        });

        this.toggleButton.addEventListener('mouseleave', () => {
            this.toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.toggleButton.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });

        document.body.appendChild(this.toggleButton);

        // Add keyboard listener for 'H' key
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h') {
                this.toggleButton.click();
            }
        });
    }

    private updateToggleButton() {
        this.toggleButton.textContent = this.settings.uiVisible ? 'Hide Controls' : 'Show Controls';
    }

    private createPresetSelector() {
        const container = document.createElement('div');
        container.style.marginBottom = '15px';

        const label = document.createElement('label');
        label.textContent = 'Presets';
        label.style.display = 'block';
        label.style.marginBottom = '5px';

        const select = document.createElement('select');
        select.style.width = '200px';
        select.style.padding = '5px';
        select.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        select.style.color = 'white';
        select.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        select.style.borderRadius = '4px';

        // Add preset options
        Object.entries(PRESETS).forEach(([name, preset]) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
            // Set selected if this preset matches current settings
            if (this.settingsMatchPreset(preset)) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        select.addEventListener('change', () => {
            const preset = PRESETS[select.value as keyof typeof PRESETS];
            this.settings = { ...preset, uiVisible: this.settings.uiVisible };
            this.applySettings(this.settings);
            // Refresh all sliders to match new values
            this.container.innerHTML = '';
            this.createControls();
        });

        container.appendChild(label);
        container.appendChild(select);
        this.container.appendChild(container);
    }

    private settingsMatchPreset(preset: BoidSettings): boolean {
        return (
            preset.numBoids === this.settings.numBoids &&
            preset.separation === this.settings.separation &&
            preset.alignment === this.settings.alignment &&
            preset.cohesion === this.settings.cohesion &&
            preset.maxSpeed === this.settings.maxSpeed &&
            preset.visionRange === this.settings.visionRange
        );
    }

    private createSlider(
        label: string,
        min: number,
        max: number,
        value: number,
        step: number,
        onChange: (value: number) => void
    ): void {
        const container = document.createElement('div');
        container.style.marginBottom = '15px';

        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.style.display = 'block';
        labelElement.style.marginBottom = '5px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min.toString();
        slider.max = max.toString();
        slider.step = step.toString();
        slider.value = value.toString();
        slider.style.width = '200px';

        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = value.toString();
        valueDisplay.style.marginLeft = '10px';

        slider.addEventListener('input', () => {
            const newValue = parseFloat(slider.value);
            valueDisplay.textContent = newValue.toString();
            onChange(newValue);

            // Update settings and save
            const settingKey = label.toLowerCase().replace(/\s+/g, '');
            if (settingKey in this.settings) {
                (this.settings as any)[settingKey] = newValue;
            }
        });

        container.appendChild(labelElement);
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        this.container.appendChild(container);
    }

    private createResetButton() {
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset to Defaults';
        resetBtn.style.marginTop = '20px';
        resetBtn.style.width = '100%';
        resetBtn.style.padding = '10px';
        resetBtn.style.backgroundColor = '#ff4444';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '5px';
        resetBtn.style.color = 'white';
        resetBtn.style.cursor = 'pointer';

        resetBtn.addEventListener('click', () => {
            this.settings = { ...DEFAULT_SETTINGS };
            this.applySettings(this.settings);
            window.location.reload(); // Reload to ensure all boids are reset
        });

        this.container.appendChild(resetBtn);
    }

    private createColorControls(): void {
        const container = document.createElement('div');
        container.style.marginBottom = '15px';

        // Color Mode Toggle
        const modeLabel = document.createElement('label');
        modeLabel.textContent = 'Color Mode';
        modeLabel.style.display = 'block';
        modeLabel.style.marginBottom = '5px';

        const modeSelect = document.createElement('select');
        modeSelect.style.width = '200px';
        modeSelect.style.marginBottom = '10px';
        modeSelect.style.padding = '5px';

        const uniformOption = document.createElement('option');
        uniformOption.value = 'uniform';
        uniformOption.textContent = 'Uniform Color';

        const proximityOption = document.createElement('option');
        proximityOption.value = 'proximity';
        proximityOption.textContent = 'Proximity (Red-Green)';

        modeSelect.appendChild(uniformOption);
        modeSelect.appendChild(proximityOption);

        modeSelect.value = this.settings.colorMode;

        // Color Picker (for uniform mode)
        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Boid Color';
        colorLabel.style.display = 'block';
        colorLabel.style.marginBottom = '5px';

        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = this.settings.boidColor;
        colorPicker.style.width = '200px';
        colorPicker.style.height = '30px';
        colorPicker.style.padding = '0';
        colorPicker.style.border = 'none';

        // Event Listeners
        modeSelect.addEventListener('change', () => {
            const mode = modeSelect.value as 'proximity' | 'uniform';
            this.settings.colorMode = mode;
            this.flock.setColorMode(mode);

            // Show/hide color picker based on mode
            colorPicker.style.display = mode === 'uniform' ? 'block' : 'none';
        });

        colorPicker.addEventListener('input', () => {
            this.settings.boidColor = colorPicker.value;
            this.flock.setBoidColor(new THREE.Color(colorPicker.value));
        });

        // Add elements to container
        container.appendChild(modeLabel);
        container.appendChild(modeSelect);
        container.appendChild(colorLabel);
        container.appendChild(colorPicker);

        // Initial visibility
        colorPicker.style.display = this.settings.colorMode === 'uniform' ? 'block' : 'none';

        this.container.appendChild(container);
    }

    private createControls(): void {
        const title = document.createElement('h2');
        title.textContent = 'Boid Controls';
        title.style.marginTop = '0';
        title.style.marginBottom = '20px';
        this.container.appendChild(title);

        // Add preset selector first
        this.createPresetSelector();

        this.createSlider(
            'Number of Boids',
            50,
            1500,
            this.settings.numBoids,
            50,
            (value) => {
                // Reset all settings to default but keep the new boid count
                this.settings = { ...DEFAULT_SETTINGS, numBoids: value };
                this.applySettings(this.settings);
                // Refresh all sliders to match new values
                this.container.innerHTML = '';
                this.createControls();
            }
        );

        this.createSlider(
            'Boid Size',
            0.5,
            5.0,
            this.settings.boidSize,
            0.1,
            (value) => this.flock.setBoidSize(value)
        );

        // Add section title for flocking parameters
        const flockingTitle = document.createElement('h3');
        flockingTitle.textContent = 'Flocking Behavior';
        flockingTitle.style.marginTop = '20px';
        flockingTitle.style.marginBottom = '10px';
        flockingTitle.style.fontSize = '16px';
        this.container.appendChild(flockingTitle);

        // Separation with info
        const sepInfo = document.createElement('div');
        sepInfo.textContent = 'Avoid crowding neighbors';
        sepInfo.style.fontSize = '12px';
        sepInfo.style.color = '#aaa';
        sepInfo.style.marginBottom = '5px';
        this.container.appendChild(sepInfo);

        this.createSlider(
            'Separation',
            0,
            5,
            this.settings.separation,
            0.1,
            (value) => this.flock.setWeight('separation', value)
        );

        // Alignment with info
        const alignInfo = document.createElement('div');
        alignInfo.textContent = 'Match velocity with neighbors';
        alignInfo.style.fontSize = '12px';
        alignInfo.style.color = '#aaa';
        alignInfo.style.marginBottom = '5px';
        this.container.appendChild(alignInfo);

        this.createSlider(
            'Alignment',
            0,
            3,
            this.settings.alignment,
            0.1,
            (value) => this.flock.setWeight('alignment', value)
        );

        // Cohesion with info
        const cohInfo = document.createElement('div');
        cohInfo.textContent = 'Steer towards center of flock';
        cohInfo.style.fontSize = '12px';
        cohInfo.style.color = '#aaa';
        cohInfo.style.marginBottom = '5px';
        this.container.appendChild(cohInfo);

        this.createSlider(
            'Cohesion',
            0,
            3,
            this.settings.cohesion,
            0.1,
            (value) => this.flock.setWeight('cohesion', value)
        );

        // Add section title for movement parameters
        const movementTitle = document.createElement('h3');
        movementTitle.textContent = 'Movement Settings';
        movementTitle.style.marginTop = '20px';
        movementTitle.style.marginBottom = '10px';
        movementTitle.style.fontSize = '16px';
        this.container.appendChild(movementTitle);

        this.createSlider(
            'Speed',
            3,
            10,
            this.settings.maxSpeed,
            0.1,
            (value) => this.flock.setMaxSpeed(value)
        );

        this.createSlider(
            'Vision Range',
            20,
            100,
            this.settings.visionRange,
            5,
            (value) => this.flock.setPerceptionRadius(value)
        );

        this.createResetButton();

        // Add dedication text
        const dedication = document.createElement('div');
        dedication.textContent = 'A site dedicated to my mom and her love of murmurations';
        dedication.style.fontSize = '11px';
        dedication.style.color = '#888';
        dedication.style.marginTop = '30px';
        dedication.style.textAlign = 'center';
        dedication.style.fontStyle = 'italic';
        this.container.appendChild(dedication);
    }

    private applySettings(settings: BoidSettings) {
        this.flock.setBoidCount(settings.numBoids);
        this.flock.setBoidSize(settings.boidSize);
        this.flock.setWeight('separation', settings.separation);
        this.flock.setWeight('alignment', settings.alignment);
        this.flock.setWeight('cohesion', settings.cohesion);
        this.flock.setMaxSpeed(settings.maxSpeed);
        this.flock.setPerceptionRadius(settings.visionRange);
    }

    private showLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.style.position = 'fixed';
        loadingScreen.style.top = '0';
        loadingScreen.style.left = '0';
        loadingScreen.style.width = '100%';
        loadingScreen.style.height = '100%';
        loadingScreen.style.backgroundColor = '#000000';
        loadingScreen.style.display = 'flex';
        loadingScreen.style.flexDirection = 'column';
        loadingScreen.style.justifyContent = 'center';
        loadingScreen.style.alignItems = 'center';
        loadingScreen.style.zIndex = '9999';
        loadingScreen.style.transition = 'opacity 0.5s ease-out';

        const title = document.createElement('h1');
        title.textContent = 'momurations';
        title.style.color = '#ffffff';
        title.style.marginBottom = '20px';
        title.style.fontFamily = 'Arial, sans-serif';

        const loadingText = document.createElement('div');
        loadingText.textContent = 'Loading...';
        loadingText.style.color = '#ffffff';
        loadingText.style.fontSize = '18px';
        loadingText.style.fontFamily = 'Arial, sans-serif';

        loadingScreen.appendChild(title);
        loadingScreen.appendChild(loadingText);
        document.body.appendChild(loadingScreen);
    }

    private hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }

    private createInstructionsOverlay() {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '20px';
        overlay.style.left = '20px';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.padding = '20px';
        overlay.style.borderRadius = '10px';
        overlay.style.color = 'white';
        overlay.style.fontFamily = 'Arial, sans-serif';
        overlay.style.maxWidth = '300px';
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.zIndex = '100';

        const title = document.createElement('h3');
        title.textContent = 'Instructions';
        title.style.marginTop = '0';
        title.style.marginBottom = '10px';

        const instructions = document.createElement('div');
        instructions.innerHTML = `
            <p><strong>Camera Controls:</strong></p>
            <ul style="padding-left: 20px; margin: 5px 0;">
                <li>Left Click + Drag: Rotate camera</li>
                <li>Right Click + Drag: Pan camera</li>
                <li>Scroll Wheel: Zoom in/out</li>
            </ul>
            <p><strong>UI Controls:</strong></p>
            <ul style="padding-left: 20px; margin: 5px 0;">
                <li>H: Hide/Show control panel</li>
                <li>I: Hide/Show instructions</li>
            </ul>
            <p style="margin-top: 10px; font-size: 0.9em;">Press I to hide these instructions</p>
        `;

        overlay.appendChild(title);
        overlay.appendChild(instructions);
        document.body.appendChild(overlay);

        // Add keyboard listener for 'I' key
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'i') {
                this.instructionsVisible = !this.instructionsVisible;
                overlay.style.opacity = this.instructionsVisible ? '1' : '0';
                overlay.style.pointerEvents = this.instructionsVisible ? 'auto' : 'none';
            }
        });
    }
} 