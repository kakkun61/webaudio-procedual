(function ()
{
  var onDOMContentLoaded = function ()
  {
    var is_pressed = new Object();
    is_pressed[97] = false;
    is_pressed[115] = false;
    is_pressed[100] = false;
    is_pressed[102] = false;
    is_pressed[103] = false;
    is_pressed[104] = false;
    is_pressed[106] = false;
    is_pressed[107] = false;

	var freqs = new Object();
	var base_freq = 440;
	var freq_rate = Math.pow(2, 1/12);
    freqs[97]  = base_freq * Math.pow(freq_rate, 3);
    freqs[115] = base_freq * Math.pow(freq_rate, 5);
    freqs[100] = base_freq * Math.pow(freq_rate, 7);
    freqs[102] = base_freq * Math.pow(freq_rate, 8);
    freqs[103] = base_freq * Math.pow(freq_rate, 10);
    freqs[104] = base_freq * Math.pow(freq_rate, 12);
    freqs[106] = base_freq * Math.pow(freq_rate, 14);
    freqs[107] = base_freq * Math.pow(freq_rate, 15);

    document.onkeypress = function(evt)
    {
        evt = evt || window.event;
        var charCode = evt.keyCode || evt.which;
        console.log(charCode);
        if (charCode in is_pressed)
        {
            is_pressed[charCode] = true;
        }
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
	  var osc_funcs = new Array();
	  for (key in freqs)
	  {
          var osc_func = genOscillator(freqs[key]);
          var envelope = genEnvelope(key, osc_func);
		  osc_funcs.push(envelope);
	  }
	  var f = multiplex(osc_funcs);
      processor.onaudioprocess = function (event)
      {
        var outputBuffer = event.outputBuffer;
        for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++)
        {
            var output = event.outputBuffer.getChannelData(channel);
            for (var buf_i=0; buf_i<this.bufferSize; buf_i++)
            {
                output[buf_i] = f(); // [-0.5:0.5)
            }
        }
      }
    }

	var multiplex = function (osc_funcs)
	{
		var _m = function ()
		{
			var ret = 0.0;
			for (key in osc_funcs)
			{
				ret += osc_funcs[key]();
			}
			return ret;
		}
		return _m;
	}


    var genEnvelope = function (key_code, osc_func)
    {
        var dt = 1.0 / context.sampleRate;
        var attack = 0.01; //MAxまでの時間
        var decay = 0.03; // Maxからsustain_levelまで落ちる時間
        var release = 0.8; // sustain_levelから0まで落ちる時間
        var sustain_level = 0.3;

        var dattack = dt / attack;
        var ddecay = dt / decay;
        var drelease = dt / release;

        var is_top = false;
        var gain = 0.0;  // 音量

        var _osc = function ()
        {
            if (is_pressed[key_code] === false)
            {
                gain -= drelease;
                if (gain < 0.0)
                {
                    gain = 0.0;
                }
                return gain * osc_func();
            }

            // Pressed
            if (is_top)
            {
                is_top = false;
                if (gain > sustain_level)
                {
                    gain -= ddecay;
                }
                else
                {
                    gain -= drelease;
                }
                
                if (gain < 0.0)
                {
                    gain = 0.0;
                }
                return gain * osc_func();
            }

            // Still not top
            gain += dattack;
            if (gain > 1.0)
            {
                is_top = true;
                is_pressed[key_code] = false;
                gain = 1.0;
            }
            return gain * osc_func();
        }
        return _osc;
    }

    var genOscillator = function (freq)
    {
        var dt = 1.0 / context.sampleRate;
        var k = 2.0 * Math.PI * freq;
        var T = 1.0 / freq;

        var t = 0.0;

        var _osc = function ()
        {
                var ret = Math.sin(k * t);
                t += dt;
                if (t > T) t -= T;
                return ret;
        }
        return _osc;
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

