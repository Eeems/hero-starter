var helpers = {
    // Returns false if the given coordinates are out of range
    validCoordinates: function(board, distanceFromTop, distanceFromLeft){
        return (!(distanceFromTop < 0 || distanceFromLeft < 0 ||
          distanceFromTop > board.lengthOfSide - 1 || distanceFromLeft > board.lengthOfSide - 1));
    },
    // Make sure that the direction you want to go is empty
    validateDirection: function(gameData, direction, hero){
        if(hero === undefined){
            hero = gameData.activeHero;
        }
        var tile = helpers.getDirection(gameData, direction, hero);
        return tile && tile.type === 'Unoccupied';
    },
    getDirection: function(gameData, direction, hero){
        if(hero === undefined){
            hero = gameData.activeHero;
        }
        return helpers.getTileNearby(gameData.board, hero.distanceFromTop, hero.distanceFromLeft, direction);
    },
    getDirections: function(gameData, hero){
        if(hero === undefined){
            hero = gameData.activeHero;
        }
        return {
            North: helpers.getDirection(gameData, 'North', hero),
            South: helpers.getDirection(gameData, 'South', hero),
            East: helpers.getDirection(gameData, 'East', hero),
            West: helpers.getDirection(gameData, 'West', hero)
        };
    },
    getValidDirections: function(gameData, hero){
        var directions = helpers.getDirections(gameData, hero),
            results = [],
            direction, tile;
        for(direction in directions){
            tile = directions[direction];
            if(tile){
                results.push([direction, tile]);
            }
        }
        return results;
    },
    nextTo: function(gameData, hero, validCallback){
        var directions = helpers.getDirections(gameData, hero),
            direction, tile;
        for(direction in directions){
            tile = directions[direction];
            if(validCallback(tile)){
                return true;
            }
        }
        return false;
    },
    getTileNearby: function(board, distanceFromTop, distanceFromLeft, direction){
        // These are the X/Y coordinates
        var fromTopNew = distanceFromTop,
            fromLeftNew = distanceFromLeft;

        // This associates the cardinal directions with an X or Y coordinate
        if(direction === 'North'){
            fromTopNew -= 1;
        }else if(direction === 'East'){
            fromLeftNew += 1;
        }else if(direction === 'South'){
            fromTopNew += 1;
        }else if(direction === 'West'){
            fromLeftNew -= 1;
        }else{
            return false;
        }

        // If the coordinates of the tile nearby are valid, return the tile object at those coordinates
        if(helpers.validCoordinates(board, fromTopNew, fromLeftNew)){
            return board.tiles[fromTopNew][fromLeftNew];
        }else{
            return false;
        }
    },
    // Returns an object with certain properties of the nearest object we are looking for
    findNearestObjectDirectionAndDistance: function(board, fromTile, tileCallback){
        // Storage queue to keep track of places the fromTile has been
        var queue = [],
            // Keeps track of places the fromTile has been for constant time lookup later
            visited = {},
            coords, directions, i, direction, nextTile, key, isGoalTile,
            correctDirection, distance, finalCoords, goalTile,
            // Variable assignments for fromTile's coordinates
            dft = fromTile.distanceFromTop,
            dfl = fromTile.distanceFromLeft,
            // Stores the coordinates, the direction fromTile is coming from, and it's location
            visitInfo = [dft, dfl, 'None', 'START'];
        // Just a unique way of storing each location we've visited
        visited[dft + '|' + dfl] = true;
        // Push the starting tile on to the queue
        queue.push(visitInfo);
        // While the queue has a length
        while(queue.length > 0){
            // Shift off first item in queue
            coords = queue.shift();
            // Reset the coordinates to the shifted object's coordinates
            dft = coords[0];
            dfl = coords[1];
            // Loop through cardinal directions
            directions = ['North', 'East', 'South', 'West'];
            for(i = 0; i < directions.length; i++){
                // For each of the cardinal directions get the next tile...
                direction = directions[i];
                // ...Use the getTileNearby helper method to do this
                nextTile = helpers.getTileNearby(board, dft, dfl, direction);
                // If nextTile is a valid location to move...
                if(nextTile){
                    // Assign a key variable the nextTile's coordinates to put into our visited object later
                    key = nextTile.distanceFromTop + '|' + nextTile.distanceFromLeft;
                    isGoalTile = false;
                    try{
                        isGoalTile = tileCallback(nextTile);
                    }catch(err){
                        isGoalTile = false;
                    }
                    // If we have visited this tile before
                    if(visited.hasOwnProperty(key)){
                        // Do nothing--this tile has already been visited
                        // Is this tile the one we want?
                    }else if(isGoalTile){
                        // This variable will eventually hold the first direction we went on this path
                        correctDirection = direction;
                        // This is the distance away from the final destination that will be incremented in a bit
                        distance = 1;
                        // These are the coordinates of our target tileType
                        finalCoords = [nextTile.distanceFromTop, nextTile.distanceFromLeft];
                        // Loop back through path until we get to the start
                        while(coords[3] !== 'START'){
                            // Haven't found the start yet, so go to previous location
                            correctDirection = coords[2];
                            // We also need to increment the distance
                            distance++;
                            // And update the coords of our current path
                            coords = coords[3];
                        }
                        // Return object with the following pertinent info
                        goalTile = nextTile;
                        goalTile.direction = correctDirection;
                        goalTile.distance = distance;
                        goalTile.coords = finalCoords;
                        return goalTile;
                    // If the tile is unoccupied, then we need to push it into our queue
                    }else if(nextTile.type === 'Unoccupied'){
                        queue.push([nextTile.distanceFromTop, nextTile.distanceFromLeft, direction, coords]);
                        // Give the visited object another key with the value we stored earlier
                        visited[key] = true;
                    }
                }
            }
        }

        // If we are blocked and there is no way to get where we want to go, return false
        return false;
    },
    // Returns the direction of the nearest non-team diamond mine or false, if there are no diamond mines
    findNearestNonTeamDiamondMine: function(gameData){
        var hero = gameData.activeHero,
            board = gameData.board,
            // Get the path info object
            pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile){
                if(mineTile.type === 'DiamondMine'){
                    if(mineTile.owner){
                        return mineTile.owner.team !== hero.team;
                    }else{
                        return true;
                    }
                }else{
                    return false;
                }
            }, board);

        // Return the direction that needs to be taken to achieve the goal
        return pathInfoObject.direction;
    },
    // Returns the nearest unowned diamond mine or false, if there are no diamond mines
    findNearestUnownedDiamondMine: function(gameData){
        var hero = gameData.activeHero,
            board = gameData.board,
            // Get the path info object
            pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(mineTile){
                if(mineTile.type === 'DiamondMine'){
                    if(mineTile.owner){
                        return mineTile.owner.id !== hero.id;
                    }else{
                        return true;
                    }
                }else{
                    return false;
                }
            });

        // Return the direction that needs to be taken to achieve the goal
        return pathInfoObject.direction;
    },
    // Returns the nearest health well or false, if there are no health wells
    findNearestHealthWell: function(gameData){
        var hero = gameData.activeHero,
            board = gameData.board,
            // Get the path info object
            pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(healthWellTile){
                return healthWellTile.type === 'HealthWell';
            });
        // Return the direction that needs to be taken to achieve the goal
        return pathInfoObject.direction;
    },
    // Returns the direction of the nearest enemy with lower health
    // (or returns false if there are no accessible enemies that fit this description)
    findNearestWeakerEnemy: function(gameData){
        var hero = gameData.activeHero,
            board = gameData.board,
            // Get the path info object
            pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile){
                return enemyTile.type === 'Hero' && enemyTile.team !== hero.team && enemyTile.health < hero.health;
            });
        // Return the direction that needs to be taken to achieve the goal
        // If no weaker enemy exists, will simply return undefined, which will
        // be interpreted as "Stay" by the game object
        return pathInfoObject.direction;
    },
    // Returns the direction of the nearest enemy
    // (or returns false if there are no accessible enemies)
    findNearestEnemy: function(gameData){
        var hero = gameData.activeHero,
            board = gameData.board,
            // Get the path info object
            pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(enemyTile){
                return enemyTile.type === 'Hero' && enemyTile.team !== hero.team;
            });
        // Return the direction that needs to be taken to achieve the goal
        return pathInfoObject.direction;
    },
    // Returns the direction of the nearest friendly champion
    // (or returns false if there are no accessible friendly champions)
    findNearestTeamMember: function(gameData){
        var hero = gameData.activeHero,
            board = gameData.board,
            // Get the path info object
            pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(heroTile){
                return heroTile.type === 'Hero' && heroTile.team === hero.team;
            });
        // Return the direction that needs to be taken to achieve the goal
        return pathInfoObject.direction;
    },
    // Returns the direction of the nearest friendly champion
    // (or returns false if there are no accessible friendly champions)
    findNearestHurtTeamMember: function(gameData){
        var hero = gameData.activeHero,
            board = gameData.board,
            // Get the path info object
            pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function(heroTile){
                return hero.health < 100 && heroTile.type === 'Hero' && heroTile.team === hero.team;
            });
        // Return the direction that needs to be taken to achieve the goal
        if(pathInfoObject){
            return pathInfoObject.direction;
        }
        return false;
    },
    shuffleArray: function(a){
        if(a.length){
            var i, j, temp;
            for(i = a.length - 1; i > 0; i--){
                j = Math.floor(Math.random() * (i + 1));
                temp = a[i];
                a[i] = a[j];
                a[j] = temp;
            }
        }
    }
};

module.exports = helpers;
