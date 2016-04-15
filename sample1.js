(function ()
{
  var onDOMContentLoaded = function ()
  {
    var is_pressed = new Object();
    is_pressed["KeyA"] = false;
    is_pressed["KeyS"] = false;
    is_pressed["KeyD"] = false;
    is_pressed["KeyF"] = false;
    is_pressed["KeyG"] = false;
    is_pressed["KeyH"] = false;
    is_pressed["KeyJ"] = false;
    is_pressed["KeyK"] = false;

	var freqs = new Object();
	var base_freq = 440;
	var freq_rate = Math.pow(2, 1/12);
    freqs["KeyA"]  = base_freq * Math.pow(freq_rate, 3);
    freqs["KeyS"] = base_freq * Math.pow(freq_rate, 5);
    freqs["KeyD"] = base_freq * Math.pow(freq_rate, 7);
    freqs["KeyF"] = base_freq * Math.pow(freq_rate, 8);
    freqs["KeyG"] = base_freq * Math.pow(freq_rate, 10);
    freqs["KeyH"] = base_freq * Math.pow(freq_rate, 12);
    freqs["KeyJ"] = base_freq * Math.pow(freq_rate, 14);
    freqs["KeyK"] = base_freq * Math.pow(freq_rate, 15);

    document.onkeydown = function(evt)
    {
        evt = evt || window.event;
        var charCode = evt.code || evt.which;
        if (charCode in is_pressed)
        {
            is_pressed[charCode] = true;
        }
    }

    document.onkeyup = function (evt)
    {
        evt = evt || window.event;
        var charCode = evt.code || evt.which;
        if (charCode in is_pressed)
        {
            is_pressed[charCode] = false;
        }
    }

    var canvas = document.querySelector('.visualizer');
    var canvasCtx = canvas.getContext('2d');

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
    context.createScriptProcessor = context.createScriptProcessor || context.createJavaScriptNode;
    var processor = context.createScriptProcessor(4096, 1, 1);

    var analyser = context.createAnalyser();
    analyser.minDecibels = -90;
    analyser.maxDecibels = 0;
    analyser.smoothingTimeConstant = 0.85;

    var osc = context.createOscillator();
    osc.start = osc.start || osc.noteOn;
    osc.stop = osc.stop || osc.noteOff;
    osc.connect(processor);
    processor.connect(analyser);
    analyser.connect(context.destination);
    osc.start(0);

    visualize();    

    var main = function ()
    {
	  var osc_funcs = new Array();
	  for (var key in freqs)
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
            for (var buf_i = 0; buf_i < this.bufferSize; buf_i++)
            {
                output[buf_i] = f();
            }
        }
      }
    }

	var multiplex = function (osc_funcs)
	{
		var _m = function ()
		{
			var ret = 0.0;
			for (var key in osc_funcs)
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
        var attack = 4; // Maxまでの時間（秒）
        var decay = 3; // Maxからsustain_levelまで落ちる時間（秒）
        var release = 5; // sustain_levelから0まで落ちる時間（秒）
        var sustain_level = 0.3;

        // 1サンプルでの増減量（絶対値）
        var dattack = dt / attack;
        var ddecay = (1 - sustain_level) * dt / decay;
        var drelease = sustain_level * dt / release;

        var gain = 0.0; // 音量

        var start_at = -1.0; // 音が鳴り始めた UNIX 時刻（鳴っていないときは負値）

        var qadsr = 'q'; // デバッグ用 直前の状態を表す quiet attack decay sustain release

        var _osc = function ()
        {
            (function()
            {
                if (is_pressed[key_code])
                {
                    if (start_at < 0)
                    {
                        // quiet → attack
                        console.log("quiet → attack");
                        start_at = Date.now() / 1000;
                        gain = dattack;
                        return;
                    }

                    var elapsed = Date.now() / 1000 - start_at; // 経過時間（秒）
                    if (elapsed < attack)
                    {
                        // attack
                        if (qadsr !== 'a')
                        {
                            console.log("attack");
                            qadsr = 'a'
                        }
                        gain += dattack;
                        return;
                    }

                    if (elapsed < attack + decay)
                    {
                        // decay
                        if (qadsr !== 'd')
                        {
                            console.log("decay");
                            qadsr = 'd'
                        }
                        gain -= ddecay;
                        return;
                    }

                    // sustain
                    if (qadsr !== 's')
                    {
                        console.log("sustain");
                        qadsr = 's'
                    }
                    gain = sustain_level;
                    return;
                }

                // key released
                if (0 <= start_at)
                {
                    gain -= drelease;
                    if (gain < 0)
                    {
                        // release → quiet
                        console.log("release → quiet");
                        gain = 0;
                        start_at = -1;
                    }
                    else
                    {
                        if (qadsr !== 'r')
                        {
                            console.log("release");
                            qadsr = 'r'
                        }
                    }
                    return;
                }

                if (qadsr !== 'q')
                {
                    console.log("quiet");
                    qadsr = 'q'
                }                
            })();
            return osc_func() * gain;
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

    function visualize() {
        WIDTH = canvas.width;
        HEIGHT = canvas.height;

        analyser.fftSize = 256;
        var bufferLength = analyser.frequencyBinCount;
        console.log(bufferLength);
        var dataArray = new Uint8Array(bufferLength);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        function draw() {
            drawVisual = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            var barWidth = (WIDTH / bufferLength) * 2.5;
            var barHeight;
            var x = 0;

            for(var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
                canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

                x += barWidth + 1;
            }
        };

        draw();
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
