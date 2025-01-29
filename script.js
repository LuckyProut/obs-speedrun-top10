const GAME_ID = "bs1"; // ID du jeu sur speedrun.com
const CATEGORY_NAME = "Any%"; // Nom de la catégorie cible


document.addEventListener("DOMContentLoaded", function() {
async function fetchAPI(url) {
    try {
        const response = await fetch(url);
        return response.ok ? response.json() : null;
    } catch (error) {
        console.error(`Erreur lors de la requête : ${url}`, error);
        return null;
    }
}

async function getCategoryId(gameId, categoryName) {
    const data = await fetchAPI(`https://www.speedrun.com/api/v1/games/${gameId}/categories`);
    return data?.data.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase())?.id || null;
}

async function getLeaderboard(gameId, categoryId) {
    const data = await fetchAPI(`https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${categoryId}`);
    return data?.data.runs.map(run => ({
        place: run.place,
        time: run.run.times.primary_t,
        playerId: run.run.players[0]?.id || null
    })) || [];
}

async function getPlayerDetails(playerId) {
    if (!playerId) return { name: "Anonyme", flag: "🏳️" }; 

    const data = await fetchAPI(`https://www.speedrun.com/api/v1/users/${playerId}`);
    return data ? {
        name: data.data.names.international,
        flag: data.data.location?.country?.code ? getFlagEmoji(data.data.location.country.code) : "🏳️"
    } : { name: "Inconnu", flag: "🏳️" };
}

const getFlagEmoji = code => 
    [...code.toUpperCase()].map(char => String.fromCodePoint(127397 + char.charCodeAt())).join("");

async function loadLeaderboard() {
    const tableBody = document.querySelector("#output tbody");
    const categoryId = await getCategoryId(GAME_ID, CATEGORY_NAME);

    if (!categoryId) {
        tableBody.innerHTML = `<tr><td colspan="3">Catégorie "${CATEGORY_NAME}" introuvable.</td></tr>`;
        return;
    }

    const leaderboard = (await getLeaderboard(GAME_ID, categoryId)).slice(0, 10);
    if (!leaderboard.length) {
        tableBody.innerHTML = `<tr><td colspan="3">Aucun leaderboard trouvé.</td></tr>`;
        return;
    }

    const leaderboardWithDetails = await Promise.all(leaderboard.map(async run => ({
        place: run.place,
        time: formatTime(run.time),
        ...(await getPlayerDetails(run.playerId))
    })));

    tableBody.innerHTML = leaderboardWithDetails.map(({ place, time, name, flag }) => 
        `<tr><td>${place}</td><td><span class="flag">${flag}</span>${name}</td><td>${time}</td></tr>`
    ).join("");
}

const formatTime = seconds => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h ? h + ":" : ""}${m}:${s.toString().padStart(2, "0")}`;
};

loadLeaderboard();
});