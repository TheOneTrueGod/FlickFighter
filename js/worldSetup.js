function createPolygon(x, y, points, userData) {
	var polyDef = new b2PolygonDef();
	if (userData && userData.flipper === true) { 
		polyDef.density = 5.0; 
	}
	polyDef.vertexCount = points.length;
	polyDef.userData = userData;
	polyDef.restitution = 0.5;
	
	if (userData.isSensor != undefined)
	{
		polyDef.isSensor = true;
	}
	
	if (userData != undefined && userData.restitution != undefined)
	{
		polyDef.restitution = userData.restitution;
	}
	
	for (var i = 0; i < points.length; i++) {
		var pos = pixelToB2dCoords(points[i][0], points[i][1]);
		polyDef.vertices[i].Set(pos.x, pos.y);
	}
	
	var polyBody = new b2BodyDef();
	
	var offset = pixelToB2dCoords(x, y);
	polyBody.position.Set(offset.x, offset.y);	
	if (userData != null && userData.allowSleep == false) {
		polyBody.allowSleep = false;
	}
	
	var body = box2Ob.world.CreateBody(polyBody);
	body.CreateShape(polyDef);
	return body;
}

function CreateRect(pos, size, userData)
{	
	return createPolygon(pos[0], pos[1], [[0, 0], [size[0], 0], [size[0], size[1]], [0, size[1]]], userData);
}

function CreateCircle(pos, rad, userData) {
	//gNumBallsInPlay++;
	var circleDef = new b2CircleDef();
	circleDef.radius = (rad || BALL_RADIUS) / COORDINATE_SCALE_FACTOR;
	circleDef.restitution = .5;
	if (userData.isSensor != undefined)
	{
		circleDef.isSensor = true;
	}
	if (userData.restitution != undefined)
	{	
		circleDef.restitution = userData.restitution;
	}
	circleDef.friction = 0.01;
	circleDef.userData = userData;
	var ballBodyDef = new b2BodyDef();
	ballBodyDef.position.Set(pos[0] / COORDINATE_SCALE_FACTOR,pos[1] / COORDINATE_SCALE_FACTOR);
	var ballBody = box2Ob.world.CreateBody(ballBodyDef);
	ballBody.CreateShape(circleDef);
	ballBody.SetMassFromShapes();
	return ballBody;
};

function setupBoard()
{
	var OUTER_WALL_SIZE = 5;
// Walls of board
	// Top Wall
		CreateRect([0, 0], [App.canvas.width, OUTER_WALL_SIZE], {drawShape: false, shapeName: "TopWall", collidesWithBall: true, force:10});
	// Right Wall
		CreateRect([0, 0], [OUTER_WALL_SIZE, App.canvas.height], {drawShape: false, shapeName: "RightWall"});
	// Left Wall
		CreateRect([App.canvas.width - OUTER_WALL_SIZE, 0], [OUTER_WALL_SIZE, App.canvas.height], {drawShape: false, shapeName: "LeftWall"});
	// Bottom Wall
		CreateRect([0, App.canvas.height - OUTER_WALL_SIZE], [App.canvas.width, OUTER_WALL_SIZE], {drawShape: false, shapeName: "BottomWall"});
}