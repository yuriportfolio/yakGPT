import React, { useEffect, useState } from 'react';
import { ChatMessage, OpenAIStream } from '../../utils/OpenAIStream';
import { convert } from 'html-to-text';

interface Input {
  id: string;
  type: string;
  label: string;
  placeholder: string;
}

interface Module {
  id: string;
  title: string;
  description: string;
  command: string;
  icon: string;
  categories: string[];
  inputs: Input[];
  messages: ChatMessage[];
  stream?: boolean;
}

interface Props {
  url?: string;
  apiToken?: string;
  modules: Module[];
}

const OpenAIStreamModules: React.FC<Props> = ({ url, apiToken, modules }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [updatedModules, setUpdatedModules] = useState<Module[]>(modules);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        if (!url || !apiToken) {
          throw new Error('Missing required parameters');
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch the URL: ${response.statusText}`);
        }

        const html = await response.text();

        const options = {
          selectors: [
            { selector: 'img', format: 'skip' },
            { selector: 'a', format: 'skip' },
            { selector: 'footer', format: 'skip' },
            { selector: 'header', format: 'skip' },
          ],
          leadingLineBreaks: 1,
        };

        let text = convert(html, options).replace(/^\s*[\r\n]/gm, '\n');

        const modulesWithData = updatedModules.map((module) => {
          const messages = module.messages.map((message) => ({
            ...message,
            content: message.content.replace(/{scrapedContent}/g, text),
          }));

          return {
            ...module,
            messages,
          };
        });

        setIsLoading(false);
        setUpdatedModules(modulesWithData);
      } catch (e: any) {
        setIsLoading(false);
        setErrorMessage(e.message);
      }
    };

    fetchData();
  }, [url, apiToken]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return <div>Error: {errorMessage}</div>;
  }

  return (
    <>
      {updatedModules.map((module, index) => (
        <div key={module.id}>
          <h2>{module.title}</h2>
          {module.messages.map((message, messageIndex) => (
            <div key={messageIndex} className={`message ${message.role}`}>
              <p>{message.content}</p>
            </div>
          ))}
          {module.stream && (
            <OpenAIStream
              apiToken={apiToken}
              prompt={module.messages[0].content}
              onComplete={(response) => {
                const messages = JSON.parse(response).choices[0].text.split('\n').filter(Boolean);
                setUpdatedModules((prevModules) => {
                  const updatedModule = { ...prevModules[index] };
                  updatedModule.messages = [
                   
        ))}
      {module.stream && (
        <OpenAIStream
          apiToken={apiToken}
          prompt={module.messages[0].content}
          onComplete={(response) => {
            const messages = JSON.parse(response).choices[0].text.split('\n').filter(Boolean);
            setUpdatedModules((prevModules) => {
              const updatedModule = { ...prevModules[index] };
              updatedModule.messages = [
                ...updatedModule.messages.slice(0, -1),
                ...messages.map((message) => ({
                  id: `${Date.now()}-${Math.random()}`,
                  role: 'bot',
                  content: message,
                })),
              ];
              return [...prevModules.slice(0, index), updatedModule, ...prevModules.slice(index + 1)];
            });
          }}
        />
      )}
    </div>
  ))}
</>
);
};
export default OpenAIStreamModules;
