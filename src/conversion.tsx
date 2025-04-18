import { useState, ChangeEvent, useContext, useEffect } from 'react';
// takes javascript and talks to backend
import axios from 'axios';
// csv to javascript
import Papa from 'papaparse';
import { AuthContext } from './contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { useLocation } from 'react-router-dom';

// describes shape of single row in csv(typescript expectation)
interface VocabPair {
  English: string;
  Vietnamese: string;
}

interface DecodedToken {
  sub: string;
  exp: number;
}

const Conversion = () => {
  const location = useLocation()
  const listToEdit = location.state?.listToEdit;
  const { token } = useContext(AuthContext)!;
  // state variable that holds the file. setFile function. State can be either file or null
  const [file, setFile] = useState<File | null>(null);
  // boolean state variable, setIsLoading function, preset as false - typescript infers boolean type because of false 
  const [isLoading, setIsLoading] = useState(false);
  const [vocabList, setVocabList] = useState<VocabPair[]>([
    {English: '', Vietnamese: ''},
    {English: '', Vietnamese: ''},
    {English: '', Vietnamese: ''},
    {English: '', Vietnamese: ''}
  ]);
  const [listName, setListName] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      try{
        const decoded: DecodedToken = jwtDecode(token);
        console.log('Decoded Token:', decoded);
        setCurrentUser(decoded.sub);
      } catch(error) {
        console.error('Failed to decode token', error);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (listToEdit) {
      setListName(listToEdit.name);
      setVocabList(listToEdit.vocab_data);
      setEditingListId(listToEdit.id)
    }
  }, [listToEdit])
 


  //file input handler 
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile)

    if (!selectedFile) return;

    Papa.parse<VocabPair>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data.map((row) => ({
            English: row.English?.trim() || '',
            Vietnamese: row.Vietnamese?.trim() || '',
          }));

          setVocabList(parsedData);
        },
        error: () => {
            alert('Failed to parse csv file.');
        }
    });
};

const handleInputChange = (index: number, field: keyof VocabPair, value: string) => {
    const updatedList = [...vocabList];
    updatedList[index][field] = value;
    setVocabList(updatedList);
}

const addRow = () => {
    setVocabList([...vocabList, {English: '', Vietnamese: ''}]);
};

const handleDeleteRow = (index: number) => {
    const updatedList = [...vocabList];
    updatedList.splice(index, 1)
    setVocabList(updatedList);
};

    
  const handleSubmit = async () => {
    if (vocabList.length === 0) {
        alert('Please upload a vocab list!')
        return;
    }

    setIsLoading(true);
  
        try {
          const response = await axios.post(
            'http://127.0.0.1:5000/generate-audio',
            {vocab: vocabList},
            {responseType: "blob",
              withCredentials: true
            }, //binary audio file
          );
          
          //simulation clicking a link to trigger the download of vocab_audio.mp3
          const blob = new Blob([response.data], {type: 'audio/mpeg'});
          const url = window.URL.createObjectURL(blob); //temp url for audio file
          const link = document.createElement('a'); 
          link.href = url;
          link.setAttribute('download', 'vocab_audio.mp3');
          document.body.appendChild(link);
          link.click()
          link.remove()
  
        } catch (error) {
          console.error('Error generating audio:', error);
          alert('Error generating audio. Check console for details.');
        } finally {
          setIsLoading(false);
        }
  };

  const handleSaveList = async () => {
    if (!token) {
      alert('You must be logged in to save lists');
      console.error('not logged in');
      return;
    }

    console.log("yes you are logged in");
    console.log(vocabList);

    try{
      const url = editingListId ? `http://127.0.0.1:5000/vocab-lists/${editingListId}` :
                                  'http://127.0.0.1:5000/vocab-lists';

      const method = editingListId ? 'put' : 'post';
      console.log(`trying to ${method}: ${listName}`);
      console.log('Token:', token);
      if (editingListId) {
        const response = await axios.put (
          url,
          {
            name: listName,
            vocab_data: vocabList
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        alert('Vocab list updated!');
        console.log(response.data);
      } else {
        const response = await axios.post (
          url,
          {
            name: listName,
            vocab_data: vocabList
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        alert('Vocab List created!');
        console.log(response.data);
      }
    } catch (error) {
      console.error('Error saving vocab list:', error);
      alert('Failed to save vocab list.');
    }
  };

  return (
    //what the user sees 
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
      <h1 className='text-2xl font-bold mb-4'>Upload and Edit Your Vocabulary CSV file</h1>

    <div className='mb-4'>
      {currentUser ? (
        <p className='text-green-600'>Logged in as: {currentUser}</p>
      ) : (
        <p className='text-red-600'>Not logged in</p>
      )}
    </div>

    {/*Upload Section*/}
    <div className='flex flex-col w-full max-w-3xl gap-4'>
        <input 
            type='file'
            accept='.csv'
            onChange={handleFileChange}
            // className='mb-4 border border-gray-300 p-2 rounded'
            className='border border-gray-300 p-2 rounded'
        />

      <input
      type="text"
      value={listName}
      onChange={(e) => setListName(e.target.value)}
      placeholder='Enter List Name'
      className='border p-2 rounded mb-4 w-full max-w-3xl'
      />

    {/*Vocab Form*/}
    <div className='bg-white p-4 rounded shadow-md'>
        <h2 className='text-xl font-semibold mb-2'>Edit Vocab</h2>
        {vocabList.map((pair, index) => (
                <div key={index} className='flex gap-4 mb-2 items-center'>
                    {/*Index Number */}
                    <div className='w-8 text-center front-semibold'>
                        {index + 1}
                    </div>
                    <input
                        type="text"
                        value={pair.English}
                        onChange={(e) => handleInputChange(index, 'English', e.target.value)} 
                        placeholder='English'
                        className='flex-1 border p-2 rounded'
                    />
                    <input
                    type="text"
                    value={pair.Vietnamese}
                    onChange={(e) => handleInputChange(index, 'Vietnamese', e.target.value)} 
                    placeholder='Vietnamese'
                    className='flex-1 border p-2 rounded'
                    />
                    {/*Delete button*/}
                    <button
                        onClick={()=> handleDeleteRow(index)}
                        className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600'
                    >
                        Delete
                    </button>
                </div>
        ))}
    </div>

{/*Add row and generate audio*/}
<div className='flex gap-2'>
    <button 
        onClick={addRow}
        className='px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600'
    >
        Add Row
    </button>

    <button
        onClick={handleSubmit}
        disabled={vocabList.length === 0 || isLoading}
        className={`px-4 py-2 rounded text-white ${
          isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isLoading ? 'Generating Audio...' : 'Generate Audio'}
    </button>

    <button
      onClick={handleSaveList}
      disabled={vocabList.length === 0 || !listName}
      className='px-4 py-2 rounded bg-purple-500 text-white hover:bg-purple-600 mb-4'>
        Save List
      </button>
</div>
</div>
</div>
  );
};

export default Conversion