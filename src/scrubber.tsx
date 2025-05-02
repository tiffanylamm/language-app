import { useState, useRef, ChangeEvent, useContext, useEffect } from 'react';
// takes javascript and talks to backend
import axios from 'axios';
// csv to javascript
import Papa from 'papaparse';
import { AuthContext } from './contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { useLocation, useParams } from 'react-router-dom';

interface VocabPairWithTime {
    English: string;
    Vietnamese: string;
    start_time: number; // in milliseconds
}

const Scrubber = () => {
    const { listId } = useParams<{ listId: string }>();
    const { token } = useContext(AuthContext)!;

    const [vocabList, setVocabList] = useState<VocabPairWithTime[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioUrl, setAudioUrl] = useState('')
    const audioRef = useRef<HTMLAudioElement>(null);
    
    useEffect(() => {
        if (listId && token) {
            axios.get(`http://127.0.0.1:5000/vocab-lists/${listId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                setVocabList(res.data.vocab_data);
                setAudioUrl(`http://127.0.0.1:5000/${res.data.audio_filename}`)
            });
            }
    }, [listId, token])
    
    //setting time
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime * 1000); //converting to ms
        }
    };

    return (
        <div className='p-4 flex flex-col items-center'>
            <h1 className='text-2xl font-bold mb-4'>Scrubber View</h1>
            {audioUrl && (
                <audio
                ref={audioRef}
                controls
                onTimeUpdate={handleTimeUpdate}
                className='mb-4 w-full'
                >
                    <source src={audioUrl} type='audio/mpeg'/>
                    Your browser does not support the audio element
                </audio>
            )}

<div className='space-y-2'>
  {vocabList.map((pair, index) => {
    const next = vocabList[index + 1];
    const isActive =
      currentTime >= pair.start_time && (!next || currentTime < next.start_time);

    return (
      <div
        key={index}
        onClick={() => {
          if (
            audioRef.current &&
            typeof pair.start_time === "number" &&
            !isNaN(pair.start_time)
          ) {
            audioRef.current.currentTime = pair.start_time / 1000;
          } else {
            console.warn("Invalid Start Time:", pair.start_time);
          }
        }}
        className={`cursor-pointer flex justify-center items-center ${
          isActive ? "text-blue-500 font-bold" : ""
        }`}
      >
        {/* English - left aligned */}
        <div className="w-1/2 text-right pr-4">{pair.English}</div>

        {/* Spacer in center */}
        <div></div>

        {/* Vietnamese - right aligned */}
        <div className="w-1/2 text-left pl-4">{pair.Vietnamese}</div>
      </div>
    );
  })}
</div>

        </div>
    );
    
    
};

export default Scrubber;



