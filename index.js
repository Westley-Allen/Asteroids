//---     APPLICATION SETUP!!!     ---//

const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//---     Constant Variables     ---//

const speed = 2.7;
const rotationSpeed = 0.04;
const friction = 0.97;
const projectileSpeed = 5;
const boostedSpeed = 4;
let score = 0;

const keys = {
  w: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
};

const projectiles = [];
const asteroids = [];

//---     PLAYER CREATION     ---//

class Player {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.rotation = 0;
  }
  draw() {
    c.save();

    //--  Player rotation  --//
    c.translate(this.position.x, this.position.y);
    c.rotate(this.rotation);
    c.translate(-this.position.x, -this.position.y);

    //--  Middle circle  --//
    c.beginPath();
    c.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false);
    c.fillStyle = "red";
    c.fill();
    c.closePath();

    //--  Player lines  --//
    c.beginPath();
    c.moveTo(this.position.x + 25, this.position.y);
    c.lineTo(this.position.x - 10, this.position.y - 10);
    c.lineTo(this.position.x - 10, this.position.y + 10);
    c.closePath();

    c.strokeStyle = "white";
    c.stroke();

    c.restore();
  }

  //--  Update player position  --//
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  getVertices() {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);

    return [
      {
        x: this.position.x + cos * 30 - sin * 0,
        y: this.position.y + sin * 30 + cos * 0,
      },
      {
        x: this.position.x + cos * -10 - sin * 10,
        y: this.position.y + sin * -10 + cos * 10,
      },
      {
        x: this.position.x + cos * -10 - sin * -10,
        y: this.position.y + sin * -10 + cos * -10,
      },
    ];
  }
}
class Projectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 5;
  }
  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    c.closePath();
    c.fillStyle = "white";
    c.fill();
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Asteroid {
  constructor({ position, velocity, radius }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.numPoints = Math.floor(Math.random() * 10) + 5; // Adjust the number of points as desired
  }

  draw() {
    c.beginPath();
    const angleStep = (Math.PI * 2) / this.numPoints;
    for (let i = 0; i < this.numPoints; i++) {
      const angle = i * angleStep;
      const x = this.position.x + Math.cos(angle) * this.radius;
      const y = this.position.y + Math.sin(angle) * this.radius;
      c.lineTo(x, y);
    }
    c.closePath();
    c.strokeStyle = "white";
    c.stroke();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
  split() {
    if (this.radius > 30) {
      const smallerRadius = this.radius / 2;

      // Generate random angles for the velocities of the smaller asteroids
      const randomAngle1 = Math.random() * Math.PI * 2;
      const randomAngle2 = Math.random() * Math.PI * 2;

      asteroids.push(
        new Asteroid({
          position: { x: this.position.x, y: this.position.y },
          velocity: {
            x: Math.cos(randomAngle1),
            y: Math.sin(randomAngle1),
          },
          radius: smallerRadius,
        })
      );

      asteroids.push(
        new Asteroid({
          position: { x: this.position.x, y: this.position.y },
          velocity: {
            x: Math.cos(randomAngle2),
            y: Math.sin(randomAngle2),
          },
          radius: smallerRadius,
        })
      );
    }
  }
}
const player = new Player({
  position: { x: canvas.width / 2, y: canvas.height / 2 },
  velocity: { x: 0, y: 0 },
});

//---     ASTEROID LOGIC     ---//
const initialSpawnInterval = 3000; // Initial interval in milliseconds
let currentSpawnInterval = initialSpawnInterval; // Variable to control the interval over time

const intervalId = window.setInterval(() => {
  const index = Math.floor(Math.random() * 4);
  let x, y;
  let vx, vy;
  let radius = 50 * Math.random() + 10;

  switch (index) {
    case 0: // left side of the screen
      x = 0 - radius;
      y = Math.random() * canvas.height;
      vx = 1;
      vy = 0;
      break;
    case 1: // bottom of the screen
      x = Math.random() * canvas.width;
      y = canvas.height + radius;
      vx = 0;
      vy = -1;
      break;
    case 2: // right side of the screen
      x = canvas.width + radius;
      y = Math.random() * canvas.height;
      vx = -1;
      vy = 0;
      break;
    case 3: // top of the screen
      x = Math.random() * canvas.width;
      y = 0 - radius;
      vx = 0;
      vy = 1;
      break;
  }

  asteroids.push(
    new Asteroid({
      position: {
        x: x,
        y: y,
      },
      velocity: {
        x: vx,
        y: vy,
      },
      radius,
    })
  );

  console.log(asteroids);
  currentSpawnInterval *= 0.9;
}, currentSpawnInterval);

//---     COLLISION LOGIC     ---//
function circleCollision(circle1, circle2) {
  const xDifference = circle2.position.x - circle1.position.x;
  const yDifference = circle2.position.y - circle1.position.y;

  const distance = Math.sqrt(
    xDifference * xDifference + yDifference * yDifference
  );

  if (distance <= circle1.radius + circle2.radius) {
    return true;
  }

  return false;
}

function circleTriangleCollision(circle, triangle) {
  for (let i = 0; i < 3; i++) {
    let start = triangle[i];
    let end = triangle[(i + 1) % 3];

    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let length = Math.sqrt(dx * dx + dy * dy);

    let dot =
      ((circle.position.x - start.x) * dx +
        (circle.position.y - start.y) * dy) /
      Math.pow(length, 2);

    let closestX = start.x + dot * dx;
    let closestY = start.y + dot * dy;

    if (!isPointOnLineSegment(closestX, closestY, start, end)) {
      closestX = closestX < start.x ? start.x : end.x;
      closestY = closestY < start.y ? start.y : end.y;
    }

    dx = closestX - circle.position.x;
    dy = closestY - circle.position.y;

    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= circle.radius) {
      return true;
    }
  }

  return false;
}

function isPointOnLineSegment(x, y, start, end) {
  return (
    x >= Math.min(start.x, end.x) &&
    x <= Math.max(start.x, end.x) &&
    y >= Math.min(start.y, end.y) &&
    y <= Math.max(start.y, end.y)
  );
}

//---     PLAYER ANIMATION AND MOVEMENT     ---//
function animate() {
  const animationId = window.requestAnimationFrame(animate);
  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = "white";
  c.font = "20px Arial";
  c.fillText("Score: " + score, 20, 30);

  player.update();

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.update();

    //--  Projectile management  --//
    if (
      projectile.position.x + projectile.radius < 0 ||
      projectile.position.x - projectile.radius > canvas.width ||
      projectile.position.y - projectile.radius > canvas.height ||
      projectile.position.y + projectile.radius < 0
    ) {
      projectiles.splice(i, 1);
    }
  }

  //--  Asteroid management  --//
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid = asteroids[i];
    asteroid.update();

    if (circleTriangleCollision(asteroid, player.getVertices())) {
      console.log("GAME OVER");
      window.cancelAnimationFrame(animationId);
      clearInterval(intervalId);
    }

    if (
      asteroid.position.x + asteroid.radius < 0 ||
      asteroid.position.x - asteroid.radius > canvas.width ||
      asteroid.position.y - asteroid.radius > canvas.height ||
      asteroid.position.y + asteroid.radius < 0
    ) {
      asteroids.splice(i, 1);
    }

    //--  Asteroid damage  --//
    for (let j = projectiles.length - 1; j >= 0; j--) {
      const projectile = projectiles[j];

      if (circleCollision(asteroid, projectile)) {
        asteroid.split(); // Split the asteroid
        asteroids.splice(i, 1);
        projectiles.splice(j, 1);

        // Increment the score when an asteroid is destroyed
        score += 1;
        console.log("Score:", score);
      }
    }
  }

  //--  Player management  --//
  if (keys.w.pressed) {
    player.velocity.x =
      Math.cos(player.rotation) * (keys.Space ? boostedSpeed : speed);
    player.velocity.y =
      Math.sin(player.rotation) * (keys.Space ? boostedSpeed : speed);
  } else if (!keys.w.pressed) {
    player.velocity.x *= friction;
    player.velocity.y *= friction;
  }

  if (keys.d.pressed) player.rotation += rotationSpeed;
  else if (keys.a.pressed) player.rotation -= rotationSpeed;
}

animate();

window.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    // Check if left mouse button is clicked
    projectiles.push(
      new Projectile({
        position: {
          x: player.position.x + Math.cos(player.rotation) * 30,
          y: player.position.y + Math.sin(player.rotation) * 30,
        },
        velocity: {
          x: Math.cos(player.rotation) * projectileSpeed,
          y: Math.sin(player.rotation) * projectileSpeed,
        },
      })
    );
  }
});

window.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyW":
      keys.w.pressed = true;
      break;
    case "KeyA":
      keys.a.pressed = true;
      break;
    case "KeyD":
      keys.d.pressed = true;
      break;
    case "Space":
      keys.Space = true;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyW":
      keys.w.pressed = false;
      break;
    case "KeyA":
      keys.a.pressed = false;
      break;
    case "KeyD":
      keys.d.pressed = false;
      break;
    case "Space":
      keys.Space = false;
      break;
  }
});
