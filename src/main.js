'use strict';

class RingFIFO {
  constructor(size) {
    this.size = size;
    this.__buffer = new Array(size);
    this.__buffer.fill(0);
    this.__head = 0;
    this.__count = 0;
  }

  push(val) {
    this.__buffer[this.__head] = val;
    this.__head = (this.__head + 1) % this.size;
    if (this.__count < this.size) {
      this.__count++;
    }
  }

  get(index) {
    if (index < 0 || index >= this.__count) {
      return 0;
    }

    let start = (this.__head - this.__count + this.size) % this.size;
    return this.__buffer[(start + index) % this.size];
  }

  get length() {
    return this.__count;
  }
}

class FPSWidget {
  constructor(width, height, graphSize) {
    this.widget = document.createElement('canvas');
    this.widget.classList.add('fps-widget');
    this.enabled = false;
    this.context = this.widget.getContext('2d');
    this.widget.width = width;
    this.widget.height = height;
    this.width = width;
    this.height = height;
    this.kx = width / graphSize;

    this.context.strokeStyle = '#000000';
    this.context.fillStyle = '#000000';
    this.context.lineWidth = 1;
    let fontSize = Math.floor(this.height / 3.5);
    this.context.font = 'bold ' + fontSize + 'px serif';
    this.context.textAlign = 'center';

    this.stack = new RingFIFO(graphSize);
    this.frameCount = 0;
    this.lastTime = 0;
    this.frameHistory = [];

    document.body.appendChild(this.widget);
  }

  toggle() {
    if (this.enabled) {
      this.widget.classList.remove('enabled');
      this.enabled = false;
      console.log('fps widget disabled');
    } else {
      this.widget.classList.add('enabled');
      this.enabled = true;
      console.log('fps widget enabled');
      this.lastTime = performance.now();
      this.frameCount = 0;
      this.frameHistory = [];
      this.loop();
    }
  }

  calcFPS(currentTime) {
    this.frameCount++;

    let deltaTime = currentTime - this.lastTime;

    if (deltaTime >= 100) {
      let fps = Math.round((this.frameCount * 1000) / deltaTime);

      this.frameHistory.push(fps);
      if (this.frameHistory.length > 5) {
        this.frameHistory.shift();
      }

      let avgFPS = Math.round(
        this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length
      );

      this.stack.push(avgFPS);

      this.lastTime = currentTime;
      this.frameCount = 0;
    }
  }

  loop() {
    if (this.enabled) {
      window.requestAnimationFrame(currentTime => {
        this.calcFPS(currentTime);
        this.draw();
        this.loop();
      });
    }
  }

  draw() {
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.width, this.height);

    this.context.strokeStyle = 'black';
    this.context.fillStyle = 'black';
    this.context.beginPath();

    let bufferLength = this.stack.length;
    let maxFPS = 60;

    if (bufferLength > 0) {
      for (let i = 0; i < bufferLength; i++) {
        let x = i * this.kx;
        let fps = this.stack.get(i);
        let y = this.height - (fps / maxFPS) * this.height * 0.8;

        if (i === 0) {
          this.context.moveTo(x, y);
        } else {
          this.context.lineTo(x, y);
        }
      }
      this.context.stroke();

      let currentFPS = this.stack.get(bufferLength - 1);
      this.context.fillText(currentFPS + ' fps', this.width / 2, this.height - 10);
    }
  }
}

(function () {
  let fps = new FPSWidget(120, 80, 30);

  browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === 'clicked_browser_action') {
      fps.toggle();
    }
  });
})();
