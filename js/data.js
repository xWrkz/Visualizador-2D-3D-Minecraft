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
        { id: 1, title: "La Estatua de la Rana", modelPath: "models/MCAL/estatua-rana/", objFile: "La Estatua de la Rana.obj", mtlFile: "La_Estatua_de_la_Rana.mtl", imagePath: "Portada de Construcciones/MCAL/MCAL1.png" }
    ],
    5: [
        { id: 1, title: "Espejo Mágico", modelPath: "models/MCM/espejo-magico/", objFile: "Espejo Magico.obj", mtlFile: "Espejo_Magico.mtl", imagePath: "Portada de Construcciones/MCM/MCM1.png" }
    ]
};

// --- Traducciones y Diccionario ---
const blockTranslations = {
    "stone": "Piedra",
    "cobblestone": "Adoqu�n",
    "mossy cobblestone": "Adoqu�n Musgoso",
    "granite": "Granito",
    "polished granite": "Granito Pulido",
    "diorite": "Diorita",
    "polished diorite": "Diorita Pulida",
    "andesite": "Andesita",
    "polished andesite": "Andesita Pulida",
    "deepslate": "Pizarra Profunda",
    "cobbled deepslate": "Pizarra Profunda Empedrada",
    "polished deepslate": "Pizarra Profunda Pulida",
    "deepslate bricks": "Ladrillos de Pizarra Profunda",
    "deepslate tiles": "Baldosas de Pizarra Profunda",
    "tuff": "Toba",
    "calcite": "Calcita",
    "dripstone block": "Bloque de Espeleotema",
    "pointed dripstone": "Espeleotema Puntiagudo",
    "amethyst block": "Bloque de Amatista",
    "budding amethyst": "Geoda de Amatista",
    "obsidian": "Obsidiana",
    "crying obsidian": "Obsidiana Llorosa",
    "bedrock": "Piedra Base",
    "dirt": "Tierra",
    "coarse dirt": "Tierra �rida",
    "rooted dirt": "Tierra Enraizada",
    "mud": "Barro",
    "grass block": "Bloque de Hierba",
    "podzol": "Podzol",
    "mycelium": "Micelio",
    "dirt path": "Camino de Tierra",
    "farmland": "Tierra de Cultivo",
    "sand": "Arena",
    "red sand": "Arena Roja",
    "gravel": "Grava",
    "clay": "Arcilla",
    "sponge": "Esponja",
    "wet sponge": "Esponja Mojada",
    "ice": "Hielo",
    "packed ice": "Hielo Compacto",
    "blue ice": "Hielo Azul",
    "snow": "Nieve",
    "snow block": "Bloque de Nieve",
    "moss block": "Bloque de Musgo",
    "netherrack": "Infiedra",
    "basalt": "Basalto",
    "polished basalt": "Basalto Pulido",
    "smooth basalt": "Basalto Liso",
    "blackstone": "Piedra Negra",
    "polished blackstone": "Piedra Negra Pulida",
    "polished blackstone bricks": "Ladrillos de Piedra Negra Pulida",
    "soul sand": "Arena de Almas",
    "soul soil": "Tierra de Almas",
    "magma block": "Bloque de Magma",
    "glowstone": "Piedra Luminosa",
    "nether bricks": "Ladrillos del Nether",
    "red nether bricks": "Ladrillos del Nether Rojos",
    "bone block": "Bloque de Hueso",
    "quartz block": "Bloque de Cuarzo",
    "smooth quartz block": "Bloque de Cuarzo Liso",
    "quartz": "Cuarzo",
    "smooth quartz": "Cuarzo Liso",
    "chiseled quartz block": "Bloque de Cuarzo Cincelado",
    "quartz pillar": "Pilar de Cuarzo",
    "smooth quartz stairs": "Escaleras de Cuarzo Liso",
    "smooth quartz slab": "Losa de Cuarzo Liso",
    "end stone": "Piedra del End",
    "end stone bricks": "Ladrillos de Piedra del End",
    "purpur block": "Bloque de P�rpur",
    "purpur pillar": "Pilar de P�rpur",
    "chorus plant": "Planta Coral",
    "chorus flower": "Flor Coral",
    "coal ore": "Mineral de Carb�n",
    "deepslate coal ore": "Mineral de Carb�n en Pizarra",
    "iron ore": "Mineral de Hierro",
    "deepslate iron ore": "Mineral de Hierro en Pizarra",
    "copper ore": "Mineral de Cobre",
    "deepslate copper ore": "Mineral de Cobre en Pizarra",
    "gold ore": "Mineral de Oro",
    "deepslate gold ore": "Mineral de Oro en Pizarra",
    "redstone ore": "Mineral de Redstone",
    "deepslate redstone ore": "Mineral de Redstone en Pizarra",
    "emerald ore": "Mineral de Esmeralda",
    "deepslate emerald ore": "Mineral de Esmeralda en Pizarra",
    "lapis ore": "Mineral de Lapisl�zuli",
    "deepslate lapis ore": "Mineral de Lapisl�zuli en Pizarra",
    "diamond ore": "Mineral de Diamante",
    "deepslate diamond ore": "Mineral de Diamante en Pizarra",
    "nether gold ore": "Mineral de Oro del Nether",
    "nether quartz ore": "Mineral de Cuarzo del Nether",
    "ancient debris": "Escombros Ancestrales",
    "raw iron block": "Bloque de Hierro Bruto",
    "raw copper block": "Bloque de Cobre Bruto",
    "raw gold block": "Bloque de Oro Bruto",
    "coal block": "Bloque de Carb�n",
    "iron block": "Bloque de Hierro",
    "copper block": "Bloque de Cobre",
    "gold block": "Bloque de Oro",
    "emerald block": "Bloque de Esmeralda",
    "lapis block": "Bloque de Lapisl�zuli",
    "diamond block": "Bloque de Diamante",
    "redstone block": "Bloque de Redstone",
    "netherite block": "Bloque de Netherita",
    "crafting table": "Mesa de Trabajo",
    "furnace": "Horno",
    "smoker": "Ahumador",
    "blast furnace": "Alto Horno",
    "anvil": "Yunque",
    "grindstone": "Afiladora",
    "smithing table": "Mesa de Herrer�a",
    "cartography table": "Mesa de Cartograf�a",
    "fletching table": "Mesa de Emplumado",
    "loom": "Telar",
    "stonecutter": "Cortapiedras",
    "barrel": "Barril",
    "chest": "Cofre",
    "ender chest": "Cofre de Ender",
    "trapped chest": "Cofre Trampa",
    "jukebox": "Tocadiscos",
    "note block": "Bloque de Notas",
    "brewing stand": "Soporte para Pociones",
    "cauldron": "Caldero",
    "composter": "Compostador",
    "beacon": "Faro",
    "enchanting table": "Mesa de Encantamientos",
    "pumpkin": "Calabaza",
    "carved pumpkin": "Calabaza Tallada",
    "jack o'lantern": "Calabaza Iluminada",
    "melon": "Sand�a",
    "hay block": "Bala de Heno",
    "slime block": "Bloque de Slime",
    "honey block": "Bloque de Miel",
    "cobweb": "Telara�a",
    "lily pad": "Nen�far",
    "sugar cane": "Ca�a de Az�car",
    "cactus": "Cactus",
    "mushroom stem": "Tallo de Champi��n",
    "brown mushroom block": "Bloque de Champi��n Marr�n",
    "red mushroom block": "Bloque de Champi��n Rojo",
    "sea lantern": "Linterna del Mar",
    "prismarine": "Prismarina",
    "prismarine bricks": "Ladrillos de Prismarina",
    "dark prismarine": "Prismarina Oscura",
    "glass": "Cristal",
    "glass pane": "Panel de Cristal",
    "tinted glass": "Cristal Opaco",
    "bookshelf": "Librer�a",
    "chiseled bookshelf": "Librer�a Cincelada",
    "brick": "Ladrillo",
    "bricks": "Ladrillos",
    "sandstone": "Arenisca",
    "chiseled sandstone": "Arenisca Cincelada",
    "cut sandstone": "Arenisca Cortada",
    "smooth sandstone": "Arenisca Lisa",
    "red sandstone": "Arenisca Roja",
    "chiseled red sandstone": "Arenisca Roja Cincelada",
    "cut red sandstone": "Arenisca Roja Cortada",
    "smooth red sandstone": "Arenisca Roja Lisa",
    "stone bricks": "Ladrillos de Piedra",
    "mossy stone bricks": "Ladrillos de Piedra Musgosos",
    "cracked stone bricks": "Ladrillos de Piedra Agrietados",
    "chiseled stone bricks": "Ladrillos de Piedra Cincelados",
    "smooth stone": "Piedra Lisa",
    "nether portal": "Portal del Nether",
    "dispenser": "Dispensador",
    "dropper": "Soltador",
    "observer": "Observador",
    "hopper": "Tolva",
    "daylight detector": "Sensor de Luz Solar",
    "target": "Diana",
    "piston": "Pist�n",
    "sticky piston": "Pist�n Pegajoso",
    "redstone lamp": "L�mpara de Redstone",
    "repeater": "Repetidor de Redstone",
    "comparator": "Comparador de Redstone",
    "tnt": "Dinamita",
    "lever": "Palanca",
    "tripwire hook": "Gancho de Cuerda",
    "lightning rod": "Pararrayos",
    "scaffolding": "Andamio"
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
        "brown": "marrón", "green": "verde", "red": "rojo", "black": "negro",
        "oak": "roble", "spruce": "abeto", "birch": "abedul", "jungle": "jungla",
        "acacia": "acacia", "dark oak": "roble oscuro", "mangrove": "manglar",
        "cherry": "cerezo", "crimson": "carmesí", "warped": "distorsionado",
        "bamboo": "bambú"
    };

    const types = {
        "concrete powder": "polvo de hormigón",
        "concrete": "hormigón",
        "terracotta": "terracota",
        "glazed terracotta": "terracota esmaltada",
        "stained glass pane": "panel de cristal tintado",
        "stained glass": "cristal tintado",
        "wool": "lana",
        "carpet": "alfombra",
        "bed": "cama",
        "shulker box": "caja de shulker",
        "banner": "estandarte",
        "stairs": "escalera de",
        "slab": "losa de",
        "fence": "valla de",
        "wall": "muro de",
        "trapdoor": "trampilla de",
        "planks": "tablones de",
        "log": "tronco de",
        "wood": "madera de",
        "door": "puerta de",
        "leaves": "hojas de"
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
        if (["lana", "terracota", "terracota esmaltada", "alfombra", "cama", "caja de shulker"].includes(matchedType)) {
            if (colorEs === "blanco") colorEs = "blanca";
            if (colorEs === "amarillo") colorEs = "amarilla";
            if (colorEs === "rojo") colorEs = "roja";
            if (colorEs === "negro") colorEs = "negra";
            if (colorEs === "morado") colorEs = "morada";
        }

        const finalStr = matchedType + " " + colorEs;
        return finalStr.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    if (name === "block") return "Bloque";

    return name.charAt(0).toUpperCase() + name.slice(1);
}

