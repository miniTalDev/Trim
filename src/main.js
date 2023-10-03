import React, { ChangeEvent, useState, useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil'
import Icon from './components/icon';
import Logo from './components/logo';
import Trim from './trim';
import axios from 'axios';
import logo from './components/Logo.png'; 
import { videoSrcState, videoFileState, playerVisibleState, startLoadingState } from './recoil_state';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from 'react-toastify';

function Main() {
    const [videourl, setVideoURL] = useState('');
    const [videoSrc, setVideoSrc] = useRecoilState(videoSrcState);
    const [videoFileName, setVideoFileName] = useRecoilState(videoFileState);
    const [isPlayerVisible, setPlayerVisible] = useRecoilState(playerVisibleState);
    const [startLoading, setStartLoading] = useRecoilState(startLoadingState);

    const handleClick = async () => {
        setVideoSrc('');
        console.log(videourl)
        const p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|.+\?v=)?)([\w\-]{10,12}).+$/;
        if (videourl === '') {
            toast.warn('Input field is empty');
        } else {
            // Handle the url
            if (videourl.match(p)) {
                await axios.get(`https://api.waitwhatsong.com/download-youtube-video?url=${videourl}`)
                    .then(response => {

                        const filename = response.data;
                        setVideoSrc(`https://api.waitwhatsong.com/file/${filename}`);
                        toast.success('The video was loaded successfully');
                        console.log(videoSrc);
                        setVideoFileName(filename);
                        setPlayerVisible(true); // Hide the player
                        setStartLoading(true);

                    })
                    .catch(error => {
                        console.log(error);
                    });

            } else {
                toast.warn('Please check the link');
            }
        }

    }

    const handleBackClick = () => {
        setVideoURL('');
        setPlayerVisible(false); // Show the player
        setVideoSrc('');
    }

    const handleuploadClick = () => {
        const fileUploadInput = document.getElementById('file-upload');
        fileUploadInput.click();
    };

    const handleVideoChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            console.log(48327273)
            const file = event.target.files[0];
            const reader = new FileReader();
            console.log(file);
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setPlayerVisible(true);
        }
    };
    const LogoClick = () => {
        window.location.reload();
    }

    return (

        <div className='flex flex-col'>
            {/* Header part */}
            <ToastContainer />
            <div className="bg-white px-14 py-4 h-20 w-full flex justify-between border">
                {/* <Logo width={42} height={46} fill={"#1DA1F2"} /> */}
                
                <button  onClick={LogoClick}><img src={logo} alt="Logo" style={{ width: '120px', height: '50px' }} />
                    </button>
                
                <button className='bg-blue-500 rounded-lg px-4 py-3 flex gap-[15px] items-center'>
                    <p className='text-white text-sm'>English</p>
                    <Icon />
                </button>
            </div>
            {/* Main part */}
            <div className='bg-gradient-to-r from-[#00C2FD] to-[#5D95F1] flex-col'>
                {isPlayerVisible && (<button onClick={handleBackClick} className='flex gap-[7px] items-center pl-16 pt-8'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2ZM0 11C0 4.92487 4.92487 0 11 0C17.0751 0 22 4.92487 22 11C22 17.0751 17.0751 22 11 22C4.92487 22 0 17.0751 0 11Z" fill="white" />
                        <path d="M13.2436 15.06C13.3209 14.9829 13.3821 14.8914 13.424 14.7905C13.4658 14.6897 13.4873 14.5817 13.4873 14.4725C13.4873 14.3634 13.4658 14.2553 13.424 14.1545C13.3821 14.0537 13.3209 13.9621 13.2436 13.885L10.0103 10.6517L13.2436 7.41836C13.3994 7.26254 13.487 7.05121 13.487 6.83086C13.487 6.6105 13.3994 6.39917 13.2436 6.24336C13.0878 6.08754 12.8765 6.00001 12.6561 6.00001C12.4357 6.00001 12.2244 6.08754 12.0686 6.24336L8.2436 10.0684C8.16635 10.1455 8.10506 10.237 8.06324 10.3378C8.02142 10.4386 7.9999 10.5467 7.9999 10.6559C7.9999 10.765 8.02142 10.8731 8.06324 10.9739C8.10506 11.0747 8.16635 11.1663 8.2436 11.2434L12.0686 15.0684C12.3853 15.385 12.9186 15.385 13.2436 15.06Z" fill="white" />
                    </svg>
                    <div className="text-white font-roboto text-lg font-medium leading-normal ">Back</div>
                </button>)}
                <div>
                    <p className='text-white text-center font-roboto text-4xl font-bold p-4 pt-24'>Discover the Song Behind Your Favorite Youtube Videos</p>
                </div>
                <p className='text-white text-center font-roboto text-base font-medium leading-normal p-4 pt-[39px]'>Unveil the Mystery - Input an Youtube Link and Find Out the Song Title!</p>
                <div className="flex md:flex-row flex-col gap-[18px] pt-[39px] justify-center">
                    <div className="flex md:w-[647px] w-5/6 self-center">
                        <input
                            value={videourl}
                            onChange={(e) => setVideoURL(e.target.value)}
                            className="flex-grow h-[53px] pl-4 md:pl-12 bg-white rounded-l-md border border-gray-300 "
                            type="text"
                            placeholder='Paste your video link here'
                        />
                        <button
                            onClick={() => setVideoURL('')}
                            className=" bg-white bg-opacity-30 text-white px-4 py-2 rounded-r-md border border-gray-300"
                        >
                            Clear
                        </button>
                    </div>
                    <button className='w-[150px] inline-flex p-4 space-x-3 self-center items-center bg-white bg-opacity-30 rounded-lg' onClick={handleClick}>
                        <Logo width={17} height={18} fill={"white"} />
                        <p className='text-white text-center font-roboto text-base font-medium leading-5'>Find Music</p>
                    </button>
                </div>
                {!isPlayerVisible && (<div className='text-white text-center font-roboto text-lg font-medium mt-4'>Or</div>)}
                <div className='flex flex-col gap-9 justify-center items-center mt-5 mb-52'>
                    {/* {!isPlayerVisible && (<button className='flex h-[53px] py-4 px-5 gap-[10px] rounded-lg border-2 items-center border-white' onClick={handleuploadClick}>
                        <Upload />
                        <p className='text-white font-roboto text-sm'>Upload a Video</p>
                        <input id="file-upload" type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoChange} />
                    </button>)}
                    {isPlayerVisible && (
                        <div className='md:w-[800px] w-[400px]'>
                            <Player
                                playsInline
                                src={videoSrc}
                                fluid={true}
                            />
                        </div>
                    )}
                    {isPlayerVisible && (<button className='inline-flex p-4 items-center space-x-3 bg-white bg-opacity-30 rounded-lg' onClick={handleClick}>
                        <Logo width={17} height={18} fill={"white"} />
                        <p className='text-white text-center font-roboto text-base font-medium leading-5'>Trim and Find Music</p>
                    </button>
                    )} */}
                    <Trim />
                </div>
            </div>
            {/* Contact part */}
            <div className='bg-gray-200 flex md:flex-row flex-col pb-10'>
                <div className="md:w-1/2 w-full md:flex-row flex-col">
                    <div className='pl-6 md:pl-20 pt-6 md:pt-10'>
                        <Logo width={64} height={71} fill={"#1DA1F2"} />
                    </div>
                    <p className='pl-6 md:pl-20 pt-3 md:pt-5 text-gray-600 font-roboto text-sm md:text-base font-normal leading-5'>Discover the Song Behind Your Favorite Youtube Videos</p>
                </div>
                <div className='md:w-1/2 w-full flex flex-col md:flex-row'>
                    <div className='w-full md:w-1/4 pl-6 md:pl-20 pt-6 md:pt-14'>
                        <p className='text-gray-600 font-roboto text-sm md:text-base font-semibold leading-5 capitalize'>Company</p>
                        <p className='pt-1 text-gray-700 font-roboto text-sm md:text-base font-normal leading-5 opacity-60'>Contact Us</p>
                    </div>
                    <div className='w-full md:w-3/4 pl-6 md:pl-40 pt-6 md:pt-14'>
                        <p className='text-gray-600 font-roboto text-sm md:text-base font-semibold leading-5 capitalize'>Resources</p>
                        <p className='pt-1 text-gray-700 font-roboto text-sm md:text-base font-normal leading-5 opacity-60'>Privacy Policy</p>
                        <p className='pt-1 text-gray-700 font-roboto text-sm md:text-base font-normal leading-5 opacity-60'>Terms and Conditions</p>
                    </div>
                </div>
            </div>
            {/* Footer part */}
            <div className='h-[40px] flex-shrink-0 border justify-center border-gray-300 bg-white'>
                <p className="pt-3 text-gray-700 text-center font-roboto text-xs font-normal leading-normal">©2023 Music. All Rights Reserved.</p>
            </div>
        </div>
    );
}

export default Main;