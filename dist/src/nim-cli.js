"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nim_1 = require("@luchsamapparat/nim");
const colors = require("colors");
const inquirer = require("inquirer");
const strategies = nim_1.getStrategies();
const strategyNames = {
    [nim_1.RandomStrategy.name]: 'Randomly remove 1 to 3 tokens',
    [nim_1.AlwaysOneStrategy.name]: 'Always remove 1 token',
    [nim_1.MimicHumanStrategy.name]: 'Remove the same number of tokens as you did before',
    [nim_1.RemainderStrategy.name]: 'Always try to get the heap size to (n * 4) + 1'
};
function run() {
    log(colors.rainbow('Welcome to Nim - The Game'));
    setupGame().then(play);
}
exports.run = run;
function setupGame() {
    return inquirer.prompt([{
            name: 'heapSize',
            type: 'input',
            message: 'What is the size of the heap?',
            default: '13',
            validate: value => !isNaN(parseInt(value, 10)),
        }, {
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
            choices: strategies.map(StrategyCls => ({
                value: StrategyCls.name,
                name: strategyNames[StrategyCls.name]
            }))
        }])
        .then(answers => new nim_1.NimGame(parseInt(answers.heapSize, 10), answers.startingPlayer, toStrategy(answers.strategy)));
}
function play(nimGame) {
    const firstRound = nimGame.start();
    logRound(firstRound);
    return playRounds(nimGame, firstRound)
        .then((lastRound) => log(colors.rainbow(`${lastRound.winner} has won the game.`)));
}
function playRounds(nimGame, previousRound) {
    return inquirer.prompt([{
            name: 'tokensToRemove',
            type: 'input',
            message: 'Your turn:',
            validate: value => validateTokensToRemove(previousRound, value)
        }])
        .then(answers => {
        const round = nimGame.playRound(toNumber(answers.tokensToRemove));
        logRound(round);
        return round.isFinished ? round : playRounds(nimGame, round);
    });
}
function validateTokensToRemove(previousRound, value) {
    const tokensToRemove = toNumber(value);
    const maxTokensToRemove = nim_1.getMaxTokensToRemove(previousRound.heapSize);
    const isValid = !isNaN(tokensToRemove) && tokensToRemove > 0 && tokensToRemove <= maxTokensToRemove;
    return isValid ? true : `You may remove 1 to ${maxTokensToRemove} tokens.`;
}
function toStrategy(strategyName) {
    const StrategyCls = strategies.find(strategyImpl => strategyImpl.name === strategyName);
    return new StrategyCls();
}
function toNumber(stringValue) {
    return parseInt(stringValue, 10);
}
function logRound(round) {
    round.turns.forEach(turn => log(`${turn.player} has removed ${turn.tokensRemoved} tokens from the heap.`));
    if (!round.isFinished) {
        log(`There are now ${round.heapSize} tokens on the heap.`);
    }
}
function log(message) {
    // tslint:disable-next-line:no-console
    console.log(message);
}
