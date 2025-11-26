

// new adden variable for bounding boxes 
let lastDrawnObjects = "";
        
// new added varaible for speakobjects
let lastSpokenTime = 0;


const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let lastSpokenObjects = new Set();
let speaking = false;
let detectionInterval = 500;
let detectionLoop;
let isDetecting = false;




// 1 newly added func of setupCamera()

//Detection Not Working When Camera is Already Running

//Issue: If toggleDetection is called while the camera is already on, it reinitializes it.
//Fix: Prevent multiple camera activations by checking if video.srcObject is already set.

async function setupCamera() {
if (video.srcObject) return; // Prevent reinitialization
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;
return new Promise(resolve => video.onloadedmetadata = resolve);
}












//Object Detection Continues After Stopping

//Issue: When detection is stopped, the last frame remains on screen.
//Fix: Clear the canvas when stopping detection.

// 2.advanced version of toggledetection() fn

async function toggleDetection() {
const button = document.getElementById('toggle-button');
if (isDetecting) {
clearInterval(detectionLoop);
ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas on stop
button.textContent = "Start Detection";
} else {
await setupCamera();
const model = await cocoSsd.load();
detectObjects(model);
button.textContent = "Stop Detection";
}
isDetecting = !isDetecting;
}








// 3 fn

async function detectObjects(model) {
    resizeCanvas();
    clearInterval(detectionLoop);
    detectionLoop = setInterval(async () => {
        const predictions = await model.detect(video);
        drawBoundingBoxes(predictions);
        speakObjects(predictions);
    }, detectionInterval);
}

function resizeCanvas() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
}


// 4) new boundingBoxes function

//let lastDrawnObjects = "";

//  Laggy Performance Due to Frequent Canvas Updates

//Issue: The drawBoundingBoxes function clears and redraws the entire canvas for every detection, causing flickering.
//  Fix: Reduce the refresh rate by only redrawing when changes occur.

function drawBoundingBoxes(predictions) {
let detectedObjects = predictions.map(p => `${p.class}-${p.bbox.join(',')}`).join('|');
if (detectedObjects === lastDrawnObjects) return; // Skip redraw if no changes
lastDrawnObjects = detectedObjects;

ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

predictions.forEach(pred => {
ctx.strokeStyle = "#ffeb3b";
ctx.lineWidth = 3;
ctx.strokeRect(pred.bbox[0], pred.bbox[1], pred.bbox[2], pred.bbox[3]);

ctx.fillStyle = "rgba(255, 235, 59, 0.8)";
ctx.fillRect(pred.bbox[0], pred.bbox[1] - 30, 150, 25);
ctx.fillStyle = "#000";
ctx.font = "18px Poppins";
ctx.fillText(`${pred.class} (${(pred.score * 100).toFixed(1)}%)`, pred.bbox[0] + 5, pred.bbox[1] - 10);
});
}



// 5)new one + 1 added function

//1 Repetitive Speech Output

//Issue: The speakObjects function can still repeat the same detected objects multiple times if detection happens frequently.
//    Fix: Add a timestamp to limit speech output frequency.

//let lastSpokenTime = 0;

function speakObjects(predictions) {
if (predictions.length === 0 || speaking) return;

const currentTime = Date.now();
if (currentTime - lastSpokenTime < 3000) return; // Only speak every 3 seconds

let detectedObjects = {};
predictions.forEach(pred => {
if (!detectedObjects[pred.class]) detectedObjects[pred.class] = 0;
detectedObjects[pred.class]++;
});

let speechText = Object.entries(detectedObjects)
.map(([object, count]) => `${count} ${object}${count > 1 ? 's' : ''}`)
.join(', ');

if (speechText === lastSpokenObjects) return; // Avoid repeating the same output
lastSpokenObjects = speechText;
lastSpokenTime = currentTime;

speaking = true;
const speech = new SpeechSynthesisUtterance();
speech.text = `Detected: ${speechText}`;
speech.rate = 1; // Adjust speed if needed
speech.onend = () => speaking = false;
window.speechSynthesis.speak(speech);
}


// 6) Detection Frequency Slider Causes Lag
  //Issue: The updateInterval function stops and restarts detection every time the user moves the slider, causing lag.
  //Fix: Only update the interval without restarting detection.

  
  function updateInterval() {
detectionInterval = parseInt(document.getElementById('interval').value);
document.getElementById('interval-value').innerText = detectionInterval;

if (isDetecting) {
clearInterval(detectionLoop);
detectionLoop = setInterval(async () => {
    const predictions = await model.detect(video);
    drawBoundingBoxes(predictions);
    speakObjects(predictions);
}, detectionInterval);
}
}




// Resize canvas when window resizes
window.addEventListener('resize', resizeCanvas);





//7) No Handling for Camera Access Denial
// If the user denies camera permissions, the app fails without an error message.
// hence to show the message when camera permissions denied


async function setupCamera() {
try {
if (video.srcObject) return;
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;
return new Promise(resolve => video.onloadedmetadata = resolve);
} catch (error) {
alert("Camera access denied. Please enable permissions.");
}
}
