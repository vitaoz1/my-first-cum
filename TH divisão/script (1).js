const NOTE_N_C2 = 16;
const NOTE_N_C3 = 28;
const NOTE_N_CS3 = 29;
const NOTE_N_D3 = 30;
const NOTE_N_DS3 = 31;
const NOTE_N_E3 = 32;
const NOTE_N_F3 = 33;
const NOTE_N_FS3 = 34;
const NOTE_N_G3 = 35;
const NOTE_N_GS3 = 36;
const NOTE_N_A3 = 37;
const NOTE_N_AS3 = 38;
const NOTE_N_B3 = 39;
const ALL_NOTES = [
  NOTE_N_C3,
  NOTE_N_CS3,
  NOTE_N_D3,
  NOTE_N_DS3,
  NOTE_N_E3,
  NOTE_N_F3,
  NOTE_N_FS3,
  NOTE_N_G3,
  NOTE_N_GS3,
  NOTE_N_A3,
  NOTE_N_AS3,
  NOTE_N_B3
];
const ALL_NOTES_KEYS = [
  "a",
  "w",
  "s",
  "e",
  "d",
  "f",
  "t",
  "g",
  "y",
  "h",
  "u",
  "j"
];

const CSS_KEY_PRESSED = "key-pressed";
const MIN_OCTAVE = 0;
const MAX_OCTAVE = 8;

const NOTE_LETTERS = [
  "c",
  "c#",
  "d",
  "d#",
  "e",
  "f",
  "f#",
  "g",
  "g#",
  "a",
  "a#",
  "b"
];
const get_piano_freq_n = (n) => Math.pow(2, (n - 49) / 12) * 440;
const get_piano_note_label = (n) => {
  const octave = 2 + Math.floor((n - NOTE_N_C2) / 12);
  // add a large multiple of 12 to avoid negatives
  const key_in_octave = (12 * 10 + n - NOTE_N_C2) % 12;
  // console.log("n", n, "octave", octave, key_in_octave);
  return `${NOTE_LETTERS[key_in_octave]}${octave}`;
};

const get_synthetic_key_event = (key, event_type = "keydown") => {
  return new KeyboardEvent(event_type, { key });
  // const keyboardEvent = document.createEvent("KeyboardEvent");
  // const initMethod =
  //   typeof keyboardEvent.initKeyboardEvent !== "undefined"
  //     ? "initKeyboardEvent"
  //     : "initKeyEvent";
  // keyboardEvent[initMethod](
  //   event_type, // event type: keydown, keyup, keypress
  //   true, // bubbles
  //   true, // cancelable
  //   window, // view: should be window
  //   false, // ctrlKey
  //   false, // altKey
  //   false, // shiftKey
  //   false, // metaKey
  //   40, // keyCode: unsigned long - the virtual key code, else 0
  //   0 // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
  // );
  // return keyboardEvent;
};

const start = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  const button_start = document.querySelector("#button-start");
  button_start.disabled = true;
  const piano_keys = document.querySelector("#piano-keys");
  const button_play_track = document.querySelector("#button-play-track");
  button_play_track.disabled = false;
  const input_octave = document.querySelector("#input-octave");
  input_octave.disabled = false;
  const input_note_length = document.querySelector("#input-note-length");
  input_note_length.disabled = false;
  const key_c3 = document.querySelector("#key-c3");
  const key_cs3 = document.querySelector("#key-cs3");
  const key_d3 = document.querySelector("#key-d3");
  const key_ds3 = document.querySelector("#key-ds3");
  const key_e3 = document.querySelector("#key-e3");
  const key_f3 = document.querySelector("#key-f3");
  const key_fs3 = document.querySelector("#key-fs3");
  const key_g3 = document.querySelector("#key-g3");
  const key_gs3 = document.querySelector("#key-gs3");
  const key_a3 = document.querySelector("#key-a3");
  const key_as3 = document.querySelector("#key-as3");
  const key_b3 = document.querySelector("#key-b3");
  const input_volume = document.querySelector("#input-volume");
  input_volume.disabled = false;

  const all_key_elems = [
    key_c3,
    key_cs3,
    key_d3,
    key_ds3,
    key_e3,
    key_f3,
    key_fs3,
    key_g3,
    key_gs3,
    key_a3,
    key_as3,
    key_b3
  ];

  const oscillator = audioCtx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
  oscillator.start();

  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const updateVolume = () => {
    const v = parseFloat(input_volume.value);
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    if (v === 0) {
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.01);
      return;
    }
    gainNode.gain.exponentialRampToValueAtTime(v, audioCtx.currentTime + 0.01);
  };
  updateVolume();
  input_volume.addEventListener("change", updateVolume);
  let NOTE_LENGTH = 4;
  const updateNoteLength = () => {
    const v = parseFloat(input_note_length.value);
    NOTE_LENGTH = v;
    console.log("new NOTE_LENGTH", NOTE_LENGTH);
  };
  updateNoteLength();
  input_note_length.addEventListener("change", updateNoteLength);

  let current_octave = 4;
  const updateOctave = () => {
    const v = parseInt(input_octave.value, 10);
    console.log("new octave", v);
    current_octave = v;
  };
  updateOctave();
  input_octave.addEventListener("change", updateOctave);

  let last_key = "";
  document.body.addEventListener("keyup", (event) => {
    console.log("keyup", event.key);
    last_key = "";
    all_key_elems.forEach((e) => e.classList.remove(CSS_KEY_PRESSED));
    // https://stackoverflow.com/questions/71460284/web-audio-api-clicks-crackles-pops-distortion-noise-elimination-can-i-d
    // "Exponential ramps can't end at 0. Therefore there is still a tiny risk for glitches. You could avoid that by adding another linear ramp at the end. But I guess it's not necessary."
    // gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 4);
  });
  const fade_out = (cancel = true) => {
    console.log("fade out NOTE_LENGTH", NOTE_LENGTH);
    if (cancel) gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + NOTE_LENGTH
    );
  };
  const play_note = (note) => {
    const OCTAVE_OFFSET = (current_octave - 3) * 12;
    const idx = (12 * 10 + note - NOTE_N_C3) % 12;
    all_key_elems[idx].classList.add(CSS_KEY_PRESSED);
    oscillator.frequency.setValueAtTime(
      get_piano_freq_n(note + OCTAVE_OFFSET),
      audioCtx.currentTime
    );
    updateVolume();
    fade_out(false);
  };
  document.body.addEventListener("keydown", (event) => {
    console.log("keydown", event.key);
    if (last_key === event.key) return;
    last_key = event.key;
    switch (event.key) {
      case "q": {
        if (current_octave < MAX_OCTAVE) current_octave++;
        input_octave.value = current_octave;
        break;
      }
      case "z": {
        if (current_octave > MIN_OCTAVE) current_octave--;
        input_octave.value = current_octave;
        break;
      }
      case "a": {
        play_note(NOTE_N_C3);
        break;
      }
      case "w": {
        play_note(NOTE_N_CS3);
        break;
      }
      case "s": {
        play_note(NOTE_N_D3);
        break;
      }
      case "e": {
        play_note(NOTE_N_DS3);
        break;
      }
      case "d": {
        play_note(NOTE_N_E3);
        break;
      }
      case "f": {
        play_note(NOTE_N_F3);
        break;
      }
      case "t": {
        play_note(NOTE_N_FS3);
        break;
      }
      case "g": {
        play_note(NOTE_N_G3);
        break;
      }
      case "y": {
        play_note(NOTE_N_GS3);
        break;
      }
      case "h": {
        play_note(NOTE_N_A3);
        break;
      }
      case "u": {
        play_note(NOTE_N_AS3);
        break;
      }
      case "j": {
        play_note(NOTE_N_B3);
        break;
      }
      default: {
        console.log("default branch");
        break;
      }
    }
  });
  all_key_elems.forEach((e, i) => {
    e.addEventListener("mousedown", () => {
      document.body.dispatchEvent(get_synthetic_key_event(ALL_NOTES_KEYS[i]));
    });
    e.addEventListener("mouseup", () => {
      document.body.dispatchEvent(
        get_synthetic_key_event(ALL_NOTES_KEYS[i], "keyup")
      );
    });
  });

  let playing = false;
  // super mario theme, notes list courtsey of https://youtu.be/OzNhUtHutIg
  const track = [
    [{ note: 4, octave: 4 }],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 0, octave: 4 }],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 7, octave: 4 }],
    [],
    [],
    [],
    [{ note: 7, octave: 3 }],
    [],
    [],
    [],
    [{ note: 0, octave: 4 }],
    [],
    [],
    [{ note: 7, octave: 3 }],
    [],
    [],
    [{ note: 4, octave: 3 }],
    [],
    [],
    [{ note: 9, octave: 3 }],
    [],
    [{ note: 11, octave: 3 }],
    [],
    [{ note: 10, octave: 3 }],
    [{ note: 9, octave: 3 }],
    [],
    [{ note: 7, octave: 3 }],
    [{ note: 4, octave: 4 }],
    [{ note: 7, octave: 4 }],
    [{ note: 9, octave: 4 }],
    [],
    [{ note: 5, octave: 4 }],
    [{ note: 7, octave: 4 }],
    [],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 0, octave: 4 }],
    [{ note: 2, octave: 4 }],
    [{ note: 11, octave: 3 }],
    [],
    [],
    [{ note: 0, octave: 4 }],
    [],
    [],
    [{ note: 7, octave: 3 }],
    [],
    [],
    [{ note: 4, octave: 3 }],
    [],
    [],
    [{ note: 9, octave: 3 }],
    [],
    [{ note: 11, octave: 3 }],
    [],
    [{ note: 10, octave: 3 }],
    [{ note: 9, octave: 3 }],
    [],
    [{ note: 7, octave: 3 }],
    [{ note: 4, octave: 4 }],
    [{ note: 7, octave: 4 }],
    [{ note: 9, octave: 4 }],
    [],
    [{ note: 5, octave: 4 }],
    [{ note: 7, octave: 4 }],
    [],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 0, octave: 4 }],
    [{ note: 2, octave: 4 }],
    [{ note: 11, octave: 3 }],
    [],
    [],
    [],
    [],
    [{ note: 7, octave: 4 }],
    [{ note: 6, octave: 4 }],
    [{ note: 5, octave: 4 }],
    [{ note: 3, octave: 4 }],
    [],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 8, octave: 3 }],
    [{ note: 9, octave: 3 }],
    [{ note: 0, octave: 4 }],
    [],
    [{ note: 9, octave: 3 }],
    [{ note: 0, octave: 4 }],
    [{ note: 2, octave: 4 }],
    [],
    [],
    [{ note: 7, octave: 4 }],
    [{ note: 6, octave: 4 }],
    [{ note: 5, octave: 4 }],
    [{ note: 3, octave: 4 }],
    [],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 0, octave: 5 }],
    [],
    [{ note: 0, octave: 5 }],
    [{ note: 0, octave: 5 }],
    [],
    [],
    [],
    [],
    [{ note: 7, octave: 4 }],
    [{ note: 6, octave: 4 }],
    [{ note: 5, octave: 4 }],
    [{ note: 3, octave: 4 }],
    [],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 8, octave: 3 }],
    [{ note: 9, octave: 3 }],
    [{ note: 0, octave: 4 }],
    [],
    [{ note: 9, octave: 3 }],
    [{ note: 0, octave: 4 }],
    [{ note: 2, octave: 4 }],
    [],
    [],
    [{ note: 3, octave: 4 }],
    [],
    [],
    [{ note: 2, octave: 4 }],
    [],
    [],
    [{ note: 0, octave: 4 }],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [{ note: 7, octave: 4 }],
    [{ note: 6, octave: 4 }],
    [{ note: 5, octave: 4 }],
    [{ note: 3, octave: 4 }],
    [],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 8, octave: 3 }],
    [{ note: 9, octave: 3 }],
    [{ note: 0, octave: 4 }],
    [],
    [{ note: 9, octave: 3 }],
    [{ note: 0, octave: 4 }],
    [{ note: 2, octave: 4 }],
    [],
    [],
    [{ note: 7, octave: 4 }],
    [{ note: 6, octave: 4 }],
    [{ note: 5, octave: 4 }],
    [{ note: 3, octave: 4 }],
    [],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 0, octave: 5 }],
    [],
    [{ note: 0, octave: 5 }],
    [{ note: 0, octave: 5 }],
    [],
    [],
    [],
    [],
    [{ note: 7, octave: 4 }],
    [{ note: 6, octave: 4 }],
    [{ note: 5, octave: 4 }],
    [{ note: 3, octave: 4 }],
    [],
    [{ note: 4, octave: 4 }],
    [],
    [{ note: 8, octave: 3 }],
    [{ note: 9, octave: 3 }],
    [{ note: 0, octave: 4 }],
    [],
    [{ note: 9, octave: 3 }],
    [{ note: 0, octave: 4 }],
    [{ note: 2, octave: 4 }],
    [],
    [],
    [{ note: 3, octave: 4 }],
    [],
    [],
    [{ note: 2, octave: 4 }],
    [],
    [],
    [{ note: 0, octave: 4 }]
  ];
  let trackIdx = 0;

  const playTrackStep = () => {
    if (trackIdx > 0) {
      const lastT = track[trackIdx - 1];
      lastT.forEach((last) => {
        document.body.dispatchEvent(
          get_synthetic_key_event(ALL_NOTES_KEYS[last.note], "keyup")
        );
      });
    }
    if (trackIdx >= track.length) {
      playing = false;
      trackIdx = 0;
      button_play_track.disabled = false;
      return;
    }
    setTimeout(playTrackStep, 200);
    const currT = track[trackIdx];
    currT.forEach((curr) => {
      current_octave = curr.octave;
      input_octave.value = current_octave;
      document.body.dispatchEvent(
        get_synthetic_key_event(ALL_NOTES_KEYS[curr.note])
      );
    });
    trackIdx++;
  };
  button_play_track.addEventListener("click", () => {
    if (playing) return;
    playing = true;
    button_play_track.disabled = true;
    setTimeout(playTrackStep, 1);
  });
  // setTimeout(() => {
  //   document.body.dispatchEvent(
  //     get_synthetic_key_event(ALL_NOTES_KEYS[i], "keyup")
  //   );
  // }, 10);
  // play_note(ALL_NOTES[i]);
  // })
  // );
};

const main = () => {
  document.querySelector("#button-start").addEventListener("click", start);
};

main();