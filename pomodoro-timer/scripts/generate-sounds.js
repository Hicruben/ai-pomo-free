const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create sounds directory if it doesn't exist
const soundsDir = path.join(__dirname, '../public/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Function to download a file
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${outputPath}...`);

    // Use curl to download the file
    exec(`curl -L "${url}" -o "${outputPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error downloading file: ${error.message}`);
        reject(error);
        return;
      }
      console.log(`Downloaded ${url} to ${outputPath}`);
      resolve();
    });
  });
}

// Sound files to download
const soundFiles = [
  {
    name: 'bell.mp3',
    url: 'https://cdn.freesound.org/previews/80/80921_1022651-lq.mp3'
  },
  {
    name: 'digital.mp3',
    url: 'https://cdn.freesound.org/previews/219/219244_4082826-lq.mp3'
  },
  {
    name: 'kitchen.mp3',
    url: 'https://cdn.freesound.org/previews/274/274466_5015844-lq.mp3'
  },
  {
    name: 'bird.mp3',
    url: 'https://cdn.freesound.org/previews/495/495808_9962852-lq.mp3'
  },
  {
    name: 'ticking.mp3',
    url: 'https://cdn.freesound.org/previews/231/231537_1676145-lq.mp3'
  },
  {
    name: 'completion.mp3',
    url: 'https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3'
  }
];

// Download all sound files
async function downloadAllSounds() {
  try {
    for (const sound of soundFiles) {
      const outputPath = path.join(soundsDir, sound.name);
      await downloadFile(sound.url, outputPath);
    }
    console.log('All sound files downloaded successfully!');
  } catch (error) {
    console.error('Error downloading sound files:', error);
  }
}

// Run the download
downloadAllSounds();
