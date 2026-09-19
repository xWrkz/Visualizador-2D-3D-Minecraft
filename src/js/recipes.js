// Base de datos de recetas de Minecraft para el visualizador
// format: blockName: [ { type: 'crafting_table'|'stonecutter'|'furnace', ingredients: [], outputCount: number } ]
export const blockRecipes = {
    // === MADERA Y DERIVADOS ===
    "warped planks": [
        { type: "crafting_table", ingredients: ["warped stem", null, null, null, null, null, null, null, null], outputCount: 4 }
    ],
    "oak planks": [
        { type: "crafting_table", ingredients: ["oak log", null, null, null, null, null, null, null, null], outputCount: 4 }
    ],
    "spruce planks": [
        { type: "crafting_table", ingredients: ["spruce log", null, null, null, null, null, null, null, null], outputCount: 4 }
    ],
    "oak stairs": [
        { type: "crafting_table", ingredients: ["oak planks", null, null, "oak planks", "oak planks", null, "oak planks", "oak planks", "oak planks"], outputCount: 4 }
    ],
    
    // === PIEDRA Y DERIVADOS ===
    "stone": [
        { type: "furnace", ingredients: ["cobblestone"], outputCount: 1 }
    ],
    "stone bricks": [
        { type: "crafting_table", ingredients: ["stone", "stone", null, "stone", "stone", null, null, null, null], outputCount: 4 },
        { type: "stonecutter", ingredients: ["stone"], outputCount: 1 }
    ],
    "stone brick stairs": [
        { type: "crafting_table", ingredients: ["stone bricks", null, null, "stone bricks", "stone bricks", null, "stone bricks", "stone bricks", "stone bricks"], outputCount: 4 },
        { type: "stonecutter", ingredients: ["stone bricks"], outputCount: 1 }
    ],
    "cobblestone stairs": [
        { type: "crafting_table", ingredients: ["cobblestone", null, null, "cobblestone", "cobblestone", null, "cobblestone", "cobblestone", "cobblestone"], outputCount: 4 },
        { type: "stonecutter", ingredients: ["cobblestone"], outputCount: 1 }
    ],

    // === DEEPSLATE Y DERIVADOS ===
    "cobbled deepslate": [
        // Suele minarse directamente
    ],
    "polished deepslate": [
        { type: "crafting_table", ingredients: ["cobbled deepslate", "cobbled deepslate", null, "cobbled deepslate", "cobbled deepslate", null, null, null, null], outputCount: 4 }
    ],
    "polished deepslate stairs": [
        { type: "crafting_table", ingredients: ["polished deepslate", null, null, "polished deepslate", "polished deepslate", null, "polished deepslate", "polished deepslate", "polished deepslate"], outputCount: 4 },
        { type: "stonecutter", ingredients: ["polished deepslate"], outputCount: 1 }
    ],
    "deepslate bricks": [
        { type: "crafting_table", ingredients: ["polished deepslate", "polished deepslate", null, "polished deepslate", "polished deepslate", null, null, null, null], outputCount: 4 },
        { type: "stonecutter", ingredients: ["polished deepslate"], outputCount: 1 }
    ],
    "deepslate tiles": [
        { type: "crafting_table", ingredients: ["deepslate bricks", "deepslate bricks", null, "deepslate bricks", "deepslate bricks", null, null, null, null], outputCount: 4 },
        { type: "stonecutter", ingredients: ["deepslate bricks"], outputCount: 1 }
    ],

    // === OTROS ===
    "iron bars": [
        { type: "crafting_table", ingredients: ["iron ingot", "iron ingot", "iron ingot", "iron ingot", "iron ingot", "iron ingot", null, null, null], outputCount: 16 }
    ],
    "glass pane": [
        { type: "crafting_table", ingredients: ["glass", "glass", "glass", "glass", "glass", "glass", null, null, null], outputCount: 16 }
    ],
    "blue ice": [
        { type: "crafting_table", ingredients: ["packed ice", "packed ice", "packed ice", "packed ice", "packed ice", "packed ice", "packed ice", "packed ice", "packed ice"], outputCount: 1 }
    ],
    "packed ice": [
        { type: "crafting_table", ingredients: ["ice", "ice", null, "ice", "ice", null, null, null, null], outputCount: 1 }
    ],
    // === CREEPER DEL BOSQUE (Terracota y Concreto) ===
    "lime terracotta": [
        { type: "crafting_table", ingredients: ["terracotta", "terracotta", "terracotta", "terracotta", "lime dye", "terracotta", "terracotta", "terracotta", "terracotta"], outputCount: 8 }
    ],
    "green terracotta": [
        { type: "crafting_table", ingredients: ["terracotta", "terracotta", "terracotta", "terracotta", "green dye", "terracotta", "terracotta", "terracotta", "terracotta"], outputCount: 8 }
    ],
    "white concrete powder": [
        { type: "crafting_table", ingredients: ["sand", "sand", "sand", "sand", "gravel", "gravel", "gravel", "gravel", "white dye"], outputCount: 8 }
    ],
    "magenta terracotta": [
        { type: "furnace", ingredients: ["magenta terracotta"], outputCount: 1 } // Not realistic but fallback
    ],

    // === UNICORNIO ===
    "quartz block": [
        { type: "crafting_table", ingredients: ["nether quartz", "nether quartz", null, "nether quartz", "nether quartz", null, null, null, null], outputCount: 1 }
    ],
    "smooth quartz block": [
        { type: "furnace", ingredients: ["quartz block"], outputCount: 1 }
    ],
    "smooth quartz": [
        { type: "furnace", ingredients: ["quartz block"], outputCount: 1 }
    ],
    "chiseled quartz block": [
        { type: "stonecutter", ingredients: ["quartz block"], outputCount: 1 }
    ],
    "quartz pillar": [
        { type: "stonecutter", ingredients: ["quartz block"], outputCount: 1 }
    ],
    "purpur block": [
        { type: "crafting_table", ingredients: ["popped chorus fruit", "popped chorus fruit", null, "popped chorus fruit", "popped chorus fruit", null, null, null, null], outputCount: 4 }
    ],
    "purpur slab": [
        { type: "stonecutter", ingredients: ["purpur block"], outputCount: 2 }
    ],
    "purpur stairs": [
        { type: "stonecutter", ingredients: ["purpur block"], outputCount: 1 }
    ],
    "end rod": [
        { type: "crafting_table", ingredients: ["blaze rod", null, null, "popped chorus fruit", null, null, null, null, null], outputCount: 4 }
    ],
    "polished blackstone": [
        { type: "crafting_table", ingredients: ["blackstone", "blackstone", null, "blackstone", "blackstone", null, null, null, null], outputCount: 4 }
    ],
    "polished blackstone button": [
        { type: "crafting_table", ingredients: ["polished blackstone", null, null, null, null, null, null, null, null], outputCount: 1 }
    ],
    "white concrete": [
        { type: "furnace", ingredients: ["white concrete powder"], outputCount: 1 } // Representación del agua
    ],
    "gray concrete powder": [
        { type: "crafting_table", ingredients: ["sand", "sand", "sand", "sand", "gravel", "gravel", "gravel", "gravel", "gray dye"], outputCount: 8 }
    ],
    "gray concrete": [
        { type: "furnace", ingredients: ["gray concrete powder"], outputCount: 1 }
    ],
    "green concrete powder": [
        { type: "crafting_table", ingredients: ["sand", "sand", "sand", "sand", "gravel", "gravel", "gravel", "gravel", "green dye"], outputCount: 8 }
    ],
    "green concrete": [
        { type: "furnace", ingredients: ["green concrete powder"], outputCount: 1 }
    ],

    // === QUARTZ ADICIONAL ===
    "quartz": [
        { type: "crafting_table", ingredients: ["nether quartz", "nether quartz", null, "nether quartz", "nether quartz", null, null, null, null], outputCount: 1 }
    ],
    "quartz block": [
        { type: "crafting_table", ingredients: ["nether quartz", "nether quartz", null, "nether quartz", "nether quartz", null, null, null, null], outputCount: 1 }
    ],
    "block of quartz": [
        { type: "crafting_table", ingredients: ["nether quartz", "nether quartz", null, "nether quartz", "nether quartz", null, null, null, null], outputCount: 1 }
    ],
    "smooth quartz slab": [
        { type: "stonecutter", ingredients: ["smooth quartz"], outputCount: 2 }
    ],
    "smooth quartz stairs": [
        { type: "stonecutter", ingredients: ["smooth quartz"], outputCount: 1 }
    ],

    // === BAMBOO ===
    "bamboo planks": [
        { type: "crafting_table", ingredients: ["bamboo block", null, null, null, null, null, null, null, null], outputCount: 2 }
    ],
    "bamboo slab": [
        { type: "stonecutter", ingredients: ["bamboo planks"], outputCount: 2 }
    ],
    "bamboo stairs": [
        { type: "stonecutter", ingredients: ["bamboo planks"], outputCount: 1 }
    ],
    "bamboo block": [
        { type: "crafting_table", ingredients: ["bamboo", "bamboo", "bamboo", "bamboo", "bamboo", "bamboo", "bamboo", "bamboo", "bamboo"], outputCount: 1 }
    ],

    // === CONCRETE ADICIONAL ===
    "black concrete powder": [
        { type: "crafting_table", ingredients: ["sand", "sand", "sand", "sand", "gravel", "gravel", "gravel", "gravel", "black dye"], outputCount: 8 }
    ],
    "black concrete": [
        { type: "furnace", ingredients: ["black concrete powder"], outputCount: 1 }
    ],
    "orange concrete powder": [
        { type: "crafting_table", ingredients: ["sand", "sand", "sand", "sand", "gravel", "gravel", "gravel", "gravel", "orange dye"], outputCount: 8 }
    ],
    "orange concrete": [
        { type: "furnace", ingredients: ["orange concrete powder"], outputCount: 1 }
    ],

    // === TERRACOTTA ADICIONAL ===
    "orange terracotta": [
        { type: "crafting_table", ingredients: ["terracotta", "terracotta", "terracotta", "terracotta", "orange dye", "terracotta", "terracotta", "terracotta", "terracotta"], outputCount: 8 }
    ],
    "yellow terracotta": [
        { type: "crafting_table", ingredients: ["terracotta", "terracotta", "terracotta", "terracotta", "yellow dye", "terracotta", "terracotta", "terracotta", "terracotta"], outputCount: 8 }
    ],

    // === WOOL Y CARPET ===
    "orange wool": [
        { type: "crafting_table", ingredients: ["white wool", "orange dye", null, null, null, null, null, null, null], outputCount: 1 }
    ],
    "green wool": [
        { type: "crafting_table", ingredients: ["white wool", "green dye", null, null, null, null, null, null, null], outputCount: 1 }
    ],
    "yellow wool": [
        { type: "crafting_table", ingredients: ["white wool", "yellow dye", null, null, null, null, null, null, null], outputCount: 1 }
    ],
    "purple wool": [
        { type: "crafting_table", ingredients: ["white wool", "purple dye", null, null, null, null, null, null, null], outputCount: 1 }
    ],
    "orange carpet": [
        { type: "crafting_table", ingredients: ["orange wool", "orange wool", null, null, null, null, null, null, null], outputCount: 3 }
    ],
    "yellow carpet": [
        { type: "crafting_table", ingredients: ["yellow wool", "yellow wool", null, null, null, null, null, null, null], outputCount: 3 }
    ],
    "purple carpet": [
        { type: "crafting_table", ingredients: ["purple wool", "purple wool", null, null, null, null, null, null, null], outputCount: 3 }
    ],

    // === PIEDRA ADICIONAL ===
    "smooth stone": [
        { type: "furnace", ingredients: ["stone"], outputCount: 1 }
    ]
};

window.blockRecipes = blockRecipes;
