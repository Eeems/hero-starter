/* eslint no-unused-vars: 0 */
/* eslint one-var: 0 */
var moves = {
    // Aggressor
    aggressor: function(gameData, helpers){
        return gameData.activeHero.health <= 30
            ? helpers.findNearestHealthWell(gameData)
            : helpers.findNearestEnemy(gameData);
    },
    // Health Nut
    healthNut: function(gameData, helpers){
        return gameData.activeHero.health <= 75
            ? helpers.findNearestHealthWell(gameData)
            : helpers.findNearestNonTeamDiamondMine(gameData);
    },
    // Balanced
    balanced: function(gameData, helpers){
        return (gameData.turn / 2) % 2
            ? moves.aggressor(gameData, helpers)
            : moves.priest(gameData, helpers);
    },
    // The "Northerner"
    // This hero will walk North.  Always.
    northener: function(gameData, helpers){
        return 'North';
    },
    // The "Blind Man"
    // This hero will walk in a random direction each turn.
    blindMan: function(gameData, helpers){
        return ['North', 'South', 'East', 'West'][Math.floor(Math.random()*4)];
    },
    // The "Priest"
    // This hero will heal nearby friendly champions.
    priest: function(gameData, helpers){
        return gameData.activeHero.health < 60
            ? helpers.findNearestHealthWell(gameData)
            : helpers.findNearestTeamMember(gameData);
    },
    // The "Unwise Assassin"
    // This hero will attempt to kill the closest enemy hero. No matter what.
    unwiseAssassin: function(gameData, helpers){
        return gameData.activeHero.health < 30
            ? helpers.findNearestHealthWell(gameData)
            : helpers.findNearestEnemy(gameData);
    },
    // The "Careful Assassin"
    // This hero will attempt to kill the closest weaker enemy hero.
    carefulAssassin: function(gameData, helpers){
        return gameData.activeHero.health < 50
            ? helpers.findNearestHealthWell(gameData)
            : helpers.findNearestWeakerEnemy(gameData);
    },
    // The "Safe Diamond Miner"
    // This hero will attempt to capture enemy diamond mines.
    safeDiamondMiner: function(gameData, helpers){
        var me = gameData.activeHero,
            healthWellStats = helpers.findNearestObjectDirectionAndDistance(
                gameData.board,
                me,
                function(boardTile){
                    return boardTile.type === 'HealthWell';
                }
            );
        if(me.health < 40 || (me.health < 100 && healthWellStats.distance === 1)){
            return healthWellStats.direction;
        }else{
            return helpers.findNearestNonTeamDiamondMine(gameData);
        }
    },
    // The "Selfish Diamond Miner"
    // This hero will attempt to capture diamond mines (even those owned by teammates).
    selfishDiamondMiner: function(gameData, helpers){
        var me = gameData.activeHero,
            healthWellStats = helpers.findNearestObjectDirectionAndDistance(gameData.board, me, function(boardTile){
                return boardTile.type === 'HealthWell';
            });
        if(me.health < 40 || (me.health < 100 && healthWellStats.distance === 1)){
            return healthWellStats.direction;
        }else{
            return helpers.findNearestUnownedDiamondMine(gameData);
        }
    },
    // The "Coward"
    // This hero will try really hard not to die.
    coward: function(gameData, helpers){
        return helpers.findNearestHealthWell(gameData);
    },
    altruest: function(gameData, helpers){
        var hero = gameData.activeHero;
        if(hero.health == 100){
            hero.healing = false;
        }else if(hero.health < 70){
            hero.healing = true;
        }
        if(hero.healing){
            var wellDirection = helpers.findNearestHealthWell(gameData),
                enemyDirection = helpers.findNearestEnemy(gameData);
            if(wellDirection && enemyDirection !== wellDirection){
                return wellDirection;
            }
            var friendlyDirection = helpers.findNearestTeamMember(gameData);
            if(friendlyDirection && enemyDirection !== friendlyDirection){
                return friendlyDirection;
            }
            var direction = ({
                North: 'South',
                South: 'North',
                East: 'West',
                West: 'East'
            })[enemyDirection];
            if(helpers.validateDirection(gameData, direction, hero)){
                return direction;
            }else{
                var directions = helpers.getDirections(gameData, hero),
                    fDirection = false,
                    tile, sDirection, sDirections;
                for(direction in directions){
                    tile = directions[direction];
                    if(!helpers.nextTo(gameData, tile, function(tile){
                        return tile.type === 'Hero' && tile.team !== hero.team
                    })){
                        fDirection = direction;
                        break;
                    }
                }
                return fDirection;
            }
        }else{
            return helpers.findNearestHurtTeamMember(gameData) ||
                helpers.findNearestNonTeamDiamondMine(gameData) ||
                helpers.findNearestEnemy(gameData) ||
                helpers.findNearestHealthWell(gameData);
        }
    }
};
module.exports = moves.altruest;
