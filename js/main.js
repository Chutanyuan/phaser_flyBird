var game = new Phaser.Game(288, 505, Phaser.CANVAS, 'game');
game.States = {};

game.States.boot = function () {
    this.preload = function () {
        if (!game.device.desktop) {
            this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
            this.scale.forcePortrait = true;
            this.scale.refresh();
        }
        game.load.image('loading', 'assets/preloader.gif');
    };
    this.create = function () {
        game.state.start('preload');
    }
};
game.States.preload = function () {
    this.preload = function () {
        var preloadSprite = game.add.sprite(34, game.height / 2, 'loading');
        game.load.setPreloadSprite(preloadSprite);
        game.load.image('background', 'assets/background.png');
        game.load.image('ground', 'assets/ground.png');
        game.load.image('title', 'assets/title.png');
        game.load.spritesheet('bird', 'assets/bird.png', 34, 24, 3);
        game.load.image('btn', 'assets/start-button.png');
        game.load.spritesheet('pipe', 'assets/pipes.png', 54, 320, 2);
        game.load.bitmapFont('flappy_font', 'assets/fonts/flappyfont/flappyfont.png', 'assets/fonts/flappyfont/flappyfont.fnt');
        game.load.audio('fly_sound', 'assets/flap.wav');
        game.load.audio('score_sound', 'assets/score.wav');
        game.load.audio('hit_pipe_sound', 'assets/pipe-hit.wav');
        game.load.audio('hit_ground_sound', 'assets/ouch.wav');
        game.load.image('ready_text', 'assets/get-ready.png');
        game.load.image('play_tip', 'assets/instructions.png');
        game.load.image('game_over', 'assets/gameover.png');
        game.load.image('score_board', 'assets/scoreboard.png');
    };
    this.create = function () {
        game.state.start('menu');
    };
};
game.States.menu = function () {
    this.create = function () {
        var bg = game.add.tileSprite(0, 0, game.width, game.height, 'background');
        var ground = game.add.tileSprite(0, game.height - 112, game.width, 112, 'ground');
        bg.autoScroll(-10, 0);
        ground.autoScroll(-100, 0);
        var titleGround = game.add.group();
        titleGround.create(0, 0, 'title');
        var bird = titleGround.create(190, 10, 'bird');
        bird.animations.add('fly');
        bird.animations.play('fly', 12, true);
        titleGround.x = 35;
        titleGround.y = 100;
        game.add.tween(titleGround).to({y: 120}, 1000, null, true, 0, Number.MAX_VALUE, true);
        var btn = game.add.button(game.width / 2, game.height / 2, 'btn', function () {
            game.state.start('play');
        });
        btn.anchor.setTo(0.5, 0.5);
    }
};
game.States.play = function () {
    this.create = function () {
        this.bg = game.add.tileSprite(0, 0, game.width, game.height, 'background');
        this.pipeGroup = game.add.group();
        this.pipeGroup.enableBody = true;
        this.ground = game.add.tileSprite(0, game.height - 112, game.width, 112, 'ground')
        this.bird = game.add.sprite(50, 150, 'bird');
        this.bird.animations.add('fly');
        this.bird.animations.play('fly', 12, true);
        this.bird.anchor.setTo(0.5, 0.5);
        game.physics.enable(this.bird, Phaser.Physics.ARCADE);
        this.bird.body.gravity.y = 0;
        game.physics.enable(this.ground, Phaser.Physics.ARCADE);
        this.ground.body.immovable = true;
        this.scoreText = game.add.bitmapText(game.world.centerX - 20, 30, 'flappy_font', '0', 36);
        this.readyText = game.add.image(game.width / 2, 40, 'ready_text');
        this.playTip = game.add.image(game.width / 2, 300, 'play_tip');
        this.readyText.anchor.setTo(0.5, 0);
        this.playTip.anchor.setTo(0.5, 0);
        this.hasStarted = false;
        game.time.events.loop(900, this.generatePipes, this);
        /**
         * 初始的时候设置 game.time.events 事件停止为 false 在开始的时候 开启事件事件 碰撞检测之后设置 事件为false;
         * */
        game.time.events.stop(false);
        game.input.onDown.addOnce(this.startGame, this);
    };
    this.update = function () {
        if (!this.hasStarted) return;
        //检测 小鸟和地面的碰撞
        game.physics.arcade.collide(this.bird, this.ground, this.hitGround, null, this);
        //检测 小鸟和管道的碰撞
        game.physics.arcade.overlap(this.bird, this.pipeGroup, this.hitPipe, null, this);
        //检测 管道组中的存在 分数增加
        this.pipeGroup.forEachExists(this.checkScore, this);
        //检测 小鸟飞出屏幕外
        if(!this.bird.inWorld) this.outOfWorld();
    };
    this.generatePipes = function () {
        var gap = 150;//控制的是管道之间的距离
        var difficulty = 100; // 控制的是管道开口的位置
        var position = 50 + Math.floor((505 - 112 - difficulty - gap) * Math.random());
        var topPipeY = position - 320;//控制上管道的y轴位置
        var bottomPipeY = position + gap;
        if (this.resetPipe(topPipeY, bottomPipeY)) return;
        var topPipe = game.add.sprite(game.width, topPipeY, 'pipe', 0, this.pipeGroup);
        var bottomPipe = game.add.sprite(game.width, bottomPipeY, 'pipe', 1, this.pipeGroup);
        this.pipeGroup.setAll('checkWorldBounds', true);
        this.pipeGroup.setAll('outOfBoundsKill', true);
        this.pipeGroup.setAll('body.velocity.x', -this.gameSpeed);
    };
    this.startGame = function () {
        this.gameSpeed = 200;
        this.gameIsOver = false;
        this.hasHitGround = false;
        this.hasStarted = true;
        this.score = 0;
        this.bg.autoScroll(-(this.gameSpeed / 10), 0);
        this.ground.autoScroll(-this.gameSpeed, 0);
        this.bird.body.gravity.y = 1150;
        this.readyText.destroy();//销毁 this.readyText
        this.playTip.destroy();//销毁 this.playTip
        game.input.onDown.add(this.fly, this);//鼠标点击的时候让小鸟飞
        game.time.events.start();  //事件开启
    };
    this.stopGame = function () {
        this.bg.stopScroll();
        this.ground.stopScroll();
        this.pipeGroup.forEachExists(function (pipe) {
            pipe.body.velocity.x = 0;
        }, this);
        this.bird.animations.stop('fly', 0);
        game.input.onDown.remove(this.fly, this);//移除点击让小鸟飞的动作，否则会出现死亡后依旧可以点击的bug
        game.time.events.stop(true);
    };
    this.resetPipe = function (topPipeY, bottomPipeY) {
        var i = 0;
        this.pipeGroup.forEachDead(function (pipe) {
            if (pipe.y <= 0) {
                pipe.reset(game.width, topPipeY);
                pipe.hasScored = false;
            } else {
                pipe.reset(game.width, bottomPipeY);
            }
            pipe.body.velocity.x = -this.gameSpeed;
            i++;
        }, this);
        return i == 2;
    };
    this.hitGround = function () {
        if (this.hasHitGround) return;
        console.log('小鸟撞在地面上 游戏结束');
        this.hasHitGround = true;
        this.gameOver(true);
    };
    this.fly = function () {
        this.bird.body.velocity.y = -350;
    };
    this.hitPipe = function () {
        if (this.gameIsOver) return;
        console.log('小鸟碰撞到管道 游戏结束');
        this.gameOver();
    };
    this.gameOver = function (show_text) {
        this.gameIsOver = true;
        this.stopGame();
        if (show_text) this.showGameOverText();
    };
    this.showGameOverText = function () {
        console.log('score = ' + this.score);
        this.scoreText.destroy();
        game.bastPoint = game.bastPoint||0;
        if (this.score>game.bastPoint) game.bastPoint = this.score;
        this.gameOverGroup = game.add.group();
        var gameOverText = this.gameOverGroup.create(game.width/2,0,'game_over');
        gameOverText.anchor.setTo(0.5,0);
        var scoreboard = this.gameOverGroup.create(game.width/2,70,'score_board');
        scoreboard.anchor.setTo(0.5,0);
        game.add.bitmapText(game.width/2 + 60, 105, 'flappy_font', this.score+'', 20, this.gameOverGroup);
        game.add.bitmapText(game.width/2 + 60, 153, 'flappy_font', game.bastPoint+'', 20, this.gameOverGroup);
        var reStart = game.add.button(game.width/2,210,'btn',function () {
            game.state.start('play');
        },this,null,null,null,null,this.gameOverGroup);
        reStart.anchor.setTo(0.5,0);
        this.gameOverGroup.y = 30;
    };
    //检查分数
    this.checkScore = function (pipe) {
        if (!pipe.hasScored && pipe.y <= 0 && pipe.x < this.bird.x - 17 - 54) {
            pipe.hasScored = true;
            this.scoreText.text = ++this.score;
            return true;
        }
        return false;
    };
    this.outOfWorld = function () {
        this.gameOver();
    };
};

game.state.add('boot', game.States.boot);
game.state.add('preload', game.States.preload);
game.state.add('menu', game.States.menu);
game.state.add('play', game.States.play);

game.state.start('boot');