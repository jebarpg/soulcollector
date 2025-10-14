import Phaser from 'phaser'

export default class Enemy extends Phaser.GameObjects.Sprite {
  constructor(scene, channelId, x, y) {
    super(scene, x, y, 'enemy')
    scene.add.existing(this)

    this.channelId = channelId

    this.setFrame(4)
  }
}
