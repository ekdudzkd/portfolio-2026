class PillPhysics {
  constructor(width, floor, gravity = 520) {
    this.width = width;
    this.floor = floor;
    this.gravity = gravity;
    this.bodies = [];
    this.time = 0;
  }

  add(options) {
    const body = { vx: 0, vy: 0, angle: 0, spin: 0, active: false, turned: false, ...options };
    body.radius = body.height / 2;
    body.length = (body.width - body.height) / 2;
    body.inverseMass = 1;
    body.inverseInertia = 12 / (body.width ** 2 + body.height ** 2);
    this.bodies.push(body);
    return body;
  }

  segment(body) {
    const dx = Math.cos(body.angle) * body.length;
    const dy = Math.sin(body.angle) * body.length;
    return [
      { x: body.x - dx, y: body.y - dy },
      { x: body.x + dx, y: body.y + dy },
    ];
  }

  closest(a, b) {
    const [p, q] = this.segment(a);
    const [r, s] = this.segment(b);
    const u = { x: q.x - p.x, y: q.y - p.y };
    const v = { x: s.x - r.x, y: s.y - r.y };
    const w = { x: p.x - r.x, y: p.y - r.y };
    const dot = (left, right) => left.x * right.x + left.y * right.y;
    const aa = dot(u, u),
      bb = dot(u, v),
      cc = dot(v, v);
    const dd = dot(u, w),
      ee = dot(v, w);
    const clamp = (value) => Math.max(0, Math.min(1, value));
    if (aa < 0.0001 && cc < 0.0001) return [p, r];
    if (aa < 0.0001) {
      const z = clamp(ee / cc);
      return [p, { x: r.x + v.x * z, y: r.y + v.y * z }];
    }
    if (cc < 0.0001) {
      const t = clamp(-dd / aa);
      return [{ x: p.x + u.x * t, y: p.y + u.y * t }, r];
    }
    const denominator = aa * cc - bb * bb;
    let t = denominator > 0.0001 ? clamp((bb * ee - cc * dd) / denominator) : 0;
    let z = cc > 0.0001 ? (bb * t + ee) / cc : 0;
    if (z < 0) {
      z = 0;
      t = aa > 0.0001 ? clamp(-dd / aa) : 0;
    }
    if (z > 1) {
      z = 1;
      t = aa > 0.0001 ? clamp((bb - dd) / aa) : 0;
    }
    return [
      { x: p.x + u.x * t, y: p.y + u.y * t },
      { x: r.x + v.x * z, y: r.y + v.y * z },
    ];
  }

  impulse(a, b, point, nx, ny) {
    const ax = point.x - a.x,
      ay = point.y - a.y;
    const bx = b ? point.x - b.x : 0,
      by = b ? point.y - b.y : 0;
    const relative = () => ({
      x: (b ? b.vx - b.spin * by : 0) - (a.vx - a.spin * ay),
      y: (b ? b.vy + b.spin * bx : 0) - (a.vy + a.spin * ax),
    });
    const apply = (amount, x, y) => {
      a.vx -= amount * x;
      a.vy -= amount * y;
      a.spin -= amount * (ax * y - ay * x) * a.inverseInertia;
      if (b) {
        b.vx += amount * x;
        b.vy += amount * y;
        b.spin += amount * (bx * y - by * x) * b.inverseInertia;
      }
    };
    const velocity = relative();
    const speed = velocity.x * nx + velocity.y * ny;
    if (speed >= 0) return;
    const crossA = ax * ny - ay * nx;
    const crossB = bx * ny - by * nx;
    const mass =
      1 + (b ? 1 : 0) + crossA ** 2 * a.inverseInertia + (b ? crossB ** 2 * b.inverseInertia : 0);
    const bounce = speed < -65 ? 0.12 : 0;
    const normalImpulse = (-(1 + bounce) * speed) / mass;
    apply(normalImpulse, nx, ny);
    const tangent = { x: -ny, y: nx };
    const after = relative();
    const frictionSpeed = after.x * tangent.x + after.y * tangent.y;
    const ta = ax * tangent.y - ay * tangent.x;
    const tb = bx * tangent.y - by * tangent.x;
    const tangentMass =
      1 + (b ? 1 : 0) + ta ** 2 * a.inverseInertia + (b ? tb ** 2 * b.inverseInertia : 0);
    const limit = normalImpulse * 0.55;
    apply(Math.max(-limit, Math.min(limit, -frictionSpeed / tangentMass)), tangent.x, tangent.y);
  }

  boundaries(body) {
    if (Number.isFinite(this.top) && body.y - body.radius > this.top) body.contained = true;
    for (const point of this.segment(body)) {
      if (body.contained && point.y - body.radius < this.top) {
        body.y += (this.top + body.radius - point.y) * 0.65;
        this.impulse(body, null, { x: point.x, y: this.top }, 0, -1);
      }
      if (point.y + body.radius > this.floor) {
        body.landed = true;
        body.y -= (point.y + body.radius - this.floor) * 0.65;
        this.impulse(body, null, { x: point.x, y: this.floor }, 0, 1);
      }
      if (point.x - body.radius < 0) {
        body.x += (body.radius - point.x) * 0.65;
        this.impulse(body, null, { x: 0, y: point.y }, -1, 0);
      }
      if (point.x + body.radius > this.width) {
        body.x -= (point.x + body.radius - this.width) * 0.65;
        this.impulse(body, null, { x: this.width, y: point.y }, 1, 0);
      }
    }
  }

  step(dt) {
    this.time += dt;
    for (const body of this.bodies) {
      if (this.time < body.release) continue;
      body.active = true;
      if (!body.turned && body.y > body.startY + (this.floor - body.startY) / 3) {
        body.spin = body.initialSpin;
        body.turned = true;
      }
      if (body.grab) {
        const c = Math.cos(body.angle),
          sn = Math.sin(body.angle);
        const rx = body.grab.localX * c - body.grab.localY * sn;
        const ry = body.grab.localX * sn + body.grab.localY * c;
        let fx = (body.grab.x - body.x - rx) * 95 - (body.vx - body.spin * ry) * 17;
        let fy = (body.grab.y - body.y - ry) * 95 - (body.vy + body.spin * rx) * 17;
        const limit = Math.max(1, Math.hypot(fx, fy) / 7000);
        fx /= limit;
        fy /= limit;
        body.vx += fx * dt;
        body.vy += fy * dt;
        body.spin += (rx * fy - ry * fx) * body.inverseInertia * dt;
        body.spin = Math.max(-7, Math.min(7, body.spin));
      }
      body.vy += this.gravity * dt;
      body.vx *= Math.exp(-0.14 * dt);
      body.spin *= Math.exp(-0.35 * dt);
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.angle += body.spin * dt;
    }
    for (let iteration = 0; iteration < 10; iteration += 1) {
      for (const body of this.bodies) if (body.active) this.boundaries(body);
      for (let i = 0; i < this.bodies.length; i += 1) {
        const a = this.bodies[i];
        if (!a.active) continue;
        for (let j = i + 1; j < this.bodies.length; j += 1) {
          const b = this.bodies[j];
          if (!b.active) continue;
          const [p, q] = this.closest(a, b);
          const dx = q.x - p.x,
            dy = q.y - p.y;
          const distance = Math.hypot(dx, dy);
          const overlap = a.radius + b.radius - distance;
          if (overlap <= 0) continue;
          if (a.landed || b.landed) {
            a.landed = true;
            b.landed = true;
          }
          const nx = distance > 0.001 ? dx / distance : 0;
          const ny = distance > 0.001 ? dy / distance : 1;
          const correction = Math.max(0, overlap - 0.15) * 0.38;
          a.x -= nx * correction;
          a.y -= ny * correction;
          b.x += nx * correction;
          b.y += ny * correction;
          this.impulse(a, b, { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, nx, ny);
        }
      }
    }
  }
}
if (typeof module !== 'undefined') module.exports = PillPhysics;
