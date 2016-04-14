(function ()
{
  var onDOMContentLoaded = function ()
  {
    document.onkeypress = function(evt)
    {
        evt = evt || window.event;
        var charCode = evt.keyCode || evt.which;
    }

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
    context.createScriptProcessor = context.createScriptProcessor || context.createJavaScriptNode;
    var processor = context.createScriptProcessor(4096, 1, 1);

    var osc = context.createOscillator();
    osc.start = osc.start || osc.noteOn;
    osc.stop = osc.stop || osc.noteOff;
    osc.connect(processor);
    processor.connect(context.destination);
    osc.start(0);

    var main = function ()
    {
      processor.onaudioprocess = function (event)
      {
        var outputBuffer = event.outputBuffer;
        for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++)
        {
            var output = event.outputBuffer.getChannelData(channel);
            for (var buf_i=0; buf_i<this.bufferSize; buf_i++)
            {
                // output[buf_i] = sameValue;
            }
        }
      }
    }

    main();
  }

  if ((document.readyState === "interactive") || (document.readyState === "complete"))
  {
      onDOMContentLoaded();
  }
  else
  {
      document.addEventListener("DOMContentLoaded", onDOMContentLoaded, true);
  }

})();

