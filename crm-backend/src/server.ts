import { app } from './app';
import { bootPresenceSweep } from './bootstrap/presenceSweep';

bootPresenceSweep();

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));
