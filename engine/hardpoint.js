function hardpoint(type,parent,pos)
{
	this.init = init;
	function init(type,parent,pos)
	{
		this.type = type;
		this.pos = pos;
		this.parent = parent;
		this.rot = 0.0;
		this.animation = 0;
		this.time = 0;
		this.stat = 0;
		this.sprite = null;
		this.rendersprite = null;
		this.warhead = "";

		switch(type)
		{
			default:

			break;
		}
	}

	this.equip = equip;
	function equip(weapon)
	{
		var valid = [];

		switch(this.type)
		{
			case "forward gun":
				valid = ["minigun","pulse laser"];
			break;

			case "auto turret":
				this.rendersprite = this.sprite.still;
				valid = ["minigun","pulse laser","fast rocket"];
			break;

			case "fixed salvo":
				valid = ["med rocket","fast rocket","lge rocket"];
			break;
		}
	
		if(valid.indexOf(weapon) != -1)
		{
			this.warhead = weapon;
			
			var projectile = new warhead(this.warhead);
			this.stat = projectile.stat;

			return true;
		}

		return false;
	}


	this.adjust = adjust;
	function adjust()
	{
		switch(this.type)
		{		
			case "auto turret":

				var target = ai[this.target];

				//There's nothing to shoot.
				if(target == null) return false;

				//Find the turret loction in world.
				var offs = rotatePoints(this.pos.x/world.grid,this.pos.y/world.grid,this.parent.rot);
				var worldlocation = {x:this.parent.pos.x+offs.x,
									 y:this.parent.pos.y+offs.y};		

				//Drop target if out of range.
				targetdistance = distance(worldlocation,target.pos);
				if(targetdistance > this.stat.life * this.stat.speed)
				{
					this.target = -1;
					return false;
				}
				
				//Correct for distance
				var futuretarget = {x:0,y:0};
				futuretarget.x = target.pos.x + (target.delta.x*rtimer.delta)*(targetdistance*3);
				futuretarget.y = target.pos.y + (target.delta.y*rtimer.delta)*(targetdistance*3);
				
				targetangle = angle(worldlocation, target.pos);
				this.rot = targetangle;

				var timer = new Date();
				if(this.time < timer.getTime())
				{
					var projectile = new warhead(this.warhead);

					projectile.pos.x = worldlocation.x;
					projectile.pos.y = worldlocation.y;
					projectile.ignore = this.parent.id;
					projectile.faction = this.parent.faction;					

					projectile.rot = targetangle;

					this.rendersprite = this.sprite.fire;
					
					this.animation = timer.getTime()+100;
					this.time = timer.getTime()+this.stat.delay*1000;
					projectile.launch();
					return true;
				}
			break;
			default:
				return false;
			break;
		}
	}


	this.think = think;
	function think()
	{
		switch(this.type)
		{		
			case "auto turret":

				var target = ai[this.target]
				if(target == null || this.target == -1)
				{
					var offs = rotatePoints(this.pos.x/world.grid,this.pos.y/world.grid,this.parent.rot);
					var worldlocation = {x:this.parent.pos.x+offs.x,
										 y:this.parent.pos.y+offs.y};		

					var range = this.stat.life * this.stat.speed;

					var ailist = ai_quad.query(worldlocation, range);
					if(ailist.length>0)
					{
						var targetai = {d:1000,id:-1};
						for(var i in ailist)
						{
							if(ai[ailist[i]].faction != this.parent.faction && ai[ailist[i]].id != this.parent.id)
							{
								var d = distance(this.pos,ai[ailist[i]].pos);
								if(targetai.d > d){targetai.d=d; targetai.id=ailist[i]};
							}
						}
						this.target=targetai.id;
					}
				}
			break;

			default:
				return false;
			break;
		}
	}
	
	
	this.fire = fire;
	function fire()
	{
		var timer = new Date();

		//Don't fire if there's no ordinance loaded or there's a cooldown.
		if(this.warhead == "") return false;
		if(this.time > timer.getTime()) return false;

		switch(this.type)
		{		

			case "forward gun":				
				var offs = rotatePoints(this.pos.x/world.grid,this.pos.y/world.grid,this.parent.rot);

				var projectile = new warhead(this.warhead);
				projectile.pos.x = this.parent.pos.x+offs.x;
				projectile.pos.y = this.parent.pos.y+offs.y;
				projectile.ignore = this.parent.id;
				projectile.faction = this.parent.faction;
				projectile.rot = parent.rot;

				this.time = timer.getTime()+projectile.stat.delay*1000;
				projectile.launch();
				return true;
			break;

		
			case "fixed salvo":				
				var offs = rotatePoints(this.pos.x/world.grid,this.pos.y/world.grid,this.parent.rot);

				var projectile = new warhead(this.warhead);
				projectile.pos.x = this.parent.pos.x+offs.x;
				projectile.pos.y = this.parent.pos.y+offs.y;
				projectile.ignore = parent.id;
				projectile.faction = parent.faction;
				projectile.target = parent.target.attack.id;
				projectile.rot = parent.rot+this.pos.r;

				this.time = timer.getTime() + projectile.stat.delay*1000;
				projectile.launch();
				return true;
			break;		

			default:
			break;
		}
	}

	this.render = render;
	function render()
	{
		var timer = new Date();

		if(this.sprite != null)
		{
			var offs = rotatePoints(this.pos.x/world.grid,this.pos.y/world.grid,this.parent.rot);
			var worldlocation = {x:this.parent.pos.x+offs.x,
								 y:this.parent.pos.y+offs.y};		

			var screenlocation = screen.fromworld(worldlocation);

			if(this.animation < timer.getTime())
				this.rendersprite = this.sprite.still;
			else
				this.rendersprite = this.sprite.fire;

			drawRotatedImage(this.rendersprite, screenlocation.x, screenlocation.y, this.rot-90,1)
		}
	}

	this.init(type,parent,pos);
	return this;
}
