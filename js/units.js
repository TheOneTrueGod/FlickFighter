var UNIT_ID_INDEX = 0;
var SPEED_THRESHOLD = 0.3;

var unitStats = {
	'you':{size:20, health: 10, attackSpeed: 2000, image:'you'},
	'them':{size:10, health:2, attackSpeed: 3000, image:'enemy'}
}
function InitializeUnitMgr() {

	App.unitMgr = {}
	App.unitMgr.units = {};

	App.unitMgr.CreateUnit = function CreateUnit(pos, teamOn, statKey) {
		newUnit = {
							 teamOn:teamOn,
							 stats: {maxHealth: unitStats[statKey].health, health: unitStats[statKey].health},
							 box2Body: null,
							 acting: false,
							 waitTicks: UNIT_ID_INDEX * 1010 + 10,
							 statKey: statKey,
							 abilitySelected: 0
							}


		if (teamOn == 1)
		{
			newUnit.abilities = [App.InitializeAbility(0, newUnit), App.InitializeAbility(1, newUnit), App.InitializeAbility(2, newUnit),
								 App.InitializeAbility(3, newUnit)];
			newUnit.abilitySelected = 0;
		}
		else
		{
			newUnit.abilities = [App.InitializeAbility(0, newUnit)];
		}

		newUnit.unitID = UNIT_ID_INDEX++;

		newUnit.GetStat = function GetStat(statName) {
			if (unitStats[this.statKey] == null) {  alert("ERROR IN UNIT.GETSTAT: " + this.statKey + " NOT IN UNITSTATS"); }
			if (unitStats[this.statKey] == null) { alert("ERROR IN UNIT.GETSTAT: " + statName + " NOT IN UNITSTATS[" + this.statKey + "]"); }
			return unitStats[this.statKey][statName];
		}

		newUnit.IsReadyForOrder = function IsReadyForOrder() {
			return this.teamOn == 1 && this.waitTicks <= 0 && this.abilities[this.abilitySelected].IsReadyForOrder();
		}

		newUnit.Update = function Update(deltaTime, updateTimers) {
			if (updateTimers)
			{
				this.waitTicks -= deltaTime * 1000;
			}

			if (this.waitTicks <= 0)
			{
				if (this.teamOn == 2 && !this.acting)
				{
					this.DoAttackLogic();
				}
			}

			var numAbils = this.abilities.length;
			for (var i = 0; i < numAbils; i++)
			{
				this.abilities[i].Update(deltaTime, updateTimers);
			}
		}

		newUnit.SetSelectedAbil = function SetSelectedAbil(abilNum) {
			if (0 <= abilNum && abilNum < this.abilities.length && !this.acting) {
				this.abilitySelected = abilNum
			}
		}

		newUnit.DoAttackLogic = function DoAttackLogic() {
			if (App.unitMgr.units[1].length)
			{
				var selection = Math.floor(Math.random() * App.unitMgr.units[1].length);
				var theirPos = App.unitMgr.units[1][selection].box2Body.m_xf.position;
				var myPos = this.box2Body.m_xf.position;
				var angle = Math.atan2(theirPos.y - myPos.y, theirPos.x - myPos.x);
				var power = .4;
				var targetPos = {x: myPos.x + Math.cos(angle) * power, y:myPos.y + Math.sin(angle) * power}
				this.Attack(targetPos);
			}
		}

		newUnit.DealDamage = function DealDamage(amount) {
			this.stats.health -= amount;
		}

		newUnit.HandleCollision = function HandleCollision(otherUnit) {
			this.abilities[this.abilitySelected].HandleCollision(otherUnit);
		}

		newUnit.HandleClick = function HandleClick(clickCoord) {
			this.abilities[this.abilitySelected].HandleClick(clickCoord);
		}

		newUnit.DrawMe = function DrawMe() {
			if (this.waitTicks < 5000 && this.waitTicks > 0)
			{
				if (this.teamOn == 1)
				{
					App.ctx.strokeStyle = '#F00';
				}
				else
				{
					App.ctx.strokeStyle = '#00F';
				}
				App.ctx.beginPath();
				App.ctx.arc(App.canvas.width * this.waitTicks / 5000.0, 3, 5, 0, 2 * Math.PI, false);
				App.ctx.stroke();
			}
			var img = App.images.GetImage(this.GetStat('image'));
			var imageWidth = img.naturalWidth;
			var imageHeight = img.naturalHeight;
			var pos = b2dToPixelCoords(this.box2Body.m_xf.position);
			App.ctx.drawImage(img, 0, 0, imageWidth, imageHeight,
											pos.x - imageWidth / 2, pos.y - imageHeight / 2, imageWidth, imageHeight);
		}

		newUnit.ReadyToDelete = function ReadyToDelete() {
			if (this.stats.health <= 0)
			{
				return true;
			}
		}

		newUnit.Cleanup = function Cleanup() {
			if (this.box2Body)
			{
				box2Ob.world.DestroyBody(this.box2Body);
			}
		}

		newUnit.Attack = function Attack(pos) {
			this.abilities[this.abilitySelected].Use(pos);
		}

		newUnit.IsActing = function IsActing() { return this.acting; }

		newUnit.box2Body = createBall(box2Ob.world, pos.x, pos.y, unitStats[statKey].size, false, {unit: newUnit});

		this.AddUnit(newUnit);

		return newUnit;
	}

	App.unitMgr.DrawUnits = function DrawUnits() {
		for (var key in this.units)
		{
			for (var i = 0; i < this.units[key].length; i++)
			{
				this.units[key][i].DrawMe();
			}
		}
	}

	App.unitMgr.GetUnitReadyForOrder = function GetUnitReadyForOrder() {
		for (var key in this.units)
		{
			var unitCount = this.units[key].length;
			var i = 0;
			while(i < unitCount)
			{
				if (this.units[key][i].IsReadyForOrder())
				{
					return {team: key, index: i}
				}
				i++;
			}
		}
		return null;
	}

	App.unitMgr.GetUnit = function GetUnit(team, index) {
		if (!this.units.hasOwnProperty(team)) { alert("Error in App.unitMgr.GetUnit; Team " + team + " not in App.unitMgr.units"); }
		if (!this.units[team].hasOwnProperty(index)) { alert("Error in App.unitMgr.GetUnit; Team " + team + " doesn't have unit with index " + index); }
		return this.units[team][index];
	}

	App.unitMgr.IsUnitActing = function IsUnitActing() {
		var key = 1;
		var unitCount = this.units[key].length;
		var i = 0;
		while(i < unitCount)
		{
			if (this.units[key][i].IsActing())
			{
				return true;
			}
			i++;
		}
		return false;
	}

	App.unitMgr.Update = function Update(deltaTime, updateTimers) {
		var unitReadyForOrder = null;
		for (var key in this.units)
		{
			var unitCount = this.units[key].length;
			var i = 0;
			while(i < unitCount)
			{
				this.units[key][i].Update(deltaTime, updateTimers);
				if (this.units[key][i].IsReadyForOrder())
				{
					unitReadyForOrder = {team: key, index: i}
				}
				i++
			}
		}
		return unitReadyForOrder;
	}

	App.unitMgr.CleanupDeadUnits = function CleanupDeadUnits() {
		for (var key in this.units)
		{
			var unitCount = this.units[key].length;
			var i = 0;
			while(i < unitCount)
			{
				if (this.units[key][i].ReadyToDelete())
				{
					this.units[key][i].Cleanup();
					this.units[key].splice(i, 1);
					unitCount --;
				}
				else
				{
					i++;
				}
			}
		}
	}

	App.unitMgr.AddUnit = function AddUnit(newUnit) {
		if (!this.units.hasOwnProperty(newUnit.teamOn)) {
			this.units[newUnit.teamOn] = [];
		}
		this.units[newUnit.teamOn].push(newUnit);
	}
}
