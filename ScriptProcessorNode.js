(function ()
{
  var onDOMContentLoaded = function ()
  {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    try
    {
      var context = new AudioContext();
    }
    catch (error)
    {
        window.alert(error.message + " : Please use Chrome or Safari.");
        return;
    }
    // for legacy browsers
    context.createScriptProcessor = context.createScriptProcessor || context.createJavaScriptNode;

    var processor = context.createScriptProcessor(getBufferSize(), 2, 2);

    var osc = null;

    var volume = 1;

    osc = context.createOscillator();
    osc.start = osc.start || osc.noteOn;
    osc.stop = osc.stop || osc.noteOff;

    osc.connect(processor);
    processor.connect(context.destination);

    osc.start(0);

    processor.onaudioprocess = function (event)
    {
        var inputLs = event.inputBuffer.getChannelData(0);
        var inputRs = event.inputBuffer.getChannelData(1);

        var outputLs = event.outputBuffer.getChannelData(0);
        var outputRs = event.outputBuffer.getChannelData(1);

        for (var i=0; i<this.bufferSize; i++)
        {
            outputLs[i] = volume * (Math.random() - 0.5); // inputLs[i];
            outputRs[i] = volume * (Math.random() - 0.5); // inputRs[i];
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



// Utills

function getBufferSize ()
{
  if (/(Win(dows)?NT 6\.2)/.test(navigator.userAgent))  // Win8
  {
    return 1024;
  }
  else if (/(Win(dows)?NT 6\.1)/.test(navigator.userAgent)) // Win7
  {
    return 1024;
  }
  else if (/(Win(dows)?NT 6\.0)/.test(navigator.userAgent)) // Win Vista
  {
    return 2048;
  }
  else if (/Win(dows )?(NT 5\.1|XP)/.test(navigator.userAgent)) // Win Vista
  {
    return 4096;
  }
  else if (/Mac|PPC/.test(navigator.userAgent))
  {
    return 1024;
  }
  else if (/Linux/.test(navigator.userAgent))
  {
    return 8192;
  }
  else if (/iPhone|iPad|iPod/.test(navigator.userAgent))
  {
    return 2048;
  }
  return 16384;
}


function EventWrapper () { }
(function()
{
  if (/iPhone|iPad|iPod|Android/.test(navigator.userAgent))
  {
    EventWrapper.CLICK = "click";
    EventWrapper.START = "touchstart";
    EventWrapper.MOVE = "touchmove";
    EventWrapper.END = "touchend";
  }
  else
  {
    EventWrapper.CLICK = "click";
    EventWrapper.START = "mousedown";
    EventWrapper.MOVE = "mousemove";
    EventWrapper.END = "mouseup";
  }
}) ();

