class AudioManager {
    constructor() {
        this.ctx = null;
        this.windSource = null;
        this.windFilter = null;
        this.windLfo = null;
        this.windGain = null;
        this.isWindPlaying = false;
        
        this.clickBuffer = null;
        
        // Inicializar contexto en la primera interacción de usuario
        const initAudio = () => {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                // Load click sound
                fetch('audio/click.ogg')
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => this.ctx.decodeAudioData(arrayBuffer))
                    .then(audioBuffer => {
                        this.clickBuffer = audioBuffer;
                    })
                    .catch(err => console.warn('Could not load click.ogg', err));
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    playClick() {
        if (!this.ctx || !this.clickBuffer) return;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const source = this.ctx.createBufferSource();
        source.buffer = this.clickBuffer;
        
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 0.5; // Adjust volume if needed
        
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        source.start(0);
    }

    playPop() {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playGrassSound() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        noise.start();
    }

    playStoneSound() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        
        gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playWoodSound() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playGlassSound() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    startWind() {
        if (!this.ctx) return;
        if (this.isWindPlaying) return;
        this.isWindPlaying = true;

        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        this.windSource = this.ctx.createBufferSource();
        this.windSource.buffer = buffer;
        this.windSource.loop = true;

        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'lowpass';
        this.windFilter.Q.value = 5;
        this.windFilter.frequency.value = 400;

        this.windLfo = this.ctx.createOscillator();
        this.windLfo.type = 'sine';
        this.windLfo.frequency.value = 0.2; // Howl speed

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 400; // Sweep depth
        
        this.windGain = this.ctx.createGain();
        this.windGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.windGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 2); // Fade in

        this.windLfo.connect(lfoGain);
        lfoGain.connect(this.windFilter.frequency);

        this.windSource.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.ctx.destination);

        this.windSource.start();
        this.windLfo.start();
    }

    stopWind() {
        if (!this.isWindPlaying || !this.windGain) return;
        
        // Fade out
        this.windGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.windGain.gain.setValueAtTime(this.windGain.gain.value, this.ctx.currentTime);
        this.windGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1);
        
        setTimeout(() => {
            if (this.windSource) {
                this.windSource.stop();
                this.windSource.disconnect();
                this.windSource = null;
            }
            if (this.windLfo) {
                this.windLfo.stop();
                this.windLfo.disconnect();
                this.windLfo = null;
            }
            if (this.windFilter) {
                this.windFilter.disconnect();
                this.windFilter = null;
            }
            this.isWindPlaying = false;
        }, 1000);
    }
}

// Export instance
export const UIAudioManager = new AudioManager();
