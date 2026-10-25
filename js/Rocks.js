import { physicsVector, PIXELS_PER_METER } from './physics.js';

const random = (min, max) => min + Math.random() * (max - min);

export default class Rocks {
  constructor(scene, lavaColumns) {
    this.scene = scene;
    this.rocks = [];
    this.sources = [
      ...lavaColumns.map((column, index) => ({ column, index, remaining: random(1.5, 3.5) })),
      { x: 48, remaining: random(2, 4) },
      { x: 504, remaining: random(2, 4) },
    ];
  }

  step(seconds) {
    for (const rock of this.rocks) rock.age += seconds;
    for (const source of this.sources) {
      source.remaining -= seconds;
      if (source.remaining > 0) continue;
      source.remaining = source.column ? random(2, 4.5) : random(2.5, 5);
      if (this.rocks.length < 12) this.spawn(source);
    }
  }

  spawn(source) {
    const scene = this.scene;
    const size = 13 * Math.min(scene.worldScaleX, scene.worldScaleY);
    const x = source.column
      ? (source.column.x + source.column.width / 2 + random(-3, 3)) * scene.worldScaleX
      : (source.x + random(-3, 3)) * scene.worldScaleX;
    const y = source.column
      ? scene.lavaSurfaces[source.index].y - size / 2
      : 12 * scene.worldScaleY;
    const sprite = scene.add.sprite(x, y, 'rocks', Math.floor(random(0, 2))).setDisplaySize(size, size);
    const body = scene.planckPhysics.world.createDynamicBody({ position: physicsVector(x, y), bullet: true });
    body.createFixture(planck.Circle(size / (2 * PIXELS_PER_METER)), {
      density: 1, friction: 0.35, restitution: 0.45,
    });
    body.setLinearVelocity(physicsVector(
      source.column ? random(-90, 90) : random(-30, 30),
      source.column ? -random(650, 900) : random(20, 60)
    ));
    body.setAngularVelocity(random(-7, 7));
    this.rocks.push({ sprite, body, age: 0 });
  }

  sync() {
    const scene = this.scene;
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const rock = this.rocks[i];
      const position = rock.body.getPosition();
      rock.sprite.setPosition(position.x * PIXELS_PER_METER, position.y * PIXELS_PER_METER);
      rock.sprite.setRotation(rock.body.getAngle());
      for (let edge = rock.body.getContactList(); edge; edge = edge.next) {
        if (edge.other === scene.minerBody && edge.contact.isEnabled() && edge.contact.isTouching()) {
          scene.killMiner();
          break;
        }
      }
      const inLava = rock.body.getLinearVelocity().y > 0 && this.sources.some(source => {
        if (!source.column) return false;
        const { x, width, bottom } = source.column;
        return rock.sprite.x >= x * scene.worldScaleX
          && rock.sprite.x <= (x + width) * scene.worldScaleX
          && rock.sprite.y >= scene.lavaSurfaces[source.index].y
          && rock.sprite.y <= bottom * scene.worldScaleY;
      });
      if (rock.age >= 12 || inLava) {
        scene.planckPhysics.world.destroyBody(rock.body);
        rock.sprite.destroy();
        this.rocks.splice(i, 1);
      }
    }
  }
}
