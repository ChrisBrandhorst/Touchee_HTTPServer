var Logger = new JS.Singleton({

	levels: {
		none: 	0,
		error: 	1,
		warn: 	2,
		info: 	3,
		debug: 	4
	},

	level: function(value) {
		if (value) this._level = value;
		return this._level || this.levels.error;
	},

	error: function(message) { console.error(message); },
	warn: function(message) { if (this.level() >= this.levels.warn) console.warn(message); },
	info: function(message) { if (this.level() >= this.levels.info) console.info(message); },
	debug: function(message) { if (this.level() >= this.levels.debug) console.debug(message); }
	
});
