var ctx; //audio context 
var buf; //audio buffer 
var fft; //fft audio node 
var samples = 1024;
var setup = false; //indicate if audio is set up yet 


//init the sound system 
function init() {
    console.log("in init");
    try {
        ctx = new webkitAudioContext(); //is there a better API for this? 
        src = ctx.createBufferSource();
        setupCanvas();
        initSC();

    } catch (e) {
        alert('you need webaudio support' + e);
    }
}
window.addEventListener('load', init, false);

//initSC
function initSC() {

    //init ui
    var $tracklist = $("#tracklist");
    //
    SC.initialize({
        client_id: '7dba0507b27063e9f49168e856f7e09e'
    });


    //search func
    var searchField;
    $('#SCsearch').keyup(function(evt) {
        searchField = $(evt.target);
        SC.get('/tracks', {
            q: searchField.val()
        }, displayTracks);
    });


    //
    var tracksArray;
    function displayTracks(tracks) {
        tracksArray = tracks;
        $tracklist.empty();
        for (var i = 0; i < tracksArray.length; i++) {
            var track = tracksArray[i];

            var img = $("<img>").attr("src", track.artwork_url);
            var title = $("<p>").text(track.title);
            var li = $("<li>").append(img).append(title);
            $tracklist.append(li);
            var stream_url = li.data("idx", i);


        }


    }

    $("#tracklist").on('click', 'li',function(event) {
        var idx = $(event.currentTarget).data("idx");
        
        var stream_url = tracksArray[idx]["stream_url"];
        console.log(stream_url);

        loadFileWithStramUrl(stream_url);
        console.log(tracksArray[idx]);
    });

    loadFileWithStramUrl("https://api.soundcloud.com/tracks/12303577/stream");
}



//load the mp3 file 
function loadFileWithStramUrl(stream_url) {
    var req = new XMLHttpRequest();
    req.open("GET", stream_url + "?client_id=7dba0507b27063e9f49168e856f7e09e", true);
    //we can't use jquery because we need the arraybuffer type 
    req.responseType = "arraybuffer";
    req.onload = function() {
        //decode the loaded data 
        if (ctx.activeSourceCount > 0) {
            src.stop();
        }
        
        ctx.decodeAudioData(req.response, function(buffer) {

            buf = buffer;
            play();
        });
    };
    req.send();
}

function play() {
    //create a source node from the buffer 
   
    src.buffer = buf;

    //create fft 
    fft = ctx.createAnalyser();
    fft.fftSize = samples;

    //connect them up into a chain 
    src.connect(fft);
    fft.connect(ctx.destination);

    //play immediately 
        src.start(0);
    
    
    setup = true;
}

var gfx;

function setupCanvas() {
    canvas = document.getElementById('paper');
    sizeCanvas();

    gfx = canvas.getContext('2d');
    webkitRequestAnimationFrame(update);
}

$(window).on('resize', function(event) {
    sizeCanvas();

});

function sizeCanvas(){
    canvas.width = $(window).width();
    w=canvas.width;
    h=canvas.height;
}

function update() {
        var vpad = 14;
    webkitRequestAnimationFrame(update);
    if (!setup) return;
    
    gfx.clearRect(0, 0, w, h);
    gfx.fillStyle = '#070c15';
    gfx.fillRect(0, 0, w, h);

    var data = new Uint8Array(samples);
    fft.getByteFrequencyData(data);
    var my_gradient = gfx.createLinearGradient(0, vpad, 0, h-2*vpad);
    my_gradient.addColorStop(0.0, "#fa2b30");
    my_gradient.addColorStop(0.2, "#0e5dc3");
    my_gradient.addColorStop(0.7, "#75f86f");
    my_gradient.addColorStop(1, "#75f86f");
    



    for (var i = 0; i < data.length; i++) {
        gfx.fillStyle = my_gradient;
        gfx.fillRect(4 + i * 7, h-(data[i] / (255) * (h-2*vpad))-vpad, 6, 1);

        if (i%20!==0) {continue;}
        var freq = Math.floor(ctx.sampleRate / fft.fftSize * i+1)/1000;
        gfx.font = '7px sans-serif';
        gfx.textBaseline = 'bottom';
        gfx.fillStyle = '#56607b';
        gfx.fillText(freq, 4 + i * 7, h-2);
    
    }

}