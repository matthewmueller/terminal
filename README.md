# terminal

Render terminal output to the browser. Based off of: [hypernal](https://github.com/thlorenz/hypernal)

## Installation

    component install matthewmueller/terminal

## Example

```js
var Terminal = require('terminal');
var terminal = Terminal();
document.body.appendChild(terminal.el);
terminal.writeln('hi!');
```

## API

***terminal(options:Object)***

creates a **render only** terminal and returns an interface to interact with it as described below.

**options**:
- allow overriding `{ cols: Number, rows: Number }` of the terminal, which generally is not necessary
**Note:**
  - number of cols will be applied to any row
  - number of rows will indicate how many rows to add initially, but more will be added if needed

***term.tail:Boolean***

- when set to true, the terminal will automatically scroll to the bottom when more lines are added than fit in its
  container

***term.appendTo(elem:String|Object)***

appends the terminal to the given DOM element.

***term.write(s:String)***

writes the given string to the terminal.

***term.writeln(s:String)***

writes the given string to the terminal and adds a line break.

***term.reset()***

clears the terminal

## Kudos

terminal (originally hypernal) is basically a trimmed down version of [tty.js](https://github.com/chjj/tty.js/) focused on and improved for rendering only.
