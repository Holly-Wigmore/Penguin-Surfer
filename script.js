const startBtn = document.getElementById("start-btn");
const canvas = document.getElementById("canvas");
const startScreen = document.querySelector(".start-screen");
const checkpointScreen = document.querySelector(".checkpoint-screen");
const winnerScreen = document.createElement("div"); // Winner screen
winnerScreen.classList.add("winner-screen");
document.body.appendChild(winnerScreen);
winnerScreen.style.display = "none"; // Hide initially
winnerScreen.innerHTML =
  " <h2>Gnarly!</h2><p>You reached the final wave and collected all the life buoys, dude🌊</p>";

const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

const gravity = 0.5;
let isCheckpointCollisionDetectionActive = true;
let waveOffset = 0; // For wave animation

const proportionalSize = (size) => {
  return innerHeight < 500 ? Math.ceil((size / 500) * innerHeight) : size;
};

// Wave Animation Function
function drawWaves() {
  ctx.beginPath();
  const waveHeight = proportionalSize(20);
  const waveAmplitude = proportionalSize(20);
  const waveFrequency = 0.02;
  ctx.moveTo(0, canvas.height);

  for (let x = 0; x < canvas.width; x++) {
    const y =
      canvas.height -
      waveHeight +
      Math.sin(x * waveFrequency + waveOffset) * waveAmplitude;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.fillStyle = "#99c9ff";
  ctx.fill();

  waveOffset += 0.05; // Slower wave speed to avoid interference with player movement
}

class Player {
  constructor() {
    this.image = new Image();
    this.image.src = "Penguin.png";
    this.position = {
      x: proportionalSize(10),
      y: proportionalSize(400),
    };
    this.velocity = { x: 0, y: 0 };
    this.width = proportionalSize(80);
    this.height = proportionalSize(80);
  }

  draw() {
    ctx.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.position.y + this.height + this.velocity.y <= canvas.height) {
      if (this.position.y < 0) {
        this.position.y = 0;
        this.velocity.y = gravity;
      }
      this.velocity.y += gravity;
    } else {
      this.velocity.y = 0;
    }

    // Horizontal boundary check
    if (this.position.x < this.width) this.position.x = this.width;
    if (this.position.x >= canvas.width - this.width * 2) {
      this.position.x = canvas.width - this.width * 2;
    }
  }
}
class Platform {
  constructor(x, y) {
    this.position = { x, y };
    this.width = 200;
    this.height = proportionalSize(40);
  }
  draw() {
    ctx.fillStyle = "#113f67";
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
}

class CheckPoint {
  constructor(x, y, z) {
    this.position = { x, y };
    this.width = proportionalSize(60);
    this.height = proportionalSize(90);
    this.claimed = false;
    this.isFinal = z === "final"; // Determines if this is the end point
    this.image = new Image();
    this.image.src = "Buoy.png";
    this.image.onload = () => {
      this.isLoaded = true;
    };
  }
  draw() {
    if (this.isLoaded && !this.claimed) {
      ctx.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
  }
  claim() {
    this.claimed = true;
    if (this.isFinal) {
      isCheckpointCollisionDetectionActive = false;
      canvas.style.display = "none";
      winnerScreen.style.display = "block";
    }
  }
}

const player = new Player();
const platforms = [
  new Platform(500, proportionalSize(450)),
  new Platform(1200, proportionalSize(400)),
  new Platform(2000, proportionalSize(350)),
  new Platform(2800, proportionalSize(300)),
  new Platform(3600, proportionalSize(250)),
  new Platform(4500, proportionalSize(150)),
  new Platform(5300, proportionalSize(200)),
  new Platform(6100, proportionalSize(250)),
  new Platform(7000, proportionalSize(300)),
];

const checkpoints = [
  new CheckPoint(1100, proportionalSize(330)),
  new CheckPoint(2500, proportionalSize(280)),
  new CheckPoint(4000, proportionalSize(200)),
  new CheckPoint(5600, proportionalSize(180)),
  new CheckPoint(7200, proportionalSize(250), "final"), // Final checkpoint
];

const animate = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw platforms and checkpoints first, then player
  platforms.forEach((platform) => platform.draw());
  checkpoints.forEach((checkpoint) => checkpoint.draw());
  player.update();

  // Platform collision detection and scrolling
  platforms.forEach((platform) => {
    const collisionDetectionRules = [
      player.position.y + player.height <= platform.position.y,
      player.position.y + player.height + player.velocity.y >=
        platform.position.y,
      player.position.x >= platform.position.x - player.width / 2,
      player.position.x <=
        platform.position.x + platform.width - player.width / 3,
    ];

    if (collisionDetectionRules.every((rule) => rule)) {
      player.velocity.y = 0;
    }

    const platformDetectionRules = [
      player.position.x >= platform.position.x - player.width / 2,
      player.position.x <=
        platform.position.x + platform.width - player.width / 3,
      player.position.y + player.height >= platform.position.y,
      player.position.y <= platform.position.y + platform.height,
    ];

    if (platformDetectionRules.every((rule) => rule)) {
      player.position.y = platform.position.y + player.height;
      player.velocity.y = gravity;
    }
  });

  checkpoints.forEach((checkpoint, index) => {
    const checkpointDetectionRules = [
      player.position.x >= checkpoint.position.x,
      player.position.y >= checkpoint.position.y,
      player.position.y + player.height <=
        checkpoint.position.y + checkpoint.height,
      isCheckpointCollisionDetectionActive,
      player.position.x - player.width <=
        checkpoint.position.x - checkpoint.width + player.width * 0.9,
      index === 0 || checkpoints[index - 1].claimed === true,
    ];

    if (checkpointDetectionRules.every((rule) => rule)) {
      checkpoint.claim();
      if (index === checkpoints.length - 1) {
        isCheckpointCollisionDetectionActive = false;
      }
    }
  });

  // Scroll platforms and checkpoints if player is within range
  if (keys.rightKey.pressed && player.position.x < proportionalSize(400)) {
    player.velocity.x = 5;
  } else if (
    keys.leftKey.pressed &&
    player.position.x > proportionalSize(100)
  ) {
    player.velocity.x = -5;
  } else {
    player.velocity.x = 0;
    if (keys.rightKey.pressed) {
      platforms.forEach((platform) => (platform.position.x -= 5));
      checkpoints.forEach((checkpoint) => (checkpoint.position.x -= 5));
    } else if (keys.leftKey.pressed) {
      platforms.forEach((platform) => (platform.position.x += 5));
      checkpoints.forEach((checkpoint) => (checkpoint.position.x += 5));
    }
  }

  // Draw waves at the end to ensure they are at the bottom
  drawWaves();

  requestAnimationFrame(animate);
};

const keys = { rightKey: { pressed: false }, leftKey: { pressed: false } };

const movePlayer = (key, xVelocity, isPressed) => {
  if (!isCheckpointCollisionDetectionActive) return;
  switch (key) {
    case "ArrowLeft":
      keys.leftKey.pressed = isPressed;
      player.velocity.x = -5;
      break;
    case "ArrowUp":
      player.velocity.y = -8;
      break;
    case "ArrowRight":
      keys.rightKey.pressed = isPressed;
      player.velocity.x = 5;
      break;
  }
};

const startGame = () => {
  canvas.style.display = "block";
  startScreen.style.display = "none";
  animate();
};

startBtn.addEventListener("click", startGame);

window.addEventListener("keydown", ({ key }) => movePlayer(key, 8, true));
window.addEventListener("keyup", ({ key }) => movePlayer(key, 0, false));
