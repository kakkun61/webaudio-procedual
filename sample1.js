(function ()
{
  var onDOMContentLoaded = function ()
  {
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

    var volume = 0.3;
    processor.onaudioprocess = function (event)
    {
        var inputBuffer = event.inputBuffer;
        var outputBuffer = event.outputBuffer;
		console.log(context.sampleRate);

        for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++)
        {
            var input  = event.inputBuffer.getChannelData(channel);
            var output = event.outputBuffer.getChannelData(channel);
            for (var sample_i=0; sample_i<this.bufferSize; sample_i++)
            {
                output[sample_i] = volume * (Math.random() - 0.5);
            }
        }
    }
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
