/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import { UserAgent } from "../src/api";
import { SimpleUser, SimpleUserDelegate, SimpleUserOptions } from "../src/platform/web";
import { getAudio, getButton, getButtons, getInput, getSpan } from "./demo-utils";

const serverSpan = getSpan("server");
const targetSpan = getSpan("target");
const connectButton = getButton("connect");
const callButton = getButton("call");
const hangupButton = getButton("hangup");
const disconnectButton = getButton("disconnect");
const audioElement = getAudio("remoteAudio");
const keypad = getButtons("keypad");
const dtmfSpan = getSpan("dtmf");
const holdCheckbox = getInput("hold");
const muteCheckbox = getInput("mute");

// Local server
// const serverPort = '8089';
// const serverDomainName = 'pbx.example.com';
// const webSocketServer = `wss://${serverDomainName}:${serverPort}/ws`;

// // WebSocket Server URL
// const serverDomainName = 'captain-eye.onsip.com';
// const webSocketServer = `wss://edge.sip.onsip.com`;

const serverDomainName = 'pbx.captain-eye.com';
const webSocketServer = `wss://${serverDomainName}/ws`;
serverSpan.innerHTML = webSocketServer;

const username = 'fleet_2';
const password = 'fleet_2';
const userAor = `sip:${username}@${serverDomainName}`;
const userURI = UserAgent.makeURI(userAor);
console.log("🚀 ~ file: demo-1.ts ~ line 31 ~ userURI", userURI);

// Destination URI
const targetUsername = 'fleet_1';
const target = `sip:${targetUsername}@${serverDomainName}`;
targetSpan.innerHTML = target;

// Name for demo user
const displayName = "Yehonatan";

// SimpleUser delegate
const simpleUserDelegate: SimpleUserDelegate = {
  onCallCreated: (): void => {
    console.log(`[${displayName}] Call created`);
    callButton.disabled = true;
    hangupButton.disabled = false;
    keypadDisabled(true);
    holdCheckboxDisabled(true);
    muteCheckboxDisabled(true);
  },
  onCallAnswered: (): void => {
    alert(`[${displayName}] Call answered`);
    keypadDisabled(false);
    holdCheckboxDisabled(false);
    muteCheckboxDisabled(false);
  },
  onCallHangup: (): void => {
    console.log(`[${displayName}] Call hangup`);
    callButton.disabled = false;
    hangupButton.disabled = true;
    keypadDisabled(true);
    holdCheckboxDisabled(true);
    muteCheckboxDisabled(true);
  },
  onCallHold: (held: boolean): void => {
    console.log(`[${displayName}] Call hold ${held}`);
    holdCheckbox.checked = held;
  },
  onCallReceived: () => {
    if (confirm(`📞️ Incoming call... accept?`)) {
      simpleUser.answer()
    }
    else {
      simpleUser.decline()
    }
    
  }
};
// SimpleUser options
const simpleUserOptions: SimpleUserOptions = {
  delegate: simpleUserDelegate,
  media: {
    remote: {
      audio: audioElement
    }
  },
  userAgentOptions: {
    authorizationUsername: username,
    authorizationPassword: password,
    uri: userURI,
    displayName,
  }
};

// SimpleUser construction
const simpleUser = new SimpleUser(webSocketServer, simpleUserOptions);
console.log(simpleUser)
simpleUser.connect().then(() => console.log("connected!"))

// Add click listener to connect button
connectButton.addEventListener("click", () => {
  connectButton.disabled = true;
  disconnectButton.disabled = true;
  callButton.disabled = true;
  hangupButton.disabled = true;
  simpleUser
    .connect()
    .then(() => {
      connectButton.disabled = true;
      disconnectButton.disabled = false;
      callButton.disabled = false;
      hangupButton.disabled = true;
    })
    .catch((error: Error) => {
      connectButton.disabled = false;
      console.error(`[${simpleUser.id}] failed to connect`);
      console.error(error);
      alert("Failed to connect.\n" + error);
    });
});

// Add click listener to call button
callButton.addEventListener("click", () => {
  callButton.disabled = true;
  hangupButton.disabled = true;
  simpleUser
    .call(target, {
      inviteWithoutSdp: false,
    })
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to place call`);
      console.error(error);
      alert("Failed to place call.\n" + error);
    });
});

// Add click listener to hangup button
hangupButton.addEventListener("click", () => {
  callButton.disabled = true;
  hangupButton.disabled = true;
  simpleUser.hangup().catch((error: Error) => {
    console.error(`[${simpleUser.id}] failed to hangup call`);
    console.error(error);
    alert("Failed to hangup call.\n" + error);
  });
});

// Add click listener to disconnect button
disconnectButton.addEventListener("click", () => {
  connectButton.disabled = true;
  disconnectButton.disabled = true;
  callButton.disabled = true;
  hangupButton.disabled = true;
  simpleUser
    .disconnect()
    .then(() => {
      connectButton.disabled = false;
      disconnectButton.disabled = true;
      callButton.disabled = true;
      hangupButton.disabled = true;
    })
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to disconnect`);
      console.error(error);
      alert("Failed to disconnect.\n" + error);
    });
});

// Add click listeners to keypad buttons
keypad.forEach((button) => {
  button.addEventListener("click", () => {
    const tone = button.textContent;
    if (tone) {
      simpleUser.sendDTMF(tone).then(() => {
        dtmfSpan.innerHTML += tone;
      });
    }
  });
});

// Keypad helper function
const keypadDisabled = (disabled: boolean): void => {
  keypad.forEach((button) => (button.disabled = disabled));
  dtmfSpan.innerHTML = "";
};

// Add change listener to hold checkbox
holdCheckbox.addEventListener("change", () => {
  if (holdCheckbox.checked) {
    // Checkbox is checked..
    simpleUser.hold().catch((error: Error) => {
      holdCheckbox.checked = false;
      console.error(`[${simpleUser.id}] failed to hold call`);
      console.error(error);
      alert("Failed to hold call.\n" + error);
    });
  } else {
    // Checkbox is not checked..
    simpleUser.unhold().catch((error: Error) => {
      holdCheckbox.checked = true;
      console.error(`[${simpleUser.id}] failed to unhold call`);
      console.error(error);
      alert("Failed to unhold call.\n" + error);
    });
  }
});

// Hold helper function
const holdCheckboxDisabled = (disabled: boolean): void => {
  holdCheckbox.checked = false;
  holdCheckbox.disabled = disabled;
};

// Add change listener to mute checkbox
muteCheckbox.addEventListener("change", () => {
  if (muteCheckbox.checked) {
    // Checkbox is checked..
    simpleUser.mute();
    if (simpleUser.isMuted() === false) {
      muteCheckbox.checked = false;
      console.error(`[${simpleUser.id}] failed to mute call`);
      alert("Failed to mute call.\n");
    }
  } else {
    // Checkbox is not checked..
    simpleUser.unmute();
    if (simpleUser.isMuted() === true) {
      muteCheckbox.checked = true;
      console.error(`[${simpleUser.id}] failed to unmute call`);
      alert("Failed to unmute call.\n");
    }
  }
});

// Mute helper function
const muteCheckboxDisabled = (disabled: boolean): void => {
  muteCheckbox.checked = false;
  muteCheckbox.disabled = disabled;
};

// Enable the connect button
connectButton.disabled = false;
