import { useState, useEffect } from 'react'
import './App.css'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
type Quote = {
  id: number,
  text: string,
  author: string
}

function App() {
  const [ quote, setQuote ] = useState<Quote>();
  const [ version, setVersion ] = useState<string>('');

  useEffect(() => {
    const getVersion = async () => {
      try {
        const result = await fetch(apiUrl);
        const data = await result.json();

        setVersion(data.version)
        setQuote(data.quote)

      } catch (e) {
        console.error("Could not get version. ", e)
      }
    };

    getVersion();
  }, []);

  return (
    <>
      <h1>Quote App</h1>
      { quote  &&       <div><i>{quote.text}</i></div>
      }

      <footer>version: {version}</footer>
    </>
  )
}

export default App
