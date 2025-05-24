console.log("Let's write JavaScript");

// const baseURL = "https://sonic.freewebhostmost.com"

let currentSong = new Audio();
let songs = [];
let currfolder = "";
let n;

function secondsToMinutes(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(remainingSeconds).padStart(2, '0');
    return `${minutesStr}:${secondsStr}`;
}

async function getSongs(folder) {
    currfolder = folder;
    try {
        let response = await fetch(`Songs/${folder}/songs.json`);
        let songs = await response.json();
        console.log("Fetched songs:", songs);
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

const playMusic = (track, pause = false) => {
    const trackPath = `Songs/${currfolder}/` + track;

    // Normalize URL to compare
    const normalizedSrc = new URL(currentSong.src).pathname;
    if (normalizedSrc !== `/${trackPath}`) {
        currentSong.src = trackPath;
        document.querySelector(".songinfo-1").innerHTML = decodeURI(track);
        document.querySelector(".duration").innerHTML = "00:00/00:00";
        updatePlayIcons(track);

        // Reset seekbar
        document.querySelector(".circle").style.left = "0%";

        // Wait for metadata before playing
        currentSong.addEventListener('loadedmetadata', () => {
            if (!pause) {
                currentSong.play();
                play.src = "/image/pause.svg";
            }
        }, { once: true });
    } else {
        // Same song, just play or pause
        if (!pause) {
            currentSong.play();
            play.src = "/image/pause.svg";
        }
    }
};

let folders = ["ap", "jp", "lp"]; // Add all folder names here

async function displayalbums() {
    let container = document.querySelector(".card-container"); // Adjusted for your HTML

    for (let folder of folders) {
        let zinfoPath = `Songs/${folder}/zinfo.json`;
        let coverPath = `Songs/${folder}/cover.jpg`;

        try {
            let response = await fetch(zinfoPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            let info = await response.json();

            let card = document.createElement("div");
            card.className = "card"; // Re-using your CSS class from original code
            card.setAttribute("data-folder", folder);
            card.innerHTML = `
                <div class="play">
                    <img src="/image/play-button.svg" alt="">
                </div>
                <img src="${coverPath}" alt="">
                <h4>${info.title}</h4>
                <p>${info.description}</p>
            `;

            container.appendChild(card);
        } catch (error) {
            console.error(`Failed to load album "${folder}":`, error);
        }
    }

    // Optional: attach any event listeners after loading
    if (typeof attachAlbumSelectEvent === 'function') {
        attachAlbumSelectEvent();
    }
}

async function main() {
    await displayalbums();
    songs = await getSongs("lp");
    playMusic(songs[0], true);
    populateSongList();
    updatePlayIcons(songs[0]);
    attachSongListEvent();
    attachPlaybackControlEvents();
    console.log("Main function executed.");  // Debugging
}

function populateSongList() {
    let songUl = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUl.innerHTML = "";
    console.log("Populating song list:", songs);  // Debugging
    for (const song of songs) {
        songUl.innerHTML += `<li> 
            <div class="musicbox">
                <div class="songicon invert">
                    <div>
                        <img src="/image/music.svg" alt="">
                    </div>
                </div>
                <div class="songinfo">
                    <div id="muli"> ${song.replaceAll("%20", " ")} </div>
                </div>
                <div class="playnow ">
                    <span>play now</span>
                    <span><img src="/image/play.svg" class="invert1" alt=""></span>
                </div>
            </div>
        </li>`;
    }
}

function attachAlbumSelectEvent() {
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            const folderName = item.currentTarget.dataset.folder.split("/")[0];
            console.log("Album selected:", folderName);  // Debugging
            songs = await getSongs(folderName);
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
    n = document.querySelectorAll(".songList li");
    for (let i = 0; i < n.length; i++) {
        const e = n[i];
        e.addEventListener("click", () => {
            const songName = e.querySelector(".songinfo div").textContent.trim();
            console.log("Song selected:", songName);  // Debugging
            playMusic(songName);
            updatePlayIcons(songName);
        });
    }
}

function playNextSong() {
    const songName = decodeURIComponent(currentSong.src.split("/").pop().trim());
    const index = songs.indexOf(songName);
    if (index + 1 < songs.length) {
        playMusic(songs[index + 1]);
    }
}

function playPreviousSong() {
    const songName = decodeURIComponent(currentSong.src.split("/").pop().trim());
    const index = songs.indexOf(songName);
    if (index > 0) {
        playMusic(songs[index - 1]);
    }
}

function attachPlaybackControlEvents() {
    // Toggle Play/Pause
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "/image/pause.svg";
        } else {
            currentSong.pause();
            play.src = "/image/play.svg";
        }
    });

    // Time Update and Seekbar Progress
    currentSong.addEventListener("timeupdate", () => {
        const current = currentSong.currentTime;
        const duration = currentSong.duration;

        if (!isNaN(duration) && duration > 0) {
            document.querySelector(".duration").innerHTML = `${secondsToMinutes(current)}/${secondsToMinutes(duration)}`;
            document.querySelector(".circle").style.left = (current / duration) * 100 + "%";
        }

        if (duration > 0 && current >= duration) {
            playNextSong();
        }
    });

    // Click-to-Seek
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        if (!currentSong || isNaN(currentSong.duration) || currentSong.duration === 0) return;

        const seekbar = e.currentTarget;
        const clickX = e.offsetX;
        const width = seekbar.getBoundingClientRect().width;
        const percent = Math.min((clickX / width) * 100, 100);
        const newTime = (currentSong.duration * percent) / 100;

        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = newTime;
    });

    // Previous Song
    pre.addEventListener("click", playPreviousSong);

    // Next Song
    next.addEventListener("click", playNextSong);

    // Volume Slider
    document.querySelector(".volume input").addEventListener("change", (e) => {
        const volumeValue = e.target.value / 100;
        currentSong.volume = volumeValue;

        const volumeIcon = document.querySelector(".volume img");
        volumeIcon.src = volumeValue === 0 ? "/image/volume-off.svg" : "/image/volume-on.svg";
    });

    // Volume Icon Click (Mute/Unmute)
    document.querySelector(".volume img").addEventListener("click", () => {
        const volumeIcon = document.querySelector(".volume img");
        const rangeInput = document.querySelector(".volume input");

        if (volumeIcon.src.includes("volume-on.svg")) {
            currentSong.volume = 0;
            volumeIcon.src = "/image/volume-off.svg";
            rangeInput.value = 0;
        } else {
            currentSong.volume = 0.1;
            volumeIcon.src = "/image/volume-on.svg";
            rangeInput.value = 10;
        }
    });

    // Hamburger Menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%";
    });

    // Close Menu (Cross)
    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });
}

function updatePlayIcons(currentTrack) {
    let songListItems = document.querySelectorAll(".songList li");
    songListItems.forEach(item => {
        let playIcon = item.querySelector(".playnow img");
        if (item.querySelector(".songinfo div").textContent.trim() === decodeURI(currentTrack)) {
            playIcon.src = "/image/pause.svg";
        } else {
            playIcon.src = "/image/play.svg";
        }
    });
}

main();

