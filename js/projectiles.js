function InitializeProjectileMgr() {
	App.projectileMgr = {}
	App.projectileMgr.projectiles = []

	App.projectileMgr.CreateProjectile = function CreateProjectile(pos, impulseAngle) {
		var BULLET_SPEED_THRESHOLD = 0.1;
		var bulletSpeed = 3;
		
		var bullet = createBall(box2Ob.world, pos.x, pos.y, 5, false, {isBullet: true},
			{
				bouncesLeft: 200,
				ReadyToDelete: function ReadyToDelete(self) {
					return this.bouncesLeft <= 0					
				},
				Delete: function Delete(myBody) {
					box2Ob.world.DestroyBody(myBody)
				},
				HandleCollision: function HandleCollision(myBody, otherBody) {
					this.bouncesLeft -= 1;
					if (otherBody.m_shapeList.m_userData && otherBody.m_shapeList.m_userData.unit) {
						var unitHit = otherBody.m_shapeList.m_userData.unit;
						unitHit.DealDamage(10);
					}
				},
				Update: function Update(self, deltaTime) {
					var speed = self.m_linearVelocity;
					var ang = Math.atan2(speed.y, speed.x);
					self.m_linearVelocity.x = Math.cos(ang) * bulletSpeed;
					self.m_linearVelocity.y = Math.sin(ang) * bulletSpeed;
				}
		});
		bullet.m_linearDamping = false;
		var pow = 0.07;
		var impulseVector = new b2Vec2(Math.cos(impulseAngle) * pow, Math.sin(impulseAngle) * pow);
		bullet.ApplyImpulse(impulseVector, bullet.m_xf.position);
		App.projectileMgr.projectiles.push(bullet);
	}
	
	App.projectileMgr.Update = function Update(deltaTime) {
		var i = 0;
		var numProjectiles = this.projectiles.length;
		while (i < numProjectiles)
		{
			var projec = this.projectiles[i];
			var pUD = projec.userData;
			if (pUD)
			{
				if (pUD.Update) { pUD.Update(projec, deltaTime); }
				if (pUD.ReadyToDelete && pUD.ReadyToDelete(projec)) { 
					pUD.Delete(projec.m_shapeList.m_body);
					this.projectiles.splice(i, 1);
					numProjectiles -= 1;
				}
				else { i += 1; }
			}
			else
			{
				i += 1;
			}
		}
	}

	
}