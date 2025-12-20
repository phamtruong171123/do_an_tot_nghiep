import { app } from "./app";
import { bootPresenceSweep } from "./bootstrap/presenceSweep";
import { initChatSocket } from "./modules/chat/chat.socket";
import { bootCustomerSegmentSweep } from "./bootstrap/customerSegmentSweep";

bootPresenceSweep();
bootCustomerSegmentSweep();

console.log("Starting server...");
const PORT = Number(process.env.PORT ?? 4000);
initChatSocket(app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`)));
