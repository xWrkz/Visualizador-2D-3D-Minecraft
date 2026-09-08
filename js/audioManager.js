class AudioManager {
    constructor() {
        this.ctx = null;
        this.windSource = null;
        this.windFilter = null;
        this.windLfo = null;
        this.windGain = null;
        this.isWindPlaying = false;
        
        // Inicializar contexto en la primera interacción de usuario
        const initAudio = () => {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
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
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
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

// Global instance
window.UIAudioManager = new AudioManager();
