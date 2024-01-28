const socket = io.connect('wss://' + document.domain + ':' + location.port);
const urlParams = new URLSearchParams(window.location.search);
let waiting_for = 0;
let playing_for = 0;
let status = "loading"
let win_screen_opened = false;

function open_win_screen(){
    document.getElementById("win_screen").classList.add("info-show");
}

function close_win_screen(){
    document.getElementById("win_screen").classList.remove("info-show");
    win_screen_opened = false;
    status = "ready_to_replay";
    playing_for = 0;
}

function pickCamera() {
    location.href = `/pick-camera-device?name=${urlParams.get("name")}&user_id=${urlParams.get("user_id")}`;
}

socket.on('response', function(data) {
    if (data.status == "Error"){
        location.href = `/find-session?name=${urlParams.get("name")}`;
    }

    console.log(`Connected to session ${data.session_id}`, playing_for, status);

    if (data.status == "Čekání na protihráče..."){
        waiting_for += 1;
        if (waiting_for >= 28){
            fetch("https://" + document.domain + ':' + location.port + "/connect-bot", {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({session_id: data.session_id})
            });
            waiting_for = 0;
        }
    }
    if (data.status == "Probíhá hra..."){
        playing_for += 1;
        if (playing_for >= 12){
            status = "submited";
            playing_for = 0;
        }
    }
    if (["Vítěz!", "Poražený", "Remíza"].includes(data.status) && status != "ready_to_replay" && !win_screen_opened){
        win_screen_opened = true;
        open_win_screen();
    }
    
    document.getElementById('players').innerText = `${urlParams.get('name')} vs ${data.opponent}`;
    document.getElementById('game_status').innerText = data.status;
    document.getElementById('gesture_image').innerText = data.gesture_image;

    document.getElementById('win_screen_players').innerText = document.getElementById('players').innerText;
    document.getElementById('win_screen_game_status').innerText = document.getElementById('game_status').innerText;
    document.getElementById('win_screen_gesture_image').innerText = document.getElementById('gesture_image').innerText;
});

function captureAndSendImage() {
    const video = document.querySelector('video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    socket.emit('image', { image: canvas.toDataURL('image/jpeg'), user_id: urlParams.get("user_id"), status: status});
}

function startCamera() {
    navigator.mediaDevices.enumerateDevices()
        .then(function(devices) {
            videoDevices = devices.filter(function(device) {
                return device.kind === 'videoinput';
            });

            if (videoDevices.length <= 0){
                throw new Error('Žádná kamera nenalezena.');
            }
            
            if (urlParams.has('camera')){
                const cameraIDParam = urlParams.get('camera');
                const cameraID = Number(cameraIDParam);

                var chosenCamera = videoDevices[cameraID];
                return navigator.mediaDevices.getUserMedia({ video: { deviceId: chosenCamera.deviceId } });
            }
            else {
                location.href = `/game?name=${urlParams.get("name")}&camera=0&user_id=${urlParams.get("user_id")}`;
            }
        })
        .then(function(stream) {
            const video = document.querySelector('video');
            video.srcObject = stream;
            video.onloadedmetadata = function(e) {
                video.play();
                setInterval(captureAndSendImage, 250); // Snímek každých xxx ms
            };
        })
        .catch(function(err) {
            console.log(err);
        });
}

window.addEventListener("load", (event) => {
    if (urlParams.has("user_id")){
        startCamera();
    }
    else {
        location.href = `/find-session?name=${urlParams.get("name")}`;
    }
});