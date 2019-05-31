
var DecibelMeter = ( function ( window, navigator, document, undefined ) {
	
	// user media
	
	if (!navigator.getUserMedia)
		navigator.getUserMedia = navigator.webkitGetUserMedia
								|| navigator.mozGetUserMedia
								|| navigator.msGetUserMedia;
	
	if (!navigator.getUserMedia) {
		throw new Error('DecibelMeter: getUserMedia not supported');
		return undefined;
	}
	
	
	// audio context
	
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	
	if (!window.AudioContext) {
		throw new Error('DecibelMeter: AudioContext not supported');
		return undefined;
	}
	
	
	// audio sources
	
	if (!navigator.mediaDevices) {
		throw new Error('DecibelMeter: MediaStreamTrack not supported');
		return undefined;
	}
	
	if (!navigator.mediaDevices.enumerateDevices) {
		throw new Error('DecibelMeter: mediaDevices.enumerateDevices() not supported');
		return undefined;
	}
	
	var sources = [],
		sourcesIndex = {},
		sourcesReady = false;
	
	navigator.mediaDevices.enumerateDevices().then(function(srcs){		
		srcs.forEach( function (source) {
			if (source.kind === 'audiooutput') {
				sources.push(source);
				sourcesIndex[source.id] = source;
			}
		});
		
		sourcesReady = true;
		
		// let meters know that audio sources are ready now
		
		meters.forEach(function (meter) {
			dispatch(meter, 'ready', [meter, sources]);
		});
	});
	
	// util
	
	function connectTo(source, meter, callback) {
		
		var oldSource = meter.source,
			changing = oldSource !== null,
			constraints = { audio: { optional: [{sourceId: source.id}] } };	
		
		meter.source = source;
		
		function success(stream) {
			var connection = {};
			
			connection.stream = stream;
			connection.context = new AudioContext();
			connection.source = connection.context.createMediaStreamSource(stream);
			connection.analyser = connection.context.createAnalyser();
			connection.analyser.smoothingTimeConstant = .5;
			connection.analyser.frequencyBinCount = 16;
			connection.lastSample = new Uint8Array(1);
			
			meter.connection = connection;
			meter.connected = true;
			
			if (callback)
				callback.call(meter, meter, source);
		
			if (changing && meter.handle.sourceChange)
				dispatch(meter, 'source-change', [source, oldSource, meter]);
			
			if (meter.handle.connect)
				dispatch(meter, 'connect', [meter, source]);
		}
		
		function error() {
			alert('Error connecting to source');
		}
		
		navigator.getUserMedia(constraints, success, error);
	}
	
	function dispatch(meter, eventName, params) {
		var h = meter.handle[eventName],
			n = h.length;
		
		if (n === 0) return;
		
		var i = 0;
		
		for (; i < n; i++)
			if (true === h[i].apply(meter, params)) break;
	}
	
	// class
	
	function DecibelMeter(id, opts) {
		this.id = id;
		this.opts = opts;
		this.source = null;
		this.listening = false;
		this.connection = null;
		this.connected = false;
		this.handle = {
			ready: 				opts.ready ? [opts.ready] : [],
			sample: 			opts.sample ? [opts.sample] : [],
			connect: 			opts.connect ? [opts.connect] : [],
			disconnect: 		opts.disconnect ? [opts.disconnect] : [],
			"source-change":	opts.sourceChange ? [opts.sourceChange] : [],
			listen: 			opts.listen ? [opts.listen] : [],
			"stop-listening": 	opts.stopListeing ? [opts.stopListening] : []
		};
		
		this.startLoop();
	}
	
	DecibelMeter.prototype.getSources = function () {
		return sources;
	};
	
	DecibelMeter.prototype.connect = function (source, callback) {
		
		if (!sourcesReady)
			throw new Error('DecibelMeter: Audio sources not ready');
		
		if (!source)
			throw new Error('DecibelMeter: No audio source specified');
		
		if (typeof source === 'string' || typeof source === 'number') {
			
			source = sourcesIndex[source];
			
			if (!source)
				throw new Error('DecibelMeter: Attempted to select invalid audio source');
		}
		
		if (this.source === source) return; // already connected to this source
		
		connectTo(source, this, callback);
		return this;
	};
	
	DecibelMeter.prototype.disconnect = function () {
		if (this.connection === null) return this;
		
		this.stopListening();
		this.connection.stream.stop();
		this.connection.stream = null;
		this.connection = null;
		this.source = null;
		this.connected = false;
		
		dispatch(this, 'disconnect', [this]);
		
		return this;
	};
	
	DecibelMeter.prototype.listen = function () {
		if (this.listening) return;
		
		if (this.source === null)
			throw new Error('DecibelMeter: No source selected');
		
		if (this.connection === null)
			throw new Error('DecibelMeter: Not connected to source');
		
		this.connection.source.connect(this.connection.analyser);
		this.listening = true;
		
		dispatch(this, 'listen', [this]);
	};
	
	DecibelMeter.prototype.stopListening = function () {
		if (!this.listening) return;
		
		if (this.source === null)
			throw new Error('DecibelMeter: No source selected');
		
		if (this.connection === null)
			throw new Error('DecibelMeter: Not connected to source');
		
		this.connection.source.disconnect(this.connection.analyser);
		this.listening = false;
		
		dispatch(this, 'stop-listening', [this]);
	};
	
	DecibelMeter.prototype.startLoop = function () {
		
		var meter = this;
		
		function update() {
			
			if (meter.listening && meter.handle.sample) {
				
				meter.connection.analyser.getByteFrequencyData(meter.connection.lastSample);
				
				var value = meter.connection.lastSample[0],
					percent = value / 255,
					dB = meter.connection.analyser.minDecibels + ((meter.connection.analyser.maxDecibels - meter.connection.analyser.minDecibels) * percent);
				
				dispatch(meter, 'sample', [dB, percent, value]);
			}
			
			requestAnimationFrame(update);
		}
		
		update();
	};
	
	DecibelMeter.prototype.on = function (eventName, handler) {
		if (this.handle[eventName] === undefined) return this;
		this.handle[eventName].push(handler);
		return this;
	};
	
	
	// api
	
	var meters = [],
		metersIndex = {};
	
	return {
		create: function (id, opts) {
			id = id || ['db', new Date().getTime(), Math.random()].join('-');
			var meter = new DecibelMeter(id, opts || {});
			metersIndex[id] = meter;
			meters.push(meter);
			return meter;
		},
		
		getMeterById: function (id) {
			return metersIndex[id] || null;
		},
		
		getMeters: function () {
			return meters;
		}
	};			
	
})( window, navigator, document );


// ---------------------- 飞机分贝控制 ---------------------- 

var dbControl = document.getElementById('Tooltip-1'),
dbBar = document.getElementById('db-bar'),
dbValue = document.getElementById('db-value'),
dbBlock = document.getElementById('db');

// Decibel Meter
var meter_test = DecibelMeter.create('meter');

// 麦克风准备
meter_test.on('ready', function (meter_test, sources) {
	var mic = sources[0]; // select first mic
	meter_test.connect(mic); // connect to mic
});

// 测量分贝大小
meter_test.on('sample', function (dB, percent, level) {
	dbBar.style.width = (percent * 100) + '%';
	dbValue.innerHTML = Math.floor(percent * 100) + '%';

	console.log(percent * 100)

	mousePos = { x: mousePos.x, y: percent * 100 - 10 }
});

// 开启语音控制后，显示分贝条
meter_test.on('listen', function (meter_test) {
	dbBlock.style.display = "block";
});

// 关闭语音控制后，分贝条消失
meter_test.on('stop-listening', function (meter_test) {
	dbBlock.style.display = "none";
	dbBar.style.width = 0;
});

// 点击麦克风图标开启语音控制
dbControl.addEventListener('click', function (e) {
	if (meter_test.listening) meter_test.stopListening();
	else meter_test.listen();
});