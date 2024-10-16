class Ship {
    constructor(name, size, color) {
        this.name = name;
        this.size = size;
        this.color = color;
        this.positions = [];
        this.notHitted = size;
        this.damaged = [];
    }

    addPosition(position) {
        this.positions.push(position);
    }

    addDamage(position) {
        this.positions.forEach((p) => {
            if (p === position) {
                this.notHitted--;
                this.damaged.indexOf(p) === -1 && this.damaged.push(p);
            }
        });
    }
}

module.exports = Ship;
