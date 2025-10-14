export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, enemyId, x = 200, y = 200, dummy = false, health = 1) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    this.prevX = -1
    this.prevY = -1

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
