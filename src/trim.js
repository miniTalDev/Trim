import React, { useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil'
import Nouislider from 'nouislider-react';
import 'nouislider/distribute/nouislider.css';
import Upload from './components/upload';
import Logo from './components/logo';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { videoSrcState, videoFileState, playerVisibleState } from './recoil_state';
import './App.css';


let ffmpeg; //Store the ffmpeg instance
function Trim() {
    const [videoDuration, setVideoDuration] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [videoSrc, setVideoSrc] = useRecoilState(videoSrcState);
    const [videoFileValue, setVideoFileValue] = useRecoilState(videoFileState);
    const [isPlayerVisible, setPlayerVisible] = useRecoilState(playerVisibleState);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [videoTrimmedUrl, setVideoTrimmedUrl] = useState('');
    const [audioTrimmedUrl, setaudioTrimmedUrl] = useState('');
    const [result, setResult] = useState(Object);
    const [resultVisible, setResultVisible] = useState(false)
    const videoRef = useRef();
    let initialSliderValue = 0;

    const handleuploadClick = () => {
        const fileUploadInput = document.getElementById('file-upload');
        fileUploadInput.click();
    };


    //Created to load script by passing the required script and append in head tag
    const loadScript = (src) => {
        return new Promise((onFulfilled, _) => {
            const script = document.createElement('script');
            let loaded;
            script.async = 'async';
            script.defer = 'defer';
            script.setAttribute('src', src);
            script.onreadystatechange = script.onload = () => {
                if (!loaded) {
                    onFulfilled(script);
                }
                loaded = true;
            };
            script.onerror = function () {
                console.log('Script failed to load');
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        });
    };

    //Handle Upload of the video
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        console.log(file)
        const blobURL = URL.createObjectURL(file);
        console.log(blobURL)
        setVideoFileValue(file);
        console.log(videoFileValue)
        setVideoSrc(blobURL);
        setPlayerVisible(true);
    };

    //Convert the time obtained from the video to HH:MM:SS format
    const convertToHHMMSS = (val) => {
        const secNum = parseInt(val, 10);
        let hours = Math.floor(secNum / 3600);
        let minutes = Math.floor((secNum - hours * 3600) / 60);
        let seconds = secNum - hours * 3600 - minutes * 60;

        if (hours < 10) {
            hours = '0' + hours;
        }
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        let time;
        // only mm:ss
        if (hours === '00') {
            time = minutes + ':' + seconds;
        } else {
            time = hours + ':' + minutes + ':' + seconds;
        }
        return time;
    };

    useEffect(() => {
        //Load the ffmpeg script
        loadScript(
            'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.2/dist/ffmpeg.min.js',
        ).then(() => {
            if (typeof window !== 'undefined') {
                // creates a ffmpeg instance.
                ffmpeg = window.FFmpeg.createFFmpeg({ log: true });
                //Load ffmpeg.wasm-core script
                ffmpeg.load();
                //Set true that the script is loaded
                setIsScriptLoaded(true);
            }
        });
    }, []);

    //Get the duration of the video using videoRef
    useEffect(() => {
        if (videoRef && videoRef.current) {
            const currentVideo = videoRef.current;
            currentVideo.onloadedmetadata = () => {
                setVideoDuration(currentVideo.duration);
                setEndTime(currentVideo.duration);
            };
        }
    }, [videoSrc]);

    //Called when handle of the nouislider is being dragged
    const updateOnSliderChange = (values, handle) => {
        setVideoTrimmedUrl('');
        setaudioTrimmedUrl('');
        setResultVisible(false);
        let readValue;
        if (handle) {
            readValue = values[handle] | 0;
            if (endTime !== readValue) {
                setEndTime(readValue);
            }
        } else {
            readValue = values[handle] | 0;
            if (initialSliderValue !== readValue) {
                initialSliderValue = readValue;
                if (videoRef && videoRef.current) {
                    videoRef.current.currentTime = readValue;
                    setStartTime(readValue);
                }
            }
        }
    };

    //Play the video when the button is clicked
    const handlePlay = () => {
        if (videoRef && videoRef.current) {
            videoRef.current.play();
        }
    };

    //Pause the video when then the endTime matches the currentTime of the playing video
    const handlePauseVideo = (e) => {
        const currentTime = Math.floor(e.currentTarget.currentTime);

        if (currentTime === endTime) {
            e.currentTarget.pause();
        }
    };

    //Trim functionality of the video
    const handleTrim = async () => {
        if (isScriptLoaded) {
            const { name, type } = videoFileValue;
            console.log("here---", videoFileValue)
            //Write video to memory
            ffmpeg.FS(
                'writeFile',
                name,
                await window.FFmpeg.fetchFile(videoFileValue),
            );
            const videoFileType = type.split('/')[1];
            //Run the ffmpeg command to trim video
            await ffmpeg.run(
                '-i',
                name,
                '-ss',
                `${convertToHHMMSS(startTime)}`,
                '-to',
                `${convertToHHMMSS(endTime)}`,
                '-acodec',
                'copy',
                '-vcodec',
                'copy',
                `out.${videoFileType}`,
            );

            //Run the ffmpeg command to extract audio
            // await ffmpeg.run("-i", `out.${videoFileType}`, "-vn", "-acodec", "copy", "out.aac");
            await ffmpeg.run("-i", `out.${videoFileType}`, "-q:a", "0", "-map", "a", "out.mp3");

            //Convert data to url and store in videoTrimmedUrl state
            // const data = ffmpeg.FS('readFile', `out.${videoFileType}`);

            const audio = ffmpeg.FS("readFile", "out.mp3");

            // const url = URL.createObjectURL(
            //     new Blob([data.buffer], { type: videoFileValue.type }),
            // );

            const blobUrl = URL.createObjectURL(
                new Blob([audio.buffer], { type: "audio/mpeg" })
            );

            // saveAs(new Blob([audio.buffer], { type: "audio/mpeg" }), `trimmed_audio.wav`);
            // setVideoTrimmedUrl(url);
            setaudioTrimmedUrl(blobUrl)


            const audioFile = new File([audio], 'output.mp3')
            const formData = new FormData();
            formData.append(
                "myFile",
                audioFile,
                audioFile.name
            );

            axios.post("https://api.waitwhatsong.com/upload", formData)
                .then(response => {
                    console.log(response.data);
                    if (response.data == '') {
                        alert("We can't find the music info from the audio")
                    } else {
                        console.log(response.data)
                        setResult(response.data);
                        setResultVisible(true);
                    };

                })
                .catch(error => {
                    console.log(error);
                });


        }
    };

    return (
        <div>

            {!isPlayerVisible && (<button className='flex h-[53px] py-4 px-5 gap-[10px] rounded-lg border-2 items-center border-white' onClick={handleuploadClick}>
                <Upload />
                <p className='text-white font-roboto text-sm'>Upload a Video</p>
                <input id="file-upload" type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </button>
            )}
            <br />
            {videoSrc.length ? (
                <div className='flex-col'>
                    <div className='flex flex-col items-center'>
                        <video className='md:w-[640px] w-5/6' src={videoSrc} ref={videoRef} onTimeUpdate={handlePauseVideo}>
                            <source src={videoSrc} type={videoFileValue.type} />
                        </video>
                        <br />
                        <Nouislider
                            className='md:w-[640px] w-5/6'
                            behaviour="tap-drag"
                            step={1}
                            margin={3}
                            limit={1000}
                            range={{ min: 0, max: videoDuration || 2 }}
                            start={[0, videoDuration || 2]}
                            connect
                            onUpdate={updateOnSliderChange}
                        />

                        <p className='text-white text-center font-roboto text-base font-medium leading-normal pt-3'>
                            Start duration: {convertToHHMMSS(startTime)} &nbsp; End duration:{' '}
                            {convertToHHMMSS(endTime)}
                        </p>
                    </div>


                    <br />
                    <div className='flex justify-end space-x-3 mr-8'>

                        <button className='flex p-4 items-center space-x-3 bg-white bg-opacity-30 rounded-lg' onClick={handlePlay}>
                            <Logo width={17} height={18} fill={"white"} />
                            <p className='text-white text-center font-roboto text-base font-medium leading-5'>Play</p>
                        </button>


                        <button className='flex p-4 items-center space-x-3 bg-white bg-opacity-30 rounded-lg' onClick={handleTrim}>
                            <Logo width={17} height={18} fill={"white"} />
                            <p className='text-white text-center font-roboto text-base font-medium leading-5'>Trim and Find Music</p>
                        </button>

                    </div>
                    <br />
                    {/* {videoTrimmedUrl && (
                        <video className='md:w-[640px] sm:w-full' controls>
                            <source src={videoTrimmedUrl} type={videoFileValue.type} />
                        </video>
                    )} */}
                    <br />
                    <div className='flex flex-col items-center'>

                        {audioTrimmedUrl && (
                            <audio className='md:w-[640px] w-5/6' controls>
                                <source src={audioTrimmedUrl} type="audio/mpeg" />
                            </audio>

                        )}
                    </div>
                    {resultVisible && (
                        <div className='flex flex-col gap-8 md:w-[640px] w-5/6 mt-10'>
                            <p className='font-roboto text-xl  text-white leading-21 tracking-normal pl-8 md:pl-0'>Results:</p>
                            <div className='flex flex-col md:flex-row gap-5 md:gap-28 pl-8 md:pl-0'>
                                <div className='flex flex-row md:flex-col gap-8 md:gap-2'>
                                    <div className='w-[124px]'>
                                        <img className='w-[124px]  rounded-md' src={result.image}></img>
                                        <p className='font-roboto text-lg leading-21 font-medium text-white tracking-normal text-center'>{result.title}</p>
                                    </div>
                                    <div className='md:w-[124px]'>
                                        <p className='font-roboto text-base md:text-xs leading-21  text-white tracking-normal text-start'>Artist: {result.artist}</p>
                                        <p className='font-roboto text-base md:text-xs leading-21  text-white tracking-normal text-start'>Album: {result.album}</p>
                                        <p className='font-roboto text-base md:text-xs leading-21  text-white tracking-normal text-start'>Song_link: <a href={result.song_link}><u>{result.song_link}</u></a></p>
                                    </div>
                                </div>
                                <div className='flex-col'>
                                    <p className='font-roboto text-xl leading-21  text-white tracking-normal text-start'>Lyrics</p>
                                    <div className='h-[400px] mt-7 overflow-y-auto whitespace-pre-wrap'>
                                        <p className='font-roboto text-lg leading-21  text-white tracking-normal text-start'>{result.lyrics}</p>
                                    </div>
                                    <br />

                                </div>
                            </div>
                        </div>

                    )}

                </div>
            ) : (
                ''
            )}
        </div>
    );
}

export default Trim;
