window.addEventListener("load", main);

function Checklist() {
	this.entries = [];
}
Checklist.prototype.add = function(value) {
	let index = this.entries.length;
	let entry = { value, key: { index } };
	this.entries.push(entry);
	return entry;
};
Checklist.prototype.remove = function(key) {
	let index = key.index;
	let last_index = this.entries.length - 1;
	let entry = this.entries[index];
	let last_entry = this.entries[last_index];
	let last_key = last_entry.key;
	this.entries[index] = last_entry;
	this.entries[last_index] = entry;
	last_key.index = index;
	key.index = -1;
	this.entries.pop();
};
Checklist.prototype[Symbol.iterator] = function*() {
	for(let entry of this.entries) {
		yield entry.value;
	}
};

function Stuff() {
	this.points = new Checklist;
	this.lines = new Checklist;
}
Stuff.prototype.draw = function(context) {
	for(let point of this.points) {
		context.beginPath();
		context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
		context.fillStyle = "black";
		context.fill();
	}
	for(let line of this.lines) {
		context.beginPath();
		context.moveTo(line.start.value.x, line.start.value.y);
		context.lineTo(line.end.value.x, line.end.value.y);
		context.lineWidth = 1;
		context.strokeStyle = "black";
		context.stroke();
	}
};
Stuff.prototype.select = function(mouse_x, mouse_y) {
	let closest = null;
	let closest_distance;
	for(let entry of this.points.entries) {
		let point = entry.value;
		let delta_x = point.x - mouse_x;
		let delta_y = point.y - mouse_y;
		let distance = delta_x * delta_x + delta_y * delta_y;
		if(distance > 4 * 4) {
			continue;
		}
		if(closest == null || distance < closest_distance) {
			closest = entry;
			closest_distance = distance;
		}
	}
	return closest;
};
Stuff.prototype.select_line = function(mouse_x, mouse_y) {
	let closest = null;
	let closest_distance;
	for(let entry of this.lines.entries) {
		let line = entry.value;
		let delta_x = (line.start.value.x + line.end.value.x) / 2 - mouse_x;
		let delta_y = (line.start.value.y + line.end.value.y) / 2 - mouse_y;
		let distance = delta_x * delta_x + delta_y * delta_y;
		if(distance > 4 * 4) {
			continue;
		}
		if(closest == null || distance < closest_distance) {
			closest = entry;
			closest_distance = distance;
		}
	}
	return closest;
};

function Point(stuff, repaint) {
	this.stuff = stuff;
	this.x = 0;
	this.y = 0;
	this.moving = false;
	this.last = null;
	this.selected = null;
	this.container = document.getElementById("point");
	this.x_input = document.getElementById("point-x");
	this.y_input = document.getElementById("point-y");
	this.move = document.getElementById("point-move");
	this.remove = document.getElementById("point-remove");
	function update_x() {
		this.last.value.x = this.x_input.valueAsNumber;
		repaint();
	}
	function update_y() {
		this.last.value.y = this.y_input.valueAsNumber;
		repaint();
	}
	function move() {
		this.moving = true;
		this.selected = null;
		repaint();
	}
	function remove() {
		console.log(this.last.value.lines.entries);
		let lines = [];
		for(let line of this.last.value.lines) {
			lines.push(line);
		}
		for(let line of lines) {
			line.value.start.value.lines.remove(line.value.start_key);
			line.value.end.value.lines.remove(line.value.end_key);
			this.stuff.lines.remove(line.key);
		}
		this.stuff.points.remove(this.last.key);
		this.last = null;
		this.container.disabled = true;
		repaint();
	}
	this.x_input.addEventListener("input", update_x.bind(this));
	this.y_input.addEventListener("input", update_y.bind(this));
	this.move.addEventListener("click", move.bind(this));
	this.remove.addEventListener("click", remove.bind(this));
}
Point.prototype.select = function() {
	this.container.hidden = false;
	this.last = null;
	this.container.disabled = true;
};
Point.prototype.deselect = function() {
	this.container.hidden = true;
};
Point.prototype.draw = function(context) {
	if(this.last != null) {
		context.beginPath();
		context.arc(this.last.value.x, this.last.value.y, 2, 0, 2 * Math.PI);
		context.fillStyle = "blue";
		context.fill();
	}
	if(this.selected != null) {
		let point = this.selected.value;
		context.beginPath();
		context.arc(point.x, point.y, 4, 0, 2 * Math.PI);
		context.fillStyle = "black";
		context.fill();
	}
};
Point.prototype.mousemove = function(mouse_x, mouse_y) {
	this.x = mouse_x;
	this.y = mouse_y;
	if(this.moving) {
		this.last.value.x = this.x;
		this.last.value.y = this.y;
		this.x_input.value = this.last.value.x;
		this.y_input.value = this.last.value.y;
	} else {
		this.selected = this.stuff.select(mouse_x, mouse_y);
	}
};
Point.prototype.click = function() {
	if(this.moving) {
		this.moving = false;
	} else {
		if(this.selected != null) {
			this.last = this.selected;
		} else {
			this.last = this.stuff.points.add({
				x: this.x,
				y: this.y,
				lines: new Checklist,
			});
		}
		this.x_input.value = this.last.value.x;
		this.y_input.value = this.last.value.y;
		this.container.disabled = false;
	}
};

function Line(stuff, repaint) {
	this.stuff = stuff;
	this.last = null;
	this.start = null;
	this.selected_line = null;
	this.selected_point = null;
	this.container = document.getElementById("line");
	this.remove = document.getElementById("line-remove");
	function remove() {
		this.last.value.start.value.lines.remove(this.last.value.start_key);
		this.last.value.end.value.lines.remove(this.last.value.end_key);
		this.stuff.lines.remove(this.last.key);
		this.last = null;
		this.container.disabled = true;
		repaint();
	}
	this.remove.addEventListener("click", remove.bind(this));
}
Line.prototype.select = function() {
	this.container.hidden = false;
	this.last = null;
	this.start = null;
	this.container.disabled = true;
};
Line.prototype.deselect = function() {
	this.container.hidden = true;
};
Line.prototype.draw = function(context) {
	if(this.last != null) {
		context.beginPath();
		context.moveTo(this.last.value.start.value.x, this.last.value.start.value.y, 2, 0, 2 * Math.PI);
		context.lineTo(this.last.value.end.value.x, this.last.value.end.value.y, 2, 0, 2 * Math.PI);
		context.lineWidth = 2;
		context.strokeStyle = "blue";
		context.stroke();
	}
	if(this.start != null) {
		context.beginPath();
		context.arc(this.start.value.x, this.start.value.y, 4, 0, 2 * Math.PI);
		context.fillStyle = "red";
		context.fill();
		if(this.selected_point != null) {
			context.beginPath();
			context.arc(this.selected_point.value.x, this.selected_point.value.y, 4, 0, 2 * Math.PI);
			context.fillStyle = "black";
			context.fill();
		}
	} else if(this.selected_point != null) {
		context.beginPath();
		context.arc(this.selected_point.value.x, this.selected_point.value.y, 4, 0, 2 * Math.PI);
		context.fillStyle = "black";
		context.fill();
	} else if(this.selected_line != null) {
		context.beginPath();
		context.moveTo(this.selected_line.value.start.value.x, this.selected_line.value.start.value.y, 2, 0, 2 * Math.PI);
		context.lineTo(this.selected_line.value.end.value.x, this.selected_line.value.end.value.y, 2, 0, 2 * Math.PI);
		context.lineWidth = 4;
		context.strokeStyle = "black";
		context.stroke();
	}
};
Line.prototype.mousemove = function(mouse_x, mouse_y) {
	this.selected_point = this.stuff.select(mouse_x, mouse_y);
	this.selected_line = this.stuff.select_line(mouse_x, mouse_y);
};
Line.prototype.click = function() {
	if(this.start != null) {
		if(this.selected_point != null) {
			let start = this.start;
			let end = this.selected_point;
			this.last = this.stuff.lines.add({ start, end });
			this.last.value.start_key = start.value.lines.add(this.last).key;
			this.last.value.end_key = end.value.lines.add(this.last).key;
			this.container.disabled = false;
		}
		this.start = null;
	} else {
		if(this.selected_line != null) {
			this.last = this.selected_line;
			this.container.disabled = false;
		} else if(this.selected_point != null) {
			this.start = this.selected_point;
		}
	}
};

function main() {
	let canvas = document.getElementById("canvas");
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	let point_button = document.getElementById("select-point");
	let line_button = document.getElementById("select-line");
	if(canvas == null) {
		return;
	}
	let context = canvas.getContext("2d");
	let stuff = new Stuff;
	let point = new Point(stuff, repaint);
	let line = new Line(stuff, repaint);
	let selected = point;
	selected.select();
	function select(thing) {
		selected.deselect();
		selected = thing;
		selected.select();
		repaint();
	}
	point_button.addEventListener("click", select.bind(null, point));
	line_button.addEventListener("click", select.bind(null, line));
	function repaint() {
		context.fillStyle = "white";
		context.fillRect(0, 0, canvas.width, canvas.height);
		stuff.draw(context);
		selected.draw(context);
	}
	function mousemove(event) {
		let rectangle = canvas.getBoundingClientRect();
		let mouse_x = event.clientX - rectangle.left;
		let mouse_y = event.clientY - rectangle.top;
		selected.mousemove(mouse_x, mouse_y);
		repaint();
	}
	function click(event) {
		let rectangle = canvas.getBoundingClientRect();
		let mouse_x = event.clientX - rectangle.left;
		let mouse_y = event.clientY - rectangle.top;
		selected.mousemove(mouse_x, mouse_y);
		selected.click();
		repaint();
	}
	canvas.addEventListener("mousemove", mousemove);
	canvas.addEventListener("click", click);
}

