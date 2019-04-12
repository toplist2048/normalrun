var terminal_text_ident = '&gt; ';
var terminal_text_title = '' +
	'UNDERRUN\n' +
	'__ \n' +
	'CONNECTING...';

var terminal_text_garbage = 
	'´A1e{∏éI9·NQ≥ÀΩ¸94CîyîR›kÈ¡˙ßT-;ûÅf^˛,¬›A∫Sã€«ÕÕ' +
	'1f@çX8ÎRjßf•ò√ã0êÃcÄ]Î≤moDÇ’ñ‰\\ˇ≠n=(s7É;';

var terminal_text_story = 
	'CRITICAL SOFTWARE FAILURE DETECTED\n' +
	'ANALYZING...\n' +
	'_ \n' +
	'USE WASD OR CURSOR KEYS TO MOVE, MOUSE TO SHOOT\n' +
	'CLICK TO INITIATE YOUR DEPLOYMENT\n ';

var terminal_text_outro = 
	'END OF TRANSMISSION' +
	'__ \n' +
	'Bye...';



var terminal = new Terminal(a, "&gt;", function play(){ 
	audio_play(audio_sfx_terminal); 
});


function terminal_run_intro(callback) {
	terminal.write_text(terminal.prepare_text(terminal_text_title)
		,terminal_run_garbage, callback);
}

function terminal_run_garbage(callback) {
	terminal.print_prompt = false;

	var t = terminal_text_garbage,
		length = terminal_text_garbage.length;

	for (var i = 0; i < 2; i++) {
		var s = (Math.random()*length)|0;
		var e = (Math.random()*(length - s))|0;
		t += terminal_text_garbage.substr(s, e) + '\n';
	}
	t += ' \n \n';
    terminal.write_text(terminal.prepare_text(t), terminal_run_story, callback);
    terminal.print_prompt = true;
}

function terminal_run_story(callback) {
	terminal.write_text(terminal.prepare_text(terminal_text_story), callback);
}

function terminal_run_outro(callback) {
	c.style.opacity = 0.3;
	a.innerHTML = '';

	terminal.write_text(terminal.prepare_text(terminal_text_outro), callback);
}
