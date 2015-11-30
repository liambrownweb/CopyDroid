//(function(){
	if ('addEventListener' in document) {
		document.addEventListener('DOMContentLoaded', function(){
			FastClick.attach(document.body);
		}, false);
	}
    var board_lock = false,
		canvas,
        colors,
        context,
        datautils = createjs.DataUtils,
        default_colors = ["Red", "Yellow", "Green", "Blue"],
        domutils = createjs.DomUtils,
        easel = createjs.EaselJS,
		framerate = 30,
		game_level = 1,
        preload = createjs.PreloadJS,
        requestutils = createjs.RequestUtils,
		shapes = [],
		speed = 40,
        stage,
		sys_sequence = [],
		user_sequence = [];

	var execMoves = function () {
		var i = 0,
			change,
			current,
			length = execMoves.moves.length,
			target;
		if (!length) return;
		for (; i < length; i += 1) {
			current = execMoves.moves[i];
			if (current.current_step == current.step_count) {
				execMoves.moves.splice(i, 1);
				if (i) {
					i--;
				} else {
					continue;
				}
			} else {
				target = current['target'];
				for (change in current['step_sizes']) {
					target[change] += current['step_sizes'][change];
					current['current_step'] += 1;
				}
			}
		}
	}
	execMoves.moves = [];
	/*
	 * Registers a new change to execute immediately.
	 * Options: an object with the following members.
	 * 	target: the target to alter
	 * 	changes: the changes to make in the target's attributes
	 * 	duration: the duration of the animated change
	 * 	easing: not yet implemented
	 */
	execMoves.register = function (options) {
		var current_change,
			index,
			new_move,
			step_sizes = {},
			step_count = framerate * (options['duration'] / 1000);
		for (index in options['changes']) {
			if (!options['changes'].hasOwnProperty(index)) continue;
			current_change = options['changes'][index];
			step_sizes[index] = (current_change - options['target'][index]) / step_count;
		}
		new_move = {
			"target": options['target'],
			"step_sizes": step_sizes,
			"step_count": step_count,
			"current_step": 0,
		};
		execMoves.moves.push(new_move);
	}
	function initGame() {
		var width = canvas.width / 2,
			height = canvas.height / 2,
			padding = 3 * width / 40,
			sq_width = width - 1.5 * padding,
			sq_height = height - 1.5 * padding,
			col_2 = sq_width + 2 * padding,
			row_2 = sq_height + 2 * padding;
		colors = default_colors;
		shapes[0] = initSquare(padding, padding, sq_width, sq_height, 0);
		shapes[1] = initSquare(col_2, padding, sq_width, sq_height, 1);
		shapes[2] = initSquare(padding, row_2, sq_width, sq_height, 2);
		shapes[3] = initSquare(col_2, row_2, sq_width, sq_height, 3);
	}
	function generateSequence(length) {
		if (typeof length != "number") {
			length = 1;
		}
		var i,
			sequence = [];
		for (i = 0; i < length; i += 1) {
			sequence[i] = Math.round(Math.random() * 3);
		}
		return sequence;
	}
	function initSquare(x, y, width, height, colornum) {
		var square = new createjs.Shape(),
			rounding = width * 0.1;
		//square.direction = dir;
        square.graphics.beginFill(colors[colornum]).drawRoundRectComplex(0, 0, width, height, rounding, rounding, rounding, rounding);
        square.alpha = 0.4;
        square.x = x;
        square.y = y;
		square.width = 50;
		square.height = 50;
		square.blink = function(duration) {
			if (typeof duration == "undefined") {
				duration = 500;
			}
			square.alpha = 1;
			setTimeout(function () {
				createjs.Tween.get(square).to({alpha: 0.4}, 100, createjs.Ease.quadIn());
			}, 
			duration - 100);
		};
		square.flash = function(duration) {
			if (typeof duration == "undefined") {
				duration = 500;
			}
			square.alpha = 1;
			execMoves.register({"target": square, "changes": {"alpha": 0.4}, "duration": 500, "easing": "easeIn"});
		};
        square.on("click", function(b,a){
			if (board_lock) return;
			square.flash();
			userInput(colornum);
		}, null, false)
		return square;
	}
    function blinkOneLight(ord, idx, time){
		var duration = time * 0.6;
    	setTimeout(function () {
    		shapes[idx].blink(duration);
    	},
    	time * ord);
    }
	function congratulateUser() {
		console.log("Congrats!");
	}
    function playSequence(sequence, time_per_flash) {
		board_lock = true;
    	if (!Array.isArray(sequence)) {
    		return;
    	}
    	var i = 0,
    		len = sequence.length;
    	for (; i < len; i += 1) {
    		blinkOneLight(i, sequence[i], time_per_flash)
    	}
		setTimeout(function () {
			board_lock = false;
		}, len * time_per_flash + 100);
    }
    function start() {
        canvas = document.getElementById('main_canvas');
        
        canvas.height=canvas.parentElement.clientHeight * window.devicePixelRatio;
        canvas.width=canvas.parentElement.clientWidth * window.devicePixelRatio;
        canvas.onmousedown = function(a){window.isClicked = true;};
        canvas.onmouseup= function(a){window.isClicked = false;};
        canvas.onmousemove=function(a){if (window.isClicked) {}};

        stage= new createjs.Stage("main_canvas");
        createjs.Touch.enable(stage);
		createjs.Ticker.timingMode = createjs.Ticker.RAF;
		initGame(stage);
        for (i in shapes) {
			stage.addChild(shapes[i]);
		}
        stage.update();
		var frametime = 1000 / framerate;
		setInterval(updateGame, frametime);
		testUser();
    }
	function testUser() {
		sys_sequence = generateSequence (game_level);
		playSequence(sys_sequence, 1000);
	}
	function updateGame() {
		execMoves();
		stage.update();
	}
	
	function userInput(button) {
		var i = user_sequence.length;
		if (sys_sequence[i] == button) {
			user_sequence[i] = button;
		} else {
			setTimeout(function () {
				game_level = 1;
				user_sequence = [];
				testUser();
			}, 1000);
		}
		if (user_sequence.toString() == sys_sequence.toString()) {
			setTimeout(function () {
				congratulateUser();
				game_level++;
				user_sequence = [];
				testUser();
			}, 1000);
		}
	}
    start();
//}());
