;(function(){
'use strict';

var MAX_FRAMES = 30;
var NTH_FRAME = 10;

function jsonClone (obj) {
  return JSON.parse (JSON.stringify (obj));
}

/**
 * This structure represents a single frame of gameplay.
 *
 * this.state -> A user-defined State object representing the state of the game
 *               this frame.
 * this.inputs -> A hash of user-defined Input objects keyed by player ID.
 *                The inputs in frame N are used to compute frame N+1.
 * this.time -> An integer incremented by one every game step.
 *              (temporarily renamed to confusing name 'frame' to ease merge in to old code)
 */
function Frame (state, inputs, time) {
  this.state = state;
  this.inputs = inputs;
  this.time = time;
}

/**
 */
Frame.prototype.clone = function () {
  return new Frame (
    jsonClone (this.state),
    jsonClone (this.inputs),
    this.time
  );
}

/**
 * This object manages a series of Frame objects, allowing inputs to happen
 * at some point in the past, and recalculating the results of the game
 * up to whatever the current time is.
 *
 * this._game -> ...
 * this._oldestModifiedInput -> ...
 * this._frames -> ...
 */
function FrameStack (game) {
  this._game = game;
  this._oldestModifiedInput = -1;
  this._frames = [new Frame (game.init(), {}, 0)];
}

/**
 */
FrameStack.prototype.pushInput = function (input) {
  var id = Math.random().toString().substr(2);
  this._frames[0].inputs[id] = input;
  return id;
}

/**
 */
FrameStack.prototype.input = function (time, id, input) {
  if (time < this._oldestModifiedInput || this._oldestModifiedInput === -1) {
    this._oldestModifiedInput = time;
  }

  // Make the input adjustment at the appropriate time and propagate it.
  var frames = this._frames;
  for (var i = 0; i < frames.length; ++i) {
    if (frames[i].time === time) {
      while (i >= 0) {
        frames[i].inputs[id] = input;
        i--;
      }
      break;
    }
  }
}

/**
 * Compounds the input adjustments that have happened since the previous call
 * to 'step', and then steps the game forwards by a single frame.
 */
FrameStack.prototype.step = function () {
  // Resimulate the game starting at the oldest input change.
  if (this._oldestModifiedInput >= 0) {
    for (var i = 0; i < this._frames.length; ++i) {
      if (this._frames[i].time === this._oldestModifiedInput) break;
    }
    while (i > 0) {
      this._frames[i-1] = new Frame (
        this._game.step (this._frames[i].inputs, jsonClone (this._frames[i].state)),
        this._frames[i-1].inputs,
        this._frames[i].time + 1
      );
      i--;
    }
    this._oldestModifiedInput = -1;
  }

  // Pull the state N frames in the past, along with the inputs up to the present.
  var returnObject = null;
  if (this._frames.length > NTH_FRAME) {
    returnObject = {
      pastTime: this._frames[NTH_FRAME].time,
      pastState: this._frames[NTH_FRAME].state,
      knownInputs: [],
    };
    for (i = 0; i <= NTH_FRAME; ++i) {
      returnObject.knownInputs.push (this._frames[i].inputs);
    }
  }

  // Simulate the next frame, cloning the previous input state.
  this._frames.unshift (new Frame (
    this._game.step (this._frames[0].inputs, jsonClone (this._frames[0].state)),
    jsonClone (this._frames[0].inputs),
    this._frames[0].time + 1
  ));
  if (this._frames.length > MAX_FRAMES) {
    this._frames.pop ();
  }

  return returnObject;
}

// Export FrameStack as node module, or just throw it on the window
// object for the client (for now until sorting out a client code plan).
if (typeof module !== 'undefined') module.exports = FrameStack;
else if (typeof window !== 'undefined') window.FrameStack = FrameStack;

})();
