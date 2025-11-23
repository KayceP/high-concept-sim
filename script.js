// High Concept 1 Simulator - Main JavaScript

// Game State
let gameState = {
    phase: 0, // 0: Alpha Resolution, 1: Gamma Resolution, 2: Tower Soaking
    players: [],
    towers: [],
    hintsVisible: false,
    phaseSolved: false // Track if current phase is solved
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
    gameState.players = [];
    gameState.towers = [];
    gameState.phaseSolved = false;
    
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
    document.getElementById('currentPhase').textContent = phases[gameState.phase];
    
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
            // Phase 2: Short debuffs explode, create Perfection buffs
            // Players with short debuffs leave Perfection at their positions
            // Long debuffs need to collect these Perfections and fuse them
            
            // Assign Perfection types to long debuff players
            // In reality, players collect these by moving to explosion locations
            const longDebuffPlayers = gameState.players.filter(p => isLongDebuff(p.debuffs[0]));
            
            // Assign Perfection types based on which short debuff exploded
            const perfectionTypes = ['alpha', 'beta', 'gamma'];
            shuffle(perfectionTypes);
            
            longDebuffPlayers.forEach((player, idx) => {
                if (idx < perfectionTypes.length) {
                    player.perfectionType = perfectionTypes[idx];
                    player.needsFusion = true; // They need to fuse to create Conception
                    player.hasFused = false; // Ensure not marked as fused
                    player.conceptionType = null; // Clear any old Conception
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
            // Phase 2: Second spread and second tower set
            spawnTowers(4);
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
                
                showFeedback(`✨ ${player1.name} (${perfectionNames[player1.perfectionType]}) and ${player2.name} (${perfectionNames[player2.perfectionType]}) fused!\n\nCreated ${conceptionNames[conceptionType]}!`, 'success');
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

// Validate Gamma Resolution phase (Phase 2)
function validateGammaPositioning(errors) {
    let isCorrect = true;
    
    if (gameState.towers.length === 0) {
        errors.push('Towers not spawned yet - click Next Phase');
        return false;
    }
    
    // In this phase:
    // 1. Players with long debuffs collected Perfection buffs from corners
    // 2. Two players with Perfection must fuse by standing close together
    // 3. After fusion, they get Conception buffs
    // 4. Only those 2 players with Conception can soak the towers
    // 5. Tower element must match their Conception type
    
    const playersWithPerfection = gameState.players.filter(p => p.perfectionType && !p.hasFused);
    const playersWithConception = gameState.players.filter(p => p.conceptionType);
    
    // First check: Have players fused yet?
    if (playersWithPerfection.length > 0 && playersWithConception.length === 0) {
        errors.push('Players with Perfection need to fuse first! Stand two players with Perfection close together (between towers) and click Check Solution to fuse.');
        
        // Highlight players who need to fuse
        playersWithPerfection.forEach(p => {
            const playerEl = document.getElementById(`player-${p.id}`);
            playerEl.classList.add('incorrect');
        });
        return false;
    }
    
    if (playersWithConception.length < 2) {
        errors.push('Need 2 players with Conception buffs to soak towers');
        return false;
    }
    
    // Check tower soaking - each tower needs exactly 1 player with correct Conception
    gameState.towers.forEach(tower => {
        const playersNearTower = gameState.players.filter(player => {
            const dist = getDistance(player.position, { x: tower.x, y: tower.y });
            return dist < 70;
        });
        
        if (playersNearTower.length === 0) {
            errors.push(`${tower.name} (${tower.element}) is not being soaked!`);
            isCorrect = false;
        } else if (playersNearTower.length > 1) {
            errors.push(`${tower.name} has too many players (${playersNearTower.length})`);
            isCorrect = false;
        } else {
            const player = playersNearTower[0];
            const playerEl = document.getElementById(`player-${player.id}`);
            
            // Check if player has the correct Conception buff
            if (!player.conceptionType) {
                errors.push(`${player.name} at ${tower.name} has no Conception buff!`);
                playerEl.classList.add('incorrect');
                isCorrect = false;
            } else if (!canPlayerSoakTower(player, tower)) {
                const conceptionName = player.conceptionType.charAt(0).toUpperCase() + player.conceptionType.slice(1);
                errors.push(`${player.name} has ${conceptionName} Conception but ${tower.name} requires ${tower.element}!`);
                playerEl.classList.add('incorrect');
                isCorrect = false;
            } else {
                playerEl.classList.add('correct');
            }
        }
    });
    
    return isCorrect;
}

// Validate Tower soaking
function validateTowerSoaking(errors) {
    let isCorrect = true;
    
    if (gameState.towers.length === 0) {
        errors.push('Towers not spawned yet');
        return false;
    }
    
    // Check if each tower has a player nearby
    gameState.towers.forEach(tower => {
        const playersNearTower = gameState.players.filter(player => {
            const dist = getDistance(player.position, { x: tower.x, y: tower.y });
            return dist < 80; // Within tower radius
        });
        
        if (playersNearTower.length === 0) {
            errors.push(`${tower.name} tower (${tower.color}) is not being soaked!`);
            isCorrect = false;
        } else if (playersNearTower.length > 1) {
            errors.push(`${tower.name} tower has too many players`);
            isCorrect = false;
        } else {
            const player = playersNearTower[0];
            const playerEl = document.getElementById(`player-${player.id}`);
            playerEl.classList.add('correct');
        }
    });
    
    // Mark players not soaking towers
    gameState.players.forEach(player => {
        const playerEl = document.getElementById(`player-${player.id}`);
        if (!playerEl.classList.contains('correct')) {
            const isBeta = player.debuffs.includes(DEBUFF_TYPES.BETA);
            if (isBeta) {
                playerEl.classList.add('incorrect');
                errors.push(`${player.name} (Beta) should be soaking a tower`);
                isCorrect = false;
            }
        }
    });
    
    return isCorrect;
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
            hints = [
                '1. LONG debuffs collected Perfection from corners',
                '   Look for element icons on player tokens:',
                '   • 🔥 Fire (Alpha) • ☠️ Poison (Beta) • 🌱 Plant (Gamma)',
                '',
                '2. FUSE Perfection buffs:',
                '   • Move 2 players with Perfection close together (anywhere on map)',
                '   • Drag them within ~100px of each other',
                '   • Click "Check Solution" to trigger fusion',
                '   • Fusion creates Conception:',
                '     - 🔥 Fire + ☠️ Poison = 💨 Winged (Wind)',
                '     - 🔥 Fire + 🌱 Plant = 💧 Aquatic (Water)',
                '     - ☠️ Poison + 🌱 Plant = ⚡ Shocking (Lightning)',
                '',
                '3. SOAK TOWERS:',
                '   • After fusion, move each player to a tower',
                '   • Tower element must match Conception type',
                '   • Wrong element = Instant wipe!',
                '',
                '⚠️ Must fuse BEFORE soaking towers!'
            ];
            break;
            
        case 2:
            hints = [
                'Second spread: Players reposition for second tower set',
                'Second tower set spawns (4 towers, vertical line)',
                'Players with Conception buffs soak matching colored towers',
                'Each tower needs exactly 1 player to soak',
                'Match Conception color to tower color'
            ];
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);

