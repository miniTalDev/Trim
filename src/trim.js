import React, { useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil'
import Nouislider from 'nouislider-react';
import 'nouislider/distribute/nouislider.css';
import Upload from './components/upload';
import Logo from './components/logo';
import axios from 'axios';
import Icon from './components/icon';
import { saveAs } from 'file-saver';
import { videoSrcState, videoFileState, playerVisibleState, startLoadingState } from './recoil_state';
import './App.css';
import { toast } from 'react-toastify';
import "./colorpicker.css";

let ffmpeg; //Store the ffmpeg instance
function Trim() {
    const [videoDuration, setVideoDuration] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [videoSrc, setVideoSrc] = useRecoilState(videoSrcState);
    const [videoFileValue, setVideoFileValue] = useRecoilState(videoFileState);
    const [isPlayerVisible, setPlayerVisible] = useRecoilState(playerVisibleState);
    const [loading, setLoading] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [videoTrimmedUrl, setVideoTrimmedUrl] = useState('');
    const [audioTrimmedUrl, setaudioTrimmedUrl] = useState('');
    const [result, setResult] = useState(Object);
    const [resultVisible, setResultVisible] = useState(false)
    const [startLoading, setStartLoading] = useRecoilState(startLoadingState);
    const [trimlen, setTrimLen] = useState(15);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const handleCollapClick = () => {
        setIsCollapsed(!isCollapsed);
    };

    const onChange = (event) => {
        if (Number(event.target.value) > 15) { return } else {
            setTrimLen(Number(event.target.value));
        }
    };

    const videoRef = useRef();
    let initialSliderValue = 0;

    const handleuploadClick = () => {
        const fileUploadInput = document.getElementById('file-upload');
        fileUploadInput.click();

        setStartLoading(true);
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
        const blobURL = URL.createObjectURL(file);
        setVideoFileValue(file);
        setVideoSrc(blobURL);
        toast.success('The video was loaded successfully');
        setPlayerVisible(true);
    };
    useEffect(() => {
        if (startLoading) {
            handleTrim();
        }
    }, [startLoading]);

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
            'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.4/dist/ffmpeg.min.js',
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
                // setEndTime(currentVideo.duration);
                setEndTime(trimlen);
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
    useEffect(() => {
        setEndTime(startTime + trimlen);
    }, [trimlen, startTime]);

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
        if (trimlen < 5) {
            toast.warn("Trim length must be greater than 5");
        } else {
            if (isScriptLoaded) {
                const { name, type } = videoFileValue;
                console.log("here---", videoFileValue)
                setStartLoading(false);
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
                setLoading(true);
                axios.post("https://api.waitwhatsong.com/upload", formData)
                    .then(response => {
                        console.log(response.data);
                        if (response.data == '') {
                            toast.info("Sorry, I don't know this one.")
                        } else {
                            setResult(response.data);
                            setResultVisible(true);
                        };
                        setLoading(false);

                    })
                    .catch(error => {
                        console.log(error);
                        setLoading(false);
                    });


            }

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

            {videoSrc.length ? (
                <div className='flex-col'>
                    <p className='text-white text-center font-roboto text-base font-medium leading-normal p-4 pb-10'>Please select up to 15 seconds of the video so we can identify it for you!</p>

                    <div className='flex flex-col items-center'>
                        <video className='md:w-[640px] w-5/6' src={videoSrc} ref={videoRef} onTimeUpdate={handlePauseVideo}>
                            <source src={videoSrc} type={videoFileValue.type} />
                        </video>
                        <br />
                        {/* <div class="slider-styled" id="slider-round"> 

                            <Nouislider
                                className='md:w-[640px] w-5/6 '
                                style={{height:'14px'}}
                                behaviour="tap-drag"
                                step={1}
                                margin={5}
                                limit={15}
                                range={{ min: 0, max: videoDuration || 2 }}
                                start={[0, videoDuration || 2]}
                                connect
                                onUpdate={updateOnSliderChange}
                            />
                         </div> */}
                        <Nouislider
                            className='md:w-[640px] w-5/6'
                            behaviour="tap-drag"
                            step={1}

                            range={{ min: 0, max: videoDuration - trimlen || 2 }}
                            start={[0]}
                            connect
                            onUpdate={updateOnSliderChange}
                        />

                        <div className="flex flex-col space-x-4 mt-4 items-center">
                            <div className="flex flex-row">
                                <p className='text-white text-center font-roboto text-base font-medium leading-normal mt-[4.5px] mr-3'>Trim length</p>
                                <input className="border rounded" type="number" min="5" max="15" value={trimlen} onChange={onChange} />
                            </div>
                            <p className='text-white text-center font-roboto text-base font-medium leading-normal pt-3'>
                                Start duration: {convertToHHMMSS(startTime)} &nbsp; End duration:{' '}
                                {convertToHHMMSS(endTime)}
                            </p>
                        </div>



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
                    {loading ? (
                        <div className='flex flex-col items-center mt-10'>
                            <button disabled type="button" className="py-2.5 px-5 mr-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 inline-flex items-center">
                                <svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#1C64F2" />
                                </svg>
                                Searching...
                            </button>
                        </div>
                    ) : resultVisible ? (
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
                                    <div className='md:hidden border-gray-300 rounded '>
                                        <button
                                            className='bg-white bg-opacity-30 rounded-lg px-4 py-1 flex gap-[15px] items-center'
                                            onClick={handleCollapClick}
                                        >
                                            {isCollapsed && (
                                            <p className='text-white text-lg leading-21 '> Show More</p>)}
                                            {!isCollapsed && (
                                            <p className='text-white text-lg leading-21 '> Show Less</p>)}
                                            
                                        </button>

                                    </div>
                                    {!isCollapsed && (
                                        <div className='md:block' id='collapse'>
                                            <p className='font-roboto text-xl leading-21  text-white tracking-normal text-start mt-4'>Lyrics</p>
                                            <div className='md:h-[400px] mt-7 overflow-y-auto whitespace-pre-wrap'>
                                                <p className='font-roboto text-lg leading-21  text-white tracking-normal text-start'>{result.lyrics}</p>
                                            </div>
                                        </div>
                                    )}
                                    <br />

                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : (
                ''
            )}
        </div>
    );
}

export default Trim;
