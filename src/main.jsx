import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

function main() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

if ((window).BX24) {
  (window).BX24.init(main);
} else {
  main();
}