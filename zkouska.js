const audio = new Audio('song_bost.wav');
audio.crossOrigin = "anonymous";
audio.loop = true;
audio.volume = 1.0;

const context = new (window.AudioContext || window.webkitAudioContext)();
const src = context.createMediaElementSource(audio);
const analyser = context.createAnalyser();

src.connect(analyser);
analyser.connect(context.destination);

analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

let lastEnergy = 0;

function animate() {
  requestAnimationFrame(animate);
  analyser.getByteFrequencyData(dataArray);

  // zaměříme se na basy (nižší frekvence)
  const bassRange = dataArray.slice(0, 32);
  const average = bassRange.reduce((a, b) => a + b, 0) / bassRange.length;

  const diff = average - lastEnergy;
  lastEnergy = average * 0.8 + lastEnergy * 0.2; // vyhlazení

  if (diff > 5 && average > 10) {
    // při silném beatu -> náhodná barva a bliknutí
    document.body.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`;
    document.body.style.filter = `brightness(2)`;
    
  } else {
    document.body.style.filter = `brightness(1)`;
    document.body.style.transform = `scale(${1 + diff / 100})`;

  }
}

document.body.addEventListener('click', () => {
  const overlay = document.getElementById('overlay');
  overlay.classList.add('hidden');

  context.resume().then(() => {
    audio.play();
    animate();
  });
});
