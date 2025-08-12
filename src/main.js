'use strict';

/**
 * A ring buffer implementation with fixed size using FIFO (First In, First Out) behavior
 *
 * The buffer overwrites oldest values when full and keeps track of valid elements count.
 * Provides array-like access to elements with index 0 being the oldest element.
 */
class RingFIFO {
  /**
   * Creates a new ring buffer with specified size
   * @param {number} size - Maximum number of elements the buffer can hold
   */
  constructor(size) {
    this.size = size;
    this.__buffer = new Array(size);
    this.__buffer.fill(0);
    this.__head = 0;
    this.__count = 0;
  }

  /**
   * Adds a value to the buffer, overwriting oldest value if buffer is full
   * @param {*} val - Value to add to the buffer
   */
  push(val) {
    this.__buffer[this.__head] = val;
    this.__head = (this.__head + 1) % this.size;
    if (this.__count < this.size) {
      this.__count++;
    }
  }

  /**
   * Gets value at specified index relative to the oldest element
   *
   * Edge cases:
   * - Returns 0 for out-of-bounds indices
   * - Index 0 is the oldest element, index (length-1) is the newest
   *
   * @param {number} index - Index of element to retrieve (0-based)
   * @returns {*} Value at the index or 0 if index is out of bounds
   */
  get(index) {
    if (index < 0 || index >= this.__count) {
      return 0;
    }

    let start = (this.__head - this.__count + this.size) % this.size;
    return this.__buffer[(start + index) % this.size];
  }

  /**
   * Gets the current number of elements in the buffer
   * @returns {number} Number of valid elements in the buffer
   */
  get length() {
    return this.__count;
  }
}

/**
 * A widget that displays a real-time FPS (Frames Per Second) graph using Canvas
 *
 * Features:
 * - Shows current FPS as text
 * - Displays a line graph of FPS history
 * - Uses averaging to smooth FPS display
 * - Toggleable visibility
 */
class FPSWidget {
  /**
   * Creates and initializes an FPS widget
   *
   * @param {number} width - Width of the widget in pixels
   * @param {number} height - Height of the widget in pixels
   * @param {number} graphSize - Number of data points to show in the graph
   */
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

  /**
   * Toggles the visibility of the FPS widget
   *
   * Side effects:
   * - When enabled, starts the animation loop and resets counters
   * - When disabled, stops the animation loop
   */
  toggle() {
    if (this.enabled) {
      this.widget.classList.remove('enabled');
      this.enabled = false;
    } else {
      this.widget.classList.add('enabled');
      this.enabled = true;
      this.lastTime = performance.now();
      this.frameCount = 0;
      this.frameHistory = [];
      this.loop();
    }
  }

  /**
   * Calculates current FPS based on frame count and elapsed time
   *
   * Uses a rolling average of the last 5 measurements to smooth out fluctuations.
   * Updates occur approximately every 100ms.
   *
   * @param {number} currentTime - Current timestamp from requestAnimationFrame
   */
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

  /**
   * Animation loop that calculates FPS and draws the widget when enabled
   *
   * Uses requestAnimationFrame for optimal performance and synchronization
   * with the browser's rendering cycle.
   */
  loop() {
    if (this.enabled) {
      window.requestAnimationFrame(currentTime => {
        this.calcFPS(currentTime);
        this.draw();
        this.loop();
      });
    }
  }

  /**
   * Renders the FPS graph and current FPS value on the canvas
   *
   * The graph shows historical FPS values with the newest values on the right.
   * FPS is scaled relative to a maximum value of 60 FPS.
   */
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

/**
 * Self-executing function that initializes the FPS widget and sets up
 * a message listener for browser extension communication
 *
 * The widget is toggled on/off when receiving a 'clicked_browser_action' message
 */
(function () {
  let fps = new FPSWidget(120, 80, 30);

  browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === 'clicked_browser_action') {
      fps.toggle();
    }
  });
})();
