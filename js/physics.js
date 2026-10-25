// Render in pixels; simulate in meters, with positive Y down.
export const PIXELS_PER_METER = 50;
const FIXED_STEP = 1 / 60;

export function physicsVector(x, y) {
  return planck.Vec2(x / PIXELS_PER_METER, y / PIXELS_PER_METER);
}

export default class PhysicsWorld {
  constructor(scene) {
    this.scene = scene;
    this.world = new planck.World(physicsVector(0, 1500));
    this.accumulator = 0;
    this.sprites = [];
    const { width, height } = scene.sys.game.config;
    const bounds = this.world.createBody();
    const corners = [[0, 0], [width, 0], [width, height], [0, height]];
    for (let i = 0; i < corners.length; i++) {
      bounds.createFixture(planck.Edge(
        physicsVector(...corners[i]),
        physicsVector(...corners[(i + 1) % corners.length])
      ), { friction: 1, restitution: 0.1 });
    }
    scene.events.once('shutdown', this.destroy, this);
  }

  createStaticBox(x, y, width, height) {
    const body = this.world.createBody({ position: physicsVector(x, y) });
    body.createFixture(planck.Box(width / (2 * PIXELS_PER_METER), height / (2 * PIXELS_PER_METER)), {
      friction: 1, restitution: 0.1
    });
    return body;
  }

  createMiner(x, y, facingLeft, scaleX = 1.1, scaleY = scaleX) {
    const sprite = this.scene.add.sprite(x, y, 'miner').setOrigin(0.5).setScale(scaleX, scaleY).setFlipX(facingLeft);
    const body = this.world.createDynamicBody({
      position: physicsVector(x, y), fixedRotation: true, bullet: true
    });
    // The wider sheet cells accommodate crawling; keep the standing body width.
    body.createFixture(planck.Box(31 * scaleX / (2 * PIXELS_PER_METER), sprite.displayHeight / (2 * PIXELS_PER_METER)), {
      density: 1, friction: 1, restitution: 0.1
    });
    sprite.setFrame(5);
    this.sprites.push({ sprite, body, airborne: true, crawling: false, scaleX, scaleY });
    return { sprite, body };
  }

  setCrawling(body, crawling) {
    const actor = this.sprites.find(actor => actor.body === body);
    if (actor.crawling === crawling) return crawling;
    const { scaleX, scaleY } = actor;
    if (!crawling) {
      // Check only the extra headroom needed to stand, excluding the floor.
      const head = planck.Box(31 * scaleX / 100 - 0.01, 20 * scaleY / 100 - 0.01,
        physicsVector(0, -9 * scaleY));
      const position = body.getPosition();
      const bounds = new planck.AABB(
        planck.Vec2(position.x - 31 * scaleX / 100, position.y - 19 * scaleY / 50),
        planck.Vec2(position.x + 31 * scaleX / 100, position.y + scaleY / 50)
      );
      let blocked = false;
      this.world.queryAABB(bounds, fixture => {
        if (fixture.getBody() === body || fixture.isSensor()) return true;
        const shape = fixture.getShape();
        for (let child = 0; child < shape.getChildCount(); child++) {
          if (planck.testOverlap(head, 0, shape, child, body.getTransform(), fixture.getBody().getTransform())) {
            blocked = true;
            return false;
          }
        }
        return true;
      });
      if (blocked) return true;
    }
    body.destroyFixture(body.getFixtureList());
    body.createFixture(planck.Box(31 * scaleX / 100, (crawling ? 18 : 38) * scaleY / 100,
      physicsVector(0, crawling ? 10 * scaleY : 0)), {
      density: 1, friction: 1, restitution: 0.1,
    });
    actor.crawling = crawling;
    return crawling;
  }

  createTerrain(polygons, scaleX, scaleY = scaleX) {
    const terrain = this.world.createBody();
    for (const polygon of polygons) {
      const vertices = [];
      for (let i = 0; i < polygon.shape.length; i += 2) {
        vertices.push(physicsVector(polygon.shape[i] * scaleX, polygon.shape[i + 1] * scaleY));
      }
      terrain.createFixture(planck.Polygon(vertices), {
        friction: polygon.friction === undefined ? 1 : polygon.friction,
        restitution: polygon.bounce === undefined ? 0.1 : polygon.bounce,
        filterCategoryBits: polygon.filter.categoryBits,
        filterMaskBits: polygon.filter.maskBits,
        userData: polygon.tag
      });
    }
    return terrain;
  }

  isGrounded(body) {
    const actor = this.sprites.find(actor => actor.body === body);
    // Explicit takeoff distinguishes a real jump from upward travel on stairs.
    if (actor && actor.jumping && body.getLinearVelocity().y < 0) return false;
    for (let edge = body.getContactList(); edge; edge = edge.next) {
      const contact = edge.contact;
      if (!contact.isTouching() || !contact.isEnabled()) continue;
      const a = contact.getFixtureA();
      const b = contact.getFixtureB();
      if (a.isSensor() || b.isSensor()) continue;
      const normal = contact.getWorldManifold(null).normal;
      const isBodyA = a.getBody() === body;
      const supportY = isBodyA ? normal.y : -normal.y;
      if (supportY > 0.35) return true;
    }
    // Bridge tiny gaps between stair fixtures without treating side walls as ground.
    if (actor) {
      const position = body.getPosition();
      const feetY = position.y + 19 * actor.scaleY / PIXELS_PER_METER;
      const halfWidth = (15.5 * actor.scaleX - 0.5) / PIXELS_PER_METER;
      for (const offset of [-halfWidth, 0, halfWidth]) {
        let supported = false;
        this.world.rayCast(
          planck.Vec2(position.x + offset, feetY - 2 / PIXELS_PER_METER),
          planck.Vec2(position.x + offset, feetY + 4 / PIXELS_PER_METER),
          (fixture, point, normal) => {
            if (fixture.getBody() === body || fixture.isSensor()) return -1;
            if (normal.y < -0.35) supported = true;
            return supported ? 0 : -1;
          }
        );
        if (supported) return true;
      }
    }
    return false;
  }

  markJump(body) {
    const actor = this.sprites.find(actor => actor.body === body);
    if (actor) actor.jumping = true;
  }

  step(delta, beforeStep) {
    // Phaser 3 scene delta is milliseconds. Cap catch-up after a long pause.
    this.accumulator += Math.min(delta / 1000, 0.1);
    while (this.accumulator + 1e-10 >= FIXED_STEP) {
      if (beforeStep) beforeStep(FIXED_STEP);
      this.world.step(FIXED_STEP, 8, 3);
      this.accumulator -= FIXED_STEP;
    }
    for (const actor of this.sprites) {
      const { sprite, body } = actor;
      const position = body.getPosition();
      sprite.setPosition(position.x * PIXELS_PER_METER, position.y * PIXELS_PER_METER);
      sprite.setRotation(body.getAngle());
      const airborne = !this.isGrounded(body);
      if (!airborne) actor.jumping = false;
      if (airborne) sprite.setFrame(5);
      else if (actor.airborne) sprite.setFrame(actor.crawling ? 6 : 0);
      actor.airborne = airborne;
    }
  }

  destroy() {
    for (let body = this.world.getBodyList(); body;) {
      const next = body.getNext();
      this.world.destroyBody(body);
      body = next;
    }
    this.sprites.length = 0;
    this.world = null;
    this.scene = null;
  }
}
