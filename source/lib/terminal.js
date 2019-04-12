class Terminal {
  constructor(element, prompt, beep) {
    this.text_buffer = [],
    this.buffer_size_max = 20,
    this.line_wait = 100,
    this.print_prompt = true,
    this.timeout_id = 0,
    this.hide_timeout = 0;

  	this.element = element;
  	this.prompt = prompt;
    this.beep = beep;

    this.cursor_style();
  }

  cursor_style() {
    var style = document.createElement('style');
    style.innerHTML = 'b#cursor{animation: r 1s infinite;} @keyframes r {50%{opacity:0;}}';
    var ref = document.querySelector('script');
    ref.parentNode.insertBefore(style, ref);
  }  
  
  show() {
	  window.clearTimeout(this.hide_timeout);
	  this.element.style.opacity = 1;
	  this.element.style.display = 'block';
  }

  hide() {
    var that = this;
	  this.hide_timeout = window.setTimeout(function(){that.element.style.display = 'none'}, 1000);
	  this.element.style.opacity = 0;
  }

  cancel() {
	  clearTimeout(this.timeout_id);
  }

  prepare_text(text) {
    return text.replace(/_/g, '\n').split('\n');
  }

  write_line(line, lines, callback, param) {
  	if (this.text_buffer.length > this.buffer_size_max) {
  		this.text_buffer.shift();
  	}
  	if (line) {
  		this.beep();
  		this.text_buffer.push((this.print_ident ? this.text_ident : '') + line);
  		this.element.innerHTML = 
        '<div>'+this.text_buffer.join('&nbsp;</div><div>')+'<b id="cursor">█</b></div>';
    } 
    this.timeout_id = setTimeout(this.write_text.bind(this), this.line_wait, lines, callback, param);
  }


  write_text(lines, callback, param) {
  	if (lines && lines.length) {
      var line = lines.shift();
  	  this.write_line(line, lines, callback, param);
  	}
    else {
      callback && callback(param);
    }
  }

  show_notice(notice, callback) {
    this.element.innerHTML = '';
    this.text_buffer = [];

    this.cancel();
    this.show();
    var that = this;
    this.write_text(this.prepare_text(notice), function(){
      that.timeout_id = setTimeout(function(){
        that.hide();
        callback && callback();
      }, that.line_wait);
    });
  }  
}