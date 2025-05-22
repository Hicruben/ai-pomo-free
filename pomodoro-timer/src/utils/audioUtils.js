// Audio context instance
let audioContext = null;

// Initialize audio context (must be called after user interaction)
export const initAudioContext = () => {
  if (!audioContext) {
    try {
      console.log('Initializing audio context...');

      // Check if Web Audio API is supported
      if (!window.AudioContext && !window.webkitAudioContext) {
        console.error('Web Audio API is not supported in this browser');
        return null;
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();

      console.log(`Audio context initialized successfully. Sample rate: ${audioContext.sampleRate}Hz, State: ${audioContext.state}`);

      // Preload all available sounds
      setTimeout(() => {
        console.log('Preloading sounds...');
        const soundIds = availableSounds.map(sound => sound.id);
        soundIds.push('ticking'); // Add ticking sound
        preloadSounds(soundIds).then(() => {
          console.log('All sounds preloaded successfully');
        }).catch(error => {
          console.error('Error preloading sounds:', error);
        });
      }, 1000);

    } catch (error) {
      console.error('Error initializing Web Audio API:', error);
    }
  } else {
    console.log(`Using existing audio context. State: ${audioContext.state}`);
  }
  return audioContext;
};

// Sound buffers cache
const soundBuffers = {};

// Load a sound file
export const loadSound = async (soundName) => {
  if (!audioContext) {
    initAudioContext();
  }

  if (soundBuffers[soundName]) {
    console.log(`Using cached sound: ${soundName}`);
    return soundBuffers[soundName];
  }

  try {
    console.log(`Attempting to load sound: ${soundName}`);
    const soundUrl = `/sounds/${soundName}.mp3`;
    console.log(`Fetching from URL: ${soundUrl}`);

    const response = await fetch(soundUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch sound file: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error(`Empty audio data received for ${soundName}`);
    }

    console.log(`Successfully loaded sound data: ${soundName} (${arrayBuffer.byteLength} bytes)`);

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    soundBuffers[soundName] = audioBuffer;
    console.log(`Successfully decoded audio data for: ${soundName}`);
    return audioBuffer;
  } catch (error) {
    console.error(`Error loading sound: ${soundName}`, error);
    // Create a fallback sound for testing
    if (audioContext && !soundBuffers[soundName]) {
      try {
        // Create a simple beep sound as fallback
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, sampleRate * 0.5, sampleRate);
        const channel = buffer.getChannelData(0);

        // Generate a simple sine wave
        for (let i = 0; i < channel.length; i++) {
          channel[i] = Math.sin(i * 0.05) * Math.exp(-4 * i / channel.length);
        }

        soundBuffers[soundName] = buffer;
        console.log(`Created fallback sound for: ${soundName}`);
        return buffer;
      } catch (fallbackError) {
        console.error('Failed to create fallback sound:', fallbackError);
      }
    }
    return null;
  }
};

// Play a sound with volume control
export const playSound = (soundName, volume = 1.0) => {
  console.log(`Attempting to play sound: ${soundName} at volume ${volume}`);

  if (!audioContext) {
    console.log('Audio context not initialized, initializing now...');
    initAudioContext();

    if (!audioContext) {
      console.error('Failed to initialize audio context');
      return;
    }
  }

  // Resume audio context if it's suspended (browser policy)
  if (audioContext.state === 'suspended') {
    console.log('Audio context is suspended, attempting to resume...');
    audioContext.resume().then(() => {
      console.log('Audio context resumed successfully');
    }).catch(error => {
      console.error('Failed to resume audio context:', error);
    });
  }

  console.log(`Audio context state: ${audioContext.state}`);

  const buffer = soundBuffers[soundName];
  if (!buffer) {
    console.warn(`Sound not loaded: ${soundName}, attempting to load it now...`);
    loadSound(soundName).then(buffer => {
      if (buffer) {
        console.log(`Sound ${soundName} loaded successfully, playing now...`);
        playFromBuffer(buffer, volume);
      } else {
        console.error(`Failed to load sound: ${soundName}`);
      }
    }).catch(error => {
      console.error(`Error loading sound ${soundName}:`, error);
    });
    return;
  }

  console.log(`Playing sound: ${soundName} with existing buffer`);
  playFromBuffer(buffer, volume);
};

// Play from an audio buffer
const playFromBuffer = (buffer, volume) => {
  try {
    if (!audioContext) {
      console.error('Audio context is null in playFromBuffer');
      return null;
    }

    if (!buffer) {
      console.error('Buffer is null in playFromBuffer');
      return null;
    }

    console.log(`Creating audio source with buffer duration: ${buffer.duration}s`);

    // Create source node
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    console.log(`Set gain to: ${volume}`);

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play the sound
    console.log('Starting audio playback...');
    source.start(0);
    console.log('Audio playback started');

    // Add an event listener to know when the sound has finished playing
    source.onended = () => {
      console.log('Sound playback ended');
    };

    return source;
  } catch (error) {
    console.error('Error in playFromBuffer:', error);
    return null;
  }
};

// Preload all sounds
export const preloadSounds = async (soundNames) => {
  const loadPromises = soundNames.map(name => loadSound(name));
  return Promise.all(loadPromises);
};

// Available sounds
export const availableSounds = [
  { id: 'completion', name: 'Completion' },
  { id: 'bonus-points', name: 'Bonus Points' },
  { id: 'success', name: 'Success' },
];

// Ticking sound
let tickingSource = null;
let tickingGain = null;

// Start ticking sound
export const startTicking = (volume = 0.2) => {
  if (!audioContext) {
    initAudioContext();
  }

  // Stop any existing ticking
  stopTicking();

  // Load ticking sound if not already loaded
  if (!soundBuffers['ticking']) {
    loadSound('ticking').then(buffer => {
      if (buffer) {
        playTickingLoop(buffer, volume);
      }
    });
  } else {
    playTickingLoop(soundBuffers['ticking'], volume);
  }
};

// Play ticking sound in a loop
const playTickingLoop = (buffer, volume) => {
  if (!audioContext) return;

  // Resume audio context if it's suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Create source node
  tickingSource = audioContext.createBufferSource();
  tickingSource.buffer = buffer;
  tickingSource.loop = true;

  // Create gain node for volume control
  tickingGain = audioContext.createGain();
  tickingGain.gain.value = volume;

  // Connect nodes
  tickingSource.connect(tickingGain);
  tickingGain.connect(audioContext.destination);

  // Start playing
  tickingSource.start(0);
};

// Stop ticking sound
export const stopTicking = () => {
  if (tickingSource) {
    try {
      tickingSource.stop();
    } catch (error) {
      // Ignore errors when stopping
    }
    tickingSource = null;
    tickingGain = null;
  }
};

// Update ticking volume
export const updateTickingVolume = (volume) => {
  if (tickingGain) {
    tickingGain.gain.value = volume;
  }
};
