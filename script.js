const startBtn = document.getElementById("start-btn");
const canvas = document.getElementById("canvas");
const startScreen = document.querySelector(".start-screen");
const checkpointScreen = document.querySelector(".checkpoint-screen");
const checkpointMessage = document.querySelector(".checkpoint-screen > p");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;
const gravity = 0.5;
let isCheckpointCollisionDetectionActive = true;

const proportionalSize = (size) => {
  return innerHeight < 500 ? Math.ceil((size / 500) * innerHeight) : size;
};

// Wave background class for parallax effect
class Wave {
  constructor(y, speed, color) {
    this.y = y;
    this.speed = speed;
    this.color = color;
    this.offset = 0;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(-canvas.width + this.offset, this.y);
    for (let i = -canvas.width; i <= canvas.width; i += 100) {
      ctx.lineTo(i + this.offset, this.y + Math.sin(i * 0.05) * 20);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(-canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
  }
  update() {
    this.offset += this.speed;
    if (this.offset > 100) this.offset = 0;
  }
}

// Creating layered waves
const waves = [
  new Wave(canvas.height * 0.8, 1, "#88c"),
  new Wave(canvas.height * 0.85, 0.7, "#77b"),
  new Wave(canvas.height * 0.9, 0.5, "#66a"),
];

function drawWaves() {
  waves.forEach((wave) => {
    wave.draw();
    wave.update();
  });
}

// Player class with penguin image
class Player {
  constructor() {
    this.image = new Image();
    this.image.src = "Penguin.png";
    this.position = {
      x: proportionalSize(10),
      y: proportionalSize(400),
    };
    this.velocity = { x: 0, y: 0 };
    this.width = proportionalSize(40);
    this.height = proportionalSize(40);
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

    if (this.position.x < this.width) {
      this.position.x = this.width;
    }

    if (this.position.x >= canvas.width - this.width * 2) {
      this.position.x = canvas.width - this.width * 2;
    }
  }
}

// Platform class for platforms
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

// Checkpoint class with buoy image
class CheckPoint {
  constructor(x, y, z) {
    this.image = new Image();
    this.image.src = "Buoy.png";
    this.position = { x, y };
    this.width = proportionalSize(40);
    this.height = proportionalSize(70);
    this.claimed = false;
  }
  draw() {
    if (!this.claimed) {
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
  }
}

// Initialize player, platforms, and checkpoints
const player = new Player();
const platformPositions = [
  { x: 500, y: proportionalSize(450) },
  { x: 700, y: proportionalSize(400) },
  // Add more platform positions here
];
const platforms = platformPositions.map(
  (platform) => new Platform(platform.x, platform.y)
);

const checkpointPositions = [
  { x: 1170, y: proportionalSize(80), z: 1 },
  { x: 2900, y: proportionalSize(330), z: 2 },
  { x: 4800, y: proportionalSize(80), z: 3 },
];
const checkpoints = checkpointPositions.map(
  (checkpoint) => new CheckPoint(checkpoint.x, checkpoint.y, checkpoint.z)
);

const animate = () => {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background waves
  drawWaves();

  platforms.forEach((platform) => platform.draw());
  checkpoints.forEach((checkpoint) => checkpoint.draw());
  player.update();

  // Horizontal movement controls
  if (keys.rightKey.pressed && player.position.x < proportionalSize(400)) {
    player.velocity.x = 5;
  } else if (
    keys.leftKey.pressed &&
    player.position.x > proportionalSize(100)
  ) {
    player.velocity.x = -5;
  } else {
    player.velocity.x = 0;
    if (keys.rightKey.pressed && isCheckpointCollisionDetectionActive) {
      platforms.forEach((platform) => (platform.position.x -= 5));
      checkpoints.forEach((checkpoint) => (checkpoint.position.x -= 5));
    } else if (keys.leftKey.pressed && isCheckpointCollisionDetectionActive) {
      platforms.forEach((platform) => (platform.position.x += 5));
      checkpoints.forEach((checkpoint) => (checkpoint.position.x += 5));
    }
  }

  // Platform collision detection
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
      return;
    }
  });

  // Checkpoint collision detection
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
        // Display final big wave for final checkpoint
        ctx.fillStyle = "rgba(135, 206, 235, 0.7)";
        ctx.fillRect(0, canvas.height - 200, canvas.width, 200);
        showCheckpointScreen("You've surfed to the final wave! 🌊");
      }
    }
  });
};

const keys = {
  rightKey: { pressed: false },
  leftKey: { pressed: false },
};

const movePlayer = (key, xVelocity, isPressed) => {
  if (!isCheckpointCollisionDetectionActive) {
    player.velocity.x = 0;
    player.velocity.y = 0;
    return;
  }
  switch (key) {
    case "ArrowLeft":
      keys.leftKey.pressed = isPressed;
      player.velocity.x -= xVelocity;
      break;
    case "ArrowUp":
    case " ":
      player.velocity.y -= 8;
      break;
    case "ArrowRight":
      keys.rightKey.pressed = isPressed;
      player.velocity.x += xVelocity;
  }
};

const startGame = () => {
  canvas.style.display = "block";
  startScreen.style.display = "none";
  animate();
};

const showCheckpointScreen = (msg) => {
  checkpointScreen.style.display = "block";
  checkpointMessage.textContent = msg;
  if (isCheckpointCollisionDetectionActive) {
    setTimeout(() => (checkpointScreen.style.display = "none"), 2000);
  }
};

startBtn.addEventListener("click", startGame);
window.addEventListener("keydown", ({ key }) => movePlayer(key, 8, true));
window.addEventListener("keyup", ({ key }) => movePlayer(key, 0, false));
