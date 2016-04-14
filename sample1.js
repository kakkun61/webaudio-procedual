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

    var main = function ()
    {
	  var oscillator = genOscillator(440);
      processor.onaudioprocess = function (event)
      {
        var outputBuffer = event.outputBuffer;
        for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++)
        {
            var output = event.outputBuffer.getChannelData(channel);
            for (var buf_i=0; buf_i<this.bufferSize; buf_i++)
            {
                output[buf_i] = oscillator();
            }
        }
      }
    }

	var genOscillator = function (freq)
	{
		var dt = 1.0 / context.sampleRate;
		var k = 2.0 * Math.PI * freq;
		var T = 1.0 / freq;
		var t = 0.0;

		var _oscillator = function ()
		{
			var ret = (Math.random() - 0.5); // [-0.5:0.5)
			return ret;
		}
		return _oscillator;
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

