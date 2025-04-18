import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface VocabPair {
    English: string;
    Vietnamese: string;
}

interface VocabListOut {
    id: number;
    name: string;
    vocab_data: VocabPair[];
    audio_filename: string;
}

const SavedLists = () => {
    const { token } = useContext(AuthContext)!;
    const [savedLists, setSavedLists] = useState<VocabListOut[]>([]);
    const [loading, setIsLoading] = useState(true);
    const navigate = useNavigate();


    useEffect (() => {
        const fetchSavedLists = async () => {
            if (!token) {
                console.error("Not logged in!");
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://127.0.0.1:5000/vocab-lists', { 
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log("Fetched Lists:", response.data);
                setSavedLists(response.data)
            } catch (error) {
                console.error("Error fetching saved lists:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavedLists();
    }, [token]);

    const handleEdit = (list: VocabListOut) => {
      navigate("/conversion", { state: {listToEdit: list}})
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
          <h1 className="text-2xl font-bold mb-4">Your Saved Vocabulary Lists</h1>
    
          {loading ? (
            <p>Loading...</p>
          ) : savedLists.length === 0 ? (
            <p>No saved vocab lists found.</p>
          ) : (
            <div className="w-full max-w-4xl space-y-4">
              {savedLists.map((list) => (
                <div key={list.id} className="bg-white p-4 rounded shadow">
                  <h2 className="text-xl font-semibold mb-2">{list.name}</h2>
                  <button
                  onClick={() => handleEdit(list)}
                  className='mt-2 text-blue-600 hover:underline'
                  >
                    Edit
                  </button>
                  {list.audio_filename && (
                    <audio controls>
                      <source src={`http://127.0.0.1:5000/${list.audio_filename}`} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}

                  <ul className="list-disc pl-5">
                    {list.vocab_data.map((pair, index) => (
                      <li key={index} className="mb-1">
                        <strong>{pair.English}</strong> - {pair.Vietnamese}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

export default SavedLists;
