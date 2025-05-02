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
                {/* Flex row: name on left, buttons on right */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl">{list.name}</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleEdit(list)}
                      className="text-black-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => navigate(`/scrubber/${list.id}`)}
                      className="text-black-600 hover:underline"
                    >
                      Play Audio
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          )}
        </div>
      );
    };

export default SavedLists;
