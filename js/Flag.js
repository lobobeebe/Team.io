function Flag(team, id, x, y, gameArea)
{
    this.team = team;
    this.ownerId = id;
    this.gameArea = gameArea;
    this.x = x;
    this.y = y;

    this.draw = function()
    {
        ctx = this.gameArea.context;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.moveTo(0, 30);
        ctx.lineTo(0, -30);
        ctx.lineTo(30, -15);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.restore();
    }
}
