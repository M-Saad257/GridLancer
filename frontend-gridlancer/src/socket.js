import { io } from "socket.io-client";

const socket = io("https://gridlancer-production.up.railway.app");

export default socket;
