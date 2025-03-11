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
}

const DEFAULT_SETTINGS: BoidSettings = {
    numBoids: 200,
    boidSize: 2.0,
    separation: 1.8,
    alignment: 1.3,
    cohesion: 1.0,
    maxSpeed: 2.0,
    visionRange: 50
};

export class UI {
    private container: HTMLDivElement;
    private flock: Flock;
    private isVisible: boolean = true;
    private settings: BoidSettings;

    constructor(flock: Flock) {
        this.flock = flock;
        this.settings = this.loadSettings();

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
        this.container.style.transition = 'transform 0.3s ease';
        document.body.appendChild(this.container);

        // Create toggle button
        this.createToggleButton();

        // Create controls
        this.createControls();

        // Apply initial settings
        this.applySettings(this.settings);
    }

    private loadSettings(): BoidSettings {
        const savedSettings = localStorage.getItem('boidSettings');
        if (savedSettings) {
            try {
                return JSON.parse(savedSettings);
            } catch (e) {
                console.warn('Failed to parse saved settings:', e);
            }
        }
        return { ...DEFAULT_SETTINGS };
    }

    private saveSettings() {
        localStorage.setItem('boidSettings', JSON.stringify(this.settings));
    }

    private createToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'H';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.top = '20px';
        toggleBtn.style.right = '20px';
        toggleBtn.style.zIndex = '1000';
        toggleBtn.style.width = '30px';
        toggleBtn.style.height = '30px';
        toggleBtn.style.borderRadius = '50%';
        toggleBtn.style.border = 'none';
        toggleBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        toggleBtn.style.color = 'white';
        toggleBtn.style.cursor = 'pointer';

        toggleBtn.addEventListener('click', () => {
            this.isVisible = !this.isVisible;
            this.container.style.transform = this.isVisible ? 'translateX(0)' : 'translateX(calc(100% + 20px))';
            toggleBtn.textContent = this.isVisible ? 'H' : 'S';
        });

        document.body.appendChild(toggleBtn);
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
            const settingKey = label.toLowerCase().replace(/\s+/g, '') as keyof BoidSettings;
            if (settingKey in this.settings) {
                this.settings[settingKey] = newValue;
                this.saveSettings();
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
            this.saveSettings();
            this.applySettings(this.settings);
            window.location.reload(); // Reload to ensure all boids are reset
        });

        this.container.appendChild(resetBtn);
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

    private createControls(): void {
        const title = document.createElement('h2');
        title.textContent = 'Boid Controls';
        title.style.marginTop = '0';
        title.style.marginBottom = '20px';
        this.container.appendChild(title);

        this.createSlider(
            'Number of Boids',
            50,
            1000,
            this.settings.numBoids,
            10,
            (value) => this.flock.setBoidCount(value)
        );

        this.createSlider(
            'Boid Size',
            0.5,
            5.0,
            this.settings.boidSize,
            0.1,
            (value) => this.flock.setBoidSize(value)
        );

        this.createSlider(
            'Separation Force',
            0,
            3,
            this.settings.separation,
            0.1,
            (value) => this.flock.setWeight('separation', value)
        );

        this.createSlider(
            'Alignment Force',
            0,
            3,
            this.settings.alignment,
            0.1,
            (value) => this.flock.setWeight('alignment', value)
        );

        this.createSlider(
            'Cohesion Force',
            0,
            3,
            this.settings.cohesion,
            0.1,
            (value) => this.flock.setWeight('cohesion', value)
        );

        this.createSlider(
            'Max Speed',
            0.5,
            5,
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
    }
} 