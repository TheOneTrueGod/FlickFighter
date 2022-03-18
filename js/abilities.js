function InitializeAbilities() {
	App.abilities = {}

	function MeleeHandleClick(clickCoord) {
		this.unit.abilUsing = this.unit.selectedAbil;
		this.Use(clickCoord);
	}

	App.InitializeAbility = function InitializeAbility(abilityId, unit) {
		newAbil = null;
		/* Melee Attack */
		/* A basic melee attack */
		/* Flings the piece forwards, dealing damage to anything it comes into contact with */
		if (true)
		{
			newAbil = {
				name: 'MeleeAttack',
				icon: 'img/MeleeAttack.png',
				HandleClick: MeleeHandleClick,
				Update: function Update(deltaTime, updateTimers) {
					if (this.unit.box2Body)
					{
						if (this.unit.acting &&
								this.unit.abilities[this.unit.abilitySelected] == this &&
								Math.abs(this.unit.box2Body.m_linearVelocity.x) < SPEED_THRESHOLD &&
								Math.abs(this.unit.box2Body.m_linearVelocity.y) < SPEED_THRESHOLD)
						{
							this.unit.acting = false;
							this.unitsHitInAttack = {};
							this.stepOn = 0;
							this.unit.waitTicks += this.unit.GetStat('attackSpeed');
						}
					}
				},
				HandleCollision: function HandleCollision (otherUnit) {
					if (!this.unitsHitInAttack.hasOwnProperty(otherUnit.unitID) && this.unit.IsActing())
					{
						otherUnit.DealDamage(1);
						this.unitsHitInAttack[otherUnit.unitID] = true;
					}
				},
				Use: function Use(pos) {
					var impulseVector = new b2Vec2((pos.x - this.unit.box2Body.m_xf.position.x) * CLICK_FORCE_MULTIPLIER,
																				 (pos.y - this.unit.box2Body.m_xf.position.y) * CLICK_FORCE_MULTIPLIER);
					this.unit.box2Body.m_linearVelocity.x = 0; this.unit.box2Body.m_linearVelocity.y = 0;
					this.unit.box2Body.ApplyImpulse(impulseVector, this.unit.box2Body.m_xf.position);
					this.unit.acting = true;
					this.unitsHitInAttack = {};
					this.stepOn += 1;
				},
				IsReadyForOrder: function IsReadyForOrder() {
					return this.stepOn == 0
				}
			}
		}

		if (abilityId == 0)
		{
			newAbil.name = "Melee Attack";
			newAbil.icon = "img/MeleeAttack.png"
		}

		/* Double Attack */
		/* Two melee attacks in quick succession */
		else if (abilityId == 1)
		{
			newAbil.name = "Double Attack";
			newAbil.icon = "img/DoubleAttack.png"
			newAbil.DefaultUse = newAbil.Use;
			newAbil.Use = function Use(pos) {
				if (this.stepOn == 0 || this.stepOn == 1)
				{
					this.DefaultUse(pos);
				}
			}
			newAbil.IsReadyForOrder = function IsReadyForOrder() {
				return this.stepOn <= 1
			}
		}
		else if (abilityId == 2)
		{
			newAbil = App.InitializeAbility(0, unit);
			newAbil.name = "Ranged Attack";
			newAbil.icon = "img/RangedAttack.png";
			newAbil.Use = function Use(pos) {
				if (this.stepOn == 0)
				{
					var bulletPos = b2dToPixelCoords(this.unit.box2Body.m_xf.position);
					pos = b2dToPixelCoords(pos);
					var ang = Math.atan2(pos.y - bulletPos.y, pos.x - bulletPos.x);
					App.projectileMgr.CreateProjectile({x: bulletPos.x + Math.cos(ang) * 40, y: bulletPos.y + Math.sin(ang) * 40}, ang);
					this.unit.acting = true;
					this.unitsHitInAttack = {};
					this.stepOn += 1;
				}
			}
		}
		else if (abilityId == 3)
		{
			newAbil = App.InitializeAbility(1, unit);
			newAbil.name = "Move and Shoot";
			newAbil.icon = "img/RangedAttack.png";
			newAbil.Use = function Use(pos) {
				if (this.stepOn == 0)
				{
					this.DefaultUse(pos);
				}
				else if (this.stepOn == 1)
				{
					var bulletPos = b2dToPixelCoords(this.unit.box2Body.m_xf.position);
					pos = b2dToPixelCoords(pos);
					var ang = Math.atan2(pos.y - bulletPos.y, pos.x - bulletPos.x);
					App.projectileMgr.CreateProjectile({x: bulletPos.x + Math.cos(ang) * 40, y: bulletPos.y + Math.sin(ang) * 40}, ang);
					this.unit.acting = true;
					this.unitsHitInAttack = {};
					this.stepOn += 1;
				}
			}
			newAbil.IsReadyForOrder = function IsReadyForOrder() {
				return this.stepOn <= 1
			}
		}

		if (newAbil == null)
		{
			alert("ERROR:  Couldn't create ability " + abilityId);
		}

		newAbil.abilityID = abilityId;
		newAbil.stepOn = 0;
		newAbil.unit = unit;
		newAbil.unitsHitInAttack = {};

		return newAbil;
	}
}
