import React, { useState, useRef , useEffect} from 'react';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [message, setMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const [audioList, setAudioList] = useState([]); // 音声データのリスト

  useEffect(() => {
    // 音声データを取得
    fetch('http://localhost:8000/api/list-audio/')
      .then((response) => response.json())
      .then((data) =>{
        console.log(data);
        setAudioList(data)})
      .catch((error) => console.error('Error fetching audio list:', error));
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
        setMessage('Recording complete.');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessage('Error accessing microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
      setMessage('No audio to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('title', 'Recorded Audio');

    try {
      const response = await fetch('http://localhost:8000/api/upload-audio/', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Audio uploaded successfully: ' + data.file_id);
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      setMessage('Error uploading audio.');
    }
  };

  return (
    <div>
      <h1>Voice Recorder</h1>
      {!isRecording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording}>Stop Recording</button>
      )}
      {audioBlob && (
        <div>
          <p>Recording ready to upload or play.</p>
          <button onClick={uploadAudio}>Upload Recording</button>
          <audio controls src={audioURL}></audio>
        </div>
      )}
      <p>{message}</p>
      <h2>Saved Audio Files</h2>
      <ul>
        {audioList.map((audio) => (
          <li key={audio.id}>
            <p>{audio.title}</p>
            <audio controls src={`http://localhost:8000/media/${audio.file}`}></audio>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;