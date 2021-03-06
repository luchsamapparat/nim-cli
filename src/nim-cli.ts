import { GameState, Player, playRound, startGame, StrategyName } from '@luchsamapparat/nim';
import * as colors from 'colors';
import * as inquirer from 'inquirer';
import { findLast, isNull, isUndefined, map, toNumber } from 'lodash';

const strategyNames = {
    randomStrategy: 'Randomly remove 1 to 3 tokens',
    alwaysMinStrategy: 'Always remove 1 token',
    mimicHumanStrategy: 'Remove the same number of tokens as you did before',
    remainderStrategy: 'Always try to get the heap size to (n * 4) + 1'
};

export async function run() {
    log(colors.rainbow('Welcome to Nim - The Game'));

    return setupGame().then(play);
}

interface GameSetupAnswers {
    startingPlayer: Player;
    strategy: StrategyName;
}

async function setupGame() {
    return inquirer.prompt([{
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
        choices: map(strategyNames, (description, name) => ({
            value: name,
            name: description
        }))
    }])
        .then((answers: GameSetupAnswers) => startGame({
            heapSize: 13,
            minTokensToRemove: 1,
            maxTokensToRemove: 3,
            startingPlayer: answers.startingPlayer as Player,
            strategy: answers.strategy as StrategyName
        }));
}

async function play(gameState: GameState) {
    logTurns(gameState, [Player.Machine]);

    return playRounds(gameState)
        .then(updatedGameState => log(colors.rainbow(`${updatedGameState.winner} has won the game.`)));
}

interface RoundAnswers {
    tokensToRemove: number;
}

async function playRounds(gameState: GameState): Promise<GameState> {
    return inquirer.prompt([{
        name: 'tokensToRemove',
        type: 'input',
        message: 'Your turn:',
        validate: (value: string) => validateTokensToRemove(gameState, value)
    }])
        .then((answers: RoundAnswers) => {
            const updatedGameState = playRound(toNumber(answers.tokensToRemove))(gameState);
            const lastTurnsBy = (updatedGameState.winner === Player.Human) ? [Player.Human] : [Player.Human, Player.Machine];
            logTurns(updatedGameState, lastTurnsBy);
            return isNull(updatedGameState.winner) ? playRounds(updatedGameState) : updatedGameState;
        });
}

function validateTokensToRemove(gameState: GameState, value: string) {
    const tokensToRemove = toNumber(value);
    const { minTokensAllowedToRemove, maxTokensAllowedToRemove } = gameState;
    const isValid = !isNaN(tokensToRemove) && tokensToRemove >= minTokensAllowedToRemove && tokensToRemove <= maxTokensAllowedToRemove;
    return isValid ? true : `You may remove between ${minTokensAllowedToRemove} and ${maxTokensAllowedToRemove} tokens.`;
}

function logTurns(gameState: GameState, lastTurnsBy: Player[]) {
    lastTurnsBy.forEach(lastTurnBy => {
        const turnByPlayer = findLast(gameState.turns, turn => turn.player === lastTurnBy);

        if (!isUndefined(turnByPlayer)) {
            log(`${turnByPlayer.player} has removed ${turnByPlayer.tokensRemoved} tokens from the heap.`);
        }
    });

    if (isNull(gameState.winner)) {
        log(`There are now ${gameState.heapSize} tokens on the heap.`);
    }
}

function log(message: string) {
    // tslint:disable-next-line:no-console
    console.log(message);
}
