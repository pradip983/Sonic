console.log("Let's write JavaScript");

let currentSong = new Audio();
let songs = [];
let currfolder = "";
let n;
let left;

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
    const trackPath = `Songs/${currfolder}/${track}`;
    console.log("Requested track:", track);
    console.log("Current folder:", currfolder);
    console.log("Full track path:", trackPath);
    console.log("Current song source:", currentSong.src);

    // Only update src if it's a different track
    if (!currentSong.src.includes(trackPath)) {
        console.log("Setting new source and updating UI");
        currentSong.src = trackPath;
        document.querySelector(".songinfo-1").textContent = decodeURI(track);
        document.querySelector(".duration").textContent = "00:00/00:00";
        updatePlayIcons(track);
    } else {
        console.log("Track already set. Skipping source update.");
    }

    // Play the song if not paused
    if (!pause) {
        currentSong.play().then(() => {
            console.log("Playback started.");
            play.src = "/image/pause.svg";
        }).catch(error => {
            console.error("Playback failed:", error);
        });
    } else {
        console.log("Pause flag is true. Not playing.");
    }
};


let folders = ["ap", "jp", "lp"]; // Add all folder names here

async function displayalbums() {
    let container = document.querySelector(".card-container");

    for (let folder of folders) {
        let zinfoPath = `Songs/${folder}/zinfo.json`;
        let coverPath = `Songs/${folder}/cover.jpg`;

        try {
            let response = await fetch(zinfoPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            let info = await response.json();

            let card = document.createElement("div");
            card.className = "card";
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
    console.log("Main function executed.");
}

function populateSongList() {
    let songUl = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUl.innerHTML = "";
    console.log("Populating song list:", songs);
    for (const song of songs) {
        songUl.innerHTML += `
            <li>
                <div class="musicbox">
                    <div class="songicon invert">
                        <div>
                            <img src="/image/music.svg" alt="">
                        </div>
                    </div>
                    <div class="songinfo">
                        <div id="muli">${song.replaceAll("%20", " ")}</div>
                    </div>
                    <div class="playnow">
                        <span>play now</span>
                        <span><img src="/image/play.svg" class="invert1" alt=""></span>
                    </div>
                </div>
            </li>
        `;
    }
}

function attachAlbumSelectEvent() {
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Album selected:", item.currentTarget.dataset.folder);
            songs = await getSongs(item.currentTarget.dataset.folder);
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
    n = document.querySelector(".songList").getElementsByTagName("li");
    for (let i = 0; i < n.length; i++) {
        const e = n[i];
        e.addEventListener("click", element => {
            const track = e.querySelector(".songinfo").firstElementChild.innerHTML.trim();
            console.log("Song selected:", track);
            playMusic(track);
            updatePlayIcons(track);
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
        const current = currentSong.currentTime;
        const duration = currentSong.duration;

        if (!isNaN(duration)) {
            document.querySelector(".duration").innerHTML = `${secondsToMinutes(current)}/${secondsToMinutes(duration)}`;
            document.querySelector(".circle").style.left = (current / duration) * 100 + "%";
        }

        if (current >= duration) {
            playNextSong();
        }
    });

   document.querySelector(".seekbar").addEventListener("click", (e) => {
    if (!currentSong || isNaN(currentSong.duration)) {
        console.warn("Seekbar clicked but no valid song or duration available.");
        return;
    }

    const seekbar = e.currentTarget;
    const clickX = e.offsetX;
    const width = seekbar.getBoundingClientRect().width;

    if (width === 0) {
        console.warn("Seekbar width is 0 — cannot calculate seek position.");
        return;
    }

    const percent = Math.max(0, Math.min((clickX / width) * 100, 100));
    const newTime = (currentSong.duration * percent) / 100;

    console.log(`Seekbar clicked at ${clickX}px / ${width}px (${percent.toFixed(2)}%)`);
    console.log(`Setting song time to: ${newTime.toFixed(2)}s of ${currentSong.duration.toFixed(2)}s`);

    // Update UI
    const circle = document.querySelector(".circle");
    circle.style.left = percent + "%";

    // Set new song time
    currentSong.currentTime = newTime;
});


    pre.addEventListener("click", playPreviousSong);
    next.addEventListener("click", playNextSong);

    document.querySelector(".volume input").addEventListener("change", (e) => {
        const volumeValue = e.target.value / 100;
        currentSong.volume = volumeValue;

        const volumeIcon = document.querySelector(".volume img");
        volumeIcon.src = volumeValue === 0 ? "/image/volume-off.svg" : "/image/volume-on.svg";
    });

    document.querySelector(".volume img").addEventListener("click", () => {
        const volumeIcon = document.querySelector(".volume img");
        const rangeInput = document.querySelector(".range input");

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

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%";
    });

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

function seekbar() {
    const songName = decodeURIComponent(currentSong.src.split("/").pop().trim());
    const index = songs.indexOf(songName);

    if (index !== -1 && (index + 1) < songs.length) {
        playMusic(songs[index + 1]);
    } else {
        console.log("No more songs to play or song not found.");
    }
}

main();
