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

    var is_pressed = {
        97 : false,
        115 : false,
        100 : false,
        102 : false,
        103 : false,
        104 : false,
        106 : false,
        107 : false,
    };

    var base_freq = 440;
    var freq_rate = Math.pow(2, 1/12);
    var freqs = {
        97  : base_freq * Math.pow(freq_rate, 3),
        115 : base_freq * Math.pow(freq_rate, 5),
        100 : base_freq * Math.pow(freq_rate, 7),
        102 : base_freq * Math.pow(freq_rate, 8),
        103 : base_freq * Math.pow(freq_rate, 10),
        104 : base_freq * Math.pow(freq_rate, 12),
        106 : base_freq * Math.pow(freq_rate, 14),
        107 : base_freq * Math.pow(freq_rate, 15),
    };

    document.onkeypress = function(evt)
    {
        evt = evt || window.event;
        var charCode = evt.keyCode || evt.which;
        if (charCode in is_pressed)
        {
            is_pressed[charCode] = true;
        }
        console.log(charCode); // 97 115 100 102 103 104 106 107
    }

    var main = function ()
    {
      var osc_funcs = new Array();
      for (key_code in is_pressed)
      {
        var osc_func = genOscillator(freqs[key_code]);
        var envelope = genEnvelope(key_code, osc_func);
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
                output[buf_i] = f();
            }
        }
      }
    }

    var multiplex = function (osc_funcs)
    {
        var _osc = function ()
        {
            var ret = 0.0;
            for (key in osc_funcs)
            {
                ret += osc_funcs[key]();
            }
            return ret;
        }
        return _osc;
    }

    var genEnvelope = function (key_code, osc_func)
    {
        // const
        var dt = 1.0 / context.sampleRate;
        var sustain_level = 0.5;
        var attack = 0.01;
        var dekey = 0.03;
        var release = 1 - attack;

        var dattack = dt / attack;
        var ddekey = dt / dekey;
        var drelease = dt / (release - dekey);

        // var
        var is_top = false;
        var gain = 0.0;

        var _envelope = function()
        {
            if (is_pressed[key_code] === false)
            {
                is_top = false;
                gain -= drelease;
                if (gain < 0.0)
                {
                    gain = 0.0;
                }
                return gain * osc_func();
            }

            // pressed !!
            //
            if (is_top)
            {
                if (gain > sustain_level)
                {
                    gain -= ddekey;
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
        return _envelope;
    }

    var genOscillator = function (freq)
    {
        var dt = 1.0 / context.sampleRate;
        var k = 2.0 * Math.PI * freq;
        var T = 1.0 / freq;
        var t = 0.0;

        var _oscillator = function ()
        {
            var ret = Math.sin(k * t);
			t += dt;
			if (t > T) t -= T;
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

