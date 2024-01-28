async function create_friend_game(){
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');

    response = await fetch("https://" + document.domain + ':' + location.port + "/register", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: name})
    });
    data = await response.json();
    const {user_id} = data;

    response = await fetch("https://" + document.domain + ':' + location.port + "/create-friend-game", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: user_id})
    });
    data = await response.json();
    const {session_id} = data;
    
    location.href = `?name=${name}&user_id=${user_id}&session_id=${session_id}`;
}

function redirect_to_session(){
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const user_id = urlParams.get('user_id');
    location.href = `/game?name=${name}&user_id=${user_id}`;
}

window.addEventListener("load", (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('user_id')){
        create_friend_game();
    }
    document.getElementById('session_id').innerText = urlParams.get('session_id');
});