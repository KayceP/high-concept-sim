// High Concept 1 Simulator - Main JavaScript

// Game State
let gameState = {
    phase: 0, // 0: Alpha Resolution, 1: Gamma Resolution, 2: Tower Soaking
    subPhase: 0, // For multi-step phases: 0 = fusion, 1 = tower soak, 2 = splicer positioning
    players: [],
    towers: [],
    hintsVisible: false,
    phaseSolved: false, // Track if current phase is solved
    usedPerfections: [], // Track which Perfection types were used in fusion
    unusedPerfection: null, // Track which Perfection type was NOT used
    requiredConception: null // Track which Conception type is needed for Phase 2 towers
};

// Player roles and names
const PLAYER_ROLES = [
    { name: 'MT', role: 'tank' },
    { name: 'OT', role: 'tank' },
    { name: 'H1', role: 'healer' },
    { name: 'H2', role: 'healer' },
    { name: 'D1', role: 'dps' },
    { name: 'D2', role: 'dps' },
    { name: 'D3', role: 'dps' },
    { name: 'D4', role: 'dps' }
];

// Debuff types
const DEBUFF_TYPES = {
    ALPHA_SHORT: 'alpha-short',    // 8s timer
    ALPHA_LONG: 'alpha-long',      // 26s timer
    BETA_SHORT: 'beta-short',      // 8s timer
    BETA_LONG: 'beta-long',        // 26s timer
    GAMMA_SHORT: 'gamma-short',    // 8s timer
    GAMMA_LONG: 'gamma-long',      // 26s timer
    MULTISPLICE: 'multisplice',    // Requires 2-player stack
    SUPERSPLICE: 'supersplice'     // Requires 3-player stack
};

// Perfection types (from Imperfection explosions)
const PERFECTION_TYPES = {
    ALPHA: 'perfection-alpha',     // Fire (red, dominant), water, wind
    BETA: 'perfection-beta',       // Poison (yellow, dominant), lightning, wind
    GAMMA: 'perfection-gamma'      // Plant (orange, dominant), lightning, water
};

// Conception types (from Perfection fusion)
const CONCEPTION_TYPES = {
    WINGED: 'winged',              // Green/Wind (Alpha + Beta)
    AQUATIC: 'aquatic',            // Blue/Water (Alpha + Gamma)
    SHOCKING: 'shocking',          // Purple/Lightning (Beta + Gamma)
    FIERY: 'fiery',                // Red/Fire (Alpha + Alpha) - failure state
    TOXIC: 'toxic',                // Yellow/Poison (Beta + Beta) - failure state
    GROWING: 'growing'             // Orange/Plant (Gamma + Gamma) - failure state
};

// Tower element types
const TOWER_ELEMENTS = {
    WIND: 'wind',       // Green - requires Winged Conception
    WATER: 'water',     // Blue - requires Aquatic Conception
    LIGHTNING: 'lightning' // Purple - requires Shocking Conception
};

// Initialize game
function init() {
    setupEventListeners();
    resetGame();
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('checkBtn').addEventListener('click', checkSolution);
    document.getElementById('autoSolveBtn').addEventListener('click', autoSolve);
    document.getElementById('hintsBtn').addEventListener('click', toggleHints);
    document.getElementById('tutorialBtn').addEventListener('click', showTutorial);
    document.getElementById('nextPhaseBtn').addEventListener('click', nextPhase);
    
    // Modal close
    const modal = document.getElementById('tutorialModal');
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Reset game and randomize debuffs
function resetGame() {
    gameState.phase = 0;
    gameState.subPhase = 0;
    gameState.players = [];
    gameState.towers = [];
    gameState.phaseSolved = false;
    gameState.usedPerfections = [];
    gameState.unusedPerfection = null;
    gameState.requiredConception = null;
    
    // Create players with randomized debuffs
    const debuffs = generateRandomDebuffs();
    
    PLAYER_ROLES.forEach((roleInfo, index) => {
        gameState.players.push({
            id: index,
            name: roleInfo.name,
            role: roleInfo.role,
            debuffs: debuffs[index],
            position: getDefaultPosition(index),
            perfectionType: null,      // Which Perfection buff they have (alpha/beta/gamma)
            conceptionType: null,      // Which Conception buff they have (winged/aquatic/shocking)
            needsFusion: false,        // Whether they need to fuse with another player
            hasFused: false,           // Whether they've successfully fused
            fusionPartner: null        // ID of the player they fused with
        });
    });
    
    updatePhaseDisplay();
    renderPlayers();
    renderPlayerList();
    clearTowers();
    clearFeedback();
    updateHints();
}

// Generate random debuff assignments
function generateRandomDebuffs() {
    // Create debuff pool - each player gets exactly ONE debuff
    const allDebuffs = [
        DEBUFF_TYPES.ALPHA_SHORT,
        DEBUFF_TYPES.ALPHA_LONG,
        DEBUFF_TYPES.BETA_SHORT,
        DEBUFF_TYPES.BETA_LONG,
        DEBUFF_TYPES.GAMMA_SHORT,
        DEBUFF_TYPES.GAMMA_LONG,
        DEBUFF_TYPES.MULTISPLICE,
        DEBUFF_TYPES.SUPERSPLICE
    ];
    
    // Shuffle debuffs
    shuffle(allDebuffs);
    
    // Assign one debuff to each player
    const debuffs = allDebuffs.map(debuff => [debuff]);
    
    return debuffs;
}

// Shuffle array (Fisher-Yates algorithm)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Get default starting position for player
function getDefaultPosition(index) {
    const arena = document.getElementById('arena');
    const rect = arena.getBoundingClientRect();
    const centerX = 275; // Center of 600px arena minus player size
    const centerY = 275;
    const radius = 200;
    
    // Position players in a circle initially
    const angle = (index / 8) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    return { x, y };
}

// Render players on arena
function renderPlayers() {
    const container = document.getElementById('playersContainer');
    container.innerHTML = '';
    
    gameState.players.forEach(player => {
        const playerEl = document.createElement('div');
        playerEl.className = `player ${player.role}`;
        playerEl.id = `player-${player.id}`;
        playerEl.style.left = `${player.position.x}px`;
        playerEl.style.top = `${player.position.y}px`;
        
        // Player name
        const nameEl = document.createElement('div');
        nameEl.className = 'player-name';
        nameEl.textContent = player.name;
        playerEl.appendChild(nameEl);
        
        // Debuffs and buffs
        const debuffsEl = document.createElement('div');
        debuffsEl.className = 'player-debuffs';
        
        // Show initial debuff
        player.debuffs.forEach(debuff => {
            const debuffIcon = document.createElement('span');
            debuffIcon.className = `debuff-icon ${debuff}`;
            debuffIcon.textContent = getDebuffSymbol(debuff);
            debuffsEl.appendChild(debuffIcon);
        });
        
        // Show Perfection buff if player has one (but hasn't fused yet)
        if (player.perfectionType && !player.hasFused) {
            const perfectionIcon = document.createElement('span');
            perfectionIcon.className = 'debuff-icon perfection';
            
            // Use element icons for better visual clarity
            const perfectionSymbols = {
                'alpha': '🔥',  // Fire (red, dominant element)
                'beta': '☠️',   // Poison (yellow, dominant element)
                'gamma': '🌱'   // Plant (orange, dominant element)
            };
            
            perfectionIcon.textContent = perfectionSymbols[player.perfectionType] || '⭕';
            perfectionIcon.style.background = player.perfectionType === 'alpha' ? '#f56565' : 
                                               player.perfectionType === 'beta' ? '#ecc94b' : '#ed8936';
            perfectionIcon.style.fontSize = '0.85em';
            perfectionIcon.title = `Perfection ${player.perfectionType.charAt(0).toUpperCase() + player.perfectionType.slice(1)} (${perfectionSymbols[player.perfectionType]})`;
            debuffsEl.appendChild(perfectionIcon);
        }
        
        // Show Conception buff if player has one (after fusion)
        if (player.conceptionType) {
            const conceptionIcon = document.createElement('span');
            conceptionIcon.className = 'debuff-icon conception';
            const conceptionSymbols = {
                'winged': '💨',
                'aquatic': '💧',
                'shocking': '⚡',
                'fiery': '🔥',
                'toxic': '☠️',
                'growing': '🌱'
            };
            conceptionIcon.textContent = conceptionSymbols[player.conceptionType] || '✨';
            conceptionIcon.style.background = player.conceptionType === 'winged' ? '#48bb78' : 
                                               player.conceptionType === 'aquatic' ? '#4299e1' : 
                                               player.conceptionType === 'shocking' ? '#9f7aea' : '#f56565';
            conceptionIcon.title = `Conception: ${player.conceptionType.charAt(0).toUpperCase() + player.conceptionType.slice(1)}`;
            debuffsEl.appendChild(conceptionIcon);
        }
        
        playerEl.appendChild(debuffsEl);
        
        // Make draggable
        makeDraggable(playerEl, player);
        
        container.appendChild(playerEl);
    });
}

// Get symbol for debuff
function getDebuffSymbol(debuff) {
    const symbols = {
        'alpha-short': 'α8',
        'alpha-long': 'α26',
        'beta-short': 'β8',
        'beta-long': 'β26',
        'gamma-short': 'γ8',
        'gamma-long': 'γ26',
        'multisplice': 'M2',
        'supersplice': 'S3'
    };
    return symbols[debuff] || '?';
}

// Get debuff type (alpha, beta, gamma, splicer)
function getDebuffType(debuff) {
    if (debuff.includes('alpha')) return 'alpha';
    if (debuff.includes('beta')) return 'beta';
    if (debuff.includes('gamma')) return 'gamma';
    if (debuff.includes('splice')) return 'splicer';
    return 'unknown';
}

// Check if debuff is short timer
function isShortDebuff(debuff) {
    return debuff.includes('short');
}

// Check if debuff is long timer
function isLongDebuff(debuff) {
    return debuff.includes('long');
}

// Get Conception type from Perfection fusion
function getConceptionFromPerfection(perf1, perf2) {
    if (!perf1 || !perf2) return null;
    
    const pair = [perf1, perf2].sort().join('+');
    
    const conceptionMap = {
        'alpha+beta': CONCEPTION_TYPES.WINGED,      // Wind (green)
        'alpha+gamma': CONCEPTION_TYPES.AQUATIC,    // Water (blue)
        'beta+gamma': CONCEPTION_TYPES.SHOCKING,    // Lightning (purple)
        'alpha+alpha': CONCEPTION_TYPES.FIERY,      // Fire (failure)
        'beta+beta': CONCEPTION_TYPES.TOXIC,        // Poison (failure)
        'gamma+gamma': CONCEPTION_TYPES.GROWING     // Plant (failure)
    };
    
    return conceptionMap[pair] || null;
}

// Get tower element that matches Conception
function getTowerElementForConception(conceptionType) {
    const elementMap = {
        [CONCEPTION_TYPES.WINGED]: TOWER_ELEMENTS.WIND,
        [CONCEPTION_TYPES.AQUATIC]: TOWER_ELEMENTS.WATER,
        [CONCEPTION_TYPES.SHOCKING]: TOWER_ELEMENTS.LIGHTNING
    };
    return elementMap[conceptionType] || TOWER_ELEMENTS.WIND;
}

// Check if player can soak tower
function canPlayerSoakTower(player, tower) {
    if (!player.conceptionType || !tower.element) return false;
    
    const requiredElement = getTowerElementForConception(player.conceptionType);
    return tower.element === requiredElement;
}

// Make element draggable
function makeDraggable(element, player) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    
    element.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    // Touch events for mobile
    element.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);
    
    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - player.position.x;
            initialY = e.touches[0].clientY - player.position.y;
        } else {
            initialX = e.clientX - player.position.x;
            initialY = e.clientY - player.position.y;
        }
        
        if (e.target === element || element.contains(e.target)) {
            isDragging = true;
            element.classList.add('dragging');
        }
    }
    
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }
            
            // Constrain to arena bounds
            const arena = document.getElementById('arena');
            const rect = arena.getBoundingClientRect();
            const minX = 0;
            const minY = 0;
            const maxX = 550; // 600 - 50 (player size)
            const maxY = 550;
            
            currentX = Math.max(minX, Math.min(currentX, maxX));
            currentY = Math.max(minY, Math.min(currentY, maxY));
            
            player.position.x = currentX;
            player.position.y = currentY;
            
            element.style.left = currentX + 'px';
            element.style.top = currentY + 'px';
        }
    }
    
    function dragEnd() {
        if (isDragging) {
            isDragging = false;
            element.classList.remove('dragging');
        }
    }
}

// Render player list
function renderPlayerList() {
    const container = document.getElementById('playerListContent');
    container.innerHTML = '';
    
    gameState.players.forEach(player => {
        const playerInfo = document.createElement('div');
        playerInfo.className = `player-info ${player.role}`;
        
        const nameEl = document.createElement('strong');
        nameEl.textContent = `${player.name} (${player.role.toUpperCase()})`;
        playerInfo.appendChild(nameEl);
        
        const debuffsEl = document.createElement('div');
        debuffsEl.className = 'debuffs';
        
        // Show initial debuff
        player.debuffs.forEach(debuff => {
            const debuffIcon = document.createElement('span');
            debuffIcon.className = `debuff-icon ${debuff}`;
            debuffIcon.textContent = getDebuffSymbol(debuff);
            debuffsEl.appendChild(debuffIcon);
        });
        
        // Show Perfection buff if player has one (but hasn't fused yet)
        if (player.perfectionType && !player.hasFused) {
            const perfectionIcon = document.createElement('span');
            perfectionIcon.className = 'debuff-icon perfection';
            
            const perfectionSymbols = {
                'alpha': '🔥',  // Fire
                'beta': '☠️',   // Poison
                'gamma': '🌱'   // Plant
            };
            
            const perfectionNames = {
                'alpha': 'Fire',
                'beta': 'Poison',
                'gamma': 'Plant'
            };
            
            perfectionIcon.textContent = perfectionSymbols[player.perfectionType] || '⭕';
            perfectionIcon.style.background = player.perfectionType === 'alpha' ? '#f56565' : 
                                               player.perfectionType === 'beta' ? '#ecc94b' : '#ed8936';
            perfectionIcon.style.fontSize = '0.85em';
            
            const perfectionTextNode = document.createTextNode(` ${perfectionNames[player.perfectionType]} Perfection`);
            debuffsEl.appendChild(perfectionIcon);
            debuffsEl.appendChild(perfectionTextNode);
        }
        
        // Show Conception buff if player has one
        if (player.conceptionType) {
            const conceptionIcon = document.createElement('span');
            conceptionIcon.className = 'debuff-icon conception';
            const conceptionSymbols = {
                'winged': '💨',
                'aquatic': '💧',
                'shocking': '⚡'
            };
            conceptionIcon.textContent = conceptionSymbols[player.conceptionType] || '✨';
            conceptionIcon.style.background = player.conceptionType === 'winged' ? '#48bb78' : 
                                               player.conceptionType === 'aquatic' ? '#4299e1' : 
                                               player.conceptionType === 'shocking' ? '#9f7aea' : '#f56565';
            
            const conceptionText = document.createTextNode(` ${player.conceptionType.charAt(0).toUpperCase() + player.conceptionType.slice(1)} Conception`);
            debuffsEl.appendChild(conceptionIcon);
            debuffsEl.appendChild(conceptionText);
        }
        
        playerInfo.appendChild(debuffsEl);
        
        container.appendChild(playerInfo);
    });
}

// Update phase display
function updatePhaseDisplay() {
    const phases = ['Alpha Resolution', 'Gamma Resolution', 'Tower Soaking'];
    let phaseText = phases[gameState.phase];
    
    // Add sub-phase info for Gamma Resolution
    if (gameState.phase === 1) {
        const subPhases = ['Fusion', 'Tower Soak', 'Splicer Positioning'];
        phaseText += ` (${subPhases[gameState.subPhase]})`;
    }
    
    // Add sub-phase info for Tower Soaking
    if (gameState.phase === 2) {
        const subPhases = ['Second Fusion', 'Four Tower Soak'];
        phaseText += ` (${subPhases[gameState.subPhase]})`;
    }
    
    document.getElementById('currentPhase').textContent = phaseText;
    
    // Update Next Phase button state
    const nextPhaseBtn = document.getElementById('nextPhaseBtn');
    if (gameState.phaseSolved && gameState.phase < 2) {
        nextPhaseBtn.disabled = false;
        nextPhaseBtn.style.opacity = '1';
        nextPhaseBtn.style.cursor = 'pointer';
    } else {
        nextPhaseBtn.disabled = true;
        nextPhaseBtn.style.opacity = '0.5';
        nextPhaseBtn.style.cursor = 'not-allowed';
    }
    
    // Hide button on final phase
    if (gameState.phase >= 2) {
        nextPhaseBtn.style.display = 'none';
    } else {
        nextPhaseBtn.style.display = 'block';
    }
}

// Next phase
function nextPhase() {
    if (!gameState.phaseSolved) {
        showFeedback('⚠️ Solve the current phase first!', 'warning');
        return;
    }
    
    if (gameState.phase < 2) {
        gameState.phase++;
        gameState.phaseSolved = false; // Reset for new phase
        updatePhaseDisplay();
        clearFeedback();
        
        // Apply phase-specific changes
        if (gameState.phase === 1) {
            // Phase 2: Short debuffs exploded in Phase 1, now have Perfection buffs
            // Short debuff players have Perfection based on their debuff type
            // They need to fuse to create Conception
            
            // Assign Perfection types to SHORT debuff players based on their debuff type
            gameState.players.forEach(player => {
                const debuff = player.debuffs[0];
                
                if (debuff === 'alpha-short') {
                    player.perfectionType = 'alpha'; // Fire
                    player.needsFusion = true;
                    player.hasFused = false;
                    player.conceptionType = null;
                } else if (debuff === 'beta-short') {
                    player.perfectionType = 'beta'; // Poison
                    player.needsFusion = true;
                    player.hasFused = false;
                    player.conceptionType = null;
                } else if (debuff === 'gamma-short') {
                    player.perfectionType = 'gamma'; // Plant
                    player.needsFusion = true;
                    player.hasFused = false;
                    player.conceptionType = null;
                }
            });
            
            // Note: Players do NOT get Conception yet - they need to fuse first!
            // Fusion happens when two players with Perfection stand close together
            
            // Spawn first set of towers (2 towers in vertical line)
            spawnTowers(2);
            
            // Re-render to show Perfection buffs
            renderPlayers();
            renderPlayerList();
        } else if (gameState.phase === 2) {
            // Phase 2: Tower Soaking - Explosions give Perfection to 6 players
            // Based on positions from Splicer Positioning:
            // - Unused Perfection player + Long debuff at that corner get same Perfection
            // - Splicers + Long debuffs at their corners get remaining Perfection types
            
            gameState.subPhase = 0; // Start with fusion sub-phase
            
            // Get players by their roles from Splicer Positioning
            const unusedPerfectionPlayer = gameState.players.find(p => p.perfectionType && !p.hasFused);
            const towerSoakers = gameState.players.filter(p => p.conceptionType);
            const multisplicePlayer = gameState.players.find(p => p.debuffs[0] === 'multisplice');
            const supersplicePlayer = gameState.players.find(p => p.debuffs[0] === 'supersplice');
            const longAlphaPlayer = gameState.players.find(p => p.debuffs[0] === 'alpha-long');
            const longBetaPlayer = gameState.players.find(p => p.debuffs[0] === 'beta-long');
            const longGammaPlayer = gameState.players.find(p => p.debuffs[0] === 'gamma-long');
            
            // Store the required Conception type (same as tower soakers have)
            gameState.requiredConception = towerSoakers[0]?.conceptionType || 'shocking';
            
            // Determine the unused Perfection type
            const unusedPerfType = unusedPerfectionPlayer?.perfectionType;
            
            // The remaining two Perfection types (not the unused one)
            const allPerfTypes = ['alpha', 'beta', 'gamma'];
            const remainingPerfTypes = allPerfTypes.filter(t => t !== unusedPerfType);
            shuffle(remainingPerfTypes); // Randomize which Splicer gets which
            
            // Assign Perfection based on corner pairs
            // Unused Perfection player's corner: they keep their type, Long debuff gets same
            if (unusedPerfectionPlayer) {
                const unusedDebuff = unusedPerfectionPlayer.debuffs[0];
                
                // Find which Long debuff is at the same corner
                if (unusedDebuff === 'alpha-short') {
                    // Short Alpha was at diagonal to A, Long Alpha at corner A
                    if (longAlphaPlayer) {
                        longAlphaPlayer.perfectionType = unusedPerfType;
                        longAlphaPlayer.hasFused = false;
                        longAlphaPlayer.conceptionType = null;
                    }
                } else if (unusedDebuff === 'beta-short') {
                    // Short Beta was at diagonal to B, Long Beta at corner B
                    if (longBetaPlayer) {
                        longBetaPlayer.perfectionType = unusedPerfType;
                        longBetaPlayer.hasFused = false;
                        longBetaPlayer.conceptionType = null;
                    }
                } else if (unusedDebuff === 'gamma-short') {
                    // Short Gamma was at diagonal to C, Long Gamma at corner C
                    if (longGammaPlayer) {
                        longGammaPlayer.perfectionType = unusedPerfType;
                        longGammaPlayer.hasFused = false;
                        longGammaPlayer.conceptionType = null;
                    }
                }
                
                // Reset the unused Perfection player for new fusion
                unusedPerfectionPlayer.hasFused = false;
                unusedPerfectionPlayer.conceptionType = null;
            }
            
            // Determine which corners the Splicers were at and assign Perfection
            // We need to figure out based on the clockwise/counterclockwise logic
            const takenDiagonals = new Set();
            
            // Unused Perfection took their matching diagonal
            if (unusedPerfectionPlayer) {
                const unusedDebuff = unusedPerfectionPlayer.debuffs[0];
                if (unusedDebuff === 'alpha-short') takenDiagonals.add('A');
                else if (unusedDebuff === 'beta-short') takenDiagonals.add('B');
                else if (unusedDebuff === 'gamma-short') takenDiagonals.add('C');
            }
            
            // Multisplice went clockwise to first available
            const clockwiseOrder = ['A', 'B', 'C'];
            let multispliceDiagonal = null;
            for (const corner of clockwiseOrder) {
                if (!takenDiagonals.has(corner)) {
                    multispliceDiagonal = corner;
                    takenDiagonals.add(corner);
                    break;
                }
            }
            
            // Supersplice went counterclockwise to first available
            const counterclockwiseOrder = ['C', 'B', 'A'];
            let superspliceDiagonal = null;
            for (const corner of counterclockwiseOrder) {
                if (!takenDiagonals.has(corner)) {
                    superspliceDiagonal = corner;
                    break;
                }
            }
            
            // Assign first remaining Perfection type to Multisplice's corner pair
            if (multisplicePlayer && multispliceDiagonal) {
                multisplicePlayer.perfectionType = remainingPerfTypes[0];
                multisplicePlayer.hasFused = false;
                multisplicePlayer.conceptionType = null;
                
                // Give same type to Long debuff at that corner
                if (multispliceDiagonal === 'A' && longAlphaPlayer && !longAlphaPlayer.perfectionType) {
                    longAlphaPlayer.perfectionType = remainingPerfTypes[0];
                    longAlphaPlayer.hasFused = false;
                    longAlphaPlayer.conceptionType = null;
                } else if (multispliceDiagonal === 'B' && longBetaPlayer && !longBetaPlayer.perfectionType) {
                    longBetaPlayer.perfectionType = remainingPerfTypes[0];
                    longBetaPlayer.hasFused = false;
                    longBetaPlayer.conceptionType = null;
                } else if (multispliceDiagonal === 'C' && longGammaPlayer && !longGammaPlayer.perfectionType) {
                    longGammaPlayer.perfectionType = remainingPerfTypes[0];
                    longGammaPlayer.hasFused = false;
                    longGammaPlayer.conceptionType = null;
                }
            }
            
            // Assign second remaining Perfection type to Supersplice's corner pair
            if (supersplicePlayer && superspliceDiagonal) {
                supersplicePlayer.perfectionType = remainingPerfTypes[1];
                supersplicePlayer.hasFused = false;
                supersplicePlayer.conceptionType = null;
                
                // Give same type to Long debuff at that corner
                if (superspliceDiagonal === 'A' && longAlphaPlayer && !longAlphaPlayer.perfectionType) {
                    longAlphaPlayer.perfectionType = remainingPerfTypes[1];
                    longAlphaPlayer.hasFused = false;
                    longAlphaPlayer.conceptionType = null;
                } else if (superspliceDiagonal === 'B' && longBetaPlayer && !longBetaPlayer.perfectionType) {
                    longBetaPlayer.perfectionType = remainingPerfTypes[1];
                    longBetaPlayer.hasFused = false;
                    longBetaPlayer.conceptionType = null;
                } else if (superspliceDiagonal === 'C' && longGammaPlayer && !longGammaPlayer.perfectionType) {
                    longGammaPlayer.perfectionType = remainingPerfTypes[1];
                    longGammaPlayer.hasFused = false;
                    longGammaPlayer.conceptionType = null;
                }
            }
            
            // Spawn 4 towers with the same element as required Conception
            spawnTowersWithElement(4, gameState.requiredConception);
            
            // Re-render to show new Perfection buffs
            renderPlayers();
            renderPlayerList();
            
            showFeedback('💥 Explosions! 6 players now have Perfection buffs.\n\nFuse to create ' + getConceptionName(gameState.requiredConception) + ' Conception to soak the 4 towers!\n\n⚠️ 2 players with the wrong Perfection cannot fuse correctly - they must stay safe!', 'warning');
        }
        
        updateHints();
        clearFeedback();
    } else {
        showFeedback('Already at final phase!', 'warning');
    }
}

// Spawn towers
function spawnTowers(count = 2) {
    const towersContainer = document.getElementById('towersContainer');
    towersContainer.innerHTML = '';
    
    gameState.towers = [];
    
    // According to the guide, towers spawn in a vertical line at the center
    // Phase 2: 2 towers (North and South)
    // Phase 3: 4 towers (more complex pattern)
    
    let positions;
    
    // Determine which element to use based on available Perfection types
    const playersWithPerfection = gameState.players.filter(p => p.perfectionType && !p.hasFused);
    let towerElement = TOWER_ELEMENTS.WIND; // Default
    
    // If players have already fused and created Conception, use that element
    const playersWithConception = gameState.players.filter(p => p.conceptionType);
    if (playersWithConception.length > 0) {
        towerElement = getTowerElementForConception(playersWithConception[0].conceptionType);
    } else if (playersWithPerfection.length >= 2) {
        // Pick a valid combination based on available Perfection types
        const perfectionTypes = playersWithPerfection.map(p => p.perfectionType);
        const validCombinations = [];
        
        // Check which Conceptions can be created
        if (perfectionTypes.includes('alpha') && perfectionTypes.includes('beta')) {
            validCombinations.push(TOWER_ELEMENTS.WIND); // Winged
        }
        if (perfectionTypes.includes('alpha') && perfectionTypes.includes('gamma')) {
            validCombinations.push(TOWER_ELEMENTS.WATER); // Aquatic
        }
        if (perfectionTypes.includes('beta') && perfectionTypes.includes('gamma')) {
            validCombinations.push(TOWER_ELEMENTS.LIGHTNING); // Shocking
        }
        
        // Randomly pick one of the valid combinations
        if (validCombinations.length > 0) {
            towerElement = validCombinations[Math.floor(Math.random() * validCombinations.length)];
        }
    }
    
    // Map element to color for display
    const elementColorMap = {
        [TOWER_ELEMENTS.WIND]: 'green',
        [TOWER_ELEMENTS.WATER]: 'blue',
        [TOWER_ELEMENTS.LIGHTNING]: 'purple'
    };
    
    const elementSymbolMap = {
        [TOWER_ELEMENTS.WIND]: '💨',
        [TOWER_ELEMENTS.WATER]: '💧',
        [TOWER_ELEMENTS.LIGHTNING]: '⚡'
    };
    
    const towerColor = elementColorMap[towerElement];
    const towerSymbol = elementSymbolMap[towerElement];
    
    if (count === 2) {
        // First tower set - 2 towers (same element)
        positions = [
            { x: 270, y: 120, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'North Tower' },
            { x: 270, y: 380, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'South Tower' }
        ];
    } else {
        // Second tower set - 4 towers (same element for now, can be varied later)
        positions = [
            { x: 270, y: 75, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'North Tower' },
            { x: 270, y: 195, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'Mid-North Tower' },
            { x: 270, y: 315, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'Mid-South Tower' },
            { x: 270, y: 435, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'South Tower' }
        ];
    }
    
    positions.forEach((pos, index) => {
        const tower = document.createElement('div');
        tower.className = `tower ${pos.color}`;
        tower.id = `tower-${index}`;
        tower.style.left = `${pos.x}px`;
        tower.style.top = `${pos.y}px`;
        tower.textContent = pos.symbol || '⭕';
        
        towersContainer.appendChild(tower);
        gameState.towers.push({ ...pos, id: index });
    });
}

// Clear towers
function clearTowers() {
    const towersContainer = document.getElementById('towersContainer');
    towersContainer.innerHTML = '';
    gameState.towers = [];
}

// Spawn towers with a specific element based on required Conception
function spawnTowersWithElement(count, conceptionType) {
    const towersContainer = document.getElementById('towersContainer');
    towersContainer.innerHTML = '';
    gameState.towers = [];
    
    // Map Conception type to tower element
    const conceptionToElement = {
        'winged': TOWER_ELEMENTS.WIND,
        'aquatic': TOWER_ELEMENTS.WATER,
        'shocking': TOWER_ELEMENTS.LIGHTNING
    };
    
    const towerElement = conceptionToElement[conceptionType] || TOWER_ELEMENTS.LIGHTNING;
    
    const elementColorMap = {
        [TOWER_ELEMENTS.WIND]: 'green',
        [TOWER_ELEMENTS.WATER]: 'blue',
        [TOWER_ELEMENTS.LIGHTNING]: 'purple'
    };
    
    const elementSymbolMap = {
        [TOWER_ELEMENTS.WIND]: '💨',
        [TOWER_ELEMENTS.WATER]: '💧',
        [TOWER_ELEMENTS.LIGHTNING]: '⚡'
    };
    
    const towerColor = elementColorMap[towerElement];
    const towerSymbol = elementSymbolMap[towerElement];
    
    // 4 towers in vertical line
    const positions = [
        { x: 270, y: 75, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'North Tower' },
        { x: 270, y: 195, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'Mid-North Tower' },
        { x: 270, y: 315, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'Mid-South Tower' },
        { x: 270, y: 435, color: towerColor, element: towerElement, symbol: towerSymbol, name: 'South Tower' }
    ];
    
    positions.slice(0, count).forEach((pos, index) => {
        const tower = document.createElement('div');
        tower.className = `tower ${pos.color}`;
        tower.id = `tower-${index}`;
        tower.style.left = `${pos.x}px`;
        tower.style.top = `${pos.y}px`;
        tower.textContent = pos.symbol || '⭕';
        
        towersContainer.appendChild(tower);
        gameState.towers.push({ ...pos, id: index });
    });
}

// Get Conception name for display
function getConceptionName(conceptionType) {
    const names = {
        'winged': '💨 Winged (Wind)',
        'aquatic': '💧 Aquatic (Water)',
        'shocking': '⚡ Shocking (Lightning)'
    };
    return names[conceptionType] || conceptionType;
}

// Get required Perfection types for a Conception
function getRequiredPerfectionsForConception(conceptionType) {
    const requirements = {
        'winged': ['alpha', 'beta'],      // Fire + Poison = Wind
        'aquatic': ['alpha', 'gamma'],    // Fire + Plant = Water
        'shocking': ['beta', 'gamma']     // Poison + Plant = Lightning
    };
    return requirements[conceptionType] || [];
}

// Get the "wrong" Perfection type that can't make the required Conception
function getWrongPerfectionType(conceptionType) {
    const wrong = {
        'winged': 'gamma',    // Plant can't make Wind
        'aquatic': 'beta',    // Poison can't make Water
        'shocking': 'alpha'   // Fire can't make Lightning
    };
    return wrong[conceptionType] || null;
}

// Check solution
function checkSolution() {
    let isCorrect = true;
    let errors = [];
    
    // Clear previous highlights
    gameState.players.forEach(player => {
        const playerEl = document.getElementById(`player-${player.id}`);
        playerEl.classList.remove('correct', 'incorrect');
    });
    
    // In Phase 1 (Gamma Resolution), first check for fusion before tower validation
    if (gameState.phase === 1) {
        checkPerfectionFusion();
    }
    
    // Validate based on current phase
    switch (gameState.phase) {
        case 0: // Alpha Resolution
            isCorrect = validateAlphaPositioning(errors);
            break;
            
        case 1: // Gamma Resolution
            isCorrect = validateGammaPositioning(errors);
            break;
            
        case 2: // Tower Soaking
            isCorrect = validateTowerSoaking(errors);
            break;
    }
    
    // Display feedback
    if (isCorrect) {
        gameState.phaseSolved = true;
        updatePhaseDisplay();
        
        if (gameState.phase < 2) {
            showFeedback('✓ Correct! Click "Next Phase" to continue.', 'success');
        } else {
            showFeedback('✓ Perfect! High Concept 1 complete! 🎉', 'success');
        }
    } else {
        gameState.phaseSolved = false;
        updatePhaseDisplay();
        showFeedback('✗ Issues found:\n' + errors.join('\n'), 'error');
    }
}

// Check if players with Perfection are close enough to fuse
function checkPerfectionFusion() {
    const playersWithPerfection = gameState.players.filter(p => p.perfectionType && !p.hasFused);
    
    // Check all pairs of players with Perfection
    for (let i = 0; i < playersWithPerfection.length; i++) {
        for (let j = i + 1; j < playersWithPerfection.length; j++) {
            const player1 = playersWithPerfection[i];
            const player2 = playersWithPerfection[j];
            
            const distance = getDistance(player1.position, player2.position);
            
            // If players are close enough (within 100px), they fuse - can happen anywhere on the map
            if (distance < 100 && !player1.hasFused && !player2.hasFused) {
                // Create Conception from Perfection fusion
                const conceptionType = getConceptionFromPerfection(player1.perfectionType, player2.perfectionType);
                
                player1.conceptionType = conceptionType;
                player2.conceptionType = conceptionType;
                player1.hasFused = true;
                player2.hasFused = true;
                player1.fusionPartner = player2.id;
                player2.fusionPartner = player1.id;
                
                // Re-render to show Conception buffs
                renderPlayers();
                renderPlayerList();
                
                const perfectionNames = {
                    'alpha': '🔥 Fire',
                    'beta': '☠️ Poison',
                    'gamma': '🌱 Plant'
                };
                
                const conceptionNames = {
                    'winged': '💨 Winged (Wind)',
                    'aquatic': '💧 Aquatic (Water)',
                    'shocking': '⚡ Shocking (Lightning)'
                };
                
                // Track which Perfections were used and which is unused
                gameState.usedPerfections = [player1.perfectionType, player2.perfectionType];
                const allPerfections = ['alpha', 'beta', 'gamma'];
                gameState.unusedPerfection = allPerfections.find(p => !gameState.usedPerfections.includes(p));
                
                // Move to tower soak sub-phase
                gameState.subPhase = 1;
                updateHints();
                
                showFeedback(`✨ ${player1.name} (${perfectionNames[player1.perfectionType]}) and ${player2.name} (${perfectionNames[player2.perfectionType]}) fused!\n\nCreated ${conceptionNames[conceptionType]}!\n\nNow move them to soak the towers!`, 'success');
                return;
            }
        }
    }
}

// Waymarker positions (600x600 arena)
const WAYMARKERS = {
    A: { x: 600 - 50, y: 50, name: 'A (NE Corner)' },        // Top-right corner
    B: { x: 600 - 50, y: 600 - 50, name: 'B (SE Corner)' },  // Bottom-right corner
    C: { x: 50, y: 600 - 50, name: '4/C (SW Corner)' },      // Bottom-left corner (treating as '4')
    '2': { x: 150, y: 50, name: '2 (North Wall)' },          // North wall intersection
    '3': { x: 50, y: 150, name: '3 (West Wall)' }            // West wall intersection
};

// Check if player is near a waymarker
function isNearWaymarker(position, waymarker, tolerance = 80) {
    return getDistance(position, waymarker) < tolerance;
}

// Validate first spread positioning
function validateAlphaPositioning(errors) {
    let isCorrect = true;
    
    // Define correct positions for each debuff
    const correctPositions = {
        'alpha-short': WAYMARKERS.A,   // Short Alpha → A
        'beta-short': WAYMARKERS.B,    // Short Beta → B
        'gamma-short': WAYMARKERS.C,   // Short Gamma → 4 (C)
        'multisplice': WAYMARKERS['2'], // Multisplice → 2
        'supersplice': WAYMARKERS['3'], // Supersplice → 3
        'alpha-long': WAYMARKERS['2'],  // Long Alpha → 2 (stacks with Multisplice)
        'beta-long': WAYMARKERS['3'],   // Long Beta → 3 (stacks with Supersplice)
        'gamma-long': WAYMARKERS['3']   // Long Gamma → 3 (stacks with Supersplice)
    };
    
    gameState.players.forEach(player => {
        const playerEl = document.getElementById(`player-${player.id}`);
        const debuff = player.debuffs[0];
        const correctPos = correctPositions[debuff];
        
        if (correctPos) {
            if (isNearWaymarker(player.position, correctPos)) {
                playerEl.classList.add('correct');
            } else {
                playerEl.classList.add('incorrect');
                errors.push(`${player.name} (${getDebuffSymbol(debuff)}) should be at ${correctPos.name}`);
                isCorrect = false;
            }
        }
    });
    
    // Validate stacking requirements
    // Marker 2 should have exactly 2 players (Multisplice + Long Alpha)
    const marker2Players = gameState.players.filter(p => 
        isNearWaymarker(p.position, WAYMARKERS['2'])
    );
    if (marker2Players.length !== 2) {
        errors.push(`Marker 2 should have 2 players (Multisplice + Long Alpha), has ${marker2Players.length}`);
        isCorrect = false;
    }
    
    // Marker 3 should have exactly 3 players (Supersplice + Long Beta + Long Gamma)
    const marker3Players = gameState.players.filter(p => 
        isNearWaymarker(p.position, WAYMARKERS['3'])
    );
    if (marker3Players.length !== 3) {
        errors.push(`Marker 3 should have 3 players (Supersplice + Long Beta + Long Gamma), has ${marker3Players.length}`);
        isCorrect = false;
    }
    
    return isCorrect;
}

// Validate Gamma Resolution phase (Phase 1)
function validateGammaPositioning(errors) {
    let isCorrect = true;
    
    // Only check for towers in sub-phases 0 and 1 (not in splicer positioning)
    if (gameState.subPhase < 2 && gameState.towers.length === 0) {
        errors.push('Towers not spawned yet - click Next Phase');
        return false;
    }
    
    const playersWithPerfection = gameState.players.filter(p => p.perfectionType && !p.hasFused);
    const playersWithConception = gameState.players.filter(p => p.conceptionType);
    
    // Sub-phase 0: Fusion
    if (gameState.subPhase === 0) {
        if (playersWithPerfection.length > 0 && playersWithConception.length === 0) {
            errors.push('Players with Perfection need to fuse first!\n\nDrag two players with Perfection close together and click Check Solution.');
            playersWithPerfection.forEach(p => {
                const playerEl = document.getElementById(`player-${p.id}`);
                playerEl.classList.add('incorrect');
            });
            return false;
        }
        
        if (playersWithConception.length >= 2) {
            // Fusion already happened, move to tower soak
            gameState.subPhase = 1;
            updateHints();
        }
    }
    
    // Sub-phase 1: Tower Soaking
    if (gameState.subPhase === 1) {
        let towersSoakedCorrectly = true;
        
        gameState.towers.forEach(tower => {
            const playersNearTower = gameState.players.filter(player => {
                const dist = getDistance(player.position, { x: tower.x, y: tower.y });
                return dist < 80;
            });
            
            if (playersNearTower.length === 0) {
                errors.push(`${tower.name} (${tower.element}) is not being soaked!`);
                towersSoakedCorrectly = false;
            } else if (playersNearTower.length > 1) {
                errors.push(`${tower.name} has too many players (${playersNearTower.length})`);
                towersSoakedCorrectly = false;
            } else {
                const player = playersNearTower[0];
                const playerEl = document.getElementById(`player-${player.id}`);
                
                if (!player.conceptionType) {
                    errors.push(`${player.name} at ${tower.name} has no Conception buff!`);
                    playerEl.classList.add('incorrect');
                    towersSoakedCorrectly = false;
                } else if (!canPlayerSoakTower(player, tower)) {
                    const conceptionName = player.conceptionType.charAt(0).toUpperCase() + player.conceptionType.slice(1);
                    errors.push(`${player.name} has ${conceptionName} Conception but ${tower.name} requires ${tower.element}!`);
                    playerEl.classList.add('incorrect');
                    towersSoakedCorrectly = false;
                } else {
                    playerEl.classList.add('correct');
                }
            }
        });
        
        if (towersSoakedCorrectly) {
            // Move to splicer positioning sub-phase
            gameState.subPhase = 2;
            updateHints();
            updatePhaseDisplay();
            
            // Remove towers from the map
            clearTowers();
            
            // Show safe corner indicator
            const safeCorner = document.getElementById('safeCorner');
            if (safeCorner) safeCorner.classList.add('show');
            
            // Show short debuff position indicators
            const shortAlphaPos = document.getElementById('shortAlphaPos');
            const shortBetaPos = document.getElementById('shortBetaPos');
            const shortGammaPos = document.getElementById('shortGammaPos');
            if (shortAlphaPos) shortAlphaPos.classList.add('show');
            if (shortBetaPos) shortBetaPos.classList.add('show');
            if (shortGammaPos) shortGammaPos.classList.add('show');
            
            showFeedback('✓ Towers soaked correctly!\n\nNow position the remaining players:\n• Unused Perfection → their corner (A/B/C)\n• Multisplice → A (clockwise)\n• Supersplice → C/4 (counterclockwise)\n• Tower soakers → NW safe corner (green box)', 'success');
            return false; // Don't complete phase yet
        }
        
        return false;
    }
    
    // Sub-phase 2: Splicer Positioning
    if (gameState.subPhase === 2) {
        isCorrect = validateSplicerPositioning(errors);
    }
    
    return isCorrect;
}

// Validate Splicer positioning after towers are soaked
function validateSplicerPositioning(errors) {
    let isCorrect = true;
    
    // CORRECT MECHANIC:
    // - LONG debuffs go to CORNERS (where they'll explode)
    // - Unused Perfection (short debuff who didn't fuse) goes to a DIAGONAL
    // - Splicers go to DIAGONALS (to get hit by Long debuff explosions)
    // - Tower soakers (short debuffs with Conception) go to NW safe corner
    
    // Get the unused Perfection player (SHORT debuff who didn't fuse)
    const unusedPerfectionPlayer = gameState.players.find(p => 
        p.perfectionType && !p.hasFused
    );
    
    // Get Splicer players
    const multisplicePlayer = gameState.players.find(p => p.debuffs[0] === 'multisplice');
    const supersplicePlayer = gameState.players.find(p => p.debuffs[0] === 'supersplice');
    
    // Get tower soakers (players with Conception - these are SHORT debuff players who fused)
    const towerSoakers = gameState.players.filter(p => p.conceptionType);
    
    // Get LONG debuff players (they go to CORNERS - where they explode)
    const longAlphaPlayer = gameState.players.find(p => p.debuffs[0] === 'alpha-long');
    const longBetaPlayer = gameState.players.find(p => p.debuffs[0] === 'beta-long');
    const longGammaPlayer = gameState.players.find(p => p.debuffs[0] === 'gamma-long');
    
    // Define corners (where Long debuffs explode)
    const corners = {
        'A': WAYMARKERS.A,
        'B': WAYMARKERS.B,
        'C': WAYMARKERS.C
    };
    
    // Diagonal positions (where Splicers and unused Perfection stand)
    const diagonalPositions = {
        'A': { x: 450, y: 150, name: 'diagonal to A' },
        'B': { x: 450, y: 450, name: 'diagonal to B' },
        'C': { x: 150, y: 450, name: 'diagonal to C' }
    };
    
    // Clockwise order: A → B → C
    const clockwiseOrder = ['A', 'B', 'C'];
    // Counterclockwise order: C → B → A
    const counterclockwiseOrder = ['C', 'B', 'A'];
    
    // Track which DIAGONALS are taken (for Splicer assignment)
    const takenDiagonals = new Set();
    
    // Step 1: Unused Perfection player (SHORT debuff) claims diagonal of their matching corner
    let unusedPerfectionDiagonal = null;
    if (unusedPerfectionPlayer) {
        const debuff = unusedPerfectionPlayer.debuffs[0];
        
        // Short debuff players go to diagonal of their matching corner
        if (debuff === 'alpha-short') {
            unusedPerfectionDiagonal = 'A';
        } else if (debuff === 'beta-short') {
            unusedPerfectionDiagonal = 'B';
        } else if (debuff === 'gamma-short') {
            unusedPerfectionDiagonal = 'C';
        }
        
        if (unusedPerfectionDiagonal) {
            takenDiagonals.add(unusedPerfectionDiagonal);
        }
    }
    
    // Step 2: Multisplice (from marker 2) goes clockwise to first available DIAGONAL
    let multispliceDiagonal = null;
    for (const corner of clockwiseOrder) {
        if (!takenDiagonals.has(corner)) {
            multispliceDiagonal = corner;
            takenDiagonals.add(corner);
            break;
        }
    }
    
    // Step 3: Supersplice (from marker 3) goes counterclockwise to first available DIAGONAL
    let superspliceDiagonal = null;
    for (const corner of counterclockwiseOrder) {
        if (!takenDiagonals.has(corner)) {
            superspliceDiagonal = corner;
            takenDiagonals.add(corner);
            break;
        }
    }
    
    // Validate LONG debuff players at CORNERS (where they explode)
    if (longAlphaPlayer) {
        const playerEl = document.getElementById(`player-${longAlphaPlayer.id}`);
        if (isNearWaymarker(longAlphaPlayer.position, corners['A'], 80)) {
            playerEl.classList.add('correct');
        } else {
            errors.push(`${longAlphaPlayer.name} (Long Alpha) should go to corner A`);
            playerEl.classList.add('incorrect');
            isCorrect = false;
        }
    }
    
    if (longBetaPlayer) {
        const playerEl = document.getElementById(`player-${longBetaPlayer.id}`);
        if (isNearWaymarker(longBetaPlayer.position, corners['B'], 80)) {
            playerEl.classList.add('correct');
        } else {
            errors.push(`${longBetaPlayer.name} (Long Beta) should go to corner B`);
            playerEl.classList.add('incorrect');
            isCorrect = false;
        }
    }
    
    if (longGammaPlayer) {
        const playerEl = document.getElementById(`player-${longGammaPlayer.id}`);
        if (isNearWaymarker(longGammaPlayer.position, corners['C'], 80)) {
            playerEl.classList.add('correct');
        } else {
            errors.push(`${longGammaPlayer.name} (Long Gamma) should go to corner C`);
            playerEl.classList.add('incorrect');
            isCorrect = false;
        }
    }
    
    // Validate unused Perfection player at DIAGONAL
    if (unusedPerfectionPlayer && unusedPerfectionDiagonal) {
        const correctPos = diagonalPositions[unusedPerfectionDiagonal];
        const playerEl = document.getElementById(`player-${unusedPerfectionPlayer.id}`);
        
        if (getDistance(unusedPerfectionPlayer.position, correctPos) < 80) {
            playerEl.classList.add('correct');
        } else {
            errors.push(`${unusedPerfectionPlayer.name} (unused Perfection) should go to ${correctPos.name}`);
            playerEl.classList.add('incorrect');
            isCorrect = false;
        }
    }
    
    // Validate Multisplice at DIAGONAL
    if (multisplicePlayer && multispliceDiagonal) {
        const correctPos = diagonalPositions[multispliceDiagonal];
        const playerEl = document.getElementById(`player-${multisplicePlayer.id}`);
        
        if (getDistance(multisplicePlayer.position, correctPos) < 80) {
            playerEl.classList.add('correct');
        } else {
            errors.push(`${multisplicePlayer.name} (Multisplice) should go to ${correctPos.name} (first available clockwise)`);
            playerEl.classList.add('incorrect');
            isCorrect = false;
        }
    }
    
    // Validate Supersplice at DIAGONAL
    if (supersplicePlayer && superspliceDiagonal) {
        const correctPos = diagonalPositions[superspliceDiagonal];
        const playerEl = document.getElementById(`player-${supersplicePlayer.id}`);
        
        if (getDistance(supersplicePlayer.position, correctPos) < 80) {
            playerEl.classList.add('correct');
        } else {
            errors.push(`${supersplicePlayer.name} (Supersplice) should go to ${correctPos.name} (first available counterclockwise)`);
            playerEl.classList.add('incorrect');
            isCorrect = false;
        }
    }
    
    // Validate tower soakers position (SHORT debuff players with Conception → NW safe corner)
    towerSoakers.forEach(player => {
        const playerEl = document.getElementById(`player-${player.id}`);
        
        // Check if they're in the NW area (top-left quadrant, away from corners A, B, C)
        if (player.position.x < 150 && player.position.y < 150) {
            if (!playerEl.classList.contains('correct')) {
                playerEl.classList.add('correct');
            }
        } else {
            errors.push(`${player.name} (tower soaker) should move to NW safe corner to avoid explosions`);
            if (!playerEl.classList.contains('incorrect')) {
                playerEl.classList.add('incorrect');
            }
            isCorrect = false;
        }
    });
    
    return isCorrect;
}

// Validate Tower soaking (Phase 2)
function validateTowerSoaking(errors) {
    let isCorrect = true;
    
    // First check for fusion in sub-phase 0
    if (gameState.subPhase === 0) {
        checkPhase2Fusion();
    }
    
    // Sub-phase 0: Fusion
    if (gameState.subPhase === 0) {
        const playersWithPerfection = gameState.players.filter(p => p.perfectionType && !p.hasFused);
        const newConceptionPlayers = gameState.players.filter(p => p.conceptionType && !p.debuffs[0].includes('short'));
        
        // Check if we have the safe zone players (they already have Conception from Phase 1)
        const safeZonePlayers = gameState.players.filter(p => 
            p.conceptionType && p.debuffs[0].includes('short') && p.hasFused
        );
        
        if (playersWithPerfection.length > 0 && newConceptionPlayers.length < 4) {
            // Need more players to fuse
            const requiredPerfs = getRequiredPerfectionsForConception(gameState.requiredConception);
            const wrongPerf = getWrongPerfectionType(gameState.requiredConception);
            
            errors.push(`Players with Perfection need to fuse to create ${getConceptionName(gameState.requiredConception)}!`);
            errors.push(`Required: ${requiredPerfs.map(p => getPerfectionName(p)).join(' + ')}`);
            errors.push(`⚠️ Players with ${getPerfectionName(wrongPerf)} cannot make the required Conception!`);
            
            playersWithPerfection.forEach(p => {
                const playerEl = document.getElementById(`player-${p.id}`);
                if (p.perfectionType === wrongPerf) {
                    // Wrong Perfection players should stay safe
                    playerEl.classList.add('warning');
                } else {
                    playerEl.classList.add('incorrect');
                }
            });
            return false;
        }
        
        // If 4 new Conception players exist, move to tower soak
        if (newConceptionPlayers.length >= 4) {
            gameState.subPhase = 1;
            updateHints();
            updatePhaseDisplay();
            showFeedback('✨ Fusion complete! Now move players with Conception to soak the 4 towers.\n\n⚠️ Players with wrong Perfection must stay in safe spots!', 'success');
            return false;
        }
    }
    
    // Sub-phase 1: Tower Soak
    if (gameState.subPhase === 1) {
        if (gameState.towers.length === 0) {
            errors.push('Towers not spawned yet');
            return false;
        }
        
        let towersSoakedCorrectly = true;
        const wrongPerfType = getWrongPerfectionType(gameState.requiredConception);
        
        // Check each tower
        gameState.towers.forEach(tower => {
            const playersNearTower = gameState.players.filter(player => {
                const dist = getDistance(player.position, { x: tower.x, y: tower.y });
                return dist < 80;
            });
            
            if (playersNearTower.length === 0) {
                errors.push(`${tower.name} is not being soaked!`);
                towersSoakedCorrectly = false;
            } else if (playersNearTower.length > 1) {
                errors.push(`${tower.name} has too many players (${playersNearTower.length})`);
                towersSoakedCorrectly = false;
            } else {
                const player = playersNearTower[0];
                const playerEl = document.getElementById(`player-${player.id}`);
                
                if (!player.conceptionType) {
                    errors.push(`${player.name} at ${tower.name} has no Conception buff!`);
                    playerEl.classList.add('incorrect');
                    towersSoakedCorrectly = false;
                } else if (!canPlayerSoakTower(player, tower)) {
                    errors.push(`${player.name} has wrong Conception for ${tower.name}!`);
                    playerEl.classList.add('incorrect');
                    towersSoakedCorrectly = false;
                } else {
                    playerEl.classList.add('correct');
                }
            }
        });
        
        // Check that wrong Perfection players are in safe positions
        const wrongPerfPlayers = gameState.players.filter(p => 
            p.perfectionType === wrongPerfType && !p.hasFused
        );
        
        wrongPerfPlayers.forEach(player => {
            const playerEl = document.getElementById(`player-${player.id}`);
            // They should be away from towers and in safe spots
            const nearTower = gameState.towers.some(t => 
                getDistance(player.position, { x: t.x, y: t.y }) < 80
            );
            
            if (nearTower) {
                errors.push(`${player.name} (${getPerfectionName(wrongPerfType)}) should NOT be at a tower - wrong Perfection!`);
                playerEl.classList.add('incorrect');
                towersSoakedCorrectly = false;
            } else {
                playerEl.classList.add('correct');
            }
        });
        
        if (towersSoakedCorrectly) {
            return true; // Phase complete!
        }
        
        return false;
    }
    
    return isCorrect;
}

// Check for fusion in Phase 2
function checkPhase2Fusion() {
    const playersWithPerfection = gameState.players.filter(p => p.perfectionType && !p.hasFused);
    const requiredPerfs = getRequiredPerfectionsForConception(gameState.requiredConception);
    
    // Check all pairs of players with valid Perfection types
    for (let i = 0; i < playersWithPerfection.length; i++) {
        for (let j = i + 1; j < playersWithPerfection.length; j++) {
            const player1 = playersWithPerfection[i];
            const player2 = playersWithPerfection[j];
            
            // Check if both have required Perfection types (different from each other)
            const hasRequired1 = requiredPerfs.includes(player1.perfectionType);
            const hasRequired2 = requiredPerfs.includes(player2.perfectionType);
            const differentTypes = player1.perfectionType !== player2.perfectionType;
            
            if (!hasRequired1 || !hasRequired2 || !differentTypes) continue;
            
            const distance = getDistance(player1.position, player2.position);
            
            // If players are close enough, they fuse
            if (distance < 100 && !player1.hasFused && !player2.hasFused) {
                const conceptionType = getConceptionFromPerfection(player1.perfectionType, player2.perfectionType);
                
                player1.conceptionType = conceptionType;
                player2.conceptionType = conceptionType;
                player1.hasFused = true;
                player2.hasFused = true;
                player1.fusionPartner = player2.id;
                player2.fusionPartner = player1.id;
                
                renderPlayers();
                renderPlayerList();
                
                const perfectionNames = {
                    'alpha': '🔥 Fire',
                    'beta': '☠️ Poison',
                    'gamma': '🌱 Plant'
                };
                
                showFeedback(`✨ ${player1.name} (${perfectionNames[player1.perfectionType]}) and ${player2.name} (${perfectionNames[player2.perfectionType]}) fused!\n\nCreated ${getConceptionName(conceptionType)}!`, 'success');
                return;
            }
        }
    }
}

// Get Perfection name for display
function getPerfectionName(perfectionType) {
    const names = {
        'alpha': '🔥 Fire',
        'beta': '☠️ Poison',
        'gamma': '🌱 Plant'
    };
    return names[perfectionType] || perfectionType;
}

// Get distance from center
function getDistanceFromCenter(position) {
    const centerX = 275;
    const centerY = 275;
    return Math.sqrt(Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2));
}

// Get distance between two positions
function getDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

// Check if position is on cardinal
function isOnCardinal(position, tolerance = 50) {
    const centerX = 275;
    const centerY = 275;
    
    // Check if roughly on horizontal or vertical axis
    return Math.abs(position.x - centerX) < tolerance || Math.abs(position.y - centerY) < tolerance;
}

// Check if position is on intercardinal
function isOnIntercardinal(position, tolerance = 50) {
    const centerX = 275;
    const centerY = 275;
    
    // Check if roughly on diagonal
    const dx = Math.abs(position.x - centerX);
    const dy = Math.abs(position.y - centerY);
    
    return Math.abs(dx - dy) < tolerance;
}

// Show feedback
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type} show`;
}

// Clear feedback
function clearFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.className = 'feedback';
    feedback.textContent = '';
}

// Toggle hints
function toggleHints() {
    gameState.hintsVisible = !gameState.hintsVisible;
    const hintsDisplay = document.getElementById('hintsDisplay');
    hintsDisplay.style.display = gameState.hintsVisible ? 'block' : 'none';
    updateHints();
}

// Update hints based on phase
function updateHints() {
    if (!gameState.hintsVisible) return;
    
    const hintsList = document.getElementById('hintsList');
    hintsList.innerHTML = '';
    
    let hints = [];
    
    switch (gameState.phase) {
        case 0:
            hints = [
                'SHORT debuffs go to corners:',
                '  • Short Alpha (α8) → Waymarker A (NE)',
                '  • Short Beta (β8) → Waymarker B (SE)',
                '  • Short Gamma (γ8) → Waymarker 4/C (SW)',
                'SPLICERS and LONG debuffs stack:',
                '  • Multisplice (M2) + Long Alpha → Marker 2 (2 players)',
                '  • Supersplice (S3) + Long Beta + Long Gamma → Marker 3 (3 players)'
            ];
            break;
            
        case 1:
            if (gameState.subPhase === 0) {
                hints = [
                    '📍 SUB-PHASE: FUSION',
                    '',
                    'LONG debuffs collected Perfection from corners:',
                    '   • 🔥 Fire (Alpha) • ☠️ Poison (Beta) • 🌱 Plant (Gamma)',
                    '',
                    'FUSE Perfection buffs:',
                    '   • Move 2 players with Perfection close together',
                    '   • Click "Check Solution" to trigger fusion',
                    '   • Fusion creates Conception:',
                    '     - 🔥 + ☠️ = 💨 Winged (Wind)',
                    '     - 🔥 + 🌱 = 💧 Aquatic (Water)',
                    '     - ☠️ + 🌱 = ⚡ Shocking (Lightning)'
                ];
            } else if (gameState.subPhase === 1) {
                hints = [
                    '📍 SUB-PHASE: TOWER SOAK',
                    '',
                    'Move fused players to soak towers:',
                    '   • Each tower needs 1 player with matching Conception',
                    '   • 💨 Winged → Wind tower',
                    '   • 💧 Aquatic → Water tower',
                    '   • ⚡ Shocking → Lightning tower',
                    '',
                    '⚠️ Wrong Conception = Instant death!'
                ];
            } else if (gameState.subPhase === 2) {
                hints = [
                    '📍 SUB-PHASE: SPLICER POSITIONING',
                    '',
                    '1. LONG DEBUFFS go to CORNERS (to explode):',
                    '   • α26 → corner A (NE)',
                    '   • β26 → corner B (SE)',
                    '   • γ26 → corner C (SW)',
                    '',
                    '2. UNUSED PERFECTION (short debuff who didnt fuse):',
                    '   → Goes to DIAGONAL of their corner (α8→diag A, β8→diag B, γ8→diag C)',
                    '',
                    '3. MULTISPLICE (M2):',
                    '   → Go CLOCKWISE to first AVAILABLE diagonal',
                    '',
                    '4. SUPERSPLICE (S3):',
                    '   → Go COUNTERCLOCKWISE to first AVAILABLE diagonal',
                    '',
                    '5. TOWER SOAKERS (fused short debuffs):',
                    '   → NW safe corner (green box)'
                ];
            }
            break;
            
        case 2:
            if (gameState.subPhase === 0) {
                const wrongPerf = getWrongPerfectionType(gameState.requiredConception);
                const requiredPerfs = getRequiredPerfectionsForConception(gameState.requiredConception);
                hints = [
                    '📍 SUB-PHASE: SECOND FUSION',
                    '',
                    '💥 Explosions gave Perfection to 6 players!',
                    '',
                    `Required Conception: ${getConceptionName(gameState.requiredConception)}`,
                    `Fuse: ${requiredPerfs.map(p => getPerfectionName(p)).join(' + ')}`,
                    '',
                    `⚠️ ${getPerfectionName(wrongPerf)} players CANNOT make the required Conception!`,
                    '   They must stay safe (away from towers)',
                    '',
                    'Drag pairs of correct Perfection players together to fuse.',
                    'You need 4 players with Conception to soak 4 towers.'
                ];
            } else if (gameState.subPhase === 1) {
                hints = [
                    '📍 SUB-PHASE: FOUR TOWER SOAK',
                    '',
                    'Move 4 players with Conception to soak the 4 towers.',
                    '',
                    '⚠️ 2 players with wrong Perfection must stay safe!',
                    '   (away from towers and explosions)',
                    '',
                    'Each tower needs exactly 1 player with matching Conception.'
                ];
            }
            break;
    }
    
    hints.forEach(hint => {
        const li = document.createElement('li');
        li.textContent = hint;
        hintsList.appendChild(li);
    });
}

// Show tutorial
function showTutorial() {
    const modal = document.getElementById('tutorialModal');
    modal.classList.add('show');
}

// Auto-solve the current phase
function autoSolve() {
    switch (gameState.phase) {
        case 0: // Alpha Resolution
            autoSolveAlphaResolution();
            break;
        case 1: // Gamma Resolution
            autoSolveGammaResolution();
            break;
        case 2: // Tower Soaking
            autoSolveTowerSoaking();
            break;
    }
    
    // Re-render players at new positions
    renderPlayers();
    showFeedback('✨ Auto-solved! Review the positions and click "Check Solution" to verify.', 'warning');
}

// Auto-solve Phase 0: Alpha Resolution
function autoSolveAlphaResolution() {
    // Define correct positions for each debuff type
    const positions = {
        'alpha-short': { ...WAYMARKERS.A },
        'beta-short': { ...WAYMARKERS.B },
        'gamma-short': { ...WAYMARKERS.C },
        'multisplice': { ...WAYMARKERS['2'] },
        'supersplice': { ...WAYMARKERS['3'] },
        'alpha-long': { ...WAYMARKERS['2'] },
        'beta-long': { ...WAYMARKERS['3'] },
        'gamma-long': { ...WAYMARKERS['3'] }
    };
    
    // Add small offsets for stacked positions to make them visible
    let marker2Count = 0;
    let marker3Count = 0;
    
    gameState.players.forEach(player => {
        const debuff = player.debuffs[0];
        const basePos = positions[debuff];
        
        if (basePos) {
            // Add offset for stacked players
            if (debuff === 'multisplice' || debuff === 'alpha-long') {
                player.position = { x: basePos.x + (marker2Count * 20), y: basePos.y + (marker2Count * 20) };
                marker2Count++;
            } else if (debuff === 'supersplice' || debuff === 'beta-long' || debuff === 'gamma-long') {
                player.position = { x: basePos.x + (marker3Count * 20), y: basePos.y + (marker3Count * 20) };
                marker3Count++;
            } else {
                player.position = { x: basePos.x, y: basePos.y };
            }
        }
    });
}

// Auto-solve Phase 1: Gamma Resolution
function autoSolveGammaResolution() {
    if (gameState.subPhase === 0) {
        // Fusion sub-phase: Move the CORRECT two Perfection players together
        // based on what tower element spawned
        const playersWithPerfection = gameState.players.filter(p => p.perfectionType && !p.hasFused);
        
        if (playersWithPerfection.length >= 2 && gameState.towers.length >= 1) {
            // Determine which Conception is needed based on tower element
            const towerElement = gameState.towers[0].element;
            let neededPerfections = [];
            
            // Tower element → required Conception → required Perfections
            // Wind → Winged → Alpha + Beta (Fire + Poison)
            // Water → Aquatic → Alpha + Gamma (Fire + Plant)
            // Lightning → Shocking → Beta + Gamma (Poison + Plant)
            if (towerElement === TOWER_ELEMENTS.WIND) {
                neededPerfections = ['alpha', 'beta'];
            } else if (towerElement === TOWER_ELEMENTS.WATER) {
                neededPerfections = ['alpha', 'gamma'];
            } else if (towerElement === TOWER_ELEMENTS.LIGHTNING) {
                neededPerfections = ['beta', 'gamma'];
            }
            
            // Find the two players with the needed Perfection types
            const player1 = playersWithPerfection.find(p => p.perfectionType === neededPerfections[0]);
            const player2 = playersWithPerfection.find(p => p.perfectionType === neededPerfections[1]);
            
            if (player1 && player2) {
                // Move them together to fuse
                player1.position = { x: 270, y: 250 };
                player2.position = { x: 290, y: 250 };
            }
        }
    } else if (gameState.subPhase === 1) {
        // Tower soak sub-phase: Move Conception players to towers
        const playersWithConception = gameState.players.filter(p => p.conceptionType);
        
        if (playersWithConception.length >= 2 && gameState.towers.length >= 2) {
            playersWithConception[0].position = { x: gameState.towers[0].x, y: gameState.towers[0].y };
            playersWithConception[1].position = { x: gameState.towers[1].x, y: gameState.towers[1].y };
        }
    } else if (gameState.subPhase === 2) {
        // Splicer positioning sub-phase
        autoSolveSplicerPositioning();
    }
}

// Auto-solve Splicer Positioning
function autoSolveSplicerPositioning() {
    const corners = {
        'A': { ...WAYMARKERS.A },
        'B': { ...WAYMARKERS.B },
        'C': { ...WAYMARKERS.C }
    };
    
    // Diagonal positions (where Splicers and unused Perfection stand)
    const diagonalPositions = {
        'A': { x: 450, y: 150 },
        'B': { x: 450, y: 450 },
        'C': { x: 150, y: 450 }
    };
    
    const clockwiseOrder = ['A', 'B', 'C'];
    const counterclockwiseOrder = ['C', 'B', 'A'];
    const takenDiagonals = new Set();
    
    // Get players
    const unusedPerfectionPlayer = gameState.players.find(p => p.perfectionType && !p.hasFused);
    const multisplicePlayer = gameState.players.find(p => p.debuffs[0] === 'multisplice');
    const supersplicePlayer = gameState.players.find(p => p.debuffs[0] === 'supersplice');
    const towerSoakers = gameState.players.filter(p => p.conceptionType);
    const longAlphaPlayer = gameState.players.find(p => p.debuffs[0] === 'alpha-long');
    const longBetaPlayer = gameState.players.find(p => p.debuffs[0] === 'beta-long');
    const longGammaPlayer = gameState.players.find(p => p.debuffs[0] === 'gamma-long');
    
    // Step 1: LONG debuffs go to CORNERS (where they explode)
    if (longAlphaPlayer) {
        longAlphaPlayer.position = { x: corners['A'].x, y: corners['A'].y };
    }
    if (longBetaPlayer) {
        longBetaPlayer.position = { x: corners['B'].x, y: corners['B'].y };
    }
    if (longGammaPlayer) {
        longGammaPlayer.position = { x: corners['C'].x, y: corners['C'].y };
    }
    
    // Step 2: Unused Perfection (SHORT debuff) claims their matching DIAGONAL
    if (unusedPerfectionPlayer) {
        const debuff = unusedPerfectionPlayer.debuffs[0];
        let diagonal = null;
        
        // Short debuff players go to diagonal of their matching corner
        if (debuff === 'alpha-short') diagonal = 'A';
        else if (debuff === 'beta-short') diagonal = 'B';
        else if (debuff === 'gamma-short') diagonal = 'C';
        
        if (diagonal) {
            takenDiagonals.add(diagonal);
            unusedPerfectionPlayer.position = { x: diagonalPositions[diagonal].x, y: diagonalPositions[diagonal].y };
        }
    }
    
    // Step 3: Multisplice goes clockwise to first available DIAGONAL
    if (multisplicePlayer) {
        for (const corner of clockwiseOrder) {
            if (!takenDiagonals.has(corner)) {
                takenDiagonals.add(corner);
                multisplicePlayer.position = { x: diagonalPositions[corner].x, y: diagonalPositions[corner].y };
                break;
            }
        }
    }
    
    // Step 4: Supersplice goes counterclockwise to first available DIAGONAL
    if (supersplicePlayer) {
        for (const corner of counterclockwiseOrder) {
            if (!takenDiagonals.has(corner)) {
                takenDiagonals.add(corner);
                supersplicePlayer.position = { x: diagonalPositions[corner].x, y: diagonalPositions[corner].y };
                break;
            }
        }
    }
    
    // Step 5: Tower soakers (SHORT debuffs with Conception) go to NW safe corner
    let safeOffset = 0;
    towerSoakers.forEach(player => {
        player.position = { x: 50 + safeOffset, y: 50 + safeOffset };
        safeOffset += 30;
    });
}

// Auto-solve Phase 2: Tower Soaking
function autoSolveTowerSoaking() {
    if (gameState.subPhase === 0) {
        // Fusion sub-phase: Move correct Perfection pairs together
        const requiredPerfs = getRequiredPerfectionsForConception(gameState.requiredConception);
        const wrongPerfType = getWrongPerfectionType(gameState.requiredConception);
        
        const playersWithPerfection = gameState.players.filter(p => p.perfectionType && !p.hasFused);
        
        // Group players by Perfection type
        const perfGroup1 = playersWithPerfection.filter(p => p.perfectionType === requiredPerfs[0]);
        const perfGroup2 = playersWithPerfection.filter(p => p.perfectionType === requiredPerfs[1]);
        const wrongPerfPlayers = playersWithPerfection.filter(p => p.perfectionType === wrongPerfType);
        
        // Pair up players from different groups
        if (perfGroup1.length >= 1 && perfGroup2.length >= 1) {
            // First pair
            perfGroup1[0].position = { x: 200, y: 200 };
            perfGroup2[0].position = { x: 220, y: 200 };
        }
        
        if (perfGroup1.length >= 2 && perfGroup2.length >= 2) {
            // Second pair
            perfGroup1[1].position = { x: 350, y: 350 };
            perfGroup2[1].position = { x: 370, y: 350 };
        }
        
        // Move wrong Perfection players to safe spots
        let safeOffset = 0;
        wrongPerfPlayers.forEach(player => {
            player.position = { x: 50 + safeOffset, y: 300 + safeOffset };
            safeOffset += 40;
        });
        
    } else if (gameState.subPhase === 1) {
        // Tower soak sub-phase: Move Conception players to towers
        const playersWithConception = gameState.players.filter(p => 
            p.conceptionType === gameState.requiredConception
        );
        const wrongPerfType = getWrongPerfectionType(gameState.requiredConception);
        const wrongPerfPlayers = gameState.players.filter(p => 
            p.perfectionType === wrongPerfType && !p.hasFused
        );
        
        // Move Conception players to towers
        playersWithConception.forEach((player, index) => {
            if (index < gameState.towers.length) {
                player.position = { 
                    x: gameState.towers[index].x, 
                    y: gameState.towers[index].y 
                };
            }
        });
        
        // Move wrong Perfection players to safe spots (away from towers)
        let safeOffset = 0;
        wrongPerfPlayers.forEach(player => {
            player.position = { x: 50 + safeOffset, y: 300 + safeOffset };
            safeOffset += 40;
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);

