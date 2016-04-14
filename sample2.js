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
            console.log("Thank you for listening!!");
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
      var sustain_level = 0.5;
	  var attack = 0.01;
	  var dekey = 0.03;
	  var release = 1  - attack;

      var dattack = dt / attack;
      var ddekey  = dt / dekey;
      var drelease = dt / (release - dekey);

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

