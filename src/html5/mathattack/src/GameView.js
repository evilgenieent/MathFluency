/*
Copyright 2011, Carnegie Learning

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

var cocos = require('cocos2d');
var geo = require('geometry');

var Numberline = require('Numberline').Numberline;

var MOT = require('ModifyOverTime').ModifyOverTime;
var XML = require('XML').XML;

var GameView = cocos.nodes.Node.extend({
    roundLabel      : null,     // Text label "Round"
    roundCount      : null,     // Current round number as a text label
    
    timeLabel       : null,     // Text label "Time"
    timeCount       : null,     // Current time remaining as a text label
    
    remainingLabel  : null,     // Text label "Remaining"
    
    incorrectLabel  : null,     // Text label "Misses"
    
    scoreLabel      : null,     // Text label "Score"
    scoreCount      : null,     // Current score as a text label
    
    line            : null,     // Holds the numberline
    
    misses          : null,     // Indicators for incorrect answers
    corrects        : null,     // Indicators for correct answers

    init: function(xml) {
        GameView.superclass.init.call(this);
        
        // Background of cut out question window
        var bg = cocos.nodes.Sprite.create({file: '/resources/whiteback.png'});
        bg.set('position', new geo.Point(450, 300));
        bg.set('zOrder', -1);
        this.addChild({child: bg});
        
        // Pane used to create a fade effect between questions
        this.fadePane = cocos.nodes.Sprite.create({file: '/resources/whiteback.png'});
        this.fadePane.set('position', new geo.Point(450, 300));
        this.fadePane.set('zOrder', 1);
        this.fadePane.set('opacity',0);
        this.addChild({child: this.fadePane});
        
        // Foreground window
        var fg = cocos.nodes.Sprite.create({file: '/resources/background.png'});
        fg.set('anchorPoint', new geo.Point(0, 0));
        fg.set('zOrder', 2);
        this.addChild({child: fg});
        
        // Numberline
        this.line = Numberline.create();
        this.line.set('anchorPoint', new geo.Point(0, 0));
        this.line.set('position', new geo.Point(65, 5));
        this.line.set('zOrder', 3);
        this.addChild({child: this.line});
        
        // Text labels
        var tc = '#000000';
        this.buildLabel('roundLabel',       'Round',    tc, 110, 545);
        this.buildLabel('roundCount',       '0',        tc, 110, 575);
        this.buildLabel('timeLabel',        'Time',     tc, 230, 545);
        this.buildLabel('timeCount',        '0',        tc, 230, 575);
        this.buildLabel('remainingLabel',   'Correct',  tc, 430, 545);
        this.buildLabel('incorrectLabel',   'Misses',   tc, 640, 545);
        this.buildLabel('scoreLabel',       'Score',    tc, 780, 545);
        this.buildLabel('scoreCount',       '0',        tc, 780, 575);
        
        // Incorrect answer indicators
        this.misses = [[], []];
        for(var i=0; i<3; i+=1) {
            this.misses[0].push(cocos.nodes.Sprite.create({file: '/resources/status-incorrect-gray.png'}));
            this.misses[0][i].set('position', new geo.Point(618 + i*22, 575));
            this.misses[0][i].set('zOrder', 3);
            this.misses[1].push(cocos.nodes.Sprite.create({file: '/resources/status-incorrect-red.png'}));
            this.misses[1][i].set('position', new geo.Point(618 + i*22, 575));
            this.misses[1][i].set('zOrder', 3);
            this.addChild({child: this.misses[0][i]});
        }
        
        // Correct answers remaining indicators
        this.corrects = [[], []];
        for(var i=0; i<7; i+=1) {
            this.corrects[0].push(cocos.nodes.Sprite.create({file: '/resources/status-correct-gray.png'}));
            this.corrects[0][i].set('position', new geo.Point(364 + i*22, 575));
            this.corrects[0][i].set('zOrder', 3);
            this.corrects[1].push(cocos.nodes.Sprite.create({file: '/resources/status-correct-green.png'}));
            this.corrects[1][i].set('position', new geo.Point(364 + i*22, 575));
            this.corrects[1][i].set('zOrder', 3);
            this.addChild({child: this.corrects[0][i]});
        }
    },
    
    // Helper function for initializing all of the labels
    buildLabel: function(name, str, fc, x, y) {
        this[name] = cocos.nodes.Label.create({fontColor: fc, string: str});
        this[name].set('position', new geo.Point(x, y));
        this[name].set('zOrder', 3);
        this.addChild({child: this[name]});
    },
    
    // Enables the specified miss icon
    enableMiss: function(i) {
        this.removeChild({child: this.misses[0][i]});
        this.addChild({child: this.misses[1][i]});
    },
    
    // Enables the specified remaining icon
    enableRemaining: function(i) {
        this.removeChild({child: this.corrects[0][i]});
        this.addChild({child: this.corrects[1][i]});
    },
    
    // Resets the icon based counters
    resetCounters: function() {
        for(var i=0; i<this.misses[0].length; i+=1) {
            this.removeChild({child: this.misses[0][i]});
            this.removeChild({child: this.misses[1][i]});
            this.addChild({child: this.misses[0][i]});
        }
        
        for(var i=0; i<this.corrects[0].length; i+=1) {
            this.removeChild({child: this.corrects[0][i]});
            this.removeChild({child: this.corrects[1][i]});
            this.addChild({child: this.corrects[0][i]});
        }
    },
    
    // Prepares the GameView for a new question
    nextQuestion: function() {
        this.roundCount.set('string', parseInt(this.roundCount.get('string')) + 1);
        this.resetCounters();
        this.line.clearAllSlots();
    },
    
    // Fades the fadePane in and out
    fadeCycle: function() {
        MOT.create(0, 255, 0.5).bind(this.fadePane, 'opacity');
        
        var that = this;
        setTimeout(function(){ MOT.create(255, -255, 0.5).bind(that.fadePane, 'opacity'); }, 500);
    }
});

exports.GameView = GameView;