GEN = GEN.concat(GEN2);

let playlistActual = [];
let indiceActual = 0;

const Reproductor = document.getElementById("Player");
const video = document.getElementById("videoElement");
const canvas = document.getElementById("visualCanvas");
const ctx = canvas.getContext('2d');

const InfoCancion = document.getElementById("NowPlayingInfo");
const I = document.getElementById("I");
const ListaGeneros = document.getElementById("Lista");
const ListaCancionesContenedor = document.getElementById("ListaCanciones");
const VistaGeneros = document.getElementById("VistaGeneros");
const VistaPlaylist = document.getElementById("VistaPlaylist");
const VistaBusqueda = document.getElementById("VistaBusqueda");
const ListaBusqueda = document.getElementById("ListaBusqueda");
const TituloCarpeta = document.getElementById("TituloCarpeta");
const LoadingBox = document.getElementById("LoadingBox");
const BtnPlay = document.getElementById("BtnPlay");
const ProgressBar = document.getElementById("ProgressBar");
const TimeCurrent = document.getElementById("TimeCurrent");
const TimeTotal = document.getElementById("TimeTotal");
const PlayerBar = document.getElementById("PlayerBar");
const No = document.getElementById("No");

// --- CONFIGURACIÓN DE LA IMAGEN PARA EL PiP ---
const albumArt = new Image();
albumArt.crossOrigin = "anonymous";
// Puedes cambiar este enlace por el de cualquier imagen, póster o logo que prefieras
albumArt.src = 'icono.png';

// Configurar flujo del canvas hacia el video oculto para el PiP (actualiza a 30 cuadros por segundo)
const stream = canvas.captureStream(30);
video.srcObject = stream;

function dibujarCanvas() {
    // Fondo de la pantalla flotante
    ctx.fillStyle = '#0f0f13';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar la imagen/carátula a la izquierda del PiP
    try {
        ctx.drawImage(albumArt, 15, 25, 100, 100);
    } catch(e) {}

    // Texto superior (Fijo)
    ctx.fillStyle = '#888';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('MUSIC CLOUD', 130, 35);

    // Título de la canción actual (Se actualiza dinámicamente)
    ctx.fillStyle = '#cc4dd6';
    ctx.font = 'bold 13px system-ui';
    let titulo = InfoCancion.innerText || "Selecciona una pista";
    
    // Si el título es muy largo, lo recortamos para que no se salga de la ventana flotante
    if (titulo.length > 24) {
        titulo = titulo.substring(0, 21) + "...";
    }
    ctx.fillText(titulo, 130, 60);

    // Estado (Reproduciendo o Pausado)
    ctx.fillStyle = Reproductor.paused ? '#ff5555' : '#00ffcc';
    ctx.font = '11px system-ui';
    ctx.fillText(Reproductor.paused ? '⏸️ En pausa' : '▶️ Reproduciendo', 130, 95);

    requestAnimationFrame(dibujarCanvas);
}
dibujarCanvas();

function inicializarSistema() {
    let idContador = 1;
    GEN.forEach(genero => {
        if (genero.canciones) {
            genero.canciones.forEach(cancion => {
                cancion.id = idContador++;
            });
        }
    });
    mostrarGenerosBase();
}

function mostrarGenerosBase() {
    ListaGeneros.innerHTML = "";
    GEN.forEach((genero, i) => {
        let li = document.createElement('li');
        li.className = "genre-card"; 
        li.onclick = () => abrirCarpeta(i);
        li.innerHTML = `
            <div class="genre-emoji">${genero.logo}</div>
            <div class="genre-name">${genero.name}</div>
        `;
        ListaGeneros.appendChild(li);  
    });
}

function mostrarGeneros() {
    VistaGeneros.style.display = "block";
    VistaPlaylist.style.display = "none";
    VistaBusqueda.style.display = "none";
    I.value = "";
    No.style.display = "none"; 
    document.getElementById("MainContent").scrollTop = 0; 
}

function abrirCarpeta(indexGenero) {
    let genero = GEN[indexGenero];
    VistaGeneros.style.display = "none";
    VistaBusqueda.style.display = "none";
    VistaPlaylist.style.display = "block";
    document.getElementById("MainContent").scrollTop = 0; 
    TituloCarpeta.innerText = `${genero.logo} ${genero.name}`;
    
    playlistActual = genero.canciones || [];
    ListaCancionesContenedor.innerHTML = "";
    
    playlistActual.forEach((cancion, i) => {
        let div = document.createElement('div');
        div.className = "song-item";
        div.setAttribute("data-id", cancion.id); 
        div.innerHTML = `<span class="song-title">🎵 ${cancion.name}</span>`;
        div.onclick = () => reproducirCancion(cancion, i);
        ListaCancionesContenedor.appendChild(div);
    });
}

function marcarCancionActiva(idCancion) {
    document.querySelectorAll('.song-item').forEach(el => {
        el.classList.remove('active-song');
    });
    let cancionActiva = document.querySelector(`.song-item[data-id="${idCancion}"]`);
    if(cancionActiva) {
        cancionActiva.classList.add('active-song');
        cancionActiva.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function reproducirCancion(cancion, index) {
    LoadingBox.style.display = "block";
    marcarCancionActiva(cancion.id);

    try {
        var SONG = cancion.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        Reproductor.src = SONG;
        PlayerBar.style.background = 'url(4.gif)';  
        
        Reproductor.play().then(() => {
            video.play();
        }).catch(error => {
            console.log("Autoplay bloqueado:", error);
            InfoCancion.innerText = "Toca '▶️' para reproducir";
            BtnPlay.innerText = "▶️";
            PlayerBar.style.background = '';
        });

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: cancion.name,
                artist: 'MUSIC CLOUD', 
                album: 'Playlist',
                artwork: [
                    { src: 'https://cdn-icons-png.flaticon.com/512/3269/3269022.png', sizes: '512x512', type: 'image/png' }
                ]
            });
            
            navigator.mediaSession.setActionHandler('play', () => togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => togglePlay());
            
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                if (indiceActual > 0) {
                    let anteriorIndex = indiceActual - 1;
                    reproducirCancion(playlistActual[anteriorIndex], anteriorIndex);
                }
            });

            navigator.mediaSession.setActionHandler('nexttrack', () => {
                if (playlistActual && indiceActual < playlistActual.length - 1) {
                    let siguienteIndex = indiceActual + 1;
                    reproducirCancion(playlistActual[siguienteIndex], siguienteIndex);
                }
            });
        } 
        
        InfoCancion.innerText = cancion.name;
        indiceActual = index;
    } catch (e) {
        InfoCancion.innerText = "Error de archivo";
    }
    LoadingBox.style.display = "none";
}

Reproductor.addEventListener('ended', () => {
    if (playlistActual && indiceActual < playlistActual.length - 1) {
        let siguienteIndex = indiceActual + 1;
        reproducirCancion(playlistActual[siguienteIndex], siguienteIndex);
    } else {
        InfoCancion.innerText = "The End";
        PlayerBar.style.background = '';
    }
});

I.oninput = (e) => {
    var In = e.target.value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (In === "") { 
        No.style.display = "none"; 
        mostrarGeneros(); 
        return; 
    }

    VistaGeneros.style.display = "none";
    VistaPlaylist.style.display = "none";
    VistaBusqueda.style.display = "block";
    ListaBusqueda.innerHTML = "";
    let coincidencias = false; 

    GEN.forEach((genero, i) => {
        let nomGen = genero.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (nomGen.includes(In)) {
            let li = document.createElement('li');
            li.className = "genre-card";
            li.onclick = () => abrirCarpeta(i);
            li.innerHTML = `<div class="genre-emoji">${genero.logo}</div><div class="genre-name">${genero.name}</div>`;
            ListaBusqueda.appendChild(li);
            coincidencias = true; 
        }

        if (genero.canciones) {
            genero.canciones.forEach((cancion, songIndex) => {
                let nomCan = cancion.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (nomCan.includes(In)) {
                    let li = document.createElement('li');
                    li.className = "song-item";
                    li.style.gridColumn = "span 3"; 
                    li.setAttribute("data-id", cancion.id); 
                    li.innerHTML = `<span class="song-title">🎵 ${cancion.name}</span> <span class="genre-badge">${genero.name}</span>`;
                    li.onclick = () => {
                        playlistActual = genero.canciones;
                        reproducirCancion(cancion, songIndex);
                    };
                    ListaBusqueda.appendChild(li);
                    coincidencias = true; 
                }
            });
        }
    });

    No.style.display = coincidencias ? "none" : "block";
};   

function togglePlay() {
    if (Reproductor.paused) {
        Reproductor.play().catch(() => {});
        video.play().catch(() => {});
    } else {
        Reproductor.pause();
        video.pause();
    }
}
  
Reproductor.onplay = () => {
    BtnPlay.innerText = "⏸️";
    PlayerBar.style.background = 'url(2.gif)';
    InfoCancion.style.color = '#cc4dd6';
}

Reproductor.onpause = () => {
    BtnPlay.innerText = "▶️";
    PlayerBar.style.background = '';
    InfoCancion.style.color = 'gray';
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    let min = Math.floor(seconds / 60);
    let sec = Math.floor(seconds % 60);
    return min + ":" + (sec < 10 ? "0" + sec : sec);
}

Reproductor.ontimeupdate = () => {
    if (!Reproductor.duration) return;
    ProgressBar.max = Reproductor.duration;
    ProgressBar.value = Reproductor.currentTime;
    TimeCurrent.innerText = formatTime(Reproductor.currentTime);
    TimeTotal.innerText = formatTime(Reproductor.duration);
};

function seekAudio() {
    Reproductor.currentTime = ProgressBar.value;
}

async function togglePiP() {
    if (!document.pictureInPictureEnabled) {
        alert("Tu dispositivo no soporta ventanas flotantes.");
        return;
    }
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
   BtnPiP.style.opacity = '1';
        } else {
   if (video.readyState < 2) {
          await video.play();
            }
            await video.requestPictureInPicture();
    BtnPiP.style.opacity = '.5';
        }
    } catch (error) {
        console.log("Error PiP:", error);
        alert("No se pudo activar la ventana flotante.");
    }
}

inicializarSistema();



if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log("Service Worker registrado correctamente"))
      .catch((err) => console.log("Falló el registro del Service Worker", err));
  });
}




