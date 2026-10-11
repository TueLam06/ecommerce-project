import { authFetch } from "./http";

export const sendChatMessage = (message, history) =>
    authFetch("/api/chat", { method: "POST", body: { message, history } });
