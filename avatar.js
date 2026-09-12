/*
  Procedural animated avatar.

  This is the renderer/integration layer. Motion names are intentionally
  separate from the recognition model so a validated ISL motion dataset can
  later replace the motion definitions without changing the UI.

  The current starter motions are generic animation placeholders.
  They must not be treated as validated ISL biomechanics.
*/

class SignAvatar {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.gender = "boy";
    this.current = null;
    this.queue = [];
    this.startedAt = 0;
    this.timer = null;
    this.render = this.render.bind(this);
    requestAnimationFrame(this.render);
  }

  setGender(gender) {
    this.gender = gender === "girl" ? "girl" : "boy";
  }

  play(sequence) {
    this.queue = Array.isArray(sequence) ? sequence.slice() : [];
    this.current = null;
    this.startedAt = performance.now();
    if (!this.timer) {
      this.timer = setInterval(() => this.next(), 1300);
    }
    this.next();
  }

  next() {
    if (!this.queue.length) {
      this.current = null;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      return;
    }
    this.current = this.queue.shift();
    this.startedAt = performance.now();
  }

  render(now) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#eef4ff";
    ctx.fillRect(0, 0, w, h);

    // Head
    ctx.fillStyle = "#c98f68";
    ctx.beginPath();
    ctx.arc(260, 115, 55, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = "#20242b";
    ctx.beginPath();
    ctx.arc(260, 93, 58, Math.PI, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = "#1769e0";
    ctx.fillRect(195, 170, 130, 190);

    // Legs
    ctx.strokeStyle = "#303846";
    ctx.lineWidth = 30;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(235, 360);
    ctx.lineTo(215, 465);
    ctx.moveTo(285, 360);
    ctx.lineTo(305, 465);
    ctx.stroke();

    // Arms and animated hands
    const t = (now - this.startedAt) / 1000;
    const sign = this.current || "IDLE";
    const phase = Math.sin(t * 5);

    const motion = this.motionFor(sign, phase);

    ctx.strokeStyle = "#c98f68";
    ctx.lineWidth = 22;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(205, 195);
    ctx.lineTo(motion.left.x, motion.left.y);
    ctx.moveTo(315, 195);
    ctx.lineTo(motion.right.x, motion.right.y);
    ctx.stroke();

    ctx.fillStyle = "#c98f68";
    ctx.beginPath();
    ctx.arc(motion.left.x, motion.left.y, 17, 0, Math.PI * 2);
    ctx.arc(motion.right.x, motion.right.y, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#172033";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(this.gender === "girl" ? "ISL SIGNER • GIRL" : "ISL SIGNER • BOY", 260, 500);

    ctx.font = "bold 20px Arial";
    ctx.fillText(sign === "IDLE" ? "Waiting…" : sign, 260, 35);

    requestAnimationFrame(this.render);
  }

  motionFor(sign, phase) {
    const p = Math.sin(phase);
    const table = {
      HELLO:        { left: {x:155,y:185}, right:{x:355,y:125 + p*20} },
      THANK_YOU:    { left: {x:190,y:205}, right:{x:330,y:150 + p*18} },
      PLEASE:       { left: {x:190,y:240}, right:{x:335,y:240 + p*22} },
      YES:          { left: {x:170,y:245}, right:{x:350,y:245 + p*28} },
      NO:           { left: {x:180,y:155}, right:{x:340,y:155 + p*30} },
      HELP:         { left: {x:170,y:205}, right:{x:350,y:205 + p*25} },
      HOW:          { left: {x:175,y:225 + p*20}, right:{x:345,y:225 - p*20} },
      YOU:          { left: {x:165,y:160}, right:{x:370,y:160 + p*10} },
      FINE:         { left: {x:175,y:185}, right:{x:345,y:185} }
    };
    return table[sign] || {
      left: {x:180 + p*20, y:205 + p*15},
      right:{x:340 - p*20, y:205 - p*15}
    };
  }
}

window.SignAvatar = SignAvatar;
