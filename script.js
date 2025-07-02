const videoElement = document.querySelector(".input_video");
const focusStatus = document.getElementById("focus-status");
const sendBtn = document.getElementById("sendBtn");
const topicInput = document.getElementById("topic");
const lessonText = document.getElementById("lesson-text");

let focusState = "focused";
let lastEyesClosedTime = 0;

// Initialize FaceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
faceMesh.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
camera.start();

function onResults(results) {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    focusStatus.textContent = "No face detected";
    focusState = "no-face";
    return;
  }

  const landmarks = results.multiFaceLandmarks[0];
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];

  const eyeOpen = Math.abs(leftEyeTop.y - leftEyeBottom.y) > 0.015;

  if (eyeOpen) {
    focusState = "focused";
    focusStatus.textContent = " Focused";
  } else {
    focusState = "distracted";
    focusStatus.textContent = " Distracted";
  }
}

sendBtn.addEventListener("click", () => {
  const topic = topicInput.value.trim();
  if (!topic) {
    lessonText.textContent = "Please enter a topic first.";
    return;
  }

  lessonText.textContent = "⏳ Generating AI lesson...";

  fetch("http://localhost:8000/ai-lesson", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: topic,
      status: focusState,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      lessonText.textContent = data.lesson;
    })
    .catch((err) => {
      console.error("Error:", err);
      lessonText.textContent = " Error getting lesson. Try again.";
    });
});
