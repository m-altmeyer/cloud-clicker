hexArcadeApp.controller('gameOneCtrl', function ($location, $scope, $timeout, ngIntroService) {
    var self = this;

    self.state = "TUTORIAL";

    self.roundCounter = [];
    self.activeElements = [];
    self.totalClicks=0;

    self.data={};

    // our game's configuration
    self.config = {
        width: 800,
        height: 600,
        dom: {
            createContainer: true
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.NO_CENTER
        },
        parent: 'game-container',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300, x: 0 },
                debug: false
            }
        }
    };


    self.introOptions = {
        steps: [
            {
                element: document.querySelector('#game-container-tutorial'),
                intro: '<div style="text-align:center;"><h5>General information</h5>In the following gameful application, a pair of statements is shown to you for a certain amount of time. You will be asked to decide which of the two statements is more important to you personally. Please click on the statement which is more important to you. There will be 15 rounds, in which a pair of statements is shown to you. </div>'
            },
            {
                element: document.querySelector('#gameObject1'),
                intro: '<div style="text-align:center;"><h5>First statement</h5>If you feel like this statement is more important to you, click on this cloud.</div>'
            },
            {
                element: document.querySelector('#gameObject2'),
                intro: '<div style="text-align:center;"><h5>Second statement</h5>If you feel like this statement is more important to you, click on this cloud.</div>'
            },
            {
                element: document.querySelector('#label-counter'),
                intro: '<div style="text-align:center;"><h5>Timer</h5>In each round in which two statements are presented to you, you will have 7 seconds to make your decision and click on the statements.</div>'
            }
        ],
        showStepNumbers: true,
        showBullets: false,
        exitOnOverlayClick: false,
        exitOnEsc:false,
        nextLabel: 'Next',
        prevLabel: 'Previous',
        skipLabel: 'Abort',
        doneLabel: '<span style="color:green;">Finish</span>',
        scrollToElement:true
    };

    ngIntroService.clear();
    self.completedTutorial=false;
    
    ngIntroService.onComplete(function () {
        console.log('Tour Finished!');
        self.completedTutorial=true;
        self.state = "TUTORIAL_END";
        $scope.$apply();
    });

    ngIntroService.onExit(function () {
        if (self.completedTutorial){
            return;
        }
        console.log('Tour Interrupted!');
        self.state = "TUTORIAL";
        $scope.$apply();
    });

    // create the game, and pass it the configuration
    self.game = new Phaser.Game(self.config);

    //Start scene
    self.startScene = new Phaser.Scene('Start');


    // load asset files for our game
    self.startScene.preload = function () {
        self.startScene.load.image('background-blurred', 'assets/background-blurred.png');
    };

    // executed once, after assets were loaded
    self.startScene.create = function () {
        self.startScene.add.image(0, 0, 'background-blurred').setOrigin(0, 0);
    }

    // executed once, after assets were loaded
    self.startScene.update = function () {

    }

    // adding scenes
    self.game.scene.add('Start', self.startScene)

    //starting
    self.game.scene.start('Start');


    let mainScene = new Phaser.Scene('Main');

    let coinSound, timerSound, maximizeSound, minimizeSound, philanthropistObject, socializerObject, freeSpiritObject, playerObject, achieverObject, disruptorObject, platforms, roundCounterText, taskDescriptionText;

    self.currentRound = 0;

    let object1X = 200;
    let object2X = 600;
    let objectY = 240;
    self.timePerRound = 7000;
    let pauseBetweenRounds = 2000;

    let items;

    var itemReferences = [];
    let itemNames = {
        'PH': 'ruby',
        'SO': 'star',
        'FS': 'diamond',
        'PL': 'emerald',
        'AC': 'saphire',
        'DI': 'topaz',
    }

    self.philanthropistCounter = 0;
    self.socializerCounter = 0;
    self.freeSpiritCounter = 0;
    self.achieverCounter = 0;
    self.playerCounter = 0;
    self.disruptorCounter = 0;

    self.philanthropistRoundCounter = 0;
    self.socializerRoundCounter = 0;
    self.freeSpiritRoundCounter = 0;
    self.achieverRoundCounter = 0;
    self.playerRoundCounter = 0;
    self.disruptorRoundCounter = 0;

    var roundCounter, timer, roundDisabled = true;

    self.comparisons = [
        ['PH', 'SO'],
        ['PH', 'FS'],
        ['PH', 'PL'],
        ['PH', 'AC'],
        ['PH', 'DI'],
        //['PH', 'NPH'],
        ['SO', 'FS'],
        ['SO', 'PL'],
        ['SO', 'AC'],
        ['SO', 'DI'],
        //['SO', 'NSO'],
        ['FS', 'PL'],
        ['FS', 'AC'],
        ['FS', 'DI'],
        //['FS', 'NFS'],
        ['PL', 'AC'],
        ['PL', 'DI'],
        //['PL', 'NPL'],
        ['AC', 'DI'],
        //['AC', 'NAC'],
        //['DI', 'NDI'],
    ]

    function shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }

    function createItem(obj, type) {
        var item = items.create(obj.x, obj.y + 100, itemNames[type]);
        item.setBounceY(Phaser.Math.FloatBetween(0.1, 0.2));
        item.setCollideWorldBounds(true);
        var velX = Phaser.Math.Between(-300, 300);
        item.setVelocity(velX, 20);
        item.body.angularVelocity = velX;
        item.body.angularDrag = 100;
        item.body.setDrag(100, 100);
        itemReferences.push({ type: type, item: item })
        mainScene.children.bringToTop(obj);
    }

    function createItems(obj, type) {
        wobble(obj, 2);
        var i = 0;
        function _iter() {
            if (i >= 10) {
                return;
            }
            createItem(obj, type);
            coinSound.play({ volume: .05, loop: false });
            i++;
            setTimeout(_iter, 100);
        }
        _iter();
    }

    function objectClicked(obj, type) {
        if (roundDisabled) {
            return;
        }
        roundDisabled = true;
        obj.setScale(0.95);
        shootSound.play({ volume: .2, loop: false });
        //coinSound.play({ volume: .05, loop: false });
        //createItem(obj, type);
        createItems(obj, type);
        switch (type) {
            case 'PH':
                self.philanthropistCounter++;
                self.philanthropistRoundCounter++;
                break;
            case 'FS':
                self.freeSpiritCounter++;
                self.freeSpiritRoundCounter++;
                break;
            case 'SO':
                self.socializerCounter++;
                self.socializerRoundCounter++;
                break;
            case 'AC':
                self.achieverCounter++;
                self.achieverRoundCounter++;
                break;
            case 'PL':
                self.playerCounter++;
                self.playerRoundCounter++;
                break;
            case 'DI':
                self.disruptorCounter++;
                self.disruptorRoundCounter++;
                break;
        }
        setTimeout(newRound, 1500);
        if (timer) { clearInterval(timer) }
        if (roundCounter) { clearInterval(roundCounter) }
        $scope.$apply();
    }


    function objectReleased(obj) {
        obj.setScale(1);
    }

    function animateObject(obj, x, y, duration, cb) {
        if (duration === undefined) { duration = 500; }
        mainScene.tweens.add({
            targets: obj,
            x: x,
            y: y,
            duration: duration,
            ease: 'Power0',
            onComplete: function () { if (!(cb === undefined)) { cb(); } }
        });
    }

    function wobble(obj, w) {
        _wobble();
        function _wobble() {
            animateObject(obj, obj.x + 20, obj.y, 70, function () {
                animateObject(obj, obj.x - 20, obj.y, 70, function () {
                    animateObject(obj, obj.x - 20, obj.y, 70, function () {
                        animateObject(obj, obj.x + 20, obj.y, 70, function () {
                            w--;
                            if (w > 0) {
                                _wobble();
                            }
                        });
                    });
                });
            })
        }
    }

    function addClickHandlers(obj, x) {
        var xc = (x == object1X ? -200 : 1000);
        switch (obj) {
            case 'PH':
                philanthropistObject = mainScene.add.sprite(xc, objectY, "philanthropistObject");
                philanthropistObject.setInteractive();
                philanthropistObject.on('pointerdown', function () {
                    objectClicked(this, 'PH');
                });
                philanthropistObject.on('pointerup', function () {
                    objectReleased(this);
                });
                animateObject(philanthropistObject, x, objectY);
                break;
            case 'SO':
                socializerObject = mainScene.add.sprite(xc, objectY, "socializerObject");
                socializerObject.setInteractive();
                socializerObject.on('pointerdown', function () {
                    objectClicked(this, 'SO');
                });
                socializerObject.on('pointerup', function () {
                    objectReleased(this);
                });
                animateObject(socializerObject, x, objectY);
                break;
            case 'FS':
                freeSpiritObject = mainScene.add.sprite(xc, objectY, "freeSpiritObject");
                freeSpiritObject.setInteractive();
                freeSpiritObject.on('pointerdown', function () {
                    objectClicked(this, 'FS');
                });
                freeSpiritObject.on('pointerup', function () {
                    objectReleased(this);
                });
                animateObject(freeSpiritObject, x, objectY);
                break;
            case 'PL':
                playerObject = mainScene.add.sprite(xc, objectY, "playerObject");
                playerObject.setInteractive();
                playerObject.on('pointerdown', function () {
                    objectClicked(this, 'PL');
                });
                playerObject.on('pointerup', function () {
                    objectReleased(this);
                });
                animateObject(playerObject, x, objectY);
                break;

            case 'AC':
                achieverObject = mainScene.add.sprite(xc, objectY, "achieverObject");
                achieverObject.setInteractive();
                achieverObject.on('pointerdown', function () {
                    objectClicked(this, 'AC');
                });
                achieverObject.on('pointerup', function () {
                    objectReleased(this);
                });
                animateObject(achieverObject, x, objectY);
                break;

            case 'DI':
                disruptorObject = mainScene.add.sprite(xc, objectY, "disruptorObject");
                disruptorObject.setInteractive();
                disruptorObject.on('pointerdown', function () {
                    objectClicked(this, 'DI');
                });
                disruptorObject.on('pointerup', function () {
                    objectReleased(this);
                });
                animateObject(disruptorObject, x, objectY);
                break;
        }
    }

    function createObjects(o1, o2) {
        var side = (Math.random() * 10) % 2 == 0 ? true : false;
        var o1X = side ? object1X : object2X;
        var o2X = side ? object2X : object1X;
        addClickHandlers(o1, o1X);
        addClickHandlers(o2, o2X);
        maximizeSound.play({ volume: .2, loop: false });
    }

    function removeObject(obj) {
        var xc = (obj.x == object1X ? -200 : 1000);
        minimizeSound.play({ volume: .2, loop: false });
        animateObject(obj, xc, obj.y, 500, function () {
            obj.destroy();
            obj = null;
        });
    }

    function newRound() {
        if (philanthropistObject) { removeObject(philanthropistObject); };
        if (socializerObject) { removeObject(socializerObject) };
        if (freeSpiritObject) { removeObject(freeSpiritObject) };
        if (playerObject) { removeObject(playerObject) };
        if (achieverObject) { removeObject(achieverObject) };
        if (disruptorObject) { removeObject(disruptorObject) };
        if (roundCounterText) { roundCounterText.destroy(); roundCounterText = null; };
        if (taskDescriptionText) { taskDescriptionText.destroy(); taskDescriptionText = null; };
        if (timer) { clearInterval(timer) }
        roundDisabled = true;
        $timeout(function () {
            self.roundCounter.push({
                round: self.currentRound,
                PH: self.philanthropistRoundCounter,
                SO: self.socializerRoundCounter,
                FS: self.freeSpiritRoundCounter,
                AC: self.achieverRoundCounter,
                PL: self.playerRoundCounter,
                DI: self.disruptorRoundCounter,
                activeElements: self.activeElements
            });

            self.activeElements = [];

            console.log(self.roundCounter);

            self.philanthropistRoundCounter = 0;
            self.socializerRoundCounter = 0;
            self.freeSpiritRoundCounter = 0;
            self.achieverRoundCounter = 0;
            self.playerRoundCounter = 0;
            self.disruptorRoundCounter = 0;
            if (self.currentRound < self.comparisons.length) {
                var roundCountDown = Math.floor(self.timePerRound / 1000);
                var obj1 = self.comparisons[self.currentRound][0];
                var obj2 = self.comparisons[self.currentRound][1];
                self.currentRound += 1;
                self.activeElements = [obj1, obj2];
                createObjects(obj1, obj2);
                setTimeout(function () {
                    roundDisabled = false;
                }, 530);
                roundCounter = setTimeout(newRound, self.timePerRound);
                taskDescriptionText = mainScene.add.text(150, objectY - 190, "What is more important to you?", { fontFamily: '"Fresca"', fontSize: '40px', color: 'red' });
                roundCounterText = mainScene.add.text(380, objectY + 50, roundCountDown, { fontFamily: '"Fresca"', fontSize: '72px', color: 'red' });
                timer = setInterval(function () {
                    roundCountDown--;
                    roundCounterText.setText(roundCountDown);
                    if (roundCountDown <= 3) {
                        timerSound.play({ volume: .1, loop: false });
                    }
                }, 1000);
            } else {
                console.log("OVER");
                self.state = 'GAME_OVER';
                backgroundSound.stop();
                successSound.play({ volume: .2, loop: false });
                $scope.$apply();
                //roundCounterText = mainScene.add.text(260, 250, 'FINISH', { fontFamily: '"Fresca"', fontSize: '72px', color: 'red' });
            }
        }, pauseBetweenRounds);
    }

    // load asset files for our game
    mainScene.preload = function () {
        //audio
        mainScene.load.audio('coin', ['assets/coin.mp3',], { instances: 1 });
        mainScene.load.audio('success', ['assets/success.mp3',], { instances: 1 });
        mainScene.load.audio('maximize', ['assets/maximize.mp3',], { instances: 1 });
        mainScene.load.audio('minimize', ['assets/minimize.mp3',], { instances: 1 });
        mainScene.load.audio('timer', ['assets/timer.mp3',], { instances: 1 });
        mainScene.load.audio('background-sound', ['assets/background.mp3',], { instances: 1 });
        mainScene.load.audio('shoot', ['assets/shoot.mp3',], { instances: 1 });
        // load images
        mainScene.load.image('background', 'assets/background.png');
        mainScene.load.image('ruby', 'assets/philanthropist-coin.png');
        mainScene.load.image('topaz', 'assets/disruptor-coin.png');
        mainScene.load.image('diamond', 'assets/freespirit-coin.png');
        mainScene.load.image('emerald', 'assets/player-coin.png');
        mainScene.load.image('saphire', 'assets/achiever-coin.png');
        mainScene.load.image('star', 'assets/socializer-coin.png');
        mainScene.load.image('ground', 'assets/platform.png');
        //
        mainScene.load.image('philanthropistObject', 'assets/philanthropistObject.png');
        mainScene.load.image('socializerObject', 'assets/socializerObject.png');
        mainScene.load.image('freeSpiritObject', 'assets/freeSpiritObject.png');
        mainScene.load.image('achieverObject', 'assets/achieverObject.png');
        mainScene.load.image('playerObject', 'assets/playerObject.png');
        mainScene.load.image('disruptorObject', 'assets/disruptorObject.png');
    };

    // executed once, after assets were loaded
    mainScene.create = function () {
        // background
        mainScene.add.image(0, 0, 'background').setOrigin(0, 0);
        coinSound = mainScene.sound.add('coin');
        backgroundSound = mainScene.sound.add('background-sound');
        successSound = mainScene.sound.add('success');
        shootSound = mainScene.sound.add('shoot');
        backgroundSound.play({ volume: .2, loop: true });
        timerSound = mainScene.sound.add('timer');
        maximizeSound = mainScene.sound.add('maximize');
        minimizeSound = mainScene.sound.add('minimize');
        items = mainScene.physics.add.group();
        newRound();
    }

    // executed once, after assets were loaded
    mainScene.update = function () {

    }

    self.comparisons = shuffle(self.comparisons);

    // adding scenes
    self.game.scene.add('Main', mainScene);

    self.startTutorial = function () {
        self.state = "TUTORIAL_PLAYING";
        self.completedTutorial=false;
        $timeout(function () {
            ngIntroService.setOptions(self.introOptions);
            ngIntroService.start();
        }, 300);
    }

    self.startGame = function () {
        self.game.scene.start('Main');
        self.state = "GAME_PLAYING";
    }

    self.sendGameStats = function () {
        var data = {
            philanthropistTotal: self.philanthropistCounter,
            socializerTotal: self.socializerCounter,
            freeSpiritTotal: self.freeSpiritCounter,
            playerTotal: self.playerCounter,
            achieverTotal: self.achieverCounter,
            disruptorTotal: self.disruptorCounter,
            details: self.roundCounter,
            totalClicks:self.totalClicks
        };
        //This could be sent anywhere
        self.data=data;
    }
});