export class InputManager {
  keymap = {};
  justPressed = {};
  constructor() {
    document.addEventListener('keydown', (evt) => {
      if (!this.keymap[evt.code]) {
        this.justPressed[evt.code] = true;
      }
      this.keymap[evt.code] = true;
    });
    document.addEventListener('keyup', (evt) => {
      this.keymap[evt.code] = false;
    });
  }

  update() {
    for (let key in this.justPressed) {
      this.justPressed[key] = false;
    }
  }

  isButtonPressed(code) {
    return this.keymap[code] === true;
  }

  wasButtonJustPressed(code) {
    return this.justPressed[code] === true;
  }
}