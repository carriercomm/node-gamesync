function runGame (game, render, getInput) {
  'use strict';

  var socket = io.connect (document.URL);
  var inputId = null;

  var latestInput = game.defaultInput ();
  var storedInputs = [];

  socket.on ('connect', function () {
    socket.on ('message', function (data) {
      if (data.error) {
        alert (data.error);
        return;
      }
      if (data.notifyInputId) {
        inputId = data.notifyInputId;
        return;
      }

      var newInputTime = data.pastTime + data.knownInputs.length - 1;

      var readInput = getInput ();

      if (readInput) {
        latestInput = readInput;
        socket.json.send ({
          input: readInput,
          time: newInputTime
        });
      }

      storedInputs.unshift ({
        input: latestInput,
        time: newInputTime
      });

      var frame = {};
      frame.state = data.pastState;
      frame.time = data.pastTime;
      while (data.knownInputs.length) {
        var frameInputs = data.knownInputs.pop();
        for (var i = 0; i < storedInputs.length; ++i) {
          if (storedInputs[i].time === frame.time) {
            frameInputs[inputId] = storedInputs[i].input;
            break;
          }
        }
        frame.state = game.step (frameInputs, frame.state);
        frame.time++;
      }

      render (frame.state);

      // TODO Replace magic number with science number
      if (storedInputs.length > 50) storedInputs.pop ();
    });
  });
}

