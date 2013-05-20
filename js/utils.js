var debugLog = "";

function pixelToB2dCoords(xOrVector, y)
{
	var coord = {x:0, y:0};

	if (y == undefined) { // it's a vector
		var vec = xOrVector;
		coord.y = vec.y / COORDINATE_SCALE_FACTOR; 
		coord.x = vec.x / COORDINATE_SCALE_FACTOR;
	}
	else { // it's two points
		coord.x = xOrVector / COORDINATE_SCALE_FACTOR;
		coord.y = y / COORDINATE_SCALE_FACTOR;		
	}

	return coord;			
}

var TOP_LEFT = pixelToB2dCoords(-100, -100);
var BOTTOM_RIGHT = pixelToB2dCoords(1600, 1600);

function setupWorld()
{
	// Set up the axis-aligned bounding box
	box2Ob.aabb = new b2AABB();
	
	box2Ob.aabb.lowerBound.Set(TOP_LEFT.x, TOP_LEFT.y);
	box2Ob.aabb.upperBound.Set(BOTTOM_RIGHT.x, BOTTOM_RIGHT.y);
	
	box2Ob.gravity = new b2Vec2(0, GRAVITY);
	box2Ob.doSleep = true;
	
	// Create the world
	box2Ob.world = new b2World(box2Ob.aabb, box2Ob.gravity, box2Ob.doSleep);
	box2Ob.toString = function() {
		return "This is the b2d world";		
		};

	debug("B2world sez: " + box2Ob);
}

function debug(line)
{
	debugLog += line + "\n";
}

function drawWorld(world, context) {
	App.ctx.save(); 
	for (var b = world.m_bodyList; b; b = b.m_next) {
		for (var s = b.GetShapeList(); s != null; s = s.GetNext()) {
			drawShape(s, context);
		}
	}
	App.ctx.restore(); 
}

// Takes two points, or just a vector
function b2dToPixelCoords(xOrVector, y)
{
	var point = {x:0, y:0};

	if (y == undefined) { // it's a vector
		var vec = xOrVector;
		point.y = vec.y * COORDINATE_SCALE_FACTOR; 
		point.x = vec.x * COORDINATE_SCALE_FACTOR;
	}
	else { // it's two points
		var x = xOrVector;
		point.x = x * COORDINATE_SCALE_FACTOR;
		point.y = y * COORDINATE_SCALE_FACTOR;		
	}

	return point;			
}

function drawShape(shape, context) {
	if (debugMode || (shape.m_userData != null && shape.m_userData.drawShape == true)) {
		if (shape.m_userData && shape.m_userData.isBullet && shape.m_body.userData.ReadyToDelete(shape)) { return; }
		if (shape.m_userData && shape.m_userData.isSensor)
		{
			context.strokeStyle = '#F00';
		}
		else if (shape.m_userData && shape.m_userData.isBullet)
		{
			context.strokeStyle = '#0F0';
		}
		else
		{
			context.strokeStyle = '#000';
		}
		context.beginPath();
		switch (shape.m_type) {
			case b2Shape.e_circleShape:{
				var circle = shape;
				//var pos = circle.m_position;
				//var r = circle.m_radius;
				
				var circlePos = circle.m_body.GetWorldCenter();
				
				var pos = b2dToPixelCoords(circlePos.x, circlePos.y);
				var r = b2dToPixelCoords(circle.m_radius, circle.m_radius).x;
				
				context.arc(pos.x, pos.y, r, 0, 2 * Math.PI, false);
			}
			break;
			case b2Shape.e_polygonShape:{
				var m_xf = shape.m_body.m_xf;
				var poly = shape;
				
				var tV = b2Math.AddVV(m_xf.position, b2Math.b2MulMV(m_xf.R, shape.m_vertices[0]));
				var tVp = b2dToPixelCoords(tV);
				context.moveTo(tVp.x, tVp.y);
				
				
				// Drawing hack for flippers
				var bDrawFlipper = false;
				if (shape.m_userData != undefined && (shape.m_userData.shapeName == "LFlipperPoly" || shape.m_userData.shapeName == "RFlipperPoly"))
				{
					bDrawFlipper = true;
				}
												
				for (var i = 0; i < poly.m_vertexCount; i++) {
					var v = b2Math.AddVV(m_xf.position, b2Math.b2MulMV(m_xf.R, shape.m_vertices[i]));
					var vp = b2dToPixelCoords(v);
					if (bDrawFlipper && i == 2) { // we don't want to close the flipper polygons.
						context.moveTo(vp.x, vp.y);
					}
					else {
						context.lineTo(vp.x, vp.y);
					}
				}
				context.lineTo(tVp.x, tVp.y);
			}
			break;
		}
		context.stroke();
	}	
}

function getOptionValue(valueName, defaultValue, options){
	if (options == null)
	{
		return defaultValue;
	}
	if (options.hasOwnProperty(valueName))
	{
		return options[valueName]
	}
	return defaultValue;
}

function createBall(world, x, y, rad, fixed, options, bodyData) {
	//gNumBallsInPlay++;
	var ballSd = new b2CircleDef();
	if (!fixed) ballSd.density = 1;
	ballSd.radius = (rad || BALL_RADIUS) / COORDINATE_SCALE_FACTOR;
	ballSd.restitution = .5;
	ballSd.friction = 0.01;
	ballSd.userData = {shapeName: getOptionValue('ballShapeName', 'TheBall', options),
										 unit: getOptionValue('unit', null, options),
										 isBullet: getOptionValue('isBullet', false, options)};
	var ballBd = new b2BodyDef();
//	ballBd.AddShape(ballSd);
	ballBd.position.Set(x / COORDINATE_SCALE_FACTOR, y / COORDINATE_SCALE_FACTOR);
	ballBd.linearDamping = FRICTION;
	var ballBody = world.CreateBody(ballBd);
	ballBody.isBullet = true;
	ballBody.CreateShape(ballSd);
	ballBody.SetMassFromShapes();
	ballBody.userData = bodyData;
	return ballBody;
};

function Dist(pos1, pos2)
{
	return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
}