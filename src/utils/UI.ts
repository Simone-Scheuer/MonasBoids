import { Flock } from '../boids/Flock';
import { Boid } from '../boids/Boid';

export class UI {
    private container: HTMLDivElement;
    private flock: Flock;

    constructor(flock: Flock) {
        this.flock = flock;
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.padding = '20px';
        this.container.style.borderRadius = '10px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(this.container);

        this.createControls();
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
        });

        container.appendChild(labelElement);
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        this.container.appendChild(container);
    }

    private createControls(): void {
        const title = document.createElement('h2');
        title.textContent = 'Boid Controls';
        title.style.marginTop = '0';
        title.style.marginBottom = '20px';
        this.container.appendChild(title);

        // Get a reference boid for initial values
        const boid = this.flock.getBoid(0);
        if (!boid) return;

        this.createSlider(
            'Number of Boids',
            100,
            1000,
            this.flock.getBoidCount(),
            10,
            (value) => this.flock.setBoidCount(value)
        );

        this.createSlider(
            'Separation Force',
            0,
            3,
            boid.getWeight('separation'),
            0.1,
            (value) => this.flock.setWeight('separation', value)
        );

        this.createSlider(
            'Alignment Force',
            0,
            3,
            boid.getWeight('alignment'),
            0.1,
            (value) => this.flock.setWeight('alignment', value)
        );

        this.createSlider(
            'Cohesion Force',
            0,
            3,
            boid.getWeight('cohesion'),
            0.1,
            (value) => this.flock.setWeight('cohesion', value)
        );

        this.createSlider(
            'Max Speed',
            0.5,
            5,
            boid.getMaxSpeed(),
            0.1,
            (value) => this.flock.setMaxSpeed(value)
        );

        this.createSlider(
            'Vision Range',
            20,
            100,
            boid.getPerceptionRadius(),
            5,
            (value) => this.flock.setPerceptionRadius(value)
        );
    }
} 