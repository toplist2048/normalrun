		var canvas = document.getElementById("c");
		var width = canvas.clientWidth;
		var height = canvas.clientHeight;
		if (canvas.width != width ||
		  canvas.height != height) {
			canvas.width = width;
			canvas.height = height;
	    }

var _gl = new GL(c);

terminal.write_text(['INITIATING AUDIO...'], step2);

function step2() {
	audio_init();
	terminal.write_text(['INITIATING VIDEO...'], step3);
}

function step3() {
	_gl.renderer_init();
	terminal_run_intro(step4);				
}

function step4() {
	load_image('q2', step5);			
}

function step5() {
	terminal.hide();
	_gl.renderer_bind_image(this);
	next_level(game_tick);
}