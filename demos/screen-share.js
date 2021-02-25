// ......................................................
// ......................JD: SCREEN SHARE code................
// ......................................................


document.getElementById('open-screensharing-room').onclick = function() {
    console.log("JD: in document.getElementById('open-screensharing-room').onclick");
    disableInputButtonsScreenShare();
    connectionScreenShare.open(document.getElementById('room-id').value, function() {
        // showRoomURL(connection.sessionid);
    });
};

// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................

var connectionScreenShare = new RTCMultiConnection();

// by default, socket.io server is assumed to be deployed on your own URL
connectionScreenShare.socketURL = '/';

// comment-out below line if you do not have your own socket.io server
// connectionScreenShare.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';

connectionScreenShare.socketMessageEvent = 'screen-sharing-demo';

connectionScreenShare.session = {
    screen: true,
    oneway: true
};

connectionScreenShare.sdpConstraints.mandatory = {
    OfferToReceiveAudio: false,
    OfferToReceiveVideo: false
};

// https://www.rtcmulticonnection.org/docs/iceServers/
// use your own TURN-server here!
connectionScreenShare.iceServers = [{
    'urls': [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun.l.google.com:19302?transport=udp',
    ]
}];

connectionScreenShare.videosContainer = document.getElementById('videos-container');
connectionScreenShare.onstream = function(event) {
    console.log("JD: in connectionScreenShare.onstream");
    var existing = document.getElementById(event.streamid);
    if(existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    event.mediaElement.removeAttribute('src');
    event.mediaElement.removeAttribute('srcObject');
    event.mediaElement.muted = true;
    event.mediaElement.volume = 0;

    var video = document.createElement('video');

    try {
        video.setAttributeNode(document.createAttribute('autoplay'));
        video.setAttributeNode(document.createAttribute('playsinline'));
    } catch (e) {
        video.setAttribute('autoplay', true);
        video.setAttribute('playsinline', true);
    }

    if(event.type === 'local') {
      video.volume = 0;
      try {
          video.setAttributeNode(document.createAttribute('muted'));
      } catch (e) {
          video.setAttribute('muted', true);
      }
    }
    video.srcObject = event.stream;

    var width = innerWidth - 80;
    var mediaElement = getHTMLMediaElement(video, {
        title: event.userid,
        buttons: ['full-screen'],
        width: width,
        showOnMouseEnter: false
    });

    connectionScreenShare.videosContainer.appendChild(mediaElement);

    setTimeout(function() {
        mediaElement.media.play();
    }, 5000);

    mediaElement.id = event.streamid;
};

connectionScreenShare.onstreamended = function(event) {
    var mediaElement = document.getElementById(event.streamid);
    if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement);

        if(event.userid === connectionScreenShare.sessionid && !connectionScreenShare.isInitiator) {
          alert('Broadcast is ended. We will reload this page to clear the cache.');
          location.reload();
        }
    }
};

connectionScreenShare.onMediaError = function(e) {
    if (e.message === 'Concurrent mic process limit.') {
        if (DetectRTC.audioInputDevices.length <= 1) {
            alert('Please select external microphone. Check github issue number 483.');
            return;
        }

        var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
        connectionScreenShare.mediaConstraints.audio = {
            deviceId: secondaryMic
        };

        connectionScreenShare.join(connectionScreenShare.sessionid);
    }
};

// ..................................
// ALL below scripts are redundant!!!
// ..................................

function disableInputButtonsScreenShare() {
    document.getElementById('room-id').onkeyup();

    // document.getElementById('open-or-join-room').disabled = true;
    document.getElementById('open-screensharing-room').disabled = true;
    // document.getElementById('join-room').disabled = true;
    // document.getElementById('room-id').disabled = true;
}

// ......................................................
// ......................Handling Room-ID................
// ......................................................

function showRoomURL(roomidScreenShare) {
    var roomHashURLScreenShare = '#' + roomidScreenShare;
    var roomQueryStringURL = '?roomidScreenShare=' + roomidScreenShare;

    var html = '<h2>Unique URL for your room:</h2><br>';

    html += 'Hash URL: <a href="' + roomHashURLScreenShare + '" target="_blank">' + roomHashURLScreenShare + '</a>';
    html += '<br>';
    html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';

    var roomURLsDiv = document.getElementById('room-urls');
    roomURLsDiv.innerHTML = html;

    roomURLsDiv.style.display = 'block';
}

var roomidScreenShare = '';
if (localStorage.getItem(connectionScreenShare.socketMessageEvent)) {
    roomidScreenShare = localStorage.getItem(connectionScreenShare.socketMessageEvent);
} else {
    roomidScreenShare = connectionScreenShare.token();
}
document.getElementById('room-id').value = roomidScreenShare;
document.getElementById('room-id').onkeyup = function() {
    localStorage.setItem(connectionScreenShare.socketMessageEvent, document.getElementById('room-id').value);
};

var hashStringScreenShare = location.hash.replace('#', '');
if (hashStringScreenShare.length && hashStringScreenShare.indexOf('comment-') == 0) {
    hashStringScreenShare = '';
}

var roomidScreenShare = params.roomidScreenShare;
if (!roomidScreenShare && hashStringScreenShare.length) {
    roomidScreenShare = hashStringScreenShare;
}

if (roomidScreenShare && roomidScreenShare.length) {
    console.log("JD: in if (roomidScreenShare && roomidScreenShare.length)");
    document.getElementById('room-id').value = roomidScreenShare;
    localStorage.setItem(connectionScreenShare.socketMessageEvent, roomidScreenShare);

    // auto-join-room
    (function reCheckRoomPresence() {
        connectionScreenShare.checkPresence(roomidScreenShare, function(isRoomExist) {
            if (isRoomExist) {
                connectionScreenShare.join(roomidScreenShare);
                return;
            }

            setTimeout(reCheckRoomPresence, 5000);
        });
    })();

    disableInputButtonsScreenShare();
}

// detect 2G
if(navigator.connection &&
   navigator.connection.type === 'cellular' &&
   navigator.connection.downlinkMax <= 0.115) {
  alert('2G is not supported. Please use a better internet service.');
}


