import { blockTranslations, translateBlockName as getTranslatedName } from './data.js';
import { blockRecipes } from './recipes.js';

class CraftingUI {
    constructor() {
        this.listContainer = document.getElementById('crafting-list-container');
        this.treeContainer = document.getElementById('crafting-tree-container');
        this.searchInput = document.getElementById('crafting-search-input');
        
        this.tabList = document.getElementById('tab-crafting-list');
        this.tabMap = document.getElementById('tab-crafting-map');
        
        this.viewList = document.getElementById('crafting-list-view');
        this.viewMap = document.getElementById('crafting-map-view');
        
        this.currentInventory = {}; // name (spanish) -> count
        this.blockIcons = {}; // name (spanish) -> icon src
        this.reverseDict = {}; // spanish -> english for recipes lookup
        this.expandedNodes = new Set();

        this.initEvents();
    }

    initEvents() {
        if (this.tabList && this.tabMap) {
            this.tabList.addEventListener('click', () => this.switchTab('list'));
            this.tabMap.addEventListener('click', () => this.switchTab('map'));
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterList(e.target.value.toLowerCase());
            });
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.expandSearchedNodes(e.target.value.toLowerCase());
                }
            });
        }
    }

    switchTab(tabName) {
        if (tabName === 'list') {
            this.tabList.classList.add('active');
            this.tabMap.classList.remove('active');
            this.viewList.classList.add('active');
            this.viewMap.classList.remove('active');
            this.viewList.style.display = 'block';
            this.viewMap.style.display = 'none';
        } else {
            this.tabMap.classList.add('active');
            this.tabList.classList.remove('active');
            this.viewMap.classList.add('active');
            this.viewList.classList.remove('active');
            this.viewMap.style.display = 'block';
            this.viewList.style.display = 'none';
        }
    }

    updateData(inventoryCounts, iconsMap) {
        this.currentInventory = inventoryCounts;
        this.blockIcons = iconsMap;
        
        // Build reverse dictionary if needed
        if (typeof blockTranslations !== 'undefined') {
            for (let [eng, spa] of Object.entries(blockTranslations)) {
                this.reverseDict[spa] = eng;
            }
        }
        this.nodes = [];
        this.links = [];
        this.expandedNodes.clear(); // Reset expanded nodes on new item
        
        this.renderList();
        this.renderMap();
    }

    getEnglishName(spaName) {
        if (this.reverseDict[spaName]) return this.reverseDict[spaName];
        return spaName.toLowerCase();
    }
    
    getSpanishName(engName) {
        if (typeof getTranslatedName === 'function') {
            return getTranslatedName(engName);
        }
        if (typeof blockTranslations !== 'undefined' && blockTranslations[engName]) {
            return blockTranslations[engName];
        }
        return engName;
    }

    getIcon(spaName) {
        if (this.blockIcons[spaName]) return this.blockIcons[spaName];
        
        // Fallback or generic block icon
        return ''; // Or generic cube SVG
    }
    
    getIconEng(engName) {
        const spaName = this.getSpanishName(engName);
        if (this.blockIcons[spaName]) return this.blockIcons[spaName];
        
        // Exact filename overrides for tricky names
        const nameLower = engName.toLowerCase();
        const overrides = {
            "nether quartz": "models/items/quartz.png",
            "quartz block": "models/items/quartz_block.png",
            "smooth quartz block": "models/items/quartz_block.png",
            "smooth quartz": "models/items/quartz_block.png",
            "block of bamboo": "models/items/bamboo_block.png"
        };
        if (overrides[nameLower]) {
            return overrides[nameLower];
        }

        // Fallback for ingredients not in the 3D model
        const formattedName = nameLower.replace(/ /g, '_');
        return `models/items/${formattedName}.png`;
    }

    getAllRequiredRecipes() {
        const requiredEngNames = new Set();
        
        const addIngredients = (engName) => {
            if (requiredEngNames.has(engName)) return;
            if (typeof blockRecipes !== 'undefined' && blockRecipes[engName]) {
                requiredEngNames.add(engName);
                blockRecipes[engName].forEach(recipe => {
                    recipe.ingredients.forEach(ing => {
                        if (ing) addIngredients(ing);
                    });
                });
            }
        };

        for (const spaName of Object.keys(this.currentInventory)) {
            const engName = this.getEnglishName(spaName);
            addIngredients(engName);
        }

        return Array.from(requiredEngNames);
    }

    renderDependencyTree(engName, container, visited = new Set()) {
        const recipes = blockRecipes[engName];
        if (!recipes) return;

        const allIngredients = new Set();
        recipes.forEach(r => {
            r.ingredients.forEach(i => {
                if (i && blockRecipes[i]) allIngredients.add(i);
            });
        });

        if (allIngredients.size === 0) return;

        const depsContainer = document.createElement('div');
        depsContainer.className = 'dependencies-section';
        
        const title = document.createElement('h4');
        title.className = 'dependencies-title';
        title.textContent = 'Requiere para su creación:';
        depsContainer.appendChild(title);

        let hasDeps = false;

        allIngredients.forEach(ingEng => {
            if (visited.has(ingEng)) return;
            const ingRecipes = blockRecipes[ingEng];
            if (ingRecipes) {
                hasDeps = true;
                
                const depBlock = document.createElement('div');
                depBlock.className = 'dependency-block';
                
                const spaName = this.getSpanishName(ingEng);
                const header = document.createElement('div');
                header.className = 'dependency-header';
                const icon = this.getIconEng(ingEng);
                if (icon) header.innerHTML += `<img loading="lazy" src="${icon}" alt="${spaName}" onerror="if(!this.dataset.tried){this.dataset.tried=true;this.src='models/items/${ingEng.toLowerCase().replace(/ /g, '_')}.png';}else{this.style.display='none';}">`;
                header.innerHTML += `<span>${spaName}</span>`;
                depBlock.appendChild(header);

                const cardsCont = document.createElement('div');
                cardsCont.className = 'recipes-container';
                ingRecipes.forEach(recipe => {
                    const card = this.createRecipeCard(ingEng, spaName, recipe);
                    cardsCont.appendChild(card);
                });
                depBlock.appendChild(cardsCont);

                const newVisited = new Set(visited);
                newVisited.add(ingEng);
                this.renderDependencyTree(ingEng, depBlock, newVisited);

                depsContainer.appendChild(depBlock);
            }
        });

        if (hasDeps) {
            container.appendChild(depsContainer);
        }
    }

    renderList() {
        if (!this.listContainer) return;
        this.listContainer.innerHTML = '';

        let hasRecipes = false;
        
        const finalBlocks = new Set();
        for (const spaName of Object.keys(this.currentInventory)) {
            const engName = this.getEnglishName(spaName);
            if (blockRecipes[engName]) {
                finalBlocks.add(engName);
            }
        }

        finalBlocks.forEach(engName => {
            const spaName = this.getSpanishName(engName);
            const recipes = blockRecipes[engName];
            hasRecipes = true;
            
            const group = document.createElement('div');
            group.className = 'recipe-block-group accordion active';
            group.setAttribute('data-name', spaName.toLowerCase());
            
            const header = document.createElement('div');
            header.className = 'recipe-block-header accordion-header';
            header.onclick = function() {
                group.classList.toggle('active');
            };
            
            const headerLeft = document.createElement('div');
            headerLeft.className = 'header-left';
            const icon = this.getIconEng(engName);
            if (icon) headerLeft.innerHTML += `<img loading="lazy" src="${icon}" alt="${spaName}" onerror="if(!this.dataset.tried){this.dataset.tried=true;this.src='models/items/${engName.toLowerCase().replace(/ /g, '_')}.png';}else{this.style.display='none';}">`;
            headerLeft.innerHTML += `<span>${spaName}</span>`;
            
            const chevron = document.createElement('i');
            chevron.className = 'fa-solid fa-chevron-down accordion-chevron';
            
            header.appendChild(headerLeft);
            header.appendChild(chevron);
            group.appendChild(header);

            const content = document.createElement('div');
            content.className = 'accordion-content';

            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'recipes-container';

            recipes.forEach(recipe => {
                const card = this.createRecipeCard(engName, spaName, recipe);
                cardsContainer.appendChild(card);
            });
            content.appendChild(cardsContainer);

            this.renderDependencyTree(engName, content, new Set([engName]));

            group.appendChild(content);
            this.listContainer.appendChild(group);
        });

        if (!hasRecipes) {
            this.listContainer.innerHTML = '<div style="color:var(--text-secondary)">No hay recetas crafteables en esta construcción.</div>';
        }
    }
    createRecipeCard(engName, spaName, recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';

        const content = document.createElement('div');
        content.className = 'recipe-content';
        
        if (recipe.type === 'crafting_table') {
            const grid = document.createElement('div');
            grid.className = 'crafting-grid-3x3';
            
            for (let i = 0; i < 9; i++) {
                const slot = document.createElement('div');
                slot.className = 'crafting-slot';
                const ingEng = recipe.ingredients[i];
                if (ingEng) {
                    const ingIcon = this.getIconEng(ingEng);
                    if (ingIcon) {
                        const formattedEng = ingEng.toLowerCase().replace(/ /g, '_');
                        const spaNameLocal = this.getSpanishName(ingEng);
                        const fallbackJs = `if(!this.dataset.tried){this.dataset.tried=true;this.src='models/items/${formattedEng}.png';}else{this.onerror=null;this.parentElement.innerHTML='<span style=&quot;font-size:9px;text-align:center;line-height:1;word-break:break-all;&quot;>${spaNameLocal}</span>';}`;
                        slot.innerHTML = `<img loading="lazy" src="${ingIcon}" title="${spaNameLocal}" alt="${spaNameLocal}" onerror="${fallbackJs}">`;
                    }
                }
                grid.appendChild(slot);
            }
            content.appendChild(grid);
        } else if (recipe.type === 'stonecutter' || recipe.type === 'furnace') {
            const slot = document.createElement('div');
            slot.className = 'crafting-slot';
            const ingEng = recipe.ingredients[0];
            if (ingEng) {
                const ingIcon = this.getIconEng(ingEng);
                if (ingIcon) {
                    const formattedEng = ingEng.toLowerCase().replace(/ /g, '_');
                    const spaNameLocal = this.getSpanishName(ingEng);
                    const fallbackJs = `if(!this.dataset.tried){this.dataset.tried=true;this.src='models/items/${formattedEng}.png';}else{this.onerror=null;this.parentElement.innerHTML='<span style=&quot;font-size:9px;text-align:center;line-height:1;word-break:break-all;&quot;>${spaNameLocal}</span>';}`;
                    slot.innerHTML = `<img loading="lazy" src="${ingIcon}" title="${spaNameLocal}" alt="${spaNameLocal}" onerror="${fallbackJs}">`;
                }
            }
            content.appendChild(slot);
        }

        const arrow = document.createElement('div');
        arrow.className = 'recipe-arrow';
        arrow.innerHTML = '➔';
        content.appendChild(arrow);

        const result = document.createElement('div');
        result.className = 'recipe-result';
        const resIcon = this.getIconEng(engName);
        if (resIcon) {
            const formattedEng = engName.toLowerCase().replace(/ /g, '_');
            const fallbackJs = `if(!this.dataset.tried){this.dataset.tried=true;this.src='models/items/${formattedEng}.png';}else{this.onerror=null;this.parentElement.innerHTML='<span style=&quot;font-size:10px;text-align:center;line-height:1;word-break:break-all;&quot;>${spaName}</span>';}`;
            result.innerHTML = `<img loading="lazy" src="${resIcon}" alt="${spaName}" title="${spaName}" onerror="${fallbackJs}">`;
        }
        if (recipe.outputCount > 1) {
            result.innerHTML += `<div class="recipe-count">${recipe.outputCount}</div>`;
        }
        content.appendChild(result);
        
        card.appendChild(content);

        const station = document.createElement('div');
        station.className = 'recipe-station';
        if (recipe.type === 'crafting_table') {
            station.innerHTML = `Se crea en <img loading="lazy" src="models/items/crafting_table.png" alt="Mesa de Trabajo"> Mesa de Trabajo`;
        } else if (recipe.type === 'stonecutter') {
            station.innerHTML = `Se crea en <img loading="lazy" src="models/items/stonecutter.png" alt="Cortapiedras"> Cortapiedras`;
        } else if (recipe.type === 'furnace') {
            station.innerHTML = `Se crea en <img loading="lazy" src="models/items/furnace.png" alt="Horno"> Horno`;
        }
        card.appendChild(station);

        return card;
    }

    filterList(query) {
        // Filter List View
        if (this.listContainer) {
            const groups = this.listContainer.querySelectorAll('.recipe-block-group');
            groups.forEach(group => {
                if (group.getAttribute('data-name').includes(query)) {
                    group.style.display = 'block';
                } else {
                    group.style.display = 'none';
                }
            });
        }

        // Filter Map View (dim non-matching nodes)
        if (this.treeContainer) {
            const mapNodes = this.treeContainer.querySelectorAll('.tree-node');
            mapNodes.forEach(node => {
                const nameNode = node.querySelector('.tree-node-name');
                if (nameNode) {
                    const name = nameNode.textContent.toLowerCase();
                    if (query === '' || name.includes(query)) {
                        node.classList.remove('dim');
                    } else {
                        node.classList.add('dim');
                    }
                }
            });
        }
    }

    expandSearchedNodes(query) {
        if (!query || query.trim() === '') return;
        query = query.trim();
        
        const fullGraph = this.buildGraph(true);
        const matches = new Set();
        
        fullGraph.nodes.forEach(n => {
            if (n.spaName.toLowerCase().includes(query) || n.engName.toLowerCase().includes(query)) {
                matches.add(n.engName);
            }
        });
        
        if (matches.size === 0) return;
        
        const parents = {};
        fullGraph.links.forEach(l => {
            if (!parents[l.target]) parents[l.target] = [];
            parents[l.target].push(l.source);
        });
        
        const toExpand = new Set();
        const traceParents = (node) => {
            if (parents[node]) {
                parents[node].forEach(p => {
                    if (!toExpand.has(p)) {
                        toExpand.add(p);
                        traceParents(p);
                    }
                });
            }
        };
        
        matches.forEach(m => {
            const hasChildren = fullGraph.links.some(l => l.source === m);
            if (hasChildren) {
                toExpand.add(m);
            }
            traceParents(m);
        });
        
        toExpand.forEach(n => this.expandedNodes.add(n));
        this.renderMap();
        this.filterList(query);
    }

    // MAP VIEW LOGIC
    renderMap() {
        if (!this.treeContainer) return;
        this.treeContainer.innerHTML = '';
        
        let hasRecipes = false;

        // Recursive tree builder
        // Because a build can have many items, rendering ALL of them as trees could be chaotic.
        // We will render trees only for items that have requirements.
        for (const [spaName, count] of Object.entries(this.currentInventory)) {
            const engName = this.getEnglishName(spaName);
            if (typeof blockRecipes !== 'undefined' && blockRecipes[engName]) {
                hasRecipes = true;
                
                // Build tree for this item
                const treeNode = this.buildTreeNode(engName, count);
                if (treeNode) {
                    this.treeContainer.appendChild(treeNode);
                }
            }
        }
        
        if (!hasRecipes) {
            this.treeContainer.innerHTML = '<div style="color:var(--text-secondary)">No hay recetas para el mapa.</div>';
        }
    }

    buildTreeNode(engName, requestedCount, visited = new Set()) {
        // Prevent infinite recursion loops if there's a cyclic recipe in the database
        if (visited.has(engName)) {
            return this.createTreeCard(engName, requestedCount, "Error: Ciclo detectado", true);
        }
        visited.add(engName);

        if (!blockRecipes || !blockRecipes[engName]) {
            // It's a base material
            return this.createTreeCard(engName, requestedCount, null, true);
        }

        // Has recipe, prefer stonecutter if available, else first
        let recipe = blockRecipes[engName].find(r => r.type === 'stonecutter');
        if (!recipe) recipe = blockRecipes[engName][0];

        const cardNode = this.createTreeCard(engName, requestedCount, recipe.type, false);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'tree-node';
        wrapper.appendChild(cardNode);

        // Find dependencies
        const ingredientsMap = {}; // name -> count needed
        
        // Calculate how many crafts we need
        const craftsNeeded = Math.ceil(requestedCount / recipe.outputCount);

        recipe.ingredients.forEach(ing => {
            if (ing) {
                ingredientsMap[ing] = (ingredientsMap[ing] || 0) + 1 * craftsNeeded;
            }
        });

        const keys = Object.keys(ingredientsMap);
        if (keys.length > 0) {
            const connector = document.createElement('div');
            connector.className = 'tree-connector';
            connector.setAttribute('data-multiplier', 'x' + craftsNeeded);
            wrapper.appendChild(connector);

            const childrenWrapper = document.createElement('div');
            childrenWrapper.style.display = 'flex';
            childrenWrapper.style.flexDirection = 'column';
            childrenWrapper.style.gap = '1rem';
            
            keys.forEach(ingEng => {
                // Pass a copy of the visited set to allow identical items in different branches, but not deep cycles
                const childNode = this.buildTreeNode(ingEng, ingredientsMap[ingEng], new Set(visited));
                childrenWrapper.appendChild(childNode);
            });
            wrapper.appendChild(childrenWrapper);
        }

        return wrapper;
    }

    createTreeCard(engName, count, stationType, isBase) {
        const card = document.createElement('div');
        card.className = 'tree-card' + (isBase ? ' base-material' : '');
        
        const spaName = this.getSpanishName(engName);
        const icon = this.getIconEng(engName);

        const header = document.createElement('div');
        header.className = 'tree-card-header';
        if (icon) header.innerHTML += `<img loading="lazy" src="${icon}" alt="${spaName}">`;
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'tree-card-name';
        nameDiv.textContent = spaName;
        header.appendChild(nameDiv);
        
        const countDiv = document.createElement('div');
        countDiv.className = 'tree-card-count';
        countDiv.textContent = `x${count}`;
        header.appendChild(countDiv);

        card.appendChild(header);

        if (stationType) {
            const station = document.createElement('div');
            station.className = 'tree-card-station';
            
            let stationName = "Mesa de Trabajo";
            let stationIcon = "models/items/crafting_table.png";
            if (stationType === 'stonecutter') {
                stationName = "Cortapiedras";
                stationIcon = "models/items/stonecutter.png";
            } else if (stationType === 'furnace') {
                stationName = "Horno";
                stationIcon = "models/items/furnace.png";
            }
            
            station.innerHTML = `<img loading="lazy" src="${stationIcon}" style="width:20px; height:20px;"> ${stationName}`;
            card.appendChild(station);
        }

        return card;
    }

    buildGraph(ignoreExpanded = false) {
        const nodesMap = {};
        const linksMap = {};
        
        const queue = [];
        for (const [name, count] of Object.entries(this.currentInventory)) {
            const engName = this.getEnglishName(name);
            if (blockRecipes[engName]) {
                nodesMap[engName] = { 
                    engName, 
                    spaName: name, 
                    count: count, 
                    depth: 0 
                };
                queue.push({ engName, count, depth: 0, path: new Set([engName]) });
            }
        }
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (!ignoreExpanded && !this.expandedNodes.has(current.engName)) continue;

            const recipes = blockRecipes[current.engName];
            if (!recipes) continue;
            
            // Find a recipe that doesn't cause a circular dependency
            let recipe = null;
            for (const r of recipes) {
                let hasCycle = false;
                r.ingredients.forEach(i => {
                    if (i && current.path.has(i)) hasCycle = true;
                });
                if (!hasCycle) {
                    recipe = r;
                    break;
                }
            }
            
            if (!recipe) continue; // Skip decomposing if all recipes are circular
            
            const ingredientsMap = {};
            recipe.ingredients.forEach(i => {
                if (i) ingredientsMap[i] = (ingredientsMap[i] || 0) + 1;
            });
            
            const outputCount = recipe.outputCount || 1;
            const craftsNeeded = Math.ceil(current.count / outputCount);
            
            for (const [ingEng, qty] of Object.entries(ingredientsMap)) {
                if (!blockRecipes[ingEng] && !this.getIconEng(ingEng)) continue; 
                
                const totalNeeded = craftsNeeded * qty;
                const linkId = `${current.engName}->${ingEng}`;
                if (linksMap[linkId]) {
                    linksMap[linkId].count += totalNeeded;
                } else {
                    linksMap[linkId] = { source: current.engName, target: ingEng, count: totalNeeded };
                }
                
                if (!nodesMap[ingEng]) {
                    nodesMap[ingEng] = { 
                        engName: ingEng, 
                        spaName: this.getSpanishName(ingEng), 
                        count: 0, 
                        depth: current.depth + 1 
                    };
                } else {
                    nodesMap[ingEng].depth = Math.max(nodesMap[ingEng].depth, current.depth + 1);
                }
                nodesMap[ingEng].count += totalNeeded;
                
                if (blockRecipes[ingEng]) {
                    const newPath = new Set(current.path);
                    newPath.add(ingEng);
                    queue.push({ engName: ingEng, count: totalNeeded, depth: current.depth + 1, path: newPath });
                }
            }
        }
        
        return { nodes: Object.values(nodesMap), links: Object.values(linksMap) };
    }

    renderMap() {
        const container = document.getElementById('crafting-tree-container');
        if (!container) return;
        container.innerHTML = '';
        
        const fullGraph = this.buildGraph(true);
        const graph = this.buildGraph(false);
        
        if (graph.nodes.length === 0) {
            container.innerHTML = '<div style="color:var(--text-secondary)">No hay dependencias crafteables.</div>';
            return;
        }
        
        const depths = {};
        let maxDepth = 0;
        graph.nodes.forEach(n => {
            if (!depths[n.depth]) depths[n.depth] = [];
            depths[n.depth].push(n);
            maxDepth = Math.max(maxDepth, n.depth);
        });
        
        const svgns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgns, 'svg');
        svg.id = 'tree-svg-layer';
        container.appendChild(svg);
        
        const colElements = {};
        const nodeElements = {};
        
        for (let i = 0; i <= maxDepth; i++) {
            if (!depths[i]) continue;
            
            const col = document.createElement('div');
            col.className = 'tree-column';
            col.setAttribute('data-depth', i);
            
            depths[i].forEach(node => {
                const nodeEl = document.createElement('div');
                nodeEl.className = 'tree-node';
                nodeEl.setAttribute('data-eng-name', node.engName);
                
                const icon = this.getIconEng(node.engName);
                const imgStr = icon ? `<img loading="lazy" src="${icon}" class="tree-node-icon" onerror="this.style.display='none'">` : `<div class="tree-node-icon"></div>`;
                
                const hasChildren = fullGraph.links.some(l => l.source === node.engName);
                const indicator = hasChildren ? `
                    <div style="font-size: 1.4rem; color: #00ffcc; margin-left: 10px; font-weight: bold; font-family: monospace;">
                        ${this.expandedNodes.has(node.engName) ? '-' : '+'}
                    </div>
                ` : '';

                nodeEl.innerHTML = `
                    ${imgStr}
                    <div class="tree-node-info">
                        <span class="tree-node-name" title="${node.spaName}">${node.spaName}</span>
                    </div>
                    <div class="tree-node-count">x${node.count}</div>
                    ${indicator}
                `;
                
                nodeEl.addEventListener('mouseenter', () => this.highlightNode(node.engName, graph, nodeElements));
                nodeEl.addEventListener('mouseleave', () => this.resetHighlights(nodeElements));
                
                if (hasChildren) {
                    nodeEl.addEventListener('click', () => {
                        if (this.expandedNodes.has(node.engName)) {
                            this.expandedNodes.delete(node.engName);
                        } else {
                            this.expandedNodes.add(node.engName);
                        }
                        this.renderMap();
                    });
                }
                
                col.appendChild(nodeEl);
                nodeElements[node.engName] = nodeEl;
            });
            
            container.appendChild(col);
            colElements[i] = col;
        }
        
        setTimeout(() => this.drawConnections(graph.links, nodeElements, svg, container), 50);
        
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.resizeObserver = new ResizeObserver(() => {
            this.drawConnections(graph.links, nodeElements, svg, container);
        });
        this.resizeObserver.observe(container);
    }
    
    highlightNode(engName, graph, nodeElements) {
        const connected = new Set([engName]);
        const linksToHighlight = new Set();
        
        const findParents = (name) => {
            graph.links.forEach(l => {
                if (l.target === name) {
                    if (!connected.has(l.source)) {
                        connected.add(l.source);
                        linksToHighlight.add(`${l.source}->${l.target}`);
                        findParents(l.source);
                    }
                }
            });
        };
        const findChildren = (name) => {
            graph.links.forEach(l => {
                if (l.source === name) {
                    if (!connected.has(l.target)) {
                        connected.add(l.target);
                        linksToHighlight.add(`${l.source}->${l.target}`);
                        findChildren(l.target);
                    }
                }
            });
        };
        
        findParents(engName);
        findChildren(engName);
        
        Object.values(nodeElements).forEach(el => {
            const id = el.getAttribute('data-eng-name');
            if (connected.has(id)) {
                el.classList.add('highlight');
                el.classList.remove('dim');
            } else {
                el.classList.add('dim');
                el.classList.remove('highlight');
            }
        });
        
        const svg = document.getElementById('tree-svg-layer');
        if (svg) {
            Array.from(svg.children).forEach(child => {
                const linkId = child.getAttribute('data-link');
                if (linksToHighlight.has(linkId)) {
                    child.classList.add('highlight');
                    child.classList.remove('dim');
                } else {
                    child.classList.add('dim');
                    child.classList.remove('highlight');
                }
            });
        }
    }
    
    resetHighlights(nodeElements) {
        Object.values(nodeElements).forEach(el => {
            el.classList.remove('highlight', 'dim');
        });
        const svg = document.getElementById('tree-svg-layer');
        if (svg) {
            Array.from(svg.children).forEach(child => {
                child.classList.remove('highlight', 'dim');
            });
        }
    }
    
    drawConnections(links, nodeElements, svg, container) {
        if (!svg || !container) return;
        svg.innerHTML = '';
        
        svg.style.width = container.scrollWidth + 'px';
        svg.style.height = container.scrollHeight + 'px';
        
        const svgRect = svg.getBoundingClientRect();
        const svgns = "http://www.w3.org/2000/svg";
        
        links.forEach(link => {
            const sourceEl = nodeElements[link.source];
            const targetEl = nodeElements[link.target];
            if (!sourceEl || !targetEl) return;
            
            const sRect = sourceEl.getBoundingClientRect();
            const tRect = targetEl.getBoundingClientRect();
            
            const startX = sRect.right - svgRect.left;
            const startY = sRect.top + (sRect.height / 2) - svgRect.top;
            
            const endX = tRect.left - svgRect.left;
            const endY = tRect.top + (tRect.height / 2) - svgRect.top;
            
            const controlOffset = Math.abs(endX - startX) / 2;
            const d = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
            
            const path = document.createElementNS(svgns, 'path');
            path.setAttribute('d', d);
            path.setAttribute('class', 'tree-path');
            path.setAttribute('data-link', `${link.source}->${link.target}`);
            svg.appendChild(path);
            
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            // Text stroke for better readability
            const textBg = document.createElementNS(svgns, 'text');
            textBg.setAttribute('x', midX);
            textBg.setAttribute('y', midY - 5);
            textBg.setAttribute('text-anchor', 'middle');
            textBg.setAttribute('class', 'path-label');
            textBg.setAttribute('data-link', `${link.source}->${link.target}`);
            textBg.style.stroke = '#0f111a';
            textBg.style.strokeWidth = '3px';
            textBg.style.strokeLinejoin = 'round';
            textBg.textContent = `x${link.count}`;
            svg.appendChild(textBg);

            const text = document.createElementNS(svgns, 'text');
            text.setAttribute('x', midX);
            text.setAttribute('y', midY - 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'path-label');
            text.setAttribute('data-link', `${link.source}->${link.target}`);
            text.textContent = `x${link.count}`;
            svg.appendChild(text);
        });
    }
}

export const craftingUI = new CraftingUI();
window.craftingUI = craftingUI;
