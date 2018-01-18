const Projectile = require('./Projectile');
const Rectangle = require('./Geometry/Rectangle');

function Bullet(x, y, angle, team, gameArea)
{
    Projectile.call(this, x, y, angle, team, gameArea);
    this.height = 5;
    this.speed = 10;
    this.width = 10;
    this.type = "Bullet";
	this.shape = new Rectangle(5, 5);
}
Bullet.prototype = new Projectile();

module.exports = Bullet;