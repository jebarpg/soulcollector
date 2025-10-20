export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, enemyId, x = 200, y = 200, dummy = false, health = 1) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    this.prevX = -1
    this.prevY = -1

    this.originX = x
    this.originY = y
    this.pauseDuration = Phaser.Math.RND.integerInRange(1000, 2000)
    this.Direction = Phaser.Math.RND.integerInRange(1, 4)
    this.moveDuration = Phaser.Math.RND.integerInRange(500, 1000)
    this.pauseStartTime = 0
    this.moveStartTime = 0
    this.state = "moving"

    this.dead = false
    this.prevDead = false

    this.enemyId = enemyId
    this.move = {}

    this.health = health

    this.body.setSize(32, 48)

    this.prevNoMovement = true

    this.setCollideWorldBounds(true)

    scene.events.on('update', this.update, this)
  }

  kill() {
    this.dead = true
    this.setActive(false)
  }

  revive(enemyId) {
    this.enemyId = enemyId
    this.dead = false
    this.setActive(true)
    this.setVelocity(0)
  }

  moveDirection() {
    // if this.moveTime is less than time then move
    // else pause for random pause time
    // then choose direction and move towards that direction
    const now = Date.now();

    // Initialize defaults if not already set
    if (!this.state) this.state = "moving";
    if (!this.moveStartTime) this.moveStartTime = now;
    if (!this.moveDuration) this.moveDuration = Phaser.Math.RND.integerInRange(500, 1000);
    if (!this.pauseDuration) this.pauseDuration = Phaser.Math.RND.integerInRange(1000, 2000);

    if (this.state === "moving") {
      // Move in the current direction
      switch (this.Direction) {
        case 1:
          this.setMove("1");
          break;
        case 2:
          this.setMove("2");
          break;
        case 3:
          this.setMove("4");
          break;
        case 4:
          this.setMove("8");
          break;
      }

      // If movement duration has passed, start pause phase
      if (now - this.moveStartTime > this.moveDuration) {
        this.state = "paused";
        this.pauseStartTime = now;
        this.pauseDuration = Phaser.Math.RND.integerInRange(1000, 2000);
      }
    }

    else if (this.state === "paused") {
      // Stay still during pause
      this.setMove("0"); // or stop velocity if using physics

      // After pause duration, resume moving
      if (now - this.pauseStartTime > this.pauseDuration) {
        this.state = "moving";
        this.moveStartTime = now;
        this.moveDuration = Phaser.Math.RND.integerInRange(500, 1000);
        this.Direction = Phaser.Math.RND.integerInRange(1, 4);
      }
    }
  }

  setMove(data) {
    let int = parseInt(data, 36)

    //console.log(int)
    let move = {
      left: int === 1 || int === 5 || int == 9,
      right: int === 2 || int === 6 || int == 10,
      up: int === 4 || int === 6 || int === 5,
      down: int === 8 || int === 10 || int === 9,
      none: int === 16
    }

    this.move = move
  }

  update() {
    if (this.move.left) this.setVelocityX(-160)
    else if (this.move.right) this.setVelocityX(160)
    else this.setVelocityX(0)

    if (this.move.up) this.setVelocityY(-160)
    else if (this.move.down) this.setVelocityY(160)
    else this.setVelocityY(0)
  }

  postUpdate() {
    this.prevX = this.x
    this.prevY = this.y
    this.prevDead = this.dead
  }
}
