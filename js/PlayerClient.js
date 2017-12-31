module.exports = {
    Object : function() {
        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.type = "None";
        this.team = "White";
        this.id = 0;

        this.getJson = function() {
            return {type: this.type, team: this.team, x: this.x, y: this.y, angle: this.angle, id: this.id};
        }
    }
}
