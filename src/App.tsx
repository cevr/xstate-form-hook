import React from "react";

import Login from "./components/Login";
import { server } from "./mocks/web";

function App() {
  // starts the service worker that will intercept our login graphql request
  React.useEffect(() => {
    server.start();
    return server.stop;
  }, []);

  return <Login />;
}

export default App;
