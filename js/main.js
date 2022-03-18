var box2Ob = {};
var App = {};
var debugMode = true;

$(document).ready(function() {
	Initialize();
	setupWorld();
	setupBoard();

	StartGame();
});

function Initialize()
{
	App.canvas = document.getElementById("gameCanvas");
	App.ctx = App.canvas.getContext("2d");
	App.images = {};
	PreloadImages();
	InitializeAbilities();
	InitializeUnitMgr();
	InitializeProjectileMgr();
}

function LoadImage(key, path) {
	App.images[key] = new Image();
	App.images[key].src = 'img/' + path;
}

function PreloadImages() {
	App.images['you'] = new Image(); App.images['you'].src = 'img/you.PNG';
	App.images['enemy'] = new Image(); App.images['enemy'].src = 'img/enemy.PNG';
	App.images['bullet'] = new Image(); App.images['bullet'].src = 'img/bullet.PNG';

	App.images.GetImage = function GetImage(key) {
		return App.images[key];
	};
}

function StartGame()
{
	App.unitMgr.CreateUnit({x: 20, y: 20}, 1, 'you');
	App.unitMgr.CreateUnit({x: 400, y: 20}, 1, 'you');

	for (var i = 0; i < 50; i++)
	{
		App.unitMgr.CreateUnit({x: Math.random() * 500 + 100,
														y: Math.random() * 400 + 100}, 2, 'them');
	}
	window.addEventListener('click', MouseClick);
	mainLoop();
}

function SetSelectedAbil(abilNum) {
	if (waitingForCommand != null)
	{
		var unit = App.unitMgr.units[waitingForCommand.team][waitingForCommand.index];
		unit.SetSelectedAbil(abilNum);
		$('.abil.selected').removeClass('selected')
		$('#abil' + unit.abilitySelected).addClass('selected');
	}
}

function MouseClick(ev) {
	if (waitingForCommand != null)
	{
		var evX = ev.x - App.canvas.offsetLeft;
		var evY = ev.y - App.canvas.offsetTop;
		if (0 <= evX && evX < App.canvas.width && 0 <= evY && evY < App.canvas.height)
		{
			var clickCoord = pixelToB2dCoords(evX, evY);
			App.unitMgr.units[waitingForCommand.team][waitingForCommand.index].HandleClick(clickCoord);
			//waitingForCommand = null;
		}
	}
	return false;
}

function UpdateAbilityDisplay() {
	$('.abil').attr('src', 'img/NoAbil.png');
	if (waitingForCommand != null)
	{
		var unit = App.unitMgr.GetUnit(waitingForCommand.team, waitingForCommand.index);
		var numAbils = unit.abilities.length;
		for (var i = 0; i < numAbils; i++)
		{
			$('#abil' + i).attr('src', unit.abilities[i].icon);
		}
		$('.abil.selected').removeClass('selected')
		$('#abil' + unit.abilitySelected).addClass('selected');
	}
}
var waitingForCommand = null;

function mainLoop()
{
	var lastUnitForCommand = waitingForCommand;
	waitingForCommand = App.unitMgr.GetUnitReadyForOrder();
	if ((waitingForCommand != null && lastUnitForCommand == null) ||
		  (waitingForCommand == null && lastUnitForCommand != null) ||
		  (waitingForCommand != null && lastUnitForCommand != null &&
			(waitingForCommand.team != lastUnitForCommand.team &&
			 waitingForCommand.index != lastUnitForCommand.index)))
	{
		UpdateAbilityDisplay();
	}
	var timeStep = 1.0/80.0;
	App.unitMgr.CleanupDeadUnits()
	// Check for game conditions (multiball, endgame, etc.)
	if (!waitingForCommand)
	{
		logicTick(timeStep);
	}
	App.projectileMgr.Update(timeStep);
	// Handle collisions (contacts) between objects that occured in the previous frame
	handleCollisions();
	// Step the physics world
	box2Ob.world.Step(timeStep, 3, 3);
	// Now draw the physics objects
	App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
	// Draw the background image
	drawBackground();
	drawWorld(box2Ob.world, App.ctx);
	App.unitMgr.DrawUnits();

	setTimeout(mainLoop, 17);
}

function drawBackground() {
	//App.ctx.drawImage(backgroundImages[currentBackground], 0, 0);
}

function logicTick(deltaTime) {
	var unitReadyForOrder = App.unitMgr.Update(deltaTime, !App.unitMgr.IsUnitActing());
	return unitReadyForOrder;
}

function handleCollisions() {
	// Handle the actual contacts
	for (var contact = box2Ob.world.m_contactList; contact; contact = contact.m_next)
	{
		if (contact.m_manifold.pointCount > 0 && contact.m_shape1.m_userData != null && contact.m_shape2.m_userData != null) {
			// contact.m_shape1.m_userData;, contact.m_shape2.m_userData;
			if (contact.m_shape1.m_userData.unit && contact.m_shape2.m_userData.unit) {
				var unit1 = contact.m_shape1.m_userData.unit;
				var unit2 = contact.m_shape2.m_userData.unit;
				if (unit1.teamOn != unit2.teamOn)
				{
					unit1.HandleCollision(unit2);
					unit2.HandleCollision(unit1);
				}
			}
			else if (contact.m_shape1.m_userData.isBullet)
			{
				if (contact.m_shape1.m_body.userData.HandleCollision) { contact.m_shape1.m_body.userData.HandleCollision(contact.m_shape1.m_body, contact.m_shape2.m_body); }
			}
			else if (contact.m_shape2.m_userData.isBullet)
			{
				if (contact.m_shape2.m_body.userData.HandleCollision) { contact.m_shape2.m_body.userData.HandleCollision(contact.m_shape2.m_body, contact.m_shape1.m_body); }
			}
		}
	}
}
