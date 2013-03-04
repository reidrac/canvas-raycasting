// requestAnimationFrame support
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());


var Player = function(x, y) {
	var me = {
		// position
		x : x+0.5,
		y : y+0.5, // center in the tile
		// direction
		dx: 1.0,
		dy: 0.0,
		// camera
		cx: 0.0,
		cy: 0.66, // FOV: 66°

		speed: 0.12, 
		rotspeed: 0.1,

		up : false,
		down : false,
		right : false,
		left : false
	};

	me.init = function() {

		// precalculate these
		me.cos_rotspeedp = Math.cos(me.rotspeed);
		me.cos_rotspeedn = Math.cos(-me.rotspeed);
		me.sin_rotspeedp = Math.sin(me.rotspeed);
		me.sin_rotspeedn = Math.sin(-me.rotspeed);

		document.addEventListener("keydown", me.key_down, false);
		document.addEventListener("keyup", me.key_up, false);
	};

	me.update = function(map) {

		var change_x = me.dx * me.speed,
			change_y = me.dy * me.speed,
			cx, dx;

		if(me.up) {
			if(map.is_free(Math.floor(me.x + change_x), Math.floor(me.y))) {
				me.x += change_x;
			}
			if(map.is_free(Math.floor(me.x), Math.floor(me.y + change_y))) {
				me.y += change_y;
			}
		}

		if(me.down) {
			if(map.is_free(Math.floor(me.x - change_x), Math.floor(me.y))) {
				me.x -= change_x;
			}
			if(map.is_free(Math.floor(me.x), Math.floor(me.y - change_y))) {
				me.y -= change_y;
			}
		}

		if(me.left) {
			dx = me.dx;
			me.dx = dx * me.cos_rotspeedn - me.dy * me.sin_rotspeedn;
			me.dy = dx * me.sin_rotspeedn + me.dy * me.cos_rotspeedn;
			cx = me.cx;
			me.cx = cx * me.cos_rotspeedn - me.cy * me.sin_rotspeedn;
			me.cy = cx * me.sin_rotspeedn + me.cy * me.cos_rotspeedn;
		}

		if(me.right) {
			dx = me.dx;
			me.dx = dx * me.cos_rotspeedp - me.dy * me.sin_rotspeedp;
			me.dy = dx * me.sin_rotspeedp + me.dy * me.cos_rotspeedp;
			cx = me.cx;
			me.cx = cx * me.cos_rotspeedp - me.cy * me.sin_rotspeedp;
			me.cy = cx * me.sin_rotspeedp + me.cy * me.cos_rotspeedp;
		}

	};

	me.key_down = function(event) {
		// left
		if(event.keyCode == 37) {
			me.left = true;
		}
        // right
        if(event.keyCode == 39) {
			me.right = true;
		}
        // up
        if(event.keyCode == 38) {
			me.up = true;
		}
        // down
        if(event.keyCode == 40) {
			me.down = true;
		}
	};

	me.key_up = function(event) {
		// left
		if(event.keyCode == 37) {
			me.left = false;
		}
        // right
        if(event.keyCode == 39) {
			me.right = false;
		}
        // up
        if(event.keyCode == 38) {
			me.up = false;
		}
        // down
        if(event.keyCode == 40) {
			me.down = false;
		}
	};

	me.init();

	return me;
};

var Obj = function(name, x, y, size, texture) {
	var me = {
		name : name,
		x : x,
		y : y,
		size : size, // 0..1 (for a 256x256 wall texture)
		texture : texture
	};

	me.distance = function(x, y) {
		return Math.pow(x-me.x, 2) + Math.pow(y-me.y, 2);
	};

	return me;
};

var Objects = function() {
	var me = {
		textures : [],
		objs : []
	};

	me.init = function() {
		var ver = 1, // increase this for refreshing the cache
			i,
			files = [ 'img/object.png' ];
		
		for(i=0; i<files.length; i++) {
			me.textures[i] = new Image();
			me.textures[i].src = files[i] + "?" + ver;
		}
	};

	me.add = function(name, x, y, size, texture) {
		me.objs[me.objs.length] = Obj(name, x, y, size, texture);
	};

	me.remove = function(index) {
		delete me.objs[index];
	};

	me.sorted = function(x, y) {
		var o, t = [];
		for(o in me.objs) {
			t[t.length] = { obj : me.objs[o], dist : me.objs[o].distance(x, y) };
		}
		return t.sort(function(a, b) { return b.dist-a.dist; });
	};

	me.get_texture = function(idx) {
		return me.textures[idx];
	};

	me.init();

	return me;
};

var Map = function() {
	var me = {
		UNUSED : -1,
		FREE : 0,
		BLOCK : 1,
		MOVEABLE : 2,

		name : 'Test Dungeon',
		data : [ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
				 1,0,0,0,0,0,0,0,1,1,1,0,0,0,1,0,0,0,0,1,
				 1,0,1,1,0,1,1,0,0,1,1,0,0,0,0,0,0,1,0,1,
				 1,0,1,1,0,1,1,0,0,0,0,0,1,1,0,1,0,0,0,1,
				 1,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1,0,1,
				 1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,
				 1,0,0,0,1,1,1,0,0,0,1,1,0,0,0,0,0,1,1,1,
				 1,0,0,0,1,1,1,0,0,0,0,0,0,1,0,1,0,1,1,1,
				 1,1,0,1,1,1,1,0,0,0,1,1,0,0,0,0,0,1,1,1,
				 1,1,0,0,1,1,1,1,0,1,1,1,0,1,0,1,0,1,1,1,
				 1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,
				 1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,
				 1,1,1,1,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,
				 1,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,
				 1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,
				 1,1,0,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,
				 1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,0,1,1,1,1,
				 1,1,1,1,1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,
				 1,1,1,1,1,1,0,0,0,1,1,1,1,0,1,1,1,0,1,1,
				 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
			     ],
		automap : [],
		// up to 33 x 23
		width : 20,
		height : 20,

		textures : [],
		bg : undefined,

		floor0 : 'rgb(0, 0, 0)',
		floor1 : 'rgb(80, 90, 100)',
		ceiling0 : 'rgb(0, 0, 0)',
		ceiling1 : 'rgb(80, 80, 80)',

		objs : Objects()
	};

	me.init = function() {
		var ver = 1, // increase this for refreshing the cache
			i,
			files = [ '', 'img/wall.jpg'];
		
		for(i=0; i<files.length; i++) {
			me.textures[i] = new Image();
			me.textures[i].src = files[i] + "?" + ver;
		}

		for(i=0; i<me.width*me.height; i++) {
			me.automap[i] = me.UNUSED;
		}

		me.bg = new Image();
		me.bg.src = 'img/map.jpg?' + ver;

		me.objs.add('Blue potion', 3.5, 1.5, 0.2, 0);
		me.objs.add('Blue potion', 7.5, 2.25, 0.2, 0);
		me.objs.add('Blue potion', 7.5, 2.75, 0.2, 0);
	};

	me.texture = function(idx) {
		return me.textures[idx];
	};

	me.get_texture = function(x, y) {
		return me.texture(me.data[y*me.width + x]);
	};

	me.is_free = function(x, y) {
		if(x<0 || x>=me.width || y<0 || y>=me.height) {
			return false;
		}
		return me.data[y*me.width + x] == 0;
	};

	me.record_auto = function(x, y) {
		me.automap[y*me.width + x] = me.data[y*me.width + x];
	};

	me.get_auto = function(x, y) {
		return me.automap[y*me.width + x];
	};

	me.init();

	return me;
};

var Application = function(id) {
	var me = {
		id : id,
		canvas : undefined,
		canvas_ctx : undefined,

		buffer : undefined,
		ctx : undefined,

		map : Map(),
		player : Player(1, 1),

		show_map : false,

		// canvas size
		width : 512,
		height : 400,

		// 3D scene size
		_width : 512,
		_height : 400,

		fps : 60,
		_time : Date.now(),
		_frames : 0
	};

	me.setup = function() {
		me.canvas = document.getElementById(me.id);

		if(me.canvas.getContext) {
			me.canvas.width = me.width;
			me.canvas.height = me.height;
			me.canvas.style.background = "rgb(0, 0, 0)";

			me.buffer = document.createElement('canvas');
			me.buffer.width = me._width;
			me.buffer.height = me._height;

			me.ctx = me.buffer.getContext("2d");
			me.canvas_ctx = me.canvas.getContext("2d");

			return true;
		}
		return false;
	};

	me.resize = function() {
		// experimental fullscreen support
		if(document.webkitFullscreenElement || document.mozFullScreenElement) {
			// firefox seems to ignore these :(
			me.canvas.style.width = document.width + "px"; 
			me.canvas.style.height = document.height + "px"; 
		} else {
			me.canvas.style.width = "";
			me.canvas.style.height = "";
		}
	}

	me.draw = function() {
		me.ctx.clearRect(0, 0, me.width, me.height);

		// floor / ceiling 
		var grad = me.ctx.createLinearGradient(0, me._height/2, 0, me._height);
		grad.addColorStop(0, me.map.floor0);
		grad.addColorStop(1, me.map.floor1);
		me.ctx.fillStyle = grad
		me.ctx.fillRect(0, me._height/2, me._width, me._height/2);
		grad = me.ctx.createLinearGradient(0, 0, 0, me._height/2);
		grad.addColorStop(1, me.map.ceiling0);
		grad.addColorStop(0, me.map.ceiling1);
		me.ctx.fillStyle = grad
		me.ctx.fillRect(0, 0, me._width, me._height/2);

		var col,
			zBuffer = []; // used for sprites (objects)
		for(col=0; col<me._width; col++)
		{
			var camera, ray_x, ray_y, ray_dx, ray_dy, mx, my, delta_x,
				delta_y, step_x, step_y, horiz, wall_dist, wall_height,
				wall_x, draw_start, tex;
			
			camera = 2 * col / me._width - 1;
			ray_x = me.player.x;
			ray_y = me.player.y;
			ray_dx = me.player.dx + me.player.cx*camera;
			ray_dy = me.player.dy + me.player.cy*camera;
			mx = Math.floor(ray_x);
			my = Math.floor(ray_y);
			delta_x = Math.sqrt(1 + (ray_dy * ray_dy) / (ray_dx*ray_dx));
			delta_y = Math.sqrt(1 + (ray_dx * ray_dx) / (ray_dy*ray_dy));

			// initial step for the ray
			if(ray_dx < 0) {
				step_x = -1;
				dist_x = (ray_x - mx) * delta_x;
			} else {
				step_x = 1;
				dist_x = (mx + 1 - ray_x) * delta_x;
			}
			if(ray_dy < 0) {
				step_y = -1;
				dist_y = (ray_y - my) * delta_y;
			} else {
				step_y = 1;
				dist_y = (my + 1 - ray_y) * delta_y;
			}

			// DDA
			while(true) {
				if(dist_x < dist_y) {
					dist_x += delta_x;
					mx += step_x;
					horiz = true;
				} else {
					dist_y += delta_y;
					my += step_y;
					horiz = false;
				}

				// for automap
				me.map.record_auto(mx, my);

				if(!me.map.is_free(mx, my)) {
					break;
				}
			}

			// wall distance
			if(horiz) {
				wall_dist = (mx - ray_x + (1 - step_x) / 2) / ray_dx;
				wall_x = ray_y + ((mx - ray_x + (1 - step_x) / 2) / ray_dx) * ray_dy;
			} else {
				wall_dist = (my - ray_y + (1 - step_y) / 2) / ray_dy;
				wall_x = ray_x + ((my - ray_y + (1 - step_y) / 2) / ray_dy) * ray_dx;
			}
			wall_x -= Math.floor(wall_x);

			if(wall_dist < 0) {
				wall_dist = -wall_dist;
			}

			zBuffer[col] = wall_dist;

			wall_height = Math.abs(Math.floor(me._height / wall_dist));
			draw_start = -wall_height/2 + me._height/2;

			wall_x = Math.floor(wall_x * me.map.get_texture(mx, my).width);
			if(horiz && ray_dx > 0) {
				wall_x = me.map.get_texture(mx, my).width - wall_x -1;
			}
			if(!horiz && ray_dy < 0) {
				wall_x = me.map.get_texture(mx, my).width - wall_x -1;
			}

			tex = me.map.get_texture(mx, my);
			me.ctx.drawImage(tex, wall_x, 0, 1, tex.height, col, draw_start, 1, wall_height);

			// light
			var tint = (wall_height*1.6)/me._height;
			var c = Math.round(60/tint);
			c = 60-c;
			if(c<0) {
				c = 0;
			}
			tint = 1-tint;
			me.ctx.fillStyle = "rgba(" + c + ", " + c + ", " + c + ", " + tint + ")";
			me.ctx.fillRect(col, draw_start, 1, wall_height);

		}

		// sprites (Objects)
		var i, col, sprite_x, sprite_y, inv, trans_x, trans_y, screen_x,
			sprite_size, start_x, start_y, tex, tex_start_x, tex_x;

		var sprites = me.map.objs.sorted(me.player.x, me.player.y);
		for(i=0; i<sprites.length; i++) {
			sprite_x = sprites[i].obj.x - me.player.x;
			sprite_y = sprites[i].obj.y - me.player.y;

			inv = 1.0 / (me.player.cx*me.player.dy - me.player.dx*me.player.cy);
			trans_x = inv * (me.player.dy*sprite_x - me.player.dx*sprite_y);
			trans_y = inv * (-me.player.cy*sprite_x + me.player.cx*sprite_y);
			screen_x = Math.floor((me._width/2) * (1 + trans_x/trans_y));

			sprite_size = Math.abs(Math.floor(me._height/trans_y))*sprites[i].obj.size;
			start_y = Math.floor(-sprite_size/2 + me._height/2);
			if(start_y < 0) {
				start_y = 0;
			}

			start_x = Math.floor(-sprite_size/2 + screen_x);
			tex_start_x = 0;
			if(start_x < 0) {
				tex_start_x = -start_x;
				start_x = 0;
			}
			end_x = Math.floor(sprite_size/2 + screen_x);
			if(end_x >= me._width) {
				end_x = me._width - 1;
			}

			for(col=start_x; col<end_x; col++) {
				if(trans_y > 0 && col > 0 && col < me._width && trans_y < zBuffer[col]) {
					tex = me.map.objs.get_texture(sprites[i].obj.texture);
					tex_x = Math.floor((col - start_x) * tex.width / sprite_size);
					me.ctx.drawImage(tex, tex_start_x+tex_x, 0, 1, tex.height, col, start_y+Math.floor(256/trans_y)-sprite_size/2, 1, sprite_size);
				}
			}
		}

		me.canvas_ctx.clearRect(0, 0, me.canvas.width, me.canvas.height);
		me.canvas_ctx.drawImage(me.buffer, 0, 0);

		// FPS
		var time = Date.now();

		me._frames++;

		me.canvas_ctx.fillStyle = "rgb(255, 0, 0)";
		me.canvas_ctx.fillText("FPS: " + Math.round(me._frames*1000 / (time-me._time)), 1, me.height-5);

		if(time > me._time + me.fps*1000) {
			me._time = time;
			me._frames = 0;
		}
	};

	me.draw_map = function() {

		var i, j, s=15, d=5;

		me.ctx.drawImage(me.map.bg, 0, 0);

		me.ctx.save();
		me.ctx.font = 'bold 20pt MedievalSharp'
		me.ctx.textAlign = "center";
		me.ctx.fillStyle = "rgb(0, 0, 0)";
		me.ctx.fillText(me.map.name, me._width/2, me._height-20);

		for(i=0; i<me.map.height; i++) {
			for(j=0; j<me.map.width; j++) {
				if(me.map.get_auto(j, i) == me.map.BLOCK) {
					me.ctx.fillStyle = "rgba(60, 60, 60, 0.5)";
					me.ctx.fillRect(d+j*s, d+i*s, s, s);
					me.ctx.strokeStyle = "rgb(0, 0, 0)";
					me.ctx.strokeRect(d+j*s, d+i*s, s, s);
					continue;
				}
				if(me.map.get_auto(j, i) == me.map.MOVEABLE) {
					me.ctx.fillStyle = "rgba(60, 0, 120, 0.5)";
					me.ctx.fillRect(d+j*s, d+i*s, s, s);
					me.ctx.strokeStyle = "rgb(60, 0, 120)";
					me.ctx.strokeRect(d+j*s, d+i*s, s, s);
					continue;
				}
				if(me.map.get_auto(j, i) == me.map.FREE) {
					me.ctx.fillStyle = "rgba(160, 160, 160, 0.5)";
					me.ctx.fillRect(d+j*s, d+i*s, s, s);
				}
			}
		}

		me.ctx.fillStyle = "rgb(0, 225, 0)";
		me.ctx.fillRect(d+Math.floor(me.player.x)*s, d+Math.floor(me.player.y)*s, s, s);
		me.ctx.restore();

		me.canvas_ctx.clearRect(0, 0, me.canvas.width, me.canvas.height);
		me.canvas_ctx.drawImage(me.buffer, 0, 0);

	};

	me.loop = function() {
		requestAnimationFrame(me.loop);
		me.player.update(me.map);

		if(me.show_map) {
			// FIXME: we don't need 30 FPS for this
			me.draw_map();
		} else {
			me.draw();
		}
	};

	me.run = function() {
		if(me.setup()) {
			me.loop();
		}
	};

	me.key_down = function(event) {

		// map
		if(event.keyCode == 77) {
			me.show_map = true;
		}

		// fullscreen
		if(event.keyCode == 70) {
			if(me.canvas.webkitRequestFullScreen) {
				me.canvas.webkitRequestFullScreen(true);
				return;
			}
			if(me.canvas.mozRequestFullScreen) {
				me.canvas.mozRequestFullScreen();
				return;
			}
			if(me.canvas.requestFullScreen) {
				me.canvas.requestFullScreen();
				return;
			}
		}
	};

	me.key_up = function(event) {

		// map
		if (event.keyCode == 77) {
			me.show_map = false;
		}
	};

	me.init = function() {
		document.addEventListener("keydown", me.key_down, false);
		document.addEventListener("keyup", me.key_up, false);
		window.onresize = me.resize

	};

	me.init();

	return me;
};

window.onload = function () {
	var app = Application("myCanvas");
	app.run();
};


