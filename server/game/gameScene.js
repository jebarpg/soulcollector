import geckos from '@geckos.io/server'
import { iceServers } from '@geckos.io/server'

import pkg from 'phaser'
const { Scene } = pkg

import { Player } from './components/player.js'
import { Enemy } from './components/enemy.js'

export class GameScene extends Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.playerId = 0
    this.enemyId = 0
  }

  init() {
    this.io = geckos({
      iceServers: process.env.NODE_ENV === 'production' ? iceServers : []
    })
    this.io.addServer(this.game.server)
  }

  getId() {
    return this.playerId++
  }

  getIdEnemy() {
    return this.enemyId++
  }

  prepareToSync(player) {
    return `${player.playerId},${Math.round(player.x).toString(36)},${Math.round(player.y).toString(36)},${player.dead === true ? 1 : 0},${Math.round(player.health).toString(36)},${Math.round(player.score).toString(36)},${Math.round(player.direction).toString(36)},${Math.round(player.orbs).toString(36)},`
  }

  prepareToSyncEnemy(enemy) {
    return `${enemy.enemyId},${Math.round(enemy.x).toString(36)},${Math.round(enemy.y).toString(36)},${enemy.dead === true ? 1 : 0},${Math.round(enemy.health).toString(36)},`
  }

  getState() {
    let state = ''
    this.playersGroup.children.iterate(player => {
      state += this.prepareToSync(player)
    })
    return state
  }

  getStateEnemy() {
    let state = ''
    this.enemiesGroup.children.iterate(enemy => {
      state += this.prepareToSyncEnemy(enemy)
    })
    return state
  }

  create() {
    this.playersGroup = this.add.group()
    this.enemiesGroup = this.add.group()

    const addDummy = () => {
      let x = Phaser.Math.RND.integerInRange(50, 800)
      let y = Phaser.Math.RND.integerInRange(100, 400)
      let id = Math.random()

      let dead = this.playersGroup.getFirstDead()
      if (dead) {
        dead.revive(id, true)
        dead.setPosition(x, y)
      } else {
        this.playersGroup.add(new Player(this, id, x, y, true))
      }
    }

    this.io.onConnection(channel => {
      channel.onDisconnect(() => {
        console.log('Disconnect user ' + channel.id)
        this.playersGroup.children.each(player => {
          if (player.playerId === channel.playerId) {
            player.kill()
          }
        })
        channel.room.emit('removePlayer', channel.playerId)
      })

      channel.on('addDummy', addDummy)

      channel.on('getId', () => {
        channel.playerId = this.getId()
        channel.emit('getId', channel.playerId.toString(36))
      })

      channel.on('playerMove', data => {
        this.playersGroup.children.iterate(player => {
          if (player.playerId === channel.playerId) {
            player.setMove(data)
          }
        })
      })

      channel.on('playerAttack', data => {
        this.playersGroup.children.iterate(player => {
          if (player.playerId === channel.playerId) {
            player.setAttack(data)
          }
        })
      })

      channel.on('addPlayer', data => {
        let dead = this.playersGroup.getFirstDead()
        if (dead) {
          dead.revive(channel.playerId, false)
        } else {
          this.playersGroup.add(new Player(this, channel.playerId, Phaser.Math.RND.integerInRange(100, 700)))
          //console.log("addPlayer total: " + this.playersGroup.countActive())
        }
      })

      channel.emit('ready')
    })
  }

  update() {
    // player updates
    // get and update all players that have moved
    let updates = ''
    this.playersGroup.children.iterate(player => {
      let x = Math.abs(player.x - player.prevX) > 0.5
      let y = Math.abs(player.y - player.prevY) > 0.5
      let dead = player.dead != player.prevDead
      if (x || y || dead) {
        if (dead || !player.dead) {
          updates += this.prepareToSync(player)
        }
      }
      player.postUpdate()
    })

    if (updates.length > 0) {
      this.io.room().emit('updateObjects', [updates])
    }

    // enemy updates
    // check to see if any enemy has moved after a delta time
    // reset enemy's move timer if they have moved the distance alloted.

    // if enemies are less than 10 then add a new enemy.
    if (this.enemiesGroup.countActive() < 10) {
      let deadEnemy = this.enemiesGroup.getFirstDead()
      if (deadEnemy) {
          deadEnemy.revive(deadEnemy.enemyId, false)
        } else {
          this.enemiesGroup.add(new Enemy(this, this.getIdEnemy(), Phaser.Math.RND.integerInRange(100, 700)))
          console.log("addEnemy total: " + this.enemiesGroup.countActive())
        }
        this.enemiesGroup.children.iterate(enemy => {
          enemy.setMove("1")
        })
    }
    
    this.enemiesGroup.children.iterate(enemy => {
      if (enemy.dead) {
        enemy.kill()
      }
    })


    let updatesEnemy = ''
    this.enemiesGroup.children.iterate(enemy => {
      let x = Math.abs(enemy.x - enemy.prevX) > 0.5
      let y = Math.abs(enemy.y - enemy.prevY) > 0.5
      let dead = enemy.dead != enemy.prevDead
      if (x || y || dead) {
        if (dead || !enemy.dead) {
          updatesEnemy += this.prepareToSyncEnemy(enemy)
        }
      }
      enemy.postUpdate()
    })

    if (updatesEnemy.length > 0) {
      this.io.room().emit('updateObjectsEnemy', [updatesEnemy])
    }
  }
}
