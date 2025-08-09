import {
  useEffect,
  createContext,
  useContext,
  PropsWithChildren,
  useState,
  useMemo,
} from "react";
import io, { Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
}

export const SocketContext = createContext<SocketContextType>({ socket: null });

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: PropsWithChildren) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io({
      transports: ["websocket"],
      auth: {
        token: "1",
      },
    });

    s.on("connect", () => {});
    s.on("disconnect", () => {});

    setSocket(s);

    return () => {
      s.off("connect");
      s.off("disconnect");
      s.disconnect();
    };
  }, []);

  const value = useMemo(() => ({ socket }), [socket]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}
