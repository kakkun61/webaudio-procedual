(function ()
{
  var onDOMContentLoaded = function ()
  {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
    context.createScriptProcessor = context.createScriptProcessor || context.createJavaScriptNode;
    var processor = context.createScriptProcessor(2048, 1, 1);

    var osc = context.createOscillator();
    osc.start = osc.start || osc.noteOn;
    osc.stop = osc.stop || osc.noteOff;
    osc.connect(processor);
    processor.connect(context.destination);
    osc.start(0);

    var is_pressed = true; // genEnvelope の中で参照されているよ

	var keys = new Array(8); for (var i=0; i<keys.length; i++) {keys[i] = false;}

	var charCodes = {
		97 = 0,
		115 = 1,
		100 = 2,
		102 = 3,
		103 = 4,
		104 = 5,
		106 = 6,
		107 = 7,
	};

    document.onkeypress = function(evt)
    {
		evt = evt || window.event;
		var charCode = evt.keyCode || evt.which;
		keys[charCodes[charCode]] = true;
		console.log(charCode); // 97 115 100 102 103 104 106 107
    }

    var main = function ()
    {
      var base_freq = 440;
      var freq_rate = Math.pow(2, 1/12);
      var freqs = new Array(8);
      freqs[0] = base_freq * Math.pow(freq_rate, 3); // ド
      freqs[1] = freqs[0]  * Math.pow(freq_rate, 2); // レ
      freqs[2] = freqs[1]  * Math.pow(freq_rate, 2); // ミ
      freqs[3] = freqs[2]  * Math.pow(freq_rate, 1); // ファ
      freqs[4] = freqs[3]  * Math.pow(freq_rate, 2); // ソ
      freqs[5] = freqs[4]  * Math.pow(freq_rate, 2); // ラ
      freqs[6] = freqs[5]  * Math.pow(freq_rate, 2); // シ
      freqs[7] = freqs[6]  * Math.pow(freq_rate, 1); // ド

      var t = context.currentTime;
      var step = Math.floor(context.currentTime - t);
      var frequency = freqs[0];
      var o = genOscillator(frequency);
      var env = genEnvelope(o);

      processor.onaudioprocess = function (event)
      {
        var new_step = Math.floor(context.currentTime - t);
        if (new_step >= freqs.length)
        {
            processor.disconnect(0);
            processor.onaudioprocess = null;
            osc.stop(0);
            alert("Thank you for listening!!");
        }

        if (new_step != step)
        {
            step = new_step;
            is_pressed = true;
            frequency = freqs[step];
            o = genOscillator(frequency);
            env = genEnvelope(o);
        }

        var outputBuffer = event.outputBuffer;
        for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++)
        {
            var output = event.outputBuffer.getChannelData(channel);
            for (var buf_i=0; buf_i<this.bufferSize; buf_i++)
            {
                output[buf_i] = env();
            }
            is_pressed = false;
        }
      }
    }

	var genKey = function (index, freq)
	{
		//TODO: キー入力に対応して
	}

    var genOscillator = function (freq)
    {
      var dt = 1.0 / context.sampleRate;
      var k = 2.0 * Math.PI * freq;
      var T = 1.0 / freq;
      var t = 0;
      var _oscillator = function ()
      {
          var ret = Math.sin(k * t);
          t += dt;
          if (t > T) t -= T;
          return ret;
      }
      return _oscillator;
    }

    var genGain = function (g, osc)
    {
      var _gain = function ()
      {
          return g * osc();
      }
      return _gain;
    }

    var genEnvelope = function (osc)
    {
      var dt = 1.0 / context.sampleRate;
      var is_top = false;
      var gain = 0.0;
      var sustain = 0.5;

      var dattack = dt / 0.01;
      var ddekey  = dt / 0.03;
      var dsustain = dt / 0.7;
      var drelease = dt / 0.8;

      var _envelope = function ()
      {
        if (is_pressed === false)
        {
            is_top = false;
            gain -= drelease;
            if (gain < 0.0)
            {
                gain = 0.0;
            }
            return gain * osc();
        }

        // is_pressed

        if (is_top)
        {
          if (gain > sustain)
          {
              gain -= ddekey;
          }
          else
          {
              gain -= dsustain;
          }

          if (gain < 0.0)
          {
              gain = 0.0;
          }

          return gain * osc();
        }

        gain += dattack;
        if (gain > 1.0)
        {
            is_top = true;
            gain = 1.0;
        }
        return gain * osc();
      }

      return _envelope;
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

