console.log("Let's write JavaScript");

let currentSong = new Audio();
let songs = [];
let currfolder = "";
let n;

function secondsToMinutes(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${m}:${s}`;
}

async function getSongs(folder) {
    currfolder = folder;
    try {
        let response = await fetch(`Songs/${folder}/songs.json`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

const playMusic = (track, pause = false) => {
    const trackPath = `Songs/${currfolder}/${track}`;

    if (!currentSong.src.includes(trackPath)) {
        currentSong.src = trackPath;
        document.querySelector(".songinfo-1").textContent = decodeURI(track);
        document.querySelector(".duration").textContent = "00:00/00:00";
        updatePlayIcons(track);
    }

    if (!pause) {
        currentSong.play().then(() => {
            play.src = "/image/pause.svg";
        }).catch(err => console.error("Playback failed:", err));
    }
};

let folders = ["ap", "jp", "lp"];

async function displayalbums() {
    let container = document.querySelector(".card-container");

    for (let folder of folders) {
        try {
            let info = await (await fetch(`Songs/${folder}/zinfo.json`)).json();
            let card = document.createElement("div");
            card.className = "card";
            card.setAttribute("data-folder", folder);
            card.innerHTML = `
                <div class="play"><img src="/image/play-button.svg"></div>
                <img src="Songs/${folder}/cover.jpg">
                <h4>${info.title}</h4>
                <p>${info.description}</p>
            `;
            container.appendChild(card);
        } catch (err) {
            console.error(`Failed to load album '${folder}':`, err);
        }
    }

    if (typeof attachAlbumSelectEvent === 'function') attachAlbumSelectEvent();
}

async function main() {
    await displayalbums();
    songs = await getSongs("lp");
    playMusic(songs[0], true);
    populateSongList();
    updatePlayIcons(songs[0]);
    attachSongListEvent();
    attachPlaybackControlEvents();
}

function populateSongList() {
    const ul = document.querySelector(".songList ul");
    ul.innerHTML = "";
    songs.forEach(song => {
        ul.innerHTML += `
            <li>
                <div class="musicbox">
                    <div class="songicon invert"><img src="/image/music.svg"></div>
                    <div class="songinfo"><div>${song.replaceAll("%20", " ")}</div></div>
                    <div class="playnow"><span>play now</span><span><img src="/image/play.svg" class="invert1"></span></div>
                </div>
            </li>
        `;
    });
}

function attachAlbumSelectEvent() {
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async e => {
            songs = await getSongs(e.currentTarget.dataset.folder);
            playMusic(songs[0], true);
            populateSongList();
            attachSongListEvent();
            document.getElementById("play").src = "/image/play.svg";
            document.querySelector(".circle").style.left = "0%";
            updatePlayIcons(songs[0]);
        });
    });
}

function attachSongListEvent() {
    document.querySelectorAll(".songList li").forEach(li => {
        li.addEventListener("click", e => {
            if (e.target.closest(".seekbar") || e.target.closest(".circle") || e.target.closest(".volume")) return;
            const track = li.querySelector(".songinfo div").textContent.trim();
            playMusic(track);
            updatePlayIcons(track);
        });
    });
}

function attachPlaybackControlEvents() {
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "/image/pause.svg";
        } else {
            currentSong.pause();
            play.src = "/image/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {
            document.querySelector(".duration").textContent = `${secondsToMinutes(currentSong.currentTime)}/${secondsToMinutes(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
        if (currentSong.currentTime >= currentSong.duration) playNextSong();
    });

    document.querySelector(".seekbar").addEventListener("click", (e) => {
        e.stopPropagation();
        const width = e.currentTarget.getBoundingClientRect().width;
        const percent = e.offsetX / width;
        const newTime = currentSong.duration * percent;
        currentSong.currentTime = newTime;
        document.querySelector(".circle").style.left = percent * 100 + "%";
    });

    document.querySelector(".circle").addEventListener("click", e => e.stopPropagation());

    pre.addEventListener("click", playPreviousSong);
    next.addEventListener("click", playNextSong);

    document.querySelector(".volume input").addEventListener("change", e => {
        const val = e.target.value / 100;
        currentSong.volume = val;
        document.querySelector(".volume img").src = val === 0 ? "/image/volume-off.svg" : "/image/volume-on.svg";
    });

    document.querySelector(".volume img").addEventListener("click", () => {
        const volImg = document.querySelector(".volume img");
        const range = document.querySelector(".range input");
        if (volImg.src.includes("volume-on.svg")) {
            currentSong.volume = 0;
            volImg.src = "/image/volume-off.svg";
            range.value = 0;
        } else {
            currentSong.volume = 0.1;
            volImg.src = "/image/volume-on.svg";
            range.value = 10;
        }
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%";
    });
    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });
}

function playNextSong() {
    const songName = decodeURIComponent(currentSong.src.split("/").pop().trim());
    const index = songs.indexOf(songName);
    if (index + 1 < songs.length) playMusic(songs[index + 1]);
}

function playPreviousSong() {
    const songName = decodeURIComponent(currentSong.src.split("/").pop().trim());
    const index = songs.indexOf(songName);
    if (index > 0) playMusic(songs[index - 1]);
}

function updatePlayIcons(currentTrack) {
    document.querySelectorAll(".songList li").forEach(item => {
        let icon = item.querySelector(".playnow img");
        icon.src = item.querySelector(".songinfo div").textContent.trim() === decodeURI(currentTrack) ? "/image/pause.svg" : "/image/play.svg";
    });
}

main();
