
var s = 16;

var sprite_pixels = 128; // sprite is 128 width
var level_pixels = 64; //level is 64x64 pixels

class GL {
    constructor(element) {
    	this.gl = element.getContext('webgl') || element.getContext('experimental-webgl'),
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.viewport(0,0,element.width,element.height);

  		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());

		this.texture_size = sprite_pixels*level_pixels; 
		this.tile_size = sprite_pixels;

	    this.max_verts = level_pixels*level_pixels*4;
	    //num_verts = 0;
	    this.buffer_data = new Float32Array(this.max_verts*8);// allow 64k verts, 8 properties per vert

		this.max_lights = 16, this.num_lights = 0;
		this.light_data = new Float32Array(this.max_lights*7); // 32 lights, 7 properties per light

		this.camera_x = 0, this.camera_y = 0, this.camera_z = 0;
    }

    compile_shader(shader_type, shader_source) {
		var shader = this.gl.createShader(shader_type);
		this.gl.shaderSource(shader, shader_source);
		this.gl.compileShader(shader);
		return shader;
	};

	enable_vertex_attrib(name, size, vertex_size, offset) {
		var location = this.gl.getAttribLocation(this.program, name);
		this.gl.enableVertexAttribArray(location);
		this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, vertex_size*4, offset*4);
	}

	perspectiveMatrix(fieldOfViewInRadians, aspectRatio, near, far) {
	  var f = 1.0 / Math.tan(fieldOfViewInRadians / 2);;
	  var rangeInv = 1 / (near - far);
	 
	  return [
	    f / aspectRatio, 0,                          0,   0,
	    0,               f,                          0,   0,
	    0,               0,    (near + far) * rangeInv,  -1,
	    0,               0,  near * far * rangeInv * 2,   0
	  ];
	}

    renderer_init() {
		var shader_varying = 
			'precision highp float;' +
			'varying vec3 varying_light;' +
			'varying vec2 varying_uv;',

		 vertex_shader = 
			shader_varying + 
			"attribute vec3 position;" +
			"attribute vec2 uv;" +
			"attribute vec3 norm;" +
			"uniform vec3 camera;" +
			"uniform float light[7*"+this.max_lights+"];" +
			"const mat4 view=mat4(1,0,0,0,  \
				0,.707,.707,0, \
				0,-.707,.707,0,  \
				0,-22.627,-22.627,1);" + // view
			"const mat4 projection=mat4("+ this.perspectiveMatrix(Math.PI * 0.5, 
			  window.innerWidth / window.innerHeight, 1, 50000) + ");"+ // projection
			"void main(void){" +
				"varying_light=vec3(1.0,1.0,1.0);" + // white color
				"for(int i=0; i<"+this.max_lights+"; i++) {"+
					"vec3 light_position=vec3(light[i*7],light[i*7+1],light[i*7+2]);" + // light position
					"varying_light+=vec3(light[i*7+3],light[i*7+4],light[i*7+5])" + // light color *
						"*max(dot(norm,normalize(light_position-position)),0.)" + // diffuse *
						"*(1./(light[i*7+6]*(" + // attentuation *
							"length(light_position-position)" + // distance
						")));" + 
				"}" +
				"varying_uv=uv;" +
				"gl_Position=projection*view*(vec4(position+camera,1.));" +
			"}",

		 fragment_shader =
			shader_varying + 
			"uniform sampler2D sample;" +
			"void main(void){" +
				"vec4 texture=texture2D(sample,varying_uv);" +
				"if(texture.a<.8)" + // 1) discard alpha
					"discard;" + 
				"if(texture.r>0.95&&texture.g>0.25&&texture.b==0.0)" + // 2) red glowing spider eyes
					"gl_FragColor=texture;" +
				"else{" +  // 3) calculate color with lights and fog
					"gl_FragColor=texture*vec4(varying_light,1.);" +
					"gl_FragColor.rgb*=smoothstep(" +
						"1500.,1.," + // fog far, near
						"gl_FragCoord.z/gl_FragCoord.w" + // fog depth
					");" +
				"}" +
				"gl_FragColor.rgb=floor(gl_FragColor.rgb*99.9999)/99.9999;" + // reduce colors to ~256
			"}";
		console.log(vertex_shader);

		var shader_program = this.gl.createProgram();
		this.gl.attachShader(shader_program, this.compile_shader(this.gl.VERTEX_SHADER, vertex_shader));
		this.gl.attachShader(shader_program, this.compile_shader(this.gl.FRAGMENT_SHADER, fragment_shader));
		this.gl.linkProgram(shader_program);
		this.gl.useProgram(shader_program);
    	this.program = shader_program;

		this.camera_uniform = this.gl.getUniformLocation(shader_program, "camera");
		this.light_uniform = this.gl.getUniformLocation(shader_program, "light");

		this.enable_vertex_attrib('position', 3, 8, 0);
		this.enable_vertex_attrib('uv', 2, 8, 3);
		this.enable_vertex_attrib('norm', 3, 8, 5);
	}

	renderer_bind_image(image) {
		var texture_2d = this.gl.TEXTURE_2D;
		this.gl.bindTexture(texture_2d, this.gl.createTexture());
		this.gl.texImage2D(texture_2d, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
		this.gl.texParameteri(texture_2d, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(texture_2d, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(texture_2d, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(texture_2d, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	}

	push_quad(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4, nx, ny, nz, tile) {
		var tile_fraction = this.tile_size / this.texture_size;
		var px_nudge = 0.0 / this.texture_size;
		var u = tile * tile_fraction + px_nudge;
		this.buffer_data.set([
			x1, y1, z1, u, 0, nx, ny, nz, // x,y,x,u,v,n
			x2, y2, z2, u + tile_fraction - px_nudge, 0, nx, ny, nz,
			x3, y3, z3, u, 1, nx, ny, nz,
			x2, y2, z2, u + tile_fraction - px_nudge, 0, nx, ny, nz,
			x3, y3, z3, u, 1, nx, ny, nz,
			x4, y4, z4, u + tile_fraction - px_nudge, 1, nx, ny, nz
		], num_verts * 8);
		num_verts += 6;
	};

	push_floor(x, z, s, tile) {
		this.push_quad(x, 0, z, x + s, 0, z, x, 0, z + s, x + s, 0, z + s, 0,1,0, tile);
	};

    push_block(x, z, s, tile_top, tile_sites) {
		// tall blocks for certain tiles
		var y = ~[8, 9, 17].indexOf(tile_sites) ? 2*s : s;

		this.push_quad(x, y, z, x + s, y, z, x, y, z + s, x + s, y, z + s, 0, 1, 0, tile_top); // top
		this.push_quad(x + s, y, z, x + s, y, z + s, x + s, 0, z, x + s, 0, z + s, 1, 0, 0, tile_sites); // right
		this.push_quad(x, y, z + s, x + s, y, z + s, x, 0, z + s, x + s, 0, z + s, 0, 0, 1, tile_sites); // front
		this.push_quad(x, y, z, x, y, z + s, x, 0, z, x, 0, z + s, -1, 0, 0, tile_sites); // left
	};


	push_sprite(x, y, z, tile) {
		// Only push sprites near to the camera
		if (
			Math.abs(-x - this.camera_x) < 128 && 
			Math.abs(-z - this.camera_z) < 128
		) {
			var tilt = s+(this.camera_z + z)/(2*s); // tilt sprite when closer to camera
			this.push_quad(x, y + s, z, 
				x + s, y + s, z, 
				x, y, z + tilt, 
				x + s, y, z + tilt, 
				0, 0, 1, tile);
		}
	}

	push_light(x, y, z, r, g, b, falloff) {
		// Only push lights near to the camera
		var max_light_distance = (128 + 1/falloff); // cheap ass approximation
		if (
			this.num_lights < this.max_lights &&
			Math.abs(-x - this.camera_x) < max_light_distance &&
			Math.abs(-z - this.camera_z) < max_light_distance
		) {
			this.light_data.set([x, y, z, r, g, b, falloff], this.num_lights*7);
			this.num_lights++;
		}
	}

	renderer_prepare_frame() {
		num_verts = level_num_verts;
		this.num_lights = 0;

		// reset all lights
		this.light_data.fill(1);
	}

	renderer_end_frame() {

		this.gl.clearColor(0,0,0,1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);

		this.gl.uniform3f(this.camera_uniform, this.camera_x, this.camera_y - 10, this.camera_z-30);
		this.gl.uniform1fv(this.light_uniform, this.light_data);

		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.buffer_data, this.gl.DYNAMIC_DRAW);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, num_verts);
	}
}
