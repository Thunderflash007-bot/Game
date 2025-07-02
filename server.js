const express = require('express');
const app = express();
const PORT = 4111;

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
