
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("terminal/terminal.js", function(exports, require, module){
'use strict';

var states = require('./lib/states');

module.exports = Terminal;

function Terminal(opts) {
  opts = opts || {};
  if (!(this instanceof Terminal)) return new Terminal(opts);

  this.cols = opts.cols || 500;
  this.rows = opts.rows || 10;

  this.ybase = 0;
  this.ydisp = 0;
  this.x = 0;
  this.y = 0;
  this.cursorState = 0;
  this.cursorHidden = false;
  this.convertEol = false;
  this.state = states.normal;
  this.queue = '';
  this.scrollTop = 0;
  this.scrollBottom = this.rows - 1;

  // modes
  this.applicationKeypad = false;
  this.originMode = false;
  this.insertMode = false;
  this.wraparoundMode = false;
  this.normal = null;

  // charset
  this.charset = null;
  this.gcharset = null;
  this.glevel = 0;
  this.charsets = [null];

  // misc
  this.el;
  this.children;
  this.refreshStart;
  this.refreshEnd;
  this.savedX;
  this.savedY;
  this.savedCols;

  // stream
  this.readable = true;
  this.writable = true;

  this.defAttr = (257 << 9) | 256;
  this.curAttr = this.defAttr;

  this.params = [];
  this.currentParam = 0;
  this.prefix = '';
  this.postfix = '';

  this.lines = [];
  var i = this.rows;
  while (i--) {
      this.lines.push(this.blankLine());
  }

  this.tabs;
  this.setupStops();

  // open immediately
  this.open();
}

require('./lib/colors')(Terminal);
require('./lib/options')(Terminal);

require('./lib/open')(Terminal);
require('./lib/destroy')(Terminal);
require('./lib/refresh')(Terminal);

require('./lib/write')(Terminal);

require('./lib/setgLevel');
require('./lib/setgCharset');

require('./lib/debug')(Terminal);

require('./lib/stops')(Terminal);

require('./lib/erase')(Terminal);
require('./lib/blankLine')(Terminal);
require('./lib/range')(Terminal);
require('./lib/util')(Terminal);

require('./lib/esc/index.js')(Terminal);
require('./lib/esc/reset.js')(Terminal);
require('./lib/esc/tabSet.js')(Terminal);

require('./lib/csi/charAttributes')(Terminal);
require('./lib/csi/insert-delete')(Terminal);
require('./lib/csi/position')(Terminal);
require('./lib/csi/cursor')(Terminal);
require('./lib/csi/repeatPrecedingCharacter')(Terminal);
require('./lib/csi/tabClear')(Terminal);
require('./lib/csi/softReset')(Terminal);

require('./lib/charsets.js')(Terminal);

});
require.register("terminal/lib/states.js", function(exports, require, module){
'use strict';

module.exports = {
    normal  :  0
  , escaped :  1
  , csi     :  2
  , osc     :  3
  , charset :  4
  , dcs     :  5
  , ignore  :  6
};

});
require.register("terminal/lib/colors.js", function(exports, require, module){
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

});
require.register("terminal/lib/options.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  Terminal.termName        =  'xterm';
  Terminal.geometry        =  [80, 24];
  Terminal.cursorBlink     =  true;
  Terminal.visualBell      =  false;
  Terminal.popOnBell       =  false;
  Terminal.scrollback      =  1000;
  Terminal.screenKeys      =  false;
  Terminal.programFeatures =  false;
  Terminal.debug           =  false;
};

});
require.register("terminal/lib/open.js", function(exports, require, module){
'use strict';

// if bold is broken, we can't
// use it in the terminal.
function isBoldBroken() {
    var el = document.createElement('span');
    el.innerHTML = 'hello world';
    document.body.appendChild(el);
    var w1 = el.scrollWidth;
    el.style.fontWeight = 'bold';
    var w2 = el.scrollWidth;
    document.body.removeChild(el);
    return w1 !== w2;
}

module.exports = function (Terminal) {
  /**
  * Open Terminal
  */

  Terminal.prototype.open = function() {
    var self = this,
      i = 0,
      div;

    this.el = document.createElement('div');
    this.el.className = 'terminal';
    this.children = [];

    for (; i < this.rows; i++) {
      div = document.createElement('div');
      this.el.appendChild(div);
      this.children.push(div);
    }

    this.refresh(0, this.rows - 1);

    // XXX - hack, move this somewhere else.
    if (Terminal.brokenBold === null) {
      Terminal.brokenBold = isBoldBroken();
    }

    // sync default bg/fg colors
    this.el.style.backgroundColor = Terminal.defaultColors.bg;
    this.el.style.color = Terminal.defaultColors.fg;
  };
};

});
require.register("terminal/lib/destroy.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) { 
  Terminal.prototype.destroy = function() {
    this.readable = false;
    this.writable = false;
    this._events = {};
    this.handler = function() {};
    this.write = function() {};
  };
};

});
require.register("terminal/lib/refresh.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {

  /**
  * Rendering Engine
  */

  // In the screen buffer, each character
  // is stored as a an array with a character
  // and a 32-bit integer.
  // First value: a utf-16 character.
  // Second value:
  // Next 9 bits: background color (0-511).
  // Next 9 bits: foreground color (0-511).
  // Next 14 bits: a mask for misc. flags:
  // 1=bold, 2=underline, 4=inverse

  Terminal.prototype.refresh = function(start, end) {
    var x, y, i, line, out, ch, width, data, attr, fgColor, bgColor, flags, row, parent;


    width = this.cols;
    y = start;

    for (; y <= end; y++) {
      row = y + this.ydisp;

      line = this.lines[row];
      if (!line) {
        // simple solution in case we have more lines than rows
        // could be improved to instead remove first line (and related html element)
        return this.reset();
      }

      out = '';

      if (y === this.y && this.cursorState && this.ydisp === this.ybase && !this.cursorHidden) {
        x = this.x;
      } else {
        x = -1;
      }

      attr = this.defAttr;
      i = 0;

      for (; i < width; i++) {
        data = line[i][0];
        ch = line[i][1];

        if (i === x) data = -1;

        if (data !== attr) {
          if (attr !== this.defAttr) {
            out += '</span>';
          }
          if (data !== this.defAttr) {
            if (data === -1) {
              out += '<span class="reverse-video">';
            } else {
              out += '<span style="';

              bgColor = data & 0x1ff;
              fgColor = (data >> 9) & 0x1ff;
              flags = data >> 18;

              if (flags & 1) {
                if (!Terminal.brokenBold) {
                  out += 'font-weight:bold;';
                }
                // see: XTerm*boldColors
                if (fgColor < 8) fgColor += 8;
              }

              if (flags & 2) {
                out += 'text-decoration:underline;';
              }

              if (bgColor !== 256) {
                out += 'background-color:' + Terminal.colors[bgColor] + ';';
              }

              if (fgColor !== 257) {
                out += 'color:' + Terminal.colors[fgColor] + ';';
              }

              out += '">';
            }
          }
        }

        switch (ch) {
        case '&':
          out += '&';
          break;
        case '<':
          out += '<';
          break;
        case '>':
          out += '>';
          break;
        default:
          if (ch <= ' ') {
            out += ' ';
          } else {
            out += ch;
          }
          break;
        }

        attr = data;
      }

      if (attr !== this.defAttr) {
        out += '</span>';
      }

      this.children[y].innerHTML = out;
    }

    if (parent) parent.appendChild(this.element);
  };
};

});
require.register("terminal/lib/write.js", function(exports, require, module){
'use strict';

var states = require('./states');

function fixLinefeed(data) {
  return data.replace(/([^\r])\n/g, '$1\r\n');
}

function fixIndent(data) {
  if (!/(^|\n) /.test(data)) return data;

  // not very efficient, but works and would only become a problem
  // once we render huge amounts of data
  return data
    .split('\n')
    .map(function (line) {
      var count = 0;
      while(line.charAt(0) === ' '){
        line = line.slice(1);
        count++;
      }
      while(count--) {
        line = '&nbsp;' + line;
      }
      return line;
    })
    .join('\r\n');
}

module.exports = function(Terminal) {

  Terminal.prototype.write = function(data) {

    data = fixLinefeed(data);
    data = fixIndent(data);

    var l = data.length,
      i = 0,
      cs, ch;

    this.refreshStart = this.y;
    this.refreshEnd = this.y;

    if (this.ybase !== this.ydisp) {
      this.ydisp = this.ybase;
      this.maxRange();
    }

    // this.log(JSON.stringify(data.replace(/\x1b/g, '^[')));

    for (; i < l; i++) {
      ch = data[i];
      switch (this.state) {
      case states.normal:
        switch (ch) {
          // '\0'
          // case '\0':
          // break;

          // '\a'
        case '\x07':
          this.bell();
          break;

          // '\n', '\v', '\f'
        case '\n':
        case '\x0b':
        case '\x0c':
          if (this.convertEol) {
            this.x = 0;
          }
          this.y++;
          break;

          // '\r'
        case '\r':
          this.x = 0;
          break;

          // '\b'
        case '\x08':
          if (this.x > 0) {
            this.x--;
          }
          break;

          // '\t'
        case '\t':
          this.x = this.nextStop();
          break;

          // shift out
        case '\x0e':
          this.setgLevel(1);
          break;

          // shift in
        case '\x0f':
          this.setgLevel(0);
          break;

          // '\e'
        case '\x1b':
          this.state = states.escaped;
          break;

        default:
          // ' '
          if (ch >= ' ') {
            if (this.charset && this.charset[ch]) {
              ch = this.charset[ch];
            }
            if (this.x >= this.cols) {
              this.x = 0;
              this.y++;
            }

            // FIXME: this prevents errors from being thrown, but needs a proper fix
            if (this.lines[this.y + this.ybase])
              this.lines[this.y + this.ybase][this.x] = [this.curAttr, ch];

            this.x++;
            this.updateRange(this.y);
          }
          break;
        }
        break;
      case states.escaped:
        switch (ch) {
          // ESC [ Control Sequence Introducer ( CSI is 0x9b).
        case '[':
          this.params = [];
          this.currentParam = 0;
          this.state = states.csi;
          break;

          // ESC ] Operating System Command ( OSC is 0x9d).
        case ']':
          this.params = [];
          this.currentParam = 0;
          this.state = states.osc;
          break;

          // ESC P Device Control String ( DCS is 0x90).
        case 'P':
          this.params = [];
          this.currentParam = 0;
          this.state = states.dcs;
          break;

          // ESC _ Application Program Command ( APC is 0x9f).
        case '_':
          this.stateType = 'apc';
          this.state = states.ignore;
          break;

          // ESC ^ Privacy Message ( PM is 0x9e).
        case '^':
          this.stateType = 'pm';
          this.state = states.ignore;
          break;

          // ESC c Full Reset (RIS).
        case 'c':
          this.reset();
          break;

          // ESC E Next Line ( NEL is 0x85).
          // ESC D Index ( IND is 0x84).
        case 'E':
          this.x = 0;
          break;
        case 'D':
          this.index();
          break;

          // ESC M Reverse Index ( RI is 0x8d).
        case 'M':
          this.reverseIndex();
          break;

          // ESC % Select default/utf-8 character set.
          // @ = default, G = utf-8
        case '%':
          //this.charset = null;
          this.setgLevel(0);
          this.setgCharset(0, Terminal.charsets.US);
          this.state = states.normal;
          i++;
          break;

          // ESC (,),*,+,-,. Designate G0-G2 Character Set.
        case '(':
          // <-- this seems to get all the attention
        case ')':
        case '*':
        case '+':
        case '-':
        case '.':
          switch (ch) {
          case '(':
            this.gcharset = 0;
            break;
          case ')':
            this.gcharset = 1;
            break;
          case '*':
            this.gcharset = 2;
            break;
          case '+':
            this.gcharset = 3;
            break;
          case '-':
            this.gcharset = 1;
            break;
          case '.':
            this.gcharset = 2;
            break;
          }
          this.state = states.charset;
          break;

          // Designate G3 Character Set (VT300).
          // A = ISO Latin-1 Supplemental.
          // Not implemented.
        case '/':
          this.gcharset = 3;
          this.state = states.charset;
          i--;
          break;

          // ESC N
          // Single Shift Select of G2 Character Set
          // ( SS2 is 0x8e). This affects next character only.
        case 'N':
          break;
          // ESC O
          // Single Shift Select of G3 Character Set
          // ( SS3 is 0x8f). This affects next character only.
        case 'O':
          break;
          // ESC n
          // Invoke the G2 Character Set as GL (LS2).
        case 'n':
          this.setgLevel(2);
          break;
          // ESC o
          // Invoke the G3 Character Set as GL (LS3).
        case 'o':
          this.setgLevel(3);
          break;
          // ESC |
          // Invoke the G3 Character Set as GR (LS3R).
        case '|':
          this.setgLevel(3);
          break;
          // ESC }
          // Invoke the G2 Character Set as GR (LS2R).
        case '}':
          this.setgLevel(2);
          break;
          // ESC ~
          // Invoke the G1 Character Set as GR (LS1R).
        case '~':
          this.setgLevel(1);
          break;

          // ESC 7 Save Cursor (DECSC).
        case '7':
          this.saveCursor();
          this.state = states.normal;
          break;

          // ESC 8 Restore Cursor (DECRC).
        case '8':
          this.restoreCursor();
          this.state = states.normal;
          break;

          // ESC # 3 DEC line height/width
        case '#':
          this.state = states.normal;
          i++;
          break;

          // ESC H Tab Set (HTS is 0x88).
        case 'H':
          this.tabSet();
          break;

          // ESC = Application Keypad (DECPAM).
        case '=':
          this.log('Serial port requested application keypad.');
          this.applicationKeypad = true;
          this.state = states.normal;
          break;

          // ESC > Normal Keypad (DECPNM).
        case '>':
          this.log('Switching back to normal keypad.');
          this.applicationKeypad = false;
          this.state = states.normal;
          break;

        default:
          this.state = states.normal;
          this.error('Unknown ESC control: %s.', ch);
          break;
        }
        break;

      case states.charset:
        switch (ch) {
        case '0':
          // DEC Special Character and Line Drawing Set.
          cs = Terminal.charsets.SCLD;
          break;
        case 'A':
          // UK
          cs = Terminal.charsets.UK;
          break;
        case 'B':
          // United States (USASCII).
          cs = Terminal.charsets.US;
          break;
        case '4':
          // Dutch
          cs = Terminal.charsets.Dutch;
          break;
        case 'C':
          // Finnish
        case '5':
          cs = Terminal.charsets.Finnish;
          break;
        case 'R':
          // French
          cs = Terminal.charsets.French;
          break;
        case 'Q':
          // FrenchCanadian
          cs = Terminal.charsets.FrenchCanadian;
          break;
        case 'K':
          // German
          cs = Terminal.charsets.German;
          break;
        case 'Y':
          // Italian
          cs = Terminal.charsets.Italian;
          break;
        case 'E':
          // NorwegianDanish
        case '6':
          cs = Terminal.charsets.NorwegianDanish;
          break;
        case 'Z':
          // Spanish
          cs = Terminal.charsets.Spanish;
          break;
        case 'H':
          // Swedish
        case '7':
          cs = Terminal.charsets.Swedish;
          break;
        case '=':
          // Swiss
          cs = Terminal.charsets.Swiss;
          break;
        case '/':
          // ISOLatin (actually /A)
          cs = Terminal.charsets.ISOLatin;
          i++;
          break;
        default:
          // Default
          cs = Terminal.charsets.US;
          break;
        }
        this.setgCharset(this.gcharset, cs);
        this.gcharset = null;
        this.state = states.normal;
        break;

      case states.osc:
        // OSC Ps ; Pt ST
        // OSC Ps ; Pt BEL
        // Set Text Parameters.
        if (ch === '\x1b' || ch === '\x07') {
          if (ch === '\x1b') i++;

          this.params.push(this.currentParam);

          switch (this.params[0]) {
          case 0:
          case 1:
          case 2:
            if (this.params[1]) {
              this.title = this.params[1];
              this.handleTitle(this.title);
            }
            break;
          case 3:
            // set X property
            break;
          case 4:
          case 5:
            // change dynamic colors
            break;
          case 10:
          case 11:
          case 12:
          case 13:
          case 14:
          case 15:
          case 16:
          case 17:
          case 18:
          case 19:
            // change dynamic ui colors
            break;
          case 46:
            // change log file
            break;
          case 50:
            // dynamic font
            break;
          case 51:
            // emacs shell
            break;
          case 52:
            // manipulate selection data
            break;
          case 104:
          case 105:
          case 110:
          case 111:
          case 112:
          case 113:
          case 114:
          case 115:
          case 116:
          case 117:
          case 118:
            // reset colors
            break;
          }

          this.params = [];
          this.currentParam = 0;
          this.state = states.normal;
        } else {
          if (!this.params.length) {
            if (ch >= '0' && ch <= '9') {
              this.currentParam = this.currentParam * 10 + ch.charCodeAt(0) - 48;
            } else if (ch === ';') {
              this.params.push(this.currentParam);
              this.currentParam = '';
            }
          } else {
            this.currentParam += ch;
          }
        }
        break;

      case states.csi:
        // '?', '>', '!'
        if (ch === '?' || ch === '>' || ch === '!') {
          this.prefix = ch;
          break;
        }

        // 0 - 9
        if (ch >= '0' && ch <= '9') {
          this.currentParam = this.currentParam * 10 + ch.charCodeAt(0) - 48;
          break;
        }

        // '$', '"', ' ', '\''
        if (ch === '$' || ch === '"' || ch === ' ' || ch === '\'') {
          this.postfix = ch;
          break;
        }

        this.params.push(this.currentParam);
        this.currentParam = 0;

        // ';'
        if (ch === ';') break;

        this.state = states.normal;

        switch (ch) {
          // CSI Ps A
          // Cursor Up Ps Times (default = 1) (CUU).
        case 'A':
          this.cursorUp(this.params);
          break;

          // CSI Ps B
          // Cursor Down Ps Times (default = 1) (CUD).
        case 'B':
          this.cursorDown(this.params);
          break;

          // CSI Ps C
          // Cursor Forward Ps Times (default = 1) (CUF).
        case 'C':
          this.cursorForward(this.params);
          break;

          // CSI Ps D
          // Cursor Backward Ps Times (default = 1) (CUB).
        case 'D':
          this.cursorBackward(this.params);
          break;

          // CSI Ps ; Ps H
          // Cursor Position [row;column] (default = [1,1]) (CUP).
        case 'H':
          this.cursorPos(this.params);
          break;

          // CSI Ps J Erase in Display (ED).
        case 'J':
          this.eraseInDisplay(this.params);
          break;

          // CSI Ps K Erase in Line (EL).
        case 'K':
          this.eraseInLine(this.params);
          break;

          // CSI Pm m Character Attributes (SGR).
        case 'm':
          this.charAttributes(this.params);
          break;

          // CSI Ps n Device Status Report (DSR).
        case 'n':
          this.deviceStatus(this.params);
          break;

          /**
          * Additions
          */

          // CSI Ps @
          // Insert Ps (Blank) Character(s) (default = 1) (ICH).
        case '@':
          this.insertChars(this.params);
          break;

          // CSI Ps E
          // Cursor Next Line Ps Times (default = 1) (CNL).
        case 'E':
          this.cursorNextLine(this.params);
          break;

          // CSI Ps F
          // Cursor Preceding Line Ps Times (default = 1) (CNL).
        case 'F':
          this.cursorPrecedingLine(this.params);
          break;

          // CSI Ps G
          // Cursor Character Absolute [column] (default = [row,1]) (CHA).
        case 'G':
          this.cursorCharAbsolute(this.params);
          break;

          // CSI Ps L
          // Insert Ps Line(s) (default = 1) (IL).
        case 'L':
          this.insertLines(this.params);
          break;

          // CSI Ps M
          // Delete Ps Line(s) (default = 1) (DL).
        case 'M':
          this.deleteLines(this.params);
          break;

          // CSI Ps P
          // Delete Ps Character(s) (default = 1) (DCH).
        case 'P':
          this.deleteChars(this.params);
          break;

          // CSI Ps X
          // Erase Ps Character(s) (default = 1) (ECH).
        case 'X':
          this.eraseChars(this.params);
          break;

          // CSI Pm ` Character Position Absolute
          // [column] (default = [row,1]) (HPA).
        case '`':
          this.charPosAbsolute(this.params);
          break;

          // 141 61 a * HPR -
          // Horizontal Position Relative
        case 'a':
          this.HPositionRelative(this.params);
          break;

          // CSI P s c
          // Send Device Attributes (Primary DA).
          // CSI > P s c
          // Send Device Attributes (Secondary DA)
        case 'c':
          //- this.sendDeviceAttributes(this.params);
          break;

          // CSI Pm d
          // Line Position Absolute [row] (default = [1,column]) (VPA).
        case 'd':
          this.linePosAbsolute(this.params);
          break;

          // 145 65 e * VPR - Vertical Position Relative
        case 'e':
          this.VPositionRelative(this.params);
          break;

          // CSI Ps ; Ps f
          // Horizontal and Vertical Position [row;column] (default =
          // [1,1]) (HVP).
        case 'f':
          this.HVPosition(this.params);
          break;

          // CSI Pm h Set Mode (SM).
          // CSI ? Pm h - mouse escape codes, cursor escape codes
        case 'h':
          //- this.setMode(this.params);
          break;

          // CSI Pm l Reset Mode (RM).
          // CSI ? Pm l
        case 'l':
          //- this.resetMode(this.params);
          break;

          // CSI Ps ; Ps r
          // Set Scrolling Region [top;bottom] (default = full size of win-
          // dow) (DECSTBM).
          // CSI ? Pm r
        case 'r':
          //- this.setScrollRegion(this.params);
          break;

          // CSI s
          // Save cursor (ANSI.SYS).
        case 's':
          this.saveCursor(this.params);
          break;

          // CSI u
          // Restore cursor (ANSI.SYS).
        case 'u':
          this.restoreCursor(this.params);
          break;

          /**
          * Lesser Used
          */

          // CSI Ps I
          // Cursor Forward Tabulation Ps tab stops (default = 1) (CHT).
        case 'I':
          this.cursorForwardTab(this.params);
          break;

          // CSI Ps S Scroll up Ps lines (default = 1) (SU).
        case 'S':
          //- this.scrollUp(this.params);
          break;

          // CSI Ps T Scroll down Ps lines (default = 1) (SD).
          // CSI Ps ; Ps ; Ps ; Ps ; Ps T
          // CSI > Ps; Ps T
        case 'T':
          if (this.params.length < 2 && !this.prefix) {
            //- this.scrollDown(this.params);
          }
          break;

          // CSI Ps Z
          // Cursor Backward Tabulation Ps tab stops (default = 1) (CBT).
        case 'Z':
          this.cursorBackwardTab(this.params);
          break;

          // CSI Ps b Repeat the preceding graphic character Ps times (REP).
        case 'b':
          this.repeatPrecedingCharacter(this.params);
          break;

          // CSI Ps g Tab Clear (TBC).
        case 'g':
          this.tabClear(this.params);
          break;
        case 'p':
          switch (this.prefix) {
          case '!':
            this.softReset(this.params);
            break;
          }
          break;

        default:
          this.error('Unknown CSI code: %s.', ch);
          break;
        }

        this.prefix = '';
        this.postfix = '';
        break;

      case states.dcs:
        if (ch === '\x1b' || ch === '\x07') {
          if (ch === '\x1b') i++;

          switch (this.prefix) {
            // User-Defined Keys (DECUDK).
          case '':
            break;

            // Request Status String (DECRQSS).
            // test: echo -e '\eP$q"p\e\\'
          case '$q':
            var pt = this.currentParam,
              valid = false;

            switch (pt) {
              // DECSCA
            case '"q':
              pt = '0"q';
              break;

              // DECSCL
            case '"p':
              pt = '61"p';
              break;

              // DECSTBM
            case 'r':
              pt = '' + (this.scrollTop + 1) + ';' + (this.scrollBottom + 1) + 'r';
              break;

              // SGR
            case 'm':
              pt = '0m';
              break;

            default:
              this.error('Unknown DCS Pt: %s.', pt);
              pt = '';
              break;
            }

            //- this.send('\x1bP' + valid + '$r' + pt + '\x1b\\');
            break;

            // Set Termcap/Terminfo Data (xterm, experimental).
          case '+p':
            break;

          default:
            this.error('Unknown DCS prefix: %s.', this.prefix);
            break;
          }

          this.currentParam = 0;
          this.prefix = '';
          this.state = states.normal;
        } else if (!this.currentParam) {
          if (!this.prefix && ch !== '$' && ch !== '+') {
            this.currentParam = ch;
          } else if (this.prefix.length === 2) {
            this.currentParam = ch;
          } else {
            this.prefix += ch;
          }
        } else {
          this.currentParam += ch;
        }
        break;

      case states.ignore:
        // For PM and APC.
        if (ch === '\x1b' || ch === '\x07') {
          if (ch === '\x1b') i++;
          this.stateData = '';
          this.state = states.normal;
        } else {
          if (!this.stateData) this.stateData = '';
          this.stateData += ch;
        }
        break;
      }
    }

    this.updateRange(this.y);
    this.refresh(this.refreshStart, this.refreshEnd);
  };

  Terminal.prototype.writeln = function(data) {
    // at times spaces appear in between escape chars and fixIndent fails us, so we fix it here
    data = data.replace(/ /g, '&nbsp;');
    // adding empty char before line break ensures that empty lines render properly
    this.write(data + ' \r\n');
  };
};

});
require.register("terminal/lib/setgLevel.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  Terminal.prototype.setgLevel = function(g) {
    this.glevel = g;
    this.charset = this.charsets[g];
  };
};

});
require.register("terminal/lib/setgCharset.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  Terminal.prototype.setgCharset = function(g, charset) {
    this.charsets[g] = charset;
    if (this.glevel === g) {
      this.charset = charset;
    }
  };
};

});
require.register("terminal/lib/debug.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  Terminal.prototype.log = function() {
    if (!Terminal.debug) return;
    if (!window.console || !window.console.log) return;
    var args = Array.prototype.slice.call(arguments);
    window.console.log.apply(window.console, args);
  };

  Terminal.prototype.error = function() {
    if (!Terminal.debug) return;
    if (!window.console || !window.console.error) return;
    var args = Array.prototype.slice.call(arguments);
    window.console.error.apply(window.console, args);
  };
};

});
require.register("terminal/lib/stops.js", function(exports, require, module){
'use strict';
// ignore warnings regarging == and != (coersion makes things work here appearently)

module.exports = function (Terminal) {
  
  Terminal.prototype.setupStops = function(i) {
      if (i != null) {
          if (!this.tabs[i]) {
              i = this.prevStop(i);
          }
      } else {
          this.tabs = {};
          i = 0;
      }

      for (; i < this.cols; i += 8) {
          this.tabs[i] = true;
      }
  };

  Terminal.prototype.prevStop = function(x) {
      if (x == null) x = this.x;
      while (!this.tabs[--x] && x > 0);
      return x >= this.cols ? this.cols - 1 : x < 0 ? 0 : x;
  };

  Terminal.prototype.nextStop = function(x) {
      if (x == null) x = this.x;
      while (!this.tabs[++x] && x < this.cols);
      return x >= this.cols ? this.cols - 1 : x < 0 ? 0 : x;
  };
};

});
require.register("terminal/lib/erase.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  Terminal.prototype.eraseRight = function(x, y) {
    var line = this.lines[this.ybase + y],
      ch = [this.curAttr, ' ']; // xterm

    for (; x < this.cols; x++) {
      line[x] = ch;
    }

    this.updateRange(y);
  };

  Terminal.prototype.eraseLeft = function(x, y) {
    var line = this.lines[this.ybase + y],
      ch = [this.curAttr, ' ']; // xterm

    x++;
    while (x--) line[x] = ch;

    this.updateRange(y);
  };

  Terminal.prototype.eraseLine = function(y) {
    this.eraseRight(0, y);
  };
  
  // CSI Ps J Erase in Display (ED).
  // Ps = 0 -> Erase Below (default).
  // Ps = 1 -> Erase Above.
  // Ps = 2 -> Erase All.
  // Ps = 3 -> Erase Saved Lines (xterm).
  // CSI ? Ps J
  // Erase in Display (DECSED).
  // Ps = 0 -> Selective Erase Below (default).
  // Ps = 1 -> Selective Erase Above.
  // Ps = 2 -> Selective Erase All.
  Terminal.prototype.eraseInDisplay = function(params) {
      var j;
      switch (params[0]) {
      case 0:
          this.eraseRight(this.x, this.y);
          j = this.y + 1;
          for (; j < this.rows; j++) {
              this.eraseLine(j);
          }
          break;
      case 1:
          this.eraseLeft(this.x, this.y);
          j = this.y;
          while (j--) {
              this.eraseLine(j);
          }
          break;
      case 2:
          j = this.rows;
          while (j--) this.eraseLine(j);
          break;
      case 3:
          ; // no saved lines
          break;
      }
  };

  // CSI Ps K Erase in Line (EL).
  // Ps = 0 -> Erase to Right (default).
  // Ps = 1 -> Erase to Left.
  // Ps = 2 -> Erase All.
  // CSI ? Ps K
  // Erase in Line (DECSEL).
  // Ps = 0 -> Selective Erase to Right (default).
  // Ps = 1 -> Selective Erase to Left.
  // Ps = 2 -> Selective Erase All.
  Terminal.prototype.eraseInLine = function(params) {
      switch (params[0]) {
      case 0:
          this.eraseRight(this.x, this.y);
          break;
      case 1:
          this.eraseLeft(this.x, this.y);
          break;
      case 2:
          this.eraseLine(this.y);
          break;
      }
  };
};

});
require.register("terminal/lib/blankLine.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  Terminal.prototype.blankLine = function(cur) {
    var attr = cur ? this.curAttr : this.defAttr;

    var ch = [attr, ' '],
      line = [],
      i = 0;

    for (; i < this.cols; i++) {
      line[i] = ch;
    }

    return line;
  };
};

});
require.register("terminal/lib/range.js", function(exports, require, module){
'use strict';

function addRowsOnDemand () {
  while (this.y >= this.rows) {
    this.lines.push(this.blankLine());
    var div = document.createElement('div');
    this.el.appendChild(div);
    this.children.push(div);

    this.rows++;
  }
}

module.exports = function (Terminal) {
  Terminal.prototype.updateRange = function(y) {
    if (y < this.refreshStart) this.refreshStart = y;
    if (y > this.refreshEnd) this.refreshEnd = y;
    addRowsOnDemand.bind(this)();
  };

  Terminal.prototype.maxRange = function() {
    this.refreshStart = 0;
    this.refreshEnd = this.rows - 1;
  };
};

});
require.register("terminal/lib/util.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  Terminal.prototype.ch = function(cur) {
    return cur ? [this.curAttr, ' '] : [this.defAttr, ' '];
  };

  Terminal.prototype.is = function(term) {
    var name = this.termName || Terminal.termName;
    return (name + '')
      .indexOf(term) === 0;
  };
};

});
require.register("terminal/lib/esc/index.js", function(exports, require, module){
'use strict';
var states = require('../states');

module.exports = function (Terminal) {
  // ESC D Index (IND is 0x84).
  Terminal.prototype.index = function() {
    this.y++;
    if (this.y > this.scrollBottom) {
      this.y--;
      this.scroll();
    }
    this.state = states.normal;
  };

  // ESC M Reverse Index (RI is 0x8d).
  Terminal.prototype.reverseIndex = function() {
    var j;
    this.y--;
    if (this.y < this.scrollTop) {
      this.y++;
      // possibly move the code below to term.reverseScroll();
      // test: echo -ne '\e[1;1H\e[44m\eM\e[0m'
      // blankLine(true) is xterm/linux behavior
      this.lines.splice(this.y + this.ybase, 0, this.blankLine(true));
      j = this.rows - 1 - this.scrollBottom;
      this.lines.splice(this.rows - 1 + this.ybase - j + 1, 1);
      // this.maxRange();
      this.updateRange(this.scrollTop);
      this.updateRange(this.scrollBottom);
    }
    this.state = states.normal;
  };
};

});
require.register("terminal/lib/esc/reset.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {

  // ESC c Full Reset (RIS).
  Terminal.prototype.reset = function() {
    Terminal.call(this, this.cols, this.rows);
    this.refresh(0, this.rows - 1);
  };
};

});
require.register("terminal/lib/esc/tabSet.js", function(exports, require, module){
'use strict';
var states = require('../states');

module.exports = function (Terminal) {

  // ESC H Tab Set (HTS is 0x88).
  Terminal.prototype.tabSet = function() {
    this.tabs[this.x] = true;
    this.state = states.normal;
  };
};

});
require.register("terminal/lib/csi/charAttributes.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {

  // CSI Pm m Character Attributes (SGR).
  // Ps = 0 -> Normal (default).
  // Ps = 1 -> Bold.
  // Ps = 4 -> Underlined.
  // Ps = 5 -> Blink (appears as Bold).
  // Ps = 7 -> Inverse.
  // Ps = 8 -> Invisible, i.e., hidden (VT300).
  // Ps = 2 2 -> Normal (neither bold nor faint).
  // Ps = 2 4 -> Not underlined.
  // Ps = 2 5 -> Steady (not blinking).
  // Ps = 2 7 -> Positive (not inverse).
  // Ps = 2 8 -> Visible, i.e., not hidden (VT300).
  // Ps = 3 0 -> Set foreground color to Black.
  // Ps = 3 1 -> Set foreground color to Red.
  // Ps = 3 2 -> Set foreground color to Green.
  // Ps = 3 3 -> Set foreground color to Yellow.
  // Ps = 3 4 -> Set foreground color to Blue.
  // Ps = 3 5 -> Set foreground color to Magenta.
  // Ps = 3 6 -> Set foreground color to Cyan.
  // Ps = 3 7 -> Set foreground color to White.
  // Ps = 3 9 -> Set foreground color to default (original).
  // Ps = 4 0 -> Set background color to Black.
  // Ps = 4 1 -> Set background color to Red.
  // Ps = 4 2 -> Set background color to Green.
  // Ps = 4 3 -> Set background color to Yellow.
  // Ps = 4 4 -> Set background color to Blue.
  // Ps = 4 5 -> Set background color to Magenta.
  // Ps = 4 6 -> Set background color to Cyan.
  // Ps = 4 7 -> Set background color to White.
  // Ps = 4 9 -> Set background color to default (original).

  // If 16-color support is compiled, the following apply. Assume
  // that xterm's resources are set so that the ISO color codes are
  // the first 8 of a set of 16. Then the aixterm colors are the
  // bright versions of the ISO colors:
  // Ps = 9 0 -> Set foreground color to Black.
  // Ps = 9 1 -> Set foreground color to Red.
  // Ps = 9 2 -> Set foreground color to Green.
  // Ps = 9 3 -> Set foreground color to Yellow.
  // Ps = 9 4 -> Set foreground color to Blue.
  // Ps = 9 5 -> Set foreground color to Magenta.
  // Ps = 9 6 -> Set foreground color to Cyan.
  // Ps = 9 7 -> Set foreground color to White.
  // Ps = 1 0 0 -> Set background color to Black.
  // Ps = 1 0 1 -> Set background color to Red.
  // Ps = 1 0 2 -> Set background color to Green.
  // Ps = 1 0 3 -> Set background color to Yellow.
  // Ps = 1 0 4 -> Set background color to Blue.
  // Ps = 1 0 5 -> Set background color to Magenta.
  // Ps = 1 0 6 -> Set background color to Cyan.
  // Ps = 1 0 7 -> Set background color to White.

  // If xterm is compiled with the 16-color support disabled, it
  // supports the following, from rxvt:
  // Ps = 1 0 0 -> Set foreground and background color to
  // default.

  // If 88- or 256-color support is compiled, the following apply.
  // Ps = 3 8 ; 5 ; Ps -> Set foreground color to the second
  // Ps.
  // Ps = 4 8 ; 5 ; Ps -> Set background color to the second
  // Ps.
  Terminal.prototype.charAttributes = function(params) {
    var l = params.length,
      i = 0,
      bg, fg, p;

    for (; i < l; i++) {
      p = params[i];
      if (p >= 30 && p <= 37) {
        // fg color 8
        this.curAttr = (this.curAttr & ~ (0x1ff << 9)) | ((p - 30) << 9);
      } else if (p >= 40 && p <= 47) {
        // bg color 8
        this.curAttr = (this.curAttr & ~0x1ff) | (p - 40);
      } else if (p >= 90 && p <= 97) {
        // fg color 16
        p += 8;
        this.curAttr = (this.curAttr & ~ (0x1ff << 9)) | ((p - 90) << 9);
      } else if (p >= 100 && p <= 107) {
        // bg color 16
        p += 8;
        this.curAttr = (this.curAttr & ~0x1ff) | (p - 100);
      } else if (p === 0) {
        // default
        this.curAttr = this.defAttr;
      } else if (p === 1) {
        // bold text
        this.curAttr = this.curAttr | (1 << 18);
      } else if (p === 4) {
        // underlined text
        this.curAttr = this.curAttr | (2 << 18);
      } else if (p === 7 || p === 27) {
        // inverse and positive
        // test with: echo -e '\e[31m\e[42mhello\e[7mworld\e[27mhi\e[m'
        if (p === 7) {
          if ((this.curAttr >> 18) & 4) continue;
          this.curAttr = this.curAttr | (4 << 18);
        } else if (p === 27) {
          if (~ (this.curAttr >> 18) & 4) continue;
          this.curAttr = this.curAttr & ~ (4 << 18);
        }

        bg = this.curAttr & 0x1ff;
        fg = (this.curAttr >> 9) & 0x1ff;

        this.curAttr = (this.curAttr & ~0x3ffff) | ((bg << 9) | fg);
      } else if (p === 22) {
        // not bold
        this.curAttr = this.curAttr & ~ (1 << 18);
      } else if (p === 24) {
        // not underlined
        this.curAttr = this.curAttr & ~ (2 << 18);
      } else if (p === 39) {
        // reset fg
        this.curAttr = this.curAttr & ~ (0x1ff << 9);
        this.curAttr = this.curAttr | (((this.defAttr >> 9) & 0x1ff) << 9);
      } else if (p === 49) {
        // reset bg
        this.curAttr = this.curAttr & ~0x1ff;
        this.curAttr = this.curAttr | (this.defAttr & 0x1ff);
      } else if (p === 38) {
        // fg color 256
        if (params[i + 1] !== 5) continue;
        i += 2;
        p = params[i] & 0xff;
        // convert 88 colors to 256
        // if (this.is('rxvt-unicode') && p < 88) p = p * 2.9090 | 0;
        this.curAttr = (this.curAttr & ~ (0x1ff << 9)) | (p << 9);
      } else if (p === 48) {
        // bg color 256
        if (params[i + 1] !== 5) continue;
        i += 2;
        p = params[i] & 0xff;
        // convert 88 colors to 256
        // if (this.is('rxvt-unicode') && p < 88) p = p * 2.9090 | 0;
        this.curAttr = (this.curAttr & ~0x1ff) | p;
      }
    }
  };
};

});
require.register("terminal/lib/csi/insert-delete.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {

  // CSI Ps @
  // Insert Ps (Blank) Character(s) (default = 1) (ICH).
  Terminal.prototype.insertChars = function(params) {
    var param, row, j, ch;

    param = params[0];
    if (param < 1) param = 1;

    row = this.y + this.ybase;
    j = this.x;
    ch = [this.curAttr, ' ']; // xterm

    while (param-- && j < this.cols) {
      this.lines[row].splice(j++, 0, ch);
      this.lines[row].pop();
    }
  };


  // CSI Ps L
  // Insert Ps Line(s) (default = 1) (IL).
  Terminal.prototype.insertLines = function(params) {
    var param, row, j;

    param = params[0];
    if (param < 1) param = 1;
    row = this.y + this.ybase;

    j = this.rows - 1 - this.scrollBottom;
    j = this.rows - 1 + this.ybase - j + 1;

    while (param--) {
      // test: echo -e '\e[44m\e[1L\e[0m'
      // blankLine(true) - xterm/linux behavior
      this.lines.splice(row, 0, this.blankLine(true));
      this.lines.splice(j, 1);
    }

    // this.maxRange();
    this.updateRange(this.y);
    this.updateRange(this.scrollBottom);
  };

  // CSI Ps M
  // Delete Ps Line(s) (default = 1) (DL).
  Terminal.prototype.deleteLines = function(params) {
    var param, row, j;

    param = params[0];
    if (param < 1) param = 1;
    row = this.y + this.ybase;

    j = this.rows - 1 - this.scrollBottom;
    j = this.rows - 1 + this.ybase - j;

    while (param--) {
      // test: echo -e '\e[44m\e[1M\e[0m'
      // blankLine(true) - xterm/linux behavior
      this.lines.splice(j + 1, 0, this.blankLine(true));
      this.lines.splice(row, 1);
    }

    // this.maxRange();
    this.updateRange(this.y);
    this.updateRange(this.scrollBottom);
  };

  // CSI Ps P
  // Delete Ps Character(s) (default = 1) (DCH).
  Terminal.prototype.deleteChars = function(params) {
    var param, row, ch;

    param = params[0];
    if (param < 1) param = 1;

    row = this.y + this.ybase;
    ch = [this.curAttr, ' ']; // xterm

    while (param--) {
      this.lines[row].splice(this.x, 1);
      this.lines[row].push(ch);
    }
  };

  // CSI Ps X
  // Erase Ps Character(s) (default = 1) (ECH).
  Terminal.prototype.eraseChars = function(params) {
    var param, row, j, ch;

    param = params[0];
    if (param < 1) param = 1;

    row = this.y + this.ybase;
    j = this.x;
    ch = [this.curAttr, ' ']; // xterm

    while (param-- && j < this.cols) {
      this.lines[row][j++] = ch;
    }
  };
};

});
require.register("terminal/lib/csi/position.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  // CSI Pm ` Character Position Absolute
  // [column] (default = [row,1]) (HPA).
  Terminal.prototype.charPosAbsolute = function(params) {
    var param = params[0];
    if (param < 1) param = 1;
    this.x = param - 1;
    if (this.x >= this.cols) {
      this.x = this.cols - 1;
    }
  };

  // 141 61 a * HPR -
  // Horizontal Position Relative
  // reuse CSI Ps C ?
  Terminal.prototype.HPositionRelative = function(params) {
    var param = params[0];
    if (param < 1) param = 1;
    this.x += param;
    if (this.x >= this.cols) {
      this.x = this.cols - 1;
    }
  };
  
  // CSI Pm d
  // Line Position Absolute [row] (default = [1,column]) (VPA).
  Terminal.prototype.linePosAbsolute = function(params) {
      var param = params[0];
      if (param < 1) param = 1;
      this.y = param - 1;
      if (this.y >= this.rows) {
          this.y = this.rows - 1;
      }
  };

  // 145 65 e * VPR - Vertical Position Relative
  // reuse CSI Ps B ?
  Terminal.prototype.VPositionRelative = function(params) {
      var param = params[0];
      if (param < 1) param = 1;
      this.y += param;
      if (this.y >= this.rows) {
          this.y = this.rows - 1;
      }
  };

  // CSI Ps ; Ps f
  // Horizontal and Vertical Position [row;column] (default =
  // [1,1]) (HVP).
  Terminal.prototype.HVPosition = function(params) {
      if (params[0] < 1) params[0] = 1;
      if (params[1] < 1) params[1] = 1;

      this.y = params[0] - 1;
      if (this.y >= this.rows) {
          this.y = this.rows - 1;
      }

      this.x = params[1] - 1;
      if (this.x >= this.cols) {
          this.x = this.cols - 1;
      }
  };
};

});
require.register("terminal/lib/csi/cursor.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  // CSI s
  // Save cursor (ANSI.SYS).
  Terminal.prototype.saveCursor = function(params) {
    this.savedX = this.x;
    this.savedY = this.y;
  };

  // CSI u
  // Restore cursor (ANSI.SYS).
  Terminal.prototype.restoreCursor = function(params) {
    this.x = this.savedX || 0;
    this.y = this.savedY || 0;
  };

  // CSI Ps A
  // Cursor Up Ps Times (default = 1) (CUU).
  Terminal.prototype.cursorUp = function(params) {
      var param = params[0];
      if (param < 1) param = 1;
      this.y -= param;
      if (this.y < 0) this.y = 0;
  };

  // CSI Ps B
  // Cursor Down Ps Times (default = 1) (CUD).
  Terminal.prototype.cursorDown = function(params) {
      var param = params[0];
      if (param < 1) param = 1;
      this.y += param;
      if (this.y >= this.rows) {
          this.y = this.rows - 1;
      }
  };

  // CSI Ps C
  // Cursor Forward Ps Times (default = 1) (CUF).
  Terminal.prototype.cursorForward = function(params) {
      var param = params[0];
      if (param < 1) param = 1;
      this.x += param;
      if (this.x >= this.cols) {
          this.x = this.cols - 1;
      }
  };

  // CSI Ps D
  // Cursor Backward Ps Times (default = 1) (CUB).
  Terminal.prototype.cursorBackward = function(params) {
      var param = params[0];
      if (param < 1) param = 1;
      this.x -= param;
      if (this.x < 0) this.x = 0;
  };

  // CSI Ps ; Ps H
  // Cursor Position [row;column] (default = [1,1]) (CUP).
  Terminal.prototype.cursorPos = function(params) {
      var row, col;

      row = params[0] - 1;

      if (params.length >= 2) {
          col = params[1] - 1;
      } else {
          col = 0;
      }

      if (row < 0) {
          row = 0;
      } else if (row >= this.rows) {
          row = this.rows - 1;
      }

      if (col < 0) {
          col = 0;
      } else if (col >= this.cols) {
          col = this.cols - 1;
      }

      this.x = col;
      this.y = row;
  };
  
  // CSI Ps E
  // Cursor Next Line Ps Times (default = 1) (CNL).
  // same as CSI Ps B ?
  Terminal.prototype.cursorNextLine = function(params) {
      var param = params[0];
      if (param < 1) param = 1;
      this.y += param;
      if (this.y >= this.rows) {
          this.y = this.rows - 1;
      }
      this.x = 0;
  };

  // CSI Ps F
  // Cursor Preceding Line Ps Times (default = 1) (CNL).
  // reuse CSI Ps A ?
  Terminal.prototype.cursorPrecedingLine = function(params) {
      var param = params[0];
      if (param < 1) param = 1;
      this.y -= param;
      if (this.y < 0) this.y = 0;
      this.x = 0;
  };

  // CSI Ps G
  // Cursor Character Absolute [column] (default = [row,1]) (CHA).
  Terminal.prototype.cursorCharAbsolute = function(params) {
      var param = params[0];
      if (param < 1) param = 1;
      this.x = param - 1;
  };

  // CSI Ps I
  // Cursor Forward Tabulation Ps tab stops (default = 1) (CHT).
  Terminal.prototype.cursorForwardTab = function(params) {
      var param = params[0] || 1;
      while (param--) {
          this.x = this.nextStop();
      }
  };

  // CSI Ps Z Cursor Backward Tabulation Ps tab stops (default = 1) (CBT).
  Terminal.prototype.cursorBackwardTab = function(params) {
      var param = params[0] || 1;
      while (param--) {
          this.x = this.prevStop();
      }
  };

};

});
require.register("terminal/lib/csi/repeatPrecedingCharacter.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  // CSI Ps b Repeat the preceding graphic character Ps times (REP).
  Terminal.prototype.repeatPrecedingCharacter = function(params) {
    var param = params[0] || 1,
      line = this.lines[this.ybase + this.y],
      ch = line[this.x - 1] || [this.defAttr, ' '];

    while (param--) line[this.x++] = ch;
  };
};

});
require.register("terminal/lib/csi/tabClear.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  // CSI Ps g Tab Clear (TBC).
  // Ps = 0 -> Clear Current Column (default).
  // Ps = 3 -> Clear All.
  // Potentially:
  // Ps = 2 -> Clear Stops on Line.
  // http://vt100.net/annarbor/aaa-ug/section6.html
  Terminal.prototype.tabClear = function(params) {
    var param = params[0];
    if (param <= 0) {
      delete this.tabs[this.x];
    } else if (param === 3) {
      this.tabs = {};
    }
  };
};

});
require.register("terminal/lib/csi/softReset.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {
  // CSI ! p Soft terminal reset (DECSTR).
  // http://vt100.net/docs/vt220-rm/table4-10.html
  Terminal.prototype.softReset = function(params) {
    this.cursorHidden = false;
    this.insertMode = false;
    this.originMode = false;
    this.wraparoundMode = false; // autowrap
    this.applicationKeypad = false; // ?
    this.scrollTop = 0;
    this.scrollBottom = this.rows - 1;
    this.curAttr = this.defAttr;
    this.x = this.y = 0; // ?
    this.charset = null;
    this.glevel = 0; // ??
    this.charsets = [null]; // ??
  };
};

});
require.register("terminal/lib/charsets.js", function(exports, require, module){
'use strict';

module.exports = function (Terminal) {

Terminal.charsets = {};

  // DEC Special Character and Line Drawing Set.
  // http://vt100.net/docs/vt102-ug/table5-13.html
  // A lot of curses apps use this if they see TERM=xterm.
  // testing: echo -e '\e(0a\e(B'
  // The xterm output sometimes seems to conflict with the
  // reference above. xterm seems in line with the reference
  // when running vttest however.
  // The table below now uses xterm's output from vttest.
  Terminal.charsets.SCLD = { // (0
    '`': '\u25c6', // '◆'
    'a': '\u2592', // '▒'
    'b': '\u0009', // '\t'
    'c': '\u000c', // '\f'
    'd': '\u000d', // '\r'
    'e': '\u000a', // '\n'
    'f': '\u00b0', // '°'
    'g': '\u00b1', // '±'
    'h': '\u2424', // '\u2424' (NL)
    'i': '\u000b', // '\v'
    'j': '\u2518', // '┘'
    'k': '\u2510', // '┐'
    'l': '\u250c', // '┌'
    'm': '\u2514', // '└'
    'n': '\u253c', // '┼'
    'o': '\u23ba', // '⎺'
    'p': '\u23bb', // '⎻'
    'q': '\u2500', // '─'
    'r': '\u23bc', // '⎼'
    's': '\u23bd', // '⎽'
    't': '\u251c', // '├'
    'u': '\u2524', // '┤'
    'v': '\u2534', // '┴'
    'w': '\u252c', // '┬'
    'x': '\u2502', // '│'
    'y': '\u2264', // '≤'
    'z': '\u2265', // '≥'
    '{': '\u03c0', // 'π'
    '|': '\u2260', // '≠'
    '}': '\u00a3', // '£'
    '~': '\u00b7' // '·'
  };

  Terminal.charsets.UK = null; // (A
  Terminal.charsets.US = null; // (B (USASCII)
  Terminal.charsets.Dutch = null; // (4
  Terminal.charsets.Finnish = null; // (C or (5
  Terminal.charsets.French = null; // (R
  Terminal.charsets.FrenchCanadian = null; // (Q
  Terminal.charsets.German = null; // (K
  Terminal.charsets.Italian = null; // (Y
  Terminal.charsets.NorwegianDanish = null; // (E or (6
  Terminal.charsets.Spanish = null; // (Z
  Terminal.charsets.Swedish = null; // (H or (7
  Terminal.charsets.Swiss = null; // (=
  Terminal.charsets.ISOLatin = null; // /A

};

});
require.alias("terminal/terminal.js", "terminal/index.js");

