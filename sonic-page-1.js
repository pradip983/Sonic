
console.log("Let's write JavaScript");

// const baseURL = "https://sonic.freewebhostmost.com"

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
    console.log("Playing music:", track);  // Debugging
    currentSong.src = `Songs/${currfolder}/` + track
    if (pause != true) {
        currentSong.play();
        play.src = "/image/pause.svg"
    }
    document.querySelector(".songinfo-1").innerHTML = decodeURI(track)
    document.querySelector(".duration").innerHTML = "00:00/00:00";
    updatePlayIcons(track);
}

let folders = ["ap","jp", "lp",]; // Add all folder names here

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
    let songUl = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUl.innerHTML = " ";
    console.log("Populating song list:", songs);  // Debugging
    for (const song of songs) {
        songUl.innerHTML = songUl.innerHTML + `<li> 
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
            console.log("Album selected:", item.currentTarget.dataset.folder.split("/")[0]);  // Debugging
            songs = await getSongs(item.currentTarget.dataset.folder.split("/")[0]);
            playMusic(songs[0], true);
            populateSongList();
            attachSongListEvent();
            document.getElementById("play").src = "/image/play.svg";
            document.querySelector(".circle").style.left = "0%";
            updatePlayIcons(songs[0]);
        })
    })
}

function attachSongListEvent() {
    n = (document.querySelector(".songList").getElementsByTagName("li"))
    for (let i = 0; i < n.length; i++) {
        const e = n[i];
        e.addEventListener("click", element => {
            console.log("Song selected:", e.querySelector(".songinfo").firstElementChild.innerHTML.trim());  // Debugging
            playMusic(e.querySelector(".songinfo").firstElementChild.innerHTML.trim())
            updatePlayIcons(e.querySelector(".songinfo").firstElementChild.innerHTML.trim());
        })
    }
}

function attachPlaybackControlEvents() {
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "/image/pause.svg"
        } else {
            currentSong.pause();
            play.src = "/image/play.svg"
        }
    })

    currentSong.addEventListener("timeupdate", async () => {
        document.querySelector(".duration").innerHTML = `${secondsToMinutes(currentSong.currentTime)}/${secondsToMinutes(currentSong.duration)}`
        left = document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        if (currentSong.currentTime >= currentSong.duration) { 
            await seekbar();
        }
    })

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    pre.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split(`Songs/${currfolder}/`)[1])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split(`Songs/${currfolder}/`)[1])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    document.querySelector(".volume").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        if (e.target.value / 100 == 0) {
            document.querySelector(".volume").getElementsByTagName("img").vo.src = "/image/volume-off.svg"
            currentSong.volume = 0;
        } else {
            currentSong.volume = (e.target.value / 100);
            document.querySelector(".volume").getElementsByTagName("img").vo.src = "/image/volume-on.svg"
        }
    })

    document.querySelector(".volume").getElementsByTagName("img")[0].addEventListener("click", (e) => {
        if (document.querySelector(".volume").getElementsByTagName("img").vo.src.split("/image/")[1] == "volume-on.svg") {
            currentSong.volume = 0;
            document.querySelector(".volume").getElementsByTagName("img").vo.src = "/image/volume-off.svg"
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            currentSong.volume = 0.1;
            document.querySelector(".volume").getElementsByTagName("img").vo.src = "/image/volume-on.svg"
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
     // event for hamburger
    document.querySelector(".hamburger").addEventListener("click", () =>{
         document.querySelector(".left").style.left = 0 + "%";
        //  document.querySelector(".playbar").style.display = "none";
    })
     // event for cross
     document.querySelector(".cross").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = -100 + "%";
        // document.querySelector(".playbar").style.display = "flex";
     })
    
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
    let index = songs.indexOf(currentSong.src.split(`Songs/${currfolder}/`)[1])  
    if ((index + 1) < songs.length) {
        playMusic(songs[index + 1])
    }
}

main();
