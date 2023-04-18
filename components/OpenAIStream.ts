import { useState, useEffect } from 'react';
import { ChatMessage } from './OpenAIStream.types';

interface Props {
  apiToken: string;
  prompt: string;
  onComplete: (response: string) => void;
}

const OpenAIStream: React.FC<Props> = ({ apiToken, prompt, onComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const socket = new WebSocket(`wss://api.openai.com/v1/stream?authorization=${apiToken}`);

    socket.onopen = () => {
      socket.send(JSON.stringify({ prompt }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'error') {
        setErrorMessage(data.message);
      } else if (data.type === 'message') {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: `${Date.now()}-${Math.random()}`,
            role: 'bot',
            content: data.data.text,
          },
        ]);

        if (data.data.choices) {
          onComplete(JSON.stringify(data.data));
        }
      }
    };

    socket.onerror = (error) => {
      setErrorMessage(error.message);
    };

    socket.onclose = () => {
      console.log('Socket closed');
    };

    return () => {
      socket.close();
    };
  }, [apiToken, prompt, onComplete]);

  return (
    <div>
      {errorMessage && <div>Error: {errorMessage}</div>}
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.role}`}>
          <p>{message.content}</p>
        </div>
      ))}
    </div>
  );
};

export default OpenAIStream;
