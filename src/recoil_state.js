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

const startLoadingState = atom({
  key: "startLoadingState",
  default: false
});

export { videoSrcState, videoFileState, playerVisibleState, startLoadingState };