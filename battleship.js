const fs = require('fs');
const { Worker, isMainThread } = require('worker_threads');
const readline = require('readline-sync');
const gameController = require("./GameController/gameController.js");
const cliColor = require('cli-color');
const beep = require('beepbeep');
const position = require("./GameController/position.js");
const letters = require("./GameController/letters.js");
let telemetryWorker;

class Battleship {
    start() {
        telemetryWorker = new Worker("./TelemetryClient/telemetryClient.js");

        console.log("Starting...");
        telemetryWorker.postMessage({eventName: 'ApplicationStarted', properties:  {Technology: 'Node.js'}});

        console.log(cliColor.magenta("                                     |__"));
        console.log(cliColor.magenta("                                     |\\/"));
        console.log(cliColor.magenta("                                     ---"));
        console.log(cliColor.magenta("                                     / | ["));
        console.log(cliColor.magenta("                              !      | |||"));
        console.log(cliColor.magenta("                            _/|     _/|-++'"));
        console.log(cliColor.magenta("                        +  +--|    |--|--|_ |-"));
        console.log(cliColor.magenta("                     { /|__|  |/\\__|  |--- |||__/"));
        console.log(cliColor.magenta("                    +---------------___[}-_===_.'____                 /\\"));
        console.log(cliColor.magenta("                ____`-' ||___-{]_| _[}-  |     |_[___\\==--            \\/   _"));
        console.log(cliColor.magenta(" __..._____--==/___]_|__|_____________________________[___\\==--____,------' .7"));
        console.log(cliColor.magenta("|                        Welcome to Battleship                         BB-61/"));
        console.log(cliColor.magenta(" \\_________________________________________________________________________|"));
        console.log();

        this.InitializeGame();
        this.StartGame();
    }

    StartGame() {
        console.clear();
        console.log("                  __");
        console.log("                 /  \\");
        console.log("           .-.  |    |");
        console.log("   *    _.-'  \\  \\__/");
        console.log("    \\.-'       \\");
        console.log("   /          _/");
        console.log("  |      _  /");
        console.log("  |     /_\\'");
        console.log("   \\    \\_/");
        console.log("    \"\"\"\"");

        do {
            console.log("+------------------------------------------+");
            console.log("|              Player's turn               |");
            console.log("+------------------------------------------+");

            const enemyShips = this.enemyFleet.filter(s => (s.notHitted != 0));
            const numberEnemyShipsInGame = enemyShips.length;

            if (numberEnemyShipsInGame === 0) {
                this.FinishGame(true);
            }

            console.log(`enemy fleet: ${enemyShips.map(s => s.name + " " + s.notHitted).join(", ")}`);
            console.log(`destroed enemy fleet: ${this.enemyFleet.filter(s => (s.notHitted == 0)).map(s => s.name + " " + s.notHitted).join(", ")}`);
            console.log("Enter coordinates for your shot :");
            var position = Battleship.ParsePosition(readline.question());
            var isHit = gameController.CheckIsHit(this.enemyFleet, position);

            telemetryWorker.postMessage({eventName: 'Player_ShootPosition', properties:  {Position: position.toString(), IsHit: isHit}});

            if (isHit) {
                beep();

                console.log(cliColor.red("                \\         .  ./"));
                console.log(cliColor.red("              \\      .:\";'.:..\"   /"));
                console.log(cliColor.red("                  (M^^.^~~:.'\")."));
                console.log(cliColor.red("            -   (/  .    . . \\ \\)  -"));
                console.log(cliColor.red("               ((| :. ~ ^  :. .|))"));
                console.log(cliColor.red("            -   (\\- |  \\ /  |  /)  -"));
                console.log(cliColor.red("                 -\\  \\     /  /-"));
                console.log(cliColor.red("                   \\  \\   /  /"));
            }

            console.log(isHit ? "Yeah ! Nice hit !" : cliColor.blue("Miss"));

            console.log("+------------------------------------------+");
            console.log("|             Computer's turn              |");
            console.log("+------------------------------------------+");

            var computerPos = this.GetRandomPosition();
            var isHit = gameController.CheckIsHit(this.myFleet, computerPos);

            telemetryWorker.postMessage({eventName: 'Computer_ShootPosition', properties:  {Position: computerPos.toString(), IsHit: isHit}});

            console.log();
            console.log(`Computer shot in ${computerPos.column}${computerPos.row} and ` + (isHit ? `has hit your ship !` : `miss`));
            if (isHit) {
                beep();

                console.log(cliColor.yellow("                \\         .  ./"));
                console.log(cliColor.yellow("              \\      .:\";'.:..\"   /"));
                console.log(cliColor.yellow("                  (M^^.^~~:.'\")."));
                console.log(cliColor.yellow("            -   (/  .    . . \\ \\)  -"));
                console.log(cliColor.yellow("               ((| :. ~ ^  :. .|))"));
                console.log(cliColor.yellow("            -   (\\- |  \\ /  |  /)  -"));
                console.log(cliColor.yellow("                 -\\  \\     /  /-"));
                console.log(cliColor.yellow("                   \\  \\   /  /"));
            }

            console.log("\n+------------------------------------------+\n");
        }
        while (true);
    }

    FinishGame(userWon) {
        userWon
            ? console.log('You are the winner!')
            : console.log('You have lost');

        process.exit();
    }

    static ParsePosition(input) {
        var letter = input[0].toUpperCase();
        var number = input[1];
        return new position(letter, number);
    }

    GetRandomPosition() {
        var rows = 8;
        var lines = 8;
        var rndColumn = Math.floor((Math.random() * lines));
        var letter = letters.get(rndColumn + 1);
        var number = Math.floor((Math.random() * rows));
        var result = new position(letter, number);
        return result;
    }

    InitializeGame() {
        this.InitializeMyFleet();
        this.InitializeEnemyFleet();
    }

    InitializeMyFleet() {
        this.myFleet = gameController.InitializeShips();

        const myShips = this.myFleet.filter(s => (s.notHitted != 0));
        const numberMyShipsInGame = myShips.length;

        if (numberMyShipsInGame === 0) {
            this.FinishGame(false);
        }

        console.log("Please position your fleet (Game board size is from A to H and 1 to 8) :");

        // try {
        //     const data = fs.readFileSync('./enemyFleets/1.txt', 'utf8');
        //     let index = 0;

        //     for (const line of data.split('\n')) {
        //         if (line === '') {
        //             continue;
        //         }
        //         const coordinates = line.split(',');
        //         coordinates.forEach(c => this.myFleet[index].addPosition(new position(c[0], c[1])));
        //         index++;
        //     }
        // } catch (err) {
        //     console.error("Error reading file:", err);
        // }

        for (let i = 0; i < this.myFleet.length; i++) {
            const ship = this.myFleet[i];
            console.log();
            console.log(`Please enter the positions for the ${ship.name} (size: ${ship.size})`);
            console.log(cliColor.green(`Enter first position of ${ship.size} and direction (i.e A3R):`));
            const position = readline.question();
            if(position[2] === 'R' || position[2] === 'r') {
                if(letters.get(position[0]).value + ship.size > 8) {
                    console.log(cliColor.red("Invalid position, please try again."));
                    i--;
                    continue;
                }

                for (var j = 0; j < ship.size; j++) {
                    ship.addPosition([letters.get(letters.get(position[0]).value + j).key, position[1]]);
                }
            } else if (position[2] === 'D' || position[2] === 'd') {
                if(parseInt(position[1]) + ship.size > 8) {
                    console.log(cliColor.red("Invalid position, please try again."));
                    i--;
                    continue;
                }

                for (var j = 0; j < ship.size; j++) {
                    ship.addPosition(position[0], parseInt(position[1]) + j);
                }
            } else if (position[2] === 'L' || position[2] === 'l') {
                if(letters.get(position[0]).value - ship.size < 0) {
                    console.log(cliColor.red("Invalid position, please try again."));
                    i--;
                    continue;
                }

                for (var j = 0; j < ship.size; j++) {
                    ship.addPosition([letters.get(letters.get(position[0]).value - j).key, position[1]]);
                }

            } else if (position[2] === 'U' || position[2] === 'u') {
                if(parseInt(position[1]) - ship.size < 0) {
                    console.log(cliColor.red("Invalid position, please try again."));
                    i--;
                    continue;
                }

                for (var j = 0; j < ship.size; j++) {
                    ship.addPosition(position[0], parseInt(position[1]) + j);
                }
            }
            // if (this.checkCollision(ship, this.myFleet)) {
            //     console.log(cliColor.red("Invalid position (checkCollision), please try again."));
            // }
        }
    }

    InitializeEnemyFleet() {
        this.enemyFleet = gameController.InitializeShips();

        try {
            const name = Math.floor((Math.random() * 5));

            const data = fs.readFileSync(`./enemyFleets/${name}.txt`, 'utf8');
            let index = 0;

            for (const line of data.split('\n')) {
                if (line === '') {
                    continue;
                }
                const coordinates = line.split(',');
                coordinates.forEach(c => this.enemyFleet[index].addPosition(new position(c[0].toUpperCase(), c[1])));
                index++;
            }
        } catch (err) {
            console.error("Error reading file:", err);
        }
        this.writeToFile();
    }

    checkCollision(ship, fleet) {
        for (let index = 0; index < fleet.length; index++) {
            for (let pos = 0; pos < fleet[index].positions.length; pos++) {
                for (let i = 0; i < ship.positions.length; i++) {
                    if (fleet[index].positions[pos].column === ship.positions[i].column && fleet[index].positions[pos].row === ship.positions[i].row) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    writeToFile() {
        fs.writeFileSync('./mapCompute.txt', '');
        for (let index = 0; index < this.enemyFleet.length; index++) {
            for (let pos = 0; pos < this.enemyFleet[index].positions.length; pos++) {
                fs.writeFileSync('./mapCompute.txt', this.enemyFleet[index].positions[pos].toString() + '\n', { flag: 'a+' });
            }
        }
    }
}

module.exports = Battleship;
