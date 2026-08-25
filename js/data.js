// --- Base de Datos Hardcodeada ---
const collections = [
    { id: 1, name: "Mini-Construcciones", locked: false, tier: null },
    { id: 2, name: "Mini-Construcciones Alucinantes", locked: false, tier: null },
    { id: 3, name: "Mini-Construcciones Asombrosas", locked: false, tier: null },
    { id: 4, name: "Mini-Construcciones Increibles", locked: false, tier: null },
    { id: 5, name: "Mini-Construcciones Mágicas", locked: false, tier: null }
];

const specificBuilds = {
    1: [
        { id: 1, title: "Creeper del Bosque", modelPath: "models/MC/creeper/", objFile: "Creeper Del Bosque.obj", mtlFile: "Creeper_Del_Bosque.mtl", imagePath: "Portada de Construcciones/MC/MC1.png" }
    ],
    2: [
        { id: 1, title: "La Estatua de la Rana", modelPath: "models/MCAL/estatua-rana/", objFile: "La Estatura de la Rana.obj", mtlFile: "La_Estatura_de_la_Rana.mtl", imagePath: "Portada de Construcciones/MCAL/MCAL1.png" }
    ],
    5: [
        { id: 1, title: "Espejo Mágico", modelPath: "models/MCM/espejo-magico/", objFile: "Espejo Magico.obj", mtlFile: "Espejo_Magico.mtl", imagePath: "Portada de Construcciones/MCM/MCM1.png" }
    ]
};

// --- Traducciones y Diccionario ---
const blockTranslations = {
    "dirt": "Tierra",
    "grass block": "Bloque de Pasto",
    "stone": "Piedra",
    "cobblestone": "Adoquín",
    "oak log": "Tronco de Roble",
    "oak planks": "Madera de Roble",
    "birch log": "Tronco de Abedul",
    "birch planks": "Madera de Abedul",
    "spruce log": "Tronco de Abeto",
    "spruce planks": "Madera de Abeto",
    "jungle log": "Tronco de Jungla",
    "jungle planks": "Madera de Jungla",
    "acacia log": "Tronco de Acacia",
    "acacia planks": "Madera de Acacia",
    "dark oak log": "Tronco de Roble Oscuro",
    "dark oak planks": "Madera de Roble Oscuro",
    "glass": "Cristal",
    "sand": "Arena",
    "gravel": "Grava",
    "water": "Agua",
    "lava": "Lava",
    "obsidian": "Obsidiana",
    "bedrock": "Piedra Base",
    "leaves": "Hojas",
    "oak leaves": "Hojas de Roble",
    "birch leaves": "Hojas de Abedul",
    "spruce leaves": "Hojas de Abeto",
    "jungle leaves": "Hojas de Jungla",
    "acacia leaves": "Hojas de Acacia",
    "dark oak leaves": "Hojas de Roble Oscuro",
    "iron ore": "Mineral de Hierro",
    "gold ore": "Mineral de Oro",
    "diamond ore": "Mineral de Diamante",
    "coal ore": "Mineral de Carbón",
    "emerald ore": "Mineral de Esmeralda",
    "redstone ore": "Mineral de Redstone",
    "lapis ore": "Mineral de Lapislázuli",
    "iron block": "Bloque de Hierro",
    "gold block": "Bloque de Oro",
    "diamond block": "Bloque de Diamante",
    "emerald block": "Bloque de Esmeralda",
    "coal block": "Bloque de Carbón",
    "redstone block": "Bloque de Redstone",
    "lapis block": "Bloque de Lapislázuli",
    "crafting table": "Mesa de Trabajo",
    "furnace": "Horno",
    "chest": "Cofre",
    "torch": "Antorcha",
    "ladder": "Escalera de Mano",
    "snow": "Nieve",
    "ice": "Hielo",
    "clay": "Arcilla",
    "brick": "Ladrillo",
    "bricks": "Ladrillos",
    "bookshelf": "Librería",
    "sandstone": "Arenisca",
    "wool": "Lana",
    "white wool": "Lana Blanca",
    "black wool": "Lana Negra",
    "gray wool": "Lana Gris",
    "light gray wool": "Lana Gris Claro",
    "red wool": "Lana Roja",
    "blue wool": "Lana Azul",
    "green wool": "Lana Verde",
    "yellow wool": "Lana Amarilla",
    "brown wool": "Lana Marrón",
    "cyan wool": "Lana Cian",
    "purple wool": "Lana Morada",
    "magenta wool": "Lana Magenta",
    "pink wool": "Lana Rosa",
    "orange wool": "Lana Naranja",
    "light blue wool": "Lana Celeste",
    "lime wool": "Lana Verde Lima",
    "netherrack": "Infiedra",
    "soul sand": "Arena de Almas",
    "glowstone": "Piedra Luminosa",
    "quartz block": "Bloque de Cuarzo",
    "terracotta": "Terracota",
    "concrete": "Concreto",
    "concrete powder": "Polvo de Concreto",
    "slime block": "Bloque de Slime",
    "honey block": "Bloque de Miel",
    "bone block": "Bloque de Hueso",
    "hay block": "Bala de Heno",
    "magma block": "Bloque de Magma",
    "prismarine": "Prismarina",
    "sea lantern": "Linterna del Mar",
    "sponge": "Esponja",
    "melon": "Sandía",
    "pumpkin": "Calabaza",
    "end stone": "Piedra del End",
    "purpur block": "Bloque de Púrpur",
    "andesite": "Andesita",
    "diorite": "Diorita",
    "granite": "Granito",
    "polished andesite": "Andesita Pulida",
    "polished diorite": "Diorita Pulida",
    "polished granite": "Granito Pulido",
    "tuff": "Toba",
    "deepslate": "Pizarra Profunda",
    "copper ore": "Mineral de Cobre",
    "copper block": "Bloque de Cobre",
    "amethyst block": "Bloque de Amatista"
};

function translateBlockName(englishName) {
    let name = englishName.toLowerCase().trim();
    
    if (blockTranslations[name]) {
        return blockTranslations[name];
    }

    const colors = {
        "white": "blanco", "orange": "naranja", "magenta": "magenta", "light blue": "celeste",
        "yellow": "amarillo", "lime": "verde lima", "pink": "rosa", "gray": "gris",
        "light gray": "gris claro", "cyan": "cian", "purple": "morado", "blue": "azul",
        "brown": "marrón", "green": "verde", "red": "rojo", "black": "negro"
    };
    
    const types = {
        "concrete powder": "polvo de concreto",
        "concrete": "concreto",
        "terracotta": "terracota",
        "glazed terracotta": "terracota esmaltada",
        "stained glass pane": "panel de cristal tintado",
        "stained glass": "cristal tintado",
        "wool": "lana",
        "carpet": "alfombra",
        "bed": "cama",
        "shulker box": "caja de shulker",
        "banner": "estandarte"
    };

    let matchedType = null;
    let matchedColor = null;
    
    for (const [enType, esType] of Object.entries(types)) {
        if (name.includes(enType)) {
            matchedType = esType;
            for (const [enColor, esColor] of Object.entries(colors)) {
                if (name.includes(enColor)) {
                    matchedColor = esColor;
                    break;
                }
            }
            break;
        }
    }
    
    if (matchedType && matchedColor) {
        let colorEs = matchedColor;
        if (["lana", "terracota", "terracota esmaltada", "alfombra", "cama"].includes(matchedType)) {
            if (colorEs === "blanco") colorEs = "blanca";
            if (colorEs === "amarillo") colorEs = "amarilla";
            if (colorEs === "rojo") colorEs = "roja";
            if (colorEs === "negro") colorEs = "negra";
            if (colorEs === "morado") colorEs = "morada";
        }
        
        const finalStr = matchedType + " " + colorEs;
        return finalStr.replace(/\b\w/g, c => c.toUpperCase());
    }

    if (name === "block") return "Bloque";

    return name.charAt(0).toUpperCase() + name.slice(1);
}
