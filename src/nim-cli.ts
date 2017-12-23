import { AlwaysOneStrategy, getMaxTokensToRemove, getStrategies, MimicHumanStrategy, NimGame, Player, RandomStrategy, RemainderStrategy, Round, Strategy } from '@luchsamapparat/nim';
import * as colors from 'colors';
import * as inquirer from 'inquirer';

const strategies = getStrategies();
const strategyNames = {
    [RandomStrategy.name]: 'Randomly remove 1 to 3 tokens',
    [AlwaysOneStrategy.name]: 'Always remove 1 token',
    [MimicHumanStrategy.name]: 'Remove the same number of tokens as you did before',
    [RemainderStrategy.name]: 'Always try to get the heap size to (n * 4) + 1'
};

export function run() {
    log(colors.rainbow('Welcome to Nim - The Game'));

    setupGame().then(play);
}

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
            value: Player.Human,
            name: 'You'
        }, {
            value: Player.Machine,
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
        .then(answers => new NimGame(
            parseInt(answers.heapSize, 10),
            answers.startingPlayer,
            toStrategy(answers.strategy)
        ));
}

function play(nimGame: NimGame) {
    const firstRound = nimGame.start();
    logRound(firstRound);
    return playRounds(nimGame, firstRound)
        .then((lastRound: Round) => log(colors.rainbow(`${lastRound.winner} has won the game.`)));
}

function playRounds(nimGame: NimGame, previousRound: Round): Promise<Round> {
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

function validateTokensToRemove(previousRound: Round, value: string) {
    const tokensToRemove = toNumber(value);
    const maxTokensToRemove = getMaxTokensToRemove(previousRound.heapSize);
    const isValid = !isNaN(tokensToRemove) && tokensToRemove > 0 && tokensToRemove <= maxTokensToRemove;
    return isValid ? true : `You may remove 1 to ${maxTokensToRemove} tokens.`;
}

function toStrategy(strategyName: string): Strategy {
    const StrategyCls = strategies.find(strategyImpl => strategyImpl.name === strategyName);
    return new StrategyCls();
}

function toNumber(stringValue: string): number {
    return parseInt(stringValue, 10);
}

function logRound(round: Round) {
    round.turns.forEach(
        turn => log(`${turn.player} has removed ${turn.tokensRemoved} tokens from the heap.`)
    );

    if (!round.isFinished) {
        log(`There are now ${round.heapSize} tokens on the heap.`);
    }
}

function log(message: string) {
    // tslint:disable-next-line:no-console
    console.log(message);
}
