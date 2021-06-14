var connection = new WebSocket('wss://exposys-video-chatting.herokuapp.com/');

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
function timestamp(){
var today = new Date();
var time = monthNames[today.getMonth()]+"-"+today.getDate() +" "+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
return time;
}
connection.onopen = function() {
  console.log("connected to server");
}


var call_status = document.querySelector(".call-hang-status");
var name_input_box = document.querySelector(".name-input-box");
var options = document.querySelector(".options");
connection.onmessage = function(msg) {
  var data = JSON.parse(msg.data);
  switch (data.type) {
    case "login":
      loginProcess(data.success);
      break;
    case "offer":

      call_status.innerHTML = ' <div class="card " style="background-color:black;"> <div class="user-name" style="text-align:center"> USER_NAME </div> <div class="user-calling-status" style="text-align:center; padding-top:20px">Calling...</div> <div class="calling-action"> <div class="call-accept"><i class="fas fa-phone-square-alt fa-3x" style="color:green;"></i></div> <div class="call-reject"><i class="fas fa-phone-slash fa-2x" ></i></div> </div> </div>';
      options.style.backgroundColor = "black";
      options.innerHTML = ' <div class="record-action"> <span class="material-icons-round video-btn" style="font-size:3rem;color:white">videocam</span> <span class="material-icons-round mic-btn" style="font-size:3rem;color:white">mic</span> <span class="material-icons-round call-cancel" style="font-size:3rem;color:red">call</span> <span class="material-icons record-btn" style="font-size:3rem;color:white">radio_button_checked</span> <span class="material-icons download-rec-btn" style="font-size:3rem;color:white">download_for_offline</span> </div>'
      var recordButton = document.querySelector('.record-btn');
      var downloadButton = document.querySelector('.download-rec-btn');
      recordButton.addEventListener("click", () => {
          if (recordButton.innerText === 'radio_button_checked') {
              startRecording();
          } else {
              stopRecording();
              recordButton.textContent = 'radio_button_checked';
              downloadButton.disabled = false;
          }
      })
      downloadButton.addEventListener("click", () => {
          const blob = new Blob(recordedBlobs, {
              type: 'video/webm'
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'webrtc_record.webm';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
          }, 100);

      })

      function handleDataAvailable(event) {
          if (event.data && event.data.size > 0) {
              recordedBlobs.push(event.data)
          }
      }

      function startRecording() {
          recordedBlobs = []
          let options = {
              mimeType: 'video/webm;codecs=vp9,opus'
          }
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              console.error(`${options.mimeType} is not supported`);
              options = {
                  mimeType: 'video/webm;codecs=vp8,opus'
              }
              if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                  console.error(`${options.mimeType} is not supported`);
                  options = {
                      mimeType: 'video/webm'
                  }
                  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                      console.error(`${options.mimeType} is not supported`);
                      options = {
                          mimeType: ''
                      }
                  }
              }
          }
          try {
              mediaRecorder = new MediaRecorder(window.stream, options);
          } catch (e) {
              console.error('MediaRecorder error:', e);
          }
          mediaRecorder.start();
          recordButton.textContent = 'stop';
          downloadButton.disabled = true;
          mediaRecorder.ondataavailable = handleDataAvailable;
      }
      function stopRecording() {
          mediaRecorder.stop();
      }

      var call_accept = document.querySelector(".call-accept");
      var call_reject = document.querySelector(".call-reject");

      call_accept.addEventListener("click", function() {
        acceptCall(data.name);
        offerProcess(data.offer, data.name);
        call_status.innerHTML = '';
        name_input_box.innerHTML='';

        var video_toggle = document.querySelector(".video-btn");
        var audio_toggle = document.querySelector(".mic-btn");

        video_toggle.onclick = function() {
          stream.getVideoTracks()[0].enable = !(stream.getVideoTracks()[0].enabled);
          if (video_toggle.innerText === 'videocam') {
            video_toggle.innerText = 'videocam_off';
          } else {
            video_toggle.innerText = 'videocam';
          }
        }

        audio_toggle.onclick = function() {
          stream.getAudioTracks()[0].enable = !(stream.getAudioTracks()[0].enabled);
          if (audio_toggle.innerText === 'mic') {
            audio_toggle.innerText = 'mic_off';
          } else {
            audio_toggle.innerText = 'mic';
          }
        }
        hangup();

      })
      call_reject.addEventListener("click", function() {
        alert("you have Rejected the call");
        call_status.innerHTML = '';
        options.style.backgroundColor = "transparent";
        options.innerHTML = '';
        rejectedCall(data.name);
      })
        break;
    case "answer":
      answerProcess(data.answer);
      break;
    case "candidate":
      candidateProcess(data.candidate);
      break;
    case "reject":
      rejectProcess();
      break;
    case "accept":
      acceptProcess();
      break;
    case "leave":
        leaveProcess();
      break;
    default:
      break;
  }
}


connection.onerror = function(err) {
  console.log(err)
}


var name;
var myConn;
var datachannel;
var url_string = window.location.href;
var url = new URL(url_string);
var username = url.searchParams.get("username");
var connected_user;
var local_video = document.querySelector(".ourvideo");
var remote_video = document.querySelector(".peervideo");
var call_button = document.querySelector("#call-button");
var call_to = document.querySelector("#username-input");
var chat_area = document.querySelector(".msg-page");

call_button.addEventListener("click", function() {

  var call_to_value = call_to.value;

  call_status.innerHTML = ' <div class="card " style="background-color:black;"> <div class="user-name" style="text-align:center"> USER_NAME </div> <div class="user-calling-status" style="text-align:center; padding-top:20px">Calling...</div> <div class="calling-action"> <div class="call-reject"><i class="fas fa-phone-slash fa-2x" ></i></div> </div> </div>';
  options.style.backgroundColor = "black";
  options.innerHTML = ' <div class="record-action"> <span class="material-icons-round video-btn" style="font-size:3rem;color:white">videocam</span> <span class="material-icons-round mic-btn" style="font-size:3rem;color:white">mic</span> <span class="material-icons-round call-cancel" style="font-size:3rem;color:red">call</span> <span class="material-icons record-btn" style="font-size:3rem;color:white">radio_button_checked</span> <span class="material-icons download-rec-btn" style="font-size:3rem;color:white">download_for_offline</span> </div>';
  var recordButton = document.querySelector('.record-btn');
  var downloadButton = document.querySelector('.download-rec-btn');
  recordButton.addEventListener("click", () => {
      if (recordButton.innerText === 'radio_button_checked') {
          startRecording();
      } else {
          stopRecording();
          recordButton.textContent = 'radio_button_checked';
          downloadButton.disabled = false;
      }
  })
  downloadButton.addEventListener("click", () => {
      const blob = new Blob(recordedBlobs, {
          type: 'video/webm'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'webrtc_record.webm';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      }, 100);

  })

  function handleDataAvailable(event) {
      if (event.data && event.data.size > 0) {
          recordedBlobs.push(event.data)
      }
  }

  function startRecording() {
      recordedBlobs = []
      let options = {
          mimeType: 'video/webm;codecs=vp9,opus'
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.error(`${options.mimeType} is not supported`);
          options = {
              mimeType: 'video/webm;codecs=vp8,opus'
          }
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              console.error(`${options.mimeType} is not supported`);
              options = {
                  mimeType: 'video/webm'
              }
              if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                  console.error(`${options.mimeType} is not supported`);
                  options = {
                      mimeType: ''
                  }
              }
          }
      }
      try {
          mediaRecorder = new MediaRecorder(window.stream, options);
      } catch (e) {
          console.error('MediaRecorder error:', e);
      }
      mediaRecorder.start();
      recordButton.textContent = 'stop';
      downloadButton.disabled = true;
      mediaRecorder.ondataavailable = handleDataAvailable;
  }
  function stopRecording() {
      mediaRecorder.stop();
  }


  var call_reject = document.querySelector(".call-reject");
  call_reject.addEventListener("click", function() {
    alert("you have Rejected the call");
    call_status.innerHTML = '';
    options.innerHTML = '';
    options.style.backgroundColor = "transparent";
    rejectedCall(call_to_value);
  })
  if (call_to_value.length > 0) {
    connected_user = call_to_value;

    myConn.createOffer(function(offer) {
      send({
        type: "offer",
        offer: offer
      })
      myConn.setLocalDescription(offer)
    }, function(err) {
      alert("offer has not been created");
    })
  }
})



function loginProcess(success) {
  if (success === false) {
    alert("try a different name")
  } else {
    navigator.getUserMedia({
      video: true,
      audio: true,
    }, function(myStream) {
      stream = myStream;
      local_video.srcObject = stream;
      var configuration = {
        "iceServers": [{
          "urls": "stun:stun2.1.google.com:19302",
        }]
      }
      myConn = new webkitRTCPeerConnection(configuration, {
        optional: [{
          RtpDataChannels: true
        }]
      });
      myConn.ondatachannel = function (event) {
                var receiveChannel = event.channel;
                receiveChannel.onmessage = function (event) {
                chat_area.innerHTML += '<div class="received-chats"> <div class="received-msg"> <div class="recieved-msg-inbox"> <p>'+event.data+'</p> <span class="time">'+timestamp()+' </span> </div> </div> </div>';
                console.log("ondatachannel message:", event.data);
            };
        };

        openDataChannel();
        console.log("DataChannel Opened..");

      for (const track of stream.getTracks()) {
        myConn.addTrack(track, stream);
      }
      myConn.ontrack = e => {
        remote_video.srcObject = e.streams[0];

        var video_toggle = document.querySelector(".video-btn");
        var audio_toggle = document.querySelector(".mic-btn");

        video_toggle.onclick = function() {
          stream.getVideoTracks()[0].enable = !(stream.getVideoTracks()[0].enabled);
          if (video_toggle.innerText === 'videocam') {
            video_toggle.innerText = 'videocam_off';
          } else {
            video_toggle.innerText = 'videocam';
          }
        }

        audio_toggle.onclick = function() {
          stream.getAudioTracks()[0].enable = !(stream.getAudioTracks()[0].enabled);
          if (audio_toggle.innerText === 'mic') {
            audio_toggle.innerText = 'mic_off';
          } else {
            audio_toggle.innerText = 'mic';
          }
        }
        hangup();
        // console.log("oikjhg");
      }
      //
      // myConn.onaddstream = function (e) {
      //     remote_video.srcObject = e.stream;
      // }
      myConn.onicecandidate = function(event) {
        console.log("ice set");
        if (event.candidate) {
          send({
            type: "candidate",
            candidate: event.candidate
          })
        }
      }

    }, function(error) {
      console.log(error);
    });
  }
}

function openDataChannel(){
  datachannel = myConn.createDataChannel("channel1",{
    reliable:true
  });
  datachannel.onerror = function(error){
    console.log("error:",error);
  }
  datachannel.onmessage = function(msg){
    console.log(msg);
    // chat_area.innerHTML += '<div class="received-chats"> <div class="received-msg"> <div class="recieved-msg-inbox"> <p>'+msg.data+'</p> <span class="time">11.20 AM |october 12 </span> </div> </div> </div>';
  }
  datachannel.onclose = function(){
    console.log("data channel is closed");
    window.location.replace("http://"+window.location.hostname+":"+window.location.port+"/");
  }

}

function offerProcess(offer, name) {
  connected_user = name;
  myConn.setRemoteDescription(new RTCSessionDescription(offer));
  // alert(name);
  myConn.createAnswer(function(answer) {
    myConn.setLocalDescription(answer);
    send({
      type: "answer",
      answer: answer
    })
  }, function(error) {
    alert("answer not created")
  })
}



function answerProcess(answer) {
  myConn.setRemoteDescription(new RTCSessionDescription(answer));
}

function candidateProcess(candidate) {
  myConn.addIceCandidate(new RTCIceCandidate(candidate));
}

function rejectProcess() {
  call_status.innerHTML = '';
  options.innerHTML = '';
  options.style.backgroundColor = 'transparent';
}

function acceptProcess() {
  call_status.innerHTML = '';
  name_input_box.innerHTML='';
}

function rejectedCall(rejected_caller_or_calle) {
  send({
    type: "reject",
    name: rejected_caller_or_calle
  })
}

function acceptCall(callee_name) {
  send({
    type: "accept",
    name: callee_name
  })
}

function hangup(){
  var call_cancel = document.querySelector(".call-cancel");
  call_cancel.addEventListener("click",function(){
    options.innerHTML = '';
    options.style.backgroundColor = "transparent";
    send({
      type:"leave"
    })
      leaveProcess();

  })

}

function leaveProcess(){
  console.log("left");
  options.innerHTML = '';
  options.style.backgroundColor = "transparent";
  remote_video.src = null;
  myConn.close();
  myConn.onicecandidate =null;
  myConn.ontrack=null;
  connected_user = null;
  window.location.replace("http://"+window.location.hostname+":"+window.location.port+"/");
}
var msg_input = document.querySelector(".msg-input");
var send_btn = document.querySelector(".send-btn");

send_btn.addEventListener("click",function(){
  var msg_value = msg_input.value;
  chat_area.innerHTML += ' <div class="outgoing-chats"> <div class="outgoing-chats-msg"> <p>'+msg_value+'</p> <span class="time">'+timestamp()+'</span> </div> </div>';
  datachannel.send(msg_value);
    msg_input.value="";
})

setTimeout(function() {
  if (connection.readyState === 1) {
    if (username != null) {
      name = username;
      if (name.length > 1) {
        send({
          type: "login",
          name: name
        })
      }
    }
  } else {
    console.log("took too much time")
  }
},6000)




function send(message) {
  if (connected_user) {
    message.name = connected_user;
  }
  connection.send(JSON.stringify(message))
}
