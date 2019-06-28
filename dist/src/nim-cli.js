"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nim_1 = require("@luchsamapparat/nim");
const colors = require("colors");
const inquirer = require("inquirer");
const lodash_1 = require("lodash");
const strategyNames = {
    randomStrategy: 'Randomly remove 1 to 3 tokens',
    alwaysMinStrategy: 'Always remove 1 token',
    mimicHumanStrategy: 'Remove the same number of tokens as you did before',
    remainderStrategy: 'Always try to get the heap size to (n * 4) + 1'
};
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        log(colors.rainbow('Welcome to Nim - The Game'));
        return setupGame().then(play);
    });
}
exports.run = run;
function setupGame() {
    return __awaiter(this, void 0, void 0, function* () {
        return inquirer.prompt([{
                name: 'startingPlayer',
                type: 'list',
                message: 'Who should start?',
                choices: [{
                        value: nim_1.Player.Human,
                        name: 'You'
                    }, {
                        value: nim_1.Player.Machine,
                        name: 'The Computer'
                    }]
            }, {
                name: 'strategy',
                type: 'list',
                message: 'What strategy should the computer use?',
                choices: lodash_1.map(strategyNames, (description, name) => ({
                    value: name,
                    name: description
                }))
            }])
            .then((answers) => nim_1.startGame({
            heapSize: 13,
            minTokensToRemove: 1,
            maxTokensToRemove: 3,
            startingPlayer: answers.startingPlayer,
            strategy: answers.strategy
        }));
    });
}
function play(gameState) {
    return __awaiter(this, void 0, void 0, function* () {
        logTurns(gameState, [nim_1.Player.Machine]);
        return playRounds(gameState)
            .then(updatedGameState => log(colors.rainbow(`${updatedGameState.winner} has won the game.`)));
    });
}
function playRounds(gameState) {
    return __awaiter(this, void 0, void 0, function* () {
        return inquirer.prompt([{
                name: 'tokensToRemove',
                type: 'input',
                message: 'Your turn:',
                validate: (value) => validateTokensToRemove(gameState, value)
            }])
            .then((answers) => {
            const updatedGameState = nim_1.playRound(lodash_1.toNumber(answers.tokensToRemove))(gameState);
            const lastTurnsBy = (updatedGameState.winner === nim_1.Player.Human) ? [nim_1.Player.Human] : [nim_1.Player.Human, nim_1.Player.Machine];
            logTurns(updatedGameState, lastTurnsBy);
            return lodash_1.isNull(updatedGameState.winner) ? playRounds(updatedGameState) : updatedGameState;
        });
    });
}
function validateTokensToRemove(gameState, value) {
    const tokensToRemove = lodash_1.toNumber(value);
    const { minTokensAllowedToRemove, maxTokensAllowedToRemove } = gameState;
    const isValid = !isNaN(tokensToRemove) && tokensToRemove >= minTokensAllowedToRemove && tokensToRemove <= maxTokensAllowedToRemove;
    return isValid ? true : `You may remove between ${minTokensAllowedToRemove} and ${maxTokensAllowedToRemove} tokens.`;
}
function logTurns(gameState, lastTurnsBy) {
    lastTurnsBy.forEach(lastTurnBy => {
        const turnByPlayer = lodash_1.findLast(gameState.turns, turn => turn.player === lastTurnBy);
        if (!lodash_1.isUndefined(turnByPlayer)) {
            log(`${turnByPlayer.player} has removed ${turnByPlayer.tokensRemoved} tokens from the heap.`);
        }
    });
    if (lodash_1.isNull(gameState.winner)) {
        log(`There are now ${gameState.heapSize} tokens on the heap.`);
    }
}
function log(message) {
    // tslint:disable-next-line:no-console
    console.log(message);
}
