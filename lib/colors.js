'use strict';

module.exports = function (Terminal) {

  // Colors 0-15
  Terminal.colors = [
  // dark:
  '#003540', '#DA3435', '#7FC682', '#B4881D', '#2E8CCF', '#D13A82', '#329198', '#eee8d6',
  // bright:
  '#037899', '#F73550', '#63ED99', '#BF8F3D', '#21A1D0', '#E86AA0', '#00BDAE', '#FDF6E4'];

  // Colors 16-255
  // Much thanks to TooTallNate for writing this.
  Terminal.colors = (function() {
    var colors = Terminal.colors,
      r = [0x00, 0x5f, 0x87, 0xaf, 0xd7, 0xff],
      i;

    // 16-231
    i = 0;
    for (; i < 216; i++) {
      out(r[(i / 36) % 6 | 0], r[(i / 6) % 6 | 0], r[i % 6]);
    }

    // 232-255 (grey)
    i = 0;
    for (; i < 24; i++) {
      r = 8 + i * 10;
      out(r, r, r);
    }

    function out(r, g, b) {
      colors.push('#' + hex(r) + hex(g) + hex(b));
    }

    function hex(c) {
      c = c.toString(16);
      return c.length < 2 ? '0' + c : c;
    }

    return colors;
  })();

  // Default BG/FG
  Terminal.defaultColors = {
    bg: '#002833',
    fg: '#ACCCCD'
  };

  Terminal.colors[256] = Terminal.defaultColors.bg;
  Terminal.colors[257] = Terminal.defaultColors.fg;
};
