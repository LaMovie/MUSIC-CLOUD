let playlistActual = [];
let indiceActual = 0;

const Reproductor = document.getElementById("Player");
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

// Generar IDs internos automáticamente para que funcione el color Fucsia sin que tú escribas IDs manuales
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

function removerCache() {
    if(confirm("¿Quieres reiniciar la aplicación?")) {
        location.reload(); 
    }
}

function mostrarGeneros() {
    VistaGeneros.style.display = "block";
    VistaPlaylist.style.display = "none";
    VistaBusqueda.style.display = "none";
    I.value = "";
    
    // Ocultar la imagen cuando volvemos al menú principal
    No.style.display = "none"; 
    
    document.getElementById("MainContent").scrollTop = 0; 
}


function abrirCarpeta(indexGenero) {
    let genero = GEN[indexGenero];
    VistaGeneros.style.display = "none";
    VistaBusqueda.style.display = "none";
    VistaPlaylist.style.display = "block";
    
    // AGREGA ESTA LÍNEA para que la nueva lista empiece desde el título
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

// Reproducción Directa (Sin promesas web intermedias, instantáneo)
function reproducirCancion(cancion, index) {
    LoadingBox.style.display = "block";
    marcarCancionActiva(cancion.id);

    try {
       var SONG = cancion.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  Reproductor.src = SONG;
  
  PlayerBar.style.background = 'url(4.gif)';  
        Reproductor.play().catch(error => {
            console.log("Autoplay bloqueado por el dispositivo:", error);
    InfoCancion.innerText = "Toca '▶️' para reproducir";
    BtnPlay.innerText = "▶️";
 PlayerBar.style.background = '';
        });
        
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

// El buscador extrae los datos directamente de tus arrays locales sin lag
I.oninput = (e) => {
    var In = e.target.value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (In === "") { 
        document.getElementById("No").style.display = "none"; // Ocultar si está vacío
        mostrarGeneros(); 
        return; 
    }

    VistaGeneros.style.display = "none";
    VistaPlaylist.style.display = "none";
    VistaBusqueda.style.display = "block";
    ListaBusqueda.innerHTML = "";

    let coincidencias = false; // Variable para saber si encontramos algún resultado

    GEN.forEach((genero, i) => {
        let nomGen = genero.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (nomGen.includes(In)) {
            let li = document.createElement('li');
            li.className = "genre-card";
            li.onclick = () => abrirCarpeta(i);
            li.innerHTML = `<div class="genre-emoji">${genero.logo}</div><div class="genre-name">${genero.name}</div>`;
            ListaBusqueda.appendChild(li);
            coincidencias = true; // Encontró un género coincidente
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
                    coincidencias = true; // Encontró una canción coincidente
                }
            });
        }
    });

    // Al terminar de buscar en toda la lista, decide si muestra o no la imagen
    No.style.display = coincidencias ? "none" : "block";
};   
  

function togglePlay() {
    if (Reproductor.paused) {
        Reproductor.play().catch(() => {});
    } else {
        Reproductor.pause();
    }
}
  
Reproductor.onplay = () => {
   BtnPlay.innerText = "⏸️";
PlayerBar.style.background = 'url(2.gif)';
NowPlayingInfo.style.color = '#cc4dd6';
}
Reproductor.onpause = () => {
     BtnPlay.innerText = "▶️";
PlayerBar.style.background = '';
NowPlayingInfo.style.color = 'gray';
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

// Iniciar cargando la base de datos local
inicializarSistema();



