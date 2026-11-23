import 'dotenv/config';
import app from './src/app.js';
import { connectdb } from './src/config/db.js';

const port = process.env.PORT || 3001;
connectdb()

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




