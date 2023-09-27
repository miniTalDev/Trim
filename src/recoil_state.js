import { atom, selector } from "recoil";

const videoSrcState = atom({
  key: "videoSrcState",
  default: ""
});

const videoFileState = atom({
  key: "videoFileState",
  default: ""
});

const playerVisibleState = atom({
  key: "playerVisibleState",
  default: false
});

export { videoSrcState, videoFileState, playerVisibleState };