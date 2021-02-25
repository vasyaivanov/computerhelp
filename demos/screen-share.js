// ......................................................
// ......................JD: SCREEN SHARE code................
// ......................................................


document.getElementById('open-screensharing-room').onclick = function() {
    console.log("JD: in document.getElementById('open-screensharing-room').onclick");
    disableInputButtonsScreenShare();
    connection.open(document.getElementById('room-id').value, function() {
        // showRoomURL(connection.sessionid);
    });
};

// document.getElementById('join-room').onclick = function() {
//     disableInputButtonsScreenShare();

//     connection.sdpConstraints.mandatory = {
//         OfferToReceiveAudio: false,
//         OfferToReceiveVideo: true
//     };
//     connection.join(document.getElementById('room-id').value);
// };

// document.getElementById('open-or-join-room').onclick = function() {
//     disableInputButtonsScreenShare();
//     connection.openOrJoin(document.getElementById('room-id').value, function(isRoomExist, roomid) {
//         if (isRoomExist === false && connection.isInitiator === true) {
//             // if room doesn't exist, it means that current user will create the room
//             showRoomURL(roomid);
//         }

//         if(isRoomExist) {
//           connection.sdpConstraints.mandatory = {
//               OfferToReceiveAudio: false,
//               OfferToReceiveVideo: true
//           };
//         }
//     });
// };

// ......................................................
// ..................RTCMultiConnection Code.............
// ......................................................

var connectionScreenShare = new RTCMultiConnection();

// by default, socket.io server is assumed to be deployed on your own URL
connection.socketURL = '/';

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

    connection.videosContainer.appendChild(mediaElement);

    setTimeout(function() {
        mediaElement.media.play();
    }, 5000);

    mediaElement.id = event.streamid;
};

connectionScreenShare.onstreamended = function(event) {
    var mediaElement = document.getElementById(event.streamid);
    if (mediaElement) {
        mediaElement.parentNode.removeChild(mediaElement);

        if(event.userid === connection.sessionid && !connectionScreenShare.isInitiator) {
          alert('Broadcast is ended. We will reload this page to clear the cache.');
          location.reload();
        }
    }
};

connection.onMediaError = function(e) {
    if (e.message === 'Concurrent mic process limit.') {
        if (DetectRTC.audioInputDevices.length <= 1) {
            alert('Please select external microphone. Check github issue number 483.');
            return;
        }

        var secondaryMic = DetectRTC.audioInputDevices[1].deviceId;
        connectionScreenShare.mediaConstraints.audio = {
            deviceId: secondaryMic
        };

        connection.join(connectionScreenShare.sessionid);
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

function showRoomURL(roomid) {
    var roomHashURL = '#' + roomid;
    var roomQueryStringURL = '?roomid=' + roomid;

    var html = '<h2>Unique URL for your room:</h2><br>';

    html += 'Hash URL: <a href="' + roomHashURL + '" target="_blank">' + roomHashURL + '</a>';
    html += '<br>';
    html += 'QueryString URL: <a href="' + roomQueryStringURL + '" target="_blank">' + roomQueryStringURL + '</a>';

    var roomURLsDiv = document.getElementById('room-urls');
    roomURLsDiv.innerHTML = html;

    roomURLsDiv.style.display = 'block';
}

(function() {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;

    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }
    var match, search = window.location.search;
    while (match = r.exec(search.substring(1)))
        params[d(match[1])] = d(match[2]);
    window.params = params;
})();

var roomid = '';
if (localStorage.getItem(connection.socketMessageEvent)) {
    roomid = localStorage.getItem(connectionScreenShare.socketMessageEvent);
} else {
    roomid = connection.token();
}
document.getElementById('room-id').value = roomid;
document.getElementById('room-id').onkeyup = function() {
    localStorage.setItem(connectionScreenShare.socketMessageEvent, document.getElementById('room-id').value);
};

var hashString = location.hash.replace('#', '');
if (hashString.length && hashString.indexOf('comment-') == 0) {
    hashString = '';
}

var roomid = params.roomid;
if (!roomid && hashString.length) {
    roomid = hashString;
}

if (roomid && roomid.length) {
    document.getElementById('room-id').value = roomid;
    localStorage.setItem(connection.socketMessageEvent, roomid);

    // auto-join-room
    (function reCheckRoomPresence() {
        connectionScreenShare.checkPresence(roomid, function(isRoomExist) {
            if (isRoomExist) {
                connection.join(roomid);
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


