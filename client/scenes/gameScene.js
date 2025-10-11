import { Scene } from 'phaser'
import axios from 'axios'
import Player from '../components/player.js'
import Cursors from '../components/cursors.js'
import Controls from '../components/controls.js'
import FullscreenButton from '../components/fullscreenButton.js'

export default class GameScene extends Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.objects = {}
    this.playerId
  }

  init({ channel }) {
    this.channel = channel
  }

  preload() {
    this.load.image('controls', 'assets/controls.png')
    this.load.spritesheet('fullscreen', 'assets/fullscreen.png', {
      frameWidth: 64,
      frameHeight: 64
    })
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 32,
      frameHeight: 48
    })
  }

  async create() {
    new Cursors(this, this.channel)
    new Controls(this, this.channel)

    // Disable the browser's context menu for right-click
    this.input.mouse.disableContextMenu();

    // Listen for pointerdown events
    this.input.on('pointerdown', function (pointer) {
      let attack = {
        sword: false,
        fireball: false,
        none: true
      }
      if (pointer.leftButtonDown()) {
        attack.sword = true
        attack.none = false
      } else if (pointer.rightButtonDown()) {
        attack.fireball = true
        attack.none = false
      }
      if (attack.sword || attack.fireball || attack.none !== this.prevNoAttack) {
        let total = 0
        if (attack.sword) total += 1
        if (attack.fireball) total += 2
        let str36 = total.toString(36)
        this.channel.emit('playerAttack', str36)
      }
    }, this); // 'this' ensures the callback context is the scene

    FullscreenButton(this)

    // let addDummyDude = this.add
    //   .text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 100, 'CLICK ME', { fontSize: 48 })
    //   .setOrigin(0.5)
    // addDummyDude.setInteractive().on('pointerdown', () => {
    //   this.channel.emit('addDummy')
    // })

    let healthText = this.add.text(0,0, "HP: ", { fontSize: 48 })
    let scoreText = this.add.text(0,48, "Score: ", { fontSize: 48 })
    let orbText = this.add.text(0,96, "Orbs: ", { fontSize: 48 })
    let directionText = this.add.text(0,144, "Direction: ", { fontSize: 48 })

    const parseUpdates = updates => {
      if (typeof updates === undefined || updates === '') return []

      // parse
      let u = updates.split(',')
      //console.log("u:" + u)
      u.pop()
      //console.log("u:" + u)
      let u2 = []

      u.forEach((el, i) => {
        if (i % 8 === 0) {
          u2.push({
            playerId: u[i + 0],
            x: parseInt(u[i + 1], 36),
            y: parseInt(u[i + 2], 36),
            dead: parseInt(u[i + 3]) === 1 ? true : false,
            health: parseInt(u[i + 4], 36),
            score: parseInt(u[i + 5], 36),
            direction: parseInt(u[i + 6], 36),
            orbs: parseInt(u[i + 7], 36)
          })
        }
      })
      return u2
    }

    const updatesHandler = updates => {
      updates.forEach(gameObject => {
        //console.log(gameObject)
        const { playerId, x, y, dead, health, score, direction, orbs } = gameObject
        const alpha = dead ? 0 : 1

        if (Object.keys(this.objects).includes(playerId)) {
          // if the gameObject does already exist,
          // update the gameObject
          let sprite = this.objects[playerId].sprite
          sprite.setAlpha(alpha)
          sprite.setPosition(x, y)
          if (this.playerId == playerId){
            healthText.setText("HP: " + health)
            scoreText.setText("Score: " + score)
            directionText.setText("Direction: " + direction)
            orbText.setText("Orbs: " + orbs)
          }
        } else {
          // if the gameObject does NOT exist,
          // create a new gameObject
          let newGameObject = {
            sprite: new Player(this, playerId, x || 200, y || 200),
            playerId: playerId
          }
          newGameObject.sprite.setAlpha(alpha)
          this.objects = { ...this.objects, [playerId]: newGameObject }
          //console.log("new object: x y: playerId" + x + " " + y + " " + playerId)
        }
      })
    }

    this.channel.on('updateObjects', updates => {
      let parsedUpdates = parseUpdates(updates[0])
      updatesHandler(parsedUpdates)
    })

    this.channel.on('removePlayer', playerId => {
      try {
        this.objects[playerId].sprite.destroy()
        delete this.objects[playerId]
      } catch (error) {
        console.error(error.message)
      }
    })

    try {
      let res = await axios.get(`${location.protocol}//${location.hostname}:1444/getState`)

      let parsedUpdates = parseUpdates(res.data.state)
      updatesHandler(parsedUpdates)

      this.channel.on('getId', playerId36 => {
        this.playerId = parseInt(playerId36, 36)
        this.channel.emit('addPlayer')
      })

      this.channel.emit('getId')
    } catch (error) {
      console.error(error.message)
    }
  }
}
